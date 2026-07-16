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
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>&#8249;</button>
                        <div className="header-main-content"><div className="header-text-group">
                            <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                            <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                        </div></div>
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>&#8250;</button>
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

const TimesheetReport = () => {
    const token = sessionStorage.getItem("token");
    const [filters, setFilters] = useState({
        employeeId: "",
        clientId: "",
        projectId: "",
        status: "All",
        startDate: null,
        endDate: null
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

    // Refs for dropdown management
    const employeeIdRef = useRef(null);
    const suggestionsRef = useRef(null);

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
            if (!filters.clientId) {
                setProjects([]);
                setFilters(prev => ({ ...prev, projectId: "" }));
                return;
            }
            try {
                const res = await api.get(`/projects/customer/${filters.clientId}/all-projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching projects:", err);
            }
        };
        fetchProjects();
    }, [filters.clientId, token]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setFilters({
            employeeId: "",
            clientId: "",
            projectId: "",
            status: "All",
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
                params.append("employeeId", getFullEmployeeId(employeeIdToSend));
            }
            if (filters.clientId) params.append("clientId", filters.clientId);
            if (filters.projectId) params.append("projectId", filters.projectId);
            if (filters.status !== "All") params.append("status", filters.status);

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

            const res = await api.get(`/daily-entry/fetch-reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportsData(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch timesheet report", err);
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
            "Date": formatToDDMMYYYY(item.date),
            "Employee ID": getDisplayEmployeeId(item.employeeId),
            "Employee Name": `${item.employeeFirstName || ""} ${item.employeeLastName || ""}`.trim(),
            "Client": item.clientName || "N/A",
            "Project": item.projectName || "N/A",
            "Login Time": item.loginTime || "N/A",
            "Logout Time": item.logoutTime || "N/A",
            "Total Hours": item.totalHours || 0,
            "Status": item.frozen ? "Frozen" : "Active"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Timesheet Report");
        XLSX.writeFile(wb, `Timesheet_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                        <label>Client</label>
                        <select name="clientId" value={filters.clientId} onChange={handleFilterChange}>
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
                            disabled={!filters.clientId}
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="All">All statuses</option>
                            <option value="Active">Active</option>
                            <option value="Frozen">Frozen</option>
                        </select>
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
                                <th>Client</th>
                                <th>Project</th>
                                <th>Date</th>
                                <th>Login</th>
                                <th>Logout</th>
                                <th>Status</th>
                                <th>Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.length > 0 ? (
                                reportsData.map((item, idx) => (
                                    <tr key={idx}>

                                        <td>{getDisplayEmployeeId(item.employeeId)}</td>
                                        <td>{item.clientName || "N/A"}</td>
                                        <td>{item.projectName || "N/A"}</td>
                                        <td>{formatToDDMMYYYY(item.date)}</td>
                                        <td>{item.loginTime || "N/A"}</td>
                                        <td>{item.logoutTime || "N/A"}</td>
                                        <td>
                                            <span className={`status-pill ${item.frozen ? "rejected" : "approved"}`}>
                                                {item.frozen ? "Frozen" : "Active"}
                                            </span>
                                        </td>
                                        <td>{item.totalHours || 0} hrs</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="no-data">
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

export default TimesheetReport;
