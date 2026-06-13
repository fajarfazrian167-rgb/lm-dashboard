// ===== SESSION CACHE — fetch sekali, semua halaman pakai =====
var LM_CACHE_PERUM = 'lm_perum_v1';
var LM_CACHE_APT   = 'lm_apt_v1';
var LM_CACHE_TS    = 'lm_ts_v1';
var LM_CACHE_TTL   = 5 * 60 * 1000; // 5 menit

function saveCache(perum, apt) {
  try {
    sessionStorage.setItem(LM_CACHE_PERUM, JSON.stringify(perum));
    sessionStorage.setItem(LM_CACHE_APT,   JSON.stringify(apt || []));
    sessionStorage.setItem(LM_CACHE_TS,    String(Date.now()));
  } catch(e) { console.warn('Cache save failed', e); }
}

function loadCache() {
  try {
    var ts = Number(sessionStorage.getItem(LM_CACHE_TS) || '0');
    if (!ts || Date.now() - ts > LM_CACHE_TTL) return null;
    var perum = JSON.parse(sessionStorage.getItem(LM_CACHE_PERUM) || 'null');
    if (!perum) return null;
    var apt = JSON.parse(sessionStorage.getItem(LM_CACHE_APT) || '[]');
    return { perum: perum, apt: apt, ts: ts };
  } catch(e) { return null; }
}

function clearCache() {
  try {
    sessionStorage.removeItem(LM_CACHE_PERUM);
    sessionStorage.removeItem(LM_CACHE_APT);
    sessionStorage.removeItem(LM_CACHE_TS);
  } catch(e) {}
}

function forceRefresh() {
  clearCache();
  return loadAllData();
}

// ================================================
// DATA MODULE v10 — Complete metrics
// ================================================

let RAW_ROWS=[], RAW_APT=[], RAW_PERUM=[], FILTERED_ROWS=null;

