import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Mygoals.css';
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

function Mygoals({
  selectedTimePeriod = 'All',
  filterYear = 'All',
  filterFreq = 'All',
  filterSub = 'All',
  timePeriods = []
}) {
  const [activeSubTab, setActiveSubTab] = useState('Goals');
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // State for goals functionality
  const [goals, setGoals] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingGoalIds, setUpdatingGoalIds] = useState([]);
  const [rejectedGoalId, setRejectedGoalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updatingAttributeIds, setUpdatingAttributeIds] = useState([]);
  const [rejectedAttributeId, setRejectedAttributeId] = useState(null);
  const [goalComments, setGoalComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [commentingGoalId, setCommentingGoalId] = useState(null);
  const commentCountersRef = useRef({});

  const [expandedCommentGoals, setExpandedCommentGoals] = useState([]);

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

  const activeGoals = goals.filter(goal => {
    const s = (goal.status || "").toLowerCase();
    const matchesStatus = s === "pending" || s === "in progress";
    if (!matchesStatus) return false;
    return matchesTimePeriod(goal.timePeriod);
  });

  // Place this directly inside your component function
  const lowercasedSearchTerm = searchTerm.toLowerCase();
  const filteredGoals = activeGoals.filter(goal => {
    return (
      (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowercasedSearchTerm)) ||
      (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowercasedSearchTerm)) ||
      (goal.quarter && goal.quarter.toLowerCase().includes(lowercasedSearchTerm)) ||
      (goal.metric && goal.metric.toLowerCase().includes(lowercasedSearchTerm)) ||
      (goal.target && String(goal.target).toLowerCase().includes(lowercasedSearchTerm)) ||
      (goal.goalId && String(goal.goalId).toLowerCase().includes(lowercasedSearchTerm))
    );
  });

  // Goals related functions
  const normalizeGoal = (g) => {
    const goalId = g.goalId ?? g.id ?? g.goalID ?? g.goal_id;
    return { ...g, goalId };
  };


  const fetchAttributes = async () => {
    if (!employeeId) return;
    try {
      const token = sessionStorage.getItem("token");
      const response = await api.get(`/attributes/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setAttributes(data);
      }
    } catch (err) {
      console.error("Error fetching attributes:", err);
    }
  };

  const fetchGoals = async () => {

    if (!employeeId) {
      setError("No employee logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem("token"); // JWT token

      const response = await api.get(`/goals/employee/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (!Array.isArray(data)) throw new Error("Data is not an array");

      console.log("Fetched goals:", data);

      const normalized = data.map(normalizeGoal);

      // Sort: Pending > Others.
      // Pending: updated_at/updatedAt DESC (Freshly Reassigned) -> goalId ASC (Oldest Backlog).
      // Others: goalId DESC (Newest).
      const sorted = normalized.sort((a, b) => {
        const statusA = (a.status || "").toLowerCase();
        const statusB = (b.status || "").toLowerCase();

        const isPendingA = statusA === "pending";
        const isPendingB = statusB === "pending";

        // 1. Pending Goals First
        if (isPendingA && !isPendingB) return -1;
        if (!isPendingA && isPendingB) return 1;

        if (isPendingA && isPendingB) {
          // 2. Try sorting by Updated Date (Freshly Reassigned)
          const dateA = a.updatedAt || a.updated_at || a.lastUpdated;
          const dateB = b.updatedAt || b.updated_at || b.lastUpdated;

          if (dateA && dateB) {
            const timeA = new Date(dateA).getTime();
            const timeB = new Date(dateB).getTime();
            if (timeA !== timeB) return timeB - timeA; // Newer updates first
          }

          // 3. Fallback: Oldest ID First (Ascending)
          // This ensures that older reassigned goals (which retain old IDs) appear at the top
          // rather than being buried under new goals.
          return Number(a.goalId) - Number(b.goalId);
        }

        // 4. Non-Pending: Newest ID First (Descending)
        return Number(b.goalId) - Number(a.goalId);
      });

      setGoals(sorted);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to fetch goals";
      setError(message);
    } finally {
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


    // Update comment counter

    if (!commentCountersRef.current[goalId]) {
      commentCountersRef.current[goalId] = (goalComments[goalId]?.length || 0) + 1;
    } else {
      commentCountersRef.current[goalId] += 1;
    }

    const generatedCommenterId = `${commentCountersRef.current[goalId]}`;

    const payload = {
      commenterId: generatedCommenterId,
      commenterRole: "EMPLOYEE",

      commentText: newComment,
    };

    try {
      const token = sessionStorage.getItem("token");

      await api.post(`/goals/${goalId}/comments`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });


      setNewComment("");
      fetchComments(goalId);
      setCommentingGoalId(null);
    } catch (err) {
      console.error("submitComment error:", err.response?.data || err.message);
    }
  };


  const fetchComments = async (goalId) => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get(`/goals/${goalId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setGoalComments((prev) => ({ ...prev, [goalId]: data }));
      commentCountersRef.current[goalId] = data.length;
    } catch (err) {
      console.error("fetchComments error:", err.response?.data || err.message);
    }

  };


  useEffect(() => {
    fetchGoals();
    fetchAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);


  const updateGoalStatus = async (goalId, newStatus, feedback = "") => {

    if (updatingGoalIds.includes(goalId)) return false;
    setUpdatingGoalIds((prev) => [...prev, goalId]);

    try {

      const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),

      };

      const payload = { status: newStatus };
      if (feedback.trim()) payload.selfAssessment = feedback;

      console.log("Sending update:", goalId, payload);


      const response = await api.put(`/goals/${goalId}/status`, payload, { headers });

      const updated = response.data;


      if (updated && (updated.goalId ?? updated.id)) {
        const updatedNormalized = normalizeGoal(updated);
        setGoals((prev) =>
          prev.map((g) =>
            String(g.goalId) === String(updatedNormalized.goalId)
              ? { ...g, ...updatedNormalized }
              : g
          )
        );
      } else {

        await fetchGoals(); // fallback to refetch all goals

      }

      return true;
    } catch (err) {

      const message = err.response?.data?.message || err.message || String(err) || "Failed to update goal status";
      setError(message);

      return false;
    } finally {
      setUpdatingGoalIds((prev) => prev.filter((id) => id !== goalId));
    }
  };


  const handleAccept = async (goalId) => {
    if (updatingGoalIds.includes(goalId)) return;

    const prevGoals = goals;
    setGoals((prev) =>
      prev.map((g) =>
        String(g.goalId) === String(goalId)
          ? { ...g, status: "in progress" }
          : g
      )
    );

    const success = await updateGoalStatus(goalId, "in progress");

    if (!success) {
      setGoals(prevGoals);
      alert("Failed to accept goal — check console/server logs.");
    }
  };

  const handleReject = (goalId) => {
    setRejectedGoalId(goalId);
    setRejectionReason("");
  };

  const updateAttributeStatus = async (attributeId, newStatus, feedback = "") => {
    if (updatingAttributeIds.includes(attributeId)) return false;
    setUpdatingAttributeIds((prev) => [...prev, attributeId]);
    try {
      const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      const payload = { status: newStatus };
      if (feedback.trim()) payload.selfAssessment = feedback;
      console.log("Sending attribute update:", attributeId, payload);
      const response = await api.put(`/attributes/${attributeId}/status`, payload, { headers });
      const updated = response.data;
      if (updated && updated.attributeId) {
        setAttributes((prev) =>
          prev.map((a) =>
            String(a.attributeId) === String(updated.attributeId)
              ? { ...a, ...updated }
              : a
          )
        );
      } else {
        await fetchAttributes();
      }
      return true;
    } catch (err) {
      const message = err.response?.data?.message || err.message || String(err) || "Failed to update attribute status";
      setError(message);
      return false;
    } finally {
      setUpdatingAttributeIds((prev) => prev.filter((id) => id !== attributeId));
    }
  };

  const handleAcceptAttribute = async (attributeId) => {
    if (updatingAttributeIds.includes(attributeId)) return;

    const prevAttributes = attributes;
    setAttributes((prev) =>
      prev.map((attr) =>
        String(attr.attributeId) === String(attributeId)
          ? { ...attr, status: "in progress" }
          : attr
      )
    );

    const success = await updateAttributeStatus(attributeId, "in progress");

    if (!success) {
      setAttributes(prevAttributes);
      alert("Failed to accept attribute — check console/server logs.");
    }
  };

  const handleRejectAttribute = (attributeId) => {
    setRejectedAttributeId(attributeId);
    setRejectionReason("");
  };

  const submitRejectionReason = async () => {

    const trimmedReason = rejectionReason.trim();

    if (trimmedReason.length < 10 || trimmedReason.length > 100) {
      alert("Rejection reason must be between 10 and 100 characters long.");
      return;
    }

    if (rejectedGoalId) {
      const goalId = rejectedGoalId;
      const prevGoals = goals;
      setGoals((prev) =>
        prev.map((g) =>
          String(g.goalId) === String(goalId)
            ? { ...g, status: "rejected", selfAssessment: trimmedReason }
            : g
        )
      );

      const success = await updateGoalStatus(goalId, "rejected", trimmedReason);
      if (success) {
        // ✅ SUCCESS MESSAGE ADDED HERE
        alert("Goals Rejected successfully");

        setRejectedGoalId(null);
        setRejectionReason("");
      } else {
        setGoals(prevGoals);
        alert("Failed to reject goal — check console/server logs.");
      }
    } else if (rejectedAttributeId) {
      const attributeId = rejectedAttributeId;
      const prevAttributes = attributes;
      setAttributes((prev) =>
        prev.map((a) =>
          String(a.attributeId) === String(attributeId)
            ? { ...a, status: "rejected", selfAssessment: trimmedReason }
            : a
        )
      );

      const success = await updateAttributeStatus(attributeId, "rejected", trimmedReason);
      if (success) {
        alert("Attributes Rejected successfully");

        setRejectedAttributeId(null);
        setRejectionReason("");
      } else {
        setAttributes(prevAttributes);
        alert("Failed to reject attribute — check console/server logs.");
      }
    }

  };


  // Enhanced modern styles
  const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "30px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  };
  const thStyle = {
    padding: "6px 16px",
    fontSize: "15px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    border: "none",
    textAlign: "center",
    color: "white",
    textTransform: "none",
    whiteSpace: "nowrap",

    position: "sticky",
    top: 0,
    zIndex: 10,

    background: "#629AF1",
    backgroundClip: "padding-box",
  };


  const tdStyle = {
    border: "1px solid #e5e7eb",
    padding: "16px 20px",
    verticalAlign: "top",
    backgroundColor: "#ffffff",
    fontSize: "15px",
  };

  // New combined border styles for cells
  const cellStyle = {
    borderBottom: '1px solid #f1f5f9', // Clean horizontal divider
    padding: '16px 24px',
    verticalAlign: 'middle',
    backgroundColor: 'transparent', // Let row background show through
    transition: 'all 0.2s ease',
    fontSize: '15px',
  };

  const buttonBaseStyle = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    position: "relative",
    overflow: "hidden",
  };

  const acceptButtonStyle = {
    padding: "6px 14px",
    borderRadius: "8px",
    background: "#14b8a6",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(20, 184, 166, 0.3)",
  };

  const rejectButtonStyle = {
    marginTop: "0px",
    marginLeft: "8px",
    padding: "6px 14px",
    borderRadius: "8px",
    background: "#f43f5e",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(244, 63, 94, 0.3)",
  };

  const lockedButtonStyle = {
    ...buttonBaseStyle,
    background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    cursor: "not-allowed",
    opacity: "0.7",
  };

  const icons = {
    accept: (
      <svg width="20" height="20" fill="#14b8a6" viewBox="0 0 16 16">
        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l2.521 2.511L12.736 3.97zm-5.334 1.29a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l2.521 2.511L12.736 3.97z" />
      </svg>
    ),
    reject: (
      <svg width="20" height="20" fill="#f43f5e" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
      </svg>
    ),
    locked: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      </svg>
    )
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out",
  };

  const modalStyle = {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "8px",
    width: "480px",
    maxWidth: "90vw",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    animation: "slideUp 0.3s ease-out",
  };

  // Attributes are now fetched independently from /api/attributes
  const activeAttributes = React.useMemo(() => {
    return attributes.filter(attr => {
      const s = (attr.status || "").toLowerCase();
      const matchesStatus = s === "pending" || s === "in progress";
      if (!matchesStatus) return false;
      return matchesTimePeriod(attr.timePeriod);
    });
  }, [attributes, filterYear, filterFreq, filterSub, timePeriods]);

  const extractedAttributes = React.useMemo(() => {
    return activeAttributes.map(attr => ({
      attributeId: attr.attributeId,
      attributeTitle: attr.attributeTitle || '',
      attributeDescription: attr.attributeDescription || '',
      metric: attr.metric || '',
      status: attr.status || '',
    }));
  }, [activeAttributes]);

  const attrThStyle = {
    textAlign: 'left',
    padding: '6px 16px',
    background: '#629AF1',
    color: 'white',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    borderRight: '1px solid #ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };
  const attrTdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
    borderRight: '1px solid #e0e0e0',
    textAlign: 'left',
    verticalAlign: 'middle',
    fontSize: '15px',
  };

  return (

    <div
      className="performance-content"
      style={{
        padding: "10px 0",
      }}
    >
      {/* Sub-tabs: Goals / Attributes */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1rem',
      }}>
        <SubTab title="Goals" isActive={activeSubTab === 'Goals'} onClick={() => setActiveSubTab('Goals')} />
        <SubTab title="Attributes" isActive={activeSubTab === 'Attributes'} onClick={() => setActiveSubTab('Attributes')} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >

        {loading ? (
          <p>Loading...</p>
        ) : activeSubTab === 'Attributes' ? (
          /* ---- Attributes Sub-tab ---- */
          <div
            className="hide-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: 'calc(100vh - 280px)',
              overflowY: 'auto',
              overflowX: 'auto',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ ...attrThStyle, width: '30%', borderTopLeftRadius: '8px' }}>Attribute Title</th>
                  <th style={{ ...attrThStyle, width: '45%' }}>Description</th>
                  {/* <th style={{ ...attrThStyle, width: '15%' }}>Status</th> */}
                  <th style={{ ...attrThStyle, width: '15%', borderRight: 'none', borderTopRightRadius: '8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {extractedAttributes.length > 0 ? (
                  extractedAttributes.map((attr, idx) => {
                    const isUpdating = updatingAttributeIds.includes(attr.attributeId);
                    const isAccepted = (attr.status || "").toLowerCase() === "in progress";
                    return (
                      <tr key={attr.attributeId || idx}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={attrTdStyle}>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{attr.attributeTitle}</span>
                        </td>
                        <td style={{ ...attrTdStyle, color: '#475569' }}>{attr.attributeDescription || '-'}</td>
                        {/* <td style={attrTdStyle}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: attr.status?.toLowerCase() === 'pending' ? '#fef3c7' : '#d1fae5',
                            color: attr.status?.toLowerCase() === 'pending' ? '#92400e' : '#065f46',
                          }}>
                            {attr.status || 'N/A'}
                          </span>
                        </td> */}
                        <td style={{ ...attrTdStyle, borderRight: 'none', textAlign: 'center' }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            {isAccepted ? (
                              <button
                                style={lockedButtonStyle}
                                disabled
                              >
                                Locked
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAcceptAttribute(attr.attributeId)}
                                  style={acceptButtonStyle}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(20, 184, 166, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(20, 184, 166, 0.3)";
                                  }}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleRejectAttribute(attr.attributeId)}
                                  style={rejectButtonStyle}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(244, 63, 94, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(244, 63, 94, 0.3)";
                                  }}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "..." : "Reject"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontStyle: 'italic', backgroundColor: '#ffffff', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                      No attributes assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ---- Goals Sub-tab ---- */
          <div
            className="hide-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: "calc(100vh - 250px)",
              overflowY: "auto",
              overflowX: "auto",

              position: "relative",

              borderRadius: "8px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",

              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >


            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
                margin: "0",
                minWidth: "1000px",
                backgroundColor: '#ffffff',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#629AF1",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >


                  <th style={{ ...thStyle, background: "#629AF1", color: "white", textAlign: "left", width: "20%", borderTopLeftRadius: "8px" }}>Title</th>
                  <th style={{ ...thStyle, background: "#629AF1", color: "white", textAlign: "left", width: "35%" }}>Description</th>
                  <th style={{ ...thStyle, background: "#629AF1", color: "white", textAlign: "left", width: "15%", whiteSpace: "nowrap" }}>Weightage (%)</th>
                  <th style={{ ...thStyle, background: "#629AF1", color: "white", textAlign: "left", width: "15%", whiteSpace: "normal" }}>Target</th>
                  <th style={{ ...thStyle, background: "#629AF1", color: "white", textAlign: "Center", width: "15%", borderTopRightRadius: "8px" }}>Actions</th>

                </tr>
              </thead>
              <tbody style={{ backgroundColor: "#ffffff" }}>
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => {
                    const isUpdating = updatingGoalIds.includes(goal.goalId);
                    const isAccepted = (goal.status || "").toLowerCase() === "in progress";

                    return (
                      <tr
                        key={String(goal.goalId)}
                        style={{
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F1F5F9"; // Subtle drag/hover effect
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }}
                      >
                        <td
                          data-label="Title"
                          style={{
                            ...cellStyle,
                            fontWeight: "600",
                            color: "#1E293B", // Darker text for title
                            maxWidth: '200px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word', // Better than break-all for text
                          }}
                        >
                          {goal.goalTitle}
                        </td>

                        <td
                          data-label="Description"
                          style={{
                            ...cellStyle,
                            color: "#475569", // Softer text for description
                            maxWidth: '300px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            lineHeight: "1.6", // Improve readability
                          }}
                        >
                          {goal.goalDescription}
                        </td>
                        <td
                          data-label="Weightage"
                          style={{
                            ...cellStyle,
                            textAlign: "left",
                            color: "#334155",
                            fontWeight: "500"
                          }}
                        >
                          {goal.metric ? `${goal.metric}%` : '-'}
                        </td>

                        <td
                          data-label="Target"
                          style={{
                            ...cellStyle,
                            color: "#334155",
                            fontWeight: "500"
                          }}
                        >
                          {goal.target}
                        </td>
                        <td data-label="Actions" style={{ ...cellStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            {isAccepted ? (
                              <button
                                style={lockedButtonStyle}
                                disabled
                              >
                                Locked
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAccept(goal.goalId)}
                                  style={acceptButtonStyle}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(20, 184, 166, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(20, 184, 166, 0.3)";
                                  }}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleReject(goal.goalId)}
                                  style={rejectButtonStyle}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(244, 63, 94, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(244, 63, 94, 0.3)";
                                  }}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "..." : "Reject"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <td colSpan="5" style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontStyle: "italic", backgroundColor: "#ffffff", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px" }}>
                      {activeGoals.length === 0 ? "No active goals found." : "No goals match your search criteria."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(rejectedGoalId || rejectedAttributeId) && (
        <div className="reason-popup-overlay">
          <div className="reason-popup">
            <h4>Enter Rejection Reason:</h4>

            <textarea
              value={rejectionReason}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setRejectionReason(value);
                }
              }}
              maxLength={100}
              placeholder="Please provide a detailed reason for rejection (minimum 10 characters)..."
              autoFocus
            />

            <div style={{
              fontSize: "12px",
              color: "#6b7280",
              textAlign: "right",
              marginTop: "4px"
            }}>
              {rejectionReason.length}/100 characters
            </div>

            <div className="popup-actions">
              <button
                onClick={() => {
                  setRejectedGoalId(null);
                  setRejectedAttributeId(null);
                }}
                className="popup-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={submitRejectionReason}
                className="popup-btn submit"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mygoals;
