import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Sidebar from './Sidebar.js';
import './PerformanceMobile.css';
import Mygoals from './Mygoals';
import Selfassessment from './Selfassessment';
import Goalhistory from './Goalhistory';
import Myteam from './Myteam';

import api from "../api";

function PerformancePage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Goals & Attributes');
  const [canViewTasks, setCanViewTasks] = useState(false);
  const employeeId = sessionStorage.getItem("employeeId");
  const tabsRef = useRef(null);

  const navigate = useNavigate();

  // Time periods state
  const [timePeriods, setTimePeriods] = useState([]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('All');

  const [filterYear, setFilterYear] = useState('All');
  const [filterFreq, setFilterFreq] = useState('All');
  const [filterSub, setFilterSub] = useState('All');

  const getTimePeriodLabel = (period) => {
    if (period.frequency === 'Yearly') return `Year ${period.year}`;
    if (period.frequency === 'Monthly') return `${period.month} ${period.year}`;
    if (period.frequency === 'Quarterly') {
      return `${period.quarter} - ${period.year}`;
    }
    if (period.frequency === 'Half Yearly') {
      return `${period.quarter} - ${period.year}`;
    }
    return `${period.frequency} ${period.year}`;
  };

  useEffect(() => {
    const savedPeriodsStr = localStorage.getItem('performance_time_periods');
    const savedPeriods = savedPeriodsStr ? JSON.parse(savedPeriodsStr) : [
      { id: 1, frequency: 'Quarterly', year: '2026', quarter: 'Q1', month: 'January, February, March', status: 'Active' },
      { id: 2, frequency: 'Monthly', year: '2026', quarter: '', month: 'January', status: 'Active' },
      { id: 3, frequency: 'Yearly', year: '2026', quarter: '', month: '', status: 'Active' }
    ];
    setTimePeriods(savedPeriods);
    setFilterYear('All');
    setFilterFreq('All');
    setFilterSub('All');
    setSelectedTimePeriod('All');
  }, []);

  const handleYearChange = (yr) => {
    setFilterYear(yr);
    if (yr === 'All') {
      setFilterFreq('All');
      setFilterSub('All');
      setSelectedTimePeriod('All');
      return;
    }
    const matching = timePeriods.filter(p => p.year === yr);
    if (matching.length > 0) {
      const first = matching[0];
      setFilterFreq(first.frequency);
      if (first.frequency === 'Quarterly' || first.frequency === 'Half Yearly') {
        setFilterSub(first.quarter);
      } else if (first.frequency === 'Monthly') {
        setFilterSub(first.month);
      } else {
        setFilterSub('All');
      }
      setSelectedTimePeriod(getTimePeriodLabel(first));
    } else {
      setFilterFreq('All');
      setFilterSub('All');
      setSelectedTimePeriod('All');
    }
  };

  const handleFreqChange = (freq) => {
    setFilterFreq(freq);
    if (freq === 'All') {
      setFilterSub('All');
      setSelectedTimePeriod('All');
      return;
    }
    const matching = timePeriods.filter(p => p.year === filterYear && p.frequency === freq);
    if (matching.length > 0) {
      const first = matching[0];
      if (freq === 'Quarterly' || freq === 'Half Yearly') {
        setFilterSub(first.quarter);
      } else if (freq === 'Monthly') {
        setFilterSub(first.month);
      } else {
        setFilterSub('All');
      }
      setSelectedTimePeriod(getTimePeriodLabel(first));
    } else {
      setFilterSub('All');
      setSelectedTimePeriod('All');
    }
  };

  const handleSubChange = (sub) => {
    setFilterSub(sub);
    if (sub === 'All') {
      setSelectedTimePeriod('All');
      return;
    }
    const match = timePeriods.find(p => 
      p.year === filterYear && 
      p.frequency === filterFreq && 
      ((filterFreq === 'Quarterly' || filterFreq === 'Half Yearly') ? p.quarter === sub : p.month === sub)
    );
    if (match) {
      setSelectedTimePeriod(getTimePeriodLabel(match));
    } else {
      setSelectedTimePeriod('All');
    }
  };

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 150;
      tabsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  useEffect(() => {
    const fetchTeamVisibility = async () => {
      if (!employeeId) return;

      try {
        let rawToken = sessionStorage.getItem("token");
        if (!rawToken) {
          console.error("No token found in sessionStorage. Please login.");
          setCanViewTasks(false);
          return;
        }

        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;

        const response = await api.get(`/access/assigned-ids/${employeeId}`, {
          headers: { Authorization: token },
        });

        setCanViewTasks(response.data.canViewTasks === true);

      } catch (err) {
        console.error("Error fetching team visibility:", err);
        setCanViewTasks(false);
      }
    };

    fetchTeamVisibility();
  }, [employeeId]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, activeTab: tab }
    });
  };

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Bootstrap SVG Icons
  const icons = {
    myGoals: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
      </svg>
    ),
    selfAssessment: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
        <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
      </svg>
    ),
    history: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z" />
        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
        <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z" />
      </svg>
    ),
    myTeam: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
        <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216Z" />
        <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </svg>
    ),
    performance: (
      <svg width="28" height="28" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '12px' }}>
        <path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68L9.669.864zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702 1.509.229z" />
        <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1 4 11.794z" />
      </svg>
    ),
  };

  const tabItems = [
    { id: 'Goals & Attributes', label: 'Goals & Attributes' },
    { id: 'Self Assessment', label: 'Self Assessment' },
    { id: 'History', label: 'History' },
  ];

  if (canViewTasks) {
    tabItems.push({ id: 'My Tasks', label: 'My Tasks' });
  }



  // Modern Teal Theme Styles
  const tabContainerStyle = {
    display: "flex",
    gap: "12px",
    padding: "24px 0 16px 0",
    borderBottom: "2px solid #e8ecf1",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: "auto",
    whiteSpace: "nowrap",
    background: "linear-gradient(to bottom, #ffffff 0%, #f0fdfd 100%)",
    marginBottom: "24px",
  };

  const tabStyle = (isActive) => ({
    cursor: "pointer",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: isActive ? "600" : "500",
    color: isActive ? "#ffffff" : "#64748b",
    background: isActive
      ? "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)"
      : "transparent",
    borderRadius: "8px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    boxShadow: isActive
      ? "0 4px 12px rgba(94, 234, 212, 0.4)"
      : "none",
    transform: isActive ? "translateY(-2px)" : "translateY(0)",
    border: isActive ? "none" : "1px solid transparent",
  });

  const tabHoverStyle = {
    background: "linear-gradient(135deg, rgba(94, 234, 212, 0.1) 0%, rgba(45, 212, 191, 0.1) 100%)",
    color: "#14b8a6",
    transform: "translateY(-1px)",
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Goals & Attributes':
        return (
          <Mygoals
            selectedTimePeriod={selectedTimePeriod}
            filterYear={filterYear}
            filterFreq={filterFreq}
            filterSub={filterSub}
            timePeriods={timePeriods}
          />
        );
      case 'Self Assessment':
        return (
          <Selfassessment
            selectedTimePeriod={selectedTimePeriod}
            filterYear={filterYear}
            filterFreq={filterFreq}
            filterSub={filterSub}
            timePeriods={timePeriods}
          />
        );
      case 'History':
        return (
          <Goalhistory
            selectedTimePeriod={selectedTimePeriod}
            filterYear={filterYear}
            filterFreq={filterFreq}
            filterSub={filterSub}
            timePeriods={timePeriods}
          />
        );
      case 'My Tasks':
        return <Myteam selectedTimePeriod={selectedTimePeriod} />;

      default:
        return (
          <Mygoals
            selectedTimePeriod={selectedTimePeriod}
            filterYear={filterYear}
            filterFreq={filterFreq}
            filterSub={filterSub}
            timePeriods={timePeriods}
          />
        );
    }
  };

  return (
    <Sidebar>
      <div style={{ padding: "0 0 20px 0" }} className="performance-page-container">
        {/* Header */}
        <div style={{ 
          marginBottom: "20px", 
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap"
        }} className="performance-page-header">
          <div>
            <h1 style={{
              fontSize: "30px",
              fontWeight: "normal",
              color: "#1f2937",
              margin: "0 0 4px 0",
              textAlign: "left",
            }}>
              Performance Management
            </h1>
            <p style={{ margin: 0, fontSize: "15px", color: "#00B3A4", fontWeight: "500", textAlign: "left" }}>
              Track your goals, self assessments and team performance.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <label style={{ 
                fontSize: '15px', 
                fontWeight: '600', 
                color: '#475569',
                fontFamily: "'Inter', sans-serif"
            }}>
                Time Period:
            </label>

            {/* Year Selector */}
            <select
                value={filterYear}
                onChange={(e) => handleYearChange(e.target.value)}
                style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid #14b8a6',
                    fontSize: '15px',
                    color: '#0d9488',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.05)',
                    transition: 'all 0.3s ease',
                    width: 'auto',
                    display: 'inline-block'
                }}
            >
                <option value="All">All Years</option>
                {(() => {
                  const currentYear = new Date().getFullYear();
                  return [String(currentYear - 1), String(currentYear), String(currentYear + 1)].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ));
                })()}
            </select>

            {/* Frequency Selector */}
            {filterYear !== 'All' && (
              <select
                  value={filterFreq}
                  onChange={(e) => handleFreqChange(e.target.value)}
                  style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #14b8a6',
                      fontSize: '15px',
                      color: '#0d9488',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.05)',
                      transition: 'all 0.3s ease',
                      width: 'auto',
                      display: 'inline-block'
                  }}
              >
                  <option value="All">All Frequencies</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half Yearly">Half Yearly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
              </select>
            )}

            {/* Sub-period Selector (Month / Quarter / Half) */}
            {filterYear !== 'All' && filterFreq === 'Monthly' && (
              <select
                  value={filterSub}
                  onChange={(e) => handleSubChange(e.target.value)}
                  style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #14b8a6',
                      fontSize: '15px',
                      color: '#0d9488',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.05)',
                      transition: 'all 0.3s ease',
                      width: 'auto',
                      display: 'inline-block'
                  }}
              >
                  <option value="All">All Months</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
              </select>
            )}

            {filterYear !== 'All' && filterFreq === 'Quarterly' && (
              <select
                  value={filterSub}
                  onChange={(e) => handleSubChange(e.target.value)}
                  style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #14b8a6',
                      fontSize: '15px',
                      color: '#0d9488',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.05)',
                      transition: 'all 0.3s ease',
                      width: 'auto',
                      display: 'inline-block'
                  }}
              >
                  <option value="All">All Quarters</option>
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                    const period = timePeriods.find(p => p.frequency === 'Quarterly' && p.year === filterYear && p.quarter === q);
                    const label = q;
                    return <option key={q} value={q}>{label}</option>;
                  })}
              </select>
            )}

            {filterYear !== 'All' && filterFreq === 'Half Yearly' && (
              <select
                  value={filterSub}
                  onChange={(e) => handleSubChange(e.target.value)}
                  style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #14b8a6',
                      fontSize: '15px',
                      color: '#0d9488',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.05)',
                      transition: 'all 0.3s ease',
                      width: 'auto',
                      display: 'inline-block'
                  }}
              >
                  <option value="All">All Halves</option>
                  {['H1', 'H2'].map(h => {
                    const period = timePeriods.find(p => p.frequency === 'Half Yearly' && p.year === filterYear && p.quarter === h);
                    const label = h;
                    return <option key={h} value={h}>{label}</option>;
                  })}
              </select>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-wrapper">
          <button className="scroll-btn left" onClick={() => scrollTabs('left')}>
            <FiChevronLeft />
          </button>

          <div className="performance-tabs-container" ref={tabsRef}>
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`performance-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button className="scroll-btn right" onClick={() => scrollTabs('right')}>
            <FiChevronRight />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem 0', fontFamily: 'sans-serif' }}>
          {renderContent()}
        </div>
      </div>
    </Sidebar>
  );
}

export default PerformancePage;