// ===== FETCH =====
async function fetchSheet(sheetName) {
  const url=`https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res=await fetch(url);
  const text=await res.text();
  const json=JSON.parse(text.substring(47,text.length-2));
  if(!json.table||!json.table.rows) return [];
  return json.table.rows.map(row=>(row.c||[]).map(cell=>{
    if(!cell) return null;
    if(typeof cell.v==='string'&&cell.v.startsWith('Date(')){
      const p=cell.v.slice(5,-1).split(',').map(Number);
      return new Date(p[0],p[1],p[2]).toLocaleDateString('id-ID');
    }
    return cell.v??null;
  }));
}

async function loadAllData() {
  showLoading(true);
  try {
    if (CONFIG.DEMO_MODE) {
      RAW_PERUM = generateDemo();
      RAW_APT   = [];
      setSyncStatus('ok', 'Demo Mode');
    } else {
      // Cek cache dulu — jika masih valid, pakai langsung (cepat!)
      var cached = loadCache();
      if (cached) {
        RAW_PERUM = cached.perum;
        RAW_APT   = cached.apt;
        var age = Math.round((Date.now() - cached.ts) / 1000);
        setSyncStatus('ok', 'Cache ' + age + 'd lalu · ' + (RAW_PERUM.length + RAW_APT.length) + ' baris');
      } else {
        // Fetch dari Google Sheets
        setSyncStatus('loading', 'Mengambil data...');
        var rows = await fetchSheet(CONFIG.SHEET_NAME);
        RAW_PERUM = rows.slice(1).filter(function(r){ return r && r[COL.OUTLET]; });
        RAW_APT   = [];
        if (CONFIG.SHEET_APARTEMEN && CONFIG.SHEET_APARTEMEN.trim()) {
          try {
            var rows2 = await fetchSheet(CONFIG.SHEET_APARTEMEN);
            RAW_APT = rows2.slice(1).filter(function(r){ return r && r[COL.OUTLET]; });
          } catch(e2) { RAW_APT = []; }
        }
        saveCache(RAW_PERUM, RAW_APT);
        setSyncStatus('ok', 'Synced ' + new Date().toLocaleTimeString('id-ID') + ' · ' + (RAW_PERUM.length + RAW_APT.length) + ' baris');
      }
    }
    updateActiveRows();
    FILTERED_ROWS = null;
    populateFilters();
    if (typeof renderPage === 'function') renderPage();
  } catch(err) {
    console.error('loadAllData error:', err);
    setSyncStatus('err', 'Gagal — cek share spreadsheet');
    if (!RAW_PERUM.length) { RAW_PERUM = generateDemo(); RAW_APT = []; }
    updateActiveRows();
    if (typeof renderPage === 'function') renderPage();
  }
  showLoading(false);
}

function startAutoRefresh() {
  if (!CONFIG.REFRESH_INTERVAL) return;
  setInterval(function() { clearCache(); loadAllData(); }, CONFIG.REFRESH_INTERVAL);
}



function updateActiveRows() {
  const src=typeof ACTIVE_SOURCE!=='undefined'?ACTIVE_SOURCE:'ALL';
  if(src==='APT') RAW_ROWS=RAW_APT.length?RAW_APT:[];
  else if(src==='PERUM') RAW_ROWS=RAW_PERUM;
  else RAW_ROWS=[...RAW_PERUM,...RAW_APT];
}

function getRows(){ return FILTERED_ROWS!==null?FILTERED_ROWS:RAW_ROWS; }

// ===== FILTERS =====
function populateFilters() {
  const rows=RAW_ROWS;
  const unique=col=>[...new Set(rows.map(r=>r[col]).filter(Boolean))].sort();
  fillSel('fRegion',unique(COL.REGION),'Semua GRSM');
  fillSel('fArea',unique(COL.AREA),'Semua Area');
  fillSel('fOutlet',unique(COL.OUTLET),'Semua Outlet');
  fillSel('fRSM',unique(COL.RSM),'Semua RSM');
  fillSel('fTL',unique(COL.TL),'Semua TL');
  fillSel('fMPP',unique(COL.MPP),'Semua MPP');
  fillSel('fPeriode',unique(COL.PERIODE),'Semua Periode');
  fillSel('fProduk',unique(COL.PRODUCT),'Semua Produk');
  fillSel('fStatus',unique(COL.STATUS_STORE),'Semua Status');
}
function fillSel(id,vals,ph){const el=document.getElementById(id);if(!el)return;el.innerHTML=`<option value="">${ph}</option>`+vals.map(v=>`<option value="${v}">${v}</option>`).join('');}
function applyFilters(){
  updateActiveRows();
  const v=id=>{const el=document.getElementById(id);return el?el.value:'';};
  FILTERED_ROWS=RAW_ROWS.filter(r=>{
    if(v('fRegion')&&r[COL.REGION]!==v('fRegion')) return false;
    if(v('fArea')&&r[COL.AREA]!==v('fArea')) return false;
    if(v('fOutlet')&&r[COL.OUTLET]!==v('fOutlet')) return false;
    if(v('fRSM')&&r[COL.RSM]!==v('fRSM')) return false;
    if(v('fTL')&&r[COL.TL]!==v('fTL')) return false;
    if(v('fMPP')&&r[COL.MPP]!==v('fMPP')) return false;
    if(v('fPeriode')&&r[COL.PERIODE]!==v('fPeriode')) return false;
    if(v('fProduk')&&r[COL.PRODUCT]!==v('fProduk')) return false;
    if(v('fStatus')&&r[COL.STATUS_STORE]!==v('fStatus')) return false;
    return true;
  });
  if(typeof renderPage==='function') renderPage();
}
function resetFilters(){
  ['fRegion','fArea','fOutlet','fRSM','fTL','fMPP','fPeriode','fProduk','fStatus'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ACTIVE_SOURCE='ALL';
  FILTERED_ROWS=null; updateActiveRows(); populateFilters();
  if(typeof renderPage==='function') renderPage();
}
function setSegmen(btn,val){
  document.querySelectorAll('.filter-toggle').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ACTIVE_SOURCE=val==='APT'?'APT':val==='PERUM'?'PERUM':'ALL';
  updateActiveRows(); FILTERED_ROWS=null; populateFilters();
  if(typeof renderPage==='function') renderPage();
}

// ===== CORE METRICS =====
function computeMetrics(rows) {
  const lmR=rows.filter(r=>IS_LM(r[COL.PRODUCT]));
  const aqR=rows.filter(r=>IS_AQ(r[COL.PRODUCT]));
  const otR=rows.filter(r=>IS_OT(r[COL.PRODUCT]));
  const cbR=rows.filter(r=>IS_CHATBOT(r[COL.STATUS]));
  const lmCbR=lmR.filter(r=>IS_CHATBOT(r[COL.STATUS]));
  const aqCbR=aqR.filter(r=>IS_CHATBOT(r[COL.STATUS]));
  const otCbR=otR.filter(r=>IS_OT(r[COL.PRODUCT])&&IS_CHATBOT(r[COL.STATUS]));

  const sumQ=arr=>arr.reduce((s,r)=>s+(Number(r[COL.QTY])||0),0);
  const sumV=arr=>arr.reduce((s,r)=>s+(Number(r[COL.VALUE])||0),0);

  // Unique buyers = KEY_SUB (kolom AG)
  const allBS=new Set(rows.map(r=>r[COL.KEY_SUB]).filter(Boolean));
  const lmBS=new Set(lmR.map(r=>r[COL.KEY_SUB]).filter(Boolean));
  const aqBS=new Set(aqR.map(r=>r[COL.KEY_SUB]).filter(Boolean));
  const cbBS=new Set(cbR.map(r=>r[COL.KEY_SUB]).filter(Boolean));
  const lmCbBS=new Set(lmCbR.map(r=>r[COL.KEY_SUB]).filter(Boolean));

  // Outlet map — unique by COL.OUTLET, status from COL.STATUS_STORE
  const outletMap={};
  rows.forEach(r=>{
    const o=r[COL.OUTLET]; if(!o) return;
    const st=(r[COL.STATUS_STORE]||'').toUpperCase().trim();
    if(!outletMap[o]) outletMap[o]={st,supply:r[COL.SUPPLY],project:r[COL.PROJECT],region:r[COL.REGION],rsm:r[COL.RSM],program:r[COL.PROGRAM]};
    else if(st) outletMap[o].st=st;
  });
  const allOut=Object.keys(outletMap);
  const totalOutlet=allOut.length;
  const activeOutlet=allOut.filter(o=>IS_ACTIVE(outletMap[o].st)).length;
  const inactiveOutlet=totalOutlet-activeOutlet;

  // Segmen breakdown
  const aptOuts=allOut.filter(o=>IS_APT({[COL.PROJECT]:outletMap[o].project}));
  const perumOuts=allOut.filter(o=>IS_PERUM({[COL.PROJECT]:outletMap[o].project}));
  const aptActive=aptOuts.filter(o=>IS_ACTIVE(outletMap[o].st)).length;
  const aptInactive=aptOuts.length-aptActive;
  const perumActive=perumOuts.filter(o=>IS_ACTIVE(outletMap[o].st)).length;
  const perumInactive=perumOuts.length-perumActive;

  // Time Gone
  const tss=rows.map(r=>r[COL.TIMESTAMP]).filter(Boolean).map(t=>new Date(t)).filter(d=>!isNaN(d));
  const firstDate=tss.length?new Date(Math.min(...tss)):new Date();
  const timeGone=Math.floor((new Date()-firstDate)/(1000*60*60*24));

  // Repeat & Lapsers
  const repBS=new Set(rows.filter(r=>(r[COL.STATUS]||'').toUpperCase().trim()==='REPEAT').map(r=>r[COL.KEY_SUB]).filter(Boolean));
  const lastSt={};
  rows.forEach(r=>{const k=r[COL.KEY_SUB];if(!k)return;const ts=new Date(r[COL.TIMESTAMP]||0);if(!lastSt[k]||ts>lastSt[k].ts)lastSt[k]={ts,st:r[COL.STATUS]};});
  const lapsers=[...cbBS].filter(k=>{const l=lastSt[k];return l&&(l.st||'').toUpperCase()==='MANUAL';}).length;

  // Switch to LM
  const switchLM=[...allBS].filter(k=>{const br=rows.filter(r=>r[COL.KEY_SUB]===k);return br.some(r=>IS_LM(r[COL.PRODUCT]))&&br.some(r=>!IS_LM(r[COL.PRODUCT]));}).length;

  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const tQ=sumQ(rows),lmQ=sumQ(lmR),aqQ=sumQ(aqR),otQ=sumQ(otR),cbQ=sumQ(cbR),lmCbQ=sumQ(lmCbR);
  const tT=rows.length,lmT=lmR.length,aqT=aqR.length,cbT=cbR.length,lmCbT=lmCbR.length;
  const tB=allBS.size,lmB=lmBS.size,aqB=aqBS.size,cbB=cbBS.size,lmCbB=lmCbBS.size;

  return {
    totalOutlet,activeOutlet,inactiveOutlet,
    aptOutlet:aptOuts.length,perumOutlet:perumOuts.length,
    aptActive,aptInactive,perumActive,perumInactive,timeGone,
    // Outlet lists for popup
    outletMap,aptOuts,perumOuts,
    totalQty:tQ,lmQty:lmQ,aqQty:aqQ,otQty:otQ,cbQty:cbQ,lmCbQty:lmCbQ,
    pctLmQty:pct(lmQ,tQ),pctCbQty:pct(cbQ,tQ),pctLmCbQty:pct(lmCbQ,cbQ),
    totalValue:sumV(rows),lmValue:sumV(lmR),
    totalTrx:tT,lmTrx:lmT,aqTrx:aqT,cbTrx:cbT,lmCbTrx:lmCbT,
    pctLmTrx:pct(lmT,tT),pctCbTrx:pct(cbT,tT),pctLmCbTrx:pct(lmCbT,cbT),
    totalBuyers:tB,lmBuyers:lmB,aqBuyers:aqB,cbBuyers:cbB,lmCbBuyers:lmCbB,
    pctLmBuyers:pct(lmB,tB),pctCbBuyers:pct(cbB,tB),pctLmCbBuyers:pct(lmCbB,cbB),
    repeatBuyers:repBS.size,lapsers,switchingToLM:switchLM,
    unitShare:[lmQ,aqQ,otQ],buyerShare:[lmB,aqB,tB-lmB-aqB],trxShare:[lmT,aqT,tT-lmT-aqT],
    cbUnitShare:[lmCbQ,sumQ(aqCbR),sumQ(otCbR)],
    cbBuyerShare:[lmCbB,new Set(aqCbR.map(r=>r[COL.KEY_SUB]).filter(Boolean)).size,0],
    cbTrxShare:[lmCbT,aqCbR.length,otCbR.length],
  };
}

// ===== OUTLET LIST for popup =====
function getOutletList(rows, filterFn) {
  const map={};
  rows.forEach(r=>{
    const o=r[COL.OUTLET]; if(!o) return;
    if(!map[o]) map[o]={outlet:o,region:r[COL.REGION],area:r[COL.AREA],rsm:r[COL.RSM],tl:r[COL.TL],program:r[COL.PROGRAM],statusStore:(r[COL.STATUS_STORE]||'').toUpperCase().trim(),project:r[COL.PROJECT]};
    else{const st=(r[COL.STATUS_STORE]||'').toUpperCase().trim();if(st)map[o].statusStore=st;}
  });
  return Object.values(map).filter(filterFn||(_=>true)).sort((a,b)=>a.outlet.localeCompare(b.outlet));
}

// ===== PER OUTLET STATS (for Store page) =====
function getOutletStats(rows) {
  const map={};
  const weekKeys=[...new Set(rows.map(r=>r[COL.PERIODE]).filter(Boolean))].sort((a,b)=>Number(a.replace(/\D/g,''))-Number(b.replace(/\D/g,'')));
  const lastWeek=weekKeys[weekKeys.length-2]||'';
  const thisWeek=weekKeys[weekKeys.length-1]||'';

  rows.forEach(r=>{
    const key=r[COL.OUTLET]; if(!key) return;
    if(!map[key]){map[key]={
      outlet:r[COL.OUTLET],area:r[COL.AREA],region:r[COL.REGION],coverage:r[COL.COVERAGE],
      segmen:r[COL.SEGMEN],mpp:r[COL.MPP],tl:r[COL.TL],rsm:r[COL.RSM],program:r[COL.PROGRAM],
      statusStore:(r[COL.STATUS_STORE]||'').toUpperCase().trim(),project:r[COL.PROJECT],
      buyers:new Set(),cbBuyers:new Set(),lmBuyers:new Set(),repBuyers:new Set(),switchBuyers:new Set(),
      totalTrx:0,cbTrx:0,lmTrx:0,lmCbTrx:0,
      totalQty:0,lmQty:0,cbQty:0,lmCbQty:0,
      totalValue:0,activeDays:new Set(),firstDate:null,
      weeks:{},allProducts:new Set(),
    };}
    const o=map[key];
    const newSt=(r[COL.STATUS_STORE]||'').toUpperCase().trim(); if(newSt) o.statusStore=newSt;
    const cKey=r[COL.KEY_SUB]||r[COL.CUSTOMER_NAME];
    const qty=Number(r[COL.QTY])||0;
    const isCb=IS_CHATBOT(r[COL.STATUS]);
    const isLM=IS_LM(r[COL.PRODUCT]);
    const isAQ=IS_AQ(r[COL.PRODUCT]);

    o.buyers.add(cKey);
    if(isCb) o.cbBuyers.add(cKey);
    if(isLM) o.lmBuyers.add(cKey);
    if((r[COL.STATUS]||'').toUpperCase().trim()==='REPEAT') o.repBuyers.add(cKey);
    o.allProducts.add(r[COL.PRODUCT]);

    o.totalTrx++; if(isCb) o.cbTrx++; if(isLM) o.lmTrx++; if(isLM&&isCb) o.lmCbTrx++;
    o.totalQty+=qty; if(isLM) o.lmQty+=qty; if(isCb){o.cbQty+=qty; if(isLM) o.lmCbQty+=qty;}
    o.totalValue+=(Number(r[COL.VALUE])||0);
    const ts=r[COL.TIMESTAMP]; if(ts){o.activeDays.add(ts.split(' ')[0]||ts);const d=new Date(ts);if(!isNaN(d)&&(!o.firstDate||d<o.firstDate))o.firstDate=d;}
    const w=r[COL.PERIODE]||'';
    if(w){if(!o.weeks[w])o.weeks[w]={trx:0,cbTrx:0};o.weeks[w].trx++;if(isCb)o.weeks[w].cbTrx++;}
  });

  // Switch to LM — buyer yang punya history LM + produk lain
  const buyerProducts={};
  rows.forEach(r=>{const k=r[COL.KEY_SUB]||r[COL.CUSTOMER_NAME];const o=r[COL.OUTLET];if(!k||!o)return;const key2=`${o}|${k}`;if(!buyerProducts[key2])buyerProducts[key2]={lm:false,other:false,outlet:o};if(IS_LM(r[COL.PRODUCT]))buyerProducts[key2].lm=true;else buyerProducts[key2].other=true;});
  Object.values(buyerProducts).forEach(b=>{if(b.lm&&b.other&&map[b.outlet])map[b.outlet].switchBuyers.add(b.outlet+'_switch');});

  const msDB=getMSBeforeDB();

  return Object.values(map).map(o=>{
    const hk=o.activeDays.size||1;
    const timeGone=o.firstDate?Math.floor((new Date()-o.firstDate)/(1000*60*60*24)):0;
    const buyerCount=o.buyers.size,cbBuyerCount=o.cbBuyers.size,lmBuyerCount=o.lmBuyers.size;
    const pctCbTrx=o.totalTrx?Math.round(o.cbTrx/o.totalTrx*100):0;
    const trxPerDay=Number((o.totalTrx/hk).toFixed(1));
    const msBefore=msDB[o.outlet]?msDB[o.outlet].msBefore:null;
    const msAfter=o.totalQty?Math.round(o.lmQty/o.totalQty*100):0;
    const msGrowth=msBefore!==null?Math.round(msAfter-msBefore):null;
    // KPI = msGrowth / 100 (simplified)
    const kpi=msBefore!==null?(msGrowth/100).toFixed(2):null;
    // Bobot
    const scoreA=Math.min(100,Math.round(trxPerDay/10*100));
    const scoreB=pctCbTrx;
    const scoreC=buyerCount?Math.round(cbBuyerCount/buyerCount*100):0;
    const bobot=Math.round(scoreA*0.4+scoreB*0.4+scoreC*0.2);
    // vs last week
    const tw=o.weeks[thisWeek]||{trx:0,cbTrx:0};
    const lw=o.weeks[lastWeek]||{trx:0,cbTrx:0};
    return{...o,hk,timeGone,buyerCount,cbBuyerCount,lmBuyerCount,
      repBuyerCount:o.repBuyers.size,switchCount:o.switchBuyers.size,
      trxPerDay,cbTrxPerDay:Number((o.cbTrx/hk).toFixed(1)),
      lmQtyPerDay:Number((o.lmQty/hk).toFixed(1)),
      pctCbTrx,pctCbBuyer:buyerCount?Math.round(cbBuyerCount/buyerCount*100):0,
      pctLmBuyer:buyerCount?Math.round(lmBuyerCount/buyerCount*100):0,
      pctCbTrxFmt:pctCbTrx+'%',
      msBefore,msAfter,msGrowth,kpi,
      pctMsAfter:msAfter+'%',
      vsLastWeekTrx:tw.trx-lw.trx,
      bobot,
    };
  }).sort((a,b)=>b.bobot-a.bobot).map((o,i)=>({...o,rank:i+1}));
}

// ===== TL STATS =====
function getTLStats(rows) {
  const map={};
  rows.forEach(r=>{
    const tl=r[COL.TL]; if(!tl) return;
    if(!map[tl])map[tl]={tl,rsm:r[COL.RSM],mpps:{},outlets:new Set(),buyers:new Set(),cbBuyers:new Set(),lmBuyers:new Set(),repBuyers:new Set(),totalTrx:0,cbTrx:0,lmTrx:0,lmCbTrx:0,totalQty:0,lmQty:0,cbQty:0,lmCbQty:0,activeDays:new Set()};
    const t=map[tl];
    t.outlets.add(r[COL.OUTLET]);
    const bKey=r[COL.KEY_SUB]||r[COL.CUSTOMER_NAME];
    const qty=Number(r[COL.QTY])||0;
    const isCb=IS_CHATBOT(r[COL.STATUS]);const isLM=IS_LM(r[COL.PRODUCT]);
    t.buyers.add(bKey);if(isCb)t.cbBuyers.add(bKey);if(isLM)t.lmBuyers.add(bKey);
    if((r[COL.STATUS]||'').toUpperCase().trim()==='REPEAT')t.repBuyers.add(bKey);
    t.totalTrx++;if(isCb)t.cbTrx++;if(isLM)t.lmTrx++;if(isLM&&isCb)t.lmCbTrx++;
    t.totalQty+=qty;if(isLM)t.lmQty+=qty;if(isCb){t.cbQty+=qty;if(isLM)t.lmCbQty+=qty;}
    const ts=r[COL.TIMESTAMP];if(ts)t.activeDays.add(ts.split(' ')[0]||ts);
    const mpp=r[COL.MPP];
    if(mpp){
      if(!t.mpps[mpp])t.mpps[mpp]={mpp,tl,rsm:r[COL.RSM],buyers:new Set(),cbBuyers:new Set(),lmBuyers:new Set(),repBuyers:new Set(),outlets:new Set(),totalTrx:0,cbTrx:0,lmTrx:0,lmCbTrx:0,totalQty:0,lmQty:0,cbQty:0,lmCbQty:0,activeDays:new Set()};
      const m=t.mpps[mpp];
      m.outlets.add(r[COL.OUTLET]);
      m.buyers.add(bKey);if(isCb)m.cbBuyers.add(bKey);if(isLM)m.lmBuyers.add(bKey);
      if((r[COL.STATUS]||'').toUpperCase().trim()==='REPEAT')m.repBuyers.add(bKey);
      m.totalTrx++;if(isCb)m.cbTrx++;if(isLM)m.lmTrx++;if(isLM&&isCb)m.lmCbTrx++;
      m.totalQty+=qty;if(isLM)m.lmQty+=qty;if(isCb){m.cbQty+=qty;if(isLM)m.lmCbQty+=qty;}
      const ts2=r[COL.TIMESTAMP];if(ts2)m.activeDays.add(ts2.split(' ')[0]||ts2);
    }
  });

  const calc=o=>{
    const hk=o.activeDays.size||1,bC=o.buyers.size,cbBC=o.cbBuyers.size,lmBC=o.lmBuyers.size;
    const pctCb=o.totalTrx?Math.round(o.cbTrx/o.totalTrx*100):0;
    const tpd=Number((o.totalTrx/hk).toFixed(1));
    const sA=Math.min(100,Math.round(tpd/10*100)),sB=pctCb,sC=bC?Math.round(cbBC/bC*100):0;
    const bobot=Math.round(sA*0.4+sB*0.4+sC*0.2);
    const msAfter=o.totalQty?Math.round(o.lmQty/o.totalQty*100):0;
    return{hk,buyerCount:bC,cbBuyerCount:cbBC,lmBuyerCount:lmBC,repBuyerCount:o.repBuyers.size,
      outletCount:(o.outlets||new Set()).size,
      trxPerDay:tpd,pctCbTrx:pctCb,pctCbBuyer:bC?Math.round(cbBC/bC*100):0,
      pctLmBuyer:bC?Math.round(lmBC/bC*100):0,
      msAfter,bobot};
  };

  return Object.values(map).map(t=>{
    const c=calc(t);
    const mppsArr=Object.values(t.mpps).map(m=>{const mc=calc(m);return{...m,...mc};}).sort((a,b)=>b.bobot-a.bobot).map((m,i)=>({...m,rank:i+1}));
    return{...t,...c,mpps:mppsArr};
  }).sort((a,b)=>b.bobot-a.bobot);
}

// ===== CONSUMPTION =====
function getConsumption(rows) {
  const uniqMap={};
  rows.forEach(r=>{
    const key=r[COL.KEY_SUB]; if(!key) return;
    if(!uniqMap[key])uniqMap[key]={lm:false,aq:false,ot:false,hasCb:false,galon:0,waGalon:0,lmGalon:0,aqGalon:0,otGalon:0};
    const u=uniqMap[key];const qty=Number(r[COL.QTY])||0;const isCb=IS_CHATBOT(r[COL.STATUS]);
    if(IS_LM(r[COL.PRODUCT])){u.lm=true;u.galon+=qty;u.lmGalon+=qty;if(isCb){u.waGalon+=qty;u.hasCb=true;}}
    if(IS_AQ(r[COL.PRODUCT])){u.aq=true;u.galon+=qty;u.aqGalon+=qty;if(isCb){u.waGalon+=qty;u.hasCb=true;}}
    if(IS_OT(r[COL.PRODUCT])){u.ot=true;u.galon+=qty;u.otGalon+=qty;if(isCb){u.waGalon+=qty;u.hasCb=true;}}
  });
  const cats={'Solus LM':{all:0,waCust:0,galon:0,waGalon:0,lmGalon:0,aqGalon:0},'Solus AQ':{all:0,waCust:0,galon:0,waGalon:0,lmGalon:0,aqGalon:0},'Solus OT':{all:0,waCust:0,galon:0,waGalon:0,lmGalon:0,aqGalon:0},'Dualis LM & AQ':{all:0,waCust:0,galon:0,waGalon:0,lmGalon:0,aqGalon:0},'Dualis LM & OT':{all:0,waCust:0,galon:0,waGalon:0,lmGalon:0,aqGalon:0},'Dualis AQ & OT':{all:0,waCust:0,galon:0,waGalon:0,lmGalon:0,aqGalon:0},'Triple (LM,AQ,OT)':{all:0,waCust:0,galon:0,waGalon:0,lmGalon:0,aqGalon:0}};
  Object.values(uniqMap).forEach(u=>{
    let cat='';
    if(u.lm&&!u.aq&&!u.ot)cat='Solus LM';
    else if(!u.lm&&u.aq&&!u.ot)cat='Solus AQ';
    else if(!u.lm&&!u.aq&&u.ot)cat='Solus OT';
    else if(u.lm&&u.aq&&!u.ot)cat='Dualis LM & AQ';
    else if(u.lm&&!u.aq&&u.ot)cat='Dualis LM & OT';
    else if(!u.lm&&u.aq&&u.ot)cat='Dualis AQ & OT';
    else if(u.lm&&u.aq&&u.ot)cat='Triple (LM,AQ,OT)';
    if(!cat)return;
    cats[cat].all++;cats[cat].galon+=u.galon;cats[cat].waGalon+=u.waGalon;
    cats[cat].lmGalon+=u.lmGalon;cats[cat].aqGalon+=u.aqGalon;
    if(u.hasCb)cats[cat].waCust++;
  });
  // Total galon per toko untuk MS
  const totalGalon=Object.values(uniqMap).reduce((s,u)=>s+u.galon,0)||1;
  const totalLmGalon=Object.values(uniqMap).reduce((s,u)=>s+u.lmGalon,0);
  const totalAqGalon=Object.values(uniqMap).reduce((s,u)=>s+u.aqGalon,0);
  const tot=Object.values(cats).reduce((s,c)=>s+c.all,0)||1;
  return {
    cats: Object.entries(cats).map(([name,d])=>({name,...d,
      msPct:(d.all/tot*100).toFixed(1),
      waMsPct:d.all?(d.waCust/d.all*100).toFixed(1):'0.0',
      msLM:d.galon?(d.lmGalon/d.galon*100).toFixed(1):'0.0',
      msAQ:d.galon?(d.aqGalon/d.galon*100).toFixed(1):'0.0',
      pctCb:d.galon?(d.waGalon/d.galon*100).toFixed(1):'0.0',
    })),
    totalMsLM:(totalLmGalon/totalGalon*100).toFixed(1),
    totalMsAQ:(totalAqGalon/totalGalon*100).toFixed(1),
  };
}

// ===== CUSTOMER ANALYTICS (AWOP / Freq / Gallon per Trx) =====
function getCustomerAnalytics(rows, groupBy='week') {
  const MONTH_ORDER={'JAN':1,'FEB':2,'MAR':3,'APR':4,'MEI':5,'MAY':5,'JUN':6,'JUL':7,'AGS':8,'AUG':8,'SEP':9,'OKT':10,'OCT':10,'NOV':11,'DES':12,'DEC':12,'JANUARI':1,'FEBRUARI':2,'MARET':3,'APRIL':4,'JUNI':6,'JULI':7,'AGUSTUS':8,'SEPTEMBER':9,'OKTOBER':10,'NOVEMBER':11,'DESEMBER':12};
  const ID_MONTH={1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'Mei',6:'Jun',7:'Jul',8:'Ags',9:'Sep',10:'Okt',11:'Nov',12:'Des'};

  const map={};
  rows.forEach(r=>{
    let p=groupBy==='month'?((r[COL.MONTH]||'').toUpperCase().trim()+' '+(r[COL.YEAR]||'?')).trim():(r[COL.PERIODE]||'?');
    if(!map[p])map[p]={periode:p,year:r[COL.YEAR]||0,month:(r[COL.MONTH]||'').toUpperCase().trim(),
      // Per buyer tracking
      buyers:{},cbBuyers:{},lmBuyers:{},aqBuyers:{},otBuyers:{},
    };
    const t=map[p];
    const key=r[COL.KEY_SUB]||r[COL.CUSTOMER_NAME];
    const qty=Number(r[COL.QTY])||0;
    const isCb=IS_CHATBOT(r[COL.STATUS]);
    const isLM=IS_LM(r[COL.PRODUCT]);const isAQ=IS_AQ(r[COL.PRODUCT]);

    if(!t.buyers[key])t.buyers[key]={trx:0,qty:0};
    t.buyers[key].trx++;t.buyers[key].qty+=qty;

    if(isCb){if(!t.cbBuyers[key])t.cbBuyers[key]={trx:0,qty:0};t.cbBuyers[key].trx++;t.cbBuyers[key].qty+=qty;}
    if(isLM){if(!t.lmBuyers[key])t.lmBuyers[key]={trx:0,qty:0};t.lmBuyers[key].trx++;t.lmBuyers[key].qty+=qty;}
    if(isAQ){if(!t.aqBuyers[key])t.aqBuyers[key]={trx:0,qty:0};t.aqBuyers[key].trx++;t.aqBuyers[key].qty+=qty;}
    if(!isLM&&!isAQ){if(!t.otBuyers[key])t.otBuyers[key]={trx:0,qty:0};t.otBuyers[key].trx++;t.otBuyers[key].qty+=qty;}
  });

  const calcStats=buyers=>{
    const vals=Object.values(buyers);
    if(!vals.length)return{awop:0,freq:0,gpx:0,count:0};
    const totalTrx=vals.reduce((s,b)=>s+b.trx,0);
    const totalQty=vals.reduce((s,b)=>s+b.qty,0);
    const count=vals.length;
    return{
      awop:count?Number((totalQty/count).toFixed(1)):0, // avg galon per buyer per period
      freq:count?Number((totalTrx/count).toFixed(1)):0, // avg trx per buyer
      gpx:totalTrx?Number((totalQty/totalTrx).toFixed(1)):0, // galon per trx
      count,
    };
  };

  const arr=Object.values(map);
  if(groupBy==='month'){
    arr.sort((a,b)=>{const ya=Number(a.year)||0,yb=Number(b.year)||0;if(ya!==yb)return ya-yb;return(MONTH_ORDER[a.month]||99)-(MONTH_ORDER[b.month]||99);});
    arr.forEach(t=>{const idx=MONTH_ORDER[t.month]||0;t.periode=idx?ID_MONTH[idx]+' '+t.year:t.periode;});
  } else {
    arr.sort((a,b)=>Number(a.periode.replace(/\D/g,''))-Number(b.periode.replace(/\D/g,'')));
  }

  return arr.map((t,i,a)=>{
    const all=calcStats(t.buyers);
    const cb=calcStats(t.cbBuyers);
    const lm=calcStats(t.lmBuyers);
    const aq=calcStats(t.aqBuyers);
    const ot=calcStats(t.otBuyers);
    const prev=i>0?a[i-1]:null;
    const vsLW=prev?{awop_all:Number((all.awop-calcStats(prev.buyers).awop).toFixed(1)),freq_all:Number((all.freq-calcStats(prev.buyers).freq).toFixed(1)),gpx_all:Number((all.gpx-calcStats(prev.buyers).gpx).toFixed(1))}:null;
    return{periode:t.periode,all,cb,lm,aq,ot,vsLW};
  });
}

// ===== TREND =====
const MONTH_ORDER2={'JAN':1,'FEB':2,'MAR':3,'APR':4,'MEI':5,'MAY':5,'JUN':6,'JUL':7,'AGS':8,'AUG':8,'SEP':9,'OKT':10,'OCT':10,'NOV':11,'DES':12,'DEC':12,'JANUARI':1,'FEBRUARI':2,'MARET':3,'APRIL':4,'JUNI':6,'JULI':7,'AGUSTUS':8,'SEPTEMBER':9,'OKTOBER':10,'NOVEMBER':11,'DESEMBER':12};
const ID_MONTH2={1:'Januari',2:'Februari',3:'Maret',4:'April',5:'Mei',6:'Juni',7:'Juli',8:'Agustus',9:'September',10:'Oktober',11:'November',12:'Desember'};

function getTrend(rows,groupBy='week'){
  const map={};
  rows.forEach(r=>{
    const p=groupBy==='month'?((r[COL.MONTH]||'').toUpperCase().trim()+' '+(r[COL.YEAR]||'?')).trim():(r[COL.PERIODE]||'?');
    if(!map[p])map[p]={periode:p,year:r[COL.YEAR]||0,month:(r[COL.MONTH]||'').toUpperCase().trim(),totalQty:0,lmQty:0,totalTrx:0,cbTrx:0,buyers:new Set()};
    map[p].totalQty+=(Number(r[COL.QTY])||0);if(IS_LM(r[COL.PRODUCT]))map[p].lmQty+=(Number(r[COL.QTY])||0);
    map[p].totalTrx++;if(IS_CHATBOT(r[COL.STATUS]))map[p].cbTrx++;
    map[p].buyers.add(r[COL.KEY_SUB]||r[COL.CUSTOMER_NAME]);
  });
  const arr=Object.values(map);
  if(groupBy==='month'){arr.sort((a,b)=>{const ya=Number(a.year)||0,yb=Number(b.year)||0;if(ya!==yb)return ya-yb;return(MONTH_ORDER2[a.month]||99)-(MONTH_ORDER2[b.month]||99);});arr.forEach(t=>{const idx=MONTH_ORDER2[t.month]||0;t.periode=idx?ID_MONTH2[idx]+' '+t.year:t.periode;});}
  else arr.sort((a,b)=>Number(a.periode.replace(/\D/g,''))-Number(b.periode.replace(/\D/g,'')));
  return arr.map(t=>({...t,buyerCount:t.buyers.size}));
}

function getTrendAnalysis(rows,groupBy='week'){
  const map={};
  rows.forEach(r=>{
    const p=groupBy==='month'?((r[COL.MONTH]||'').toUpperCase().trim()+' '+(r[COL.YEAR]||'?')).trim():(r[COL.PERIODE]||'?');
    if(!map[p])map[p]={periode:p,year:r[COL.YEAR]||0,month:(r[COL.MONTH]||'').toUpperCase().trim(),totalQty:0,lmQty:0,aqQty:0,cbQty:0,lmCbQty:0,allBuyers:new Set(),lmBuyers:new Set(),aqBuyers:new Set(),cbBuyers:new Set(),lmCbBuyers:new Set(),repeatBuyers:new Set(),totalTrx:0,lmTrx:0,aqTrx:0,cbTrx:0,lmCbTrx:0,totalGalon:0,cbGalon:0,lmCbGalon:0};
    const t=map[p],qty=Number(r[COL.QTY])||0,isCb=IS_CHATBOT(r[COL.STATUS]),isLM=IS_LM(r[COL.PRODUCT]),isAQ=IS_AQ(r[COL.PRODUCT]),key=r[COL.KEY_SUB]||r[COL.CUSTOMER_NAME];
    t.totalQty+=qty;if(isLM)t.lmQty+=qty;if(isAQ)t.aqQty+=qty;if(isCb){t.cbQty+=qty;if(isLM)t.lmCbQty+=qty;}
    t.allBuyers.add(key);if(isLM)t.lmBuyers.add(key);if(isAQ)t.aqBuyers.add(key);if(isCb){t.cbBuyers.add(key);if(isLM)t.lmCbBuyers.add(key);}
    if((r[COL.STATUS]||'').toUpperCase().trim()==='REPEAT')t.repeatBuyers.add(key);
    t.totalTrx++;if(isLM)t.lmTrx++;if(isAQ)t.aqTrx++;if(isCb){t.cbTrx++;if(isLM)t.lmCbTrx++;}
    t.totalGalon+=qty;if(isCb){t.cbGalon+=qty;if(isLM)t.lmCbGalon+=qty;}
  });
  const arr=Object.values(map);
  if(groupBy==='month'){arr.sort((a,b)=>{const ya=Number(a.year)||0,yb=Number(b.year)||0;if(ya!==yb)return ya-yb;return(MONTH_ORDER2[a.month]||99)-(MONTH_ORDER2[b.month]||99);});arr.forEach(t=>{const idx=MONTH_ORDER2[t.month]||0;t.periode=idx?ID_MONTH2[idx]+' '+t.year:t.periode;});}
  else arr.sort((a,b)=>Number(a.periode.replace(/\D/g,''))-Number(b.periode.replace(/\D/g,'')));
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  return arr.map(t=>{
    const aB=t.allBuyers.size,lmB=t.lmBuyers.size,aqB=t.aqBuyers.size,cbB=t.cbBuyers.size,lmCbB=t.lmCbBuyers.size,repB=t.repeatBuyers.size;
    return{periode:t.periode,pctLmUnit:pct(t.lmQty,t.totalQty),pctAqUnit:pct(t.aqQty,t.totalQty),pctOtUnit:pct(t.totalQty-t.lmQty-t.aqQty,t.totalQty),lmQty:t.lmQty,aqQty:t.aqQty,totalQty:t.totalQty,allBuyers:aB,cbBuyers:cbB,lmBuyers:lmB,aqBuyers:aqB,pctCbBuyer:pct(cbB,aB),pctLmBuyers:pct(lmB,aB),pctAqBuyers:pct(aqB,aB),pctOtBuyers:pct(aB-lmB-aqB,aB),repeatBuyers:repB,pctRepeat:pct(repB,cbB),lapsers:0,lmCbBuyers:lmCbB,pctLmCb:pct(lmCbB,cbB),totalTrx:t.totalTrx,cbTrx:t.cbTrx,lmTrx:t.lmTrx,aqTrx:t.aqTrx,pctCbTrx:pct(t.cbTrx,t.totalTrx),pctLmTrx:pct(t.lmTrx,t.totalTrx),pctAqTrx:pct(t.aqTrx,t.totalTrx),totalGalon:t.totalGalon,cbGalon:t.cbGalon,lmCbGalon:t.lmCbGalon,pctCbGalon:pct(t.cbGalon,t.totalGalon),pctLmCbGalon:pct(t.lmCbGalon,t.cbGalon)};
  });
}

// ===== EXPORT =====
function exportCSV(rows,filename){
  const h=['Region','Area','Outlet','Segmen','Supply','Coverage','Address','No/Unit','Customer Name','Phone','Status','Type_Transaction','Key_Prod','Product','Price','Qty','Value','Incentive','Disc%','Sum Disc%','Survey','Account','MPP','Account_TL','TL','SS/MPS','RSM','Timestamp','Periode','Month','Year','Project','Key_Sub','Program','Status Store'];
  let csv=h.join(',')+'\n';
  rows.forEach(r=>{csv+=h.map((_,i)=>{const v=r[i]??'';return typeof v==='string'&&v.includes(',')? `"${v}"`:v;}).join(',')+'\n';});
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename||'LM_Export.csv';a.click();
}

// ===== UTILS =====
function showLoading(show){const el=document.getElementById('loadingOverlay');if(el)el.classList.toggle('hidden',!show);}
function setSyncStatus(state,text){const dot=document.getElementById('syncDot'),txt=document.getElementById('syncText');if(dot)dot.className='sync-dot '+state;if(txt)txt.textContent=text;}
function showToast(msg,type='inf'){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.className=`toast show ${type}`;setTimeout(()=>{el.className='toast';},3000);}
function n(v){return Number(v||0).toLocaleString('id-ID');}
function pct(a,b){return b?Math.round(a/b*100):0;}
function esc(v){if(v==null)return '—';return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function heatClass(p){if(p>=90)return 'heat-100';if(p>=70)return 'heat-80';if(p>=50)return 'heat-60';if(p>=30)return 'heat-40';if(p>0)return 'heat-20';return 'heat-0';}

// ===== DEMO =====
function generateDemo(){
  const outlets=['NJ WATER PURI MANSION','ADP RITA','TOKO BOY MINERAL FORESTA','DEPOT TIRTA MENTENG','LM POINT BINTARO','WATER STATION GADING','DEPOT CILANDAK','FRESH WATER PONDOK INDAH','MINERAL CORNER SUNTER','TOKO BSD SEJAHTERA','TIRTA CIBUBUR','FRESH DEPOT DEPOK','LM EXPRESS TNG','BLUE WATER BEKASI','AQUA POINT BOGOR','DEPOT KELAPA DUA','SUMBER WARAS CIPUTAT','AIR BERSIH LEBAK BULUS','DEPOT BARU CILANDAK','MINERAL STATION FATMAWATI','DEPOT PANCORAN','AIR MINERAL PASAR MINGGU','TIRTA INDAH CIPETE','WATER POINT KEMANG','DEPOT SEGAR PONDOK LABU','FRESH MINERAL JAGAKARSA','DEPOT WARAS TB SIMATUPANG','SEGAR JAYA CILINCING'];
  const covs=outlets.map(o=>'COV-'+o.substring(0,8));
  const prods=['LE MINERALE','LE MINERALE','LE MINERALE','AQUA','AQUA','CLUB'];
  const stats=['MANUAL','MANUAL','NEW REG','NEW REG','REPEAT','REPEAT'];
  const tls=['NUR DIAN KAMALIA','NOVALINE AYU MUTIARA','INDRI ROSMASARI','METTA METIA LAILA','RAHMI METIA PUTRI'];
  const mpps=['DIMAS PRASETYO WIBOWO','MUHAMAD RUSTOMI','SITI RAHAYU','AHMAD FAUZI','BUDI SANTOSO'];
  const rsms=['HERMAWAN','HENDRA','IRVAN'];
  const weeks=['WEEK 8','WEEK 9','WEEK 10','WEEK 11'];
  const statusStore=outlets.map((_,i)=>i<28?'AKTIF':'PASIF'); // 28 AKTIF, sisanya PASIF
  const rows=[];
  for(let i=0;i<800;i++){
    const oi=i%outlets.length,pi=i%prods.length,wi=i%weeks.length,ti=oi%tls.length,mi=oi%mpps.length,ri=i%rsms.length;
    const prod=prods[pi],price=prod==='LE MINERALE'?22000:21000,qty=[1,2,3,4,5][i%5];
    const d=new Date(2026,0,24+Math.floor(i/8));
    const keySub=`${covs[oi]}-USR${String((i%50)+1).padStart(3,'0')}`;
    rows.push(['GR3'+(ri===0?'A':ri===1?'B':'C'),['JAKARTA BARAT','TANGERANG','BEKASI'][ri],outlets[oi],'END USER',['APARTEMEN','PERUMAHAN'][oi%2],covs[oi],'Jl. Demo No.'+(i+1),'Unit '+(i+1),i%4===0?'ANONIM':'Customer '+(i+1),i%5===0?'PRIVATE':'0812'+String(i).padStart(8,'0'),stats[i%stats.length],'DIRECT SELLING',prod==='LE MINERALE'?'APT1010LM':'APT1020AQ',prod,price,qty,price*qty,0,0,0,'Tidak Di Survey','CSM-'+String(i%9+1).padStart(4,'0'),mpps[mi],'CSM-TL'+String(ti+1).padStart(3,'0'),tls[ti],'SS'+String(ri+1).padStart(3,'0'),rsms[ri],d.toLocaleDateString('id-ID'),weeks[wi],['JAN','FEB','MAR','APR'][Math.floor(i/200)%4],2026,'RESIDENSIAL',keySub,'PERDANA 3+1',statusStore[oi]]);
  }
  return rows;
}
