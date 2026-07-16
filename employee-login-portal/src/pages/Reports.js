import React, { useState, useEffect, useCallback, useRef } from "react";
import { formatDateToIST } from '../utils/DateUtils';
import Sidebar from "./Sidebar";
import api from "../api";
import * as XLSX from 'xlsx';
import { FiBarChart2, FiFilter, FiDownload, FiSearch, FiDollarSign, FiTag, FiUser, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Reports.css";
import PayslipsReport from "./PayslipsReport";
import TravelReport from "./TravelReport";
import PerformanceReport from "./PerformanceReport";
import TimesheetReport from "./TimesheetReport";
import AllocationsReport from "./AllocationsReport";
import Helpdeskreport from "./Helpdeskreport";
import Exitmanagementreport from "./Exitmanagementreport";
import GrievanceReport from "./GrievanceReport";
import Onboardingreport from "./Onboardingreport";
import PreonboardingReport from "./PreonboardingReport";
import Employeereport from "./Employeereport";
import LeavesReport from "./LeavesReport";
import ContractManagmentReports from "./ContractManagmentReports";
import AssetManagementReport from "./AssetManagementReport";

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
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
    const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
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
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>&#8249;</button>
                        <div className="header-main-content"><div className="header-text-group">
                            <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                            <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                        </div></div>
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>&#8250;</button>
                    </div>
                    {showMonthDropdown && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{MONTHS.map((m, idx) => (<div key={m} className={"dropdown-item" + (idx === date.getMonth() ? " active" : "")} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>))}</div></div>)}
                    {showYearDropdown && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map(y => (<div key={y} className={"dropdown-item" + (y === date.getFullYear() ? " active" : "")} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>))}</div></div>)}
                </div>
            )}
        />
    );
};

