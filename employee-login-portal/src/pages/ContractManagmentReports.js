import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import { FiFilter, FiSearch, FiDownload, FiUser, FiDollarSign, FiBriefcase, FiLayers } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Reports.css";
import "./OnBoardingPage.css";

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

// ── SmartDatePicker (same custom calendar UI as OnBoarding) ──────────────────
const SmartDatePicker = ({ value, onChange, placeholder, minDate, maxDate }) => {
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    const inputStyle = {
        width: "100%",
        padding: "0.625rem 0.875rem",
        border: "1.5px solid #e2e8f0",
        borderRadius: "12px",
        fontSize: "0.875rem",
        color: "#0f172a",
        background: "white",
        outline: "none",
        transition: "border-color 0.2s ease",
        boxSizing: "border-box"
    };

    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={onChange}
            dateFormat="dd-MM-yyyy"
            placeholderText={placeholder || "DD-MM-YYYY"}
            className="datepicker-input"
            wrapperClassName="react-datepicker-wrapper"
            customInput={<input style={inputStyle} />}
            minDate={minDate}
            maxDate={maxDate}
            isClearable
            renderCustomHeader={({
                date, changeYear, changeMonth, decreaseMonth, increaseMonth
            }) => {
                const months = [
                    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
                ];
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 50 }, (_, i) => currentYear + 5 - i);
                return (
                    <div className="custom-calendar-header">
                        <div className="calendar-header-banner">
                            <button type="button" className="header-nav-btn prev"
                                onClick={(e) => { e.preventDefault(); setMonthOpen(false); setYearOpen(false); decreaseMonth(); }}>
                                ‹
                            </button>
                            <div className="header-main-content">
                                <div className="header-text-group">
                                    <span className="clickable-header-text"
                                        onClick={(e) => { e.stopPropagation(); setMonthOpen(!monthOpen); setYearOpen(false); }}>
                                        {months[date.getMonth()]}
                                    </span>
                                    <span className="clickable-header-text"
                                        onClick={(e) => { e.stopPropagation(); setYearOpen(!yearOpen); setMonthOpen(false); }}>
                                        {date.getFullYear()}
                                    </span>
                                </div>
                            </div>
                            <button type="button" className="header-nav-btn next"
                                onClick={(e) => { e.preventDefault(); setMonthOpen(false); setYearOpen(false); increaseMonth(); }}>
                                ›
                            </button>
                        </div>
                        {monthOpen && (
                            <div className="header-dropdown month-dropdown">
                                <div className="dropdown-scroll-pane">
                                    {months.map((m, idx) => (
                                        <div key={m}
                                            className={`dropdown-item ${idx === date.getMonth() ? "active" : ""}`}
                                            onClick={() => { changeMonth(idx); setMonthOpen(false); }}>
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {yearOpen && (
                            <div className="header-dropdown year-dropdown">
                                <div className="dropdown-scroll-pane">
                                    {years.map(y => (
                                        <div key={y}
                                            className={`dropdown-item ${y === date.getFullYear() ? "active" : ""}`}
                                            onClick={() => { changeYear(y); setYearOpen(false); }}>
                                            {y}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }}
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

const ContractManagmentReports = () => {
    // State for filters
    const [filters, setFilters] = useState({
        customerName: "",
        msaStartDate: null,
        msaEndDate: null,
        sowName: "",
        sowStartDate: null,
        sowEndDate: null,
        sowTotalEffort: "",
        sowTotalCost: "",
        projectName: "",
        projectStartDate: null,
        projectEndDate: null,
        projectTotalCost: "",
        projectTotalEffort: "",
        managerId: "",
        reviewerId: "",
        hrId: "",
        financeId: "",
        adminId: "",
        employeeId: "", // Resource Allocation
        allocationStartDate: null,
        allocationEndDate: null
    });

    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [activeSearchField, setActiveSearchField] = useState('');

    // Refs for dropdown management
    const searchRefs = {
        managerId: useRef(null),
        reviewerId: useRef(null),
        hrId: useRef(null),
        financeId: useRef(null),
        adminId: useRef(null),
        employeeId: useRef(null)
    };
    const suggestionsRef = useRef(null);

    // Filter change handler
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name, date) => {
        setFilters(prev => ({ ...prev, [name]: date }));
    };

    // Fetch Report
    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            // Helper to format date
            const formatDate = (date) => {
                if (!date) return "";
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    if (key.toLowerCase().includes("date")) {
                        params.append(key, formatDate(filters[key]));
                    } else if (['managerId', 'reviewerId', 'hrId', 'financeId', 'adminId', 'employeeId'].includes(key)) {
                        // Extract employee ID from format "Name (ID)" or use as-is if it's just an ID
                        const employeeIdMatch = filters[key].match(/\(([^)]+)\)$/);
                        const employeeIdToSend = employeeIdMatch ? employeeIdMatch[1] : filters[key];
                        params.append(key, getFullEmployeeId(employeeIdToSend));
                    } else {
                        params.append(key, filters[key]);
                    }
                }
            });

            const token = sessionStorage.getItem("token");
            const res = await api.get(`/allocations/contract-report?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportsData(res.data || []);
        } catch (err) {
            console.error("Failed to fetch contract report", err);
            alert("Error fetching contract report data");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFilters({
            customerName: "", msaStartDate: null, msaEndDate: null,
            sowName: "", sowStartDate: null, sowEndDate: null, sowTotalEffort: "", sowTotalCost: "",
            projectName: "", projectStartDate: null, projectEndDate: null, projectTotalCost: "", projectTotalEffort: "",
            managerId: "", reviewerId: "", hrId: "", financeId: "", adminId: "",
            employeeId: "", allocationStartDate: null, allocationEndDate: null
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
            const token = sessionStorage.getItem("token");
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

    // Debounced version of fetchEmployeeSuggestions
    const debouncedFetchSuggestions = debounce(fetchEmployeeSuggestions, 300);

    // Handle search change with suggestions
    const handleSearchChangeWithSuggestions = (value, field) => {
        setActiveSearchField(field);
        setFilters(prev => ({ ...prev, [field]: value }));
        setHighlightedIndex(-1); // Reset highlighted index when typing

        if (value.trim().length >= 1) {
            debouncedFetchSuggestions(value);
        } else {
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (employee) => {
        const searchValue = `${employee.firstName} ${employee.lastName} (${getDisplayEmployeeId(employee.employeeId)})`;
        setFilters(prev => ({ ...prev, [activeSearchField]: searchValue }));
        setShowEmployeeSuggestions(false);
        setEmployeeSuggestions([]);
        setHighlightedIndex(-1);
        setActiveSearchField('');
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showEmployeeSuggestions || employeeSuggestions.length === 0) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    const newIndex = prev < employeeSuggestions.length - 1 ? prev + 1 : 0;
                    // Scroll the highlighted item into view
                    setTimeout(() => {
                        const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
                        if (suggestionItems[newIndex]) {
                            suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, 0);
                    return newIndex;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    const newIndex = prev > 0 ? prev - 1 : employeeSuggestions.length - 1;
                    // Scroll the highlighted item into view
                    setTimeout(() => {
                        const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
                        if (suggestionItems[newIndex]) {
                            suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, 0);
                    return newIndex;
                });
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && employeeSuggestions[highlightedIndex]) {
                    handleSuggestionClick(employeeSuggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowEmployeeSuggestions(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // Handle input focus
    const handleInputFocus = (field) => {
        setActiveSearchField(field);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                (!activeSearchField || !searchRefs[activeSearchField]?.current?.contains(event.target))) {
                setShowEmployeeSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeSearchField]);

    const handleDownload = () => {
        if (reportsData.length === 0) {
            alert("No data available to download");
            return;
        }

        const dataToExport = reportsData.map(item => ({
            "Customer Name": item.customerName,
            "MSA Start Date": formatToDDMMYYYY(item.msaStartDate),
            "MSA End Date": formatToDDMMYYYY(item.msaEndDate),
            "SOW Name": item.sowName,
            "SOW Start Date": formatToDDMMYYYY(item.sowStartDate),
            "SOW End Date": formatToDDMMYYYY(item.sowEndDate),
            "SOW Effort (PD)": item.sowTotalEffort,
            "SOW Cost": item.sowTotalCost,
            "Project Name": item.projectName,
            "Project Start": formatToDDMMYYYY(item.projectStartDate),
            "Project End": formatToDDMMYYYY(item.projectEndDate),
            "Project Cost": item.projectTotalCost,
            "Project Effort": item.projectTotalEffort,
            "Manager ID": getDisplayEmployeeId(item.managerId),
            "Reviewer ID": getDisplayEmployeeId(item.reviewerId),
            "HR ID": getDisplayEmployeeId(item.hrId),
            "Finance ID": getDisplayEmployeeId(item.financeId),
            "Admin ID": getDisplayEmployeeId(item.adminId),
            "Allocated Emp ID": getDisplayEmployeeId(item.allocatedEmployeeId),
            "Alloc Start": formatToDDMMYYYY(item.allocationStartDate),
            "Alloc End": formatToDDMMYYYY(item.allocationEndDate)
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contract Report");
        XLSX.writeFile(wb, `Contract_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="reports-content-section fadeIn">
            <div className="filters-card">


                {/* Customer Section */}
                {/* <h4 className="section-title" style={{ marginTop: 0, marginBottom: '10px', color: '#14b8a6' }}>Customer & MSA</h4> */}
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Customer Name</label>
                        <input type="text" name="customerName" value={filters.customerName} onChange={handleFilterChange} placeholder="Ex: Acme Corp" />
                    </div>
                    <div className="filter-group">
                        <label> MSA Start Date</label>
                        <SmartDatePicker value={filters.msaStartDate} onChange={(date) => handleDateChange('msaStartDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                    <div className="filter-group">
                        <label> MSA End Date</label>
                        <SmartDatePicker value={filters.msaEndDate} onChange={(date) => handleDateChange('msaEndDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                </div>

                {/* SOW Section */}
                {/* <h4 className="section-title" style={{ marginTop: '15px', marginBottom: '10px', color: '#14b8a6' }}>Statement of Work (SOW)</h4> */}
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>SOW Name</label>
                        <input type="text" name="sowName" value={filters.sowName} onChange={handleFilterChange} placeholder="SOW Name" />
                    </div>
                    <div className="filter-group">
                        <label> SOW Start Date</label>
                        <SmartDatePicker value={filters.sowStartDate} onChange={(date) => handleDateChange('sowStartDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                    <div className="filter-group">
                        <label> SOW End Date</label>
                        <SmartDatePicker value={filters.sowEndDate} onChange={(date) => handleDateChange('sowEndDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                    <div className="filter-group">
                        <label>Total Effort (PD)</label>
                        <input type="number" name="sowTotalEffort" value={filters.sowTotalEffort} onChange={handleFilterChange} placeholder="PD" />
                    </div>
                    <div className="filter-group">
                        <label>Total Cost</label>
                        <input type="number" name="sowTotalCost" value={filters.sowTotalCost} onChange={handleFilterChange} placeholder="0.00" />
                    </div>
                </div>

                {/* Project Section */}
                {/* <h4 className="section-title" style={{ marginTop: '15px', marginBottom: '10px', color: '#14b8a6' }}>Project & Roles</h4> */}
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Project Name</label>
                        <input type="text" name="projectName" value={filters.projectName} onChange={handleFilterChange} placeholder="Project Name" />
                    </div>
                    <div className="filter-group">
                        <label> Start Date</label>
                        <SmartDatePicker value={filters.projectStartDate} onChange={(date) => handleDateChange('projectStartDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                    <div className="filter-group">
                        <label> End Date</label>
                        <SmartDatePicker value={filters.projectEndDate} onChange={(date) => handleDateChange('projectEndDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                    <div className="filter-group">
                        <label>Total Cost</label>
                        <input type="number" name="projectTotalCost" value={filters.projectTotalCost} onChange={handleFilterChange} placeholder="0.00" />
                    </div>
                    <div className="filter-group">
                        <label>Total Effort</label>
                        <input type="number" name="projectTotalEffort" value={filters.projectTotalEffort} onChange={handleFilterChange} placeholder="0.00" />
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Manager ID</label>
                        <input
                            ref={searchRefs.managerId}
                            type="text"
                            name="managerId"
                            value={filters.managerId}
                            onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'managerId')}
                            onFocus={() => handleInputFocus('managerId')}
                            onKeyDown={handleKeyDown}
                            placeholder="Manager ID"
                        />
                        <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions && activeSearchField === 'managerId'}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={handleSuggestionClick}
                            suggestionsRef={suggestionsRef}
                            highlightedIndex={highlightedIndex}
                        />
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Reviewer ID</label>
                        <input
                            ref={searchRefs.reviewerId}
                            type="text"
                            name="reviewerId"
                            value={filters.reviewerId}
                            onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'reviewerId')}
                            onFocus={() => handleInputFocus('reviewerId')}
                            onKeyDown={handleKeyDown}
                            placeholder="Reviewer ID"
                        />
                        <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions && activeSearchField === 'reviewerId'}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={handleSuggestionClick}
                            suggestionsRef={suggestionsRef}
                            highlightedIndex={highlightedIndex}
                        />
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>HR ID</label>
                        <input
                            ref={searchRefs.hrId}
                            type="text"
                            name="hrId"
                            value={filters.hrId}
                            onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'hrId')}
                            onFocus={() => handleInputFocus('hrId')}
                            onKeyDown={handleKeyDown}
                            placeholder="HR ID"
                        />
                        <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions && activeSearchField === 'hrId'}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={handleSuggestionClick}
                            suggestionsRef={suggestionsRef}
                            highlightedIndex={highlightedIndex}
                        />
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Finance ID</label>
                        <input
                            ref={searchRefs.financeId}
                            type="text"
                            name="financeId"
                            value={filters.financeId}
                            onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'financeId')}
                            onFocus={() => handleInputFocus('financeId')}
                            onKeyDown={handleKeyDown}
                            placeholder="Finance ID"
                        />
                        <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions && activeSearchField === 'financeId'}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={handleSuggestionClick}
                            suggestionsRef={suggestionsRef}
                            highlightedIndex={highlightedIndex}
                        />
                    </div>
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Admin ID</label>
                        <input
                            ref={searchRefs.adminId}
                            type="text"
                            name="adminId"
                            value={filters.adminId}
                            onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'adminId')}
                            onFocus={() => handleInputFocus('adminId')}
                            onKeyDown={handleKeyDown}
                            placeholder="Admin ID"
                        />
                        <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions && activeSearchField === 'adminId'}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={handleSuggestionClick}
                            suggestionsRef={suggestionsRef}
                            highlightedIndex={highlightedIndex}
                        />
                    </div>
                </div>

                {/* Resource Alloction */}
                {/* <h4 className="section-title" style={{ marginTop: '15px', marginBottom: '10px', color: '#14b8a6' }}>Resource Allocation</h4> */}
                <div className="filters-grid">
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Employee ID</label>
                        <input
                            ref={searchRefs.employeeId}
                            type="text"
                            name="employeeId"
                            value={filters.employeeId}
                            onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'employeeId')}
                            onFocus={() => handleInputFocus('employeeId')}
                            onKeyDown={handleKeyDown}
                            placeholder="Emp ID"
                        />
                        <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions && activeSearchField === 'employeeId'}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={handleSuggestionClick}
                            suggestionsRef={suggestionsRef}
                            highlightedIndex={highlightedIndex}
                        />
                    </div>
                    <div className="filter-group">
                        <label> Alloc Start</label>
                        <SmartDatePicker value={filters.allocationStartDate} onChange={(date) => handleDateChange('allocationStartDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                    <div className="filter-group">
                        <label> Alloc End</label>
                        <SmartDatePicker value={filters.allocationEndDate} onChange={(date) => handleDateChange('allocationEndDate', date)} placeholder="DD-MM-YYYY" />
                    </div>
                </div>


                <div className="card-actions">
                    <button className="btn-fetch" onClick={fetchReport} disabled={loading}>
                        {loading ? "Loading..." : <><FiSearch /> Generate Report</>}
                    </button>
                    <button className="btn-download" onClick={handleDownload} disabled={reportsData.length === 0}>
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
                                <th>Client</th>
                                <th>SOW</th>
                                <th>Project</th>
                                <th>Allocated Emp</th>
                                <th>Alloc Start</th>
                                <th>Alloc End</th>
                                <th>Proj Cost</th>
                                <th>Manager</th>
                                <th>Reviewer</th>
                                <th>HR</th>
                                <th>Finance</th>
                                <th>Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.length > 0 ? (
                                reportsData.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.customerName || "-"}</td>
                                        <td>{item.sowName || "-"}</td>
                                        <td>{item.projectName || "-"}</td>
                                        <td>{getDisplayEmployeeId(item.allocatedEmployeeId) || "-"}</td>
                                        <td>{formatToDDMMYYYY(item.allocationStartDate)}</td>
                                        <td>{formatToDDMMYYYY(item.allocationEndDate)}</td>
                                        <td>{item.projectTotalCost}</td>
                                        <td>{getDisplayEmployeeId(item.managerId) || "-"}</td>
                                        <td>{getDisplayEmployeeId(item.reviewerId) || "-"}</td>
                                        <td>{getDisplayEmployeeId(item.hrId) || "-"}</td>
                                        <td>{getDisplayEmployeeId(item.financeId) || "-"}</td>
                                        <td>{getDisplayEmployeeId(item.adminId) || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={12} className="no-data">
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

export default ContractManagmentReports;
