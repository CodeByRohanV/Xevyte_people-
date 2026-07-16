import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api";
import * as XLSX from 'xlsx';
import { FiFilter, FiDownload, FiSearch, FiUsers, FiMapPin, FiBriefcase, FiPhone, FiSettings } from "react-icons/fi";

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

    const MONTHS = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

    return (
        <DatePicker
            className="datepicker-input"
            selected={value instanceof Date && !isNaN(value) ? value : null}
            disabled={disabled}
            onChange={(date) => {
                onChange(date);
                setTimeout(() => {
                    setOpen(false);
                    setShowMonthDropdown(false);
                    setShowYearDropdown(false);
                }, 20);
            }}
            onSelect={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            open={open}
            onInputClick={() => setOpen(true)}
            onClickOutside={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            placeholderText={placeholder}
            dateFormat="dd-MM-yyyy"
            calendarClassName="no-gap-calendar"
            dayClassName={() => "no-gap-day"}
            wrapperClassName="full-width-picker"
            renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => (
                <div className="custom-calendar-header">
                    <div className="calendar-header-banner">
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>‹</button>
                        <div className="header-main-content">
                            <div className="header-text-group">
                                <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                                <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                            </div>
                        </div>
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>›</button>
                    </div>
                    {showMonthDropdown && (
                        <div className="header-dropdown month-dropdown">
                            <div className="dropdown-scroll-pane">
                                {MONTHS.map((m, idx) => (
                                    <div key={m} className={`dropdown-item${idx === date.getMonth() ? " active" : ""}`} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    {showYearDropdown && (
                        <div className="header-dropdown year-dropdown">
                            <div className="dropdown-scroll-pane">
                                {years.map(y => (
                                    <div key={y} className={`dropdown-item${y === date.getFullYear() ? " active" : ""}`} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>
                                ))}
                            </div>
                        </div>
                    )}
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

const Employeereport = () => {
    const token = sessionStorage.getItem("token");

    const [filters, setFilters] = useState({
        employeeIds: "",
        gender: "",
        contactNo: "",
        role: "",
        workLocation: "",
        startDate: null,
        endDate: null
    });

    const [options, setOptions] = useState({
        roles: [],
        locations: [],
        genders: []
    });

    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Refs for dropdown management
    const employeeIdsRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Columns requested for selection logic
    const allExportColumns = [
        { label: "Employee ID", key: "employeeId" },
        { label: "First Name", key: "firstName" },
        { label: "Last Name", key: "lastName" },
        { label: "Designation", key: "role" },
        { label: "Work Location", key: "workLocation" },
        { label: "Joining Date", key: "joiningDate" },
        { label: "Assigned Manager", key: "assignedManagerId" },
        { label: "Assigned HR", key: "assignedHrId" },
        { label: "Assigned Finance", key: "assignedFinanceId" },
        { label: "Gender", key: "gender" },
        { label: "Date of Birth", key: "dateOfBirth" },
        { label: "Aadhaar Num", key: "aadharNo" },
        { label: "PAN Num", key: "panNo" },
        { label: "Blood Group", key: "bloodGroup" },
        { label: "Contact Number", key: "contactNo" },
        { label: "Emergency Contact", key: "emergencyContactNumber" },
        { label: "Work Mail", key: "email" },
        { label: "Personal Mail", key: "personalMail" },
        { label: "Present Address", key: "presentAddress" },
        { label: "Permanent Address", key: "address" },
        { label: "Holder Name", key: "accountHolderName" },
        { label: "Account Number", key: "bankAccountNumber" },
        { label: "Bank Name", key: "bankName" },
        { label: "IFSC Code", key: "bankIfscCode" },
        { label: "ESI Num", key: "esiNumber" },
        { label: "ESI Member ID", key: "esiDispensary" },
        { label: "UAN Num", key: "uanNumber" },
        { label: "PF ID", key: "pfMemberId" },
        { label: "Insurance Relation", key: "insurerRelationship" },
        { label: "Insurance Name", key: "insurerName" },
        { label: "Insurance DOB", key: "insurerDateOfBirth" }
    ];

    const [selectedColumns, setSelectedColumns] = useState(
        allExportColumns.map(col => col.key) // Default all selected
    );

    const fetchOptions = useCallback(async () => {
        try {
            const [roleRes, locRes, genRes] = await Promise.all([
                api.get("/employees/distinct-roles", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/employees/distinct-locations", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/employees/distinct-genders", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setOptions({
                roles: roleRes.data || [],
                locations: locRes.data || [],
                genders: genRes.data || []
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

    const handleColumnToggle = (key) => {
        setSelectedColumns(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleClear = () => {
        setFilters({
            employeeIds: "",
            gender: "",
            contactNo: "",
            role: "",
            workLocation: "",
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

    // Handle employee IDs input change (comma-separated support)
    const handleEmployeeIdsChange = (value) => {
        setFilters(prev => ({ ...prev, employeeIds: value }));
        setHighlightedIndex(-1); // Reset highlighted index when typing
        
        // Extract the last typed ID (after the last comma or space)
        const ids = value.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
        const lastId = ids[ids.length - 1] || "";
        
        if (lastId.length >= 1) {
            debouncedFetchSuggestions(lastId);
        } else {
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
        }
    };

    // Handle suggestion click for comma-separated employee IDs
    const handleSuggestionClick = (employee) => {
        const currentIds = filters.employeeIds.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
        
        // Replace last ID with the selected employee
        if (currentIds.length > 0) {
            currentIds[currentIds.length - 1] = `${employee.firstName} ${employee.lastName} (${getDisplayEmployeeId(employee.employeeId)})`;
        } else {
            currentIds.push(`${employee.firstName} ${employee.lastName} (${getDisplayEmployeeId(employee.employeeId)})`);
        }
        
        const newEmployeeIds = currentIds.join(", ");
        setFilters(prev => ({ ...prev, employeeIds: newEmployeeIds }));
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
                employeeIdsRef.current && !employeeIdsRef.current.contains(event.target)) {
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
            if (filters.employeeIds) {
                // Handle multiple IDs with full name format
                const idList = filters.employeeIds.split(',').map(id => id.trim()).filter(id => id !== "");
                idList.forEach(id => {
                    // Extract employee ID from format "Name (ID)" or use as-is if it's just an ID
                    const employeeIdMatch = id.match(/\(([^)]+)\)$/);
                    const employeeIdToSend = employeeIdMatch ? employeeIdMatch[1] : id;
                    params.append("employeeIds", employeeIdToSend);
                });
            }
            if (filters.gender) params.append("gender", filters.gender);
            if (filters.contactNo) params.append("contactNo", filters.contactNo);
            if (filters.role) params.append("role", filters.role);
            if (filters.workLocation) params.append("workLocation", filters.workLocation);

            const formatDate = (date) => {
                if (!date) return null;
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            if (filters.startDate) params.append("startDate", formatDate(filters.startDate));
            if (filters.endDate) params.append("endDate", formatDate(filters.endDate));

            const res = await api.get(`/employees/master-data-report?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportsData(res.data || []);
        } catch (err) {
            console.error("Failed to fetch employee master data", err);
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

        const dataToExport = reportsData.map(emp => {
            const row = {};
            allExportColumns.forEach(field => {
                if (selectedColumns.includes(field.key)) {
                    let val = emp[field.key];
                    if (field.key === "employeeId" || field.key === "assignedManagerId" || field.key === "assignedHrId" || field.key === "assignedFinanceId") {
                        val = getDisplayEmployeeId(val);
                    }
                    if (field.key.toLowerCase().includes("date")) {
                        val = formatToDDMMYYYY(val);
                    }
                    row[field.label] = val || "N/A";
                }
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employee Master Data");
        XLSX.writeFile(wb, `Employee_Master_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="reports-content-section fadeIn">
            <div className="filters-card">

                <div className="filters-grid">
                    <div className="filter-group" style={{ position: 'relative' }}>
                        <label>Employee IDs</label>
                        <input
                            ref={employeeIdsRef}
                            type="text"
                            name="employeeIds"
                            value={filters.employeeIds}
                            onChange={(e) => handleEmployeeIdsChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ex: EMP001, EMP002"
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
                        <label>Gender</label>
                        <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            {options.genders.filter(g => g !== 'Male' && g !== 'Female').map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Contact Number</label>
                        <input
                            type="text"
                            name="contactNo"
                            placeholder="Search contact..."
                            value={filters.contactNo}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Designation (Role)</label>
                        <select name="role" value={filters.role} onChange={handleFilterChange}>
                            <option value="">All Roles</option>
                            {options.roles.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Work Location</label>
                        <select name="workLocation" value={filters.workLocation} onChange={handleFilterChange}>
                            <option value="">All Locations</option>
                            {options.locations.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label> Joining From</label>
                        <SmartDatePicker
                            value={filters.startDate}
                            onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                        placeholder="DD-MM-YYYY"
                        />
                    </div>

                    <div className="filter-group">
                        <label> Joining To</label>
                        <SmartDatePicker
                            value={filters.endDate}
                            onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                        placeholder="DD-MM-YYYY"
                        />
                    </div>

                    <div className="filter-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Select Fields For Download</label>
                        <div className="columns-selector-grid">
                            <div className="selector-actions">
                                <button
                                    className="selector-btn select-all"
                                    onClick={() => setSelectedColumns(allExportColumns.map(c => c.key))}
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
                            {allExportColumns.map(field => (
                                <label key={field.key} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(field.key)}
                                        onChange={() => handleColumnToggle(field.key)}
                                        className="checkbox-input"
                                    />
                                    <span>{field.label}</span>
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
                                <th>Emp ID</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Contact</th>
                                <th>Designation</th>
                                <th>Location</th>
                                <th>Joining Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.length > 0 ? (
                                reportsData.map(emp => (
                                    <tr key={emp.employeeId}>
                                        <td>{getDisplayEmployeeId(emp.employeeId)}</td>
                                        <td>{emp.firstName} {emp.lastName}</td>
                                        <td>{emp.gender}</td>
                                        <td>{emp.contactNo || "N/A"}</td>
                                        <td>{emp.role}</td>
                                        <td>{emp.workLocation}</td>
                                        <td>{formatToDDMMYYYY(emp.joiningDate)}</td>
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

export default Employeereport;
