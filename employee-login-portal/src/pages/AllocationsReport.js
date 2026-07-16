import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import * as XLSX from 'xlsx';
import { FiFilter, FiDownload, FiSearch, FiUser, FiBriefcase, FiZap, FiTag } from "react-icons/fi";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Reports.css";

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

const getTenantPrefix = () => {
    const fullId = sessionStorage.getItem("employeeId");
    if (!fullId) return "";
    if (fullId.includes('_')) {
        return fullId.substring(0, fullId.lastIndexOf('_') + 1);
    }
    if (fullId.includes('-')) {
        const lastHyphen = fullId.lastIndexOf('-');
        return fullId.substring(0, lastHyphen + 1);
    }
    return "";
};

const getFullEmployeeId = (cleanId) => {
    if (!cleanId) return "";
    if (cleanId.includes('_') || cleanId.includes('-')) {
        return cleanId;
    }
    const prefix = getTenantPrefix();
    return prefix + cleanId;
};


// Employee Suggestion Component
const EmployeeSuggestion = ({ 
    suggestions, 
    showSuggestions, 
    suggestionsLoading, 
    onSelect,
    suggestionsRef,
    highlightedIndex
}) => {
    if (!showSuggestions) return null;

    return (
        <div 
            ref={suggestionsRef}
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 6px 6px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            {suggestionsLoading ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    Loading...
                </div>
            ) : suggestions.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    No suggestions found
                </div>
            ) : (
                suggestions.map((employee, index) => (
                    <div
                        key={employee.employeeId}
                        data-suggestion-item
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            fontSize: '13px',
                            transition: 'background-color 0.2s',
                            backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e0e0e0';
                        }}
                        onMouseLeave={(e) => {
                            if (highlightedIndex !== index) {
                                e.target.style.backgroundColor = 'transparent';
                            }
                        }}
                        onClick={() => onSelect(employee)}
                    >
                        {employee.firstName} {employee.lastName} ({getDisplayEmployeeId(employee.employeeId)})
                    </div>
                ))
            )}
        </div>
    );
};

const SmartDatePicker = ({ value, onChange, placeholder = "DD-MM-YYYY", disabled = false }) => {
    const [open, setOpen] = React.useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = React.useState(false);
    const [showYearDropdown, setShowYearDropdown] = React.useState(false);
    const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
    return (
        <DatePicker
            className="datepicker-input"
            selected={value instanceof Date && !isNaN(value) ? value : null}
            disabled={disabled}
            onChange={(date) => { onChange(date); setTimeout(() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }, 20); }}
            onSelect={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            open={open} onInputClick={() => setOpen(true)}
            onClickOutside={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            placeholderText={placeholder} dateFormat="dd-MM-yyyy"
            calendarClassName="no-gap-calendar" dayClassName={() => "no-gap-day"} wrapperClassName="full-width-picker"
            renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => (
                <div className="custom-calendar-header">
                    <div className="calendar-header-banner">
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>‹</button>
                        <div className="header-main-content"><div className="header-text-group">
                            <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                            <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                        </div></div>
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>›</button>
                    </div>
                    {showMonthDropdown && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{MONTHS.map((m, idx) => (<div key={m} className={`dropdown-item${idx === date.getMonth() ? " active" : ""}`} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>))}</div></div>)}
                    {showYearDropdown && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map(y => (<div key={y} className={`dropdown-item${y === date.getFullYear() ? " active" : ""}`} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>))}</div></div>)}
                </div>
            )}
        />
    );
};

const formatToDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    try {
        const parts = dateStr.split('-');
        if (parts.length >= 3 && parts[0].length === 4) {
            const day = parts[2].substring(0, 2);
            return `${day}-${parts[1]}-${parts[0]}`;
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}-${mm}-${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
};

const AllocationsReport = () => {
    const token = sessionStorage.getItem("token");
    const [filters, setFilters] = useState({
        employeeId: "",
        customerId: "",
        projectId: "",
        managerId: "",
        hrId: "",
        reviewerId: "",
        startDate: null,
        endDate: null,
        fromDate: null,
        toDate: null
    });

    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Manager suggestion states
    const [managerSuggestions, setManagerSuggestions] = useState([]);
    const [showManagerSuggestions, setShowManagerSuggestions] = useState(false);
    const [managerSuggestionsLoading, setManagerSuggestionsLoading] = useState(false);
    const [managerHighlightedIndex, setManagerHighlightedIndex] = useState(-1);

    // HR suggestion states
    const [hrSuggestions, setHrSuggestions] = useState([]);
    const [showHrSuggestions, setShowHrSuggestions] = useState(false);
    const [hrSuggestionsLoading, setHrSuggestionsLoading] = useState(false);
    const [hrHighlightedIndex, setHrHighlightedIndex] = useState(-1);

    // Reviewer suggestion states
    const [reviewerSuggestions, setReviewerSuggestions] = useState([]);
    const [showReviewerSuggestions, setShowReviewerSuggestions] = useState(false);
    const [reviewerSuggestionsLoading, setReviewerSuggestionsLoading] = useState(false);
    const [reviewerHighlightedIndex, setReviewerHighlightedIndex] = useState(-1);

    // Refs for dropdown management
    const employeeIdRef = useRef(null);
    const suggestionsRef = useRef(null);
    const managerIdRef = useRef(null);
    const managerSuggestionsRef = useRef(null);
    const hrIdRef = useRef(null);
    const hrSuggestionsRef = useRef(null);
    const reviewerIdRef = useRef(null);
    const reviewerSuggestionsRef = useRef(null);

    // Initial load: fetch clients
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await api.get("/customers", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClients(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching clients:", err);
            }
        };
        fetchClients();
    }, [token]);

    // When customer changes, fetch related projects
    useEffect(() => {
        const fetchProjects = async () => {
            if (!filters.customerId) {
                setProjects([]);
                setFilters(prev => ({ ...prev, projectId: "" }));
                return;
            }
            try {
                const res = await api.get(`/projects/customer/${filters.customerId}/all-projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching projects:", err);
            }
        };
        fetchProjects();
    }, [filters.customerId, token]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setFilters({
            employeeId: "",
            customerId: "",
            projectId: "",
            managerId: "",
            hrId: "",
            reviewerId: "",
            startDate: null,
            endDate: null,
            fromDate: null,
            toDate: null
        });
        setReportsData([]);
    };

    // Debounce function for search suggestions
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Fetch employee suggestions from API
    const fetchEmployeeSuggestions = async (query) => {
        if (!query || query.trim().length < 1) {
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
            return;
        }

        setSuggestionsLoading(true);
        try {
            const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployeeSuggestions(response.data);
            setShowEmployeeSuggestions(response.data.length > 0);
        } catch (err) {
            console.error('Error fetching employee suggestions:', err);
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    // Fetch manager suggestions from API
    const fetchManagerSuggestions = async (query) => {
        if (!query || query.trim().length < 1) {
            setManagerSuggestions([]);
            setShowManagerSuggestions(false);
            return;
        }

        setManagerSuggestionsLoading(true);
        try {
            const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setManagerSuggestions(response.data);
            setShowManagerSuggestions(response.data.length > 0);
        } catch (err) {
            console.error('Error fetching manager suggestions:', err);
            setManagerSuggestions([]);
            setShowManagerSuggestions(false);
        } finally {
            setManagerSuggestionsLoading(false);
        }
    };

    // Fetch HR suggestions from API
    const fetchHrSuggestions = async (query) => {
        if (!query || query.trim().length < 1) {
            setHrSuggestions([]);
            setShowHrSuggestions(false);
            return;
        }

        setHrSuggestionsLoading(true);
        try {
            const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHrSuggestions(response.data);
            setShowHrSuggestions(response.data.length > 0);
        } catch (err) {
            console.error('Error fetching HR suggestions:', err);
            setHrSuggestions([]);
            setShowHrSuggestions(false);
        } finally {
            setHrSuggestionsLoading(false);
        }
    };

    // Fetch reviewer suggestions from API
    const fetchReviewerSuggestions = async (query) => {
        if (!query || query.trim().length < 1) {
            setReviewerSuggestions([]);
            setShowReviewerSuggestions(false);
            return;
        }

        setReviewerSuggestionsLoading(true);
        try {
            const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviewerSuggestions(response.data);
            setShowReviewerSuggestions(response.data.length > 0);
        } catch (err) {
            console.error('Error fetching reviewer suggestions:', err);
            setReviewerSuggestions([]);
            setShowReviewerSuggestions(false);
        } finally {
            setReviewerSuggestionsLoading(false);
        }
    };

    // Debounced version of fetchSuggestions
    const debouncedFetchEmployeeSuggestions = debounce(fetchEmployeeSuggestions, 300);
    const debouncedFetchManagerSuggestions = debounce(fetchManagerSuggestions, 300);
    const debouncedFetchHrSuggestions = debounce(fetchHrSuggestions, 300);
    const debouncedFetchReviewerSuggestions = debounce(fetchReviewerSuggestions, 300);

    // Handle employee ID input change
    const handleEmployeeIdChange = (value) => {
        setFilters(prev => ({ ...prev, employeeId: value }));
        setHighlightedIndex(-1); // Reset highlighted index when typing
        
        if (value.trim().length >= 1) {
            debouncedFetchEmployeeSuggestions(value);
        } else {
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
        }
    };

    // Handle manager ID input change
    const handleManagerIdChange = (value) => {
        setFilters(prev => ({ ...prev, managerId: value }));
        setManagerHighlightedIndex(-1); // Reset highlighted index when typing
        
        if (value.trim().length >= 1) {
            debouncedFetchManagerSuggestions(value);
        } else {
            setManagerSuggestions([]);
            setShowManagerSuggestions(false);
        }
    };

    // Handle HR ID input change
    const handleHrIdChange = (value) => {
        setFilters(prev => ({ ...prev, hrId: value }));
        setHrHighlightedIndex(-1); // Reset highlighted index when typing
        
        if (value.trim().length >= 1) {
            debouncedFetchHrSuggestions(value);
        } else {
            setHrSuggestions([]);
            setShowHrSuggestions(false);
        }
    };

    // Handle reviewer ID input change
    const handleReviewerIdChange = (value) => {
        setFilters(prev => ({ ...prev, reviewerId: value }));
        setReviewerHighlightedIndex(-1); // Reset highlighted index when typing
        
        if (value.trim().length >= 1) {
            debouncedFetchReviewerSuggestions(value);
        } else {
            setReviewerSuggestions([]);
            setShowReviewerSuggestions(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (employee, field) => {
        const searchValue = `${employee.firstName} ${employee.lastName} (${getDisplayEmployeeId(employee.employeeId)})`;
        setFilters(prev => ({ ...prev, [field]: searchValue }));
        
        // Reset appropriate suggestions
        if (field === 'employeeId') {
            setShowEmployeeSuggestions(false);
            setEmployeeSuggestions([]);
            setHighlightedIndex(-1);
        } else if (field === 'managerId') {
            setShowManagerSuggestions(false);
            setManagerSuggestions([]);
            setManagerHighlightedIndex(-1);
        } else if (field === 'hrId') {
            setShowHrSuggestions(false);
            setHrSuggestions([]);
            setHrHighlightedIndex(-1);
        } else if (field === 'reviewerId') {
            setShowReviewerSuggestions(false);
            setReviewerSuggestions([]);
            setReviewerHighlightedIndex(-1);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e, field) => {
        let suggestions, showSuggestions, setHighlightedIndexFunc, highlightedIndex, currentSuggestionsRef;
        
        if (field === 'employeeId') {
            suggestions = employeeSuggestions;
            showSuggestions = showEmployeeSuggestions;
            setHighlightedIndexFunc = setHighlightedIndex;
            highlightedIndex = highlightedIndex;
            currentSuggestionsRef = suggestionsRef;
        } else if (field === 'managerId') {
            suggestions = managerSuggestions;
            showSuggestions = showManagerSuggestions;
            setHighlightedIndexFunc = setManagerHighlightedIndex;
            highlightedIndex = managerHighlightedIndex;
            currentSuggestionsRef = managerSuggestionsRef;
        } else if (field === 'hrId') {
            suggestions = hrSuggestions;
            showSuggestions = showHrSuggestions;
            setHighlightedIndexFunc = setHrHighlightedIndex;
            highlightedIndex = hrHighlightedIndex;
            currentSuggestionsRef = hrSuggestionsRef;
        } else if (field === 'reviewerId') {
            suggestions = reviewerSuggestions;
            showSuggestions = showReviewerSuggestions;
            setHighlightedIndexFunc = setReviewerHighlightedIndex;
            highlightedIndex = reviewerHighlightedIndex;
            currentSuggestionsRef = reviewerSuggestionsRef;
        }

        if (!showSuggestions || suggestions.length === 0) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndexFunc(prev => {
                    const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
                    // Scroll the highlighted item into view
                    setTimeout(() => {
                        const suggestionItems = currentSuggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
                        if (suggestionItems[newIndex]) {
                            suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, 0);
                    return newIndex;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndexFunc(prev => {
                    const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
                    // Scroll the highlighted item into view
                    setTimeout(() => {
                        const suggestionItems = currentSuggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
                        if (suggestionItems[newIndex]) {
                            suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, 0);
                    return newIndex;
                });
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    handleSuggestionClick(suggestions[highlightedIndex], field);
                }
                break;
            case 'Escape':
                if (field === 'employeeId') {
                    setShowEmployeeSuggestions(false);
                    setHighlightedIndex(-1);
                } else if (field === 'managerId') {
                    setShowManagerSuggestions(false);
                    setManagerHighlightedIndex(-1);
                } else if (field === 'hrId') {
                    setShowHrSuggestions(false);
                    setHrHighlightedIndex(-1);
                } else if (field === 'reviewerId') {
                    setShowReviewerSuggestions(false);
                    setReviewerHighlightedIndex(-1);
                }
                break;
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Employee ID dropdown
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                employeeIdRef.current && !employeeIdRef.current.contains(event.target)) {
                setShowEmployeeSuggestions(false);
            }
            
            // Manager ID dropdown
            if (managerSuggestionsRef.current && !managerSuggestionsRef.current.contains(event.target) &&
                managerIdRef.current && !managerIdRef.current.contains(event.target)) {
                setShowManagerSuggestions(false);
            }
            
            // HR ID dropdown
            if (hrSuggestionsRef.current && !hrSuggestionsRef.current.contains(event.target) &&
                hrIdRef.current && !hrIdRef.current.contains(event.target)) {
                setShowHrSuggestions(false);
            }
            
            // Reviewer ID dropdown
            if (reviewerSuggestionsRef.current && !reviewerSuggestionsRef.current.contains(event.target) &&
                reviewerIdRef.current && !reviewerIdRef.current.contains(event.target)) {
                setShowReviewerSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date) => {
        if (!date) return null;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.employeeId) {
                // Extract employee ID from format "Name (ID)" or use as-is if it's just an ID
                const employeeIdMatch = filters.employeeId.match(/\(([^)]+)\)$/);
                const employeeIdToSend = employeeIdMatch ? employeeIdMatch[1] : filters.employeeId;
                params.append("employeeId", getFullEmployeeId(employeeIdToSend));
            }
            if (filters.customerId) params.append("customerId", filters.customerId);
            if (filters.projectId) params.append("projectId", filters.projectId);
            if (filters.managerId) {
                // Extract manager ID from format "Name (ID)" or use as-is if it's just an ID
                const managerIdMatch = filters.managerId.match(/\(([^)]+)\)$/);
                const managerIdToSend = managerIdMatch ? managerIdMatch[1] : filters.managerId;
                params.append("managerId", getFullEmployeeId(managerIdToSend));
            }
            if (filters.hrId) {
                // Extract HR ID from format "Name (ID)" or use as-is if it's just an ID
                const hrIdMatch = filters.hrId.match(/\(([^)]+)\)$/);
                const hrIdToSend = hrIdMatch ? hrIdMatch[1] : filters.hrId;
                params.append("hrId", getFullEmployeeId(hrIdToSend));
            }
            if (filters.reviewerId) {
                // Extract reviewer ID from format "Name (ID)" or use as-is if it's just an ID
                const reviewerIdMatch = filters.reviewerId.match(/\(([^)]+)\)$/);
                const reviewerIdToSend = reviewerIdMatch ? reviewerIdMatch[1] : filters.reviewerId;
                params.append("reviewerId", getFullEmployeeId(reviewerIdToSend));
            }

            const st = formatDate(filters.startDate);
            if (st) params.append("startDate", st);

            const en = formatDate(filters.endDate);
            if (en) params.append("endDate", en);

            const fr = formatDate(filters.fromDate);
            if (fr) params.append("fromDate", fr);

            const to = formatDate(filters.toDate);
            if (to) params.append("toDate", to);

            const res = await api.get(`/allocations/fetch-reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportsData(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch allocations report", err);
            const msg = err.response?.data?.message || err.response?.data || err.message;
            alert("Error fetching report data: " + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExport = () => {
        if (reportsData.length === 0) {
            alert("No data available to download");
            return;
        }

        const dataToExport = reportsData.map(item => ({
            "Employee ID": getDisplayEmployeeId(item.employeeId),
            "Employee Name": `${item.employeeFirstName || ""} ${item.employeeLastName || ""}`.trim(),
            "Client": item.customerName || "N/A",
            "Project": item.projectName || "N/A",
            "Manager": `${item.managerFirstName || ""} ${item.managerLastName || ""} (${getDisplayEmployeeId(item.managerId) || "N/A"})`.trim(),
            "HR": `${item.hrFirstName || ""} ${item.hrLastName || ""} (${getDisplayEmployeeId(item.hrId) || "N/A"})`.trim(),
            "Reviewer": `${item.reviewerFirstName || ""} ${item.reviewerLastName || ""} (${getDisplayEmployeeId(item.reviewerId) || "N/A"})`.trim(),
            "Start Date": formatToDDMMYYYY(item.startDate),
            "End Date": formatToDDMMYYYY(item.endDate),
            "Status": item.allocationStatus
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Allocations Report");
        XLSX.writeFile(wb, `Allocations_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="reports-content-section fadeIn">
            <div className="filters-card">

                <div className="filters-grid">
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Employee ID</label>
                        <input
                            ref={employeeIdRef}
                            type="text"
                            name="employeeId"
                            value={filters.employeeId}
                            onChange={(e) => handleEmployeeIdChange(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'employeeId')}
                            placeholder="Ex: EMP001"
                        />
                        <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={(employee) => handleSuggestionClick(employee, 'employeeId')}
                            suggestionsRef={suggestionsRef}
                            highlightedIndex={highlightedIndex}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Client</label>
                        <select name="customerId" value={filters.customerId} onChange={handleFilterChange}>
                            <option value="">All Clients</option>
                            {clients.map(c => (
                                <option key={c.customerId} value={c.customerId}>{c.customerName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Project</label>
                        <select
                            name="projectId"
                            value={filters.projectId}
                            onChange={handleFilterChange}
                            disabled={!filters.customerId}
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Manager ID</label>
                        <input
                            ref={managerIdRef}
                            type="text"
                            name="managerId"
                            value={filters.managerId}
                            onChange={(e) => handleManagerIdChange(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'managerId')}
                            placeholder="Manager ID"
                        />
                        <EmployeeSuggestion
                            suggestions={managerSuggestions}
                            showSuggestions={showManagerSuggestions}
                            suggestionsLoading={managerSuggestionsLoading}
                            onSelect={(employee) => handleSuggestionClick(employee, 'managerId')}
                            suggestionsRef={managerSuggestionsRef}
                            highlightedIndex={managerHighlightedIndex}
                        />
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>HR ID</label>
                        <input
                            ref={hrIdRef}
                            type="text"
                            name="hrId"
                            value={filters.hrId}
                            onChange={(e) => handleHrIdChange(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'hrId')}
                            placeholder="HR ID"
                        />
                        <EmployeeSuggestion
                            suggestions={hrSuggestions}
                            showSuggestions={showHrSuggestions}
                            suggestionsLoading={hrSuggestionsLoading}
                            onSelect={(employee) => handleSuggestionClick(employee, 'hrId')}
                            suggestionsRef={hrSuggestionsRef}
                            highlightedIndex={hrHighlightedIndex}
                        />
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Reviewer ID</label>
                        <input
                            ref={reviewerIdRef}
                            type="text"
                            name="reviewerId"
                            value={filters.reviewerId}
                            onChange={(e) => handleReviewerIdChange(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'reviewerId')}
                            placeholder="Reviewer ID"
                        />
                        <EmployeeSuggestion
                            suggestions={reviewerSuggestions}
                            showSuggestions={showReviewerSuggestions}
                            suggestionsLoading={reviewerSuggestionsLoading}
                            onSelect={(employee) => handleSuggestionClick(employee, 'reviewerId')}
                            suggestionsRef={reviewerSuggestionsRef}
                            highlightedIndex={reviewerHighlightedIndex}
                        />
                    </div>
                    <div className="filter-group">
                        <label> St Date</label>
                        <SmartDatePicker
                            value={filters.startDate}
                            onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                        placeholder="DD-MM-YYYY"
                        />
                    </div>
                    <div className="filter-group">
                        <label> End Date</label>
                        <SmartDatePicker
                            value={filters.endDate}
                            onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                        placeholder="DD-MM-YYYY"
                        />
                    </div>
                    <div className="filter-group">
                        <label> From Date</label>
                        <SmartDatePicker
                            value={filters.fromDate}
                            onChange={(date) => setFilters(prev => ({ ...prev, fromDate: date }))}
                        placeholder="DD-MM-YYYY"
                        />
                    </div>
                    <div className="filter-group">
                        <label> To Date</label>
                        <SmartDatePicker
                            value={filters.toDate}
                            onChange={(date) => setFilters(prev => ({ ...prev, toDate: date }))}
                        placeholder="DD-MM-YYYY"
                        />
                    </div>
                </div>
                <div className="card-actions">
                    <button className="btn-fetch" onClick={fetchReport} disabled={loading}>
                        {loading ? "Loading..." : <><FiSearch /> Generate Report</>}
                    </button>
                    <button className="btn-download" onClick={handleDownloadExport} disabled={reportsData.length === 0}>
                        <FiDownload /> Download Excel
                    </button>
                    <button className="btn-clear" onClick={handleClear}>
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="results-card">
                <div className="table-wrapper">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Emp ID</th>
                                <th>Name</th>
                                <th>Client</th>
                                <th>Project</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.length > 0 ? (
                                reportsData.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{getDisplayEmployeeId(item.employeeId)}</td>
                                        <td>{`${item.employeeFirstName || ""} ${item.employeeLastName || ""}`.trim()}</td>
                                        <td>{item.customerName || "N/A"}</td>
                                        <td>{item.projectName || "N/A"}</td>
                                        <td>{formatToDDMMYYYY(item.startDate)}</td>
                                        <td>{formatToDDMMYYYY(item.endDate)}</td>
                                        <td>
                                            <span className={`status-pill ${item.allocationStatus.toLowerCase()}`}>
                                                {item.allocationStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data">
                                        {loading ? "Fetching data..." : "No records found. Adjust filters and click 'Generate Report'."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllocationsReport;
