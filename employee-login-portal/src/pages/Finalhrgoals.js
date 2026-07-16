
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from "xlsx-js-style";
import './Dashboard.css';
import Sidebar from './Sidebar.js';
import api from "../api";
const SubTab = ({ title, isActive, onClick }) => (
  <div
    onClick={onClick}
    style={{
      cursor: 'pointer',
      padding: '10px 20px',
      fontWeight: isActive ? '700' : '500',
      color: isActive ? '#0d9488' : '#64748b',
      borderBottom: isActive ? '3px solid #14b8a6' : '3px solid transparent',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: isActive ? 'rgba(20, 184, 166, 0.05)' : 'transparent',
      borderRadius: '8px 8px 0 0',
      userSelect: 'none',
    }}
  >
    {title}
  </div>
);

function FinalHrGoals() {
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };

  const [employeeName] = useState(sessionStorage.getItem("employeeName"));
  const navigate = useNavigate();

  const location = useLocation();
  const initialEmployeeId = location.state?.employeeId || sessionStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [activeSubTab, setActiveSubTab] = useState('Goals');
  const [allGoals, setAllGoals] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
      const monthStr = period.month ? ` (${period.month})` : '';
      return `${period.quarter}${monthStr} - ${period.year}`;
    }
    if (period.frequency === 'Half Yearly') {
      return `${period.quarter} - ${period.year}`;
    }
    return `${period.frequency} ${period.year}`;
  };

  // Robust local matching function with overlap detection
  const matchesTimePeriod = (itemTimePeriod) => {
    if (!itemTimePeriod) return false;
    if (!filterYear || filterYear === 'All') return true;

    // Year must match
    if (!itemTimePeriod.includes(filterYear)) return false;

    // If filtering by "All Frequencies", year match is sufficient
    if (filterFreq === 'All') return true;

    const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const getItemMonths = (itp) => {
        if (itp.startsWith('Year')) return allMonths;
        if (itp.startsWith('Q')) {
            const q = itp.substring(0, 2);
            const yr = itp.slice(-4);
            const match = timePeriods.find(p => p.frequency === 'Quarterly' && p.year === yr && p.quarter === q);
            if (match && match.month) return match.month.split(', ');
            if (q === 'Q1') return ['January', 'February', 'March'];
            if (q === 'Q2') return ['April', 'May', 'June'];
            if (q === 'Q3') return ['July', 'August', 'September'];
            if (q === 'Q4') return ['October', 'November', 'December'];
        }
        if (itp.startsWith('H')) {
            const h = itp.substring(0, 2);
            const yr = itp.slice(-4);
            const match = timePeriods.find(p => p.frequency === 'Half Yearly' && p.year === yr && p.quarter === h);
            if (match && match.month) return match.month.split(', ');
            if (h === 'H1') return ['January', 'February', 'March', 'April', 'May', 'June'];
            if (h === 'H2') return ['July', 'August', 'September', 'October', 'November', 'December'];
        }
        for (const m of allMonths) {
            if (itp.startsWith(m)) return [m];
        }
        return [];
    };

    const getFilterMonths = () => {
        if (filterFreq === 'Yearly') return allMonths;
        if (filterFreq === 'Monthly') {
            return filterSub === 'All' ? allMonths : [filterSub];
        }
        if (filterFreq === 'Quarterly') {
            if (filterSub === 'All') return allMonths;
            const match = timePeriods.find(p => p.frequency === 'Quarterly' && p.year === filterYear && p.quarter === filterSub);
            if (match && match.month) return match.month.split(', ');
            if (filterSub === 'Q1') return ['January', 'February', 'March'];
            if (filterSub === 'Q2') return ['April', 'May', 'June'];
            if (filterSub === 'Q3') return ['July', 'August', 'September'];
            if (filterSub === 'Q4') return ['October', 'November', 'December'];
        }
        if (filterFreq === 'Half Yearly') {
            if (filterSub === 'All') return allMonths;
            const match = timePeriods.find(p => p.frequency === 'Half Yearly' && p.year === filterYear && p.quarter === filterSub);
            if (match && match.month) return match.month.split(', ');
            if (filterSub === 'H1') return ['January', 'February', 'March', 'April', 'May', 'June'];
            if (filterSub === 'H2') return ['July', 'August', 'September', 'October', 'November', 'December'];
        }
        return allMonths;
    };

    const itemMonths = getItemMonths(itemTimePeriod);
    const filterMonths = getFilterMonths();

    if (itemMonths.length === 0 || filterMonths.length === 0) {
        return itemTimePeriod.includes(filterSub === 'All' ? filterYear : filterSub);
    }

    return itemMonths.some(m => filterMonths.includes(m));
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

  const [filterTerms, setFilterTerms] = useState({
    goalTitle: '',
    goalDescription: '',
    metric: '',
    target: '',
    rating: '',
    selfAssessment: '',
    managerComments: '',
    managerRating: '',
    reviewerComments: '',
    status: '',
  });

  const [filterVisible, setFilterVisible] = useState({});


  useEffect(() => {
    if (!employeeId) {
      setError('No employee ID selected.');
      setLoading(false);
      return;
    }
    fetchAllGoals();
  }, [employeeId]);


  const fetchAllGoals = async () => {

    setLoading(true);
    try {
      let token = sessionStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      if (token.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1);

      // Fetch goals
      const response = await api.get(`/goals/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllGoals(response.data);

      // Fetch attributes
      const attrResponse = await api.get(`/attributes/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllAttributes(attrResponse.data);

      setError('');
    } catch (err) {
      console.error('Error fetching goals and attributes:', err.message);
      setError(err.message);
      setAllGoals([]);
      setAllAttributes([]);
    } finally {
      setLoading(false);
    }
  };



  const handleFilterChange = (key, value) => {
    setFilterTerms(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilterVisibility = (key) => {
    setFilterVisible(prev => {
      const newState = Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {});
      return { ...newState, [key]: !prev[key] };
    });
  };

  const filterAndSortGoals = () => {
    let filtered = [...allGoals];

    // Filter by selected time period
    filtered = filtered.filter(goal => matchesTimePeriod(goal.timePeriod));

    Object.keys(filterTerms).forEach(key => {
      const filterValue = filterTerms[key]?.trim();
      if (filterValue) {
        filtered = filtered.filter(goal => {
          let goalValue = goal[key];
          if (goalValue === undefined || goalValue === null) return false;
          goalValue = String(goalValue).toLowerCase();
          const exactMatchKeys = ['status', 'rating', 'managerRating'];
          if (exactMatchKeys.includes(key)) return goalValue.toLowerCase() === filterValue.toLowerCase();
          return goalValue.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });
    return filtered.sort((a, b) => Number(a.goalId) - Number(b.goalId));
  };

  const filterAndSortAttributes = () => {
    let filtered = [...allAttributes];

    // Filter by selected time period
    filtered = filtered.filter(attr => matchesTimePeriod(attr.timePeriod));

    Object.keys(filterTerms).forEach(key => {
      const filterValue = filterTerms[key]?.trim();
      if (filterValue) {
        filtered = filtered.filter(attr => {
          let attrValue = attr[key === 'goalTitle' ? 'attributeTitle' : key === 'goalDescription' ? 'attributeDescription' : key];
          if (attrValue === undefined || attrValue === null) return false;
          attrValue = String(attrValue).toLowerCase();
          const exactMatchKeys = ['status', 'rating', 'managerRating'];
          if (exactMatchKeys.includes(key)) return attrValue.toLowerCase() === filterValue.toLowerCase();
          return attrValue.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });
    return filtered.sort((a, b) => Number(a.attributeId) - Number(b.attributeId));
  };

  const filteredAndSortedGoals = filterAndSortGoals();
  const filteredAndSortedAttributes = filterAndSortAttributes();

  const handleDownload = () => {
    if (activeSubTab === 'Goals') {
      if (!filteredAndSortedGoals.length) {
        alert("No data available to download!");
        return;
      }
      const exportData = filteredAndSortedGoals.map(goal => ({
        "Goal Title": goal.goalTitle,
        "Description": goal.goalDescription,
        "Weightage": goal.metric,
        "Target": goal.target,
        "Self Rating": goal.rating,
        "Self Assessment": goal.selfAssessment,
        "Manager Comments": goal.managerComments,
        "Manager Rating": goal.managerRating,
        "Reviewer Comments": goal.reviewerComments,
        "Status": goal.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Goals");
      XLSX.writeFile(workbook, `Employee_${employeeId}_Goals.xlsx`);
    } else {
      if (!filteredAndSortedAttributes.length) {
        alert("No data available to download!");
        return;
      }
      const exportData = filteredAndSortedAttributes.map(attr => ({
        "Attribute Title": attr.attributeTitle,
        "Description": attr.attributeDescription,
        "Self Rating": attr.rating,
        "Self Assessment": attr.selfAssessment,
        "Manager Comments": attr.managerComments,
        "Manager Rating": attr.managerRating,
        "Reviewer Comments": attr.reviewerComments,
        "Status": attr.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attributes");
      XLSX.writeFile(workbook, `Employee_${employeeId}_Attributes.xlsx`);
    }
  };

  const thStyle = {
    background: '#629AF1',
    color: 'white',
    textAlign: 'center',
    padding: '6px 16px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '8px 6px',
    border: '1px solid #e0e0e0',
    textAlign: 'center',
    fontSize: '13px',
    backgroundColor: '#f4f6f8'
  };

  const textTdStyle = {
    ...tdStyle,
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    padding: '8px 12px',
  };

  return (
    <Sidebar>
      <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', height: "70vh" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)',
            transition: 'all 0.3s ease',
            width: 'fit-content',
            marginBottom: '15px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-3px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.2)';
          }}
        >
          Back
        </button>

        <div className="approved-goals-container" style={{ flexGrow: 1 }}>
          {loading && <p>Loading goals...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && (
            <>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px"
              }}>
                <h2 style={{ fontSize: "18px", margin: 0 }}>{activeSubTab === 'Goals' ? 'Goals' : 'Attributes'} for Employee ID: {getDisplayEmployeeId(employeeId)}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Period Filter Selector */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    flexWrap: 'nowrap',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginRight: '4px',
                    }}>
                      Period
                    </span>

                    {/* Year Selector */}
                    <select
                      value={filterYear}
                      onChange={(e) => handleYearChange(e.target.value)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid #14b8a6',
                        fontSize: '13px',
                        color: '#0d9488',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                        fontWeight: '600',
                        fontFamily: "'Inter', sans-serif",
                        boxShadow: '0 1px 3px rgba(20, 184, 166, 0.08)',
                        transition: 'all 0.2s ease',
                        minWidth: '90px',
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
                      <>
                        <span style={{ color: '#cbd5e1', fontSize: '16px' }}>›</span>
                        <select
                          value={filterFreq}
                          onChange={(e) => handleFreqChange(e.target.value)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #14b8a6',
                            fontSize: '13px',
                            color: '#0d9488',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            outline: 'none',
                            fontWeight: '600',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 1px 3px rgba(20, 184, 166, 0.08)',
                            transition: 'all 0.2s ease',
                            minWidth: '110px',
                          }}
                        >
                          <option value="All">All Frequencies</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Half Yearly">Half Yearly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </>
                    )}

                    {/* Month/Quarter Selector */}
                    {filterYear !== 'All' && filterFreq === 'Monthly' && (
                      <>
                        <span style={{ color: '#cbd5e1', fontSize: '16px' }}>›</span>
                        <select
                          value={filterSub}
                          onChange={(e) => handleSubChange(e.target.value)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #14b8a6',
                            fontSize: '13px',
                            color: '#0d9488',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            outline: 'none',
                            fontWeight: '600',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 1px 3px rgba(20, 184, 166, 0.08)',
                            transition: 'all 0.2s ease',
                            minWidth: '110px',
                          }}
                        >
                          <option value="All">All Months</option>
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </>
                    )}

                    {filterYear !== 'All' && filterFreq === 'Quarterly' && (
                      <>
                        <span style={{ color: '#cbd5e1', fontSize: '16px' }}>›</span>
                        <select
                          value={filterSub}
                          onChange={(e) => handleSubChange(e.target.value)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #14b8a6',
                            fontSize: '13px',
                            color: '#0d9488',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            outline: 'none',
                            fontWeight: '600',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 1px 3px rgba(20, 184, 166, 0.08)',
                            transition: 'all 0.2s ease',
                            minWidth: '110px',
                          }}
                        >
                          <option value="All">All Quarters</option>
                          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                            const label = q;
                            return <option key={q} value={q}>{label}</option>;
                          })}
                        </select>
                      </>
                    )}

                    {filterYear !== 'All' && filterFreq === 'Half Yearly' && (
                      <>
                        <span style={{ color: '#cbd5e1', fontSize: '16px' }}>›</span>
                        <select
                          value={filterSub}
                          onChange={(e) => handleSubChange(e.target.value)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #14b8a6',
                            fontSize: '13px',
                            color: '#0d9488',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            outline: 'none',
                            fontWeight: '600',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 1px 3px rgba(20, 184, 166, 0.08)',
                            transition: 'all 0.2s ease',
                            minWidth: '110px',
                          }}
                        >
                          <option value="All">All Halves</option>
                          {['H1', 'H2'].map(h => {
                            const period = timePeriods.find(p => p.frequency === 'Half Yearly' && p.year === filterYear && p.quarter === h);
                            const label = h;
                            return <option key={h} value={h}>{label}</option>;
                          })}
                        </select>
                      </>
                    )}
                  </div>

                  {((activeSubTab === 'Goals' && filteredAndSortedGoals.length > 0) || (activeSubTab === 'Attributes' && filteredAndSortedAttributes.length > 0)) && (
                    <button
                      onClick={handleDownload}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: "white",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                      }}
                    >
                      Download Report
                    </button>
                  )}
                </div>
              </div>

              {/* Sub Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '2px solid #e2e8f0',
                marginBottom: '20px',
                gap: '4px'
              }}>
                <SubTab
                  title="Goals"
                  isActive={activeSubTab === 'Goals'}
                  onClick={() => setActiveSubTab('Goals')}
                />
                <SubTab
                  title="Attributes"
                  isActive={activeSubTab === 'Attributes'}
                  onClick={() => setActiveSubTab('Attributes')}
                />
              </div>

              <div style={{
                maxHeight: 'calc(100vh - 280px)',
                overflow: 'auto',
                borderRadius: '8px',
                boxShadow: '0 0 6px rgba(0,0,0,0.1)',
                border: '1px solid #ddd',
              }}>
                <table style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  minWidth: '1200px',
                  backgroundColor: 'white',
                  tableLayout: 'fixed',
                  wordWrap: 'break-word',
                }}>
                  <thead>
                    <tr>
                      {[
                        { key: 'goalTitle', label: 'Title', align: 'left', width: '12%' },
                        { key: 'goalDescription', label: 'Description', align: 'left', width: activeSubTab === 'Goals' ? '18%' : '26%' },
                        { key: 'metric', label: 'Weightage (%)', width: '10%' },
                        { key: 'target', label: 'Target', width: '11%' },
                        { key: 'selfAssessment', label: 'Self Assessment', align: 'left', width: '14%' },
                        { key: 'managerComments', label: 'MNG Comments', align: 'left', width: '14%' },
                        { key: 'reviewerComments', label: 'Reviewer Comments', align: 'left', width: '14%' },
                        {
                          key: 'status', label: 'Status', type: 'select', options: [
                            'Pending', 'Submitted', 'Approved', 'Rejected',
                            'In Progress', 'Rejected by Reviewer', 'Completed',
                          ], width: '10%'
                        },
                      ].filter(col => activeSubTab !== 'Attributes' || (col.key !== 'target' && col.key !== 'metric')).map(({ key, label, type, options, width, align }, idx, arr) => (
                        <th
                          key={key}
                          style={{
                            ...thStyle,
                            cursor: key === 'status' ? 'pointer' : 'default',
                            width: width || 'auto',
                            whiteSpace: (width && key !== 'metric') ? 'normal' : 'nowrap',
                            borderTopLeftRadius: idx === 0 ? '8px' : '0px',
                            borderTopRightRadius: idx === arr.length - 1 ? '8px' : '0px',
                            textAlign: align || 'center',
                          }}
                          onClick={() => key === 'status' && toggleFilterVisibility(key)}
                        >
                          {label}
                          {key === 'status' && filterVisible[key] && (
                            <div style={{
                              marginTop: '4px',
                              padding: '4px',
                              borderRadius: '4px',
                            }}>
                              {type === 'select' ? (
                                <select
                                  value={filterTerms[key]}
                                  onChange={(e) => handleFilterChange(key, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '4px',
                                    fontSize: '12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">All</option>
                                  {options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  value={filterTerms[key]}
                                  onChange={(e) => handleFilterChange(key, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '4px',
                                    fontSize: '12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {(activeSubTab === 'Goals' ? filteredAndSortedGoals : filteredAndSortedAttributes).length > 0 ? (
                      (activeSubTab === 'Goals' ? filteredAndSortedGoals : filteredAndSortedAttributes).map(item => (
                        <tr key={activeSubTab === 'Goals' ? item.goalId : item.attributeId}>
                           <td style={textTdStyle}>
                             {activeSubTab === 'Goals' ? (
                               item.goalTitle
                             ) : (
                               item.attributeTitle
                             )}
                           </td>
                           <td style={textTdStyle}>{activeSubTab === 'Goals' ? item.goalDescription : item.attributeDescription}</td>
                           {activeSubTab !== 'Attributes' && <td style={tdStyle}>{item.metric ? `${item.metric}%` : '-'}</td>}
                           {activeSubTab !== 'Attributes' && <td style={tdStyle}>{item.target}</td>}
                          <td style={textTdStyle}>{item.selfAssessment}</td>
                          <td style={textTdStyle}>{item.managerComments}</td>
                          <td style={textTdStyle}>{item.reviewerComments ?? '-'}</td>
                          <td style={tdStyle}>{item.status ?? '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={activeSubTab === 'Attributes' ? 6 : 8} style={{
                          ...tdStyle,
                          textAlign: 'center',
                          padding: '40px 20px',
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#64748b',
                          backgroundColor: '#f8fafc'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span>No {activeSubTab.toLowerCase()} found</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </>
          )}
        </div>
      </div>

    </Sidebar>
  );
}

export default FinalHrGoals;



