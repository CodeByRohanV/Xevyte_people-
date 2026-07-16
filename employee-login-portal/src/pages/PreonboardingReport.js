import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api";
import * as XLSX from 'xlsx';
import { FiFilter, FiDownload, FiSearch, FiUsers, FiMapPin, FiBriefcase, FiCheckCircle, FiClock, FiSettings, FiUser } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Reports.css";

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

const PreonboardingReport = () => {
    const token = sessionStorage.getItem("token");

    const [filters, setFilters] = useState({
        employeeId: "",
        position: "",
        client: "",
        status: "",
        startDate: null,
        endDate: null
    });

    const [options, setOptions] = useState({
        clients: [],
        positions: [],
        statuses: []
    });

    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState([
        "Applicant ID", "Full Name", "Position", "Client", "Status", "Applied Date", "Email"
    ]);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Refs for dropdown management
    const employeeIdRef = useRef(null);
    const suggestionsRef = useRef(null);

    const allColumns = [
        "Applicant ID", "Full Name", "Email", "Phone", "Position", "Client", "Status",
        "Applied Date", "AM ID", "Finance ID", "HR ID", "Approved CTC", "Approved Location", "Approved DOJ"
    ];

    const fetchOptions = useCallback(async () => {
        try {
            const [clientRes, posRes, statusRes] = await Promise.all([
                api.get("/v1/applicants/clients", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/v1/applicants/positions", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/v1/applicants/statuses", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setOptions({
                clients: clientRes.data || [],
                positions: posRes.data || [],
                statuses: statusRes.data || []
            });
        } catch (err) {
            console.error("Failed to fetch filter options", err);
        }
    }, [token]);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleColumnToggle = (col) => {
        setSelectedColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const handleClear = () => {
        setFilters({
            employeeId: "",
            position: "",
            client: "",
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
            if (filters.position) params.append("position", filters.position);
            if (filters.client) params.append("client", filters.client);
            if (filters.status) params.append("status", filters.status);

            const formatDate = (date) => {
                if (!date) return null;
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            if (filters.startDate) params.append("startDate", formatDate(filters.startDate));
            if (filters.endDate) params.append("endDate", formatDate(filters.endDate));

            const res = await api.get(`/v1/applicants/reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportsData(res.data || []);
        } catch (err) {
            console.error("Failed to fetch pre-onboarding report", err);
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

        const dataToExport = reportsData.map(app => {
            const row = {};
            if (selectedColumns.includes("Applicant ID")) row["Applicant ID"] = getDisplayEmployeeId(app.applicantId);
            if (selectedColumns.includes("Full Name")) row["Full Name"] = `${app.firstName} ${app.lastName}`;
            if (selectedColumns.includes("Email")) row["Email"] = app.email;
            if (selectedColumns.includes("Phone")) row["Phone"] = app.phone;
            if (selectedColumns.includes("Position")) row["Position"] = app.position;
            if (selectedColumns.includes("Client")) row["Client"] = app.client;
            if (selectedColumns.includes("Status")) row["Status"] = app.status;
            if (selectedColumns.includes("Applied Date")) row["Applied Date"] = app.timestamp ? formatToDDMMYYYY(app.timestamp.split(' ')[0]) : "N/A";
            if (selectedColumns.includes("AM ID")) row["AM ID"] = getDisplayEmployeeId(app.amId);
            if (selectedColumns.includes("Finance ID")) row["Finance ID"] = getDisplayEmployeeId(app.financeId);
            if (selectedColumns.includes("HR ID")) row["HR ID"] = getDisplayEmployeeId(app.hrId);
            if (selectedColumns.includes("Approved CTC")) row["Approved CTC"] = app.approvedCtc;
            if (selectedColumns.includes("Approved Location")) row["Approved Location"] = app.approvedLocation;
            if (selectedColumns.includes("Approved DOJ")) row["Approved DOJ"] = formatToDDMMYYYY(app.approvedDoj);
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pre-onboarding Report");
        XLSX.writeFile(wb, `Preonboarding_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                        <label>Designation (Position)</label>
                        <select name="position" value={filters.position} onChange={handleFilterChange}>
                            <option value="">All Positions</option>
                            {options.positions.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Client</label>
                        <select name="client" value={filters.client} onChange={handleFilterChange}>
                            <option value="">All Clients</option>
                            {options.clients.map(cli => (
                                <option key={cli} value={cli}>{cli}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">All Statuses</option>
                            {options.statuses.map(st => (
                                <option key={st} value={st}>{st}</option>
                            ))}
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
                            minDate={filters.startDate}
                        />
                    </div>

                    <div className="filter-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Select Columns To Export</label>
                        <div className="columns-selector-grid">
                            <div className="selector-actions">
                                <button
                                    className="selector-btn select-all"
                                    onClick={() => setSelectedColumns([...allColumns])}
                                >
                                    Select All
                                </button>
                                <button
                                    className="selector-btn deselect-all"
                                    onClick={() => setSelectedColumns([])}
                                >
                                    Deselect All
                                </button>
                            </div>
                            {allColumns.map(col => (
                                <label key={col} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(col)}
                                        onChange={() => handleColumnToggle(col)}
                                        className="checkbox-input"
                                    />
                                    <span>{col}</span>
                                </label>
                            ))}
                        </div>
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
                                <th>Applicant ID</th>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Client</th>
                                <th>Applied Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.length > 0 ? (
                                reportsData.map(app => (
                                    <tr key={app.applicantId}>
                                        <td>{getDisplayEmployeeId(app.applicantId)}</td>
                                        <td>{app.firstName} {app.lastName}</td>
                                        <td>{app.position}</td>
                                        <td>{app.client}</td>
                                        <td>{app.timestamp ? formatToDDMMYYYY(app.timestamp.split(' ')[0]) : "N/A"}</td>
                                        <td>
                                            <span className={`status-pill ${app.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data">
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

export default PreonboardingReport;
