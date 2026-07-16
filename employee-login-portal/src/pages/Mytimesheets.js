
import React, { useState, useEffect, useMemo } from 'react';
import { formatDateToIST, getPropperDate } from '../utils/DateUtils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx-js-style';
import api from "../api";
import './Mytimesheet.css';
import Sidebar from './Sidebar.js'; // Assuming Sidebar is in the same directory structure
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

// SmartDatePicker Component (Copied from OnboardingForm for styling consistency)
const SmartDatePicker = ({ value, onChange, disabled }) => {
    const [open, setOpen] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const formatLocalDate = (date) => {
        const pad = (n) => n.toString().padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    return (
        <DatePicker
            selected={value ? new Date(value + "T00:00:00") : null}
            disabled={disabled}
            onChange={(date) => {
                if (!date) {
                    onChange("");
                    setOpen(false);
                    return;
                }

                onChange(formatLocalDate(date));

                // close after selecting
                setTimeout(() => setOpen(false), 20);
            }}
            onSelect={() => setOpen(false)}   // important

            open={open}
            onInputClick={() => setOpen(true)}
            onClickOutside={() => setOpen(false)}

            dateFormat="dd-MM-yyyy"
            calendarClassName="no-gap-calendar"
            dayClassName={() => "no-gap-day"}
            wrapperClassName="full-width-picker"


            customInput={
                <div className="input-wrapper" style={{ position: 'relative', width: '100%' }}>
                    <input
                        readOnly
                        value={value ? value.split('-').reverse().join('-') : ''} // Display DD-MM-YYYY
                        onClick={() => !disabled && setOpen(true)}
                        className="onboarding-input" // Reuse this class for styling if available, or fallback
                        style={{
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "8px", // Elegant rounded corners
                            width: "100%",
                            fontSize: "15px",
                            cursor: disabled ? "not-allowed" : "pointer",
                            backgroundColor: disabled ? "#f1f5f9" : "white"
                        }}
                        placeholder="DD-MM-YYYY"
                    />

                </div>
            }

            renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => {
                const months = [
                    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
                ];
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

                return (
                    <div className="custom-calendar-header">
                        {/* Main Banner */}
                        <div className="calendar-header-banner">
                            <button
                                type="button"
                                className="header-nav-btn prev"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowMonthDropdown(false);
                                    setShowYearDropdown(false);
                                    decreaseMonth();
                                }}
                            >
                                ‹
                            </button>

                            <div className="header-main-content">

                                <div className="header-text-group">
                                    <span
                                        className="clickable-header-text"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMonthDropdown(!showMonthDropdown);
                                            setShowYearDropdown(false);
                                        }}
                                    >
                                        {months[date.getMonth()]}
                                    </span>
                                    <span
                                        className="clickable-header-text"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowYearDropdown(!showYearDropdown);
                                            setShowMonthDropdown(false);
                                        }}
                                    >
                                        {date.getFullYear()}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="header-nav-btn next"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowMonthDropdown(false);
                                    setShowYearDropdown(false);
                                    increaseMonth();
                                }}
                            >
                                ›
                            </button>
                        </div>

                        {/* Selection Lists */}
                        {showMonthDropdown && (
                            <div className="header-dropdown month-dropdown">
                                {months.map((m, idx) => (
                                    <div
                                        key={m}
                                        className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                                        onClick={() => {
                                            changeMonth(idx);
                                            setShowMonthDropdown(false);
                                        }}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        )}

                        {showYearDropdown && (
                            <div className="header-dropdown year-dropdown">
                                <div className="dropdown-scroll-pane">
                                    {years.map((y) => (
                                        <div
                                            key={y}
                                            className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                                            onClick={() => {
                                                changeYear(y);
                                                setShowYearDropdown(false);
                                            }}
                                        >
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

// ... const DownloadIcon


const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const ViewIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);


const EmployeeTimesheets = ({ employeeId, searchTerm }) => {
    const [allEntries, setAllEntries] = useState([]); // Store all fetched timesheet entries
    const [approvedLeaveDates, setApprovedLeaveDates] = useState([]); // Store fetched approved leave dates (e.g., ['2025-10-10', '2025-10-15'])
    const [holidays, setHolidays] = useState([]); // Store fetched holidays

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Initialize view to current month/year in IST
    const todayStr = getPropperDate(); // YYYY-MM-DD in IST
    const todayIST = new Date(todayStr);

    const [selectedMonth, setSelectedMonth] = useState(todayIST.getMonth());
    const [selectedYear, setSelectedYear] = useState(todayIST.getFullYear());
    const [currentView, setCurrentView] = useState({ month: todayIST.getMonth(), year: todayIST.getFullYear() });

    const token = sessionStorage.getItem("token");
    const navigate = useNavigate();

    // State for column filters
    const [filters, setFilters] = useState({
        date: 'all',
        clientName: '',
        projectName: '',

        loginTime: '',
        logoutTime: '',
        totalHours: '',
        remarks: ''
    });

    // State for showing/hiding search inputs
    const [showSearchInputs, setShowSearchInputs] = useState(false);


    // Helper to format 'YYYY-MM-DD' to 'DD-MM-YYYY'
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };

    // Helper to format 'YYYY-MM-DD' to 'DD-MM-YYYY' for export (no change)
    const formatDateForExport = (dateString) => {
        return formatDate(dateString);
    };

    // Helper to get all days in a month as 'YYYY-MM-DD' strings
    const getAllDaysInMonth = (month, year) => {
        const days = [];
        // month is 0-indexed, month + 1 gives the next month, 0 means the last day of the previous month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const yyyy = year;
            const mm = String(month + 1).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            days.push(`${yyyy}-${mm}-${dd}`);
        }
        return days;
    };

    // Helper to format total hours string/number to 'H:MM Hrs'
    const formatTotalHours = (totalHoursString) => {
        const totalHours = parseFloat(totalHoursString);

        if (isNaN(totalHours) || totalHours < 0) {
            return '-';
        }

        if (totalHours === 0) {
            return '0:00 Hrs';
        }

        const hours = Math.floor(totalHours);
        const fractionalPart = totalHours - hours;
        const minutes = Math.round(fractionalPart * 60);
        const formattedMinutes = String(minutes).padStart(2, '0');
        return `${hours}:${formattedMinutes} Hrs`;
    };
    /* ---------------------------------------------------------------------- */
    /* ------------------- 1. FETCH APPROVED LEAVE DATES -------------------- */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (!employeeId || !token) return;

        const fetchApprovedLeaves = async () => {
            try {
                const response = await api.get(`/leaves/approved-dates/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = response.data || {};

                const normalizedData = {};
                Object.entries(data).forEach(([date, type]) => {
                    const d = new Date(date);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    const key = `${yyyy}-${mm}-${dd}`;
                    normalizedData[key] = type;
                });

                setApprovedLeaveDates(normalizedData);
            } catch (error) {
                console.error("Error fetching approved leaves:", error.response?.data || error.message);
                setApprovedLeaveDates([]);
            }
        };

        fetchApprovedLeaves();
    }, [employeeId, token]);


    /* ---------------------------------------------------------------------- */
    /* ------------------- 2. FETCH HOLIDAYS -------------------------------- */
    /* ---------------------------------------------------------------------- */
    useEffect(() => {
        if (!employeeId || !token) return;

        const fetchHolidays = async () => {
            try {
                const response = await api.get(`/v1/holidays/employee/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setHolidays(response.data || []);
            } catch (error) {
                console.error("Error fetching holidays:", error);
                setHolidays([]);
            }
        };

        fetchHolidays();
    }, [employeeId, token]);


    /* ---------------------------------------------------------------------- */
    /* ------------------- 3. FETCH TIMESHEET ENTRIES ----------------------- */
    /* ---------------------------------------------------------------------- */
    useEffect(() => {
        if (!employeeId || !token) {
            navigate("/LoginPage");
            return;
        }

        const fetchAllEntries = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(
                    `/daily-entry/employee/${employeeId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAllEntries(response.data);
            } catch (err) {
                const message = err.response?.data?.message || err.message || 'Failed to fetch timesheet entries.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllEntries();
    }, [employeeId, token, navigate]);

    /* ---------------------------------------------------------------------- */
    /* --------------------- 3. FILTERED & AUGMENTED ENTRIES ----------------- */
    /* ---------------------------------------------------------------------- */
    const filteredEntries = useMemo(() => {
        const allDaysInMonth = getAllDaysInMonth(currentView.month, currentView.year);

        // Build entry map
        const entryMap = new Map();
        allEntries.forEach(entry => {
            const dateObject = new Date(entry.date);
            const dateKey = `${dateObject.getUTCFullYear()}-${String(dateObject.getUTCMonth() + 1).padStart(2, "0")}-${String(dateObject.getUTCDate()).padStart(2, '0')}`;
            if (!entryMap.has(dateKey)) {
                entryMap.set(dateKey, []);
            }
            entryMap.get(dateKey).push(entry);
        });

        const holidayMap = new Map();
        holidays.forEach(h => {
            const d = new Date(h.date);
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            holidayMap.set(key, h.holiday ? h.holiday.replace(/\uFFFD/g, "'").replace(/â€™/g, "'") : h.holiday);
        });

        const isWeekend = (dateStr) => {
            const date = new Date(dateStr);
            const day = date.getUTCDay();
            return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
        };

        const merged = allDaysInMonth.map(dateStr => {
            const foundEntries = entryMap.get(dateStr);
            const leaveType = approvedLeaveDates[dateStr];
            const isApprovedLeave = !!leaveType;
            const holidayName = holidayMap.get(dateStr);
            const weekend = isWeekend(dateStr);

            let baseEntry = {
                id: `empty-${dateStr}`,
                employeeId: employeeId,
                date: dateStr,
                clientName: '',
                projectName: '',
                loginTime: '',
                logoutTime: '',
                totalHours: '',
                remarks: '',
            };

            if (foundEntries && foundEntries.length > 0) {
                return foundEntries.map(entry => ({
                    ...entry,
                    clientName: isApprovedLeave ? "" : entry.clientName,
                    projectName: isApprovedLeave ? "" : entry.projectName,
                    loginTime: isApprovedLeave ? "" : entry.loginTime,
                    logoutTime: isApprovedLeave ? "" : entry.logoutTime,
                    totalHours: isApprovedLeave ? 0 : entry.totalHours,
                    remarks: isApprovedLeave ? leaveType : entry.remarks || (holidayName ? `${holidayName}` : (weekend ? 'Weekend' : '')),
                    workLocation: (isApprovedLeave || !entry.loginTime) ? "" : entry.workLocation,
                    isLeave: isApprovedLeave
                }));
            } else {
                let remarks = '';
                let totalHours = '';
                if (isApprovedLeave) {
                    remarks = leaveType;
                    totalHours = 0;
                } else if (holidayName) {
                    remarks = `${holidayName}`;
                } else if (weekend) {
                    remarks = 'Weekend';
                }

                return [{
                    ...baseEntry,
                    remarks: remarks,
                    totalHours: totalHours,
                    isLeave: isApprovedLeave
                }];
            }
        });

        // Flatten the merged list
        const flattened = merged.flat();

        // Apply filters as needed (same as your current logic)
        const filtered = flattened.filter(entry => {
            if (filters.clientName && !(entry.clientName || '').toLowerCase().includes(filters.clientName.toLowerCase())) return false;
            if (filters.projectName && !(entry.projectName || '').toLowerCase().includes(filters.projectName.toLowerCase())) return false;
            if (filters.loginTime && !(entry.loginTime || '').toLowerCase().includes(filters.loginTime.toLowerCase())) return false;
            if (filters.logoutTime && !(entry.logoutTime || '').toLowerCase().includes(filters.logoutTime.toLowerCase())) return false;
            if (filters.remarks && !(entry.remarks || '').toLowerCase().includes(filters.remarks.toLowerCase())) return false;

            const total = parseFloat(entry.totalHours);
            if (filters.totalHours === 'lessThan8' && (isNaN(total) || total >= 8)) return false;
            if (filters.totalHours === 'greaterThan8' && total < 8) return false;

            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase();
                const match =
                    (entry.date || '').toLowerCase().includes(lowerSearch) ||
                    (entry.remarks || '').toLowerCase().includes(lowerSearch) ||
                    (entry.clientName || '').toLowerCase().includes(lowerSearch) ||
                    (entry.projectName || '').toLowerCase().includes(lowerSearch);
                if (!match) return false;
            }

            return true;
        });


        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return filters.date === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [allEntries, approvedLeaveDates, holidays, currentView, filters, searchTerm]);



    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value
        }));
    };

    const handleDownload = () => {
        if (!startDate || !endDate) {
            alert('Please select a start and end date to download the timesheet.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            alert("Start date cannot be after end date.");
            return;
        }

        const employeeName = sessionStorage.getItem("employeeName") || '-';

        const entryMap = new Map();
        allEntries.forEach(entry => {
            if (entry.date) {
                const key = entry.date.split("T")[0]; // YYYY-MM-DD
                entryMap.set(key, entry);
            }
        });

        const allDates = [];
        let current = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

        while (current <= endUTC) {
            allDates.push(new Date(current));
            current.setUTCDate(current.getUTCDate() + 1);
        }

        const holidayMap = new Map();
        holidays.forEach(h => {
            const d = new Date(h.date);
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            holidayMap.set(key, h.holiday ? h.holiday.replace(/\uFFFD/g, "'").replace(/â€™/g, "'") : h.holiday);
        });

        const dataToExport = allDates.map((dateObj) => {
            const dateKey = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const year = dateObj.getUTCFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            const entry = entryMap.get(dateKey);
            const leaveType = approvedLeaveDates[dateKey];
            const isApprovedLeave = !!leaveType;
            const holidayName = holidayMap.get(dateKey);
            const dayOfWeek = dateObj.getUTCDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            let remarks = entry?.remarks || (isApprovedLeave ? leaveType : (holidayName ? `${holidayName}` : (isWeekend ? "Weekend" : "-")));

            const rowData = {
                "Employee ID": getDisplayEmployeeId(employeeId),
                "Employee Name": employeeName,
                "Date": formattedDate,
                "Client Name": entry?.clientName || "",
                "Project Name": entry?.projectName || "",
                "Login Time": entry?.loginTime || "",
                "Logout Time": entry?.logoutTime || "",
                "Total Hours": formatTotalHours(entry?.totalHours),
                "Remarks": remarks,
                "Work Location": entry?.workLocation || "",
            };

            if (isApprovedLeave) {
                rowData["Client Name"] = "";
                rowData["Project Name"] = "";
                rowData["Login Time"] = "";
                rowData["Logout Time"] = "";
                rowData["Total Hours"] = "-";
                rowData["Remarks"] = leaveType;
                rowData["Work Location"] = "";
            } else if (!entry || !entry.loginTime) {
                rowData["Client Name"] = "";
                rowData["Project Name"] = "";
                rowData["Login Time"] = "";
                rowData["Logout Time"] = "";
                rowData["Total Hours"] = "-";
                rowData["Work Location"] = "";
            }

            return rowData;
        });

        if (dataToExport.length === 0) {
            alert('No entries found for the selected date range.');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[cell_address]) continue;
            worksheet[cell_address].s = {
                font: { bold: true },
                alignment: { horizontal: "center" },
                fill: { fgColor: { rgb: "D9D9D9" } },
            };
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'My Timesheets');

        const fileName = `${getDisplayEmployeeId(employeeId) || "EMP"}_timesheets.xlsx`;
        XLSX.writeFile(workbook, fileName);

        setIsModalOpen(false);
    };

    const handleViewTimesheet = () => {
        // Clear all filters when changing the month view
        setFilters({
            date: 'asc',
            clientName: '',
            projectName: '',
            loginTime: '',
            logoutTime: '',
            totalHours: '',
            remarks: ''
        });

        setCurrentView({ month: selectedMonth, year: selectedYear });
        setIsViewModalOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (!employeeId) {
        return <p>Please log in to view your timesheets.</p>;
    }

    if (loading) return <p>Loading timesheets...</p>;

    if (error) return <p style={{ color: 'red' }}>{error.error}</p>;


    return (
        <div className="timesheet-container">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '10px 0',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <button
                    onClick={() => navigate("/TimeSheet")}
                    style={{
                        padding: "8px 16px",
                        background: "#00B3A4",
                        color: "white",
                        fontSize: "15px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(94, 234, 212, 0.3)",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: "normal"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(94, 234, 212, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(94, 234, 212, 0.3)";
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => setIsViewModalOpen(true)}
                        style={{
                            padding: "10px 20px",
                            background: "#00B3A4",
                            color: "white",
                            fontSize: "15px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(94, 234, 212, 0.3)",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "normal"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(94, 234, 212, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(94, 234, 212, 0.3)";
                        }}
                    >
                        <ViewIcon /> View Attendance
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            padding: "10px 20px",
                            background: "#00B3A4",
                            color: "white",
                            fontSize: "15px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0, 179, 164, 0.2)",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "normal"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(94, 234, 212, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(94, 234, 212, 0.3)";
                        }}
                    >
                        <DownloadIcon /> Export
                    </button>
                </div>
            </div>

            {/* View Attendance Modal */}
            {isViewModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Select Month and Year</h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <label htmlFor="month-select">Month:</label>
                            <select
                                id="month-select"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                            <label htmlFor="year-select">Year:</label>
                            <input
                                type="number"
                                id="year-select"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                min="2000"
                                max={new Date().getFullYear() + 10}
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setIsViewModalOpen(false)} className="cancel-btn">Cancel</button>
                            <button onClick={handleViewTimesheet} className="download-btn">View</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Download Timesheet</h3>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">

                            {/* Start Date DatePicker */}
                            {/* Start Date DatePicker */}
                            <label htmlFor="modal-start-date">Start Date:</label>
                            <SmartDatePicker
                                value={startDate}
                                onChange={(date) => setStartDate(date)}
                                disabled={false}
                            />

                            {/* End Date DatePicker */}
                            <label htmlFor="modal-end-date">End Date:</label>
                            <SmartDatePicker
                                value={endDate}
                                onChange={(date) => setEndDate(date)}
                                disabled={false}
                            />

                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                            <button onClick={handleDownload} className="download-btn">Download</button>
                        </div>
                    </div>
                </div>
            )}
            <h2>Attendance for {monthNames[currentView.month]} {currentView.year}</h2>
            <div className="table1-wrapper">
                <table className="timesheet-table">
                    <thead>
                        <tr>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Date</span>
                                    <button
                                        onClick={() => setShowSearchInputs(!showSearchInputs)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            marginLeft: '8px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        title="Toggle search"
                                    >
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="m21 21-4.35-4.35"></path>
                                        </svg>
                                    </button>
                                </div>
                                {showSearchInputs && (
                                    <select
                                        value={filters.date}
                                        onChange={(e) => handleFilterChange('date', e.target.value)}
                                        style={{
                                            height: '25px',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            fontSize: '15px',
                                            width: 'auto',
                                            minWidth: '80px',
                                            marginRight: 'auto',
                                            marginTop: '8px',
                                            color: 'black'
                                        }}
                                    >
                                        <option value="all">All</option>
                                        <option value="asc">Asc</option>
                                        <option value="desc">Desc</option>
                                    </select>
                                )}
                            </th>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <span>Client</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Client"
                                        value={filters.clientName}
                                        onChange={(e) => handleFilterChange('clientName', e.target.value)}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </th>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <span>Project</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Project"
                                        value={filters.projectName}
                                        onChange={(e) => handleFilterChange('projectName', e.target.value)}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </th>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <span>Login Time</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Time"
                                        value={filters.loginTime}
                                        onChange={(e) => handleFilterChange('loginTime', e.target.value)}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </th>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <span>Logout Time</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Time"
                                        value={filters.logoutTime}
                                        onChange={(e) => handleFilterChange('logoutTime', e.target.value)}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </th>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <span>Total Hours</span>
                                {showSearchInputs && (
                                    <select
                                        value={filters.totalHours}
                                        onChange={(e) => handleFilterChange('totalHours', e.target.value)}
                                        style={{
                                            height: '25px',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            fontSize: '15px',
                                            minWidth: '100px',
                                            marginRight: 'auto',
                                            marginTop: '8px',
                                            color: 'black'
                                        }}
                                    >
                                        <option value="">All</option>
                                        <option value="lessThan8"> &lt; 8</option>
                                        <option value="greaterThan8"> &ge; 8</option>
                                    </select>
                                )}
                            </th>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <span>Remarks</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Remarks"
                                        value={filters.remarks}
                                        onChange={(e) => handleFilterChange('remarks', e.target.value)}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </th>
                            <th style={{ color: '#ffffff', border: "1px solid #ccc", background: '#629AF1', textAlign: 'center' }}>
                                <span>Work Location</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length > 0 ? (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id} style={{ backgroundColor: entry.isLeave ? '#d3d3d3' : 'transparent' }}>
                                    <td data-label="Date" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>
                                        {formatDate(entry.date)}
                                    </td>
                                    <td data-label="Client" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>{entry.clientName || '-'}</td>
                                    <td data-label="Project" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>{entry.projectName || '-'}</td>
                                    <td data-label="Login Time" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>{entry.loginTime || '-'}</td>
                                    <td data-label="Logout Time" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>{entry.logoutTime || '-'}</td>
                                    <td data-label="Total Hours" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>{formatTotalHours(entry.totalHours)}</td>
                                    <td data-label="Remarks" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}> {entry.remarks || '-'}</td>
                                    <td data-label="Work Location" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                                        {entry.workLocation || '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }} colSpan="8">No timesheet entries found for {monthNames[currentView.month]} {currentView.year}.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >


    );
};

function Mytimesheets() {
    const employeeId = sessionStorage.getItem("employeeId");

    const [searchTerm, setSearchTerm] = useState('');

    return (
        <Sidebar>
            <div style={{
                marginTop: '0',
                paddingTop: '0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                minHeight: "100vh",
                marginLeft: "0" // make container fill screen height
            }}>
                <EmployeeTimesheets employeeId={employeeId} searchTerm={searchTerm} />
            </div>
        </Sidebar>
    );
}

export default Mytimesheets;

