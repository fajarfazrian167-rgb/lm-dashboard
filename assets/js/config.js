// v10.0
const CONFIG = {
  SPREADSHEET_ID: '1m8-FwDgqfR2QWvrTC1opzIKstfrV-5WNkgDtUyEWchs',
  SHEET_NAME: 'MASTER DATA',
  SHEET_APARTEMEN: '', // isi nanti: 'MASTER DATA EKMA'
  DEMO_MODE: false,
  REFRESH_INTERVAL: 300000,
};

let ACTIVE_SOURCE = 'ALL';

const COL = {
  REGION:0,AREA:1,OUTLET:2,SEGMEN:3,SUPPLY:4,COVERAGE:5,ADDRESS:6,
  NO_UNIT:7,CUSTOMER_NAME:8,PHONE:9,STATUS:10,TYPE_TRX:11,KEY_PROD:12,
  PRODUCT:13,PRICE:14,QTY:15,VALUE:16,INCENTIVE:17,DISC:18,SUM_DISC:19,
  SURVEY:20,ACCOUNT:21,MPP:22,ACCOUNT_TL:23,TL:24,SS_MPS:25,RSM:26,
  TIMESTAMP:27,PERIODE:28,MONTH:29,YEAR:30,PROJECT:31,KEY_SUB:32,
  PROGRAM:33,STATUS_STORE:34,
};

const IS_LM  = v => (v||'').toUpperCase().trim() === 'LE MINERALE';
const IS_AQ  = v => (v||'').toUpperCase().trim() === 'AQUA';
const IS_OT  = v => !IS_LM(v) && !IS_AQ(v);
const IS_CHATBOT = v => { const s=(v||'').toUpperCase().trim(); return s==='NEW REG'||s==='REPEAT'||s==='NEWREG'; };

// Kolom AF = PROJECT: "RESIDENSIAL" atau "APARTEMEN"
const IS_APT  = r => (r[COL.PROJECT]||'').toUpperCase().includes('APARTEMEN');
const IS_PERUM= r => !IS_APT(r) && (r[COL.PROJECT]||'').toUpperCase().includes('RESIDENSIAL');

// Status outlet dari kolom AI: AKTIF = Continue, PASIF = Discontinue
const IS_ACTIVE = st => (st||'').toUpperCase().trim() === 'AKTIF' || (st||'').toUpperCase().trim() === 'ACTIVE';

const DEFAULT_USERS = [
  {id:1,nama:'FAJAR FAZRIAN',username:'fajar.manager@leminerale.co.id',password:'LM0001',role:'pm',status:'active'},
  {id:2,nama:'RAYU FEBRIANI',username:'rayu.areacordinator@leminerale.co.id',password:'LM0002',role:'ac',status:'active'},
  {id:3,nama:'NOVALINE AYU MUTIARA',username:'novaline.teamleader@leminerale.co.id',password:'LM0003',role:'tl',status:'active'},
  {id:4,nama:'INDRI ROSMASARI',username:'indri.teamleader@leminerale.co.id',password:'LM0004',role:'tl',status:'active'},
  {id:5,nama:'NUR DIAN KAMALIA',username:'dian.teamleader@leminerale.co.id',password:'LM0005',role:'tl',status:'active'},
  {id:6,nama:'METTA METIA LAILA',username:'metta.teamleader@leminerale.co.id',password:'LM0006',role:'tl',status:'active'},
  {id:7,nama:'RAHMI METIA PUTRI',username:'rahmi.teamleader@leminerale.co.id',password:'LM0007',role:'tl',status:'active'},
  {id:8,nama:'DAVID OHE OHAHAU GEYA',username:'david.teamleader@leminerale.co.id',password:'LM0008',role:'tl',status:'active'},
  {id:9,nama:'HERNY PRIYANTINY',username:'herny.teamleader@leminerale.co.id',password:'LM0009',role:'tl',status:'active'},
  {id:10,nama:'KELVIN ANDIKA',username:'kelvin.marketing@leminerale.co.id',password:'LM00010',role:'client',status:'active'},
  {id:11,nama:'SALAMAH FAUZIAH',username:'admin.marketing@leminerale.co.id',password:'LM00011',role:'admin',status:'active'},
];

function getUsers() {
  try { const r=localStorage.getItem('lm_users'); return r?JSON.parse(r):DEFAULT_USERS; }
  catch(e) { return DEFAULT_USERS; }
}
const CAN_MANAGE = ['admin','pm'];

// ===== MS BEFORE DATABASE =====
// Data MS Before per outlet — dikelola di halaman ms-before.html
function getMSBeforeDB() {
  try { const r=localStorage.getItem('lm_ms_before'); return r?JSON.parse(r):{}; }
  catch(e) { return {}; }
}
function saveMSBeforeDB(db) {
  localStorage.setItem('lm_ms_before', JSON.stringify(db));
}
function getMSBefore(outletName) {
  const db = getMSBeforeDB();
  return db[outletName] || null; // returns { msBefore: 25.5, notes: '...' }
}
