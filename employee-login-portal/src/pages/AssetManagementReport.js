import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import {
    FiFilter, FiDownload, FiSearch, FiUser, FiTag, FiBox,
    FiMapPin
} from "react-icons/fi";
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

const STATUS_COLORS = {
    IN_STOCK: { bg: "#f0fdf4", color: "#15803d", label: "In Stock" },
    ALLOCATED: { bg: "#eff6ff", color: "#1d4ed8", label: "Allocated" },
    DAMAGED: { bg: "#fff7ed", color: "#c2410c", label: "Damaged" },
    LOST: { bg: "#fef2f2", color: "#b91c1c", label: "Lost" },
    UNDER_REPAIR: { bg: "#faf5ff", color: "#7c3aed", label: "Under Repair" },
    OUT_OF_STOCK: { bg: "#f1f5f9", color: "#64748b", label: "Out of stock" }
};


const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "-";
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

const AssetManagementReport = () => {
    const token = sessionStorage.getItem("token");

    // ─── Filters ─────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        reportType: "assets",      // "assets" | "allocations"
        assetTag: "",
        employeeId: "",
        category: "",
        status: "",
        location: "",
        fromDate: null,
        toDate: null
    });

    // ─── Data ─────────────────────────────────────────────────────────
    const [assets, setAssets] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Refs for dropdown management
    const employeeIdRef = useRef(null);
    const suggestionsRef = useRef(null);

    // ─── Bootstrap ────────────────────────────────────────────────────
    useEffect(() => {
        fetchCategories();
    }, []);

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

    const fetchCategories = async () => {
        try {
            const res = await api.get("/assets/categories", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data || []);
        } catch (e) {
            console.error("Category fetch failed", e);
        }
    };

    // ─── Filter helpers ───────────────────────────────────────────────────────
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

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

    const handleClear = () => {
        setFilters({
            reportType: "assets",
            assetTag: "",
            employeeId: "",
            category: "",
            status: "",
            location: "",
            fromDate: null,
            toDate: null
        });
        setGenerated(false);
    };

    // ─── Generate report ──────────────────────────────────────────────────────
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const [aRes, allRes] = await Promise.all([
                api.get("/assets", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/assets/allocations", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAssets(Array.isArray(aRes.data) ? aRes.data : (aRes.data?.content || aRes.data?.data || []));
            setAllocations(Array.isArray(allRes.data) ? allRes.data : (allRes.data?.content || allRes.data?.data || []));
            setGenerated(true);
        } catch {
            alert("Error fetching asset data");
        } finally {
            setLoading(false);
        }
    };

    // ─── Generate report with employee ID extraction ──────────────────────
    const handleGenerateWithEmployeeFilter = async () => {
        setLoading(true);
        try {
            let assetUrl = "/assets";
            let allocationUrl = "/assets/allocations";
            
            // Extract employee ID from format "Name (ID)" or use as-is if it's just an ID
            let employeeIdParam = "";
            if (filters.employeeId) {
                const employeeIdMatch = filters.employeeId.match(/\(([^)]+)\)$/);
                employeeIdParam = employeeIdMatch ? employeeIdMatch[1] : filters.employeeId;
                assetUrl += `?employeeId=${encodeURIComponent(employeeIdParam)}`;
                allocationUrl += `?employeeId=${encodeURIComponent(employeeIdParam)}`;
            }
            
            const [aRes, allRes] = await Promise.all([
                api.get(assetUrl, { headers: { Authorization: `Bearer ${token}` } }),
                api.get(allocationUrl, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAssets(Array.isArray(aRes.data) ? aRes.data : (aRes.data?.content || aRes.data?.data || []));
            setAllocations(Array.isArray(allRes.data) ? allRes.data : (allRes.data?.content || allRes.data?.data || []));
            setGenerated(true);
        } catch {
            alert("Error fetching asset data");
        } finally {
            setLoading(false);
        }
    };

    // ─── Filtered datasets ────────────────────────────────────────────────────
    const filteredAssets = (Array.isArray(assets) ? assets : []).filter(a => {
        const matchTag = !filters.assetTag || (a.assetTag || "").toLowerCase().includes(filters.assetTag.toLowerCase());
        const matchCat = !filters.category || (a.category?.name || "") === filters.category;
        const matchStatus = !filters.status || a.status === filters.status;
        const matchLocation = !filters.location || (a.location || "").toLowerCase().includes(filters.location.toLowerCase());
        const createdAt = a.createdAt ? new Date(a.createdAt) : null;
        const matchFrom = !filters.fromDate || (createdAt && createdAt >= filters.fromDate);
        const matchTo = !filters.toDate || (createdAt && createdAt <= filters.toDate);
        return matchTag && matchCat && matchStatus && matchLocation && matchFrom && matchTo;
    });

    const filteredAllocations = (Array.isArray(allocations) ? allocations : []).filter(al => {
        const matchEmp = (() => {
            if (!filters.employeeId) return true;
            const employeeIdMatch = filters.employeeId.match(/\(([^)]+)\)$/);
            const cleanQuery = getDisplayEmployeeId(employeeIdMatch ? employeeIdMatch[1] : filters.employeeId).toLowerCase();
            const cleanEmpId = getDisplayEmployeeId(al.employee?.employeeId || "").toLowerCase();
            return cleanEmpId.includes(cleanQuery);
        })();
        const matchTag = !filters.assetTag || (al.asset?.assetTag || "").toLowerCase().includes(filters.assetTag.toLowerCase());
        const matchCat = !filters.category || (al.asset?.category?.name || "") === filters.category;
        // Active = no returnDate, Returned = has returnDate
        const isReturned = !!al.returnDate;
        const matchStatus = !filters.status
            || (filters.status === "ACTIVE" && !isReturned)
            || (filters.status === "RETURNED" && isReturned);
        const allocDate = al.allocationDate ? new Date(al.allocationDate) : null;
        const matchFrom = !filters.fromDate || (allocDate && allocDate >= filters.fromDate);
        const matchTo = !filters.toDate || (allocDate && allocDate <= filters.toDate);
        return matchEmp && matchTag && matchCat && matchStatus && matchFrom && matchTo;
    });

    // ─── Excel export ─────────────────────────────────────────────────────────
    const handleDownload = () => {
        const wb = XLSX.utils.book_new();

        if (filters.reportType === "assets") {
            if (filteredAssets.length === 0) { alert("No data to export"); return; }
            const rows = filteredAssets.map(a => ({
                "Asset ID": a.assetId || "-",
                "Asset Tag": a.assetTag || "-",
                "Serial No": a.serialNumber || "-",
                "Category": a.category?.name || "-",
                "Sub-Category": a.subCategory?.name || "-",
                "Asset Model Name": a.dynamicValues?.["Asset Model Name"] || "-",
                "Configuration": a.dynamicValues?.["Configuration"] || "-",
                "Status": (a.status || "").replace(/_/g, " "),
                "Condition": a.conditionAtStock || "-",
                "Price (₹)": a.price ?? "-",
                "Warranty End Date": formatDate(a.dynamicValues?.["Warranty End Date"]),
                "Location": a.location || "-",
                "Created By": a.createdBy || "-",
                "Created Date": formatDate(a.createdAt),
                "Notes": a.notes || "-"
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Assets");
        } else {
            if (filteredAllocations.length === 0) { alert("No data to export"); return; }
            const rows = filteredAllocations.map(al => ({
                "Allocation ID": al.allocationId || al.id,
                "Asset Tag": al.asset?.assetTag || "-",
                "Category": al.asset?.category?.name || "-",
                "Asset Model Name": al.asset?.dynamicValues?.["Asset Model Name"] || "-",
                "Configuration": al.asset?.dynamicValues?.["Configuration"] || "-",
                "Employee ID": getDisplayEmployeeId(al.employee?.employeeId) || "-",
                "Employee Name": `${al.employee?.firstName || ""} ${al.employee?.lastName || ""}`.trim() || "-",
                "Allocation Date": formatDate(al.allocationDate),
                "Expected Return": formatDate(al.expectedReturnDate),
                "Condition At Issue": al.conditionAtIssue || "-",
                "Accessories": al.accessoriesIssued || "-",
                "Return Date": formatDate(al.returnDate),
                "Warranty End Date": formatDate(al.asset?.dynamicValues?.["Warranty End Date"]),
                "Condition At Return": al.conditionAtReturn || "-",
                "Damage Notes": al.damageNotes || "-",
                "Verified By": al.verifiedBy || "-"
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Allocations");
        }

        const filename = filters.reportType === "assets"
            ? `Asset_Inventory_Report_${new Date().toISOString().split("T")[0]}.xlsx`
            : `Asset_Allocation_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="reports-content-section fadeIn">

            {/* ── Filters Card ── */}
            <div className="filters-card">


                {/* Report type toggle */}
                <div className="filters-grid" style={{ marginBottom: "16px" }}>
                    <div className="filter-group full-width">
                        <label>Report Type</label>
                        <select
                            name="reportType"
                            value={filters.reportType}
                            onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value, status: "" }))}
                        >
                            <option value="assets">Inventory Report</option>
                            <option value="allocations">Allocation Report</option>
                        </select>
                    </div>
                </div>

                <div className="filters-grid">
                    {/* Common: Asset Tag */}
                    <div className="filter-group">
                        <label>Asset Tag</label>
                        <input
                            type="text"
                            name="assetTag"
                            value={filters.assetTag}
                            onChange={handleFilterChange}
                            placeholder="e.g. LAP-2024-001"
                        />
                    </div>

                    {/* Allocation only: Employee ID */}
                    {filters.reportType === "allocations" && (
                        <div className="filter-group" style={{ position: 'relative' }}>
                            <label>Employee ID</label>
                            <input
                                ref={employeeIdRef}
                                type="text"
                                name="employeeId"
                                value={filters.employeeId}
                                onChange={(e) => handleEmployeeIdChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g. EMP001"
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
                    )}

                    {/* Category */}
                    <div className="filter-group">
                        <label>Category</label>
                        <select name="category" value={filters.category} onChange={handleFilterChange}>
                            <option value="">All Categories</option>
                            {categories.filter(c => !c.parentCategory).map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div className="filter-group">
                        <label>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">All</option>
                            {filters.reportType === "assets" ? (
                                <>
                                    <option value="IN_STOCK">In Stock</option>
                                    <option value="ALLOCATED">Allocated</option>
                                    <option value="DAMAGED">Damaged</option>
                                    <option value="LOST">Lost</option>
                                    <option value="UNDER_REPAIR">Under Repair</option>
                                    <option value="OUT_OF_STOCK">Out of stock</option>
                                </>
                            ) : (
                                <>
                                    <option value="ACTIVE">Active</option>
                                    <option value="RETURNED">Returned</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Assets only: Location */}
                    {filters.reportType === "assets" && (
                        <div className="filter-group">
                            <label>Location</label>
                            <input
                                type="text"
                                name="location"
                                value={filters.location}
                                onChange={handleFilterChange}
                                placeholder="e.g. WH-04-A"
                            />
                        </div>
                    )}

                    {/* Date range - full-width row, always side-by-side */}
                    <div className="filter-group full-width">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="filter-group">
                                <label>From Date</label>
                                <SmartDatePicker
                                    value={filters.fromDate}
                                    onChange={date => setFilters(prev => ({ ...prev, fromDate: date }))}
                                    placeholder="DD-MM-YYYY"
                                />
                            </div>
                            <div className="filter-group">
                                <label>To Date</label>
                                <SmartDatePicker
                                    value={filters.toDate}
                                    onChange={date => setFilters(prev => ({ ...prev, toDate: date }))}
                                    placeholder="DD-MM-YYYY"
                                    minDate={filters.fromDate}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-actions">
                    <button className="btn-fetch" onClick={handleGenerateWithEmployeeFilter} disabled={loading}>
                        {loading ? "Loading..." : <><FiSearch /> Generate Report</>}
                    </button>
                    <button
                        className="btn-download"
                        onClick={handleDownload}
                        disabled={filters.reportType === "assets" ? filteredAssets.length === 0 : filteredAllocations.length === 0}
                    >
                        <FiDownload /> Download Excel
                    </button>
                    <button className="btn-clear" onClick={handleClear}>Clear Filters</button>
                </div>
            </div>

            {/* ── Results Table ── */}
            <div className="results-card">
                <div className="table-wrapper">
                    {filters.reportType === "assets" ? (
                        /* INVENTORY TABLE */
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Asset ID</th>
                                    <th>Asset Tag</th>
                                    <th>Serial No</th>
                                    <th>Category</th>
                                    <th>Sub-Category</th>
                                    <th>Asset Model Name</th>
                                    <th>Configuration</th>
                                    <th>Status</th>
                                    <th>Condition</th>
                                    <th>Price</th>
                                    <th>Warranty End Date</th>
                                    <th>Location</th>
                                    <th>Created By</th>
                                    <th>Created Date</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.length > 0 ? filteredAssets.map(a => {
                                    const sc = STATUS_COLORS[a.status] || { bg: "#f1f5f9", color: "#475569", label: a.status };
                                    return (
                                        <tr key={a.id}>
                                            <td style={{ fontWeight: "600", color: "#0d9488" }}>{a.assetId || "-"}</td>
                                            <td style={{ fontWeight: "600" }}>{a.assetTag || "-"}</td>
                                            <td>{a.serialNumber || "-"}</td>
                                            <td>{a.category?.name || "-"}</td>
                                            <td>{a.subCategory?.name || "-"}</td>
                                            <td>{a.dynamicValues?.["Asset Model Name"] || "-"}</td>
                                            <td>{a.dynamicValues?.["Configuration"] || "-"}</td>
                                            <td>
                                                <span style={{
                                                    background: sc.bg, color: sc.color,
                                                    padding: "3px 10px", borderRadius: "6px",
                                                    fontSize: "11px", fontWeight: "700",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {sc.label || (a.status || "").replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td>{a.conditionAtStock || "-"}</td>
                                            <td>{a.price != null ? `₹${Number(a.price).toLocaleString("en-IN")}` : "-"}</td>
                                            <td>{formatDate(a.dynamicValues?.["Warranty End Date"])}</td>
                                            <td>{a.location || "-"}</td>
                                            <td>{a.createdBy || "-"}</td>
                                            <td>{formatDate(a.createdAt)}</td>
                                            <td style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.notes}>
                                                {a.notes || "-"}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="15" className="no-data">
                                            {loading ? "Fetching data…" : generated ? "No assets match the selected filters." : "Click 'Generate Report' to load data."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* ALLOCATION TABLE */
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Allocation ID</th>
                                    <th>Asset Tag</th>
                                    <th>Category</th>
                                    <th>Asset Model Name</th>
                                    <th>Configuration</th>
                                    <th>Employee ID</th>
                                    <th>Employee Name</th>
                                    <th>Allocation Date</th>
                                    <th>Expected Return</th>
                                    <th>Condition At Issue</th>
                                    <th>Accessories</th>
                                    <th>Return Date</th>
                                    <th>Warranty End Date</th>
                                    <th>Condition At Return</th>
                                    <th>Damage Notes</th>
                                    <th>Verified By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAllocations.length > 0 ? filteredAllocations.map(al => {
                                    const empName = `${al.employee?.firstName || ""} ${al.employee?.lastName || ""}`.trim();
                                    return (
                                        <tr key={al.id}>
                                            <td style={{ fontWeight: "600", color: "#0d9488" }}>{al.allocationId || al.id}</td>
                                            <td style={{ fontWeight: "600" }}>{al.asset?.assetTag || "-"}</td>
                                            <td>{al.asset?.category?.name || "-"}</td>
                                            <td>{al.asset?.dynamicValues?.["Asset Model Name"] || "-"}</td>
                                            <td>{al.asset?.dynamicValues?.["Configuration"] || "-"}</td>
                                            <td>{getDisplayEmployeeId(al.employee?.employeeId) || "-"}</td>
                                            <td>{empName || "-"}</td>
                                            <td>{formatDate(al.allocationDate)}</td>
                                            <td>{formatDate(al.expectedReturnDate)}</td>
                                            <td>{al.conditionAtIssue || "-"}</td>
                                            <td>{al.accessoriesIssued || "-"}</td>
                                            <td>{formatDate(al.returnDate)}</td>
                                            <td>{formatDate(al.asset?.dynamicValues?.["Warranty End Date"])}</td>
                                            <td>{al.conditionAtReturn || "-"}</td>
                                            <td style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={al.damageNotes}>
                                                {al.damageNotes || "-"}
                                            </td>
                                            <td>{al.verifiedBy || "-"}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="16" className="no-data">
                                            {loading ? "Fetching data…" : generated ? "No allocations match the selected filters." : "Click 'Generate Report' to load data."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Record count footer */}
                {generated && (
                    <div style={{
                        padding: "12px 20px",
                        borderTop: "1px solid #f1f5f9",
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "600",
                        display: "flex",
                        justifyContent: "space-between"
                    }}>
                        <span>
                            {filters.reportType === "assets"
                                ? `${filteredAssets.length} record(s) found`
                                : `${filteredAllocations.length} record(s) found`}
                        </span>
                        <span style={{ color: "#0d9488" }}>
                            {filters.reportType === "assets" ? "Inventory Report" : "Allocation Report"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetManagementReport;
