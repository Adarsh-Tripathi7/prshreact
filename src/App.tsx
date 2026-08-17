import { useState, useEffect, useMemo } from 'react'
import './index.css'
import type { DataPayload } from './types'
import OverviewTab from './components/OverviewTab'
import ProbabilityTab from './components/ProbabilityTab'
import HlFirstTab from './components/HlFirstTab'
import ExtensionsTab from './components/ExtensionsTab'
import HeatmapTab from './components/HeatmapTab'

const timeframes = [
  '7m', '7m_1m_step', '10m', 
  '15m', '15m_step', '30m', 
  '30m_15m_step', '30m_1m_step', '45m', '60m', '120m'
];

function isRTH(winStr: string) {
  if (!winStr) return false;
  const start = winStr.split('-')[0];
  return start >= "09:30" && start < "16:00";
}

function App() {
  const [tf, setTf] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tf') || '60m';
  });

  const [globalAsset, setGlobalAsset] = useState<'both'|'nq'|'es'>(() => {
    return (localStorage.getItem('prsh_global_asset') as 'both'|'nq'|'es') || 'both';
  });

  const [globalSession, setGlobalSession] = useState<'all'|'rth'|'overnight'>(() => {
    return (localStorage.getItem('prsh_global_session') as 'all'|'rth'|'overnight') || 'all';
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('prsh_active_tab') || 'overview';
  });

  const [rawData, setRawData] = useState<DataPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/data/${tf}.json`);
        const data = await res.json();
        setRawData(data);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setTimeout(() => setLoading(false), 100);
      }
    };
    fetchData();
    window.history.pushState(null, '', `?tf=${tf}`);
  }, [tf]);

  useEffect(() => {
    localStorage.setItem('prsh_global_asset', globalAsset);
  }, [globalAsset]);

  useEffect(() => {
    localStorage.setItem('prsh_global_session', globalSession);
  }, [globalSession]);

  useEffect(() => {
    localStorage.setItem('prsh_active_tab', activeTab);
  }, [activeTab]);

  const filteredData = useMemo(() => {
    if (!rawData) return null;
    
    const filterArr = (arr: any[]) => {
      if (!arr) return [];
      if (globalSession === 'all') return [...arr];
      return arr.filter(d => {
        if (!d.Window) return true;
        const rth = isRTH(d.Window);
        return globalSession === 'rth' ? rth : !rth;
      });
    };

    const newData: DataPayload = {
      prob: filterArr(rawData.prob),
      prob_first: filterArr(rawData.prob_first),
      corr: filterArr(rawData.corr || []),
      close_pos: filterArr(rawData.close_pos || []),
      ext: { nq: { double_break: { combined: [], high_first: [], low_first: [] }, single_break: { combined: [], high_first: [], low_first: [] }, all_breaks: { combined: [], high_first: [], low_first: [] } }, es: { double_break: { combined: [], high_first: [], low_first: [] }, single_break: { combined: [], high_first: [], low_first: [] }, all_breaks: { combined: [], high_first: [], low_first: [] } } }
    };

    if (rawData.ext) {
      for (const asset of ['nq', 'es'] as const) {
        for (const btype of ['double_break', 'single_break', 'all_breaks'] as const) {
          if (!rawData.ext[asset]?.[btype]) continue;
          for (const dir of ['combined', 'high_first', 'low_first'] as const) {
            if (rawData.ext[asset][btype][dir]) {
              newData.ext[asset][btype][dir] = filterArr(rawData.ext[asset][btype][dir]);
            }
          }
        }
      }
    }
    return newData;
  }, [rawData, globalSession]);

  const cycleTimeframe = () => {
    let idx = timeframes.indexOf(tf);
    if (idx === -1) idx = 0;
    setTf(timeframes[(idx + 1) % timeframes.length]);
  };

  const cycleAsset = () => {
    if (globalAsset === 'both') setGlobalAsset('nq');
    else if (globalAsset === 'nq') setGlobalAsset('es');
    else setGlobalAsset('both');
  };

  const cycleSession = () => {
    if (globalSession === 'all') setGlobalSession('rth');
    else if (globalSession === 'rth') setGlobalSession('overnight');
    else setGlobalSession('all');
  };

  return (
    <>
      <header className="app-bar">
        <div style={{display:'flex', alignItems:'center', flexWrap: 'wrap', gap: '8px'}}>
          <a href="/" className="brand" aria-label="Go to Home" style={{marginRight:0}}>
            <svg className="prsh-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeWidth="2"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeWidth="2"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12" strokeWidth="2"></line>
            </svg>
            Prsh <span style={{fontWeight:400, color:'var(--text-3)', marginLeft:'4px'}}>Capital</span>
          </a>
          <div style={{display:'flex', flexWrap: 'wrap', gap:'6px', marginLeft:'4px'}}>
            <button className="time-badge" onClick={cycleTimeframe}>
              {tf.toUpperCase().replace(/_1M_STEP/g, ' / 1M STEP').replace(/_15M_STEP/g, ' / 15M STEP')}
            </button>
            <button className="asset-badge" onClick={cycleAsset}>
              {globalAsset === 'both' ? 'NQ | ES' : globalAsset.toUpperCase()}
            </button>
            <button className="asset-badge" style={{background:'var(--border)'}} onClick={cycleSession}>
              {globalSession === 'all' ? 'ALL' : (globalSession === 'rth' ? 'RTH' : 'ETH')}
            </button>
          </div>
        </div>
        <nav className="desktop-nav" role="tablist" aria-label="Dashboard Views" style={{marginLeft:'auto', marginRight:'24px'}}>
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')} role="tab">Overview</button>
          <button className={activeTab === 'probability' ? 'active' : ''} onClick={() => setActiveTab('probability')} role="tab">DB %</button>
          <button className={activeTab === 'hl_first' ? 'active' : ''} onClick={() => setActiveTab('hl_first')} role="tab">H/L First</button>
          <button className={activeTab === 'extensions' ? 'active' : ''} onClick={() => setActiveTab('extensions')} role="tab">Extensions</button>
          <button className={activeTab === 'heatmap' ? 'active' : ''} onClick={() => setActiveTab('heatmap')} role="tab">Heatmap</button>
        </nav>
      </header>

      <div className="container">
        {filteredData && activeTab === 'overview' && <OverviewTab data={filteredData} globalAsset={globalAsset} />}
        {filteredData && activeTab === 'probability' && <ProbabilityTab data={filteredData} globalAsset={globalAsset} />}
        {filteredData && activeTab === 'hl_first' && <HlFirstTab data={filteredData} globalAsset={globalAsset} />}
        {filteredData && activeTab === 'extensions' && <ExtensionsTab data={filteredData} globalAsset={globalAsset} />}
        {filteredData && activeTab === 'heatmap' && <HeatmapTab data={filteredData} globalAsset={globalAsset} />}
      </div>

      <nav className="bottom-nav" role="tablist" aria-label="Mobile Dashboard Views">
        <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} role="tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Overview</button>
        <button className={`nav-btn ${activeTab === 'probability' ? 'active' : ''}`} onClick={() => setActiveTab('probability')} role="tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 20V10M12 20V4M6 20v-6"></path></svg> DB %</button>
        <button className={`nav-btn ${activeTab === 'hl_first' ? 'active' : ''}`} onClick={() => setActiveTab('hl_first')} role="tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18M3 12h18"/></svg> H/L First</button>
        <button className={`nav-btn ${activeTab === 'extensions' ? 'active' : ''}`} onClick={() => setActiveTab('extensions')} role="tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Ext</button>
        <button className={`nav-btn ${activeTab === 'heatmap' ? 'active' : ''}`} onClick={() => setActiveTab('heatmap')} role="tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg> Heatmap</button>
      </nav>

      {loading && (
        <div id="loader" className="active">
          <div className="spinner"></div>
          <div className="loader-text">Loading Data...</div>
        </div>
      )}
    </>
  )
}

export default App
