// ================================================
// CHARTS MODULE
// ================================================
const CLR = { LM:'#00AEEF', AQ:'#EF5350', OT:'#F59E0B', TOTAL:'#DCE8F5', CB:'#2E7D32' };

function destroyChart(id) { const c=Chart.getChart(id); if(c) c.destroy(); }

function makeDonut(canvasId, labels, data, colors, centerText) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const total = data.reduce((a,b)=>a+b,0);

  new Chart(ctx, {
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:c=>{const t=c.dataset.data.reduce((a,b)=>a+b,0);return ` ${c.label}: ${Number(c.raw).toLocaleString('id-ID')} (${t?Math.round(c.raw/t*100):0}%)`}}},
      }
    },
    plugins:[
      // Center text plugin
      {
        id:'centerText',
        beforeDraw(chart){
          if (!centerText) return;
          const {ctx:cx, chartArea:{left,right,top,bottom}} = chart;
          const mx=(left+right)/2, my=(top+bottom)/2;
          cx.save();
          cx.font='800 15px Plus Jakarta Sans';
          cx.fillStyle='#0D2137';
          cx.textAlign='center';
          cx.textBaseline='middle';
          cx.fillText(centerText, mx, my);
          cx.restore();
        }
      },
      // Percentage label on each segment
      {
        id:'segmentLabels',
        afterDatasetDraw(chart) {
          const {ctx:cx, data} = chart;
          const meta = chart.getDatasetMeta(0);
          const tot = data.datasets[0].data.reduce((a,b)=>a+b,0);
          if (!tot) return;

          meta.data.forEach((arc, i) => {
            const val = data.datasets[0].data[i];
            const pct = Math.round(val/tot*100);
            if (pct < 4) return; // skip tiny slices

            const angle = (arc.startAngle + arc.endAngle) / 2;
            const r = (arc.innerRadius + arc.outerRadius) / 2;
            const x = arc.x + Math.cos(angle) * r;
            const y = arc.y + Math.sin(angle) * r;

            cx.save();
            cx.font = 'bold 10px Plus Jakarta Sans';
            cx.fillStyle = '#fff';
            cx.textAlign = 'center';
            cx.textBaseline = 'middle';
            cx.shadowColor = 'rgba(0,0,0,0.3)';
            cx.shadowBlur = 3;
            cx.fillText(pct+'%', x, y);
            cx.restore();
          });
        }
      }
    ]
  });
}

function makeLine(canvasId, labels, datasets) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  new Chart(ctx, {
    type:'line',
    data:{ labels, datasets: datasets.map(d=>({
      ...d, borderWidth:2.5, pointRadius:3, pointHoverRadius:5,
      fill:true, tension:0.4,
    }))},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{grid:{display:false}, ticks:{font:{size:10,family:'Plus Jakarta Sans'},color:'#8AADC4',maxRotation:30}},
        y:{grid:{color:'rgba(0,174,239,0.06)'}, ticks:{font:{size:10,family:'Plus Jakarta Sans'},color:'#8AADC4',callback:v=>v>=1000?(v/1000).toFixed(0)+'k':v}}
      }
    }
  });
}

function makeBar(canvasId, labels, datasets, stacked=false) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets: datasets.map(d=>({...d, borderRadius:5, borderSkipped:false}))},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{font:{size:11,family:'Plus Jakarta Sans'},boxWidth:12,boxHeight:12,borderRadius:3}}},
      scales:{
        x:{stacked, grid:{display:false}, ticks:{font:{size:10,family:'Plus Jakarta Sans'},maxRotation:30}},
        y:{stacked, grid:{color:'rgba(0,174,239,0.06)'}, ticks:{font:{size:10,family:'Plus Jakarta Sans'},color:'#8AADC4',callback:v=>v>=1000?(v/1000).toFixed(0)+'k':v}}
      }
    }
  });
}

function buildLegend(elId, labels, colors, values) {
  const el=document.getElementById(elId); if (!el) return;
  const total=values.reduce((a,b)=>a+b,0);
  el.innerHTML=labels.map((l,i)=>`<span style="display:flex;align-items:center;gap:4px">
    <span style="width:10px;height:10px;border-radius:2px;background:${colors[i]}"></span>
    ${l}: ${Number(values[i]).toLocaleString('id-ID')} (${total?Math.round(values[i]/total*100):0}%)
  </span>`).join('');
}
