import React, { useMemo, useState } from 'react';
import EChart from './EChart';
import CustomDropdown from './CustomDropdown';
import type { DataPayload } from '../types';

interface HlFirstTabProps {
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

const HlFirstTab: React.FC<HlFirstTabProps> = ({ data, globalAsset }) => {
  const [target, setTarget] = useState('break_high_first');
  const [closePosTh, setClosePosTh] = useState('none');
  const [qSort, setQSort] = useState('time');
  
  const [sortCol, setSortCol] = useState('Window');
  const [sortDir, setSortDir] = useState<-1|0|1>(0);

  const rawData = (data.close_pos && data.close_pos.length) ? data.close_pos : (data.prob_first || []);

  const isCompare = target === 'compare_both';

  const mappedData = useMemo(() => {
    if (!rawData.length) return [];

    let arr = rawData.map((d: any, origIdx: number) => {
      let nq = 0, es = 0, nq_tot = 0, es_tot = 0;
      let nq_high = 0, nq_low = 0, es_high = 0, es_low = 0;
      let nq_lf_edge = 0, es_lf_edge = 0, nq_hf_edge = 0, es_hf_edge = 0;
      
      const nq_hf = d.NQ_HF_Total || 0, nq_lf = d.NQ_LF_Total || 0;
      const es_hf = d.ES_HF_Total || 0, es_lf = d.ES_LF_Total || 0;
      const nq_all = nq_hf + nq_lf;
      const es_all = es_hf + es_lf;
  
      if (closePosTh === 'none') {
        nq_high = nq_all > 0 ? (((d.NQ_HighFirst_BreakHighFirst_Prob || 0) * nq_hf + (d.NQ_LowFirst_BreakHighFirst_Prob || 0) * nq_lf) / nq_all) : (d.NQ_L_First_H_Break_Prob || 0);
        nq_low = nq_all > 0 ? (((d.NQ_HighFirst_BreakLowFirst_Prob || 0) * nq_hf + (d.NQ_LowFirst_BreakLowFirst_Prob || 0) * nq_lf) / nq_all) : (d.NQ_H_First_L_Break_Prob || 0);
        es_high = es_all > 0 ? (((d.ES_HighFirst_BreakHighFirst_Prob || 0) * es_hf + (d.ES_LowFirst_BreakHighFirst_Prob || 0) * es_lf) / es_all) : (d.ES_L_First_H_Break_Prob || 0);
        es_low = es_all > 0 ? (((d.ES_HighFirst_BreakLowFirst_Prob || 0) * es_hf + (d.ES_LowFirst_BreakLowFirst_Prob || 0) * es_lf) / es_all) : (d.ES_H_First_L_Break_Prob || 0);
        
        nq_lf_edge = d.NQ_LowFirst_BreakHighFirst_Prob ?? d.NQ_L_First_H_Break_Prob ?? 0;
        es_lf_edge = d.ES_LowFirst_BreakHighFirst_Prob ?? d.ES_L_First_H_Break_Prob ?? 0;
        nq_hf_edge = d.NQ_HighFirst_BreakLowFirst_Prob ?? d.NQ_H_First_L_Break_Prob ?? 0;
        es_hf_edge = d.ES_HighFirst_BreakLowFirst_Prob ?? d.ES_H_First_L_Break_Prob ?? 0;
      } else {
        nq_high = d[`NQ_Top${closePosTh}_BreakHighFirst_Prob`] ?? 0;
        nq_low = d[`NQ_Bot${closePosTh}_BreakLowFirst_Prob`] ?? 0;
        es_high = d[`ES_Top${closePosTh}_BreakHighFirst_Prob`] ?? 0;
        es_low = d[`ES_Bot${closePosTh}_BreakLowFirst_Prob`] ?? 0;
  
        nq_lf_edge = d[`NQ_LowFirst_Top${closePosTh}_BreakHighFirst_Prob`] ?? 0;
        es_lf_edge = d[`ES_LowFirst_Top${closePosTh}_BreakHighFirst_Prob`] ?? 0;
        nq_hf_edge = d[`NQ_HighFirst_Bot${closePosTh}_BreakLowFirst_Prob`] ?? 0;
        es_hf_edge = d[`ES_HighFirst_Bot${closePosTh}_BreakLowFirst_Prob`] ?? 0;
      }
      
      if (target === 'break_high_first') {
        nq = nq_high; es = es_high;
        nq_tot = closePosTh === 'none' ? nq_all : (d[`NQ_Top${closePosTh}_Total`] ?? 0);
        es_tot = closePosTh === 'none' ? es_all : (d[`ES_Top${closePosTh}_Total`] ?? 0);
      } else if (target === 'break_low_first') {
        nq = nq_low; es = es_low;
        nq_tot = closePosTh === 'none' ? nq_all : (d[`NQ_Bot${closePosTh}_Total`] ?? 0);
        es_tot = closePosTh === 'none' ? es_all : (d[`ES_Bot${closePosTh}_Total`] ?? 0);
      } else if (target === 'low_first_break_high') {
        nq = nq_lf_edge; es = es_lf_edge;
        nq_tot = closePosTh === 'none' ? nq_lf : (d[`NQ_LowFirst_Top${closePosTh}_Total`] ?? 0);
        es_tot = closePosTh === 'none' ? es_lf : (d[`ES_LowFirst_Top${closePosTh}_Total`] ?? 0);
      } else if (target === 'high_first_break_low') {
        nq = nq_hf_edge; es = es_hf_edge;
        nq_tot = closePosTh === 'none' ? nq_hf : (d[`NQ_HighFirst_Bot${closePosTh}_Total`] ?? 0);
        es_tot = closePosTh === 'none' ? es_hf : (d[`ES_HighFirst_Bot${closePosTh}_Total`] ?? 0);
      } else if (target === 'combined_opp') {
        if (closePosTh === 'none') {
          nq_tot = nq_hf + nq_lf; es_tot = es_hf + es_lf;
          nq = nq_tot > 0 ? (((d.NQ_HighFirst_BreakLowFirst_Prob || 0) * nq_hf + (d.NQ_LowFirst_BreakHighFirst_Prob || 0) * nq_lf) / nq_tot) : (d.NQ_Comb_Opp_Prob || 0);
          es = es_tot > 0 ? (((d.ES_HighFirst_BreakLowFirst_Prob || 0) * es_hf + (d.ES_LowFirst_BreakHighFirst_Prob || 0) * es_lf) / es_tot) : (d.ES_Comb_Opp_Prob || 0);
        } else {
          const nq_l = d[`NQ_LowFirst_Top${closePosTh}_Total`] || 0, nq_h = d[`NQ_HighFirst_Bot${closePosTh}_Total`] || 0;
          nq_tot = nq_l + nq_h;
          nq = nq_tot > 0 ? (((d[`NQ_LowFirst_Top${closePosTh}_BreakHighFirst_Prob`] || 0) * nq_l + (d[`NQ_HighFirst_Bot${closePosTh}_BreakLowFirst_Prob`] || 0) * nq_h) / nq_tot) : 0;
          
          const es_l = d[`ES_LowFirst_Top${closePosTh}_Total`] || 0, es_h = d[`ES_HighFirst_Bot${closePosTh}_Total`] || 0;
          es_tot = es_l + es_h;
          es = es_tot > 0 ? (((d[`ES_LowFirst_Top${closePosTh}_BreakHighFirst_Prob`] || 0) * es_l + (d[`ES_HighFirst_Bot${closePosTh}_BreakLowFirst_Prob`] || 0) * es_h) / es_tot) : 0;
        }
      } else if (target === 'compare_both') {
        nq = nq_high; es = es_high;
        nq_tot = closePosTh === 'none' ? nq_all : ((d[`NQ_Top${closePosTh}_Total`] || 0) + (d[`NQ_Bot${closePosTh}_Total`] || 0));
        es_tot = closePosTh === 'none' ? es_all : ((d[`ES_Top${closePosTh}_Total`] || 0) + (d[`ES_Bot${closePosTh}_Total`] || 0));
      }
      
      let avg = (nq > 0 && es > 0) ? (nq + es) / 2 : (nq || es || 0);
      let delta = (nq > 0 && es > 0) ? (nq - es) : 0;
      
      const avg_high = ((nq_high + es_high) / 2) || 0;
      const avg_low = ((nq_low + es_low) / 2) || 0;
      const avg_lf = ((nq_lf_edge + es_lf_edge) / 2) || 0;
      const avg_hf = ((nq_hf_edge + es_hf_edge) / 2) || 0;
      
      let primary_high = globalAsset === 'nq' ? nq_high : (globalAsset === 'es' ? es_high : avg_high);
      let primary_low = globalAsset === 'nq' ? nq_low : (globalAsset === 'es' ? es_low : avg_low);
      let primary_lf = globalAsset === 'nq' ? nq_lf_edge : (globalAsset === 'es' ? es_lf_edge : avg_lf);
      let primary_hf = globalAsset === 'nq' ? nq_hf_edge : (globalAsset === 'es' ? es_hf_edge : avg_hf);
      let skew = Math.abs(primary_high - primary_low);
  
      return {
        origIdx: origIdx,
        Window: d.Window,
        nq: +nq.toFixed(1), es: +es.toFixed(1), avg: +avg.toFixed(1), delta: +delta.toFixed(1),
        nq_high: +nq_high.toFixed(1), nq_low: +nq_low.toFixed(1),
        es_high: +es_high.toFixed(1), es_low: +es_low.toFixed(1),
        avg_high: +avg_high.toFixed(1), avg_low: +avg_low.toFixed(1),
        primary_high: +primary_high.toFixed(1), primary_low: +primary_low.toFixed(1),
        primary_lf: +primary_lf.toFixed(1), primary_hf: +primary_hf.toFixed(1),
        skew: +skew.toFixed(1),
        nq_tot: nq_tot, es_tot: es_tot, tot: nq_tot + es_tot
      };
    });

    if (sortDir !== 0) {
      arr.sort((a, b) => {
        let vA = (a as any)[sortCol], vB = (b as any)[sortCol];
        if (sortCol === 'Window') return vA.localeCompare(vB) * sortDir;
        return (vA - vB) * sortDir;
      });
    } else if (qSort === 'high_desc') {
      arr.sort((a, b) => b.primary_high - a.primary_high);
    } else if (qSort === 'low_desc') {
      arr.sort((a, b) => b.primary_low - a.primary_low);
    } else if (qSort === 'low_first_edge') {
      arr.sort((a, b) => b.primary_lf - a.primary_lf);
    } else if (qSort === 'high_first_edge') {
      arr.sort((a, b) => b.primary_hf - a.primary_hf);
    } else if (qSort === 'skew_desc') {
      arr.sort((a, b) => b.skew - a.skew);
    } else if (qSort === 'count_desc') {
      const getSamples = (d: any) => globalAsset === 'nq' ? d.nq_tot : (globalAsset === 'es' ? d.es_tot : d.tot);
      arr.sort((a, b) => getSamples(b) - getSamples(a));
    } else {
      arr.sort((a, b) => a.origIdx - b.origIdx);
    }

    return arr;
  }, [rawData, target, closePosTh, qSort, sortCol, sortDir, globalAsset, isCompare]);

  const chartOptions = useMemo(() => {
    const labels = mappedData.map(d => d.Window);
    const series: any[] = [];
    
    if (isCompare) {
      const highVals = mappedData.map(d => globalAsset === 'nq' ? d.nq_high : (globalAsset === 'es' ? d.es_high : d.avg_high));
      const lowVals = mappedData.map(d => globalAsset === 'nq' ? d.nq_low : (globalAsset === 'es' ? d.es_low : d.avg_low));
      
      series.push({ name: 'Break High 1st', type: 'line', data: highVals, smooth: 0.3, symbolSize: 6, lineStyle: { width: 3, color: '#10b981' }, itemStyle: { color: '#10b981' } });
      series.push({ name: 'Break Low 1st', type: 'line', data: lowVals, smooth: 0.3, symbolSize: 6, lineStyle: { width: 3, color: '#ef4444' }, itemStyle: { color: '#ef4444' } });
    } else {
      const nqVals = mappedData.map(d => d.nq);
      const esVals = mappedData.map(d => d.es);
      
      if (globalAsset === 'both' || globalAsset === 'nq') {
        series.push({ name: 'NQ', type: 'line', data: nqVals, smooth: 0.3, symbolSize: 6, lineStyle: { width: 3, color: '#6366f1' }, itemStyle: { color: '#6366f1' } });
      }
      if (globalAsset === 'both' || globalAsset === 'es') {
        series.push({ name: 'ES', type: 'line', data: esVals, smooth: 0.3, symbolSize: 6, lineStyle: { width: 3, color: '#38bdf8' }, itemStyle: { color: '#38bdf8' } });
      }
    }

    return {
      tooltip: { ...TT, trigger: 'axis' },
      legend: { top: 0, right: 0, textStyle: { color: '#a1a1aa' }, icon: 'circle' },
      grid: { top: 30, right: 10, bottom: 70, left: 35 , containLabel: true },
      dataZoom: [{ type: 'inside' }],
      xAxis: { ...AXIS_STYLE, type: 'category', data: labels, axisLabel: { ...AXIS_STYLE.axisLabel, rotate: 45 } },
      yAxis: { ...AXIS_STYLE, type: 'value', min: 0, max: 100 },
      series: series
    };
  }, [mappedData, isCompare, globalAsset]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === -1) setSortDir(1);
      else if (sortDir === 1) setSortDir(0);
      else setSortDir(-1);
    } else {
      setSortCol(col);
      setSortDir(-1);
    }
  };

  const renderTh = (colId: string, label: string, cls: string = '') => {
    const isActive = sortCol === colId && sortDir !== 0;
    const style: React.CSSProperties = isActive 
      ? { color: 'var(--text-1)', background: 'var(--bg-hover)', borderBottom: '2px solid var(--accent)', cursor: 'pointer' }
      : { cursor: 'pointer' };
    
    let sortInd = '';
    if (isActive) {
      sortInd = sortDir === -1 ? ' ↓' : ' ↑';
    }

    return (
      <th className={`${cls} hlfirst-sort-btn`} style={style} onClick={() => handleSort(colId)}>
        {label}{sortInd}
      </th>
    );
  };

  const showNq = globalAsset === 'both' || globalAsset === 'nq';
  const showEs = globalAsset === 'both' || globalAsset === 'es';
  const showAvg = globalAsset === 'both';

  return (
    <div className="page active" id="page-hl_first">
      <div className="grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="dot" style={{background:'var(--accent)'}}></div> High / Low Sequence & Close Position Explorer</div>
            <CustomDropdown 
              label="Sequence:" 
              options={[
                {value: 'break_high_first', label: 'Break High 1st'},
                {value: 'break_low_first', label: 'Break Low 1st'},
                {value: 'low_first_break_high', label: 'Low 1st → Break High'},
                {value: 'high_first_break_low', label: 'High 1st → Break Low'},
                {value: 'combined_opp', label: 'Combined Opposite'},
                {value: 'compare_both', label: 'Compare High vs Low'}
              ]} 
              value={target} 
              onChange={(val) => { setTarget(val); setSortDir(0); setQSort('time'); }} 
            />
            <CustomDropdown 
              label="Close:" 
              options={[
                {value: 'none', label: 'All Closes'},
                {value: '25%', label: 'Top/Bot 25%'},
                {value: '30%', label: 'Top/Bot 30%'},
                {value: '35%', label: 'Top/Bot 35%'},
                {value: '40%', label: 'Top/Bot 40%'},
                {value: '45%', label: 'Top/Bot 45%'},
                {value: '50%', label: 'Top/Bot 50%'}
              ]} 
              value={closePosTh} 
              onChange={(val) => { setClosePosTh(val); setSortDir(0); setQSort('time'); }} 
            />
            <CustomDropdown 
              label="Sort By:" 
              options={[
                {value: 'time', label: 'Time'},
                {value: 'high_desc', label: 'High Break % ↓'},
                {value: 'low_desc', label: 'Low Break % ↓'},
                {value: 'low_first_edge', label: 'Low 1st Edge ↓'},
                {value: 'high_first_edge', label: 'High 1st Edge ↓'},
                {value: 'skew_desc', label: 'Direction Skew ↓'},
                {value: 'count_desc', label: 'Samples ↓'}
              ]} 
              value={qSort} 
              onChange={(val) => { setQSort(val); setSortDir(0); }} 
            />
          </div>
          <div className="card-body">
            <EChart options={chartOptions} style={{height: 400}} />
          </div>
        </div>
        <div className="card">
          <div className="card-body dense table-wrap">
            <table>
              <thead>
                <tr>
                  {renderTh('Window', 'Window')}
                  {isCompare ? (
                    <>
                      {showNq && <>{renderTh('nq_high', 'NQ High %', 'r')}{renderTh('nq_low', 'NQ Low %', 'r')}</>}
                      {showEs && <>{renderTh('es_high', 'ES High %', 'r')}{renderTh('es_low', 'ES Low %', 'r')}</>}
                      {showAvg && <>{renderTh('avg_high', 'Avg High %', 'r')}{renderTh('avg_low', 'Avg Low %', 'r')}</>}
                      {renderTh('tot', 'Samples', 'r')}
                    </>
                  ) : (
                    <>
                      {showNq && <>{renderTh('nq', 'NQ Prob %', 'r')}{renderTh('nq_tot', 'NQ Samples', 'r')}</>}
                      {showEs && <>{renderTh('es', 'ES Prob %', 'r')}{renderTh('es_tot', 'ES Samples', 'r')}</>}
                      {showAvg && <>{renderTh('avg', 'Avg %', 'r')}{renderTh('delta', 'Δ (NQ-ES)', 'r')}</>}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {mappedData.map(d => {
                  const dc = d.delta > 0 ? 'c-dn' : d.delta < 0 ? 'c-up' : '';
                  const bg = d.avg > 75 ? 'hl' : '';
                  return (
                    <tr key={d.Window} className={bg}>
                      <td className="c-mono">{d.Window}</td>
                      {isCompare ? (
                        <>
                          {showNq && <><td className="r c-mono" style={{color:'#10b981'}}>{d.nq_high.toFixed(1)}%</td><td className="r c-mono" style={{color:'#ef4444'}}>{d.nq_low.toFixed(1)}%</td></>}
                          {showEs && <><td className="r c-mono" style={{color:'#10b981'}}>{d.es_high.toFixed(1)}%</td><td className="r c-mono" style={{color:'#ef4444'}}>{d.es_low.toFixed(1)}%</td></>}
                          {showAvg && <><td className="r c-mono" style={{color:'#10b981'}}>{d.avg_high.toFixed(1)}%</td><td className="r c-mono" style={{color:'#ef4444'}}>{d.avg_low.toFixed(1)}%</td></>}
                          <td className="r c-mono" style={{color:'var(--text-3)', fontSize:'11px'}}>{d.tot}</td>
                        </>
                      ) : (
                        <>
                          {showNq && <><td className="r c-mono">{d.nq.toFixed(1)}</td><td className="r c-mono" style={{color:'var(--text-3)', fontSize:'11px'}}>{d.nq_tot}</td></>}
                          {showEs && <><td className="r c-mono">{d.es.toFixed(1)}</td><td className="r c-mono" style={{color:'var(--text-3)', fontSize:'11px'}}>{d.es_tot}</td></>}
                          {showAvg && <><td className="r c-mono">{d.avg.toFixed(1)}</td><td className={`r c-mono ${dc}`}>{d.delta > 0 ? '+' : ''}{d.delta.toFixed(1)}</td></>}
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HlFirstTab;
