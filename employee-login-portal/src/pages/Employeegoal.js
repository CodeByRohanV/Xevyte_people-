
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import Submitfeedback from './Submitfeedback';
import Newgoal from './Newgoal';

import './InProgressgoals.css'; // Import is kept, though its main logic is now integrated
import api from "../api";

// Reusable Tab component
const Tab = ({ title, isActive, onClick }) => (
    <div
        style={{
            cursor: 'pointer',
            padding: '12px 24px',
            color: isActive ? '#0d9488' : '#64748b',
            fontWeight: isActive ? '700' : '500',
            position: 'relative',
            borderBottom: isActive ? '3px solid #14b8a6' : '3px solid transparent',
            transition: 'all 0.3s ease',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            backgroundColor: isActive ? 'rgba(20, 184, 166, 0.05)' : 'transparent',
            borderRadius: '8px 8px 0 0',
        }}
        onClick={onClick}
    >
        {title}
    </div>
);

const EmployeeGoals = () => {
    const getDisplayEmployeeId = (id) => {
        if (!id) return "";
        if (id.includes('_')) return id.split('_').pop();
        if (id.includes('-')) return id.split('-').pop();
        return id;
    };

    const navigate = useNavigate();
    const location = useLocation();
    const tableContainerRef = useRef(null);

    const initialSelectedEmployeeId = location.state?.employeeId || sessionStorage.getItem('selectedEmployeeId') || '';
    const initialSelectedEmployeeName = location.state?.employeeName || sessionStorage.getItem('selectedEmployeeName') || '';

    const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);

    const reviewerId = location.state?.reviewerId;

    const [goals, setGoals] = useState([]);
    const [employeeAttributes, setEmployeeAttributes] = useState([]);
    const [newAttributes, setNewAttributes] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('In Progress');
    const [activeSubTab, setActiveSubTab] = useState('Goals');
    const [reviewed, setReviewed] = useState(false);
    const [newGoals, setNewGoals] = useState([]); // Array for truly new goals
    const [editingCell, setEditingCell] = useState(null); // Used for both newGoals and reassignedGoalId
    const [reassigningGoalIds, setReassigningGoalIds] = useState([]);
    const [reassigningAttributeIds, setReassigningAttributeIds] = useState([]);
    const [employeeDepartment, setEmployeeDepartment] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]); // Attributes applied from template
    const [selectedGoalIdsForSubmit, setSelectedGoalIdsForSubmit] = useState([]);
    const [selectedAttributeIdsForSubmit, setSelectedAttributeIdsForSubmit] = useState([]);
    // Track which rejected goal is being edited

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

    const getCurrentPeriod = (periods) => {
        if (!periods || periods.length === 0) return null;
        const today = new Date();
        const curYear = String(today.getFullYear());
        const curMonthIdx = today.getMonth(); // 0-11
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const curMonthName = monthNames[curMonthIdx];

        // 1. Monthly match
        let match = periods.find(p => p.year === curYear && p.frequency === 'Monthly' && p.month === curMonthName);
        if (match) return match;

        // 2. Quarterly match
        match = periods.find(p => {
            if (p.year !== curYear || p.frequency !== 'Quarterly') return false;
            if (p.month) {
                const months = p.month.split(', ').map(m => m.trim());
                return months.includes(curMonthName);
            }
            const qNum = Math.floor(curMonthIdx / 3) + 1;
            return p.quarter === `Q${qNum}`;
        });
        if (match) return match;

        // 3. Half Yearly match
        match = periods.find(p => {
            if (p.year !== curYear || p.frequency !== 'Half Yearly') return false;
            if (p.month) {
                const months = p.month.split(', ').map(m => m.trim());
                return months.includes(curMonthName);
            }
            const hNum = Math.floor(curMonthIdx / 6) + 1;
            return p.quarter === `H${hNum}`;
        });
        if (match) return match;

        // 4. Yearly match
        match = periods.find(p => p.year === curYear && p.frequency === 'Yearly');
        if (match) return match;

        // Fallback to first available period
        return periods[0];
    };

    const defaultPeriod = timePeriods.length > 0 ? getTimePeriodLabel(getCurrentPeriod(timePeriods)) : '';

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

    const isValidTimePeriod = (periodLabel) => {
        if (!periodLabel) return false;

        // Quarterly and Half Yearly cycles check
        if (periodLabel.startsWith('Q1') || periodLabel.startsWith('Q2') || periodLabel.startsWith('Q3') || periodLabel.startsWith('Q4') ||
            periodLabel.startsWith('H1') || periodLabel.startsWith('H2')) {
            return timePeriods.some(p => getTimePeriodLabel(p) === periodLabel);
        }

        // Monthly and Yearly cycles are always valid without involvement of the admin module
        return true;
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
        if (filterFreq === 'Yearly') {
            setSelectedTimePeriod(`Year ${yr}`);
            return;
        }
        if (filterFreq === 'Monthly') {
            setSelectedTimePeriod(`${filterSub !== 'All' ? filterSub : 'January'} ${yr}`);
            return;
        }
        const matching = timePeriods.filter(p => p.year === yr && p.frequency === filterFreq);
        if (matching.length > 0) {
            const first = matching[0];
            if (first.frequency === 'Quarterly' || first.frequency === 'Half Yearly') {
                setFilterSub(first.quarter);
            } else if (first.frequency === 'Monthly') {
                setFilterSub(first.month);
            } else {
                setFilterSub('All');
            }
            setSelectedTimePeriod(getTimePeriodLabel(first));
        } else {
            const anyMatching = timePeriods.filter(p => p.year === yr);
            if (anyMatching.length > 0) {
                const first = anyMatching[0];
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
        }
    };

    const handleFreqChange = (freq) => {
        setFilterFreq(freq);
        if (freq === 'All') {
            setFilterSub('All');
            setSelectedTimePeriod('All');
            return;
        }
        if (freq === 'Yearly') {
            setFilterSub('All');
            setSelectedTimePeriod(`Year ${filterYear}`);
            return;
        }
        if (freq === 'Monthly') {
            setFilterSub('January');
            setSelectedTimePeriod(`January ${filterYear}`);
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
        if (filterFreq === 'Monthly') {
            setSelectedTimePeriod(`${sub} ${filterYear}`);
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


    const getCaretIndexFromClick = (event, element) => {
        let caretOffset = 0;
        const range = document.caretRangeFromPoint
            ? document.caretRangeFromPoint(event.clientX, event.clientY)
            : null;

        if (!range) return 0;

        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;

        return caretOffset;
    };



    const fetchGoals = useCallback(async () => {
        if (!selectedEmployeeId) return;

        setLoading(true);
        setError(null);

        try {
            const token = sessionStorage.getItem("token");

            const response = await api.get(`/goals/employee/${selectedEmployeeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`, // ✅ attach JWT
                },
            });

            const data = response.data;

            // Updated: No longer filter by quarter
            setGoals(data);

            // Check if all goals are reviewed
            setReviewed(data.length > 0 && data.every((g) => g.status?.toLowerCase() === "reviewed"));

        } catch (err) {
            const errorMsg = err.response?.data || err.message || "Something went wrong";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [selectedEmployeeId]);

    const fetchAttributes = useCallback(async () => {
        if (!selectedEmployeeId) return;
        try {
            const token = sessionStorage.getItem("token");
            const response = await api.get(`/attributes/employee/${selectedEmployeeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;
            if (Array.isArray(data)) {
                setEmployeeAttributes(data);
            }
        } catch (err) {
            console.error("Error fetching attributes:", err);
        }
    }, [selectedEmployeeId]);

    /* START OF REASSIGNMENT LOGIC FIX */
    const handleReassignClick = (goal) => {
        // Add the goal ID to the list of goals being reassigned
        setReassigningGoalIds((prev) => [...prev, goal.goalId]);

        // Mark goal as being reassigned in local state
        setGoals(prev => prev.map(g =>
            g.goalId === goal.goalId
                ? {
                    ...g,
                    // rejectionReason: '',
                    isReassign: true,
                    status: 'Pending Reassignment'
                }
                : g
        ));
    };


    const handleReassignGoalChange = (goalId, e) => {
        const { name, value } = e.target;
        setGoals(prev => prev.map((g) => {
            if (g.goalId !== goalId) return g;

            let newValue = value;
            if (name === 'metric') {
                newValue = newValue.replace(/\D/g, '').slice(0, 3);
            } else if (name === 'target') {
                newValue = newValue.slice(0, 25);
            } else if (name === 'goalTitle') {
                newValue = newValue.slice(0, 50);
            } else if (name === 'goalDescription') {
                newValue = newValue.slice(0, 150);
            }

            return { ...g, [name]: newValue };
        }));
    };

    const handleSaveReassignment = async (goal) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("No token found. Please log in.");
            return;
        }

        if (
            !goal.goalTitle?.trim() ||
            !goal.goalDescription?.trim() ||
            !goal.metric?.trim() ||
            !goal.target?.trim()
        ) {
            alert("Please fill out all required fields for the reassigned goal before saving.");
            return;
        }

        const payload = {
            goalTitle: goal.goalTitle,
            goalDescription: goal.goalDescription,
            metric: goal.metric,
            target: goal.target,
            employeeId: selectedEmployeeId,
            reviewerId: reviewerId,
            status: 'pending',
            timePeriod: goal.timePeriod || (selectedTimePeriod !== 'All' ? selectedTimePeriod : defaultPeriod),
        };

        try {
            await api.put(`/goals/reassign/${goal.goalId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`, // ✅ attach JWT
                },
            });

            alert('Goal reassigned successfully!');
            setReassigningGoalIds(prev => prev.filter(id => id !== goal.goalId));
            fetchGoals();
        } catch (err) {
            const errorMsg = err.response?.data || err.message;
            console.error('Error saving reassignment:', errorMsg);
            alert(`Error saving reassignment: ${errorMsg}`);
        }
    };



    const handleCancelReassignment = (goalId) => {
        setReassigningGoalIds(prev => prev.filter(id => id !== goalId));

        // Optionally restore the goal's original rejection state
        // Simpler approach: re-fetch the goals
        fetchGoals();
    };

    const handleReassignAttributeClick = (attr) => {
        setReassigningAttributeIds((prev) => [...prev, attr.attributeId]);
        setEmployeeAttributes(prev => prev.map(a =>
            a.attributeId === attr.attributeId
                ? {
                    ...a,
                    isReassign: true,
                    status: 'Pending Reassignment'
                }
                : a
        ));
    };

    const handleSaveAttributeReassignment = async (attr) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("No token found. Please log in.");
            return;
        }

        if (
            !attr.attributeTitle?.trim() ||
            !attr.attributeDescription?.trim() ||
            !attr.metric?.trim()
        ) {
            alert("Please fill out all required fields for the reassigned attribute before saving.");
            return;
        }

        const payload = {
            attributeTitle: attr.attributeTitle,
            attributeDescription: attr.attributeDescription,
            metric: attr.metric,
            employeeId: selectedEmployeeId,
            assignedBy: sessionStorage.getItem("employeeId"),
            status: 'pending',
            timePeriod: attr.timePeriod || (selectedTimePeriod !== 'All' ? selectedTimePeriod : defaultPeriod),
        };

        try {
            await api.put(`/attributes/reassign/${attr.attributeId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            alert('Attribute reassigned successfully!');
            setReassigningAttributeIds(prev => prev.filter(id => id !== attr.attributeId));
            fetchAttributes();
        } catch (err) {
            const errorMsg = err.response?.data || err.message;
            console.error('Error saving reassignment:', errorMsg);
            alert(`Error saving reassignment: ${errorMsg}`);
        }
    };

    const handleCancelAttributeReassignment = (attributeId) => {
        setReassigningAttributeIds(prev => prev.filter(id => id !== attributeId));
        fetchAttributes();
    };

    /* END OF REASSIGNMENT LOGIC FIX */


    useEffect(() => {
        if (!selectedEmployeeId) {
            setLoading(false);
            return;
        }

        fetchGoals(); // fetch goals first
        fetchAttributes(); // fetch attributes independently

        const fetchEmployeeName = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) return;

                const response = await api.get(`/goals/${selectedEmployeeId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // ✅ JWT header
                    },
                });

                const emp = response.data;
                const fullName = `${emp.firstName} ${emp.lastName}`;
                setSelectedEmployeeName(fullName);
                sessionStorage.setItem('selectedEmployeeName', fullName);

                if (emp.department) {
                    setEmployeeDepartment(emp.department);
                }
                try {
                    const tplResponse = await api.get('/performance/templates', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    let allTemplates = tplResponse.data || [];
                    if (emp.department) {
                        allTemplates.sort((a, b) => {
                            const aMatches = a.department && a.department.toLowerCase() === emp.department.toLowerCase();
                            const bMatches = b.department && b.department.toLowerCase() === emp.department.toLowerCase();
                            if (aMatches && !bMatches) return -1;
                            if (!aMatches && bMatches) return 1;
                            return 0;
                        });
                    }
                    setTemplates(allTemplates);
                } catch (tplErr) {
                    console.error('Failed to fetch templates:', tplErr);
                }
            } catch (err) {
                console.error('Failed to fetch employee name and department:', err.response?.data || err.message);
                if (!selectedEmployeeName) {
                    setSelectedEmployeeName('Unknown Employee');
                }
            }
        };

        fetchEmployeeName();

    }, [selectedEmployeeId, fetchGoals, fetchAttributes, selectedEmployeeName]);

    const handleApplyTemplate = (tpl) => {
        if (!tpl || !tpl.goals || tpl.goals.length === 0) return;
        if (!selectedTimePeriod || selectedTimePeriod === 'All') {
            alert("Please select a specific evaluation period first before applying templates.");
            return;
        }
        const confirmLoad = window.confirm(`Are you sure you want to load the template "${tpl.templateName}"? This will populate the grid with its pre-configured goals.`);
        if (!confirmLoad) return;

        const targetPeriod = selectedTimePeriod;

        const templateGoals = tpl.goals.map((g, idx) => ({
            id: Date.now() + Math.random() + idx,
            goalTitle: g.goalTitle || '',
            goalDescription: g.goalDescription || '',
            metric: g.metric || '',
            target: g.target || '',
            timePeriod: targetPeriod,
            // Prefer structured templateAttributes; fall back to legacy comma string
            attributes: (tpl.templateAttributes && tpl.templateAttributes.length > 0)
                ? JSON.stringify(tpl.templateAttributes)
                : (tpl.attributes || '')
        }));

        setNewGoals(prev => [...templateGoals, ...prev]);
        setSelectedGoalIdsForSubmit(prev => [...prev, ...templateGoals.map(g => g.id)]);
        setActiveTab('In Progress');
    };

    const handleApplyAttributeTemplate = (tpl) => {
        if (!selectedTimePeriod || selectedTimePeriod === 'All') {
            alert("Please select a specific evaluation period first before applying templates.");
            return;
        }
        const hasStructured = tpl.templateAttributes && tpl.templateAttributes.length > 0;
        const hasLegacy = tpl.attributes && tpl.attributes.trim() !== '';

        if (!hasStructured && !hasLegacy) {
            alert("This template does not contain any attributes.");
            return;
        }

        const confirmLoad = window.confirm(`Are you sure you want to load the template "${tpl.templateName}"? This will add its pre-configured evaluation criteria to the attributes list.`);
        if (!confirmLoad) return;

        // Build the flat list for direct display
        let directList = [];
        if (hasStructured) {
            directList = tpl.templateAttributes.map((attr, idx) => ({
                id: `template_${Date.now()}_${idx}_${Math.random()}`,
                attributeTitle: attr.attributeTitle || '',
                attributeDescription: attr.attributeDescription || '',
                metric: attr.metric || ''
            }));
        } else {
            directList = tpl.attributes.split(',').map((part, idx) => ({
                id: `template_${Date.now()}_${idx}_${Math.random()}`,
                attributeTitle: part.trim(),
                attributeDescription: '-',
                metric: '-'
            })).filter(a => a.attributeTitle);
        }

        // Helper to merge attributes JSON/string
        const mergeAttributesStr = (existingStr, newTpl) => {
            let existingList = [];
            if (existingStr && existingStr.trim()) {
                if (existingStr.trim().startsWith('[')) {
                    try {
                        existingList = JSON.parse(existingStr);
                    } catch (e) {
                        existingList = existingStr.split(',').map(s => ({ attributeTitle: s.trim() }));
                    }
                } else {
                    existingList = existingStr.split(',').map(s => ({ attributeTitle: s.trim() }));
                }
            }
            
            let newList = [];
            if (newTpl.templateAttributes && newTpl.templateAttributes.length > 0) {
                newList = newTpl.templateAttributes.map(attr => ({
                    attributeTitle: attr.attributeTitle || '',
                    attributeDescription: attr.attributeDescription || '',
                    metric: attr.metric || ''
                }));
            } else if (newTpl.attributes && newTpl.attributes.trim() !== '') {
                newList = newTpl.attributes.split(',').map(part => ({
                    attributeTitle: part.trim(),
                    attributeDescription: '-',
                    metric: '-'
                })).filter(a => a.attributeTitle);
            }
            
            // Deduplicate by title
            const merged = [...existingList];
            newList.forEach(item => {
                const titleLower = item.attributeTitle?.toLowerCase().trim();
                if (!merged.some(m => (m.attributeTitle || m.title || '').toLowerCase().trim() === titleLower)) {
                    merged.push(item);
                }
            });
            
            return JSON.stringify(merged);
        };

        // Append to existing selected attributes (with deduplication)
        setSelectedAttributes(prev => {
            const merged = [...prev];
            directList.forEach(item => {
                const titleLower = item.attributeTitle?.toLowerCase().trim();
                if (!merged.some(m => m.attributeTitle?.toLowerCase().trim() === titleLower)) {
                    merged.push(item);
                }
            });
            return merged;
        });

        // Also stamp onto existing in-progress goals (so they carry attributes when submitted)
        setNewGoals(prev => prev.map(goal => {
            return matchesTimePeriod(goal.timePeriod) ? { ...goal, attributes: mergeAttributesStr(goal.attributes, tpl) } : goal;
        }));

        setGoals(prev => prev.map(goal => {
            const isEditable = ['draft', 'pending', 'in progress'].includes(goal.status?.toLowerCase());
            return (isEditable && matchesTimePeriod(goal.timePeriod)) ? { ...goal, attributes: mergeAttributesStr(goal.attributes, tpl) } : goal;
        }));

        setActiveTab('In Progress');
        setActiveSubTab('Attributes');
    };// Added selectedEmployeeName to dependency array to prevent infinite re-render if it's not being set above.

    const handleDeleteClick = async (goalId) => {
        const isConfirmed = window.confirm(
            'Are you sure you want to delete this goal?'
        );
        if (!isConfirmed) return;

        try {
            const token = sessionStorage.getItem("token");
            if (!token) {
                alert("No token found. Please log in.");
                return;
            }

            await api.delete(`/goals/delete/${goalId}`, {
                headers: {
                    Authorization: `Bearer ${token}`, // ✅ attach JWT
                },
            });

            setGoals((prev) => prev.filter((goal) => goal.goalId !== goalId));
            alert('Goal deleted successfully!');

        } catch (error) {
            const errorMsg = error.response?.data || error.message;
            console.error('Error deleting goal:', errorMsg);
            alert('Error deleting goal: ' + errorMsg);
        }
    };

    const handleDeleteAttribute = async (attr, index) => {
        // If it's a newly selected template attribute (not saved in DB, doesn't have attributeId)
        if (!attr.attributeId) {
            setSelectedAttributes(prev => prev.filter((_, idx) => idx !== index));
            return;
        }

        // Otherwise, it is an attribute saved in the DB
        const confirmDelete = window.confirm('Are you sure you want to delete this attribute?');
        if (!confirmDelete) return;

        try {
            const token = sessionStorage.getItem("token");
            if (!token) {
                alert("No token found. Please log in.");
                return;
            }
            await api.delete(`/attributes/delete/${attr.attributeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployeeAttributes(prev => prev.filter(a => a.attributeId !== attr.attributeId));
            alert('Attribute deleted successfully!');
        } catch (err) {
            console.error("Error deleting attribute:", err);
            alert("Failed to delete attribute.");
        }
    };

    const handleAddNewGoal = () => {
        if (!selectedTimePeriod || selectedTimePeriod === 'All') {
            alert("Please select a specific evaluation period first before assigning goals.");
            return;
        }
        // Adds the new goal to the beginning of the newGoals array
        const targetPeriod = selectedTimePeriod;

        const newId = Date.now();
        setNewGoals((prev) => [
            { id: newId, goalTitle: '', goalDescription: '', metric: '', target: '', timePeriod: targetPeriod },
            ...prev,
        ]);
        setSelectedGoalIdsForSubmit(prev => [...prev, newId]);

        setActiveTab('In Progress');

        // Since you are displaying goals in reverse order (.reverse()), the newly added 
        // goal (at index 0) will appear at the BOTTOM of the table.
        // We use setTimeout to ensure the DOM has updated and rendered the new row 
        // before attempting to scroll.
        setTimeout(() => {
            if (tableContainerRef.current) {
                // Scroll to the bottom of the container to view the newly added row
                tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
            }
        }, 0);

    };

    const handleNewGoalChange = (id, e) => {
        const { name, value } = e.target;
        setNewGoals(prev => prev.map((g) => {
            if (g.id !== id) return g;


            let newValue = value;
            if (name === 'metric') {
                newValue = newValue.replace(/\D/g, '').slice(0, 3);
            } else if (name === 'target') {
                newValue = newValue.slice(0, 25);
            } else if (name === 'goalTitle') {
                newValue = newValue.slice(0, 50);
            } else if (name === 'goalDescription') {
                newValue = newValue.slice(0, 150);
            }

            return { ...g, [name]: newValue };
        }));
    };

    const handleDeleteNewGoal = (id) => {
        setNewGoals((prev) => prev.filter((goal) => goal.id !== id));
    };

    const handleNewAttributeChange = (id, e) => {
        const { name, value } = e.target;
        setSelectedAttributes(prev => prev.map((a) => {
            if (a.id !== id) return a;

            let newValue = value;
            if (name === 'metric') {
                newValue = newValue.replace(/\D/g, '').slice(0, 3);
            } else if (name === 'attributeTitle') {
                newValue = newValue.slice(0, 100);
            } else if (name === 'attributeDescription') {
                newValue = newValue.slice(0, 250);
            }

            return { ...a, [name]: newValue };
        }));
    };

    const handleDbAttributeChange = (attributeId, e) => {
        const { name, value } = e.target;
        setEmployeeAttributes(prev => prev.map((a) => {
            if (a.attributeId !== attributeId) return a;

            let newValue = value;
            if (name === 'metric') {
                newValue = newValue.replace(/\D/g, '').slice(0, 3);
            } else if (name === 'attributeTitle') {
                newValue = newValue.slice(0, 100);
            } else if (name === 'attributeDescription') {
                newValue = newValue.slice(0, 250);
            }

            return { ...a, [name]: newValue };
        }));
    };

    const handleSaveDrafts = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("No token found. Please log in.");
            return;
        }

        let hasUpdates = false;

        // 1. Filter editable goals first
        const editableGoals = goals.filter(g =>
            ['draft', 'pending', 'in progress'].includes(g.status?.toLowerCase()) &&
            matchesTimePeriod(g.timePeriod)
        );

        // 2. Save NEW goals as 'draft'
        const newGoalsPayload = newGoals.map(goal => ({
            goalTitle: goal.goalTitle,
            goalDescription: goal.goalDescription,
            metric: goal.metric,
            target: goal.target,
            employeeId: selectedEmployeeId,
            reviewerId: reviewerId,
            status: 'draft',
            attributes: goal.attributes || '',
            timePeriod: goal.timePeriod || (selectedTimePeriod !== 'All' ? selectedTimePeriod : defaultPeriod),
        })).filter(g => g.goalTitle && g.goalDescription); // Simple validation

        if (newGoalsPayload.length > 0) {
            const invalidGoal = newGoalsPayload.find(g => !isValidTimePeriod(g.timePeriod));
            if (invalidGoal) {
                alert(`The time period "${invalidGoal.timePeriod || 'None'}" is not valid. Please select or configure a valid time period.`);
                return;
            }
            try {
                await api.post('/goals/assign-batch', newGoalsPayload, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error("Error saving new drafts:", err);
                alert("Error saving new drafts.");
            }
        }

        for (const goal of editableGoals) {
            try {
                const payload = { ...goal };
                await api.put(`/goals/reassign/${goal.goalId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error(`Error updating goal ${goal.goalId}:`, err);
            }
        }

        if (hasUpdates) {
            alert(activeSubTab === 'Attributes' ? "Attributes saved successfully." : "Goals saved successfully.");
            setNewGoals([]);
            setSelectedAttributes([]);
            fetchGoals();
        } else if (newGoalsPayload.length === 0 && editableGoals.length === 0) {
            alert(activeSubTab === 'Attributes' ? "No attributes to save." : "No goals to save.");
        }
    };

    const handleSubmitAll = async () => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("No token found. Please log in.");
            return;
        }

        if (selectedGoalIdsForSubmit.length === 0) {
            alert("Please select at least one goal to submit.");
            return;
        }

        const selectedIdsSet = new Set(selectedGoalIdsForSubmit.map(String));

        // Filter displayed goals to get only selected ones
        const selectedNewGoals = newGoals.filter(goal => 
            matchesTimePeriod(goal.timePeriod) && 
            selectedIdsSet.has(String(goal.id))
        );
        const selectedEditableGoals = goals.filter(goal => 
            ['draft', 'pending', 'in progress'].includes(goal.status?.toLowerCase()) && 
            matchesTimePeriod(goal.timePeriod) && 
            selectedIdsSet.has(String(goal.goalId))
        );

        // Check if any selected goal's time period already has submitted/approved/reviewed goals in the database
        const periodsToSubmit = new Set();
        selectedNewGoals.forEach(g => {
            if (g.timePeriod) periodsToSubmit.add(g.timePeriod);
        });
        selectedEditableGoals.forEach(g => {
            if (g.timePeriod) periodsToSubmit.add(g.timePeriod);
        });

        for (const period of periodsToSubmit) {
            const alreadySubmitted = goals.some(g => 
                g.timePeriod === period && 
                !selectedIdsSet.has(String(g.goalId)) && 
                ['pending', 'approved', 'reviewed', 'completed', 'submitted', 'in progress'].includes(g.status?.toLowerCase())
            );
            if (alreadySubmitted) {
                alert(`Goals for the time period "${period}" have already been submitted. You cannot submit goals for the same time period again.`);
                return;
            }
        }

        // Validation check for selected new goals
        const validNewGoals = selectedNewGoals.filter(goal =>
            goal.goalTitle?.trim() &&
            goal.goalDescription?.trim() &&
            goal.metric?.trim() &&
            goal.target?.trim()
        );

        if (selectedNewGoals.length > 0 && validNewGoals.length !== selectedNewGoals.length) {
            alert("Please fill out all fields for the selected new goals before submitting.");
            return;
        }

        // Validate selected existing goals
        const invalidGoals = selectedEditableGoals.filter(g => !g.goalTitle?.trim() || !g.goalDescription?.trim());
        if (invalidGoals.length > 0) {
            alert("Please fill out all fields for the selected goals before submitting.");
            return;
        }

        const allActiveWeightages = [
            ...validNewGoals.map(g => parseFloat(g.metric) || 0),
            ...selectedEditableGoals.map(g => parseFloat(g.metric) || 0)
        ];

        const totalWeightageSum = allActiveWeightages.reduce((sum, val) => sum + val, 0);

        if (totalWeightageSum !== 100) {
            const newDetails = validNewGoals.map(g => `New ("${g.goalTitle || 'No Title'}"): ${g.metric}%`).join('\n');
            const editDetails = selectedEditableGoals.map(g => `Editable ("${g.goalTitle || 'No Title'}"): ${g.metric}%`).join('\n');
            
            alert(`The total sum of goal weightages for the selected goals must be exactly 100%. Currently, the total sum is ${totalWeightageSum}%.\n\nBreakdown:\n${newDetails || 'None'}\n${editDetails || 'None'}`);
            return;
        }

        let hasUpdates = false;

        // 1. Submit selected NEW goals as 'pending'
        const batchPayload = validNewGoals.map(goal => ({
            goalTitle: goal.goalTitle,
            goalDescription: goal.goalDescription,
            metric: goal.metric,
            target: goal.target,
            employeeId: selectedEmployeeId,
            reviewerId: reviewerId,
            status: 'pending',
            attributes: goal.attributes || '',
            timePeriod: goal.timePeriod || (selectedTimePeriod !== 'All' ? selectedTimePeriod : defaultPeriod),
        }));

        if (batchPayload.length > 0) {
            const invalidGoal = batchPayload.find(g => !isValidTimePeriod(g.timePeriod));
            if (invalidGoal) {
                alert(`The time period "${invalidGoal.timePeriod || 'None'}" is not valid. Please select or configure a valid time period.`);
                return;
            }
            try {
                await api.post('/goals/assign-batch', batchPayload, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error('Error submitting new goals:', err);
                alert(`Error submitting new goals: ${err.message}`);
                return;
            }
        }

        // 2. Submit selected existing goals
        for (const goal of selectedEditableGoals) {
            try {
                const status = goal.status?.toLowerCase() === 'draft' ? 'pending' : goal.status;
                const payload = { ...goal, status };
                await api.put(`/goals/reassign/${goal.goalId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error(`Error submitting goal ${goal.goalId}:`, err);
            }
        }

        if (hasUpdates) {
            alert("Selected goals submitted successfully.");
            
            // Remove submitted new goals from newGoals list
            const submittedNewIds = validNewGoals.map(g => g.id);
            setNewGoals(prev => prev.filter(g => !submittedNewIds.includes(g.id)));

            setSelectedGoalIdsForSubmit([]);
            fetchGoals();
        } else {
            alert("No goals were updated/submitted.");
        }
    };

    // ---- ATTRIBUTE-SPECIFIC Save/Submit handlers ----

    const handleSaveAttributeDrafts = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("No token found. Please log in.");
            return;
        }

        let hasUpdates = false;

        // Save new attributes from template selection
        const newAttrsPayload = selectedAttributes.map(attr => ({
            attributeTitle: attr.attributeTitle,
            attributeDescription: attr.attributeDescription,
            metric: attr.metric,
            target: attr.target || '',
            employeeId: selectedEmployeeId,
            assignedBy: sessionStorage.getItem("employeeId"),
            status: 'draft',
            timePeriod: selectedTimePeriod !== 'All' ? selectedTimePeriod : defaultPeriod,
        })).filter(a => a.attributeTitle);

        if (newAttrsPayload.length > 0) {
            const invalidAttr = newAttrsPayload.find(a => !isValidTimePeriod(a.timePeriod));
            if (invalidAttr) {
                alert(`The time period "${invalidAttr.timePeriod || 'None'}" is not valid. Please select or configure a valid time period.`);
                return;
            }
            try {
                await api.post('/attributes/assign-batch', newAttrsPayload, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error("Error saving attribute drafts:", err);
                alert("Error saving attribute drafts.");
            }
        }

        // Update existing editable attributes
        const editableAttrs = employeeAttributes.filter(a =>
            ['draft', 'pending', 'in progress'].includes(a.status?.toLowerCase()) &&
            matchesTimePeriod(a.timePeriod)
        );

        for (const attr of editableAttrs) {
            try {
                await api.put(`/attributes/reassign/${attr.attributeId}`, attr, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error(`Error updating attribute ${attr.attributeId}:`, err);
            }
        }

        if (hasUpdates) {
            alert("Attributes saved successfully.");
            setSelectedAttributes([]);
            fetchAttributes();
        } else if (newAttrsPayload.length === 0 && editableAttrs.length === 0) {
            alert("No attributes to save.");
        }
    };

    const handleSubmitAttributes = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("No token found. Please log in.");
            return;
        }

        if (selectedAttributeIdsForSubmit.length === 0) {
            alert("Please select at least one attribute to submit.");
            return;
        }

        let hasUpdates = false;

        // Filter displayed attributes to get only selected ones
        const displayedAttrs = [
            ...selectedAttributes,
            ...employeeAttributes.filter(a => {
                const s = (a.status || '').toLowerCase();
                return ['pending', 'in progress', 'draft'].includes(s) && matchesTimePeriod(a.timePeriod);
            })
        ];

        const selectedAttrs = displayedAttrs.filter(attr => 
            selectedAttributeIdsForSubmit.includes(attr.attributeId || attr.id)
        );

        // Separate template attributes (they have client-side id) and existing attributes (they have attributeId)
        const selectedNewAttrs = selectedAttrs.filter(attr => !attr.attributeId);
        const selectedEditableAttrs = selectedAttrs.filter(attr => attr.attributeId);

        const selectedAttrIdsSet = new Set(selectedAttributeIdsForSubmit.map(String));

        // Check if any selected attribute's time period already has submitted/approved/reviewed attributes in the database
        const periodsToSubmit = new Set();
        selectedNewAttrs.forEach(a => {
            const period = selectedTimePeriod !== 'All' ? selectedTimePeriod : defaultPeriod;
            if (period) periodsToSubmit.add(period);
        });
        selectedEditableAttrs.forEach(a => {
            if (a.timePeriod) periodsToSubmit.add(a.timePeriod);
        });

        for (const period of periodsToSubmit) {
            const alreadySubmitted = employeeAttributes.some(a => 
                a.timePeriod === period && 
                !selectedAttrIdsSet.has(String(a.attributeId)) && 
                ['pending', 'approved', 'reviewed', 'completed', 'submitted', 'in progress'].includes(a.status?.toLowerCase())
            );
            if (alreadySubmitted) {
                alert(`Attributes for the time period "${period}" have already been submitted. You cannot submit attributes for the same time period again.`);
                return;
            }
        }

        // Submit selected template attributes as pending
        const newAttrsPayload = selectedNewAttrs.map(attr => ({
            attributeTitle: attr.attributeTitle,
            attributeDescription: attr.attributeDescription,
            metric: attr.metric,
            target: attr.target || '',
            employeeId: selectedEmployeeId,
            assignedBy: sessionStorage.getItem("employeeId"),
            status: 'pending',
            timePeriod: selectedTimePeriod !== 'All' ? selectedTimePeriod : defaultPeriod,
        })).filter(a => a.attributeTitle);

        if (newAttrsPayload.length > 0) {
            const invalidAttr = newAttrsPayload.find(a => !isValidTimePeriod(a.timePeriod));
            if (invalidAttr) {
                alert(`The time period "${invalidAttr.timePeriod || 'None'}" is not valid. Please select or configure a valid time period.`);
                return;
            }
            try {
                await api.post('/attributes/assign-batch', newAttrsPayload, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error("Error submitting new attributes:", err);
                alert(`Error submitting new attributes: ${err.message}`);
                return;
            }
        }

        // Submit selected existing draft attributes as pending
        for (const attr of selectedEditableAttrs) {
            try {
                const status = attr.status?.toLowerCase() === 'draft' ? 'pending' : attr.status;
                const payload = { ...attr, status };
                await api.put(`/attributes/reassign/${attr.attributeId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                hasUpdates = true;
            } catch (err) {
                console.error(`Error submitting attribute ${attr.attributeId}:`, err);
            }
        }

        if (hasUpdates) {
            alert("Selected attributes submitted successfully.");
            
            // Remove submitted template attributes from selectedAttributes state
            const submittedTemplateIds = selectedNewAttrs.map(a => a.id);
            setSelectedAttributes(prev => prev.filter(a => !submittedTemplateIds.includes(a.id)));

            setSelectedAttributeIdsForSubmit([]);
            fetchAttributes();
        } else {
            alert("No attributes were updated/submitted.");
        }
    };



    const handleCellClick = (id, fieldName) => setEditingCell({ id, fieldName });
    const handleCellBlur = () => setEditingCell(null);

    // This is now used for both new goals and reassigning goals
    // Helper: focus the DOM input/textarea for a given goal id and field
    const focusCellDOM = (goalId, fieldName) => {
        if (!goalId || !fieldName) return;
        // We set data-cell on the wrapper div for non-edit mode and on the input/textarea when editing
        const selector = `[data-cell="${goalId}_${fieldName}"]`;
        // Try to find a real input or textarea inside that cell
        const cellWrapper = document.querySelector(selector);
        if (!cellWrapper) return;
        // priority: find input or textarea or select
        const input = cellWrapper.querySelector('input, textarea, select');
        if (input) {
            try {
                input.focus();
                // place caret at end
                const len = input.value?.length ?? 0;
                if (typeof input.setSelectionRange === 'function') {
                    input.setSelectionRange(len, len);
                }
            } catch (err) {
                // ignore
            }
        } else {
            // fallback: focus wrapper (useful if you want clickable div)
            try { cellWrapper.focus?.(); } catch (e) { }
        }
    };


    // --- Editable Cell Rendering Function (uses data-cell attr) ---
    const renderEditableCell = (goal, fieldName, rowIndex = 0, displayedGoals = []) => {
        const id = goal?.id || goal?.goalId;
        const goalIdKey = id; // unique key used in data-cell
        const isEditing = editingCell?.id === id && editingCell?.fieldName === fieldName;

        const isNewOrReassigning = !!goal?.id || reassigningGoalIds.includes(goal?.goalId) || goal.status?.toLowerCase() === 'draft';
        const fieldOrder = ['goalTitle', 'goalDescription', 'metric', 'target', 'action'];

        const getNextCell = (rowIndex, fieldName, displayedGoals) => {
            const fieldOrder = ['goalTitle', 'goalDescription', 'metric', 'target']; // editable fields only
            const totalRows = displayedGoals.length;

            const currentIndex = fieldOrder.indexOf(fieldName);

            // Forward in the same row
            if (currentIndex < fieldOrder.length - 1) {
                return { goalId: displayedGoals[rowIndex].id || displayedGoals[rowIndex].goalId, field: fieldOrder[currentIndex + 1] };
            }

            // Last editable column -> move to first editable cell of next row
            let nextRow = rowIndex + 1;
            while (nextRow < totalRows) {
                const goal = displayedGoals[nextRow];
                if (goal && (goal.id || reassigningGoalIds.includes(goal.goalId) || goal.status?.toLowerCase() === 'draft')) {
                    return { goalId: goal.id || goal.goalId, field: fieldOrder[0] };
                }
                nextRow++;
            }

            // No more rows
            return null;
        };

        const getPrevCell = (rowIndex, fieldName, displayedGoals) => {
            const fieldOrder = ['goalTitle', 'goalDescription', 'metric', 'target'];
            const currentIndex = fieldOrder.indexOf(fieldName);

            // Backward in the same row
            if (currentIndex > 0) {
                return { goalId: displayedGoals[rowIndex].id || displayedGoals[rowIndex].goalId, field: fieldOrder[currentIndex - 1] };
            }

            // First column -> move to last editable cell of previous visible row (visually up)
            // Since displayedGoals is reversed, "previous row" index is rowIndex - 1 (if we consider top-to-bottom traversal)
            let prevRow = rowIndex - 1;
            while (prevRow >= 0) {
                const goal = displayedGoals[prevRow];
                if (goal && (goal.id || reassigningGoalIds.includes(goal.goalId) || goal.status?.toLowerCase() === 'draft')) {
                    return { goalId: goal.id || goal.goalId, field: fieldOrder[fieldOrder.length - 1] };
                }
                prevRow--;
            }

            // No more rows
            return null;
        };

        // Tab handler: uses document focus after handleCellClick
        const handleTabPress = (e) => {
            if (e.key !== 'Tab') return;
            e.preventDefault();

            const next = e.shiftKey
                ? getPrevCell(rowIndex, fieldName, displayedGoals)
                : getNextCell(rowIndex, fieldName, displayedGoals);

            if (next) {
                handleCellBlur();
                handleCellClick(next.goalId, next.field);
                setTimeout(() => focusCellDOM(next.goalId, next.field), 70);
            } else {
                // Boundary logic
                e.preventDefault();
                // Optionally, keep the focus on current cell
                setTimeout(() => focusCellDOM(goalIdKey, fieldName), 50);
                return;
            }
        };


        // Non-editable: render read-only wrapper with data-cell so we can still focus if needed
        if (!isNewOrReassigning) {
            return (
                <div
                    data-cell={`${goalIdKey}_${fieldName}`}
                    tabIndex={-1}
                    style={{
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    <div style={{ flex: 1, wordBreak: 'break-word' }}>
                        {fieldName === 'metric' && goal?.[fieldName] ? `${goal[fieldName]}%` : (goal?.[fieldName] || '-')}
                    </div>
                </div>
            );
        }

        // Editable: render input/textarea with data-cell on wrapper and on the input itself when editing
        // Editable: render input/textarea with data-cell on wrapper and on the input itself when editing
        const value = goal?.[fieldName] ?? '';

        if (fieldName === 'metric') {
            if (isEditing) {
                return (
                    <div data-cell={`${goalIdKey}_${fieldName}`} style={{ height: '100%', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px 4px 4px', backgroundColor: '#f4f6f8', gap: '4px' }}>
                        <input
                            data-cell={`${goalIdKey}_${fieldName}`}
                            type="text"
                            name={fieldName}
                            value={value}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (/^\d{1,3}$/.test(val) && parseInt(val) <= 100)) {
                                    if (reassigningGoalIds.includes(goal?.goalId) || goal.status?.toLowerCase() === 'draft') {
                                        handleReassignGoalChange(goal.goalId, e);
                                    } else {
                                        handleNewGoalChange(goal.id, e);
                                    }
                                }
                            }}
                            onKeyDown={handleTabPress}
                            placeholder="e.g. 20"
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '42px',
                                padding: '8px 10px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                outline: 'none',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                color: '#1e293b',
                                fontSize: '14px',
                                fontWeight: '500',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#14b8a6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)';
                                handleCellClick(id, fieldName);
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#cbd5e1';
                                e.target.style.boxShadow = 'none';
                                handleCellBlur();
                            }}
                            required
                            autoFocus
                        />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>%</span>
                    </div>
                );
            } else {
                return (
                    <div
                        data-cell={`${goalIdKey}_${fieldName}`}
                        onClick={(e) => {
                            if (!isNewOrReassigning) return;
                            handleCellClick(id, fieldName);
                            setTimeout(() => {
                                const input = document.querySelector(`[data-cell="${id}_${fieldName}"] input`);
                                if (input) {
                                    input.focus();
                                }
                            }, 50);
                        }}
                        style={{
                            padding: '8px',
                            cursor: isNewOrReassigning ? 'text' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            minHeight: '60px',
                            backgroundColor: '#f4f6f8',
                        }}
                    >
                        <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: '500', color: value ? '#1e293b' : '#64748b' }}>
                            {value ? `${value}%` : 'e.g. 20%'}
                        </div>
                    </div>
                );
            }
        }

        const commonInputStyle = {
            width: '100%',
            height: '100%',
            resize: 'none',
            border: 'none',
            padding: '8px',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            outline: 'none',
            backgroundColor: '#f4f6f8',
            boxShadow: 'none',
            border: 'none'
        };

        const handleChange = (e) => {
            if (reassigningGoalIds.includes(goal?.goalId) || goal.status?.toLowerCase() === 'draft') handleReassignGoalChange(goal.goalId, e);
            else handleNewGoalChange(goal.id, e);
        };

        if (isEditing) {
            const goalIdKey = goal?.id || goal?.goalId;

            const maxLength =
                fieldName === 'target' ? 25 :
                    fieldName === 'goalTitle' ? 50 :
                        fieldName === 'goalDescription' ? 150 : 250;

            const handleDynamicChange = (e) => {
                const { value } = e.target;

                // Resize textarea height automatically
                e.target.style.height = 'auto'; // Reset height
                e.target.style.height = `${e.target.scrollHeight}px`; // Set to new height

                // Call original change handler
                if (reassigningGoalIds.includes(goal?.goalId) || goal.status?.toLowerCase() === 'draft') {
                    handleReassignGoalChange(goal.goalId, e);
                } else {
                    handleNewGoalChange(goal.id, e);
                }
            };

            return (
                <div data-cell={`${goalIdKey}_${fieldName}`} style={{ height: '100%', minHeight: '60px', display: 'flex', flexDirection: 'column' }}>
                    <textarea
                        data-cell={`${goalIdKey}_${fieldName}`}
                        name={fieldName}
                        value={value}
                        onChange={handleDynamicChange}
                        onBlur={handleCellBlur}
                        onKeyDown={handleTabPress}
                        maxLength={maxLength}
                        style={{
                            ...commonInputStyle,
                            flex: 1,
                            minHeight: '60px',
                            overflow: 'hidden',
                            resize: 'none',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: '#f4f6f8'
                        }}
                        ref={(el) => {
                            if (el) {
                                const minHeight = 60;
                                el.style.height = 'auto';
                                const newHeight = Math.max(el.scrollHeight, minHeight);
                                el.style.height = `${newHeight}px`;
                                // do NOT set caret here
                            }
                        }}

                    />

                </div>
            );
        }


        // non-editing but editable row: clickable wrapper (will call handleCellClick to enter edit mode)
        return (
            <div
                data-cell={`${goalIdKey}_${fieldName}`}
                onClick={(e) => {
                    if (!isNewOrReassigning) return;

                    const clickedIndex = getCaretIndexFromClick(e, e.currentTarget);

                    handleCellClick(id, fieldName);

                    // Save caret offset temporarily
                    setTimeout(() => {
                        const input = document.querySelector(`[data-cell="${id}_${fieldName}"] textarea`);
                        if (input) {
                            input.focus();
                            input.setSelectionRange(clickedIndex, clickedIndex);
                        }
                        const selectEl = document.querySelector(`[data-cell="${id}_${fieldName}"] select`);
                        if (selectEl) {
                            selectEl.focus();
                        }
                    }, 50);
                }}

                style={{
                    padding: '8px',
                    cursor: isNewOrReassigning ? 'text' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: '60px',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f4f6f8',
                }}
            >
                <div style={{ flex: 1, wordBreak: 'break-word' }}>
                    {value || ''}

                </div>
            </div>
        );
    };

    const renderEditableAttributeCell = (attr, fieldName, rowIndex = 0, displayedAttrs = []) => {
        const id = attr?.attributeId || attr?.id;
        const attrIdKey = id;
        const isEditing = editingCell?.id === id && editingCell?.fieldName === fieldName;

        const isEditable = !attr?.attributeId || attr.status?.toLowerCase() === 'draft' || reassigningAttributeIds.includes(attr?.attributeId);

        const getNextAttrCell = (rowIndex, fieldName, displayedAttrs) => {
            const fieldOrder = ['attributeTitle', 'attributeDescription', 'metric'];
            const totalRows = displayedAttrs.length;
            const currentIndex = fieldOrder.indexOf(fieldName);

            if (currentIndex < fieldOrder.length - 1) {
                return { id: displayedAttrs[rowIndex].attributeId || displayedAttrs[rowIndex].id, field: fieldOrder[currentIndex + 1] };
            }

            let nextRow = rowIndex + 1;
            while (nextRow < totalRows) {
                const nextAttr = displayedAttrs[nextRow];
                if (nextAttr && (!nextAttr.attributeId || nextAttr.status?.toLowerCase() === 'draft' || reassigningAttributeIds.includes(nextAttr.attributeId))) {
                    return { id: nextAttr.attributeId || nextAttr.id, field: fieldOrder[0] };
                }
                nextRow++;
            }
            return null;
        };

        const getPrevAttrCell = (rowIndex, fieldName, displayedAttrs) => {
            const fieldOrder = ['attributeTitle', 'attributeDescription', 'metric'];
            const currentIndex = fieldOrder.indexOf(fieldName);

            if (currentIndex > 0) {
                return { id: displayedAttrs[rowIndex].attributeId || displayedAttrs[rowIndex].id, field: fieldOrder[currentIndex - 1] };
            }

            let prevRow = rowIndex - 1;
            while (prevRow >= 0) {
                const prevAttr = displayedAttrs[prevRow];
                if (prevAttr && (!prevAttr.attributeId || prevAttr.status?.toLowerCase() === 'draft' || reassigningAttributeIds.includes(prevAttr.attributeId))) {
                    return { id: prevAttr.attributeId || prevAttr.id, field: fieldOrder[fieldOrder.length - 1] };
                }
                prevRow--;
            }
            return null;
        };

        const handleTabPress = (e) => {
            if (e.key !== 'Tab') return;
            e.preventDefault();

            const next = e.shiftKey
                ? getPrevAttrCell(rowIndex, fieldName, displayedAttrs)
                : getNextAttrCell(rowIndex, fieldName, displayedAttrs);

            if (next) {
                handleCellBlur();
                handleCellClick(next.id, next.field);
                setTimeout(() => focusCellDOM(next.id, next.field), 70);
            } else {
                e.preventDefault();
                setTimeout(() => focusCellDOM(attrIdKey, fieldName), 50);
            }
        };

        // Non-editable: render read-only
        if (!isEditable) {
            return (
                <div
                    data-cell={`${attrIdKey}_${fieldName}`}
                    tabIndex={-1}
                    style={{
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    <div style={{ flex: 1, wordBreak: 'break-word' }}>
                        {attr?.[fieldName] || '-'}
                    </div>
                </div>
            );
        }

        const value = attr?.[fieldName] ?? '';
        const commonInputStyle = {
            width: '100%',
            height: '100%',
            resize: 'none',
            border: 'none',
            padding: '8px',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            outline: 'none',
            backgroundColor: '#f4f6f8',
            boxShadow: 'none',
        };

        if (isEditing) {
            const maxLength =
                fieldName === 'metric' ? 3 :
                fieldName === 'attributeTitle' ? 100 : 250;

            const handleDynamicChange = (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;

                if (attr.attributeId) {
                    handleDbAttributeChange(attr.attributeId, e);
                } else {
                    handleNewAttributeChange(attr.id, e);
                }
            };

            return (
                <div data-cell={`${attrIdKey}_${fieldName}`} style={{ height: '100%', minHeight: '60px', display: 'flex', flexDirection: 'column' }}>
                    <textarea
                        data-cell={`${attrIdKey}_${fieldName}`}
                        name={fieldName}
                        value={value}
                        onChange={handleDynamicChange}
                        onBlur={handleCellBlur}
                        onKeyDown={handleTabPress}
                        maxLength={maxLength}
                        style={{
                            ...commonInputStyle,
                            flex: 1,
                            minHeight: '40px',
                            overflow: 'hidden',
                            resize: 'none',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: '#f4f6f8'
                        }}
                        ref={(el) => {
                            if (el) {
                                const minHeight = 40;
                                el.style.height = 'auto';
                                const newHeight = Math.max(el.scrollHeight, minHeight);
                                el.style.height = `${newHeight}px`;
                            }
                        }}
                    />
                </div>
            );
        }

        return (
            <div
                data-cell={`${attrIdKey}_${fieldName}`}
                onClick={(e) => {
                    if (!isEditable) return;
                    const clickedIndex = getCaretIndexFromClick(e, e.currentTarget);
                    handleCellClick(id, fieldName);

                    setTimeout(() => {
                        const input = document.querySelector(`[data-cell="${id}_${fieldName}"] textarea`);
                        if (input) {
                            input.focus();
                            input.setSelectionRange(clickedIndex, clickedIndex);
                        }
                    }, 50);
                }}
                style={{
                    padding: '8px',
                    cursor: 'text',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: '60px',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f4f6f8',
                }}
            >
                <div style={{ flex: 1, wordBreak: 'break-word' }}>
                    {value || ''}
                </div>
            </div>
        );
    };



    const getGoalsForTab = () => {
        let allGoals = goals;
        allGoals = allGoals.filter(g => matchesTimePeriod(g.timePeriod));
        switch (activeTab) {
            case 'In Review':
                return allGoals.filter((g) => ['submitted', 'rejected by reviewer'].includes(g.status?.toLowerCase()));
            case 'In Progress':
                return allGoals.filter((g) => ['pending', 'in progress', 'draft'].includes(g.status?.toLowerCase()));
            case 'Rejected':
                return allGoals.filter((g) =>
                    g.status?.toLowerCase() === 'rejected' || reassigningGoalIds.includes(g.goalId)
                );
            default:
                return [];
        }
    };



    // Attributes are now fetched independently from /api/attributes
    const getAttributesForTab = () => {
        const tabStatusMap = {
            'In Progress': ['pending', 'in progress', 'draft'],
            'In Review': ['submitted', 'rejected by reviewer'],
            'Rejected': ['rejected'],
        };
        const allowedStatuses = tabStatusMap[activeTab] || [];
        return employeeAttributes.filter(attr => {
            const s = (attr.status || '').toLowerCase();
            const matchesStatus = allowedStatuses.includes(s) || (activeTab === 'Rejected' && reassigningAttributeIds.includes(attr.attributeId));
            if (!matchesStatus) return false;
            return matchesTimePeriod(attr.timePeriod);
        });
    };

    const extractAttributesFromGoals = () => {
        return getAttributesForTab().map(attr => ({
            attributeId: attr.attributeId,
            attributeTitle: attr.attributeTitle || '',
            attributeDescription: attr.attributeDescription || '',
            metric: attr.metric || '',
            status: attr.status || '',
            target: attr.target || '',
            rejectionReason: attr.rejectionReason || attr.rejection_reason || '',
        }));
    };

    const renderAttributesTable = (extractedAttrs) => {
        const thStyle = {
            textAlign: 'left',
            padding: '12px 16px',
            background: '#629AF1',
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
            border: 'none',
        };
        const tdStyle = {
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
            textAlign: 'left',
            verticalAlign: 'middle',
            backgroundColor: "transparent",
        };

        const isRejectedTab = activeTab === 'Rejected';
        const isInProgressTab = activeTab === 'In Progress';
        const showAction = isInProgressTab || isRejectedTab;

        const editableTdStyle = {
            ...tdStyle,
            padding: '0',
            verticalAlign: 'middle',
            height: '100%',
        };

        return (
            <div
                style={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    maxHeight: 'calc(100vh - 300px)',
                    marginTop: '0px',
                    marginLeft: '-15px',
                }}
            >
                <table
                    style={{
                        tableLayout: 'auto',
                        width: '100%',
                        minWidth: '700px',
                        borderCollapse: 'collapse',
                        background: 'transparent',
                        marginTop: '0px',
                    }}
                >
                    <thead>
                        <tr>
                            {isInProgressTab && (
                                <th style={{ ...thStyle, width: '40px', borderTopLeftRadius: '8px', textAlign: 'center', padding: '12px 16px' }}>
                                    <input
                                        type="checkbox"
                                        checked={extractedAttrs.length > 0 && extractedAttrs.every(attr => selectedAttributeIdsForSubmit.includes(attr.attributeId || attr.id))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedAttributeIdsForSubmit(extractedAttrs.map(attr => attr.attributeId || attr.id));
                                            } else {
                                                setSelectedAttributeIdsForSubmit([]);
                                            }
                                        }}
                                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                    />
                                </th>
                            )}
                            <th style={{ ...thStyle, width: isInProgressTab ? '250px' : isRejectedTab ? '200px' : '30%', borderTopLeftRadius: isInProgressTab ? '0px' : '8px' }}>Attribute Title</th>
                            <th style={{ ...thStyle, width: isInProgressTab ? '400px' : isRejectedTab ? '300px' : '45%' }}>Description</th>
                            {isRejectedTab && (
                                <th style={{ ...thStyle, width: '200px', textAlign: 'left', padding: '12px 16px' }}>Rejection Reason</th>
                            )}
                            {showAction ? (
                                <th style={{ ...thStyle, width: isInProgressTab ? '80px' : isRejectedTab ? '150px' : '15%', borderTopRightRadius: '8px', borderRight: 'none', textAlign: 'center' }}>Action</th>
                            ) : (
                                <th style={{ ...thStyle, width: '15%', borderTopRightRadius: '8px', borderRight: 'none' }}>Status</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {extractedAttrs.length > 0 ? (
                            extractedAttrs.map((attr, idx) => {
                                const isEditable = !attr.attributeId || attr.status?.toLowerCase() === 'draft' || reassigningAttributeIds.includes(attr.attributeId);
                                return (
                                    <tr key={attr.attributeId || attr.id || idx} style={{ borderBottom: 'none' }}>
                                        {isInProgressTab && (
                                            <td style={{
                                                ...tdStyle,
                                                textAlign: 'center',
                                                verticalAlign: 'middle',
                                                padding: '12px 8px',
                                                width: '40px'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAttributeIdsForSubmit.includes(attr.attributeId || attr.id)}
                                                    onChange={(e) => {
                                                        const key = attr.attributeId || attr.id;
                                                        if (e.target.checked) {
                                                            setSelectedAttributeIdsForSubmit(prev => [...prev, key]);
                                                        } else {
                                                            setSelectedAttributeIdsForSubmit(prev => prev.filter(id => id !== key));
                                                        }
                                                    }}
                                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                />
                                            </td>
                                        )}
                                        <td style={isEditable ? editableTdStyle : tdStyle}>
                                            {renderEditableAttributeCell(attr, 'attributeTitle', idx, extractedAttrs)}
                                        </td>
                                        <td style={isEditable ? editableTdStyle : tdStyle}>
                                            {renderEditableAttributeCell(attr, 'attributeDescription', idx, extractedAttrs)}
                                        </td>
                                        {isRejectedTab && (
                                            <td style={{ ...tdStyle, padding: '12px 16px', wordBreak: 'break-word', minWidth: '200px' }}>
                                                {attr.rejectionReason || 'N/A'}
                                            </td>
                                        )}
                                    {showAction ? (
                                        <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center', minWidth: '150px' }}>
                                            {isRejectedTab ? (
                                                reassigningAttributeIds.includes(attr.attributeId) ? (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                        <button
                                                            onClick={() => handleSaveAttributeReassignment(attr)}
                                                            style={{
                                                                backgroundColor: '#1b8fb9ff',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '5px 7px',
                                                                borderRadius: '5px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                            }}
                                                        >
                                                            Submit
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelAttributeReassignment(attr.attributeId)}
                                                            style={{
                                                                backgroundColor: 'red',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '5px 7px',
                                                                borderRadius: '5px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleReassignAttributeClick(attr)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: '0 2px 4px rgba(20, 184, 166, 0.2)'
                                                            }}
                                                        >
                                                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192Zm3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                                                            </svg>
                                                            Reassign
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAttribute(attr, idx)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: '0 2px 4px rgba(244, 63, 94, 0.2)'
                                                            }}
                                                        >
                                                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                (!attr.attributeId || attr.status?.toLowerCase() === 'draft') ? (
                                                    <button
                                                        onClick={() => handleDeleteAttribute(attr, idx)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '22px',
                                                            transition: 'transform 0.2s',
                                                            outline: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            margin: 'auto'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        &times;
                                                    </button>
                                                ) : '-'
                                            )}
                                        </td>
                                    ) : (
                                        <td style={{ ...tdStyle, borderRight: 'none' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: attr.status?.toLowerCase() === 'pending' ? '#fef3c7'
                                                    : attr.status?.toLowerCase() === 'draft' ? '#e0e7ff'
                                                        : '#d1fae5',
                                                color: attr.status?.toLowerCase() === 'pending' ? '#92400e'
                                                    : attr.status?.toLowerCase() === 'draft' ? '#3730a3'
                                                        : '#065f46',
                                            }}>
                                                {attr.status || 'N/A'}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                        ) : (
                            <tr>
                                <td colSpan={isInProgressTab ? 4 : isRejectedTab ? 4 : 3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    No attributes assigned yet. Select an attribute template below to load attributes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderGoalsTable = (filteredGoals) => {
        const thStyle = {
            textAlign: 'left',
            padding: '6px 16px',
            background: '#629AF1',
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',

            border: 'none',
        };
        const tdStyle = {
            padding: '0',
            borderBottom: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
            textAlign: 'left',
            verticalAlign: 'top',
            backgroundColor: "transparent",
            height: '100%',
        };
        const lastThStyle = { ...thStyle, borderRight: 'none' };
        const lastTdStyle = { ...tdStyle, borderRight: 'none' };
        const isRejectedTab = activeTab === 'Rejected';
        const isSubmittedTab = activeTab === 'In Review';

        const isInProgressTab = activeTab === 'In Progress';

        const filteredNewGoals = newGoals.filter(g => matchesTimePeriod(g.timePeriod));

        // Goals to display: New goals at the top of 'In Progress' OR filtered goals for other tabs
        const goalsToDisplay = isInProgressTab ? [...filteredNewGoals, ...filteredGoals] : filteredGoals;



        const targetPeriod = (selectedTimePeriod && selectedTimePeriod !== 'All') ? selectedTimePeriod : '';

        const selectedIdsSet = new Set(selectedGoalIdsForSubmit.map(String));
        const totalWeightage = goalsToDisplay
            .filter(g => selectedIdsSet.has(String(g.id || g.goalId)))
            .reduce((s, g) => s + (parseFloat(g.metric) || 0), 0);
        const isWeightageCorrect = totalWeightage === 100;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginLeft: '-15px', marginBottom: '1rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    marginBottom: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Total weightage of selected goals {targetPeriod ? `(${targetPeriod})` : ''}
                    </span>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '700',
                        fontFamily: "'Inter', sans-serif",
                        backgroundColor: isWeightageCorrect ? '#e6f4ea' : '#fce8e6',
                        color: isWeightageCorrect ? '#137333' : '#c5221f',
                        minWidth: '70px',
                        textAlign: 'center',
                    }}>
                        {totalWeightage} / 100
                    </div>
                </div>
                <div
                    ref={tableContainerRef}
                    style={{
                        overflowX: 'auto',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        maxHeight: 'calc(100vh - 300px)',
                        marginTop: '0px',
                    }}
                >
                <table
                    style={{
                        // 1. IMPORTANT: Set tableLayout to 'fixed' to enforce custom column widths
                        tableLayout: 'fixed',
                        width: '100%',
                        // 2. IMPORTANT: Set a minimum pixel width greater than a mobile screen (e.g., 850px)
                        minWidth: '850px',
                        borderCollapse: 'collapse',
                        background: 'transparent',
                        marginTop: '0px',
                    }}
                >
                    <thead>
                        <tr>
                            {isInProgressTab && (
                                <th style={{ ...thStyle, width: '40px', borderTopLeftRadius: '8px', textAlign: 'center', padding: '6px 8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={goalsToDisplay.length > 0 && goalsToDisplay.every(g => selectedGoalIdsForSubmit.includes(g.id || g.goalId))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedGoalIdsForSubmit(goalsToDisplay.map(g => g.id || g.goalId));
                                            } else {
                                                setSelectedGoalIdsForSubmit([]);
                                            }
                                        }}
                                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                    />
                                </th>
                            )}
                            {/* 3. IMPORTANT: Use fixed pixel widths instead of percentages on TH elements */}
                            <th style={{ ...thStyle, width: '150px', borderTopLeftRadius: isInProgressTab ? '0px' : '8px' }}>Goal Title</th>
                            <th style={{ ...thStyle, width: '250px' }}>Description</th>
                            <th style={{ ...thStyle, width: '130px', whiteSpace: 'nowrap', textAlign: 'left' }}>Weightage (%)</th>
                            <th style={{ ...thStyle, width: '200px', textAlign: 'left' }}>Target</th>

                            {isRejectedTab && (
                                <th style={{ ...thStyle, width: '200px', textAlign: 'left', padding: '6px 8px' }}>
                                    Rejection Reason
                                </th>
                            )}
                            {(isRejectedTab || isInProgressTab) && (
                                <th style={{ ...lastThStyle, width: '80px', textAlign: 'center', borderTopRightRadius: '8px' }}>
                                    Action
                                </th>
                            )}
                            {isSubmittedTab && (
                                <th style={{ ...thStyle, width: '200px', textAlign: 'center', borderTopRightRadius: '8px' }}>
                                    Self Assessment
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {goalsToDisplay.length > 0 ? (
                            goalsToDisplay.slice().reverse().map((g, rowIndex) => {
                                // Determine if this is a new goal (has temp 'id') or a rejected goal being reassigned ('reassigningGoalId' matches)
                                const isEditableGoal = !!g.id || reassigningGoalIds.includes(g.goalId);
                                const isNewGoal = !!g.id;

                                // Only truly new goals use the old editable cell logic

                                return (
                                    <tr key={g.id || g.goalId} style={{ background: isEditableGoal ? 'transparent' : 'transparent', borderBottom: 'none', minHeight: '60px' }}>
                                        {isInProgressTab && (
                                            <td style={{
                                                ...tdStyle,
                                                textAlign: 'center',
                                                verticalAlign: 'middle',
                                                padding: '12px 8px',
                                                width: '40px'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGoalIdsForSubmit.includes(g.id || g.goalId)}
                                                    onChange={(e) => {
                                                        const key = g.id || g.goalId;
                                                        if (e.target.checked) {
                                                            setSelectedGoalIdsForSubmit(prev => [...prev, key]);
                                                        } else {
                                                            setSelectedGoalIdsForSubmit(prev => prev.filter(id => id !== key));
                                                        }
                                                    }}
                                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                />
                                            </td>
                                        )}
                                        {(isInProgressTab && (isNewGoal || g.status?.toLowerCase() === 'draft')) || (isRejectedTab && reassigningGoalIds.includes(g.goalId)
                                        ) ? (
                                            <>
                                                {/* Editable Cells for New/Reassigned Goals: Use minWidth in pixels */}
                                                <td
                                                    style={{
                                                        ...tdStyle,
                                                        minWidth: '150px',

                                                        // 1. Allows wrapping at normal spaces and preserves manual newlines
                                                        whiteSpace: 'pre-wrap',

                                                        // 2. Breaks words mid-character to strictly respect the column width (your requirement)
                                                        wordBreak: 'break-all',

                                                        // 3. Breaks long, unbreakable words (like URLs) at any point
                                                        overflowWrap: 'break-word',
                                                    }}
                                                >
                                                    {renderEditableCell(g, 'goalTitle', rowIndex, goalsToDisplay.slice().reverse())}
                                                </td>

                                                {/* TD for goalDescription */}
                                                <td
                                                    style={{
                                                        ...tdStyle,
                                                        minWidth: '250px',

                                                        // 1. Allows wrapping at normal spaces and preserves manual newlines
                                                        whiteSpace: 'pre-wrap',

                                                        // 2. Breaks words mid-character to strictly respect the column width (your requirement)
                                                        wordBreak: 'break-all',

                                                        // 3. Breaks long, unbreakable words (like URLs) at any point
                                                        overflowWrap: 'break-word',
                                                    }}
                                                >
                                                    {renderEditableCell(g, 'goalDescription', rowIndex, goalsToDisplay.slice().reverse())}
                                                </td>
                                                <td style={{ ...tdStyle, minWidth: '130px' }}>
                                                    {renderEditableCell(g, 'metric', rowIndex, goalsToDisplay.slice().reverse())}
                                                </td>
                                                <td style={{ ...tdStyle, minWidth: '200px' }}>
                                                    {renderEditableCell(g, 'target', rowIndex, goalsToDisplay.slice().reverse())}
                                                </td>


                                                {/* Rejection Reason (only for Reassigned goal) */}
                                                {isRejectedTab && (
                                                    <td style={{ ...tdStyle, padding: '12px 8px', wordBreak: 'break-word', minWidth: '200px' }}>
                                                        {g.rejectionReason || g.rejection_reason || 'N/A'}
                                                    </td>
                                                )}
                                                {/* Action Column for New/Reassigned Goals */}
                                                <td
                                                    style={{
                                                        ...lastTdStyle,
                                                        textAlign: 'center',
                                                        padding: '2px 2px',
                                                        minWidth: '80px', // Ensure it respects the TH size
                                                    }}
                                                >
                                                    {isNewGoal || g.status?.toLowerCase() === 'draft' ? (
                                                        <button
                                                            onClick={() => isNewGoal ? handleDeleteNewGoal(g.id) : handleDeleteClick(g.goalId)}

                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#ff4d4f',
                                                                cursor: 'pointer',
                                                                fontSize: '1.6rem',
                                                                marginTop: '2px',
                                                            }}
                                                        >
                                                            &times;
                                                        </button>

                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleSaveReassignment(g)}
                                                                style={{
                                                                    backgroundColor: '#1b8fb9ff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '5px 7px',
                                                                    borderRadius: '5px',
                                                                    cursor: 'pointer',
                                                                    marginRight: '5px',
                                                                    marginBottom: "7px"
                                                                }}
                                                            >
                                                                Submit
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelReassignment(g.goalId)}
                                                                style={{
                                                                    backgroundColor: 'red',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '5px 7px',
                                                                    borderRadius: '5px',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* Read-Only Cells for Existing Goals. MinWidth set for scrolling */}
                                                <td
                                                    style={{
                                                        ...tdStyle,
                                                        padding: '12px 8px',
                                                        cursor: 'default',

                                                        // 1. Allows wrapping at spaces and preserves manual newlines
                                                        whiteSpace: 'pre-wrap',

                                                        // 2. Forces mid-word break *only* if a word is longer than the column width (default behavior)
                                                        //    We need a more aggressive break for fixed widths.

                                                        // 3. Forces character-level breaks to strictly respect the column width
                                                        wordBreak: 'break-all',

                                                        minWidth: '150px', // Matches TH
                                                    }}
                                                >
                                                    {g.goalTitle}
                                                </td>

                                                {/* TD for goalDescription - CSS handles dynamic wrapping */}
                                                <td
                                                    style={{
                                                        ...tdStyle,
                                                        padding: '12px 8px',
                                                        cursor: 'default',

                                                        // 1. Allows wrapping at spaces and preserves manual newlines
                                                        whiteSpace: 'pre-wrap',

                                                        // 2. Forces mid-word break *only* if a word is longer than the column width (default behavior)

                                                        // 3. Forces character-level breaks to strictly respect the column width
                                                        wordBreak: 'break-all',

                                                        minWidth: '250px', // Matches TH
                                                    }}
                                                >
                                                    {/* **REMOVED** the fixed-character JavaScript splitting. Pass the string directly. */}
                                                    {g.goalDescription}
                                                </td>

                                                <td style={{ ...tdStyle, padding: '12px 8px', cursor: 'default', minWidth: '130px' }}>
                                                    {g.metric ? `${g.metric}%` : '-'}
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdStyle,
                                                        padding: '12px 8px',
                                                        cursor: 'default',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        minWidth: '200px', // Matches TH
                                                    }}
                                                >
                                                    {(g.target?.match(/.{1,8}/g) || []).join('\n')}
                                                </td>



                                                {isRejectedTab && (
                                                    <>
                                                        <td style={{ ...tdStyle, padding: '12px 8px', wordBreak: 'break-word', minWidth: '200px' }}>
                                                            {g.rejectionReason || 'N/A'}
                                                        </td>
                                                        <td style={{ ...lastTdStyle, textAlign: 'center', padding: '12px 8px', minWidth: '20px' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => handleReassignClick(g)}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        transition: 'all 0.3s ease',
                                                                        boxShadow: '0 2px 4px rgba(20, 184, 166, 0.2)'
                                                                    }}
                                                                >
                                                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                        <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192Zm3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                                                                    </svg>
                                                                    Reassign
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(g.goalId)}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        transition: 'all 0.3s ease',
                                                                        boxShadow: '0 2px 4px rgba(244, 63, 94, 0.2)'
                                                                    }}
                                                                >
                                                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                                    </svg>
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                                {isInProgressTab && (
                                                    <td style={{ ...lastTdStyle, textAlign: 'center', padding: '12px 8px', minWidth: '20px', }}>
                                                        {/* Action buttons/icons for In Progress (currently commented out) */}
                                                    </td>
                                                )}

                                                {isSubmittedTab && (
                                                    <td
                                                        style={{
                                                            ...tdStyle,
                                                            width: '200px',
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'break-word',
                                                            whiteSpace: 'pre-wrap',
                                                            minWidth: '200px',
                                                            textAlign: 'left',
                                                            paddingLeft: '12px'
                                                        }}
                                                    >
                                                        {g.selfAssessment ?? '-'}
                                                    </td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={isRejectedTab ? 7 : isSubmittedTab ? 5 : (isInProgressTab ? 6 : 5)} style={{ textAlign: 'center', padding: '1rem' }}>
                                    No goals found for this status.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    };

    return (
        <Sidebar>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: 0, margin: 0 }}>
                <main style={{ padding: '0', margin: 0, overflowY: 'auto', flexGrow: 1 }}>
                    <div
                        // MODIFIED STYLE: Removed flexWrap: 'wrap' and added overflowX: 'auto'
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '2rem',
                            padding: '0 0 0.5rem 0',
                            borderBottom: '1px solid #ddd',
                            fontFamily: 'sans-serif',
                            // flexWrap: 'wrap', <-- REMOVED THIS
                            overflowX: 'auto', // <-- ADDED THIS FOR MOBILE SCROLLING
                            minWidth: '100%', // <-- Ensure it takes full width for scrolling to work
                        }}
                    >
                        {/* The tabs container needs to be fixed/prevented from shrinking on small screens */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '2rem',
                                // ADDED THIS: Prevents the tabs from shrinking and allows overflow for scrolling
                                flexShrink: 0,
                                // ADDED THIS: Ensures the content pushes the container wider than the viewport
                                minWidth: 'max-content',
                            }}
                        >
                            {/* The back button remains as is, but it should be set to not shrink */}
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
                            <Tab title="In Progress" isActive={activeTab === 'In Progress'} onClick={() => {
                                setActiveTab('In Progress');
                                setActiveSubTab('Goals');
                                setSelectedGoalIdsForSubmit([]);
                                setSelectedAttributeIdsForSubmit([]);
                            }} />
                            <Tab title="In Review" isActive={activeTab === 'In Review'} onClick={() => {
                                setActiveTab('In Review');
                                setActiveSubTab('Goals');
                                setSelectedGoalIdsForSubmit([]);
                                setSelectedAttributeIdsForSubmit([]);
                            }} />
                            <Tab title="Rejected" isActive={activeTab === 'Rejected'} onClick={() => {
                                setActiveTab('Rejected');
                                setActiveSubTab('Goals');
                                setSelectedGoalIdsForSubmit([]);
                                setSelectedAttributeIdsForSubmit([]);
                            }} />
                        </div>

                    </div>

                    <div style={{
                        padding: '1rem 0 0.75rem 0',
                        fontFamily: "'Inter', sans-serif",
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: '0.75rem',
                    }}>
                        <p style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.01em' }}>
                            Goals of <span style={{ color: '#0d9488' }}>{selectedEmployeeName}</span>
                            <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '400', marginLeft: '8px' }}>
                                ({getDisplayEmployeeId(selectedEmployeeId)})
                            </span>
                        </p>

                        {/* Time Period Filter - Compact Horizontal Pill Bar */}
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
                                        {(() => {
                                            const quarters = [...new Set(timePeriods
                                                .filter(p => p.year === filterYear && p.frequency === 'Quarterly' && p.quarter && p.month && p.month.trim() !== '')
                                                .map(p => p.quarter))].filter(Boolean).sort();
                                            return quarters.map(q => {
                                                const label = q;
                                                return <option key={q} value={q}>{label}</option>;
                                            });
                                        })()}
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
                                        {(() => {
                                            const halves = [...new Set(timePeriods
                                                .filter(p => p.year === filterYear && p.frequency === 'Half Yearly' && p.quarter && p.month && p.month.trim() !== '')
                                                .map(p => p.quarter))].filter(Boolean).sort();
                                            return halves.map(h => {
                                                const period = timePeriods.find(p => p.frequency === 'Half Yearly' && p.year === filterYear && p.quarter === h);
                                                const label = h;
                                                return <option key={h} value={h}>{label}</option>;
                                            });
                                        })()}
                                    </select>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ borderRadius: '8px', padding: '1rem', boxShadow: 'none', marginTop: '0' }}>
                        {/* Sub-tabs Selection Bar - Only show when NOT on the "In Review" tab */}
                        {activeTab !== 'In Review' && (
                            <div style={{
                                display: 'flex',
                                gap: '2rem',
                                borderBottom: '1px solid #ddd',
                                fontFamily: 'sans-serif',
                                marginBottom: '1.5rem',
                                marginTop: '-10px',
                                marginLeft: '-15px',
                            }}>
                                <Tab title="Goals" isActive={activeSubTab === 'Goals'} onClick={() => {
                                    setActiveSubTab('Goals');
                                    setSelectedGoalIdsForSubmit([]);
                                    setSelectedAttributeIdsForSubmit([]);
                                }} />
                                <Tab title="Attributes" isActive={activeSubTab === 'Attributes'} onClick={() => {
                                    setActiveSubTab('Attributes');
                                    setSelectedGoalIdsForSubmit([]);
                                    setSelectedAttributeIdsForSubmit([]);
                                }} />
                            </div>
                        )}

                        {activeTab === 'In Review' ? (
                            <Submitfeedback
                                selectedEmployeeId={selectedEmployeeId}
                                reviewerId={reviewerId}
                                selectedTimePeriod={selectedTimePeriod}
                                goals={goals.filter((g) => ['submitted', 'rejected by reviewer'].includes(g.status?.toLowerCase()))}
                            />
                        ) : (
                            loading ? (
                                <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading goals...</p>
                            ) : (
                                activeSubTab === 'Goals' ? (
                                    <>
                                        {renderGoalsTable(getGoalsForTab())}
                                        {activeTab === 'In Progress' && (
                                            <div
                                                style={{
                                                    marginTop: '1rem',
                                                    display: 'flex',
                                                    gap: '10px',
                                                    justifyContent: 'flex-start',
                                                }}
                                            >
                                                <button
                                                    onClick={handleAddNewGoal}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 24px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)',
                                                        transition: 'all 0.3s ease',
                                                        marginLeft: '-15px',
                                                        height: '44px',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (selectedTimePeriod !== 'All') {
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.35)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (selectedTimePeriod !== 'All') {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.25)';
                                                        }
                                                    }}
                                                >
                                                    Add New Goal
                                                </button>
                                                {templates.length > 0 && (() => {
                                                    const goalTemplates = templates.filter(t => t.goals && t.goals.length > 0);
                                                    return (
                                                        <>
                                                            {goalTemplates.length > 0 && (
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <select
                                                                        onChange={(e) => {
                                                                            const tplId = e.target.value;
                                                                            if (!tplId) return;
                                                                            const tpl = templates.find(t => String(t.id) === String(tplId));
                                                                            if (tpl) {
                                                                                handleApplyTemplate(tpl);
                                                                            }
                                                                            e.target.value = "";
                                                                        }}
                                                                        disabled={selectedTimePeriod === 'All'}
                                                                        style={{
                                                                            padding: '10px 14px',
                                                                            borderRadius: '8px',
                                                                            border: '1.5px solid #14b8a6',
                                                                            fontSize: '15px',
                                                                            color: '#0d9488',
                                                                            backgroundColor: '#f0fdfa',
                                                                            cursor: selectedTimePeriod === 'All' ? 'not-allowed' : 'pointer',
                                                                            opacity: selectedTimePeriod === 'All' ? 0.6 : 1,
                                                                            outline: 'none',
                                                                            fontWeight: '600',
                                                                            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.1)',
                                                                            height: '44px',
                                                                            width: '240px',
                                                                            textOverflow: 'ellipsis',
                                                                            flexShrink: 0,
                                                                        }}
                                                                    >
                                                                        <option value="">Select Goal Template</option>
                                                                        {goalTemplates.map(t => (
                                                                            <option key={t.id} value={t.id}>
                                                                                {t.templateName} {t.department ? `(${t.department})` : ''}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                                {(selectedAttributes.length > 0 || newGoals.length > 0 || getGoalsForTab().some(g => ['draft', 'pending', 'in progress'].includes(g.status?.toLowerCase()))) && (
                                                    <>
                                                        <button
                                                            onClick={handleSaveDrafts}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                background: 'rgb(94, 234, 212)', // Amber for Draft/Save
                                                                color: '#0D9488',
                                                                border: 'none',
                                                                padding: '10px 24px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '15px',
                                                                fontWeight: '600',
                                                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                                                                transition: 'all 0.3s ease',
                                                                height: '44px',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0,
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.35)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
                                                            }}
                                                        >
                                                            Save All
                                                        </button>

                                                        <button
                                                            onClick={handleSubmitAll}
                                                            disabled={selectedGoalIdsForSubmit.length === 0}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
                                                                color: '#0d9488',
                                                                border: '2px solid #0d9488',
                                                                padding: '10px 24px',
                                                                borderRadius: '8px',
                                                                cursor: selectedGoalIdsForSubmit.length === 0 ? 'not-allowed' : 'pointer',
                                                                opacity: selectedGoalIdsForSubmit.length === 0 ? 0.6 : 1,
                                                                fontSize: '15px',
                                                                fontWeight: '700',
                                                                transition: 'all 0.3s ease',
                                                                height: '44px',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0,
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (selectedGoalIdsForSubmit.length > 0) {
                                                                    e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.1)';
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (selectedGoalIdsForSubmit.length > 0) {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                }
                                                            }}
                                                        >
                                                            Submit Selected ({selectedGoalIdsForSubmit.length})
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {renderAttributesTable([
                                            ...selectedAttributes,
                                            ...extractAttributesFromGoals()
                                        ])}
                                        {activeTab === 'In Progress' && (
                                            <div
                                                style={{
                                                    marginTop: '1rem',
                                                    display: 'flex',
                                                    gap: '10px',
                                                    justifyContent: 'flex-start',
                                                }}
                                            >
                                                {templates.length > 0 && (() => {
                                                    const attributeTemplates = templates.filter(t => (t.templateAttributes && t.templateAttributes.length > 0) || (t.attributes && t.attributes.trim() !== ''));
                                                    return (
                                                        <>
                                                            {attributeTemplates.length > 0 && (
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <select
                                                                        onChange={(e) => {
                                                                            const tplId = e.target.value;
                                                                            if (!tplId) return;
                                                                            const tpl = templates.find(t => String(t.id) === String(tplId));
                                                                            if (tpl) {
                                                                                handleApplyAttributeTemplate(tpl);
                                                                            }
                                                                            e.target.value = "";
                                                                        }}
                                                                        disabled={selectedTimePeriod === 'All'}
                                                                        style={{
                                                                            padding: '10px 14px',
                                                                            borderRadius: '8px',
                                                                            border: '1.5px solid #14b8a6',
                                                                            fontSize: '15px',
                                                                            color: '#0d9488',
                                                                            backgroundColor: '#f0fdfa',
                                                                            cursor: selectedTimePeriod === 'All' ? 'not-allowed' : 'pointer',
                                                                            opacity: selectedTimePeriod === 'All' ? 0.6 : 1,
                                                                            outline: 'none',
                                                                            fontWeight: '600',
                                                                            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.1)',
                                                                            height: '44px',
                                                                            width: '240px',
                                                                            textOverflow: 'ellipsis',
                                                                            flexShrink: 0,
                                                                        }}
                                                                    >
                                                                        <option value="">Select Attribute Template</option>
                                                                        {attributeTemplates.map(t => (
                                                                            <option key={t.id} value={t.id}>
                                                                                {t.templateName} {t.department ? `(${t.department})` : ''}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                                {(selectedAttributes.length > 0 || getAttributesForTab().some(a => ['draft', 'pending', 'in progress'].includes(a.status?.toLowerCase()))) && (
                                                    <>
                                                        <button
                                                            onClick={handleSaveAttributeDrafts}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                background: 'rgb(94, 234, 212)',
                                                                color: '#0D9488',
                                                                border: 'none',
                                                                padding: '10px 24px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '15px',
                                                                fontWeight: '600',
                                                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                                                                transition: 'all 0.3s ease',
                                                                height: '44px',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0,
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.35)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
                                                            }}
                                                        >
                                                            Save All
                                                        </button>

                                                        <button
                                                            onClick={handleSubmitAttributes}
                                                            disabled={selectedAttributeIdsForSubmit.length === 0}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
                                                                color: '#0d9488',
                                                                border: '2px solid #0d9488',
                                                                padding: '10px 24px',
                                                                borderRadius: '8px',
                                                                cursor: selectedAttributeIdsForSubmit.length === 0 ? 'not-allowed' : 'pointer',
                                                                opacity: selectedAttributeIdsForSubmit.length === 0 ? 0.6 : 1,
                                                                fontSize: '15px',
                                                                fontWeight: '700',
                                                                transition: 'all 0.3s ease',
                                                                height: '44px',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0,
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (selectedAttributeIdsForSubmit.length > 0) {
                                                                    e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.1)';
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (selectedAttributeIdsForSubmit.length > 0) {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                }
                                                            }}
                                                        >
                                                            Submit Selected ({selectedAttributeIdsForSubmit.length})
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )
                            )
                        )}
                    </div>
                </main>
            </div>
        </Sidebar>
    );
};

export default EmployeeGoals;

