import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from './Sidebar';
import {
  ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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

const STATUS_COLORS = { ON_TIME: '#00A4B0', LATE: '#00C1D0', WFH: '#2A3D73', ABSENT: '#f59e0b' };
const DONUT_COLORS = ['#00A4B0', '#f59e0b', '#00C1D0', '#2A3D73', '#60a5fa'];

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
  const radius = 26;
  const stroke = 5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let textStatus = 'Critical';
  if (score >= 90) textStatus = 'Excellent';
  else if (score >= 80) textStatus = 'Good';
  else if (score >= 60) textStatus = 'Average';

  return (
    <div className="xevyte-card-body" style={{ width: '100%' }}>
      <svg height={radius * 2} width={radius * 2} style={{ flexShrink: 0 }}>
        <circle
          stroke="#e2e8f0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="var(--color-cta)"
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
          fill="#1e293b"
          fontSize="14"
          fontWeight="700"
        >
          {score}%
        </text>
      </svg>
      <div className="xevyte-value-container">
        <span className="xevyte-card-value" style={{ fontSize: '18px' }}>{textStatus}</span>
        <span className="xevyte-card-subtext positive">+8% vs last month</span>
      </div>
    </div>
  );
};




/* ─── Exceptions & Alerts Feed ─── */
const ExceptionsFeed = ({ logs, anomalies, onEmployeeClick }) => {
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
                <span className="msg">
                  <span 
                    onClick={() => onEmployeeClick && onEmployeeClick(l.employeeId)}
                    style={{ cursor: 'pointer', color: '#00A4B0', fontWeight: 'bold' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    title="View Analytics"
                  >
                    {l.employeeName ? l.employeeName.trim() : 'Employee'}
                  </span> - No logout recorded on {l.date} (In: {l.loginTime})
                </span>
              </div>
            ))}
            {(anomalies || []).filter(a => a.type === 'ZERO_HOURS').map((a, i) => (
              <div key={`zh-${i}`} className="exception-item">
                <span className="badge-err">Zero Hours</span>
                <span className="msg">
                  <span 
                    onClick={() => onEmployeeClick && onEmployeeClick(a.employeeId)}
                    style={{ cursor: 'pointer', color: '#00A4B0', fontWeight: 'bold' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    title="View Analytics"
                  >
                    {a.employeeName || 'Employee'}
                  </span> {a.message.replace(a.employeeName || '', '')} on {a.date.toString()}
                </span>
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
              <span className="msg">
                <span 
                  onClick={() => onEmployeeClick && onEmployeeClick(l.employeeId)}
                  style={{ cursor: 'pointer', color: '#00A4B0', fontWeight: 'bold' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  title="View Analytics"
                >
                  {l.employeeName ? l.employeeName.trim() : 'Employee'}
                </span> - Worked only {l.effectiveHours?.toFixed(1) || l.effectiveHours}h ({Math.max(0, 8 - (l.effectiveHours || 0)).toFixed(1)}h deficit) on {l.date}
              </span>
            </div>
          ))}
          {observations.map((a, i) => (
            <div key={`ob-${i}`} className="exception-item">
              <span className={`badge-obs ${a.severity.toLowerCase()}`}>{a.type.replace('_', ' ')}</span>
              <span className="msg">
                <span 
                  onClick={() => onEmployeeClick && onEmployeeClick(a.employeeId)}
                  style={{ cursor: 'pointer', color: '#00A4B0', fontWeight: 'bold' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  title="View Analytics"
                >
                  {a.employeeName || 'Employee'}
                </span> {a.message.replace(a.employeeName || '', '')}
              </span>
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
                {emp.healthScore < 50 && <li>Health Score: <span style={{ color: '#ef4444' }}>{emp.healthScore.toFixed(1)}%</span></li>}
                {emp.avgEffectiveHours < 6.5 && <li>Avg Hours: <span style={{ color: '#f59e0b' }}>{fmtHM(emp.avgEffectiveHours)}</span></li>}
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


/* ═══════════════════════════════════════════════════════════════
   TEAM ATTENDANCE MATRIX (ENTERPRISE)
   ═══════════════════════════════════════════════════════════════ */
const TeamAttendanceMatrix = ({ logs, onEmployeeClick }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [tooltipInfo, setTooltipInfo] = useState({ show: false, x: 0, y: 0, log: null, badge: null });

  const handleMouseEnter = (e, log, badge) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      log,
      badge
    });
  };

  const handleMouseLeave = () => {
    setTooltipInfo({ show: false, x: 0, y: 0, log: null, badge: null });
  };

  if (!logs || logs.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No team logs found for this period.</div>;
  }

  // 1. Get unique dates, sorted chronologically
  const uniqueDates = Array.from(new Set(logs.map(log => log.date))).sort();

  // 2. Group by employee
  const employeeMap = {};
  logs.forEach(log => {
    if (!employeeMap[log.employeeId]) {
      employeeMap[log.employeeId] = {
        employeeName: log.employeeName || 'Unknown Employee',
        logsByDate: {}
      };
    }
    employeeMap[log.employeeId].logsByDate[log.date] = log;
  });

  const employees = Object.keys(employeeMap).map(id => ({
    id,
    ...employeeMap[id]
  })).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const getBadgeStyle = (log) => {
    const status = log.status;
    const d = new Date(log.date);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (isWeekend && (log.effectiveHours === 0 || !log.effectiveHours) && status !== 'ABSENT' && status !== 'LEAVE') {
      return { bg: '#f1f5f9', color: '#94a3b8', letter: 'W' };
    }
    switch (status) {
      case 'ON_TIME': return { bg: '#e6f4ea', color: '#137333', letter: 'P' };
      case 'LATE': return { bg: '#fef7e0', color: '#b06000', letter: 'L' };
      case 'ABSENT': return { bg: '#fce8e6', color: '#c5221f', letter: 'A' };
      case 'LEAVE': return { bg: '#f3e8fd', color: '#7b1fa2', letter: 'Lv' };
      case 'WFH': return { bg: '#e8f0fe', color: '#1967d2', letter: 'W' };
      default: return { bg: '#f8fafc', color: '#cbd5e1', letter: '-' };
    }
  };

  return (
    <div className="aad-team-matrix-container" style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px' }}>
      <table className="aad-team-matrix-table" style={{ borderCollapse: 'collapse', minWidth: '100%', width: 'max-content', textAlign: 'center', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ position: 'sticky', left: 0, background: '#f8fafc', padding: 0, textAlign: 'left', zIndex: 2, borderRight: '1px solid #e2e8f0' }}>
              <div style={{ width: '180px', minWidth: '180px', padding: '12px 16px', boxSizing: 'border-box', fontWeight: '600', color: '#475569' }}>
                Employee
              </div>
            </th>
            {uniqueDates.map(date => {
              const d = new Date(date);
              return (
                <th key={date} style={{ padding: '8px', fontWeight: '600', color: '#475569', minWidth: '40px' }}>
                  <div style={{ fontSize: '0.7rem' }}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                  <div>{d.getDate()}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr
              key={emp.id}
              style={{
                borderBottom: '1px solid #f1f5f9',
                background: hoveredRow === emp.id ? '#f8fafc' : 'transparent',
                transition: 'background 0.2s'
              }}
              onMouseEnter={() => setHoveredRow(emp.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td style={{ position: 'sticky', left: 0, background: hoveredRow === emp.id ? '#f8fafc' : '#fff', transition: 'background 0.2s', padding: 0, textAlign: 'left', zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
                <div style={{ width: '180px', minWidth: '180px', padding: '12px 16px', boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600', color: '#1e293b' }}>
                  <span 
                    onClick={() => onEmployeeClick && onEmployeeClick(emp.id)}
                    style={{ cursor: 'pointer', color: '#00A4B0', textDecoration: 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    title={`View detailed analytics for ${emp.employeeName}`}
                  >
                    {emp.employeeName}
                  </span>
                </div>
              </td>
              {uniqueDates.map(date => {
                const log = emp.logsByDate[date];
                if (!log) {
                  return <td key={date} style={{ padding: '8px' }}><div style={{ width: '28px', height: '28px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>-</div></td>;
                }
                const badge = getBadgeStyle(log);
                let title = `${log.date}\nStatus: ${log.status}`;
                if (log.loginTime) title += `\nIn: ${log.loginTime}`;
                if (log.logoutTime) title += `\nOut: ${log.logoutTime}`;
                if (log.effectiveHours) title += `\nHours: ${log.effectiveHours.toFixed(1)}h`;

                return (
                  <td key={date} style={{ padding: '4px' }}>
                    <div
                      style={{
                        width: '28px', height: '28px', margin: '0 auto', borderRadius: '4px',
                        background: badge.bg, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: tooltipInfo.show && tooltipInfo.log === log ? `0 0 0 2px #fff, 0 0 0 4px ${badge.color}` : 'none',
                        transform: tooltipInfo.show && tooltipInfo.log === log ? 'scale(1.1)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, log, badge)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {badge.letter}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Custom Tooltip */}
      {tooltipInfo.show && tooltipInfo.log && (
        <div style={{
          position: 'fixed',
          top: tooltipInfo.y,
          left: tooltipInfo.x,
          transform: 'translate(-50%, -100%)',
          background: '#fff',
          color: '#334155',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 9999,
          pointerEvents: 'none',
          minWidth: '200px',
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Tooltip Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '10px',
            height: '10px',
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{new Date(tooltipInfo.log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span style={{
              background: tooltipInfo.badge.bg,
              color: tooltipInfo.badge.color,
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.7rem'
            }}>{tooltipInfo.log.status.replace('_', ' ')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Punch In:</span>
            <span style={{ fontWeight: 500, color: '#334155' }}>{tooltipInfo.log.loginTime || '--:--'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Punch Out:</span>
            <span style={{ fontWeight: 500, color: '#334155' }}>{tooltipInfo.log.logoutTime || '--:--'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
            <span style={{ color: '#64748b' }}>Effective Hours:</span>
            <span style={{ fontWeight: 600, color: '#00A4B0' }}>{tooltipInfo.log.effectiveHours ? tooltipInfo.log.effectiveHours.toFixed(1) + 'h' : '0.0h'}</span>
          </div>
        </div>
      )}
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
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [logsCurrentPage, setLogsCurrentPage] = useState(1);
  const logsPerPage = 5;

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

  const activeData = viewMode === 'team' && !empFilter ? teamData : data;

  useEffect(() => {
    setLogsCurrentPage(1);
  }, [activeData]);

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
            <div className="aad-header-left" style={{ flex: 1, minWidth: 0, marginRight: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <button className="aad-back-btn" onClick={() => navigate('/analytics')} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1d4ed8', fontSize: '14px', cursor: 'pointer', padding: 0, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-chevron-left" style={{ marginLeft: '-2px' }}></i>
                </button>
                <h1 className="aad-title" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap' }}>Attendance Analytics</h1>
              </div>
            </div>
            <div className="aad-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '30px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px', height: '100%', background: '#fff', gap: '0px' }}>
                {[['week', 'This Week'], ['month', 'This Month'], ['lastMonth', 'Last Month'], ['quarter', 'Quarter']].map(([k, label]) => (
                  <button key={k} className={`aad-preset-btn ${activePreset === k ? 'active' : ''}`} onClick={() => applyPreset(k)}
                    style={{
                      background: activePreset === k ? '#1d4ed8' : 'transparent',
                      color: activePreset === k ? '#fff' : '#64748b',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0 6px',
                      height: '100%',
                      fontSize: '10px',
                      fontWeight: activePreset === k ? '500' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0 4px', height: '100%', background: '#fff' }}>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset(''); }} style={{ border: 'none', outline: 'none', color: '#475569', fontSize: '10px', background: 'transparent', fontWeight: '500', fontFamily: 'inherit', width: '105px' }} />
                <i className="bi bi-arrow-right" style={{ color: '#cbd5e1', fontSize: '9px' }}></i>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset(''); }} style={{ border: 'none', outline: 'none', color: '#475569', fontSize: '10px', background: 'transparent', fontWeight: '500', fontFamily: 'inherit', width: '105px' }} />
              </div>
              <button className="aad-export-btn" onClick={exportCSV} title="Export CSV" style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 8px', height: '100%', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '500', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
                <i className="bi bi-download" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* ─── ROLE-BASED TOGGLE ─── */}
        {(isOrgWide || role === 'MANAGER' || role === 'LEAD') && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '24px', marginLeft: '0' }}>
              <button
                onClick={() => { setViewMode('my'); setEmpFilter(''); }}
                style={{
                  padding: '12px 0', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--primary-font-family)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  color: viewMode === 'my' ? '#1d4ed8' : '#64748b',
                  borderBottom: viewMode === 'my' ? '2px solid #1d4ed8' : '2px solid transparent'
                }}
              >
                My Analytics
              </button>
              <button
                onClick={() => { setViewMode('team'); setEmpFilter(''); }}
                style={{
                  padding: '12px 0', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: '600', fontFamily: 'var(--primary-font-family)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  color: viewMode === 'team' ? '#1d4ed8' : '#64748b',
                  borderBottom: viewMode === 'team' ? '2px solid #1d4ed8' : '2px solid transparent'
                }}
              >
                Team Analytics
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
            <div className="aad-executive-grid-new" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Row 1: KPI Cards */}
              <div className="aad-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>

                {/* Card 1: Attendance Consistency */}
                <div className="aad-score-card">
                  <div className="xevyte-card-header">Attendance Consistency</div>
                  <div className="xevyte-card-body">
                    <ConsistencyScore score={calculatedMetrics.consistencyScore} />
                  </div>
                </div>

                {/* Card 2: Avg Effective Hours */}
                <div className="aad-score-card">
                  <div className="xevyte-card-header">Avg Effective Hours</div>
                  <div className="xevyte-card-body">
                    <div className="xevyte-icon-wrapper xevyte-icon-blue">
                      <i className="bi bi-clock"></i>
                    </div>
                    <div className="xevyte-value-container">
                      <span className="xevyte-card-value">{fmtHM(data?.teamSummary?.avgEffectiveHours || 8.5)}</span>
                      <span className="xevyte-card-subtext positive">+45m vs last month</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Compliance Streak */}
                <div className="aad-score-card">
                  <div className="xevyte-card-header">Compliance Streak</div>
                  <div className="xevyte-card-body">
                    <div className="xevyte-icon-wrapper xevyte-icon-green">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <div className="xevyte-value-container">
                      <span className="xevyte-card-value">{calculatedMetrics.currentStreak} {calculatedMetrics.currentStreak === 1 ? 'Day' : 'Days'}</span>
                      <span className="xevyte-card-subtext">Current streak</span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Late Habit */}
                <div className="aad-score-card">
                  <div className="xevyte-card-header">Late Habit</div>
                  <div className="xevyte-card-body">
                    <div className="xevyte-icon-wrapper xevyte-icon-red">
                      <i className="bi bi-alarm"></i>
                    </div>
                    <div className="xevyte-value-container">
                      <span className="xevyte-card-value">{calculatedMetrics.lateWeekdayHabit}</span>
                      <span className="xevyte-card-subtext">Most frequent day</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 2: Charts */}
              <div className="aad-chart-row-dense" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Daily Trend */}
                <div className="aad-chart-card" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                  <div className="aad-chart-title" style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', flexShrink: 0 }}>Daily Attendance Trend</div>
                  {activeData.dailyLogs?.length > 0 ? (
                    <div className="aad-chart-wrapper" style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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

                        const minChartWidth = Math.max(100, uniqueLogs.length * 45);

                        return (
                          <div style={{ flexGrow: 1, minHeight: '160px', minWidth: `${minChartWidth}px`, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={uniqueLogs} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorEffective" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
                                <Tooltip />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="effectiveHours" name="Effective Hours" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEffective)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#2563eb' }} />
                                <Line type="monotone" dataKey="grossHours" name="Gross Hours" stroke="#cbd5e1" strokeWidth={2} dot={{ r: 4, fill: '#cbd5e1' }} />
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
                <div className="aad-chart-card" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                  <div className="aad-chart-title" style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '24px', flexShrink: 0 }}>Status Distribution</div>
                  {activeData.punctuality ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
                      <div style={{ width: '100%', flexGrow: 1, minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Present', value: activeData.punctuality.onTimeCount || 0, color: '#00A4B0' },
                                { name: 'Late', value: activeData.punctuality.lateCount || 0, color: '#00C1D0' },
                                { name: 'Work From Home', value: activeData.punctuality.wfhCount || 0, color: '#2A3D73' },
                                { name: 'Half Day', value: (activeData.punctuality.halfDayCount || 0), color: '#007F8B' },
                                { name: 'Absent', value: activeData.punctuality.absentCount || 0, color: '#f59e0b' }
                              ].filter(d => d.value > 0)}
                              cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" paddingAngle={2} dataKey="value" stroke="none"
                            >
                              {[
                                { name: 'Present', value: activeData.punctuality.onTimeCount || 0, color: '#00A4B0' },
                                { name: 'Late', value: activeData.punctuality.lateCount || 0, color: '#00C1D0' },
                                { name: 'Work From Home', value: activeData.punctuality.wfhCount || 0, color: '#2A3D73' },
                                { name: 'Half Day', value: (activeData.punctuality.halfDayCount || 0), color: '#007F8B' },
                                { name: 'Absent', value: activeData.punctuality.absentCount || 0, color: '#f59e0b' }
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<LightTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ width: '100%', marginTop: 'auto', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                        {(() => {
                          const distData = [
                            { name: 'Present', value: activeData.punctuality.onTimeCount || 0, color: '#00A4B0' },
                            { name: 'Late', value: activeData.punctuality.lateCount || 0, color: '#00C1D0' },
                            { name: 'Work From Home', value: activeData.punctuality.wfhCount || 0, color: '#2A3D73' },
                            { name: 'Half Day', value: (activeData.punctuality.halfDayCount || 0), color: '#007F8B' },
                            { name: 'Absent', value: activeData.punctuality.absentCount || 0, color: '#f59e0b' }
                          ].filter(d => d.value > 0);
                          const total = distData.reduce((sum, item) => sum + item.value, 0) || 1;

                          return distData.map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block', flexShrink: 0 }}></span>
                              <span style={{ color: '#64748b', fontWeight: '500' }}>{item.name}</span>
                              <span style={{ color: '#475569', fontWeight: '600', marginLeft: '2px' }}>
                                {Math.round((item.value / total) * 100)}% <span style={{ color: '#94a3b8', fontWeight: '400' }}>({item.value})</span>
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="aad-empty-state">No data.</div>
                  )}
                </div>

              </div>
              {/* Row 3: Logs & Exceptions */}
              <div className="aad-exceptions-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'stretch' }}>

                {/* Enterprise Attendance Logs (Keka Inspired) or Team Matrix */}
                <div className="aad-logs-card" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '420px', minWidth: 0 }}>
                  <div className="aad-chart-title" style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', flexShrink: 0 }}>
                    {viewMode === 'team' && !empFilter ? 'Team Attendance Matrix' : 'Attendance Logs'}
                  </div>

                  {viewMode === 'team' && !empFilter ? (
                    <TeamAttendanceMatrix 
                      logs={activeData?.dailyLogs || []} 
                      onEmployeeClick={(id) => { setViewMode('my'); setEmpFilter(id); }} 
                    />
                  ) : (
                    <>
                      <div className="aad-logs-table-wrapper" style={{ flexGrow: 1, overflowY: 'auto' }}>
                        <table className="aad-logs-table">
                          <thead style={{ background: '#f8fafc' }}>
                            <tr style={{ fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '12px 16px', fontWeight: '600', borderTopLeftRadius: '8px' }}>Date</th>
                              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Attendance Visual</th>

                              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Gross Hours</th>
                              <th style={{ padding: '12px 16px', fontWeight: '600', borderTopRightRadius: '8px' }}>Arrival</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const allLogs = activeData?.dailyLogs || [];
                              const totalLogsPages = Math.ceil(allLogs.length / logsPerPage) || 1;
                              const currentLogs = allLogs.slice(
                                (logsCurrentPage - 1) * logsPerPage,
                                logsCurrentPage * logsPerPage
                              );

                              return currentLogs.map((log, i) => {
                                const style = getTimelineStyle(log.loginTime, log.logoutTime);
                                const dateObj = new Date(log.date);
                                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                                const isWeekend = weekday === 'Sat' || weekday === 'Sun';

                                return (
                                  <tr key={i}>
                                    <td className="aad-logs-date" style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                      <span>{formattedDate}, <span style={{ color: '#94a3b8', fontWeight: 500 }}>{weekday}</span></span>
                                      {log.workLocation === 'WFH' && <span className="keka-badge wfh" style={{ marginLeft: '6px' }}>WFH</span>}
                                      {log.workLocation === 'Remote' && <span className="keka-badge remote" style={{ marginLeft: '6px' }}>Remote</span>}
                                      {log.status === 'LEAVE' && <span className="keka-badge absent" style={{ marginLeft: '6px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>Leave</span>}
                                      {isWeekend && log.effectiveHours === 0 && <span className="keka-badge week_off" style={{ marginLeft: '6px' }}>W-Off</span>}
                                    </td>
                                    <td style={{ width: '30%', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
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

                                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                                      {log.grossHours > 0 ? (
                                        <span style={{ color: '#64748b', fontWeight: 400 }}>{fmtHM(log.grossHours)}</span>
                                      ) : (
                                        <span style={{ color: '#94a3b8' }}>—</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                                      <span style={{ color: '#334155', fontWeight: 500, fontSize: '13px' }}>
                                        {log.status === 'ON_TIME' || log.status === 'WFH' ? 'On Time' : log.status === 'LATE' ? 'Late' : log.status === 'ABSENT' ? 'Absent' : '—'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {/* Logs Pagination */}
                      {(() => {
                        const allLogs = activeData?.dailyLogs || [];
                        const totalLogsPages = Math.ceil(allLogs.length / logsPerPage) || 1;
                        if (totalLogsPages <= 1) return null;

                        return (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Showing <strong>{(logsCurrentPage - 1) * logsPerPage + 1}</strong> to <strong>{Math.min(logsCurrentPage * logsPerPage, allLogs.length)}</strong> of <strong>{allLogs.length}</strong> logs
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                disabled={logsCurrentPage === 1}
                                onClick={() => setLogsCurrentPage(logsCurrentPage - 1)}
                                style={{ padding: '4px 10px', border: '1px solid #cbd5e1', background: logsCurrentPage === 1 ? '#f1f5f9' : '#fff', color: logsCurrentPage === 1 ? '#94a3b8' : '#475569', borderRadius: '6px', fontSize: '0.8rem', cursor: logsCurrentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                              >
                                Prev
                              </button>
                              {Array.from({ length: totalLogsPages }, (_, i) => i + 1).map(page => {
                                if (page === 1 || page === totalLogsPages || (page >= logsCurrentPage - 1 && page <= logsCurrentPage + 1)) {
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => setLogsCurrentPage(page)}
                                      style={{
                                        padding: '4px 10px', border: '1px solid',
                                        borderColor: logsCurrentPage === page ? '#00A4B0' : '#cbd5e1',
                                        background: logsCurrentPage === page ? '#00A4B0' : '#fff',
                                        color: logsCurrentPage === page ? '#fff' : '#475569',
                                        borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                                      }}
                                    >
                                      {page}
                                    </button>
                                  );
                                } else if (page === logsCurrentPage - 2 || page === logsCurrentPage + 2) {
                                  return <span key={page} style={{ padding: '4px', color: '#94a3b8' }}>...</span>;
                                }
                                return null;
                              })}
                              <button
                                disabled={logsCurrentPage === totalLogsPages}
                                onClick={() => setLogsCurrentPage(logsCurrentPage + 1)}
                                style={{ padding: '4px 10px', border: '1px solid #cbd5e1', background: logsCurrentPage === totalLogsPages ? '#f1f5f9' : '#fff', color: logsCurrentPage === totalLogsPages ? '#94a3b8' : '#475569', borderRadius: '6px', fontSize: '0.8rem', cursor: logsCurrentPage === totalLogsPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Exceptions */}
                <div className="aad-exceptions-wrapper" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '420px', minWidth: 0 }}>
                  <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    <ExceptionsFeed 
                      logs={activeData.dailyLogs} 
                      anomalies={activeData.anomalies} 
                      onEmployeeClick={(id) => { setViewMode('my'); setEmpFilter(id); }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ================= MODALS ================= */}

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

          </>
        )}
      </div>

    </Sidebar>
  );
};

export default AttendanceAnalyticsDeep;
