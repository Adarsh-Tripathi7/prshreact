import React, { useMemo, useState } from 'react';
import EChart from './EChart';
import type { DataPayload, ExtRow } from '../types';

interface HeatmapTabProps {
  data: DataPayload;
  globalAsset: 'both' | 'nq' | 'es';
}

const TT = { 
  backgroundColor: '#18181b', 
  borderColor: '#3f3f46', 
  textStyle: { fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#fafafa' }, 
  padding: [12, 16], 
  extraCssText: 'border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);' 
};

const PCT = ['5%','10%','15%','20%','25%','30%','35%','40%','45%','50%','55%','60%','65%','70%','75%','80%','85%','90%','95%','100%'];
function pctLabel(p: string) { return p === '100%' ? 'MAX' : (100 - parseInt(p)) + '%'; }
const extLabelsTemplate = PCT.map(pctLabel);

const HeatmapTab: React.FC<HeatmapTabProps> = ({ data, globalAsset }) => {
  const [hmType, setHmType] = useState('prob');
  const [hmDir, setHmDir] = useState('combined');
  
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<-1|0|1>(0);

  const chartOptions = useMemo(() => {
    const sortIndic = (val: string) => {
      if (sortCol === val && sortDir !== 0) return sortDir === -1 ? ' ▼' : ' ▲';
      return '';
    };

    if (hmType === 'prob') {
      let sortedProb = [...data.prob];
      if (sortDir !== 0 && sortCol) {
         sortedProb.sort((a,b) => {
             let vA = sortCol.includes('NQ') ? a.NQ_DB_Prob : (sortCol.includes('ES') ? a.ES_DB_Prob : 0);
             let vB = sortCol.includes('NQ') ? b.NQ_DB_Prob : (sortCol.includes('ES') ? b.ES_DB_Prob : 0);
             return (vA - vB) * sortDir;
         });
      }
      const windows = sortedProb.map(d => d.Window);
      const reqHeight = Math.max(400, windows.length * 30);
      
      const chartData: any[] = [];
      if (globalAsset === 'both') {
        const lblNQ = 'NQ' + sortIndic('NQ');
        const lblES = 'ES' + sortIndic('ES');
        sortedProb.forEach((d, yi) => { 
          chartData.push([0, yi, +(d.NQ_DB_Prob || 0).toFixed(1)]); 
          chartData.push([1, yi, +(d.ES_DB_Prob || 0).toFixed(1)]); 
        });
        
        return {
          height: reqHeight,
          tooltip: TT, 
          xAxis: { type: 'category', data: [lblNQ, lblES], position: 'top', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#a1a1aa', fontSize: 13, fontWeight: 'bold' }, triggerEvent: true },
          yAxis: { type: 'category', data: windows, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' } },
          grid: { top: 40, right: 10, bottom: 10, left: 75, containLabel: false },
          visualMap: { show: false, min: 20, max: 90, inRange: { color: ['#0f172a', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa'] } },
          series: [{ type: 'heatmap', data: chartData, progressive: 200, label: { show: true, color: '#fff', fontSize: 12, fontWeight: 500, textShadowColor: 'rgba(0,0,0,0.8)', textShadowBlur: 2, formatter: (p:any)=>p.value[2]+'%' }, emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } } }]
        };
      } else {
        const lblAsset = globalAsset.toUpperCase() + sortIndic(globalAsset.toUpperCase());
        sortedProb.forEach((d, yi) => { 
          const val = globalAsset === 'nq' ? d.NQ_DB_Prob : d.ES_DB_Prob;
          chartData.push([0, yi, +(val || 0).toFixed(1)]); 
        });
        return {
          height: reqHeight,
          tooltip: TT, 
          xAxis: { type: 'category', data: [lblAsset], position: 'top', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#a1a1aa', fontSize: 13, fontWeight: 'bold' }, triggerEvent: true },
          yAxis: { type: 'category', data: windows, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' } },
          grid: { top: 40, right: 10, bottom: 10, left: 75, containLabel: false },
          visualMap: { show: false, min: 20, max: 90, inRange: { color: ['#0f172a', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa'] } },
          series: [{ type: 'heatmap', data: chartData, progressive: 200, label: { show: true, color: '#fff', fontSize: 12, fontWeight: 500, textShadowColor: 'rgba(0,0,0,0.8)', textShadowBlur: 2, formatter: (p:any)=>p.value[2]+'%' }, emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } } }]
        };
      }
    } else if (hmType === 'corr') {
      if (!data.corr || !data.corr.length) return {};
      
      let sortedCorr = [...data.corr];
      const cols = [{key:'ES High Break (NQ Follows)', label:'ES Lead ↑'},{key:'ES Low Break (NQ Follows)', label:'ES Lead ↓'},{key:'NQ High Break (ES Follows)', label:'NQ Lead ↑'},{key:'NQ Low Break (ES Follows)', label:'NQ Lead ↓'}];
      if (sortDir !== 0 && sortCol) {
         const colKey = cols.find(x => x.label === sortCol)?.key;
         if (colKey) sortedCorr.sort((a,b) => ((a as any)[colKey] - (b as any)[colKey]) * sortDir);
      }
      
      const windows = sortedCorr.map(d => d.Window);
      const reqHeight = Math.max(400, windows.length * 30);
      
      const chartData: any[] = []; 
      sortedCorr.forEach((d, yi) => cols.forEach((col, xi) => chartData.push([xi, yi, typeof (d as any)[col.key]==='number'?+((d as any)[col.key]||0).toFixed(1):0])));
      
      return {
        height: reqHeight,
        tooltip: TT, 
        xAxis: { type: 'category', data: cols.map(c=>c.label + sortIndic(c.label)), position: 'top', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#a1a1aa', fontSize: 11, rotate: 30 }, triggerEvent: true },
        yAxis: { type: 'category', data: windows, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' } },
        grid: { top: 50, right: 10, bottom: 10, left: 75, containLabel: false },
        visualMap: { show: false, min: 65, max: 85, inRange: { color: ['#2e1065', '#4c1d95', '#5b21b6', '#6d28d9', '#7c3aed', '#8b5cf6'] } },
        series: [{ type: 'heatmap', data: chartData, progressive: 200, label: { show: true, color: '#fff', fontSize: 12, fontWeight: 500, textShadowColor: 'rgba(0,0,0,0.8)', textShadowBlur: 2, formatter: (p:any)=>p.value[2]+'%' } }]
      };
    } else {
      const btype = hmType === 'ext_db' ? 'double_break' : hmType === 'ext_sb' ? 'single_break' : 'all_breaks';
      const refData: ExtRow[] = (data.ext as any)[globalAsset === 'es' ? 'es' : 'nq']?.[btype]?.[hmDir];
      if (!refData || !refData.length) return {};
      
      let sortedRef = [...refData];
      if (sortDir !== 0 && sortCol) {
         const idx = extLabelsTemplate.indexOf(sortCol);
         const p = idx !== -1 ? PCT[idx] : null;
         if (p) {
             sortedRef.sort((a, b) => {
                 let rNqA = (data.ext.nq as any)?.[btype]?.[hmDir]?.find((x:any) => x.Window === a.Window);
                 let rEsA = (data.ext.es as any)?.[btype]?.[hmDir]?.find((x:any) => x.Window === a.Window);
                 let vA = 0, vB = 0;
                 if (globalAsset === 'both') { vA = ((rNqA?.[p]||0) + (rEsA?.[p]||0))/2; }
                 else if (globalAsset === 'nq') { vA = rNqA?.[p]||0; } else { vA = rEsA?.[p]||0; }
                 
                 let rNqB = (data.ext.nq as any)?.[btype]?.[hmDir]?.find((x:any) => x.Window === b.Window);
                 let rEsB = (data.ext.es as any)?.[btype]?.[hmDir]?.find((x:any) => x.Window === b.Window);
                 if (globalAsset === 'both') { vB = ((rNqB?.[p]||0) + (rEsB?.[p]||0))/2; }
                 else if (globalAsset === 'nq') { vB = rNqB?.[p]||0; } else { vB = rEsB?.[p]||0; }
                 return (vA - vB) * sortDir;
             });
         }
      }
      
      const windows = sortedRef.map(r => r.Window);
      const reqHeight = Math.max(400, windows.length * 30);
      
      const chartData: any[] = []; 
      let maxV = 0;
      
      windows.forEach((w, yi) => {
        let rNq:any, rEs:any;
        if (globalAsset === 'both' || globalAsset === 'nq') rNq = (data.ext.nq as any)?.[btype]?.[hmDir]?.find((x:any) => x.Window === w);
        if (globalAsset === 'both' || globalAsset === 'es') rEs = (data.ext.es as any)?.[btype]?.[hmDir]?.find((x:any) => x.Window === w);
        
        PCT.forEach((p, xi) => {
          let v;
          if (globalAsset === 'both') {
            const vNq = rNq ? rNq[p] : 0;
            const vEs = rEs ? rEs[p] : 0;
            v = (typeof vNq === 'number' && typeof vEs === 'number') ? (vNq + vEs) / 2 : 0;
          } else if (globalAsset === 'nq') {
            v = rNq ? rNq[p] : 0;
          } else {
            v = rEs ? rEs[p] : 0;
          }
          if (p !== '100%' && v > maxV) maxV = v;
          chartData.push([xi, yi, typeof v === 'number' ? +v.toFixed(2) : 0]);
        });
      });
      
      return {
        height: reqHeight,
        tooltip: TT, 
        xAxis: { type: 'category', data: extLabelsTemplate.map(p => p + sortIndic(p)), position: 'top', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#a1a1aa', fontSize: 12 }, triggerEvent: true },
        yAxis: { type: 'category', data: windows, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' } },
        grid: { top: 40, right: 10, bottom: 25, left: 75, containLabel: false },
        visualMap: { show: false, min: 1, max: maxV || 5, inRange: { color: ['#022c22', '#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'] } },
        series: [{ type: 'heatmap', data: chartData, progressive: 200, label: { show: true, color: '#fff', fontSize: 12, fontWeight: 500, textShadowColor: 'rgba(0,0,0,0.8)', textShadowBlur: 2, formatter: (p:any)=>p.value[2].toFixed(2) }, emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } } }]
      };
    }
  }, [data, hmType, hmDir, globalAsset, sortCol, sortDir]);

  const onChartEvent = (eventName: string, params: any) => {
    if (eventName === 'click' && params.componentType === 'xAxis') {
      let cleanValue = params.value;
      const allLabels = [...extLabelsTemplate, 'ES Lead ↑', 'ES Lead ↓', 'NQ Lead ↑', 'NQ Lead ↓', 'Combined Avg', 'NQ', 'ES'];
      allLabels.sort((a, b) => b.length - a.length);
      const match = allLabels.find(l => params.value.startsWith(l));
      if (match) cleanValue = match;
      
      if (sortCol === cleanValue) { 
        setSortDir(sortDir === 1 ? -1 : 1); 
      } else { 
        setSortCol(cleanValue); 
        setSortDir(-1); 
      }
    }
  };

  const chartHeight = (chartOptions as any)?.height || 400;
  
  // Custom wrapper to pass onEvents to EChart if it supported it.
  // Instead, we will wrap EChart locally or just say we don't support X axis click sorting if EChart wrapper doesn't support it.
  // Since we wrote EChart wrapper, it doesn't support events yet. We will just render it.

  return (
    <div className="page active" id="page-heatmap">
      <div className="grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div className="dot" style={{background:'var(--accent)'}}></div> Heatmap
            </div>
            <div className="segments-scroll">
              <div className="segments">
                <button className={hmType === 'prob' ? 'active' : ''} onClick={() => setHmType('prob')}>DB Prob</button>
                <button className={hmType === 'ext_db' ? 'active' : ''} onClick={() => setHmType('ext_db')}>DB Ext</button>
                <button className={hmType === 'ext_sb' ? 'active' : ''} onClick={() => setHmType('ext_sb')}>SB Ext</button>
                <button className={hmType === 'ext_ab' ? 'active' : ''} onClick={() => setHmType('ext_ab')}>All Ext</button>
                <button className={hmType === 'corr' ? 'active' : ''} onClick={() => setHmType('corr')}>Leader/Lagger</button>
              </div>
            </div>
            {hmType !== 'prob' && hmType !== 'corr' && (
              <div className="segments-scroll">
                <div className="segments">
                  <button className={hmDir === 'combined' ? 'active' : ''} onClick={() => setHmDir('combined')}>Combined</button>
                  <button className={hmDir === 'high_first' ? 'active' : ''} onClick={() => setHmDir('high_first')}>High First</button>
                  <button className={hmDir === 'low_first' ? 'active' : ''} onClick={() => setHmDir('low_first')}>Low First</button>
                </div>
              </div>
            )}
          </div>
          <div className="card-body heatmap-wrap">
            <EChart options={chartOptions} onEvents={{ click: onChartEvent }} style={{height: chartHeight}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapTab;
