import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from './Sidebar';
import './AttendanceAnalyticsDeep.css';

/* ─── Helpers ──────────────────────────────────────────────── */
const fmtDate = d => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};
const startOfMonth = () => { const d = new Date(); return fmtDate(new Date(d.getFullYear(), d.getMonth(), 1)); };
const endOfToday = () => fmtDate(new Date());
const fmtHM = h => {
  if (!h && h !== 0) return '—';
  return `${Math.floor(h)}h ${Math.round((h - Math.floor(h)) * 60)}m`;
};

/* ─── Module Card Definitions ──────────────────────────────── */
const MODULES = [
  {
    key: 'attendance',
    title: 'Attendance',
    description: 'Punctuality analysis, work-hour trends, calendar heatmaps, location insights, and anomaly detection.',
    icon: 'bi-clock-history',
    iconBg: 'rgba(99, 102, 241, 0.1)',
    iconColor: '#6366f1',
    route: '/analytics/attendance',
    active: true,
    statKey: 'attendance',
  },
  /*
  {
    key: 'team-attendance',
    title: 'Team Attendance',
    description: 'Enterprise manager dashboard: team health score, benchmarking, overtime distribution, forecasting & drill-downs.',
    icon: 'bi-people-fill',
    iconBg: 'rgba(20, 184, 166, 0.1)',
    iconColor: '#14b8a6',
    route: '/analytics/team-attendance',
    active: true,
    statKey: null,
  },
  */
  {
    key: 'leave',
    title: 'Leave',
    description: 'Leave balance tracking, utilization patterns, type-wise breakdown, and team availability forecasts.',
    icon: 'bi-calendar2-minus',
    iconBg: 'rgba(16, 185, 129, 0.1)',
    iconColor: '#10b981',
    route: '/analytics/leave',
    active: true, // Make all cards clickable
    statKey: 'leave',
  },
  {
    key: 'payroll',
    title: 'Payroll',
    description: 'Earnings & deductions analysis, YTD summaries, net pay trends, and tax declaration insights.',
    icon: 'bi-currency-rupee',
    iconBg: 'rgba(245, 158, 11, 0.1)',
    iconColor: '#f59e0b',
    route: '/analytics/payroll',
    active: true,
    statKey: 'salary',
  },
  {
    key: 'performance',
    title: 'Performance',
    description: 'Goal completion rates, review cycle progress, competency mapping, and team benchmarks.',
    icon: 'bi-trophy',
    iconBg: 'rgba(236, 72, 153, 0.1)',
    iconColor: '#ec4899',
    route: '/analytics/performance',
    active: true,
    statKey: null,
  },
  {
    key: 'expense',
    title: 'Expense & Travel',
    description: 'Claims pipeline, reimbursement timelines, travel request analytics, and spending patterns.',
    icon: 'bi-receipt',
    iconBg: 'rgba(59, 130, 246, 0.1)',
    iconColor: '#3b82f6',
    route: '/analytics/expense',
    active: true,
    statKey: 'expense',
  },
  /*
  {
    key: 'workforce',
    title: 'Workforce',
    description: 'Headcount trends, department health scores, attrition risk, burnout indicators, and diversity metrics.',
    icon: 'bi-people',
    iconBg: 'rgba(139, 92, 246, 0.1)',
    iconColor: '#8b5cf6',
    route: '/analytics/workforce',
    active: true,
    statKey: null,
  },
  */
];

/* ─── Stat Pill Component ──────────────────────────────────── */
const StatPill = ({ label, value }) => (
  <div className="analytics-hub-stat-pill">
    <strong>{value}</strong> {label}
  </div>
);

/* ─── Module Card Component ────────────────────────────────── */
const ModuleCard = ({ module, hubData, onClick }) => {
  const getStat = () => {
    if (!hubData || !module.statKey) return null;
    const d = hubData[module.statKey];
    if (!d) return null;

    switch (module.statKey) {
      case 'attendance':
        return (
          <div className="analytics-hub-card-stats">
            <StatPill label="avg hrs" value={fmtHM(d.averageEffectiveHours)} />
            <StatPill label="on-time" value={`${d.onTimePercentage?.toFixed(0) || 0}%`} />
          </div>
        );
      case 'leave':
        return (
          <div className="analytics-hub-card-stats">
            <StatPill label="balance" value={d.totalBalance || 0} />
            <StatPill label="used" value={d.totalConsumed || 0} />
          </div>
        );
      case 'salary':
        return (
          <div className="analytics-hub-card-stats">
            <StatPill label="latest net" value={d.latestNetPay ? `₹${(d.latestNetPay / 1000).toFixed(0)}K` : '—'} />
          </div>
        );
      case 'expense':
        return (
          <div className="analytics-hub-card-stats">
            <StatPill label="pending" value={d.pendingClaimCount || 0} />
            <StatPill label="approved" value={d.approvedClaimCount || 0} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`analytics-hub-card ${module.active ? '' : 'disabled'}`}
      onClick={() => module.active && onClick(module.route)}
      role="button"
      tabIndex={module.active ? 0 : -1}
      onKeyDown={e => e.key === 'Enter' && module.active && onClick(module.route)}
    >
      <div
        className="analytics-hub-card-icon"
        style={{ background: module.iconBg, color: module.iconColor }}
      >
        <i className={`bi ${module.icon}`} />
      </div>

      <h3 className="analytics-hub-card-title">{module.title}</h3>
      <p className="analytics-hub-card-desc">{module.description}</p>

      {getStat()}

      <div className="analytics-hub-card-footer">
        <span className={`analytics-hub-badge ${module.key === 'attendance' || module.key === 'team-attendance' ? 'active' : 'coming-soon'}`}>
          {module.key === 'attendance' || module.key === 'team-attendance' ? '● Live' : 'Building'}
        </span>
        {module.active && (
          <span className="analytics-hub-card-arrow">
            <i className="bi bi-arrow-right" />
          </span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN HUB COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const ScalozAnalyticsHub = () => {
  const navigate = useNavigate();
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHub = async () => {
      try {
        const token = sessionStorage.getItem('scaloz_token') || sessionStorage.getItem('token');
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8082/api';
        const res = await fetch(
          `${baseUrl}/v1/data/metrics/hub?startDate=${startOfMonth()}&endDate=${endOfToday()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setHubData(data);
        }
      } catch (err) {
        console.warn('Could not load hub stats — cards will render without preview stats.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHub();
  }, []);

  return (
    <Sidebar>
      <div className="analytics-hub-page">
        
        {/* Breadcrumb */}
        <div className="aad-breadcrumb">
          <span style={{ cursor: 'pointer', color: '#14b8a6', fontWeight: 500 }} onClick={() => navigate('/dashboard')}>Home</span>
          <span>/</span>
          <span>Analytics Hub</span>
        </div>

        {/* ─── Header matching Reports ─── */}
        <div className="analytics-hub-header">
          <div className="analytics-hub-header-top">
            <div className="analytics-hub-header-left">
              <i className="bi bi-bar-chart-line analytics-hub-icon" />
              <div>
                <h1 className="analytics-hub-title">Analytics Command Center</h1>
                <p className="analytics-hub-subtitle">Explore enterprise-grade insights across every HR module</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Module Grid ─── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="aad-spinner" />
          </div>
        ) : (
          <div className="analytics-hub-grid">
            {MODULES.map(mod => (
              <ModuleCard
                key={mod.key}
                module={mod}
                hubData={hubData}
                onClick={route => navigate(route)}
              />
            ))}
          </div>
        )}

      </div>
    </Sidebar>
  );
};

export default ScalozAnalyticsHub;