const Reports = () => {
    const employeeId = sessionStorage.getItem("employeeId");
    const token = sessionStorage.getItem("token");
    const [activeTab, setActiveTab] = useState("claims");
    const [userModules, setUserModules] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        employeeId: "",
        category: "",
        amount: "",
        minAmount: "",
        maxAmount: "",
        status: "",
        startDate: null,
        endDate: null
    });

    const [categories, setCategories] = useState([]);
    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Refs for dropdown management
    const employeeIdRef = useRef(null);
    const suggestionsRef = useRef(null);
    const tabNavRef = useRef(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollLimits = useCallback(() => {
        if (tabNavRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabNavRef.current;
            setCanScrollLeft(scrollLeft > 1);
            setCanScrollRight(scrollWidth - scrollLeft - clientWidth > 1);
        }
    }, []);

    const scrollTabs = (direction) => {
        if (tabNavRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = direction === 'left' 
                ? tabNavRef.current.scrollLeft - scrollAmount 
                : tabNavRef.current.scrollLeft + scrollAmount;
            
            tabNavRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
            setTimeout(checkScrollLimits, 300);
        }
    };

    useEffect(() => {
        checkScrollLimits();
        window.addEventListener('resize', checkScrollLimits);
        return () => {
            window.removeEventListener('resize', checkScrollLimits);
        };
    }, [checkScrollLimits]);

    useEffect(() => {
        const timer = setTimeout(checkScrollLimits, 150);
        return () => clearTimeout(timer);
    }, [activeTab, userModules, checkScrollLimits]);

    const fetchModuleAccess = useCallback(async () => {
        if (!employeeId || !token) return;
        try {
            const res = await api.get(`/v1/module-access/employee/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allowedModules = Object.keys(res.data)
                .filter(k => res.data[k] === true)
                .map(k => k.toUpperCase());
            setUserModules(allowedModules);
        } catch (err) {
            console.error("Module access fetch failed", err);
        }
    }, [employeeId, token]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await api.get("/claims/categories", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data || []);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        }
    }, [token]);

    useEffect(() => {
        fetchModuleAccess();
        fetchCategories();
    }, [fetchModuleAccess, fetchCategories]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setFilters({
            employeeId: "",
            category: "",
            amount: "",
            minAmount: "",
            maxAmount: "",
            status: "",
            startDate: null,
            endDate: null
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

    // Debounced version of fetchEmployeeSuggestions
    const debouncedFetchSuggestions = debounce(fetchEmployeeSuggestions, 300);

    // Handle employee ID input change
    const handleEmployeeIdChange = (value) => {
        setFilters(prev => ({ ...prev, employeeId: value }));
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
        setFilters(prev => ({ ...prev, employeeId: searchValue }));
        setShowEmployeeSuggestions(false);
        setEmployeeSuggestions([]);
        setHighlightedIndex(-1);
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

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                employeeIdRef.current && !employeeIdRef.current.contains(event.target)) {
                setShowEmployeeSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.employeeId) {
                // Extract employee ID from format "Name (ID)" or use as-is if it's just an ID
                const employeeIdMatch = filters.employeeId.match(/\(([^)]+)\)$/);
                const employeeIdToSend = employeeIdMatch ? employeeIdMatch[1] : filters.employeeId;
                params.append("employeeId", employeeIdToSend);
            }
            if (filters.category) params.append("category", filters.category);
            if (filters.amount) params.append("amount", filters.amount);
            if (filters.minAmount) params.append("minAmount", filters.minAmount);
            if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
            if (filters.status) params.append("status", filters.status);

            if (filters.startDate) {
                const y = filters.startDate.getFullYear();
                const m = String(filters.startDate.getMonth() + 1).padStart(2, '0');
                const d = String(filters.startDate.getDate()).padStart(2, '0');
                params.append("startDate", `${y}-${m}-${d}`);
            }
            if (filters.endDate) {
                const y = filters.endDate.getFullYear();
                const m = String(filters.endDate.getMonth() + 1).padStart(2, '0');
                const d = String(filters.endDate.getDate()).padStart(2, '0');
                params.append("endDate", `${y}-${m}-${d}`);
            }

            const res = await api.get(`/claims/reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportsData(res.data || []);
        } catch (err) {
            console.error("Failed to fetch report", err);
            alert("Error fetching report data");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (reportsData.length === 0) {
            alert("No data available to download");
            return;
        }

        const dataToExport = reportsData.map(item => ({
            "Claim ID": item.id,
            "Employee ID": getDisplayEmployeeId(item.employeeId),
            "Employee Name": item.name,
            "Category": item.category,
            "Amount": item.amount,
            "Expense Date": item.expenseDate ? formatDateToIST(item.expenseDate) : "N/A",
            "Submitted Date": item.submittedDate ? formatDateToIST(item.submittedDate) : "N/A",
            "Status": item.status,
            "Rejection Reason": item.rejectionReason || "N/A"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Claims Report");
        XLSX.writeFile(wb, `Claims_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const hasReportsAccess = userModules.includes("REPORTS");

    if (!hasReportsAccess && userModules.length > 0) {
        return (
            <Sidebar>
                <div className="reports-unauthorized">
                    <h2>Access Denied</h2>
                    <p>You do not have access to the Reports module.</p>
                </div>
            </Sidebar>
        );
    }


    return (
        <Sidebar>
            <div className="reports-page-container">
                <header className="reports-page-header">
                    <div className="header-title-wrapper">
                        <div>
                            <h1>Analytics & Reports Hub</h1>
                            <p>Generate and analyze comprehensive organization data insights</p>
                        </div>
                    </div>
                </header>

                <div className="tab-nav-wrapper">
                    {canScrollLeft && (
                        <button className="nav-arrow-btn left" onClick={() => scrollTabs('left')}>
                            <FiChevronLeft />
                        </button>
                    )}
                    <div className="reports-tab-nav" ref={tabNavRef} onScroll={checkScrollLimits}>
                        <button
                            className={`tab-link ${activeTab === "claims" ? "active" : ""}`}
                            onClick={() => setActiveTab("claims")}
                        >
                            Claims Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "payslips" ? "active" : ""}`}
                            onClick={() => setActiveTab("payslips")}
                        >
                            Payslips Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "travel" ? "active" : ""}`}
                            onClick={() => setActiveTab("travel")}
                        >
                            Travel Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "performance" ? "active" : ""}`}
                            onClick={() => setActiveTab("performance")}
                        >
                            Performance Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "timesheet" ? "active" : ""}`}
                            onClick={() => setActiveTab("timesheet")}
                        >
                            Timesheet Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "allocations" ? "active" : ""}`}
                            onClick={() => setActiveTab("allocations")}
                        >
                            Allocations Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "helpdesk" ? "active" : ""}`}
                            onClick={() => setActiveTab("helpdesk")}
                        >
                            Helpdesk Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "exit" ? "active" : ""}`}
                            onClick={() => setActiveTab("exit")}
                        >
                            Exit Management Report
                        </button>
                        {/* <button
                            className={`tab-link ${activeTab === "grievance" ? "active" : ""}`}
                            onClick={() => setActiveTab("grievance")}
                        >
                            Grievance Report
                        </button> */}
                        <button
                            className={`tab-link ${activeTab === "onboarding" ? "active" : ""}`}
                            onClick={() => setActiveTab("onboarding")}
                        >
                            Onboarding Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "preonboarding" ? "active" : ""}`}
                            onClick={() => setActiveTab("preonboarding")}
                        >
                            Preonboarding Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "employeeMaster" ? "active" : ""}`}
                            onClick={() => setActiveTab("employeeMaster")}
                        >
                            Employee Master Data
                        </button>
                        <button
                            className={`tab-link ${activeTab === "leaves" ? "active" : ""}`}
                            onClick={() => setActiveTab("leaves")}
                        >
                            Leaves Report
                        </button>
                        <button
                            className={`tab-link ${activeTab === "contract" ? "active" : ""}`}
                            onClick={() => setActiveTab("contract")}
                        >
                            Contract Management
                        </button>
                        <button
                            className={`tab-link ${activeTab === "assets" ? "active" : ""}`}
                            onClick={() => setActiveTab("assets")}
                        >
                            Asset Management
                        </button>
                    </div>
                    {canScrollRight && (
                        <button className="nav-arrow-btn right" onClick={() => scrollTabs('right')}>
                            <FiChevronRight />
                        </button>
                    )}
                </div>

                {activeTab === "claims" && (
                    <div className="reports-content-section fadeIn">
                        <div className="filters-card">

                            <div className="filters-grid">
                                <div className="filter-group full-width" style={{ position: 'relative' }}>
                                    <label>Employee ID</label>
                                    <input
                                        ref={employeeIdRef}
                                        type="text"
                                        name="employeeId"
                                        value={filters.employeeId}
                                        onChange={(e) => handleEmployeeIdChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ex: EMP001"
                                    />
                                    <EmployeeSuggestion
                                        suggestions={employeeSuggestions}
                                        showSuggestions={showEmployeeSuggestions}
                                        suggestionsLoading={suggestionsLoading}
                                        onSelect={handleSuggestionClick}
                                        suggestionsRef={suggestionsRef}
                                        highlightedIndex={highlightedIndex}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label>Category</label>
                                    <select name="category" value={filters.category} onChange={handleFilterChange}>
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.categoryName}>{cat.categoryName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Status</label>
                                    <select name="status" value={filters.status} onChange={handleFilterChange}>
                                        <option value="">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved by Manager">Approved by Manager</option>
                                        <option value="Approved by Finance">Approved by Finance</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Rejected by Manager">Rejected by Manager</option>
                                        <option value="Rejected by Finance">Rejected by Finance</option>
                                        <option value="Rejected by HR">Rejected by HR</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Min Amount</label>
                                    <input
                                        type="number"
                                        name="minAmount"
                                        value={filters.minAmount}
                                        onChange={handleFilterChange}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="filter-group">
                                    <label>Max Amount</label>
                                    <input
                                        type="number"
                                        name="maxAmount"
                                        value={filters.maxAmount}
                                        onChange={handleFilterChange}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="filter-group">
                                    <label> From Date</label>
                                    <SmartDatePicker
                                        value={filters.startDate}
                                        onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                                        placeholder="DD-MM-YYYY"
                                    />
                                </div>
                                <div className="filter-group">
                                    <label> To Date</label>
                                    <SmartDatePicker
                                        value={filters.endDate}
                                        onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                                        placeholder="DD-MM-YYYY"
                                        minDate={filters.startDate}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label>Exact Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={filters.amount}
                                        onChange={handleFilterChange}
                                        placeholder="0.00"
                                    />
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
                                            <th>ID</th>
                                            <th>Emp ID</th>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportsData.length > 0 ? (
                                            reportsData.map(claim => (
                                                <tr key={claim.id}>
                                                    <td>#{claim.id}</td>
                                                    <td>{getDisplayEmployeeId(claim.employeeId)}</td>
                                                    <td>{claim.name}</td>
                                                    <td>{claim.category}</td>
                                                    <td>₹{claim.amount.toLocaleString()}</td>
                                                    <td>{claim.submittedDate ? formatDateToIST(claim.submittedDate) : "N/A"}</td>
                                                    <td>
                                                        <span className={`status-pill ${claim.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                            {claim.status}
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
                )}

                {activeTab === "payslips" && (
                    <PayslipsReport />
                )}

                {activeTab === "travel" && (
                    <TravelReport />
                )}

                {activeTab === "performance" && (
                    <PerformanceReport />
                )}

                {activeTab === "timesheet" && (
                    <TimesheetReport />
                )}

                {activeTab === "allocations" && (
                    <AllocationsReport />
                )}

                {activeTab === "helpdesk" && (
                    <Helpdeskreport />
                )}

                {activeTab === "exit" && (
                    <Exitmanagementreport />
                )}

                {activeTab === "grievance" && (
                    <GrievanceReport />
                )}

                {activeTab === "onboarding" && (
                    <Onboardingreport />
                )}

                {activeTab === "preonboarding" && (
                    <PreonboardingReport />
                )}

                {activeTab === "employeeMaster" && (
                    <Employeereport />
                )}

                {activeTab === "leaves" && (
                    <LeavesReport />
                )}

                {activeTab === "contract" && (
                    <ContractManagmentReports />
                )}

                {activeTab === "assets" && (
                    <AssetManagementReport />
                )}
            </div>
        </Sidebar>
    );
};

export default Reports;
