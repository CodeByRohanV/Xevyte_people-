import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './Dashboard.css';

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

const Submitfeedback = ({ selectedTimePeriod = 'All' }) => {

  const location = useLocation();

  const loggedInEmployeeId = sessionStorage.getItem("employeeId");

  // ---- Selected Employee (from navigation or sessionStorage) ----
  const initialSelectedEmployeeId =
    location.state?.employeeId || sessionStorage.getItem("selectedEmployeeId") || "";
  const initialSelectedEmployeeName =
    location.state?.employeeName || sessionStorage.getItem("selectedEmployeeName") || "User";

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);

  const reviewerId = location.state?.reviewerId;

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  // ====== EMPLOYEE GOALS STATE ======
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('Goals');
  const [goals, setGoals] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const [goalInputs, setGoalInputs] = useState({});
  const [attributeInputs, setAttributeInputs] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState(new Set());
  const [selectedAttributeIds, setSelectedAttributeIds] = useState(new Set());

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






  // ====== EMPLOYEE GOALS FETCH ======
  // ====== EMPLOYEE GOALS FETCH ======
  // Removed Quarterly Logic

  const fetchGoalsAndAttributes = async () => {
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem("token"); // Get JWT

    try {
      // 1. Fetch Goals
      const res = await api.get(`/goals/employee/${selectedEmployeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Attach JWT
        }
      });
      const data = res.data;

      const filtered = data.filter((g) => {
        const status = g.status?.toLowerCase() || '';
        return status !== 'reviewed';
      });

      setGoals(filtered);

      const inputsInit = {};
      filtered.forEach(g => {
        inputsInit[g.goalId] = {
          managerComments: g.managerComments || '',
          managerRating: g.managerRating ? String(g.managerRating) : '',
        };
      });
      setGoalInputs(inputsInit);

      // 2. Fetch Attributes
      const attrRes = await api.get(`/attributes/employee/${selectedEmployeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Attach JWT
        }
      });
      const attrData = attrRes.data;
      setAttributes(attrData);

      const attrInputsInit = {};
      attrData.forEach(a => {
        attrInputsInit[a.attributeId] = {
          managerComments: a.managerComments || '',
          managerRating: a.managerRating ? String(a.managerRating) : '',
        };
      });
      setAttributeInputs(attrInputsInit);

      const goalsNeedReview = filtered.filter(g => ['submitted', 'rejected by reviewer'].includes(g.status?.toLowerCase())).length > 0;
      const attributesNeedReview = attrData.filter(a => ['submitted', 'rejected by reviewer'].includes(a.status?.toLowerCase())).length > 0;
      setReviewed(!goalsNeedReview && !attributesNeedReview);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedGoalIds(new Set());
    setSelectedAttributeIds(new Set());
    if (selectedEmployeeId) fetchGoalsAndAttributes();
    else {
      setError('Employee ID missing in navigation state.');
      setLoading(false);
    }
  }, [selectedEmployeeId]);

  // **VALIDATION AND CHANGE HANDLER FOR MANAGER RATING**
  const handleManagerRatingChange = (e, goalId) => {
    const value = e.target.value;
    // Allow only empty string or a single digit from 1 to 5
    if (value === "" || /^[1-5]$/.test(value)) {
      setGoalInputs((prev) => ({
        ...prev,
        [goalId]: { ...prev[goalId], managerRating: value },
      }));
    }
  };

  const handleInputChange = (e, goalId, field) => {
    setGoalInputs((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: e.target.value },
    }));
  };

  const handleSaveFeedback = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const goalsToSave = selectedGoalIds.size > 0
        ? filteredGoals.filter(g => selectedGoalIds.has(g.goalId))
        : filteredGoals;

      const feedbackArray = goalsToSave.map(goal => ({
        goalId: goal.goalId,
        achievedTarget: goalInputs[goal.goalId]?.achievedTarget?.trim() || '',
        managerComments: goalInputs[goal.goalId]?.managerComments?.trim() || '',
        managerRating: goalInputs[goal.goalId]?.managerRating
          ? parseInt(goalInputs[goal.goalId].managerRating.trim())
          : null
      }));

      if (feedbackArray.length === 0) {
        alert('No goals selected to save feedback for.');
        setIsSaving(false);
        return;
      }

      const token = sessionStorage.getItem("token");

      // Use the same endpoint for saving (it updates goals without changing status to Reviewed/Approved unless specified)
      // Note: The backend logic for this endpoint updates comments/ratings.
      // If we want to strictly "Draft" save, we might need a different endpoint or flag, 
      // but based on current backend code inspection, it just updates fields.
      // The submit button calls an additional '/goals/review' endpoint to change status.
      // So calling just this one is effectively a "Save".

      await api.put('/goals/manager-feedback', feedbackArray, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      alert("Comments Saved Successfully");
      // setSaveMessage("Feedback saved successfully!");
      // setTimeout(() => setSaveMessage(""), 3000);

    } catch (error) {
      console.error(error);
      setSaveMessage('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      const goalsToSubmit = selectedGoalIds.size > 0
        ? filteredGoals.filter(g => selectedGoalIds.has(g.goalId))
        : filteredGoals;

      const feedbackArray = goalsToSubmit.map(goal => ({
        goalId: goal.goalId,
        achievedTarget: goalInputs[goal.goalId]?.achievedTarget?.trim() || '',
        managerComments: goalInputs[goal.goalId]?.managerComments?.trim() || '',
        managerRating: goalInputs[goal.goalId]?.managerRating
          ? parseInt(goalInputs[goal.goalId].managerRating.trim())
          : null
      }));

      if (feedbackArray.length === 0) {
        alert('No goals selected to submit feedback for.');
        return;
      }

      // Mandatory field validation
      for (const feedback of feedbackArray) {
        if (!feedback.managerComments) {
          alert(`Manager Comments for Goal ID ${feedback.goalId} are mandatory.`);
          return;
        }
      }

      const token = sessionStorage.getItem("token"); // Get JWT

      // Submit manager feedback
      await api.put('/goals/manager-feedback', feedbackArray, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Mark goals as reviewed
      const reviewedGoalIds = feedbackArray.map(goal => goal.goalId);
      const today = new Date().toISOString().split('T')[0];

      await api.patch('/goals/review',
        {
          goalIds: reviewedGoalIds,
          status: 'Approved',
          endDate: today // Storing end date as requested
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );


      const remainingGoals = goals.filter(g => !reviewedGoalIds.includes(g.goalId));
      setGoals(remainingGoals);
      setSelectedGoalIds(prev => {
        const next = new Set(prev);
        reviewedGoalIds.forEach(id => next.delete(id));
        return next;
      });

      alert('Feedback submitted and goals marked as approved!');
    } catch (error) {
      console.error(error);

      alert('Error: ' + (error.response?.data?.message || error.message));

    }
  };

  const filteredAttributes = useMemo(() => {
    const validStatuses = ['submitted', 'rejected by reviewer'];
    let statusFiltered = attributes.filter((a) =>
      validStatuses.includes(a.status?.toLowerCase())
    );

    if (selectedTimePeriod && selectedTimePeriod !== 'All') {
      statusFiltered = statusFiltered.filter((a) => a.timePeriod === selectedTimePeriod);
    }

    if (!searchTerm.trim()) {
      return statusFiltered;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    return statusFiltered.filter((attr) => {
      const searchableText = [
        attr.attributeId,
        attr.attributeTitle,
        attr.attributeDescription,
        attr.metric,
        attr.target,
        attr.rating,
        attr.selfAssessment,
        attributeInputs[attr.attributeId]?.managerComments,
        attributeInputs[attr.attributeId]?.managerRating,
      ]
        .map((item) => (item ? String(item).toLowerCase() : ''))
        .join(' ');

      return searchableText.includes(lowerCaseSearchTerm);
    });
  }, [attributes, searchTerm, attributeInputs, selectedTimePeriod]);

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
      setSelectedAttributeIds(new Set(filteredAttributes.map((a) => a.attributeId)));
    } else {
      setSelectedAttributeIds(new Set());
    }
  };

  const handleManagerAttributeRatingChange = (e, attributeId) => {
    const value = e.target.value;
    if (value === "" || /^[1-5]$/.test(value)) {
      setAttributeInputs((prev) => ({
        ...prev,
        [attributeId]: { ...prev[attributeId], managerRating: value },
      }));
    }
  };

  const handleAttributeInputChange = (e, attributeId, field) => {
    setAttributeInputs((prev) => ({
      ...prev,
      [attributeId]: { ...prev[attributeId], [field]: e.target.value },
    }));
  };

  const handleSaveAttributeFeedback = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const attrsToSave = selectedAttributeIds.size > 0
        ? filteredAttributes.filter(a => selectedAttributeIds.has(a.attributeId))
        : filteredAttributes;

      const feedbackArray = attrsToSave.map(attr => ({
        attributeId: attr.attributeId,
        managerComments: attributeInputs[attr.attributeId]?.managerComments?.trim() || '',
        managerRating: attributeInputs[attr.attributeId]?.managerRating
          ? parseInt(attributeInputs[attr.attributeId].managerRating.trim())
          : null
      }));

      if (feedbackArray.length === 0) {
        alert('No attributes selected to save feedback for.');
        setIsSaving(false);
        return;
      }

      const token = sessionStorage.getItem("token");

      await api.put('/attributes/manager-feedback', feedbackArray, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      alert("Comments Saved Successfully");
    } catch (error) {
      console.error(error);
      setSaveMessage('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitAttributeFeedback = async () => {
    try {
      const attrsToSubmit = selectedAttributeIds.size > 0
        ? filteredAttributes.filter(a => selectedAttributeIds.has(a.attributeId))
        : filteredAttributes;

      const feedbackArray = attrsToSubmit.map(attr => ({
        attributeId: attr.attributeId,
        managerComments: attributeInputs[attr.attributeId]?.managerComments?.trim() || '',
        managerRating: attributeInputs[attr.attributeId]?.managerRating
          ? parseInt(attributeInputs[attr.attributeId].managerRating.trim())
          : null
      }));

      if (feedbackArray.length === 0) {
        alert('No attributes selected to submit feedback for.');
        return;
      }

      for (const feedback of feedbackArray) {
        if (!feedback.managerComments) {
          alert(`Manager Comments for Attribute ID ${feedback.attributeId} are mandatory.`);
          return;
        }
      }

      const token = sessionStorage.getItem("token");

      // Submit manager feedback
      await api.put('/attributes/manager-feedback', feedbackArray, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Mark attributes as Approved
      const reviewedAttributeIds = feedbackArray.map(attr => attr.attributeId);

      await api.patch('/attributes/review',
        {
          attributeIds: reviewedAttributeIds,
          status: 'Approved'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const remainingAttributes = attributes.filter(a => !reviewedAttributeIds.includes(a.attributeId));
      setAttributes(remainingAttributes);
      setSelectedAttributeIds(prev => {
        const next = new Set(prev);
        reviewedAttributeIds.forEach(id => next.delete(id));
        return next;
      });

      alert('Feedback submitted and attributes marked as approved!');
    } catch (error) {
      console.error(error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };


  // ===== FILTERING LOGIC (UPDATED) =====
  const filteredGoals = useMemo(() => {
    const validStatuses = ['submitted', 'rejected by reviewer'];
    let statusFiltered = goals.filter((g) =>
      validStatuses.includes(g.status?.toLowerCase())
    );

    if (selectedTimePeriod && selectedTimePeriod !== 'All') {
      statusFiltered = statusFiltered.filter((g) => g.timePeriod === selectedTimePeriod);
    }

    if (!searchTerm.trim()) {
      return statusFiltered;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    return statusFiltered.filter((goal) => {
      const searchableText = [
        goal.quarter,
        goal.goalId,
        goal.goalTitle,
        goal.goalDescription,
        goal.metric, // weightage
        goal.target,
        goal.rating,
        goal.selfAssessment,
        goal.additionalNotes,
        // goalInputs[goal.goalId]?.achievedTarget,
        goalInputs[goal.goalId]?.managerComments,
        goalInputs[goal.goalId]?.managerRating,
      ]
        .map((item) => (item ? String(item).toLowerCase() : ''))
        .join(' ');

      return searchableText.includes(lowerCaseSearchTerm);
    });
  }, [goals, searchTerm, goalInputs, selectedTimePeriod]);

  const thStyle = {
    textAlign: 'center',
    padding: '10px 12px',
    color: 'white',
    background: '#629AF1',
    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
    fontSize: "14px",
    fontWeight: "600",
    textTransform: "none",
    letterSpacing: "0.5px"
  };
  const tdStyle = { padding: '12px 10px', borderRight: '1px solid #e2e8f0', color: '#475569', fontSize: '13.5px', verticalAlign: 'middle' };
  const buttonStyle = {
    padding: '10px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)',
    transition: 'all 0.3s ease'
  };

  return (

    <div className="mains-content">
      <main style={{ flexGrow: 1 }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1rem',
        }}>
          <SubTab title="Goals" isActive={activeSubTab === 'Goals'} onClick={() => setActiveSubTab('Goals')} />
          <SubTab title="Attributes" isActive={activeSubTab === 'Attributes'} onClick={() => setActiveSubTab('Attributes')} />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading goals...</p>
        ) : (

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0' }}>

            {activeSubTab === 'Attributes' ? (
              /* ---- Attributes Table ---- */
              <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', marginTop: '0' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: "4%" }}>
                        <input
                          type="checkbox"
                          checked={filteredAttributes.length > 0 && filteredAttributes.every(a => selectedAttributeIds.has(a.attributeId))}
                          onChange={handleAttributeSelectAll}
                          style={{
                            cursor: 'pointer',
                            width: '16px',
                            height: '16px',
                            accentColor: '#14b8a6'
                          }}
                        />
                      </th>
                      <th style={{ ...thStyle, width: "30%" }}>Attribute Title</th>
                      <th style={{ ...thStyle, width: "35%" }}>Description</th>
                      <th style={{ ...thStyle, width: "15%" }}>Self Assessment</th>
                      <th style={{ ...thStyle, width: "16%", borderRight: 'none' }}>Manager Comments<span style={{ color: '#ef4444' }}>*</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttributes.length > 0 ? (
                      filteredAttributes.map((attr) => (
                        <tr key={attr.attributeId} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f6f8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ ...tdStyle, width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>
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
                          <td style={{
                            ...tdStyle, maxWidth: '200px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word', textAlign: "left", paddingLeft: "12px"
                          }}>
                            {attr.attributeTitle}
                          </td>
                          <td style={{
                            ...tdStyle, maxWidth: '250px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word', textAlign: "center"
                          }}>{attr.attributeDescription || '-'}</td>
                          <td style={{
                            ...tdStyle, maxWidth: '200px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word', textAlign: "center", paddingLeft: "12px"
                          }}>{attr.selfAssessment || '-'}</td>
                          <td style={{
                            ...tdStyle,
                            maxWidth: '300px',
                            minWidth: '220px',
                            borderRight: 'none'
                          }}>
                            <textarea
                              value={attributeInputs[attr.attributeId]?.managerComments || ''}
                              onChange={(e) => {
                                handleAttributeInputChange(e, attr.attributeId, 'managerComments');
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                              style={{
                                width: '100%',
                                fontSize: "13px",
                                border: "1.5px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                outline: "none",
                                transition: "border-color 0.2s, box-shadow 0.2s",
                                minHeight: "38px",
                                overflow: 'hidden',
                                resize: 'none'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = "#2dd4bf";
                                e.target.style.boxShadow = "0 0 0 3px rgba(45, 212, 191, 0.1)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = "#e2e8f0";
                                e.target.style.boxShadow = "none";
                              }}
                              rows={1}
                              maxLength={200}
                              placeholder="Enter manager feedback..."
                              required
                            />
                            <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: "500" }}>
                              {(attributeInputs[attr.attributeId]?.managerComments?.length || 0)}/200
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                          {searchTerm.trim() ? 'No attributes found matching your search.' : 'All attributes have been reviewed.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ---- Goals Table ---- */
              <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', marginTop: '0' }}>
                <thead>
                  <tr>
                    {/* Checkbox column header */}
                    <th style={{ ...thStyle, width: "4%" }}>
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
                    {/* Updated Header Styles to include right border */}
                    <th style={{ ...thStyle, width: "12%" }}>Title</th>
                    <th style={{ ...thStyle, width: "20%" }}>Description</th>
                    <th style={{ ...thStyle, width: "8%" }}>Weightage (%)</th>
                    <th style={{ ...thStyle, width: "8%" }}>Target</th>
                    <th style={{ ...thStyle, width: "15%" }}>Self Assessment</th>

                    <th style={{ ...thStyle, width: "18%", borderRight: 'none' }}>Manager Comments<span style={{ color: '#ef4444' }}>*</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.length > 0 ? (
                    filteredGoals.map((g) => (
                      <tr key={g.goalId} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f6f8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
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
                        {/* Updated TD Styles to include right border */}
                        <td style={{
                          ...tdStyle, maxWidth: '200px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word', textAlign: "left", paddingLeft: "12px"
                        }}>
                          {g.goalTitle}
                        </td>
                        <td style={{
                          ...tdStyle, maxWidth: '250px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word', textAlign: "center"
                        }}>{g.goalDescription}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>{g.metric ? `${g.metric}%` : '-'}</td>
                        <td style={{
                          ...tdStyle, maxWidth: '100px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word', textAlign: "center"
                        }}>{g.target}</td>
                        <td style={{
                          ...tdStyle, maxWidth: '200px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word', textAlign: "center", paddingLeft: "12px"
                        }}>{g.selfAssessment}</td>
                        <td style={{
                          ...tdStyle,
                          maxWidth: '300px',
                          minWidth: '220px',
                          borderRight: 'none'
                        }}>
                          <textarea
                            value={goalInputs[g.goalId]?.managerComments || ''}
                            onChange={(e) => {
                              handleInputChange(e, g.goalId, 'managerComments');
                              // Auto-resize logic
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            style={{
                              width: '100%',
                              fontSize: "13px",
                              border: "1.5px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              outline: "none",
                              transition: "border-color 0.2s, box-shadow 0.2s",
                              minHeight: "38px", // Compact initial size
                              overflow: 'hidden',
                              resize: 'none'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#2dd4bf";
                              e.target.style.boxShadow = "0 0 0 3px rgba(45, 212, 191, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e2e8f0";
                              e.target.style.boxShadow = "none";
                            }}
                            rows={1}
                            maxLength={200}
                            placeholder="Enter manager feedback..."
                            required
                          />
                          <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: "500" }}>
                            {(goalInputs[g.goalId]?.managerComments?.length || 0)}/200
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                        {searchTerm.trim() ? 'No goals found matching your search.' : 'All goals have been reviewed.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
            {!reviewed && (
              (activeSubTab === 'Goals' && filteredGoals.length > 0) ||
              (activeSubTab === 'Attributes' && filteredAttributes.length > 0)
            ) && (
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                {saveMessage && (
                  <span style={{
                    color: saveMessage.includes('Error') ? '#ef4444' : '#10b981',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginRight: '1rem'
                  }}>
                    {saveMessage}
                  </span>
                )}
                <button
                  onClick={activeSubTab === 'Attributes' ? handleSaveAttributeFeedback : handleSaveFeedback}
                  disabled={isSaving}
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', // Match Save style
                    opacity: isSaving ? 0.7 : 1,
                    cursor: isSaving ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.25)';
                    }
                  }}
                >
                  {isSaving ? "Saving..." : (
                    activeSubTab === 'Attributes'
                      ? (selectedAttributeIds.size > 0 ? "Save Selected" : "Save All")
                      : (selectedGoalIds.size > 0 ? "Save Selected" : "Save All")
                  )}
                </button>

                <button
                  onClick={activeSubTab === 'Attributes' ? handleSubmitAttributeFeedback : handleSubmitFeedback}
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', // Lighter teal for submit
                    color: '#0f766e',
                    boxShadow: '0 4px 12px rgba(94, 234, 212, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(94, 234, 212, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 234, 212, 0.4)';
                  }}
                >
                  {activeSubTab === 'Attributes'
                    ? (selectedAttributeIds.size > 0 ? "Submit Selected" : "Submit Feedback")
                    : (selectedGoalIds.size > 0 ? "Submit Selected" : "Submit Feedback")
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>

  );
};

export default Submitfeedback;
