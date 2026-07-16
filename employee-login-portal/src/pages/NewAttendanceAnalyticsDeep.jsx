import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from './Sidebar';
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie, BarChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap
} from 'recharts';
import AttendanceRiskOverview from './AttendanceRiskOverview';
import './AttendanceAnalyticsDeep.css';

/* ─── helpers ──────────────────────────────────────────────── */
const fmtDate = d => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};
const startOfMonth = () => { const d = new Date(); return fmtDate(new Date(d.getFullYear(), d.getMonth(), 1)); };
const endOfToday = () => fmtDate(new Date());
const startOfWeek = () => {
  const d = new Date(); const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return fmtDate(new Date(d.getFullYear(), d.getMonth(), diff));
};
const startOfLastMonth = () => { const d = new Date(); return fmtDate(new Date(d.getFullYear(), d.getMonth() - 1, 1)); };
const endOfLastMonth = () => { const d = new Date(); return fmtDate(new Date(d.getFullYear(), d.getMonth(), 0)); };
const startOfQuarter = () => {
  const d = new Date(); const q = Math.floor(d.getMonth() / 3) * 3;
  return fmtDate(new Date(d.getFullYear(), q, 1));
};

const STATUS_COLORS = { ON_TIME: '#00A4B0', LATE: '#00C1D0', WFH: '#2A3D73', ABSENT: '#01144A' };
const DONUT_COLORS = ['#00A4B0', '#01144A', '#00C1D0', '#2A3D73', '#60a5fa'];

const fmtHM = h => {
  if (!h && h !== 0) return '0h 0m';
  return `${Math.floor(h)}h ${Math.round((h - Math.floor(h)) * 60)}m`;
};

const getTimelineStyle = (login, logout) => {
  if (!login || !logout) return { left: '0%', width: '0%', startPct: 0, endPct: 0 };
  try {
    const toMins = t => {
      const clean = t.trim().toLowerCase();
      const isPm = clean.includes('pm');
      const timePart = clean.replace(/(am|pm)/, '').trim();
      let [h, m] = timePart.split(':').map(Number);
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      return h * 60 + (m || 0);
    };
    const start = toMins(login);
    let end = toMins(logout);
    if (end < start) end += 24 * 60; // handle crossing midnight if any

    // Window: 9AM (540) to 6PM (1080)
    const windowStart = 540;
    const windowEnd = 1080;
    const windowMins = windowEnd - windowStart;

    let leftPct = Math.max(0, Math.min(100, ((start - windowStart) / windowMins) * 100));
    let rightPct = Math.max(0, Math.min(100, ((end - windowStart) / windowMins) * 100));
    let widthPct = Math.max(0, rightPct - leftPct);

    return { left: `${leftPct}%`, width: `${widthPct}%`, startPct: leftPct, endPct: rightPct };
  } catch (e) {
    return { left: '0%', width: '0%', startPct: 0, endPct: 0 };
  }
};


const LightTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(8px)',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '8px 11px',
      fontSize: "1vw",
      boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.05), 0 6px 8px -5px rgba(0, 0, 0, 0.05)',
      color: '#0f172a'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => {
        const isHour = p.name.toLowerCase().includes('hour') || p.name.toLowerCase().includes('hrs');
        const formattedValue = (isHour && typeof p.value === 'number') ? fmtHM(p.value) : (typeof p.value === 'number' ? p.value.toFixed(1) : p.value);
        return (
          <div key={i} style={{ color: '#475569', marginBottom: 2 }}>
            {p.name}: <strong style={{ color: '#0f172a' }}>{formattedValue}</strong>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Collapsible Section ──────────────────────────────────── */
const Section = ({ icon, title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="aad-section">
      <div className="aad-section-header" onClick={() => setOpen(!open)}>
        <h3 className="aad-section-title">
          <span className="aad-section-icon"><i className={`bi ${icon}`} /></span>
          {title}
        </h3>
        <span className={`aad-section-toggle ${open ? '' : 'collapsed'}`}>
          <i className="bi bi-chevron-down" />
        </span>
      </div>
      {open && <div className="aad-section-body">{children}</div>}
    </div>
  );
};

/* ─── Consistency Score ring progress ─── */
const ConsistencyScore = ({ score }) => {
  const radius = 34;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#10b981';
  if (score < 60) color = '#ef4444';
  else if (score < 80) color = '#f59e0b';

  return (
    <div className="aad-consistency-wrapper">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(0,0,0,0.06)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          fill="#1c2536"
          fontSize="13"
          fontWeight="600"
        >
          {score}%
        </text>
      </svg>
      <div className="aad-consistency-text">
        <span className="aad-consistency-status" style={{ color, fontSize: "1vw", fontWeight: 700 }}>
          {score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 60 ? 'Average' : 'Critical'}
        </span>
      </div>
    </div>
  );
};



/* ─── Exceptions & Alerts Feed ─── */
const ExceptionsFeed = ({ logs, anomalies }) => {
  const missedLogouts = React.useMemo(() => {
    return (logs || []).filter(l => l.loginTime && !l.logoutTime && l.status !== 'ABSENT' && l.status !== 'LEAVE');
  }, [logs]);

  const deficitDays = React.useMemo(() => {
    return (logs || []).filter(l => l.status !== 'LEAVE' && l.status !== 'ABSENT' && l.effectiveHours > 0 && l.effectiveHours < 8.0);
  }, [logs]);

  const observations = React.useMemo(() => {
    return (anomalies || []).filter(a => a.type === 'CONSECUTIVE_LATE' || a.type === 'OVERWORK');
  }, [anomalies]);

  const actionItemsCount = missedLogouts.length + (anomalies || []).filter(a => a.type === 'ZERO_HOURS').length;

  return (
    <div className="aad-exceptions-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="aad-exceptions-header">
        <h4 className="aad-exceptions-title">
          <i className="bi bi-exclamation-octagon me-2" />
          Exceptions & Actions ({actionItemsCount + observations.length})
        </h4>
      </div>
      <div className="aad-exceptions-body" style={{ overflowY: 'auto' }}>
        {actionItemsCount > 0 && (
          <div className="exception-group action-needed">
            <h5 className="group-title text-danger">
              <i className="bi bi-shield-fill-exclamation me-1" />
              Action Required ({actionItemsCount})
            </h5>
            {missedLogouts.map((l, i) => (
              <div key={`ml-${i}`} className="exception-item">
                <span className="badge-err">Missed Logout</span>
                <span className="msg"><b>{l.employeeName ? l.employeeName.trim() : 'Employee'}</b> - No logout recorded on {l.date} (In: {l.loginTime})</span>
              </div>
            ))}
            {(anomalies || []).filter(a => a.type === 'ZERO_HOURS').map((a, i) => (
              <div key={`zh-${i}`} className="exception-item">
                <span className="badge-err">Zero Hours</span>
                <span className="msg">{a.message} on {a.date.toString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="exception-group observations">
          <h5 className="group-title text-warning">
            <i className="bi bi-info-circle-fill me-1" />
            Insights & Observations ({deficitDays.length + observations.length})
          </h5>
          {deficitDays.map((l, i) => (
            <div key={`df-${i}`} className="exception-item">
              <span className="badge-warn">Work Deficit</span>
              <span className="msg"><b>{l.employeeName ? l.employeeName.trim() : 'Employee'}</b> - Worked only {l.effectiveHours?.toFixed(1) || l.effectiveHours}h ({Math.max(0, 8 - (l.effectiveHours || 0)).toFixed(1)}h deficit) on {l.date}</span>
            </div>
          ))}
          {observations.map((a, i) => (
            <div key={`ob-${i}`} className="exception-item">
              <span className={`badge-obs ${a.severity.toLowerCase()}`}>{a.type.replace('_', ' ')}</span>
              <span className="msg">{a.message}</span>
            </div>
          ))}
          {actionItemsCount === 0 && deficitDays.length === 0 && observations.length === 0 && (
            <div className="aad-empty-state-small">
              <i className="bi bi-check-circle text-success fs-5 d-block mb-1" />
              No issues detected — attendance is 100% compliant!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const BurnoutGauge = ({ value, risk }) => {
  const pct = Math.min(value / 12 * 100, 100); // 12h is max scale
  const color = risk ? '#ef4444' : value > 8.5 ? '#f59e0b' : '#10b981';
  const dashArray = `${pct * 2.51} ${251 - pct * 2.51}`;
  return (
    <div className="aad-gauge-wrapper">
      <svg width="70" height="40" viewBox="0 0 100 55">
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" strokeLinecap="round" />
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={dashArray} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x="50" y="48" textAnchor="middle" fill="#1c2536" fontSize="14" fontWeight="600">{fmtHM(value)}</text>
      </svg>
      {risk && <span style={{ fontSize: "1vw", color: '#ef4444', fontWeight: 600, marginTop: 2 }}>⚠ RISK</span>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TEAM DASHBOARD (IMPORTED)
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   LOCATION INTERACTIVE HEATMAP
   ═══════════════════════════════════════════════════════════════ */
const LocationInteractiveHeatmap = ({ logs, summary }) => {
  const uniqueLogs = useMemo(() => {
    if (!logs) return [];
    const map = new Map();
    logs.forEach(log => {
      const existing = map.get(log.date);
      if (!existing || (!existing.loginTime && log.loginTime)) {
        map.set(log.date, log);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logs]);

  const monthName = uniqueLogs && uniqueLogs.length > 0 ? new Date(uniqueLogs[0].date).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'This Month';
  const [activeLog, setActiveLog] = useState(uniqueLogs && uniqueLogs.length > 0 ? uniqueLogs[uniqueLogs.length - 1] : null);

  useEffect(() => {
    if (uniqueLogs && uniqueLogs.length > 0) {
      setActiveLog(uniqueLogs[uniqueLogs.length - 1]); // Set most recent log by default
    }
  }, [uniqueLogs]);

  if (!uniqueLogs || uniqueLogs.length === 0) return <div className="aad-empty-state">No location data available.</div>;

  return (
    <div className="aad-loc-heatmap-wrapper">
      <div className="aad-location-summary-bar mb-4">
        <div className="aad-loc-stat">
          <span className="aad-loc-stat-val">{summary?.officeCount || 0}</span>
          <span className="aad-loc-stat-lbl">Office Days</span>
        </div>
        <div className="aad-loc-stat">
          <span className="aad-loc-stat-val">{summary?.wfhCount || 0}</span>
          <span className="aad-loc-stat-lbl">WFH Days</span>
        </div>
        <div className="aad-loc-stat">
          <span className="aad-loc-stat-val">{summary?.otherCount || 0}</span>
          <span className="aad-loc-stat-lbl">Other / Travel</span>
        </div>
      </div>

      <div className="aad-loc-heatmap-grid-container">
        <h6 className="aad-loc-heatmap-title">Work Pattern - {monthName}</h6>
        <div className="aad-loc-heatmap-grid">
          {uniqueLogs.map((log, i) => {
            let cellClass = 'loc-cell-empty';
            const loc = (log.workLocation || '').toUpperCase();
            if (log.status === 'ABSENT' || log.status === 'LEAVE') cellClass = 'loc-cell-absent';
            else if (loc === 'OFFICE') cellClass = 'loc-cell-office';
            else if (loc === 'WFH') cellClass = 'loc-cell-wfh';
            else if (loc === 'CLIENT_SITE' || loc === 'ON_SITE' || loc === 'OTHER') cellClass = 'loc-cell-other';
            else if (log.loginTime) cellClass = 'loc-cell-other';

            const isToday = new Date(log.date).toDateString() === new Date().toDateString();
            const isActive = activeLog && activeLog.date === log.date;

            return (
              <div
                key={i}
                className={`aad-loc-cell ${cellClass} ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                onMouseEnter={() => setActiveLog(log)}
                onClick={() => setActiveLog(log)}
              >
                <span className="aad-loc-cell-date">{new Date(log.date).getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="aad-loc-heatmap-legend">
          <span className="leg-item"><div className="leg-box leg-office"></div> Office</span>
          <span className="leg-item"><div className="leg-box leg-wfh"></div> WFH</span>
          <span className="leg-item"><div className="leg-box leg-other"></div> Other/Site</span>
          <span className="leg-item"><div className="leg-box leg-absent"></div> Absent/Leave</span>
        </div>
      </div>

      {activeLog && (
        <div className="aad-loc-active-detail">
          <div className="aad-loc-detail-left">
            <div className="aad-loc-detail-date">
              <span className="aad-ld-day">{activeLog.dayOfWeek?.substring(0, 3)}</span>
              <span className="aad-ld-num">{new Date(activeLog.date).getDate()}</span>
              <span className="aad-ld-mon">{new Date(activeLog.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
            </div>
            <div className="aad-loc-detail-info">
              <div className="aad-ld-loc">
                <i className="bi bi-geo-alt-fill me-2 opacity-75"></i>
                {activeLog.workLocation || (activeLog.status === 'ABSENT' ? 'N/A' : 'Unknown')}
              </div>
              <div className="aad-ld-time">
                {(() => {
                  if (!activeLog.loginTime) return 'No punch data';
                  const isToday = new Date(activeLog.date).toDateString() === new Date().toDateString();
                  const logoutText = activeLog.logoutTime ? activeLog.logoutTime : (isToday ? 'Ongoing' : 'Missed Logout');
                  return (
                    <><i className="bi bi-clock me-1 opacity-50"></i> {activeLog.loginTime} <i className="bi bi-arrow-right mx-1 opacity-50"></i> <span className={logoutText === 'Missed Logout' ? 'text-danger fw-bold' : ''}>{logoutText}</span></>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="aad-loc-detail-right">
            {activeLog.status === 'ABSENT' || activeLog.status === 'LEAVE' ? (
              <span className="badge bg-danger bg-opacity-10 text-danger">{activeLog.status}</span>
            ) : activeLog.status === 'LATE' ? (
              <span className="badge bg-warning bg-opacity-10 text-warning">{activeLog.status}</span>
            ) : (
              <span className="badge bg-success bg-opacity-10 text-success">{activeLog.status || 'PRESENT'}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Removed TeamAnalyticsOverview to use the unified My Analytics blueprint for Team Analytics as well.


const EmployeeActionCenter = ({ employees, onSelect, onQuickView, onOpenExplorer }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(() => {
    if (!employees) return { immediate: [], dropped: [], lates: [], lowHours: [], top: [] };
    
    const cats = { immediate: [], dropped: [], lates: [], lowHours: [], top: [] };
    
    employees.forEach(emp => {
      const h = emp.healthScore || 0;
      const p = emp.punctualityScore || 0;
      const eff = emp.avgEffectiveHours || 0;
      const lates = emp.punctuality?.lateCount || 0;
      const absences = emp.absences || 0;
      
      // Search filter
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchesName = emp.employeeName?.toLowerCase().includes(s);
        if (!matchesName) return;
      }

      if (h < 50 || absences >= 2) {
        cats.immediate.push(emp);
      } else if (lates >= 3) {
        cats.lates.push(emp);
      } else if (eff < 6.5) {
        cats.lowHours.push(emp);
      } else if (h >= 50 && h < 75) {
        cats.dropped.push(emp);
      } else if (h >= 85 && p >= 90) {
        cats.top.push(emp);
      }
    });
    
    return cats;
  }, [employees, searchTerm]);

  const renderCategory = (title, icon, color, list) => {
    if (list.length === 0) return null;
    return (
      <div className="eac-category">
        <h4 className="eac-category-title">
          <span style={{ color }}>{icon}</span> {title} ({list.length})
        </h4>
        <div className="eac-card-grid">
          {list.map(emp => (
            <div key={emp.employeeId} className="eac-card">
              <div className="eac-card-header">
                <div className="eac-avatar">{emp.employeeName?.charAt(0) || 'U'}</div>
                <div className="eac-name">{emp.employeeName}</div>
              </div>
              <ul className="eac-card-stats">
                {emp.healthScore < 50 && <li>Health Score: <span style={{color: '#ef4444'}}>{emp.healthScore.toFixed(1)}%</span></li>}
                {emp.avgEffectiveHours < 6.5 && <li>Avg Hours: <span style={{color: '#f59e0b'}}>{fmtHM(emp.avgEffectiveHours)}</span></li>}
                {emp.punctuality?.lateCount >= 3 && <li>{emp.punctuality.lateCount} Late Arrivals</li>}
                {emp.absences >= 2 && <li>{emp.absences} Absences</li>}
                {emp.healthScore >= 85 && <li>Top Performer (100%)</li>}
              </ul>
              <div className="eac-card-actions">
                <button className="eac-btn-outline" onClick={() => onQuickView(emp)}>Quick View</button>
                <button className="eac-btn-solid" onClick={() => onSelect(emp.employeeId)}>Open Analytics</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="eac-container">
      <div className="eac-header">
        <h3 className="eac-title">Employee Action Center</h3>
        <div className="eac-actions">
          <div className="eac-search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search employee..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="eac-btn-explorer" onClick={onOpenExplorer}>
            🗃️ Open Employee Explorer
          </button>
        </div>
      </div>
      
      {renderCategory('Needs Immediate Attention', '🔴', '#ef4444', categories.immediate)}
      {renderCategory('Attendance Dropped', '🟡', '#f59e0b', categories.dropped)}
      {renderCategory('Frequent Late Arrivals', '🟠', '#f97316', categories.lates)}
      {renderCategory('Low Effective Hours', '🔵', '#3b82f6', categories.lowHours)}
      {renderCategory('Top Performers', '🟢', '#10b981', categories.top)}
      
      {!categories.immediate.length && !categories.dropped.length && !categories.lates.length && !categories.lowHours.length && !categories.top.length && (
        <div className="eac-empty">No employees match the current filters.</div>
      )}
    </div>
  );
};

const EmployeeAnalyticsExplorer = ({ employees, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRiskFilter, setActiveRiskFilter] = useState('All'); // 'All', 'At Risk', 'Needs Attention', 'Stable'
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'healthScore', direction: 'asc' }); // Default sort by lowest health
  const itemsPerPage = 10;

  // Enhance employees with risk status for easier filtering
  const enhancedEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.map(emp => {
      const health = emp.healthScore || 0;
      const riskStatus = health < 50 ? 'At Risk' : (health < 75 ? 'Needs Attention' : 'Stable');
      return { ...emp, health, riskStatus };
    });
  }, [employees]);

  // Filtering
  const filteredEmployees = useMemo(() => {
    return enhancedEmployees.filter(emp => {
      // Risk Filter
      if (activeRiskFilter !== 'All' && emp.riskStatus !== activeRiskFilter) return false;
      
      // Search Filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = emp.employeeName && emp.employeeName.toLowerCase().includes(searchLower);
        const matchesDesig = emp.designation && emp.designation.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDesig) return false;
      }
      return true;
    });
  }, [enhancedEmployees, activeRiskFilter, searchTerm]);

  // Sorting
  const sortedEmployees = useMemo(() => {
    let sortableItems = [...filteredEmployees];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch(sortConfig.key) {
          case 'name':
            aValue = a.employeeName || '';
            bValue = b.employeeName || '';
            break;
          case 'healthScore':
            aValue = a.health;
            bValue = b.health;
            break;
          case 'punctuality':
            aValue = a.punctualityScore || 0;
            bValue = b.punctualityScore || 0;
            break;
          case 'absences':
            aValue = a.absences || 0;
            bValue = b.absences || 0;
            break;
          default:
            aValue = 0;
            bValue = 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredEmployees, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage) || 1;
  const currentEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Status Counts for Tabs
  const counts = useMemo(() => {
    const c = { 'All': enhancedEmployees.length, 'At Risk': 0, 'Needs Attention': 0, 'Stable': 0 };
    enhancedEmployees.forEach(emp => {
      if (c[emp.riskStatus] !== undefined) c[emp.riskStatus]++;
    });
    return c;
  }, [enhancedEmployees]);

  return (
    <div className="aad-employee-explorer" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ color: '#01144A', fontWeight: 700, margin: 0, fontSize: '1.2rem' }}>Employee Analytics Grid</h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Risk Tabs */}
          <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '4px' }}>
            {['All', 'At Risk', 'Needs Attention', 'Stable'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveRiskFilter(tab); setCurrentPage(1); }}
                style={{
                  background: activeRiskFilter === tab ? '#f1f5f9' : 'transparent',
                  color: activeRiskFilter === tab ? '#01144A' : '#64748b',
                  fontWeight: activeRiskFilter === tab ? 600 : 500,
                  border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', gap: '6px', alignItems: 'center'
                }}
              >
                {tab === 'All' && <span style={{width: 8, height: 8, borderRadius: '50%', background: '#00A4B0'}}></span>}
                {tab === 'At Risk' && <span style={{width: 8, height: 8, borderRadius: '50%', background: '#ef4444'}}></span>}
                {tab === 'Needs Attention' && <span style={{width: 8, height: 8, borderRadius: '50%', background: '#f59e0b'}}></span>}
                {tab === 'Stable' && <span style={{width: 8, height: 8, borderRadius: '50%', background: '#10b981'}}></span>}
                {tab} <span style={{ background: activeRiskFilter === tab ? '#e2e8f0' : '#f1f5f9', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem' }}>{counts[tab]}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none',
                fontSize: '0.85rem', color: '#1e293b', width: '220px', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#00A4B0'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>
                Employee
              </th>
              <th style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>Designation</th>
              <th onClick={() => handleSort('healthScore')} style={{ cursor: 'pointer', padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>
                Health Score
              </th>
              <th onClick={() => handleSort('punctuality')} style={{ cursor: 'pointer', padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>
                Punctuality
              </th>
              <th style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>Avg Effective Hrs</th>
              <th onClick={() => handleSort('absences')} style={{ cursor: 'pointer', padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>
                Absences
              </th>
              <th style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>Risk Status</th>
              <th style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length > 0 ? currentEmployees.map((emp) => {
              const statusColor = emp.health < 50 ? '#ef4444' : (emp.health < 75 ? '#f59e0b' : '#10b981');
              const statusBg = emp.health < 50 ? '#fef2f2' : (emp.health < 75 ? '#fffbeb' : '#ecfdf5');
              
              return (
                <tr key={emp.employeeId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: "0.95rem", fontWeight: 600 }}>
                        {emp.employeeName ? emp.employeeName.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: '#1e293b' }}>{emp.employeeName}</div>
                        <div style={{ fontSize: "0.75rem", color: '#64748b' }}>ID: {emp.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 500 }}>{emp.designation || 'Team Member'}</td>
                  <td style={{ padding: '12px 10px', fontSize: "0.85rem", fontWeight: 700, color: emp.health < 50 ? '#ef4444' : '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '40px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${emp.health}%`, height: '100%', background: statusColor }}></div>
                      </div>
                      {emp.health.toFixed(1)}%
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 500 }}>{emp.punctualityScore?.toFixed(1)}%</td>
                  <td style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 500 }}>{fmtHM(emp.avgEffectiveHours || 0)}</td>
                  <td style={{ padding: '12px 10px', fontSize: "0.85rem", color: '#475569', fontWeight: 500 }}>{emp.absences || 0}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ background: statusBg, color: statusColor, padding: '4px 10px', borderRadius: '12px', fontSize: "0.75rem", fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${statusBg}` }}>{emp.riskStatus}</span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <button 
                      onClick={() => onSelect(emp.employeeId)}
                      style={{ background: '#fff', color: '#00A4B0', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', fontSize: "0.8rem", fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00A4B0'; e.currentTarget.style.background = '#f0fdfa'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fff'; }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>No employees found</div>
                  <div style={{ fontSize: '0.85rem' }}>Try adjusting your search or filters</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, sortedEmployees.length)}</strong> of <strong>{sortedEmployees.length}</strong> employees
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', borderRadius: '6px', fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show max 5 page buttons
                if (
                  page === 1 || page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{ 
                        padding: '6px 12px', border: '1px solid', 
                        borderColor: currentPage === page ? '#00A4B0' : '#cbd5e1', 
                        background: currentPage === page ? '#00A4B0' : '#fff', 
                        color: currentPage === page ? '#fff' : '#475569', 
                        borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 
                      }}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 || page === currentPage + 2
                ) {
                  return <span key={page} style={{ padding: '6px 4px', color: '#94a3b8' }}>...</span>;
                }
                return null;
              })}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', borderRadius: '6px', fontSize: '0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

const AttendanceAnalyticsDeep = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(endOfToday());
  const [activePreset, setActivePreset] = useState('month');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
    const [viewMode, setViewMode] = useState('my'); // 'my' | 'team'
  const [quickViewEmployee, setQuickViewEmployee] = useState(null);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [quickViewEmployee, setQuickViewEmployee] = useState(null);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  const role = (sessionStorage.getItem('role') || 'Employee').toUpperCase();
  const isOrgWide = ['HR', 'ADMIN', 'SUB_ADMIN', 'SUB ADMIN'].includes(role);

  useEffect(() => {
    if (isOrgWide || role === 'MANAGER' || role === 'LEAD') {
      api.get('/v1/analytics/team-members').then(res => setTeamMembers(res.data)).catch(console.error);
    }
  }, [isOrgWide, role]);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    // If we are in team overview mode, fetch team aggregates
    if (viewMode === 'team' && !empFilter) {
      setTeamLoading(true);
      setTeamError(null);
      try {
        let url = `/v1/analytics/team?startDate=${startDate}&endDate=${endDate}`;
        if (deptFilter) url += `&department=${encodeURIComponent(deptFilter)}`;
        const res = await api.get(url);
        setTeamData(res.data);
      } catch (err) {
        console.error('Team analytics error:', err);
        setTeamError('Failed to load team analytics.');
      } finally {
        setTeamLoading(false);
      }
      return;
    }

    // Otherwise, fetch individual deep analytics
    setLoading(true);
    setError(null);
    try {
      let url = `/v1/analytics/deep?startDate=${startDate}&endDate=${endDate}`;
      if (empFilter) url += `&employeeId=${empFilter}`;
      if (deptFilter) url += `&department=${encodeURIComponent(deptFilter)}`;
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error('Deep analytics error:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, empFilter, deptFilter, viewMode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyPreset = (key) => {
    setActivePreset(key);
    switch (key) {
      case 'week': setStartDate(startOfWeek()); setEndDate(endOfToday()); break;
      case 'month': setStartDate(startOfMonth()); setEndDate(endOfToday()); break;
      case 'lastMonth': setStartDate(startOfLastMonth()); setEndDate(endOfLastMonth()); break;
      case 'quarter': setStartDate(startOfQuarter()); setEndDate(endOfToday()); break;
      default: break;
    }
  };

  const exportCSV = () => {
    const targetData = (viewMode === 'team' && !empFilter) ? teamData : data;
    if (!targetData?.dailyLogs?.length) return;
    const headers = ['Date', 'Employee ID', 'Employee', 'Department', 'Status', 'Effective Hours', 'Gross Hours', 'Login', 'Logout', 'Location'];
    const rows = targetData.dailyLogs.map(l => [l.date, l.employeeId, l.employeeName, l.department, l.status, l.effectiveHours?.toFixed(2), l.grossHours?.toFixed(2), l.loginTime, l.logoutTime, l.workLocation].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_analytics_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeData = (viewMode === 'team' && !empFilter) ? teamData : data;

  // Departments list from data
  const departments = useMemo(() => {
    if (!activeData?.departmentBreakdown) return [];
    return activeData.departmentBreakdown.map(d => d.department).sort();
  }, [activeData]);

  const kpis = activeData?.kpis;

  const calculatedMetrics = useMemo(() => {
    if (!activeData?.dailyLogs || activeData.dailyLogs.length === 0) {
      return {
        consistencyScore: 100,
        currentStreak: 0,
        lateWeekdayHabit: 'None',
        earlyLogouts: 0,
        overtimeDays: 0,
        missedPunches: 0,
      };
    }

    const logs = [...activeData.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

    // 1. Consistency Score calculation
    const consistencyScore = activeData?.kpis?.consistencyScore || 0;

    // 2. Streaks calculation
    let currentStreak = 0;
    let tempStreak = 0;
    
    // Group logs by date to evaluate full calendar days
    const logsByDate = {};
    logs.forEach(log => {
      if (!logsByDate[log.date]) logsByDate[log.date] = [];
      logsByDate[log.date].push(log);
    });

    const sortedDates = Object.keys(logsByDate).sort((a, b) => new Date(a) - new Date(b));
    sortedDates.forEach(date => {
      const dayLogs = logsByDate[date];
      
      const hasViolations = dayLogs.some(l => l.status === 'LATE' || l.status === 'ABSENT');
      const hasCompliant = dayLogs.some(l => l.status === 'ON_TIME' || l.status === 'WFH');
      
      if (hasViolations) {
        tempStreak = 0;
      } else if (hasCompliant) {
        tempStreak++;
        if (tempStreak > currentStreak) {
          currentStreak = tempStreak;
        }
      }
      // If it's a day where everyone is on LEAVE, tempStreak is simply maintained (paused).
    });

    // 3. Late Habits
    const lateDays = {};
    logs.forEach(log => {
      if (log.status === 'LATE' && log.dayOfWeek) {
        lateDays[log.dayOfWeek] = (lateDays[log.dayOfWeek] || 0) + 1;
      }
    });
    let maxLateCount = 0;
    let lateWeekdayHabit = 'None';
    Object.entries(lateDays).forEach(([day, count]) => {
      if (count > maxLateCount) {
        maxLateCount = count;
        lateWeekdayHabit = day;
      }
    });
    if (maxLateCount > 0) {
      const dayMap = {
        'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
      };
      const fullDay = dayMap[lateWeekdayHabit] || lateWeekdayHabit;
      lateWeekdayHabit = `${fullDay} (${maxLateCount}x)`;
    } else {
      lateWeekdayHabit = 'None';
    }

    // 4. Early Logouts
    let earlyLogouts = 0;
    logs.forEach(log => {
      if (log.logoutTime && log.status !== 'ABSENT' && log.status !== 'LEAVE') {
        try {
          const parts = log.logoutTime.trim().split(' ');
          const timeParts = parts[0].split(':');
          let hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          const ampm = parts[1]?.toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;

          const totalMins = hours * 60 + minutes;
          if (totalMins < 1080) {
            earlyLogouts++;
          }
        } catch (e) { }
      }
    });

    // 5. Work Hours Contextual Metrics
    const activeLogs = logs.filter(log => log.effectiveHours > 0);
    const activeDays = activeLogs.length;
    const normalDays = activeLogs.filter(log => log.effectiveHours >= 7.5 && log.effectiveHours <= 9.0).length;
    const shortDays = activeLogs.filter(log => log.effectiveHours < 7.5).length;
    const overtimeDays = activeLogs.filter(log => log.effectiveHours > 9.0).length;

    let longestShift = 0;
    let shortestShift = 0;
    let consistencyLevel = 'N/A';

    if (activeDays > 0) {
      const hoursArray = activeLogs.map(l => l.effectiveHours);
      longestShift = Math.max(...hoursArray);
      shortestShift = Math.min(...hoursArray);

      const mean = hoursArray.reduce((a, b) => a + b, 0) / activeDays;
      const variance = hoursArray.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / activeDays;
      const stdDev = Math.sqrt(variance);

      if (stdDev <= 1.0) consistencyLevel = 'High';
      else if (stdDev <= 2.5) consistencyLevel = 'Moderate';
      else consistencyLevel = 'Low';
    }

    // 6. Missed Punches
    const missedPunches = logs.filter(log => log.loginTime && !log.logoutTime).length;

    return {
      consistencyScore: Math.round(consistencyScore),
      currentStreak,
      lateWeekdayHabit,
      earlyLogouts,
      missedPunches,
      // New Work Hours Metrics
      activeDays,
      normalDays,
      shortDays,
      overtimeDays,
      longestShift,
      shortestShift,
      consistencyLevel
    };
  }, [activeData]);

  return (
    <Sidebar>
      <div className="aad-page">
        <div className="aad-container">
          {/* ─── Header ─── */}
          <div className="aad-header">
            <div className="aad-header-left">
              <button className="aad-back-btn" onClick={() => navigate('/analytics')} title="Back to Analytics Hub">
                <i className="bi bi-arrow-left" />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="aad-back-btn" onClick={() => navigate(-1)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <h1 className="aad-title" style={{ margin: 0 }}>Attendance Analytics</h1>
                </div>
                <p className="aad-subtitle" style={{ marginLeft: '40px', marginTop: '4px' }}>Enterprise-grade attendance insights from real data</p>
              </div>
            </div>
            <div className="aad-controls">
              <div className="aad-date-group">
                {[['week', 'This Week'], ['month', 'This Month'], ['lastMonth', 'Last Month'], ['quarter', 'Quarter']].map(([k, label]) => (
                  <button key={k} className={`aad-preset-btn ${activePreset === k ? 'active' : ''}`} onClick={() => applyPreset(k)}>{label}</button>
                ))}
              </div>
              <div className="aad-date-group">
                <input type="date" className="aad-date-input" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset(''); }} />
                <span style={{ color: '#64748b', fontSize: "1vw" }}>to</span>
                <input type="date" className="aad-date-input" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset(''); }} />
              </div>

              <button className="aad-export-btn" onClick={exportCSV} title="Export CSV">
                <i className="bi bi-download" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* ─── ROLE-BASED TOGGLE ─── */}
        {(isOrgWide || role === 'MANAGER' || role === 'LEAD') && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.05)' }}>
              <button
                onClick={() => { setViewMode('my'); setEmpFilter(''); }}
                style={{
                  padding: '5px 13px', border: 'none', borderRadius: '8px', fontSize: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--primary-font-family)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: viewMode === 'my' ? '#ffffff' : 'transparent',
                  color: viewMode === 'my' ? 'var(--color-cta)' : '#64748b',
                  boxShadow: viewMode === 'my' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <i className="bi bi-person-fill me-2" /> My Analytics
              </button>
              <button
                onClick={() => { setViewMode('team'); setEmpFilter(''); }}
                style={{
                  padding: '5px 13px', border: 'none', borderRadius: '8px', fontSize: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--primary-font-family)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: viewMode === 'team' ? '#ffffff' : 'transparent',
                  color: viewMode === 'team' ? 'var(--color-cta)' : '#64748b',
                  boxShadow: viewMode === 'team' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <i className="bi bi-people-fill me-2" /> Team Analytics
              </button>
            </div>
          </div>
        )}

        {/* ─── Loading / Error ─── */}
        {(loading || teamLoading) && (
          <div className="aad-loading">
            <div className="aad-spinner" />
            <div className="aad-loading-text">Aggregating attendance data…</div>
          </div>
        )}
        {(error || teamError) && <div className="aad-error"><i className="bi bi-exclamation-triangle" /> {error || teamError}</div>}



        {/* ─── Back to Team Button (when viewing a member) ─── */}
        {!loading && !error && viewMode === 'team' && empFilter && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setEmpFilter('')}
              style={{
                background: 'transparent', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px',
                color: '#475569', fontSize: "1vw", cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
              }}
            >
              <i className="bi bi-arrow-left" /> Back to Team Roster
            </button>
            <span style={{ marginLeft: '10px', fontWeight: 600, color: '#1c2536' }}>
              Viewing Individual Analytics for {teamData?.allEmployees?.find(m => m.employeeId === empFilter)?.employeeName || empFilter}
            </span>
          </div>
        )}

        {/* ─── Main Content ─── */}
        {!loading && !teamLoading && !error && !teamError && activeData && (
          <>
            
            {/* ══════ EXECUTIVE GRID (ABOVE THE FOLD) ══════ */}
            <div className="aad-executive-grid">
                  <div className="aad-executive-left">
                    {/* Row 1: KPI Cards */}
                    <div className="aad-kpi-row">
                      <div className="aad-score-card" style={{minHeight: '51px', padding: '6px 8px'}}>
                        <div className="aad-score-label" style={{marginBottom: '3px', fontSize: '7px'}}>Attendance Consistency</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <ConsistencyScore score={calculatedMetrics.consistencyScore} />
                        </div>
                      </div>

                      <div className="aad-score-card" style={{minHeight: '51px', padding: '6px 8px'}}>
                        <div className="aad-score-label aad-workhours-header" style={{marginBottom: '3px', fontSize: '7px'}}>
                          <span>Avg Effective Hours</span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <div className="work-stat">
                            <span className="value" style={{fontSize: "1vw"}}>{fmtHM(data?.teamSummary?.avgEffectiveHours || 8.5)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="aad-score-card" style={{minHeight: '51px', padding: '6px 8px'}}>
                        <div className="aad-score-label" style={{marginBottom: '3px', fontSize: '7px'}}>Compliance Streak</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <div className="aad-streak-wrapper" style={{marginTop: 0}}>
                            <span className="aad-streak-num" style={{fontSize: "1vw"}}>{calculatedMetrics.currentStreak} {calculatedMetrics.currentStreak === 1 ? 'Day' : 'Days'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="aad-score-card" style={{minHeight: '51px', padding: '6px 8px'}}>
                        <div className="aad-score-label" style={{marginBottom: '3px', fontSize: '7px'}}>Late Habit</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <span className="aad-streak-num" style={{fontSize: "1vw", color: '#f59e0b', fontWeight: 600}}>
                            {calculatedMetrics.lateWeekdayHabit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Charts */}
                    <div className="aad-chart-row-dense">
                      {/* Daily Trend */}
                      <div className="aad-chart-card">
                        <div className="aad-chart-title">Daily Attendance Trend</div>
                        {activeData.dailyLogs?.length > 0 ? (
                          <div className="aad-chart-wrapper" style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
                            {(() => {
                              const uniqueLogs = Object.values(
                                activeData.dailyLogs.reduce((acc, log) => {
                                  if (!acc[log.date]) {
                                    acc[log.date] = { date: log.date, effectiveHours: 0, grossHours: 0, count: 0 };
                                  }
                                  acc[log.date].effectiveHours += log.effectiveHours || 0;
                                  acc[log.date].grossHours += log.grossHours || 0;
                                  acc[log.date].count += 1;
                                  return acc;
                                }, {})
                              ).map(day => ({
                                date: day.date,
                                effectiveHours: Number((day.effectiveHours / day.count).toFixed(2)),
                                grossHours: Number((day.grossHours / day.count).toFixed(2))
                              })).sort((a, b) => new Date(a.date) - new Date(b.date));

                              const minChartWidth = Math.max(100, uniqueLogs.length * 35);

                              return (
                                <div style={{ height: 160, minWidth: `${minChartWidth}px`, width: '100%' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={uniqueLogs} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={{ stroke: '#cbd5e1' }} interval={0} angle={-45} textAnchor="end" height={50} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} />
                                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
                                      <Tooltip content={<LightTooltip />} />
                                      <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75vw', fontWeight: 600, color: '#01144A', paddingTop: '10px' }} />
                                      <Bar dataKey="effectiveHours" name="Effective Hours" fill="#00A4B0" fillOpacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={20} />
                                      <Line type="monotone" dataKey="grossHours" name="Gross Hours" stroke="#01144A" strokeWidth={2} dot={{ r: 2, fill: '#01144A' }} activeDot={{ r: 4 }} />
                                    </ComposedChart>
                                  </ResponsiveContainer>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="aad-empty-state">No daily data.</div>
                        )}
                      </div>

                      {/* Donut Chart */}
                      <div className="aad-chart-card">
                        <div className="aad-chart-title">Status Distribution</div>
                        {activeData.punctuality ? (
                          <div style={{ height: 220 }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'On Time', value: activeData.punctuality.onTimeCount, color: STATUS_COLORS.ON_TIME },
                                    { name: 'Late', value: activeData.punctuality.lateCount, color: STATUS_COLORS.LATE },
                                    { name: 'WFH', value: activeData.punctuality.wfhCount, color: STATUS_COLORS.WFH },
                                    { name: 'Absent', value: activeData.punctuality.absentCount, color: STATUS_COLORS.ABSENT }
                                  ].filter(d => d.value > 0)}
                                  cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={2} dataKey="value"
                                >
                                  {[
                                    { name: 'On Time', value: activeData.punctuality.onTimeCount, color: STATUS_COLORS.ON_TIME },
                                    { name: 'Late', value: activeData.punctuality.lateCount, color: STATUS_COLORS.LATE },
                                    { name: 'WFH', value: activeData.punctuality.wfhCount, color: STATUS_COLORS.WFH },
                                    { name: 'Absent', value: activeData.punctuality.absentCount, color: STATUS_COLORS.ABSENT }
                                  ].filter(d => d.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip content={<LightTooltip />} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.75vw', fontWeight: 600, color: '#01144A' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="aad-empty-state">No data.</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Exceptions */}
                  <div className="aad-exceptions-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                    <ExceptionsFeed logs={activeData.dailyLogs} anomalies={activeData.anomalies} />
                  </div>
                </div>

                {/* Action Bar */}
                <div className="aad-action-bar" style={{marginTop: "6px", paddingTop: "6px"}}>
                  {/* <button className="aad-action-btn" onClick={() => setShowInsightsModal(true)}>
                    <i className="bi bi-bar-chart-line"></i> Explore Detailed Insights
                  </button> */}
                  <button className="aad-action-btn primary" onClick={() => setShowLogsModal(true)}>
                    <i className="bi bi-table"></i> View Full Attendance Logs
                  </button>
                </div>

                


              
                



                

                {/* ══════ SECTION 7: Month-over-Month Comparison ══════ */}
                



                {/* ================= MODALS ================= */}
        {showLogsModal && createPortal(
          <div className="aad-modal-overlay" onClick={() => setShowLogsModal(false)}>
            <div className="aad-modal-content" onClick={e => e.stopPropagation()}>
              <div className="aad-modal-header">
                <h3 className="aad-modal-title">Enterprise Attendance Logs</h3>
                <button className="aad-modal-close" onClick={() => setShowLogsModal(false)}><i className="bi bi-x"></i></button>
              </div>
              <div className="aad-modal-body">
                {/* ══════ SECTION X: Enterprise Attendance Logs (Keka Inspired) ══════ */}
                <div className="aad-logs-card">
                  <div className="aad-logs-table-wrapper">
                    <table className="aad-logs-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Attendance Visual (9 AM - 6 PM)</th>
                          <th>Effective / Gross Hours</th>
                          <th>Arrival</th>
                          <th>Log Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeData.dailyLogs || []).map((log, i) => {
                          const style = getTimelineStyle(log.loginTime, log.logoutTime);
                          const dateObj = new Date(log.date);
                          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                          const isWeekend = weekday === 'Sat' || weekday === 'Sun';

                          return (
                            <tr key={i}>
                              <td className="aad-logs-date">
                                <span>{formattedDate}, <span style={{ color: '#94a3b8', fontWeight: 500 }}>{weekday}</span></span>
                                {log.workLocation === 'WFH' && <span className="keka-badge wfh">WFH</span>}
                                {log.workLocation === 'Remote' && <span className="keka-badge remote">Remote</span>}
                                {log.status === 'LEAVE' && <span className="keka-badge absent" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>Leave</span>}
                                {isWeekend && log.effectiveHours === 0 && <span className="keka-badge week_off">W-Off</span>}
                              </td>
                              <td style={{ width: '40%', padding: '10px 6px' }}>
                                <div className="keka-timeline-container">
                                  <div className="keka-timeline-track" />
                                  {log.status !== 'ABSENT' && log.status !== 'LEAVE' && log.loginTime && log.logoutTime && (
                                    <>
                                      <div className={`keka-timeline-bar ${log.status.toLowerCase()}`} style={{ left: style.left, width: style.width }} />
                                      <div className="keka-marker start" style={{ left: `${style.startPct}%` }} title={`Punch-In: ${log.loginTime}`} />
                                      <div className="keka-marker end" style={{ left: `${style.endPct}%` }} title={`Punch-Out: ${log.logoutTime}`} />
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="keka-effective-cell">
                                <div className="keka-circle-progress">
                                  <svg className="keka-circle-svg">
                                    <circle cx="8" cy="8" r="6" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                                    <circle cx="8" cy="8" r="6" fill="none"
                                      stroke={log.effectiveHours >= 8.0 ? '#10b981' : log.effectiveHours >= 4.0 ? '#f59e0b' : '#ef4444'}
                                      strokeWidth="2"
                                      strokeDasharray={2 * 3.14159 * 6}
                                      strokeDashoffset={2 * 3.14159 * 6 * (1 - Math.min(log.effectiveHours / 8.0, 1))}
                                    />
                                  </svg>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, color: '#1c2536' }}>{fmtHM(log.effectiveHours)}</span>
                                    <span style={{ fontSize: "1vw", color: '#94a3b8' }}>Gross: {fmtHM(log.grossHours)}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {log.status === 'ON_TIME' && <i className="bi bi-check-circle-fill text-success" />}
                                  {log.status === 'WFH' && <i className="bi bi-house-door-fill text-indigo" />}
                                  {log.status === 'LATE' && <i className="bi bi-exclamation-circle-fill text-warning" />}
                                  {log.status === 'ABSENT' && <i className="bi bi-x-circle-fill text-danger" />}
                                  <span style={{ fontSize: "1vw", fontWeight: 600, color: log.status === 'ON_TIME' ? '#059669' : log.status === 'LATE' ? '#d97706' : '#475569' }}>
                                    {log.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </td>
                              <td className="aad-logs-time">
                                {log.loginTime ? `${log.loginTime} — ${log.logoutTime || '...'}` : '—'}
                                {log.workLocation && (
                                  <i className="bi bi-geo-alt-fill aad-loc-pin" title={`Location: ${log.workLocation}`}></i>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {showInsightsModal && createPortal(
          <div className="aad-modal-overlay" onClick={() => setShowInsightsModal(false)}>
            <div className="aad-modal-content" onClick={e => e.stopPropagation()}>
              <div className="aad-modal-header">
                <h3 className="aad-modal-title">Detailed Insights & Analytics</h3>
                <button className="aad-modal-close" onClick={() => setShowInsightsModal(false)}><i className="bi bi-x"></i></button>
              </div>
              <div className="aad-modal-body">


                <Section icon="bi-geo-alt" title="Location & Work Mode Analysis">
                  <LocationInteractiveHeatmap logs={activeData.dailyLogs} summary={activeData.locationAnalysis} />
                </Section>

                {activeData.monthlyAggregates?.length > 1 && (
                  <Section icon="bi-calendar-range" title="Month-over-Month Performance Trend">
                    <div className="aad-chart-card">
                      <div style={{ height: 192 }}>
                        <ResponsiveContainer>
                          <ComposedChart data={activeData.monthlyAggregates} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickFormatter={v => `${v} hrs`} label={{ value: 'Avg Effective Hours', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickFormatter={v => `${v}%`} label={{ value: 'On-Time %', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 11 }} />
                            <Tooltip content={<LightTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: "1vw", color: '#64748b' }} />
                            <Bar yAxisId="left" dataKey="avgEffective" name="Avg Productive Hours" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            <Line yAxisId="right" type="monotone" dataKey="onTimePercent" name="On-Time %" stroke="#00C1D0" strokeWidth={2} dot={{ r: 4, fill: '#00C1D0' }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Section>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
        {/* ─── Team Roster Explorer ─── */}
        {viewMode === 'team' && !empFilter && activeData?.allEmployees && (
          <EmployeeAnalyticsExplorer 
            employees={activeData.allEmployees} 
            onSelect={(id) => { setEmpFilter(id); fetchData(); }} 
          />
        )}
          </>
        )}
      </div>

    </Sidebar>
  );
};

export default AttendanceAnalyticsDeep;
