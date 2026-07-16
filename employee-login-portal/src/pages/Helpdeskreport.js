import React, { useState, useEffect, useRef } from "react";
import { formatDateToIST } from '../utils/DateUtils';
import api from "../api";
import * as XLSX from 'xlsx';
import { FiFilter, FiDownload, FiSearch, FiTag, FiUser } from "react-icons/fi";
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

const Helpdeskreport = () => {
    const token = sessionStorage.getItem("token");

    const [filters, setFilters] = useState({
        employeeId: "",
        ticketType: "",
        category: "",
        subcategory: "",
        status: "",
        startDate: null,
        endDate: null
    });

    const [ticketTypes, setTicketTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
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

    const getCategoryName = (id) => {
        const c = categories.find(cat => cat.id === parseInt(id));
        return c ? c.categoryName : "";
    };

    const getSubCategoryName = (id) => {
        const s = subcategories.find(sub => sub.id === parseInt(id));
        return s ? s.subCategoryName : "";
    };

    // Fetch ticket types on component mount
    useEffect(() => {
        fetchTicketTypes();
    }, []);

    // Fetch categories when ticket type changes
    useEffect(() => {
        if (filters.ticketType) {
            fetchCategories(filters.ticketType);
        } else {
            setCategories([]);
            setSubcategories([]);
        }
    }, [filters.ticketType]);

    // Fetch subcategories when category changes
    useEffect(() => {
        if (filters.category) {
            fetchSubcategories(filters.category);
        } else {
            setSubcategories([]);
        }
    }, [filters.category]);

    const fetchTicketTypes = async () => {
        try {
            const res = await api.get("/v1/helpdesk-categories/ticket-types", {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Convert list of strings to {value, label} objects
            const types = (res.data || []).map(type => ({
                value: type,
                label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
            }));
            setTicketTypes(types);
        } catch (err) {
            console.error("Failed to fetch ticket types", err);
            // Fallback to static if backend fails or is empty
            setTicketTypes([
                { value: "NEW_TICKET", label: "New Ticket" },
                { value: "CHANGE_REQUEST", label: "Change Request" }
            ]);
        }
    };

    const fetchCategories = async (ticketType) => {
        try {
            const res = await api.get(`/v1/helpdesk-categories/ticket-type?ticketType=${ticketType}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data || []);
        } catch (err) {
            console.error("Failed to fetch categories", err);
            setCategories([]);
        }
    };

    const fetchSubcategories = async (categoryId) => {
        try {
            const res = await api.get(`/v1/helpdesk-categories/${categoryId}/subcategories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubcategories(res.data || []);
        } catch (err) {
            console.error("Failed to fetch subcategories", err);
            setSubcategories([]);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };

            // Reset dependent filters
            if (name === "ticketType") {
                newFilters.category = "";
                newFilters.subcategory = "";
            } else if (name === "category") {
                newFilters.subcategory = "";
            }

            return newFilters;
        });
    };

    const handleClear = () => {
        setFilters({
            employeeId: "",
            ticketType: "",
            category: "",
            subcategory: "",
            status: "",
            startDate: null,
            endDate: null
        });
        setReportsData([]);
        setCategories([]);
        setSubcategories([]);
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
            if (filters.ticketType) params.append("ticketType", filters.ticketType);
            if (filters.category) params.append("category", getCategoryName(filters.category));
            if (filters.subcategory) params.append("subcategory", getSubCategoryName(filters.subcategory));
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

            const res = await api.get(`/tickets/reports?${params.toString()}`, {
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
            "Ticket ID": item.id,
            "Employee ID": getDisplayEmployeeId(item.employeeId),
            "Ticket Type": item.ticketType,
            "Category": item.category,
            "Subcategory": item.subcategory,
            "Issue Summary": item.issueSummary,
            "Status": item.status,
            "Team": item.teamName,
            "Assigned To": getDisplayEmployeeId(item.assignedTo) || "N/A",
            "Created Date": item.createdAt ? formatDateToIST(item.createdAt) : "N/A",
            "Rejection Reason": item.rejectionReason || "N/A"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Helpdesk Report");
        XLSX.writeFile(wb, `Helpdesk_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getStatusClass = (status) => {
        if (!status) return "";
        return status.toLowerCase().replace(/\s+/g, '-');
    };

    return (
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
                        <label>Ticket Type</label>
                        <select name="ticketType" value={filters.ticketType} onChange={handleFilterChange}>
                            <option value="">All Types</option>
                            {ticketTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Category</label>
                        <select
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            disabled={!filters.ticketType}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Subcategory</label>
                        <select
                            name="subcategory"
                            value={filters.subcategory}
                            onChange={handleFilterChange}
                            disabled={!filters.category}
                        >
                            <option value="">All Subcategories</option>
                            {subcategories.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.subCategoryName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="PENDING_MANAGER">Pending Manager</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REOPENED">Reopened</option>
                            <option value="REJECTED_BY_MANAGER">Rejected by Manager</option>
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
                                <th>Ticket ID</th>
                                <th>Emp ID</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Subcategory</th>
                                <th>Issue Summary</th>
                                <th>Status</th>
                                <th>Team</th>
                                <th>Assigned To</th>
                                <th>Created Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.length > 0 ? (
                                reportsData.map(ticket => (
                                    <tr key={ticket.id}>
                                        <td>#{ticket.id}</td>
                                        <td>{getDisplayEmployeeId(ticket.employeeId)}</td>
                                        <td>{ticket.ticketType ? ticket.ticketType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "N/A"}</td>
                                        <td>{ticket.category}</td>
                                        <td>{ticket.subcategory}</td>
                                        <td className="issue-summary-cell">{ticket.issueSummary}</td>
                                        <td>
                                            <span className={`status-pill ${getStatusClass(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td>{ticket.teamName || "N/A"}</td>
                                        <td>{getDisplayEmployeeId(ticket.assignedTo) || "Unassigned"}</td>
                                        <td>{ticket.createdAt ? formatDateToIST(ticket.createdAt) : "N/A"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="no-data">
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

export default Helpdeskreport;
