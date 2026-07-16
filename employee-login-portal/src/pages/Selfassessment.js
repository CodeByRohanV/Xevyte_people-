import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
// Enhanced modern style constants
const thStyle = {
  border: "none",
  padding: "6px 16px",
  textAlign: "left",
  background: "#629AF1",
  color: "white",
  fontSize: "15px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  textTransform: "none",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  zIndex: 10,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
const tdStyle = {
  border: "1px solid #e5e7eb",
  padding: "16px 20px",
  backgroundColor: "#ffffff",
  transition: "background-color 0.2s ease",
  verticalAlign: "middle",
  fontSize: "15px",
};

// --- START: Token Helper Function ---
// This function reliably retrieves the token and formats it with 'Bearer '.
const getAuthToken = () => {
  let token = sessionStorage.getItem("token");

  if (!token) {
    return null; // No token found
  }

  // Check if the token is wrapped in quotes (e.g., from a JSON.stringify on save)
  if (token.startsWith('"') && token.endsWith('"')) {
    // Strip the surrounding quotes
    token = token.slice(1, -1);
  }

  // Ensure the 'Bearer ' prefix is only added once
  if (token.startsWith('Bearer ')) {
    return token;
  }

  return `Bearer ${token}`;
};
// --- END: Token Helper Function ---

const Selfassessment = ({
  selectedTimePeriod = 'All',
  filterYear = 'All',
  filterFreq = 'All',
  filterSub = 'All',
  timePeriods = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState('Goals');
  // Profile/Sidebar states
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName] = useState(sessionStorage.getItem("employeeName")); // Removed setEmployeeName as it wasn't used

  const [searchTerm, setSearchTerm] = useState(''); // Not used in the current display logic but kept

  const [successMessage, setSuccessMessage] = useState(""); // Not used in the current display logic but kept

  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState(new Set());

  const handleCheckboxChange = (goalId) => {
    setSelectedGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedGoalIds(new Set(filteredGoals.map((g) => g.goalId)));
    } else {
      setSelectedGoalIds(new Set());
    }
  };

  // Custom Modal State Removed



  const [goals, setGoals] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [goalInputs, setGoalInputs] = useState({});
  const [attributeInputs, setAttributeInputs] = useState({});
  const [assessmentIds, setAssessmentIds] = useState({});
  const [selectedAttributeIds, setSelectedAttributeIds] = useState(new Set());

  const [filteredGoals, setFilteredGoals] = useState([]); // State for filtered goals

  // Note: fetchGoals is retained but not called in useEffect. The combined
  // fetchGoalsAndAssessments is used instead.

  const fetchGoals = async () => {

    if (!employeeId) {
      setError("No employee logged in.");
      setLoading(false);
      return;
    }


    const token = getAuthToken(); // robust token getter

    if (!token) {
      setError("User is not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/goals/employee/${employeeId}`, {
        headers: { Authorization: token }
      });

      setGoals(response.data);
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("Fetch Goals Error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
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

  const inProgressGoals = useMemo(() => {
    let list = goals.filter(goal => goal.status?.toLowerCase() === "in progress");
    return list.filter(goal => matchesTimePeriod(goal.timePeriod));
  }, [goals, filterYear, filterFreq, filterSub, timePeriods]);


  useEffect(() => {
    setSelectedGoalIds(new Set());
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const tempFilteredGoals = inProgressGoals.filter(goal => {
      return (
        (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.quarter && goal.quarter.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.metric && String(goal.metric).toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.target && String(goal.target).toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.goalId && String(goal.goalId).toLowerCase().includes(lowercasedSearchTerm))
      );
    });
    setFilteredGoals(tempFilteredGoals);
  }, [searchTerm, inProgressGoals]);

  useEffect(() => {
    if (inProgressGoals.length > 0) {
      setGoalInputs(prevInputs => {
        const newInputs = { ...prevInputs };
        let hasChanges = false;

        inProgressGoals.forEach(g => {
          // Initialize goalInputs for goals not yet assessed/loaded
          if (!newInputs[g.goalId]) {
            newInputs[g.goalId] = {
              rating: g.rating || "",
              selfAssessment: g.selfAssessment || "",
              additionalInfo: g.additionalInfo || "",
            };
            hasChanges = true;
          }
        });

        return hasChanges ? newInputs : prevInputs;
      });
    }
  }, [inProgressGoals]);

  const handleRatingChange = (e, goalId) => {
    const val = e.target.value;
    // Allow empty string or a single digit from 1 to 5
    if (val === "" || (/^[1-5]$/).test(val)) {
      setGoalInputs((prev) => ({
        ...prev,
        [goalId]: { ...prev[goalId], rating: val }
      }));
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const token = getAuthToken(); // robust token getter


    if (!token) {
      alert("Error: User not authenticated.");
      setIsSaving(false);
      return;
    }

    const goalsToSave = selectedGoalIds.size > 0
      ? inProgressGoals.filter(g => selectedGoalIds.has(g.goalId))
      : inProgressGoals;

    if (goalsToSave.length === 0) {
      alert("No goals selected to save.");
      setIsSaving(false);
      return;
    }


    try {
      for (const goal of goalsToSave) {
        const data = goalInputs[goal.goalId];
        const existingId = assessmentIds[goal.goalId]; // Get existing ID


        const dto = {
          id: existingId || null, // null for new assessments

          employeeId: employeeId,
          goalId: goal.goalId,
          title: goal.goalTitle,
          description: goal.goalDescription,
          weightage: goal.metric, // Assuming metric is correct
          target: goal.target,
          selfRating: data?.rating || "",
          selfAssessment: data?.selfAssessment || "",
        };

        const response = await api.post("/self-assessments/save", dto, {
          headers: { Authorization: token },
        });

        // Axios automatically throws on non-2xx responses, so we don't need to check response.ok

        // Update assessment IDs
        if (response.data?.id) {
          setAssessmentIds(prevIds => ({
            ...prevIds,
            [goal.goalId]: response.data.id
          }));
        }
      }

      alert("Self-assessment saved successfully!");

    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("Save Error:", message);
      alert("Error saving goals: " + message);

    } finally {
      setIsSaving(false);
    }
  };



  // 🎯 REFACTORED: Single PUT request for bulk submission
  const handleSubmitAll = async () => {
    setUpdating(true);
    const token = getAuthToken(); // robust token getter

    if (!token) {
      alert("Error: User not authenticated. Please login again.");
      setUpdating(false);
      return;
    }

    // Determine which goals to submit
    const goalsToSubmit = selectedGoalIds.size > 0
      ? inProgressGoals.filter(g => selectedGoalIds.has(g.goalId))
      : inProgressGoals;

    if (goalsToSubmit.length === 0) {
      alert("No goals selected for submission.");
      setUpdating(false);
      return;
    }

    // 1. Prepare the Bulk DTO List
    const bulkSubmissionList = [];
    let validationFailed = false;

    for (const goal of goalsToSubmit) {
      const data = goalInputs[goal.goalId];
      const isCommentInvalid = !data || !data.selfAssessment?.trim();

      if (isCommentInvalid) {
        alert(`Please enter a self-assessment comment for goal ID ${goal.goalId} before submitting.`);
        validationFailed = true;
        break;
      }

      bulkSubmissionList.push({
        goalId: goal.goalId,
        status: "submitted", // Or "Submitted", depending on backend
        rating: null,
        selfAssessment: data.selfAssessment,
      });
    }

    if (validationFailed) {
      setUpdating(false);
      return;
    }

    try {
      // 2. Send the Bulk Request via axios
      await api.put('/goals/employee/self-assessments', bulkSubmissionList, {
        headers: { Authorization: token },
      });

      // 3. Success Handling
      alert(selectedGoalIds.size > 0 ? "Selected self-assessments submitted successfully." : "Self-assessment for all goals submitted successfully.");

      // Clear selected goal ids
      const submittedIds = goalsToSubmit.map(g => g.goalId);
      setSelectedGoalIds(prev => {
        const next = new Set(prev);
        submittedIds.forEach(id => next.delete(id));
        return next;
      });

      // Re-fetch data to reflect updated status
      await fetchGoalsAndAssessments();

    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("Submit Error:", message);
      alert("Error submitting goals: " + message);
    } finally {
      setUpdating(false);
    }
  };


  const handleBack = () => {
    navigate(-1);
  };

  // Combined fetch logic to get goals and pre-fill self-assessment data


  const fetchGoalsAndAssessments = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken(); // robust token getter

      if (!token) {
        setError("User is not authenticated. Please login again.");
        setLoading(false);
        return;
      }

      // 1. Fetch Goals
      const goalsRes = await api.get(`/goals/employee/${employeeId}`, {
        headers: { Authorization: token },
      });
      const fetchedGoals = goalsRes.data;

      // 2. Fetch Self-Assessments
      const assessmentRes = await api.get(`/self-assessments/employee/${employeeId}`, {
        headers: { Authorization: token },
      });
      const fetchedAssessments = assessmentRes.data;

      // 3. Fetch Attributes
      const attributesRes = await api.get(`/attributes/employee/${employeeId}`, {
        headers: { Authorization: token },
      });
      const fetchedAttributes = attributesRes.data;

      // Map assessment data into goalInputs and assessmentIds
      const inputs = {};
      const ids = {};

      fetchedAssessments.forEach(a => {
        inputs[a.goalId] = {
          rating: a.selfRating || "",
          selfAssessment: a.selfAssessment || "",
          additionalInfo: a.additionalNotes || "",
        };
        ids[a.goalId] = a.id; // for future updates
      });

      // Map attribute data into attributeInputs
      const attrInputs = {};
      fetchedAttributes.forEach(attr => {
        attrInputs[attr.attributeId] = {
          rating: attr.rating || "",
          selfAssessment: attr.selfAssessment || "",
        };
      });

      // Set state
      setGoals(fetchedGoals);
      setAttributes(fetchedAttributes);
      setGoalInputs(inputs);
      setAttributeInputs(attrInputs);
      setAssessmentIds(ids);

    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("Initial Load Error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]); // Dependency on employeeId ensures it runs on initial load


  const inProgressAttributes = useMemo(() => {
    let list = attributes.filter(attr => (attr.status || "").toLowerCase() === "in progress");
    return list.filter(attr => matchesTimePeriod(attr.timePeriod));
  }, [attributes, filterYear, filterFreq, filterSub, timePeriods]);

  useEffect(() => {
    if (inProgressAttributes.length > 0) {
      setAttributeInputs(prevInputs => {
        const newInputs = { ...prevInputs };
        let hasChanges = false;

        inProgressAttributes.forEach(attr => {
          if (!newInputs[attr.attributeId]) {
            newInputs[attr.attributeId] = {
              rating: attr.rating || "",
              selfAssessment: attr.selfAssessment || "",
            };
            hasChanges = true;
          }
        });

        return hasChanges ? newInputs : prevInputs;
      });
    }
  }, [inProgressAttributes]);

  const handleAttributeRatingChange = (e, attributeId) => {
    const val = e.target.value;
    if (val === "" || (/^[1-5]$/).test(val)) {
      setAttributeInputs((prev) => ({
        ...prev,
        [attributeId]: { ...prev[attributeId], rating: val }
      }));
    }
  };

  const handleAttributeCheckboxChange = (attributeId) => {
    setSelectedAttributeIds((prev) => {
      const next = new Set(prev);
      if (next.has(attributeId)) {
        next.delete(attributeId);
      } else {
        next.add(attributeId);
      }
      return next;
    });
  };

  const handleAttributeSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAttributeIds(new Set(inProgressAttributes.map((attr) => attr.attributeId)));
    } else {
      setSelectedAttributeIds(new Set());
    }
  };

  const handleSaveAttributes = async () => {
    setIsSaving(true);
    const token = getAuthToken();

    if (!token) {
      alert("Error: User not authenticated.");
      setIsSaving(false);
      return;
    }

    const attrsToSave = selectedAttributeIds.size > 0
      ? inProgressAttributes.filter(a => selectedAttributeIds.has(a.attributeId))
      : inProgressAttributes;

    if (attrsToSave.length === 0) {
      alert("No attributes selected to save.");
      setIsSaving(false);
      return;
    }

    try {
      const payload = attrsToSave.map(attr => {
        const data = attributeInputs[attr.attributeId];
        return {
          attributeId: attr.attributeId,
          status: attr.status || "in progress",
          rating: data?.rating ? Number(data.rating) : null,
          selfAssessment: data?.selfAssessment || ""
        };
      });

      await api.put("/attributes/employee/self-assessments", payload, {
        headers: { Authorization: token },
      });

      alert("Self-assessments for attributes saved successfully!");
      await fetchGoalsAndAssessments();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("Save Attributes Error:", message);
      alert("Error saving attributes: " + message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitAttributes = async () => {
    setUpdating(true);
    const token = getAuthToken();

    if (!token) {
      alert("Error: User not authenticated. Please login again.");
      setUpdating(false);
      return;
    }

    const attrsToSubmit = selectedAttributeIds.size > 0
      ? inProgressAttributes.filter(a => selectedAttributeIds.has(a.attributeId))
      : inProgressAttributes;

    if (attrsToSubmit.length === 0) {
      alert("No attributes selected for submission.");
      setUpdating(false);
      return;
    }

    let validationFailed = false;
    const payload = [];

    for (const attr of attrsToSubmit) {
      const data = attributeInputs[attr.attributeId];
      const isCommentInvalid = !data || !data.selfAssessment?.trim();

      if (isCommentInvalid) {
        alert(`Please enter a self-assessment comment for attribute "${attr.attributeTitle}" before submitting.`);
        validationFailed = true;
        break;
      }

      payload.push({
        attributeId: attr.attributeId,
        status: "submitted",
        rating: null,
        selfAssessment: data.selfAssessment
      });
    }

    if (validationFailed) {
      setUpdating(false);
      return;
    }

    try {
      await api.put("/attributes/employee/self-assessments", payload, {
        headers: { Authorization: token },
      });

      alert("Self-assessments for attributes submitted successfully!");
      setSelectedAttributeIds(prev => {
        const next = new Set(prev);
        attrsToSubmit.forEach(a => next.delete(a.attributeId));
        return next;
      });
      await fetchGoalsAndAssessments();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("Submit Attributes Error:", message);
      alert("Error submitting attributes: " + message);
    } finally {
      setUpdating(false);
    }
  };

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
      style={{ padding: "10px 0" }}
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

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>

        {loading ? (
          <p>Loading goals...</p>
        ) : error ? (
          <p style={{ color: "red" }}>Error: {error}</p>
        ) : activeSubTab === 'Attributes' ? (
          /* ---- Attributes Sub-tab ---- */
          <div
            className="hidden-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: 'calc(100vh - 310px)',
              overflowY: 'auto',
              overflowX: 'auto',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
                margin: "0",
                minWidth: "1000px",
                backgroundColor: "#ffffff",
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...attrThStyle, width: "4%", borderTopLeftRadius: "8px" }}>
                    <input
                      type="checkbox"
                      checked={inProgressAttributes.length > 0 && inProgressAttributes.every(a => selectedAttributeIds.has(a.attributeId))}
                      onChange={handleAttributeSelectAll}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                        accentColor: '#14b8a6'
                      }}
                    />
                  </th>
                  <th style={{ ...attrThStyle, width: '30%' }}>Attribute Title</th>
                  <th style={{ ...attrThStyle, width: '51%' }}>Description</th>
                  <th style={{ ...attrThStyle, width: '15%', borderRight: 'none', borderTopRightRadius: '8px', textAlign: 'center' }}>
                    Self Assessment<span style={{ color: "#fef2f2", fontWeight: "900" }}>*</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {inProgressAttributes.length > 0 ? (
                  inProgressAttributes.map((attr) => {
                    const inputs = attributeInputs[attr.attributeId] || {
                      rating: "",
                      selfAssessment: "",
                    };
                    return (
                      <tr key={attr.attributeId}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Checkbox cell */}
                        <td style={{ ...attrTdStyle, width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={selectedAttributeIds.has(attr.attributeId)}
                            onChange={() => handleAttributeCheckboxChange(attr.attributeId)}
                            style={{
                              cursor: 'pointer',
                              width: '16px',
                              height: '16px',
                              accentColor: '#14b8a6'
                            }}
                          />
                        </td>
                        <td style={attrTdStyle}>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{attr.attributeTitle}</span>
                        </td>
                        <td style={{ ...attrTdStyle, color: '#475569' }}>{attr.attributeDescription || '-'}</td>
                        <td style={{ ...attrTdStyle, borderRight: 'none' }}>
                          <textarea
                            value={inputs.selfAssessment}
                            onChange={(e) => {
                              setAttributeInputs((prev) => ({
                                ...prev,
                                [attr.attributeId]: {
                                  ...prev[attr.attributeId],
                                  selfAssessment: e.target.value,
                                },
                              }));
                            }}
                            style={{
                              width: "100%",
                              fontSize: "15px",
                              padding: "12px",
                              borderRadius: "8px",
                              border: "2px solid #e5e7eb",
                              fontFamily: "inherit",
                              resize: "vertical",
                              transition: "all 0.2s ease",
                              outline: "none",
                              lineHeight: "1.5",
                            }}
                            rows={3}
                            placeholder="Enter your self-assessment here..."
                            maxLength={500}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#14b8a6";
                              e.target.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e5e7eb";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <div style={{ textAlign: "right", fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                            {inputs.selfAssessment?.length || 0}/500
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontStyle: 'italic', backgroundColor: '#ffffff', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                      No active attributes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ---- Goals Sub-tab ---- */
          <div
            className="hidden-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: "calc(100vh - 300px)",
              overflowY: "auto",
              overflowX: "auto",
              position: "relative", // Ensure stacking context
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <style>
              {`
                .hidden-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hidden-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}
            </style>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
                borderSpacing: "0",
                margin: "0",
                minWidth: "1000px",
                backgroundColor: "#ffffff",
              }}
            >
              <thead>
                <tr
                  style={{
                    // Gradient background is handled by thStyle now, but keeping this as valid fallback or row container style if needed.
                    // Sticky positioning moved to thStyle for better reliability.
                    zIndex: 1, // ensuring row stack context if needed
                  }}
                >
                  {/* Checkbox column header */}
                  <th style={{ ...thStyle, width: "4%", borderTopLeftRadius: "8px" }}>
                    <input
                      type="checkbox"
                      checked={filteredGoals.length > 0 && filteredGoals.every(g => selectedGoalIds.has(g.goalId))}
                      onChange={handleSelectAll}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                        accentColor: '#14b8a6'
                      }}
                    />
                  </th>
                  <th style={{ ...thStyle, width: "18%", textAlign: "left" }}>Title</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Description</th>
                  <th style={{ ...thStyle, width: "5%", textAlign: "left", whiteSpace: "nowrap" }}>Weightage (%)</th>
                  <th style={{ ...thStyle, width: "11%", textAlign: "left", whiteSpace: "normal" }}>Target</th>
                  <th style={{ ...thStyle, width: "35%", textAlign: "center", borderTopRightRadius: "8px", borderRight: 'none' }}>
                    Self Assessment <span style={{ color: "#fef2f2", fontWeight: "900" }}>*</span>
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: "#ffffff" }}>
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((g) => {
                    const inputs =
                      goalInputs[g.goalId] || {
                        rating: "",
                        selfAssessment: "",
                        additionalInfo: "",
                      };
                    return (
                      <tr
                        key={g.goalId}
                        style={{
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f0fdfa";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }}
                      >
                        {/* Checkbox cell */}
                        <td style={{ ...tdStyle, width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={selectedGoalIds.has(g.goalId)}
                            onChange={() => handleCheckboxChange(g.goalId)}
                            style={{
                              cursor: 'pointer',
                              width: '16px',
                              height: '16px',
                              accentColor: '#14b8a6'
                            }}
                          />
                        </td>
                        <td
                          data-label="Title"
                          style={{
                            ...tdStyle,
                            // No longer needed, as we're letting CSS handle the wrapping based on width
                            // textAlign: "center", 
                            whiteSpace: "pre-wrap",

                            // Use this modern property to force character-level breaks if needed
                            wordBreak: "break-all",

                            // IMPORTANT: You will need to add 'maxWidth' here or to 'tdStyle' 
                            // for word-break to function correctly based on a limit.
                            maxWidth: '250px',
                          }}
                        >
                          {g.goalTitle}
                        </td>

                        {/* Second TD (goalDescription) - CSS handles wrapping now */}
                        <td
                          data-label="Description"
                          style={{
                            ...tdStyle,
                            // No longer needed, as we're letting CSS handle the wrapping based on width
                            // textAlign: "center", 
                            whiteSpace: "pre-wrap",

                            // Use this modern property to force character-level breaks if needed
                            wordBreak: "break-all",

                            // IMPORTANT: You will need to add 'maxWidth' here or to 'tdStyle' 
                            // for word-break to function correctly based on a limit.
                            maxWidth: '255px',
                          }}
                        >
                          {/* SIMPLIFIED: Pass the string directly, let CSS wrap it */}
                          {g.goalDescription}
                        </td>

                        <td data-label="Weightage" style={{ ...tdStyle, textAlign: "left" }}>{g.metric ? `${g.metric}%` : '-'}</td>
                        <td data-label="Target" style={{ ...tdStyle, textAlign: "left" }}>{g.target}</td>
                        <td data-label="Self Assessment" style={{ ...tdStyle, borderRight: 'none' }}>
                          <textarea
                            value={inputs.selfAssessment}
                            onChange={(e) => {
                              setGoalInputs((prev) => ({
                                ...prev,
                                [g.goalId]: {
                                  ...prev[g.goalId],
                                  selfAssessment: e.target.value,
                                },
                              }));
                            }}
                            style={{
                              width: "100%",
                              fontSize: "15px",
                              padding: "12px",
                              borderRadius: "8px",
                              border: "2px solid #e5e7eb",
                              fontFamily: "inherit",
                              resize: "vertical",
                              transition: "all 0.2s ease",
                              outline: "none",
                              lineHeight: "1.5",
                            }}
                            rows={3}
                            placeholder="Enter your self-assessment here..."
                            maxLength={500}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#14b8a6";
                              e.target.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e5e7eb";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <div style={{ textAlign: "right", fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                            {inputs.selfAssessment?.length || 0}/500
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <td colSpan="8" style={{ textAlign: "center", padding: "60px", color: "#64748b", fontStyle: "italic", backgroundColor: "#ffffff", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px" }}>
                      {inProgressGoals.length === 0 ? "No in progress goals found." : "No goals match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        {((activeSubTab === 'Goals' && filteredGoals.length > 0) || (activeSubTab === 'Attributes' && inProgressAttributes.length > 0)) && (
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              onClick={activeSubTab === 'Attributes' ? handleSaveAttributes : handleSaveAll}
              disabled={isSaving}
              style={{
                background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 12px rgba(20, 184, 166, 0.3)",
                opacity: isSaving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(20, 184, 166, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(20, 184, 166, 0.3)";
              }}
            >
              {isSaving ? "Saving..." : (
                activeSubTab === 'Attributes'
                  ? (selectedAttributeIds.size > 0 ? "Save Selected" : "Save All")
                  : (selectedGoalIds.size > 0 ? "Save Selected" : "Save All")
              )}
            </button>
            <button
              onClick={activeSubTab === 'Attributes' ? handleSubmitAttributes : handleSubmitAll}
              disabled={updating}
              style={{
                background: "#629AF1",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: updating ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 12px rgba(98,154,241,0.3)",
                opacity: updating ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!updating) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(94, 234, 212, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(94, 234, 212, 0.3)";
              }}
            >
              {updating ? "Submitting..." : (
                activeSubTab === 'Attributes'
                  ? (selectedAttributeIds.size > 0 ? "Submit Selected" : "Submit Assessment")
                  : (selectedGoalIds.size > 0 ? "Submit Selected" : "Submit Assessment")
              )}
            </button>
          </div>
        )}

        {/* Success/Error Modal Removed */}
      </div>
    </div>


  );
};

export default Selfassessment;


