import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import './Reviewergoals.css';
import Sidebar from './Sidebar.js';
import api from "../api";

// Auto-resize textarea component
const AutoResizeTextarea = ({ value, onChange }) => {
  const textareaRef = useRef(null);
  const maxLength = 50;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        maxLength={maxLength}
        style={{
          width: '100%',
          resize: 'none',
          overflow: 'hidden',
          minHeight: '45px',
          padding: '12px',
          boxSizing: 'border-box',
          lineHeight: '1.4',
          fontFamily: 'inherit',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px', // Rounded corners per image
          backgroundColor: '#f8fafc',
          fontSize: '13px',
          outline: 'none',
          color: '#334155',
          marginBottom: '4px' // Space between input and counter
        }}
        placeholder="Enter comments..."
      />

      {/* Character Counter positioned BELOW the input field */}
      <div style={{
        fontSize: '12px',
        fontWeight: '500',
        color: value.length >= maxLength ? '#64748b' : '#64748b',
        paddingRight: '4px'
      }}>
        {value.length}/{maxLength}
      </div>
    </div>
  );
};
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

function ReviewerGoals() {
  // ===== PERFORMANCE (Sidebar + Topbar) STATE =====
  const employeeIdStored = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();


  // ===== REVIEWER GOALS STATE =====
  // Use location state first, then session storage, then fall back to empty string
  const initialEmployeeId = location.state?.employeeId || sessionStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');

  // Active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState('Goals');

  // Goals and Attributes that are ready for final 'Reviewed' status
  const [allGoals, setAllGoals] = useState([]);
  const [goalsForReview, setGoalsForReview] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [attributesForReview, setAttributesForReview] = useState([]);

  const [error, setError] = useState('');
  const [selectedGoalIds, setSelectedGoalIds] = useState(new Set());
  const [selectedAttributeIds, setSelectedAttributeIds] = useState(new Set());

  const handleCheckboxChange = (id) => {
    if (activeSubTab === 'Goals') {
      setSelectedGoalIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setSelectedAttributeIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  const handleSelectAll = (e) => {
    if (activeSubTab === 'Goals') {
      if (e.target.checked) {
        setSelectedGoalIds(new Set(filteredGoals.map((g) => g.goalId)));
      } else {
        setSelectedGoalIds(new Set());
      }
    } else {
      if (e.target.checked) {
        setSelectedAttributeIds(new Set(filteredAttributes.map((a) => a.attributeId)));
      } else {
        setSelectedAttributeIds(new Set());
      }
    }
  };
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

  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
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
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [reviewerCommentsMap, setReviewerCommentsMap] = useState({});
  const [savingComments, setSavingComments] = useState(false);


  // Styling for consistency
  const cellStyle = {
    border: '1px solid #e2e8f0',
    padding: '12px 10px',
    textAlign: 'left',
    verticalAlign: 'top',
    backgroundColor: "white",
    fontSize: '13px',
    color: '#334155'
  };

  const textCellStyle = {
    ...cellStyle,
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    padding: '12px 12px',
  };

  const thStyle = {
    background: '#629AF1',
    color: 'white',
    padding: '8px 8px',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'none',
    border: 'none',
    textAlign: 'center',
  };

  // ===== REVIEWER GOALS: Fetch Goals and Attributes =====

  const [reviewerAttributeCommentsMap, setReviewerAttributeCommentsMap] = useState({});

  useEffect(() => {
    setSelectedGoalIds(new Set());
    setSelectedAttributeIds(new Set());
    if (!employeeId) {
      setError('No employee ID provided.');
      setLoading(false);
      return;
    }
    fetchGoals();

    // Clean up session storage after fetching to prevent stale ID persistence
    return () => {
      sessionStorage.removeItem('selectedEmployeeId');
    };
  }, [employeeId]);


  const fetchGoals = async () => {
    setLoading(true);
    setError('');

    try {
      let rawToken = sessionStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;

      // Fetch goals for the selected employee
      const response = await api.get(`/goals/employee/${employeeId}`, {
        headers: { Authorization: token },
      });

      const data = response.data;
      setAllGoals(data);

      // Filter goals for review
      const goalsForReviewList = data.filter(goal => goal.status?.toLowerCase() === 'approved');
      setGoalsForReview(goalsForReviewList);

      // Initialize reviewer comments map for goals
      const initialCommentsMap = {};
      goalsForReviewList.forEach(goal => {
        initialCommentsMap[goal.goalId] = goal.reviewerComments || '';
      });
      setReviewerCommentsMap(initialCommentsMap);

      // Fetch attributes for the selected employee
      const attrResponse = await api.get(`/attributes/employee/${employeeId}`, {
        headers: { Authorization: token },
      });
      const attrData = attrResponse.data;
      setAllAttributes(attrData);

      // Filter attributes for review (Approved by Manager)
      const attributesForReviewList = attrData.filter(attr => attr.status?.toLowerCase() === 'approved');
      setAttributesForReview(attributesForReviewList);

      // Initialize reviewer comments map for attributes
      const initialAttrCommentsMap = {};
      attributesForReviewList.forEach(attr => {
        initialAttrCommentsMap[attr.attributeId] = attr.reviewerComments || '';
      });
      setReviewerAttributeCommentsMap(initialAttrCommentsMap);

    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to fetch goals and attributes: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Saves all non-empty reviewer comments for the current batch of active tab.
   * This runs BEFORE the final status update.
   */

  const saveReviewerComments = async (silent = false) => {
    setSavingComments(true);
    let successfulSaves = true;

    try {
      let rawToken = sessionStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;

      if (activeSubTab === 'Goals') {
        // Filter out goals with empty comments and respect selection
        const goalsToSave = Object.entries(reviewerCommentsMap).filter(([goalId, comments]) => {
          const isSelected = selectedGoalIds.size > 0 ? selectedGoalIds.has(Number(goalId)) : true;
          return isSelected && comments.trim() !== '';
        });

        for (const [goalId, reviewerComments] of goalsToSave) {
          try {
            await api.put(
              `/goals/${goalId}/reviewer-comments`,
              { reviewerComments },
              { headers: { Authorization: token } }
            );
          } catch (err) {
            successfulSaves = false;
            const message = err.response?.data?.message || err.message;
            throw new Error(`Failed to update comments for goal ID ${goalId}: ${message}`);
          }
        }
      } else {
        // Filter out attributes with empty comments and respect selection
        const attrsToSave = Object.entries(reviewerAttributeCommentsMap).filter(([attrId, comments]) => {
          const isSelected = selectedAttributeIds.size > 0 ? selectedAttributeIds.has(Number(attrId)) : true;
          return isSelected && comments.trim() !== '';
        });

        for (const [attrId, reviewerComments] of attrsToSave) {
          try {
            await api.put(
              `/attributes/${attrId}/reviewer-comments`,
              { reviewerComments },
              { headers: { Authorization: token } }
            );
          } catch (err) {
            successfulSaves = false;
            const message = err.response?.data?.message || err.message;
            throw new Error(`Failed to update comments for attribute ID ${attrId}: ${message}`);
          }
        }
      }

      if (successfulSaves && !silent) {
        alert("Comments Saved Successfully");
      }
    } catch (err) {
      setError(`Error saving comments: ${err.message}`);
      successfulSaves = false;
    } finally {
      setSavingComments(false);
    }

    return successfulSaves;
  };

  /**
   * Updates all goals/attributes in the batch to the final status (Approved or Rejected by Reviewer).
   * It first validates and saves reviewer comments.
   */

  const updateAllGoalsStatus = async (newStatus) => {
    if (batchUpdating) return;

    // Determine items to update based on selection and active sub-tab
    let itemsToUpdate;
    if (activeSubTab === 'Goals') {
      itemsToUpdate = selectedGoalIds.size > 0
        ? goalsForReview.filter(g => selectedGoalIds.has(g.goalId))
        : goalsForReview;
    } else {
      itemsToUpdate = selectedAttributeIds.size > 0
        ? attributesForReview.filter(a => selectedAttributeIds.has(a.attributeId))
        : attributesForReview;
    }

    if (itemsToUpdate.length === 0) {
      return alert(activeSubTab === 'Goals' ? 'No goals selected for update.' : 'No attributes selected for update.');
    }

    // 1. Client-Side Validation: Ensure all mandatory comments are filled
    const missingComments = itemsToUpdate.filter(item => {
      const comment = activeSubTab === 'Goals'
        ? reviewerCommentsMap[item.goalId]
        : reviewerAttributeCommentsMap[item.attributeId];
      return !comment || comment.trim() === '';
    });

    if (missingComments.length > 0) {
      alert(`Please add reviewer comments for all selected items before proceeding. ${missingComments.length} item(s) are missing comments.`);
      return;
    }


    setBatchUpdating(true);
    setError('');

    try {
      // 2. Save Comments first
      const commentsSaved = await saveReviewerComments(true);
      if (!commentsSaved) {
        setBatchUpdating(false);
        return; 
      }

      // 3. Perform Batch Status Update
      let rawToken = sessionStorage.getItem('token');
      if (!rawToken) throw new Error('No token found, please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) rawToken = rawToken.slice(1, -1);
      const token = `Bearer ${rawToken}`;

      if (activeSubTab === 'Goals') {
        const goalIds = itemsToUpdate.map(goal => goal.goalId);

        await api.patch(
          `/goals/review`,
          { goalIds, status: newStatus }, // request body
          { headers: { Authorization: token } } // headers
        );

        alert(newStatus === 'Completed'
          ? (selectedGoalIds.size > 0 ? 'Selected goals Approved successfully' : 'Goals Approved successfully')
          : (selectedGoalIds.size > 0 ? 'Selected goals Rejected successfully' : 'Goals Rejected successfully')
        );

        // Remove updated goals from list and clear selection state
        setGoalsForReview(prev => prev.filter(g => !goalIds.includes(g.goalId)));
        setSelectedGoalIds(prev => {
          const next = new Set(prev);
          goalIds.forEach(id => next.delete(id));
          return next;
        });
      } else {
        const attributeIds = itemsToUpdate.map(attr => attr.attributeId);

        await api.patch(
          `/attributes/review`,
          { attributeIds, status: newStatus }, // request body
          { headers: { Authorization: token } } // headers
        );

        alert(newStatus === 'Completed'
          ? (selectedAttributeIds.size > 0 ? 'Selected attributes Approved successfully' : 'Attributes Approved successfully')
          : (selectedAttributeIds.size > 0 ? 'Selected attributes Rejected successfully' : 'Attributes Rejected successfully')
        );

        // Remove updated attributes from list and clear selection state
        setAttributesForReview(prev => prev.filter(a => !attributeIds.includes(a.attributeId)));
        setSelectedAttributeIds(prev => {
          const next = new Set(prev);
          attributeIds.forEach(id => next.delete(id));
          return next;
        });
      }

      fetchGoals();

    } catch (err) {
      const message = err.response?.data?.message || err.message;
      alert(`Error during final update: ${message}`);
      setError(`Final update error: ${message}`);
    } finally {
      setBatchUpdating(false);
    }
  };



  /**
   * Saves reviewer comments for all goals or attributes without changing their status.
   */
  const handleSaveAll = async () => {
    if (savingComments) return;
    if (activeSubTab === 'Goals') {
      if (filteredGoals.length === 0) return alert('No goals to save.');
    } else {
      if (filteredAttributes.length === 0) return alert('No attributes to save.');
    }

    try {
      await saveReviewerComments();
    } catch (error) {
      console.error("Error saving comments:", error);
    }
  };

  const handleCommentChange = (id, value) => {
    // Truncate to 50 characters to prevent overflow on paste
    const truncatedValue = value.substring(0, 50);
    if (activeSubTab === 'Goals') {
      setReviewerCommentsMap(prev => ({
        ...prev,
        [id]: truncatedValue
      }));
    } else {
      setReviewerAttributeCommentsMap(prev => ({
        ...prev,
        [id]: truncatedValue
      }));
    }
  };
  // Filter goals based on the search term

  const filteredGoals = goalsForReview.filter(goal => {
    if (!matchesTimePeriod(goal.timePeriod)) return false;

    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      goal.goalTitle?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.goalDescription?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.quarter?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.metric)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.target)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.status?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.rating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.selfAssessment?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.additionalNotes?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.achievedTarget)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.managerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.managerRating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      goal.reviewerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(goal.goalId)?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const filteredAttributes = attributesForReview.filter(attr => {
    if (!matchesTimePeriod(attr.timePeriod)) return false;

    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      attr.attributeTitle?.toLowerCase().includes(lowerCaseSearchTerm) ||
      attr.attributeDescription?.toLowerCase().includes(lowerCaseSearchTerm) ||
      attr.quarter?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(attr.metric)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(attr.target)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      attr.status?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(attr.rating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      attr.selfAssessment?.toLowerCase().includes(lowerCaseSearchTerm) ||
      attr.additionalNotes?.toLowerCase().includes(lowerCaseSearchTerm) ||
      attr.managerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(attr.managerRating)?.toLowerCase().includes(lowerCaseSearchTerm) ||
      attr.reviewerComments?.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(attr.attributeId)?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });



  return (
    <Sidebar>
      <div style={{
        marginTop: '0',
        paddingTop: '0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        height: "100%", // make container fill screen height
        marginLeft: "0"
      }}>
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

        {/* Success and Error messages */}
        {successMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{successMessage}</p>}
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

        {/* ===== REVIEWER GOALS CONTENT BELOW DIVIDER ===== */}
        <div style={{ padding: '0px' }}>

          {loading && <p>Loading goals...</p>}



          {/* Display content only when not loading and no error */}
          {!loading && !error && (
            <>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                flexWrap: "wrap",
                gap: "12px",
              }}>
                <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "700", color: "#1e293b" }}>Goals for Employee ID: {getDisplayEmployeeId(employeeId)}</h2>

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

                    {/* Month Selector */}
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

                    {/* Quarter Selector */}
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

                    {/* Half Yearly Selector */}
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

              {/* Always display the table */}
              <div
                className="mobile-table-container"
                style={{
                  maxHeight: 'calc(100vh - 180px)',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  display: 'block',
                  width: '100%',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              >

                {activeSubTab === 'Goals' ? (
                  <table
                    style={{
                      borderCollapse: 'collapse',
                      width: '100%',
                      minWidth: '1000px',
                      tableLayout: 'fixed',
                      wordWrap: 'break-word',
                      marginTop: 0,
                    }}
                  >
                    <thead
                      style={{
                        background: '#629AF1',
                        color: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      <tr>
                        {/* Checkbox column header */}
                        <th style={{ ...thStyle, width: '4%', borderTopLeftRadius: '8px' }}>
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
                        <th style={{ ...thStyle, width: '12%', textAlign: 'left' }}>Title</th>
                        <th style={{ ...thStyle, width: '14%', textAlign: 'left' }}>Description</th>
                        <th style={{ ...thStyle, width: '10%', whiteSpace: 'nowrap', textAlign: 'left' }}>Weightage (%)</th>
                        <th style={{ ...thStyle, width: '11%', whiteSpace: 'normal', textAlign: 'left' }}>Target</th>
                        <th style={{ ...thStyle, width: '12%' }}>Self Assessment</th>
                        <th style={{ ...thStyle, width: '12%' }}>MNG Comments</th>
                        <th style={{ ...thStyle, width: '16%', borderTopRightRadius: '8px', borderRight: 'none' }}>Reviewer Comments <span style={{ color: "red" }}>*</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGoals.length === 0 ? (
                        // Display message if no goals match
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontWeight: 'bold' }}>
                            {allGoals.length === 0
                              ? 'No assigned goals for this employee.'
                              : 'No goals are currently pending final review for this employee.'}
                          </td>
                        </tr>
                      ) : (
                        // Display goal rows if goals exist
                        filteredGoals.map((goal) => (
                          <tr key={goal.goalId}>
                            {/* Checkbox cell */}
                            <td style={{ ...cellStyle, width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>
                              <input
                                type="checkbox"
                                checked={selectedGoalIds.has(goal.goalId)}
                                onChange={() => handleCheckboxChange(goal.goalId)}
                                style={{
                                  cursor: 'pointer',
                                  width: '16px',
                                  height: '16px',
                                  accentColor: '#14b8a6'
                                }}
                              />
                            </td>
                            <td style={textCellStyle}>
                              {goal.goalTitle}
                            </td>
                            <td style={textCellStyle}>{goal.goalDescription}</td>

                            <td style={cellStyle}>{goal.metric ? `${goal.metric}%` : '-'}</td>
                            <td style={cellStyle}>{goal.target}</td>
                            <td style={textCellStyle}>{goal.selfAssessment}</td>
                            <td style={textCellStyle}>{goal.managerComments}</td>

                            <td style={{ ...cellStyle, borderRight: 'none' }}>
                              <AutoResizeTextarea
                                value={reviewerCommentsMap[goal.goalId] || ''}
                                onChange={(val) => handleCommentChange(goal.goalId, val)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table
                    style={{
                      borderCollapse: 'collapse',
                      width: '100%',
                      minWidth: '1000px',
                      tableLayout: 'fixed',
                      wordWrap: 'break-word',
                      marginTop: 0,
                    }}
                  >
                    <thead
                      style={{
                        background: '#629AF1',
                        color: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      <tr>
                        {/* Checkbox column header */}
                        <th style={{ ...thStyle, width: '4%', borderTopLeftRadius: '8px' }}>
                          <input
                            type="checkbox"
                            checked={filteredAttributes.length > 0 && filteredAttributes.every(a => selectedAttributeIds.has(a.attributeId))}
                            onChange={handleSelectAll}
                            style={{
                              cursor: 'pointer',
                              width: '16px',
                              height: '16px',
                              accentColor: '#14b8a6'
                            }}
                          />
                        </th>
                        <th style={{ ...thStyle, width: '12%', textAlign: 'left' }}>Title</th>
                        <th style={{ ...thStyle, width: '26%', textAlign: 'left' }}>Description</th>
                        <th style={{ ...thStyle, width: '12%' }}>Self Assessment</th>
                        <th style={{ ...thStyle, width: '12%' }}>MNG Comments</th>
                        <th style={{ ...thStyle, width: '14%', borderTopRightRadius: '8px', borderRight: 'none' }}>Reviewer Comments <span style={{ color: "red" }}>*</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttributes.length === 0 ? (
                        // Display message if no attributes match
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontWeight: 'bold' }}>
                            {allAttributes.length === 0
                              ? 'No assigned attributes for this employee.'
                              : 'No attributes are currently pending final review for this employee.'}
                          </td>
                        </tr>
                      ) : (
                        // Display attribute rows if attributes exist
                        filteredAttributes.map((attr) => (
                          <tr key={attr.attributeId}>
                            {/* Checkbox cell */}
                            <td style={{ ...cellStyle, width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>
                              <input
                                type="checkbox"
                                checked={selectedAttributeIds.has(attr.attributeId)}
                                onChange={() => handleCheckboxChange(attr.attributeId)}
                                style={{
                                  cursor: 'pointer',
                                  width: '16px',
                                  height: '16px',
                                  accentColor: '#14b8a6'
                                }}
                              />
                            </td>
                            <td style={textCellStyle}>
                              {attr.attributeTitle}
                            </td>
                            <td style={textCellStyle}>{attr.attributeDescription}</td>

                            <td style={textCellStyle}>{attr.selfAssessment}</td>
                            <td style={textCellStyle}>{attr.managerComments}</td>

                            <td style={{ ...cellStyle, borderRight: 'none' }}>
                              <AutoResizeTextarea
                                value={reviewerAttributeCommentsMap[attr.attributeId] || ''}
                                onChange={(val) => handleCommentChange(attr.attributeId, val)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* Batch action buttons are only shown if goals/attributes are loaded AND filtered items exist */}
          {!loading && ((activeSubTab === 'Goals' && filteredGoals.length > 0) || (activeSubTab === 'Attributes' && filteredAttributes.length > 0)) && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>

              <button
                onClick={handleSaveAll}
                disabled={savingComments || batchUpdating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#0D9488', // Amber/teal for Save
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: (savingComments || batchUpdating) ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                  transition: 'all 0.3s ease',
                  opacity: (savingComments || batchUpdating) ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!savingComments && !batchUpdating) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingComments && !batchUpdating) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
                  }
                }}
              >
                {savingComments ? 'Saving...' : (activeSubTab === 'Goals' ? (selectedGoalIds.size > 0 ? 'Save Selected' : 'Save All') : (selectedAttributeIds.size > 0 ? 'Save Selected' : 'Save All'))}
              </button>

              <button
                onClick={() => updateAllGoalsStatus('Completed')}
                disabled={batchUpdating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: batchUpdating ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)',
                  transition: 'all 0.3s ease',
                  opacity: batchUpdating ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!batchUpdating) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!batchUpdating) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.25)';
                  }
                }}
              >
                {batchUpdating ? 'Approving...' : (activeSubTab === 'Goals' ? (selectedGoalIds.size > 0 ? 'Approve Selected' : 'Approve All') : (selectedAttributeIds.size > 0 ? 'Approve Selected' : 'Approve All'))}
              </button>
              <button
                onClick={() => updateAllGoalsStatus('Rejected by Reviewer')}
                disabled={batchUpdating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: batchUpdating ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  transition: 'all 0.3s ease',
                  opacity: batchUpdating ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!batchUpdating) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!batchUpdating) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                  }
                }}
              >
                {batchUpdating ? 'Rejecting...' : (activeSubTab === 'Goals' ? (selectedGoalIds.size > 0 ? 'Reject Selected' : 'Reject All') : (selectedAttributeIds.size > 0 ? 'Reject Selected' : 'Reject All'))}
              </button>
            </div>
          )}
        </div>
      </div>
    </Sidebar >
  );
}


export default ReviewerGoals;
