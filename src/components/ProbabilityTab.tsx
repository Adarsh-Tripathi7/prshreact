import React, { useMemo, useState } from 'react';
import EChart from './EChart';
import type { DataPayload } from '../types';

interface ProbabilityTabProps {
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

const ProbabilityTab: React.FC<ProbabilityTabProps> = ({ data, globalAsset }) => {
  const [sortCol, setSortCol] = useState<string>('Window');
  const [sortDir, setSortDir] = useState<-1 | 0 | 1>(0);

  const mappedData = useMemo(() => {
    let arr = data.prob.map(d => {
      const n = d.NQ_DB_Prob;
      const e = d.ES_DB_Prob;
      return { 
        Window: d.Window, 
        nq: n, 
        es: e, 
        avg: n !== undefined && e !== undefined ? (n + e) / 2 : 0, 
        delta: n !== undefined && e !== undefined ? (n - e) : 0 
      };
    }).filter(d => d.nq !== undefined && d.es !== undefined);

    if (sortDir !== 0) {
      arr.sort((a, b) => {
        const vA = (a as any)[sortCol];
        const vB = (b as any)[sortCol];
        if (sortCol === 'Window') return vA.localeCompare(vB) * sortDir;
        return (vA - vB) * sortDir;
      });
    }
    return arr;
  }, [data.prob, sortCol, sortDir]);

  const chartProbFullOptions = useMemo(() => {
    const labels = mappedData.map(d => d.Window);
    const nqVals = mappedData.map(d => d.nq);
    const esVals = mappedData.map(d => d.es);
    
    const series: any[] = [];
    if (globalAsset === 'both' || globalAsset === 'nq') {
      series.push({ name: 'NQ', type: 'line', data: nqVals, smooth: 0.3, symbolSize: 6, lineStyle: { width: 3, color: '#6366f1' }, itemStyle: { color: '#6366f1' } });
    }
    if (globalAsset === 'both' || globalAsset === 'es') {
      series.push({ name: 'ES', type: 'line', data: esVals, smooth: 0.3, symbolSize: 6, lineStyle: { width: 3, color: '#38bdf8' }, itemStyle: { color: '#38bdf8' } });
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
  }, [mappedData, globalAsset]);

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
      <th className={`${cls} prob-sort-btn`} style={style} onClick={() => handleSort(colId)}>
        {label}{sortInd}
      </th>
    );
  };

  const showNq = globalAsset === 'both' || globalAsset === 'nq';
  const showEs = globalAsset === 'both' || globalAsset === 'es';
  const showAvg = globalAsset === 'both';

  return (
    <div className="page active" id="page-probability">
      <div className="grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><div className="dot" style={{background:'var(--accent)'}}></div> DB Probability Explorer</div>
          </div>
          <div className="card-body">
            <EChart options={chartProbFullOptions} style={{height: 400}} />
          </div>
        </div>
        <div className="card">
          <div className="card-body dense table-wrap">
            <table>
              <thead>
                <tr>
                  {renderTh('Window', 'Window')}
                  {showNq && renderTh('nq', 'NQ %', 'r')}
                  {showEs && renderTh('es', 'ES %', 'r')}
                  {showAvg && (
                    <>
                      {renderTh('avg', 'Avg', 'r')}
                      {renderTh('delta', 'Δ', 'r')}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {mappedData.map(d => {
                  const dc = d.delta > 0 ? 'c-dn' : 'c-up';
                  const bg = d.avg > 75 ? 'hl' : '';
                  return (
                    <tr key={d.Window} className={bg}>
                      <td className="c-mono">{d.Window}</td>
                      {showNq && <td className="r c-mono">{d.nq.toFixed(1)}</td>}
                      {showEs && <td className="r c-mono">{d.es.toFixed(1)}</td>}
                      {showAvg && (
                        <>
                          <td className="r c-mono">{d.avg.toFixed(1)}</td>
                          <td className={`r c-mono ${dc}`}>
                            {d.delta > 0 ? '+' : ''}{d.delta.toFixed(1)}
                          </td>
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

export default ProbabilityTab;
