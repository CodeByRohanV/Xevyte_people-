import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
import api from "../api";

// Sub-tab component
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
      fontSize: '15px',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: isActive ? 'rgba(20, 184, 166, 0.05)' : 'transparent',
      borderRadius: '8px 8px 0 0',
      userSelect: 'none',
    }}
  >
    {title}
  </div>
);

function Goalhistory({
  selectedTimePeriod = 'All',
  filterYear = 'All',
  filterFreq = 'All',
  filterSub = 'All',
  timePeriods = []
}) {
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('Goals');

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
            if (match && match.month) return match.month.split(', ').map(m => m.split(' ')[0]);
            if (q === 'Q1') return ['January', 'February', 'March'];
            if (q === 'Q2') return ['April', 'May', 'June'];
            if (q === 'Q3') return ['July', 'August', 'September'];
            if (q === 'Q4') return ['October', 'November', 'December'];
        }
        if (itp.startsWith('H')) {
            const h = itp.substring(0, 2);
            const yr = itp.slice(-4);
            const match = timePeriods.find(p => p.frequency === 'Half Yearly' && p.year === yr && p.quarter === h);
            if (match && match.month) return match.month.split(', ').map(m => m.split(' ')[0]);
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
            if (match && match.month) return match.month.split(', ').map(m => m.split(' ')[0]);
            if (filterSub === 'Q1') return ['January', 'February', 'March'];
            if (filterSub === 'Q2') return ['April', 'May', 'June'];
            if (filterSub === 'Q3') return ['July', 'August', 'September'];
            if (filterSub === 'Q4') return ['October', 'November', 'December'];
        }
        if (filterFreq === 'Half Yearly') {
            if (filterSub === 'All') return allMonths;
            const match = timePeriods.find(p => p.frequency === 'Half Yearly' && p.year === filterYear && p.quarter === filterSub);
            if (match && match.month) return match.month.split(', ').map(m => m.split(' ')[0]);
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


  // Icons and Theme Colors
  const colors = {
    primary: '#14b8a6',
    secondary: '#2dd4bf',
    text: '#0f172a',
    muted: '#64748b'
  };

  const icons = {
    history: (
      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style={{ marginBottom: '10px' }}>
        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z" />
        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
      </svg>
    )
  };

  // State for goals functionality
  const [goals, setGoals] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goalComments, setGoalComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [commentingGoalId, setCommentingGoalId] = useState(null);
  const commentCountersRef = useRef({});
  const [expandedCommentGoals, setExpandedCommentGoals] = useState([]);

  // 🆕 NEW: Filter states for Goal History
  const [filters, setFilters] = useState({
    status: ''
  });

  // Goals related functions
  const normalizeGoal = (g) => {
    const goalId = g.goalId ?? g.id ?? g.goalID ?? g.goal_id;
    return { ...g, goalId };
  };

  // Helper to format date as DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // Fallback if parsing fails

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };



  // 🆕 NEW: Fetch archived goals and attributes (history)
  const fetchGoalsAndAttributes = async () => {
    if (!employeeId) {
      setError("No employee logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please login.");
      }

      // Remove quotes if present
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      // Build URLs with optional year filter
      let goalsUrl = `/goals/history/employee/${employeeId}`;
      let attrsUrl = `/attributes/history/employee/${employeeId}`;

      const [goalsRes, attrsRes] = await Promise.all([
        api.get(goalsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(attrsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (!Array.isArray(goalsRes.data)) {
        throw new Error("Goals data is not an array");
      }
      if (!Array.isArray(attrsRes.data)) {
        throw new Error("Attributes data is not an array");
      }

      console.log("Fetched archived goals:", goalsRes.data);
      console.log("Fetched archived attributes:", attrsRes.data);

      const normalized = goalsRes.data.map(normalizeGoal);
      setGoals(normalized);
      setAttributes(attrsRes.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("fetchGoalsAndAttributes error:", err);
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const toggleComments = (goalId) => {
    fetchComments(goalId);
    setExpandedCommentGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const submitComment = async (goalId) => {
    if (!newComment.trim()) return;

    if (!commentCountersRef.current[goalId]) {
      commentCountersRef.current[goalId] = (goalComments[goalId]?.length || 0) + 1;
    } else {
      commentCountersRef.current[goalId] += 1;
    }

    const generatedCommenterId = `${commentCountersRef.current[goalId]}`;

    const payload = {
      commenterId: generatedCommenterId,
      commenterRole: "EMPLOYEE",
      commentText: newComment
    };

    try {
      let token = sessionStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Remove quotes if present
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      await api.post(`/goals/${goalId}/comments`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNewComment("");
      fetchComments(goalId);
      setCommentingGoalId(null);
    } catch (err) {
      console.error("submitComment error:", err);
    }
  };

  const fetchComments = async (goalId) => {
    try {
      let token = sessionStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Remove quotes if present
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      const response = await api.get(`/goals/${goalId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGoalComments(prev => ({ ...prev, [goalId]: response.data }));
      commentCountersRef.current[goalId] = response.data.length;
    } catch (err) {
      console.error("fetchComments error:", err);
    }
  };

  useEffect(() => {
    fetchGoalsAndAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // 🆕 NEW: Filter goals by selected half (H1/H2) and status
  const filteredGoals = goals.filter(goal => {
    if (!matchesTimePeriod(goal.timePeriod)) {
      return false;
    }

    // ⬇️ MODIFICATION: Filter by status (dropdown selection)
    const goalStatusLower = (goal.status || '').toLowerCase();

    // If a specific status filter is selected, strictly substring match or exact match
    if (filters.status) {
      if (filters.status === 'rejected') {
        if (!goalStatusLower.includes('rejected')) {
          return false;
        }
      } else if (goalStatusLower !== filters.status.toLowerCase()) {
        return false;
      }
    }

    // Search filtering removed as requested

    return true;
  });

  // Filter attributes by selected half (H1/H2) and status
  const filteredAttributes = attributes.filter(attr => {
    if (!matchesTimePeriod(attr.timePeriod)) {
      return false;
    }

    const attrStatusLower = (attr.status || '').toLowerCase();

    if (filters.status) {
      if (filters.status === 'rejected') {
        if (!attrStatusLower.includes('rejected')) {
          return false;
        }
      } else if (attrStatusLower !== filters.status.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // 🆕 NEW: Handler for filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Styles
  const cardStyle = {
    backgroundColor: "#f9f9f9",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "30px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const thStyle = {
    textAlign: 'left',
    padding: '6px 16px',
    background: '#629AF1',
    color: 'white',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    border: 'none',
  };

  const tdStyle = {
    padding: '12px 8px',
    borderBottom: '1px solid #e0e0e0',
    borderRight: '1px solid #e0e0e0',
    textAlign: 'left',
    verticalAlign: 'top',
    backgroundColor: "transparent",
    color: '#334155',
    fontSize: '15px'
  };

  const buttonStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    color: "white",
    backgroundColor: "#007bff",
  };

  const filterContainerStyle = {
    display: "flex",
    gap: "15px",
    marginBottom: "20px",
    padding: "0",
    backgroundColor: "transparent",
    borderRadius: "0",
    boxShadow: "none",
    flexWrap: "wrap",
    alignItems: "center"
  };

  const filterGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  };

  const filterLabelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a"
  };

  const filterSelectStyle = {
    padding: "8px 12px",
    paddingRight: "32px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    minWidth: "160px",
    cursor: "pointer",
    backgroundColor: "white",
    color: "#334155",
    // Remove fixed height to allow padding to define it, 
    // or keep it if strictly needed but alignment comes from line-height
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23334155' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    lineHeight: "1.5",
    outline: "none"
  };

  if (loading) {
    return (
      <div className="main-contentas" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
        background: "linear-gradient(to bottom, #ffffff 0%, #f0fdfd 100%)",
        borderRadius: "8px",
        padding: "40px",
        textAlign: "center",
        marginTop: 20,
        border: "1px dashed #99f6e4"
      }}>
        <p style={{ color: colors.muted, fontSize: "15px" }}>Loading goal history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-contentas" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
        background: "linear-gradient(to bottom, #ffffff 0%, #f0fdfd 100%)",
        borderRadius: "8px",
        padding: "40px",
        textAlign: "center",
        marginTop: 20,
        border: "1px dashed #99f6e4"
      }}>
        <p style={{ color: "red", fontSize: "15px" }}>Error: {error}</p>
      </div>
    );
  }



  return (
    <div className="main-contentas" style={{ marginTop: 20 }}>

      {/* Sub-tabs: Goals / Attributes */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
      }}>
        <SubTab title="Goals" isActive={activeSubTab === 'Goals'} onClick={() => setActiveSubTab('Goals')} />
        <SubTab title="Attributes" isActive={activeSubTab === 'Attributes'} onClick={() => setActiveSubTab('Attributes')} />
      </div>

      {/* 🆕 NEW: Filter Section */}
      <div style={filterContainerStyle}>
        <div style={filterGroupStyle}>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={filterSelectStyle}
          >
            <option value="">Select Status</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>


      <div style={{
        overflowX: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        backgroundColor: 'white'
      }}>
        <table style={{
          width: "100%",
          minWidth: "1200px",
          borderCollapse: "collapse"
        }}>
          {activeSubTab === 'Goals' ? (
            <>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '15%', borderTopLeftRadius: '8px' }}>Title</th>
                  <th style={{ ...thStyle, width: '20%' }}>Description</th>
                  <th style={{ ...thStyle, width: '15%' }}>Self Assessment</th>
                  <th style={{ ...thStyle, width: '12%' }}>Mgr Comments</th>
                  <th style={{ ...thStyle, width: '12%' }}>Reviewer Comments</th>
                  <th style={{ ...thStyle, width: '5%' }}>Start Date</th>
                  <th style={{ ...thStyle, width: '5%', borderRight: 'none', borderTopRightRadius: '8px' }}>End Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => (
                    <tr key={goal.goalId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td data-label="Title" style={{ ...tdStyle, textAlign: 'left', paddingLeft: '12px' }}>
                        {goal.goalTitle || "N/A"}
                      </td>
                      <td data-label="Description" style={tdStyle}>{goal.goalDescription || "N/A"}</td>
                      <td data-label="Self Assessment" style={tdStyle}>{goal.selfAssessment || "N/A"}</td>
                      <td data-label="Mgr Comments" style={tdStyle}>{goal.managerComments || "N/A"}</td>
                      <td data-label="Reviewer Comments" style={tdStyle}>{goal.reviewerComments || "N/A"}</td>
                      <td data-label="Start Date" style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(goal.startDate)}</td>
                      <td data-label="End Date" style={{ ...tdStyle, borderRight: 'none', whiteSpace: 'nowrap' }}>{formatDate(goal.endDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <td colSpan="7" style={{ textAlign: "center", padding: "60px", color: colors.muted, backgroundColor: "#ffffff", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px" }}>
                      {goals.length === 0 ? (
                        <div>
                          <p style={{ color: colors.muted, fontSize: "15px" }}>
                            No archived goals are currently available in your history.
                          </p>
                        </div>
                      ) : (
                        "No goals match your current filters."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '20%', borderTopLeftRadius: '8px' }}>Attribute Title</th>
                  <th style={{ ...thStyle, width: '23%' }}>Description</th>
                  <th style={{ ...thStyle, width: '15%' }}>Self Assessment</th>
                  <th style={{ ...thStyle, width: '12%' }}>Mgr Comments</th>
                  <th style={{ ...thStyle, width: '12%' }}>Reviewer Comments</th>
                  <th style={{ ...thStyle, width: '5%' }}>Start Date</th>
                  <th style={{ ...thStyle, width: '5%', borderRight: 'none', borderTopRightRadius: '8px' }}>End Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttributes.length > 0 ? (
                  filteredAttributes.map((attr) => (
                    <tr key={attr.attributeId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td data-label="Attribute Title" style={{ ...tdStyle, textAlign: 'left', paddingLeft: '12px', fontWeight: '600' }}>
                        {attr.attributeTitle || "N/A"}
                      </td>
                      <td data-label="Description" style={tdStyle}>{attr.attributeDescription || "N/A"}</td>
                      <td data-label="Self Assessment" style={tdStyle}>{attr.selfAssessment || "N/A"}</td>
                      <td data-label="Mgr Comments" style={tdStyle}>{attr.managerComments || "N/A"}</td>
                      <td data-label="Reviewer Comments" style={tdStyle}>{attr.reviewerComments || "N/A"}</td>
                      <td data-label="Start Date" style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(attr.startDate)}</td>
                      <td data-label="End Date" style={{ ...tdStyle, borderRight: 'none', whiteSpace: 'nowrap' }}>{formatDate(attr.endDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <td colSpan="7" style={{ textAlign: "center", padding: "60px", color: colors.muted, backgroundColor: "#ffffff", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px" }}>
                      {attributes.length === 0 ? (
                        <div>
                          <p style={{ color: colors.muted, fontSize: "15px" }}>
                            No archived attributes are currently available in your history.
                          </p>
                        </div>
                      ) : (
                        "No attributes match your current filters."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
}

export default Goalhistory;
