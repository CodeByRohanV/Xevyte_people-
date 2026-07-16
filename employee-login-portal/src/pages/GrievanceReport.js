import React, { useState, useEffect } from "react";
import { formatDateToIST } from '../utils/DateUtils';
import api from "../api";
import * as XLSX from 'xlsx';
import { FiFilter, FiDownload, FiSearch, FiTag } from "react-icons/fi";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Reports.css";

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
                    {showMonthDropdown && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{MONTHS.map((m, idx) => (<div key={m} className={`dropdown-item${idx === date.getMonth() ? " active" : ""}`} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>))}</div></div>)}
                    {showYearDropdown && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map(y => (<div key={y} className={`dropdown-item${y === date.getFullYear() ? " active" : ""}`} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>))}</div></div>)}
                </div>
            )}
        />
    );
};


const GrievanceReport = () => {
    const token = sessionStorage.getItem("token");

    const [filters, setFilters] = useState({
        category: "",
        type: "",
        status: "",
        startDate: null,
        endDate: null
    });

    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOptions();
    }, []);

    const loadOptions = async () => {
        try {
            const res = await api.get("/v1/all-categories/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            setCategories([...new Set(data.filter(x => x.grievanceCategory).map(x => x.grievanceCategory))]);
            setTypes([...new Set(data.filter(x => x.grievanceType).map(x => x.grievanceType))]);
        } catch (err) {
            console.error("Error loading grievance options", err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setFilters({
            category: "",
            type: "",
            status: "",
            startDate: null,
            endDate: null
        });
        setReportsData([]);
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.category) params.append("category", filters.category);
            if (filters.type) params.append("type", filters.type);
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

            const res = await api.get(`/admin/grievances/reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportsData(res.data || []);
        } catch (err) {
            console.error("Failed to fetch grievance report", err);
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
            "Grievance ID": item.grievanceId,
            "Category": item.category,
            "Type": item.type || "N/A",
            "Subject": item.subject,
            "Status": item.status,
            "Created Date": item.createdDate ? formatDateToIST(item.createdDate) : "N/A",
            "Updated Date": item.updatedDate ? formatDateToIST(item.updatedDate) : "N/A",
            "Admin Response": item.adminResponse || "N/A"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Grievance Report");
        XLSX.writeFile(wb, `Grievance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getStatusClass = (status) => {
        if (!status) return "";
        return status.toLowerCase().replace(/\s+/g, '-');
    };

    return (
        <div className="reports-content-section fadeIn">
            <div className="filters-card">

                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Category</label>
                        <select name="category" value={filters.category} onChange={handleFilterChange}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Type</label>
                        <select name="type" value={filters.type} onChange={handleFilterChange}>
                            <option value="">All Types</option>
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">All Statuses</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Under Investigation">Under Investigation</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
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
                                <th>Grievance ID</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Created Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.length > 0 ? (
                                reportsData.map(g => (
                                    <tr key={g.grievanceId}>
                                        <td>{g.grievanceId}</td>
                                        <td>{g.category}</td>
                                        <td>{g.type || "N/A"}</td>
                                        <td title={g.subject}>{g.subject.length > 40 ? g.subject.substring(0, 40) + "..." : g.subject}</td>
                                        <td>
                                            <span className={`status-pill ${getStatusClass(g.status)}`}>
                                                {g.status}
                                            </span>
                                        </td>
                                        <td>{g.createdDate ? formatDateToIST(g.createdDate) : "N/A"}</td>
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

export default GrievanceReport;
