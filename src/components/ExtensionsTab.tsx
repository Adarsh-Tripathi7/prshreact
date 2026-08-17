import React, { useMemo, useState } from 'react';
import EChart from './EChart';
import type { DataPayload, ExtRow } from '../types';

interface ExtensionsTabProps {
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

const AXIS_STYLE = { 
  axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }, 
  axisTick: { show: false }, 
  axisLabel: { fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#71717a' }, 
  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } } 
};

const PCT = ['5%','10%','15%','20%','25%','30%','35%','40%','45%','50%','55%','60%','65%','70%','75%','80%','85%','90%','95%','100%'];
function pctLabel(p: string) { return p === '100%' ? 'MAX' : (100 - parseInt(p)) + '%'; }
const extLabelsTemplate = PCT.map(pctLabel);

const ExtensionsTab: React.FC<ExtensionsTabProps> = ({ data, globalAsset }) => {
  const [breakType, setBreakType] = useState<'double_break'|'single_break'|'all_breaks'>('double_break');
  const [dir, setDir] = useState<'combined'|'high_first'|'low_first'>('combined');
  
  const [extWin, setExtWin] = useState(0);
  const [extPct, setExtPct] = useState('50%');
  const [extSortDir, setExtSortDir] = useState<-1|0|1>(0);

  const assets = globalAsset === 'both' ? ['nq', 'es'] : [globalAsset];
  const lcMap: Record<string, string> = { 'nq': '#6366f1', 'es': '#38bdf8' };
  const breakColor = breakType === 'double_break' ? '#ef4444' : breakType === 'single_break' ? '#10b981' : '#38bdf8';

  const extData = (asset: string) => {
    return (data.ext as any)[asset]?.[breakType]?.[dir] || [];
  };

  const primaryData: ExtRow[] = useMemo(() => {
    const d = extData(assets[0]);
    return d.length ? d : [];
  }, [data.ext, assets, breakType, dir]);

  const mappedData = useMemo(() => {
    let d = [...primaryData];
    if (extSortDir !== 0) {
      d.sort((a, b) => {
        const vA = (a as any)[extPct] || 0; 
        const vB = (b as any)[extPct] || 0;
        return (vA - vB) * extSortDir;
      });
    }
    return d;
  }, [primaryData, extPct, extSortDir]);

  const chartCdfOptions = useMemo(() => {
    const seriesCdf: any[] = [];
    if (!mappedData.length) return {};

    const targetWinRowOrig = mappedData[Math.min(extWin, mappedData.length - 1)];
    
    assets.forEach(asset => {
      const aData: ExtRow[] = extData(asset);
      if (!aData.length) return;
      
      const targetWinRow = aData.find(r => r.Window === targetWinRowOrig?.Window);
      const color = assets.length > 1 ? lcMap[asset] : breakColor;

      if (targetWinRow) {
        const vals = PCT.map(p => (targetWinRow as any)[p]);
        seriesCdf.push({ 
          name: asset.toUpperCase(), type: 'line', data: vals, smooth: 0.3, symbolSize: 6, 
          lineStyle: { width: 3, color: color }, itemStyle: { color: color }, 
          areaStyle: { color: 'rgba(255,255,255,0.05)' } 
        });
      }
    });

    return {
      tooltip: { ...TT, trigger: 'axis' }, 
      legend: { top: 0, right: 0, textStyle: { color: '#a1a1aa' }, icon: 'circle', show: assets.length > 1 }, 
      grid: { top: 30, right: 10, bottom: 20, left: 35 , containLabel: true },
      xAxis: { ...AXIS_STYLE, type: 'category', data: extLabelsTemplate }, 
      yAxis: { ...AXIS_STYLE, type: 'value' },
      series: seriesCdf
    };
  }, [mappedData, extWin, assets, breakType, dir, breakColor]);

  const chartBarOptions = useMemo(() => {
    const seriesBar: any[] = [];
    if (!mappedData.length) return {};

    const barLabels = mappedData.map(r => r.Window);

    assets.forEach(asset => {
      const aData: ExtRow[] = extData(asset);
      if (!aData.length) return;
      
      const sortedWindows = mappedData.map(r => r.Window);
      const mappedBarVals = sortedWindows.map(w => {
          const r = aData.find(x => x.Window === w);
          return r ? (r as any)[extPct] : 0;
      });
      
      const color = assets.length > 1 ? lcMap[asset] : breakColor;
      seriesBar.push({ name: asset.toUpperCase(), type: 'bar', data: mappedBarVals, itemStyle: { color: color, borderRadius: [4,4,0,0] } });
    });

    return {
      tooltip: { ...TT, trigger: 'axis' }, 
      legend: { top: 0, right: 0, textStyle: { color: '#a1a1aa' }, icon: 'roundRect', show: assets.length > 1 }, 
      grid: { top: 30, right: 10, bottom: 70, left: 35 , containLabel: true }, 
      dataZoom: [{ type: 'inside' }],
      xAxis: { ...AXIS_STYLE, type: 'category', data: barLabels, axisLabel: { ...AXIS_STYLE.axisLabel, rotate: 45 } },
      yAxis: { ...AXIS_STYLE, type: 'value' },
      series: seriesBar
    };
  }, [mappedData, extPct, assets, breakType, dir, breakColor]);

  const handlePctSort = (p: string) => {
    if (extPct === p) {
      if (extSortDir === -1) setExtSortDir(1);
      else if (extSortDir === 1) setExtSortDir(0);
      else setExtSortDir(-1);
    } else {
      setExtPct(p);
      setExtSortDir(-1);
    }
  };

  return (
    <div className="page active" id="page-extensions">
      <div className="grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="dot" style={{background:'var(--warm)'}}></div> R-Multiple Extensions</div>
            <div className="segments-scroll">
              <div className="segments" id="segBreak">
                <button className={breakType === 'double_break' ? 'active' : ''} onClick={() => setBreakType('double_break')}>Double Break</button>
                <button className={breakType === 'single_break' ? 'active' : ''} onClick={() => setBreakType('single_break')}>Single Break</button>
                <button className={breakType === 'all_breaks' ? 'active' : ''} onClick={() => setBreakType('all_breaks')}>All Breaks</button>
              </div>
            </div>
            <div className="segments-scroll">
              <div className="segments" id="segDir">
                <button className={dir === 'combined' ? 'active' : ''} onClick={() => setDir('combined')}>Combined</button>
                <button className={dir === 'high_first' ? 'active' : ''} onClick={() => setDir('high_first')}>High First</button>
                <button className={dir === 'low_first' ? 'active' : ''} onClick={() => setDir('low_first')}>Low First</button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div style={{fontSize:'12px', color:'var(--text-3)', marginBottom:'8px'}}>Select a row in the table below to update CDF.</div>
            <EChart options={chartCdfOptions} style={{height: 280}} />
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div className="card-title"><div className="dot" style={{background:'var(--up)'}}></div> {pctLabel(extPct)} Hit Rate</div>
            </div>
          </div>
          <div className="card-body">
            <EChart options={chartBarOptions} style={{height: 250}} />
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{paddingBottom:0}}>
            <div style={{fontSize:'11px', color:'var(--text-2)', fontWeight:500}}>Tip: Click on a percentile header below (e.g. 90%) to change the chart</div>
          </div>
          <div className="card-body dense table-wrap" style={{maxHeight:'400px', overflowY:'auto', marginTop:'8px'}}>
            <table>
              <thead>
                <tr>
                  <th>Window</th>
                  {assets.length > 1 && <th>Asset</th>}
                  {PCT.map(p => {
                    const isAct = p === extPct;
                    const style = isAct ? { color: 'var(--text-1)', background: 'var(--bg-hover)', borderBottom: '2px solid var(--accent)', cursor: 'pointer' } : { cursor: 'pointer' };
                    let sortInd = '';
                    if (isAct && extSortDir !== 0) sortInd = extSortDir === -1 ? ' ↓' : ' ↑';
                    return (
                      <th key={p} className="r pct-btn" style={style} onClick={() => handlePctSort(p)}>
                        {pctLabel(p)}{sortInd}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let maxV = 0;
                  assets.forEach(a => {
                    extData(a).forEach((r:any) => PCT.forEach(p => { if (p !== '100%' && r[p] > maxV) maxV = r[p]; }));
                  });
                  const cellBg = (v: number) => { const t = Math.min(1, v / (maxV || 5)); return `hsla(${155 - t * 135}, 50%, ${38 - t * 10}%, .18)`; };
                  
                  return mappedData.map((d, i) => {
                    return (
                      <React.Fragment key={d.Window}>
                        {assets.map((asset, aIdx) => {
                          const aData = extData(asset);
                          const row = aData.find((x: any) => x.Window === d.Window);
                          if (!row) return null;
                          
                          return (
                            <tr key={`${d.Window}-${asset}`} onClick={() => setExtWin(i)} style={{cursor:'pointer', background: i === extWin ? 'var(--bg-hover)' : ''}}>
                              {aIdx === 0 && <td rowSpan={assets.length} className="c-mono">{d.Window}</td>}
                              {assets.length > 1 && <td className="c-mono" style={{color: lcMap[asset]}}>{asset.toUpperCase()}</td>}
                              {PCT.map(p => {
                                const v = (row as any)[p];
                                return <td key={p} className="r c-mono" style={{background: typeof v === 'number' ? cellBg(v) : 'transparent'}}>{v ? v.toFixed(2) : '—'}</td>;
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionsTab;
