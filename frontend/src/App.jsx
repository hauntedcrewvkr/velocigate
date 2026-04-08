import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  ShieldAlert, 
  UserX, 
  RefreshCw, 
  Zap, 
  Bomb, 
  Trash2, 
  Clock 
} from 'lucide-react';
import './index.scss';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
if (import.meta.env.PROD && !API_URL) {
  // In production, if no URL is provided, we use relative paths (same domain)
  axios.defaults.baseURL = '';
} else {
  axios.defaults.baseURL = API_URL;
}

const Countdown = ({ expiresAt, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculate = () => Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
    setTimeLeft(calculate());

    const timer = setInterval(() => {
      const remaining = calculate();
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        onComplete();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onComplete]);

  if (timeLeft <= 0) return <span style={{ color: 'var(--success)' }}>Ready</span>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  
  return (
    <span style={{ fontFamily: 'monospace' }}>
      {mins}:{secs < 10 ? '0' : ''}{secs}
    </span>
  );
};

function App() {
  const [stats, setStats] = useState({
    totalRequests24h: 0,
    blockedRequests24h: 0,
    topOffenders: [],
    activeBans: 0,
    activeBansList: []
  });
  const [usage, setUsage] = useState({
    status: '...',
    uptime: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastLog, setLastLog] = useState(null);
  const [isAttacking, setIsAttacking] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, usageRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/debug/usage')
      ]);
      setStats(statsRes.data);
      setUsage(usageRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Poll every 2s instead of 5s
    return () => clearInterval(interval);
  }, []);

  const triggerTest = async (endpoint = '/api/resource') => {
    try {
      const res = await axios.get(endpoint);
      setLastLog({ status: 200, message: 'Allowed: ' + endpoint });
    } catch (err) {
      const msg = err.response?.data?.message || 'Blocked: ' + endpoint;
      const retry = err.response?.data?.retryAfterSeconds;
      setLastLog({ 
        status: err.response?.status || 500, 
        message: retry ? `${msg} (Wait ${retry}s)` : msg 
      });
    }
    fetchData();
  };

  const simulateAttack = async () => {
    setIsAttacking(true);
    setLastLog({ status: '...', message: 'Simulating burst (60 reqs)...' });
    
    for (let i = 0; i < 60; i++) {
      axios.get('/api/resource').catch(() => {});
      if (i % 15 === 0) await new Promise(r => setTimeout(r, 100));
    }
    
    setTimeout(() => {
      setIsAttacking(false);
      fetchData();
      setLastLog({ status: 'DONE', message: 'Attack Simulation Complete' });
    }, 200); // Reduce from 1000ms to 200ms
  };

  const clearData = async () => {
    if (!window.confirm('Clear all logs and bans?')) return;
    try {
      await axios.post('/admin/clear');
      setLastLog({ status: 'CLEARED', message: 'All data wiped' });
      fetchData();
    } catch (err) {
      console.error('Clear error:', err);
    }
  };

  const formatUptime = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <h1>VELOCIGATE</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Velocigate: Live Security Monitor</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn-test" 
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '0.75rem' }} 
            onClick={clearData}
            title="Clear all logs"
            aria-label="Clear all logs and bans"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
          <button className="btn-test" style={{ background: isAttacking ? 'var(--danger)' : '#4b5563' }} onClick={simulateAttack} disabled={isAttacking} aria-label="Simulate a burst attack">
            <Bomb size={16} style={{ display: 'inline', marginRight: '8px' }} aria-hidden="true" />
            {isAttacking ? 'Attacking...' : 'Simulate Attack'}
          </button>
          <button className="btn-test" onClick={() => triggerTest()} aria-label="Send a normal test request">
            <Zap size={16} style={{ display: 'inline', marginRight: '8px' }} aria-hidden="true" />
            Normal Test
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="card">
          <div className="card-label"><Activity size={16} aria-hidden="true" /> Total Req (24h)</div>
          <div className="card-value">{stats.totalRequests24h}</div>
        </div>
        <div className="card">
          <div className="card-label" style={{ color: 'var(--danger)' }}><ShieldAlert size={16} aria-hidden="true" /> Blocked</div>
          <div className="card-value" style={{ color: 'var(--danger)' }}>{stats.blockedRequests24h}</div>
        </div>
        <div className="card">
          <div className="card-label"><UserX size={16} aria-hidden="true" /> Active Bans</div>
          <div className="card-value">{stats.activeBans}</div>
        </div>
      </div>

      <div className="main-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="table-container">
            <div className="table-header" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} aria-hidden="true" /> Active Temporary Bans
            </div>
            <table>
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Time Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.activeBansList.map((ban, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace' }}>{ban.id}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{ban.reason}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: '600', fontFamily: 'monospace' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} aria-hidden="true" />
                      <Countdown expiresAt={ban.expiresAt} onComplete={fetchData} />
                    </td>
                    <td>
                      <span className="status-badge status-warn">BANNED</span>
                    </td>
                  </tr>
                ))}
                {stats.activeBansList.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No active bans.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-container">
            <div className="table-header">Top Active IPs (24h)</div>
            <table>
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Count</th>
                  <th>Limit Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.topOffenders.map((ip, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace' }}>{ip._id}</td>
                    <td>{ip.count}</td>
                    <td>
                      <span className={`status-badge ${ip.count > 30 ? 'status-warn' : 'status-ok'}`}>
                        {ip.count > 30 ? 'Over Limit' : 'Within Limit'}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.topOffenders.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No traffic logs.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-label"><RefreshCw size={16} aria-hidden="true" /> System Info</div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status</span>
              <span style={{ color: 'var(--success)' }}>{usage.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Uptime</span>
              <span>{formatUptime(usage.uptime)}</span>
            </div>
            {lastLog && (
              <div style={{ 
                padding: '1rem', 
                background: lastLog.status === 200 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${lastLog.status === 200 ? 'var(--success)' : 'var(--danger)'}`
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Last Test Status</div>
                <div style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{lastLog.status} {lastLog.message}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-section">
          <h4>Rate Limit Policy</h4>
          <div className="rule-item">
            <span className="rule-label">Strict Limit</span>
            <span className="rule-value">30 req/min</span>
          </div>
          <div className="rule-item">
            <span className="rule-label">1st Violation</span>
            <span className="rule-value">1 Min Ban</span>
          </div>
          <div className="rule-item">
            <span className="rule-label">Subsequent</span>
            <span className="rule-value">5 Min Ban</span>
          </div>
        </div>

        <div className="footer-section">
          <h4>Unblocking & Cooldown</h4>
          <div className="rule-item">
            <span className="rule-label">Standard Block</span>
            <span className="rule-value">60 Seconds</span>
          </div>
          <div className="rule-item">
            <span className="rule-label">Sliding Window</span>
            <span className="rule-value">1 Minute</span>
          </div>
          <p style={{ marginTop: '0.5rem' }}>Limits automatically reset once the <b>Sliding Window</b> clears.</p>
        </div>

        <div className="footer-section">
          <h4>API Usage</h4>
          <p style={{ marginBottom: '0.5rem' }}>Default identification is based on <b>IP Address</b>.</p>
          <p>Requests are logged and monitored in real-time.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
