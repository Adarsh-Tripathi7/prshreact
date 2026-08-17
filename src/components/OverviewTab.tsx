import React, { useMemo } from 'react';
import EChart from './EChart';
import type { DataPayload } from '../types';

interface OverviewTabProps {
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

const OverviewTab: React.FC<OverviewTabProps> = ({ data, globalAsset }) => {
  // KPI Logic
  const kpi = useMemo(() => {
    let minP = 100, maxP = 0, minW = '', maxW = '', sumP = 0, validCount = 0;
    data.prob.forEach(d => {
      let a;
      if (globalAsset === 'both') a = (d.NQ_DB_Prob + d.ES_DB_Prob) / 2;
      else if (globalAsset === 'nq') a = d.NQ_DB_Prob;
      else a = d.ES_DB_Prob;
      
      if (a !== undefined && !isNaN(a)) {
        if (a < minP) { minP = a; minW = d.Window; }
        if (a > maxP) { maxP = a; maxW = d.Window; }
        sumP += a;
        validCount++;
      }
    });
    const avgP = validCount > 0 ? (sumP / validCount) : 0;
    return { minP, minW, maxP, maxW, avgP, count: data.prob.length };
  }, [data.prob, globalAsset]);

  // DB Probability Chart Options
  const chartProbOptions = useMemo(() => {
    const labels = data.prob.map(d => d.Window);
    const nq = data.prob.map(d => d.NQ_DB_Prob);
    const es = data.prob.map(d => d.ES_DB_Prob);
    
    const seriesProb: any[] = [];
    if (globalAsset === 'both' || globalAsset === 'nq') {
      seriesProb.push({ name: 'NQ', type: 'line', data: nq, smooth: 0.4, symbol: 'none', lineStyle: { width: 3, color: '#6366f1' }, areaStyle: { color: 'rgba(99,102,241,0.1)' } });
    }
    if (globalAsset === 'both' || globalAsset === 'es') {
      seriesProb.push({ name: 'ES', type: 'line', data: es, smooth: 0.4, symbol: 'none', lineStyle: { width: 3, color: '#38bdf8' } });
    }

    return {
      tooltip: { ...TT, trigger: 'axis' }, 
      legend: { top: 0, right: 0, textStyle: { color: '#a1a1aa' }, icon: 'circle' },
      grid: { top: 30, right: 10, bottom: 70, left: 35 , containLabel: true },
      xAxis: { ...AXIS_STYLE, type: 'category', data: labels, axisLabel: { ...AXIS_STYLE.axisLabel, rotate: 45 } },
      yAxis: { ...AXIS_STYLE, type: 'value', min: 20 },
      series: seriesProb
    };
  }, [data.prob, globalAsset]);

  // Median Extension Chart Options
  const chartMedExtOptions = useMemo(() => {
    const seriesExt: any[] = [];
    let extLabels: string[] = [];
    
    if (globalAsset === 'both' || globalAsset === 'nq') {
      const nqDB = data.ext.nq?.double_break?.combined || [];
      const nqSB = data.ext.nq?.single_break?.combined || [];
      extLabels = nqDB.map(d => d.Window);
      seriesExt.push({ name: 'NQ Double', type: 'bar', data: nqDB.map(d => d['50%']), itemStyle: { color: '#ef4444', borderRadius: [4,4,0,0] } });
      seriesExt.push({ name: 'NQ Single', type: 'bar', data: nqSB.map(d => d['50%']), itemStyle: { color: '#10b981', borderRadius: [4,4,0,0] } });
    }
    if (globalAsset === 'both' || globalAsset === 'es') {
      const esDB = data.ext.es?.double_break?.combined || [];
      const esSB = data.ext.es?.single_break?.combined || [];
      if (!extLabels.length) extLabels = esDB.map(d => d.Window);
      seriesExt.push({ name: 'ES Double', type: 'bar', data: esDB.map(d => d['50%']), itemStyle: { color: '#fca5a5', borderRadius: [4,4,0,0] } });
      seriesExt.push({ name: 'ES Single', type: 'bar', data: esSB.map(d => d['50%']), itemStyle: { color: '#6ee7b7', borderRadius: [4,4,0,0] } });
    }

    return {
      tooltip: { ...TT, trigger: 'axis' }, 
      legend: { top: 0, right: 0, textStyle: { color: '#a1a1aa' }, icon: 'roundRect' },
      grid: { top: 30, right: 10, bottom: 70, left: 35 , containLabel: true },
      xAxis: { ...AXIS_STYLE, type: 'category', data: extLabels, axisLabel: { ...AXIS_STYLE.axisLabel, rotate: 45 } },
      yAxis: { ...AXIS_STYLE, type: 'value' },
      series: seriesExt
    };
  }, [data.ext, globalAsset]);

  return (
    <>
      <div className="kpi-strip">
        <div className="kpi-card"><div className="kpi-label">Windows</div><div className="kpi-value">{kpi.count}</div><div className="kpi-sub">Total Analyzed</div></div>
        <div className="kpi-card"><div className="kpi-label" style={{color:'var(--up)'}}>Lowest Chop</div><div className="kpi-value">{kpi.minP.toFixed(1)}%</div><div className="kpi-sub">{kpi.minW}</div></div>
        <div className="kpi-card"><div className="kpi-label" style={{color:'var(--dn)'}}>Max Fakeout</div><div className="kpi-value">{kpi.maxP.toFixed(1)}%</div><div className="kpi-sub">{kpi.maxW}</div></div>
        <div className="kpi-card"><div className="kpi-label" style={{color:'var(--accent)'}}>Avg Prob</div><div className="kpi-value">{kpi.avgP.toFixed(1)}%</div><div className="kpi-sub">Overall Baseline</div></div>
      </div>

      <div className="page active" id="page-overview">
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title"><div className="dot" style={{background:'var(--dn)'}}></div> DB Probability (Combined)</div></div>
            <div className="card-body">
              <EChart options={chartProbOptions} className="echart" />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><div className="dot" style={{background:'var(--up)'}}></div> Median Extension</div></div>
            <div className="card-body">
              <EChart options={chartMedExtOptions} className="echart" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
