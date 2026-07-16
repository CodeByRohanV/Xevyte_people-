
import React, { useState, useEffect, useMemo } from 'react';
import { formatDateToIST, getPropperDate } from '../utils/DateUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from "../api";
import * as XLSX from "xlsx-js-style";


import './Mytimesheet.css';
import Sidebar from './Sidebar.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};


const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ViewIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);
// ... imports
// (Moved to top)


// Forward ref custom input component for perfect React Datepicker compatibility
const CustomDateInput = React.forwardRef(({ value, onClick, placeholder, disabled }, ref) => (
    <input
        ref={ref}
        readOnly
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px", // Elegant rounded corners
            width: "100%",
            fontSize: "14px",
            cursor: disabled ? "not-allowed" : "pointer",
            backgroundColor: disabled ? "#f1f5f9" : "white"
        }}
    />
));

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


            customInput={<CustomDateInput disabled={disabled} />}

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

const HRTimesheetsTable = ({ hrId, passedEmployeeId, searchTerm, passedEmployeeName }) => {

    const [allTimesheets, setAllTimesheets] = useState([]);
    const [approvedLeaveDates, setApprovedLeaveDates] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [managerDetails, setManagerDetails] = useState({ managerId: '', managerName: '' });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const todayStr = getPropperDate();
    const todayIST = new Date(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(todayIST.getMonth());
    const [selectedYear, setSelectedYear] = useState(todayIST.getFullYear());
    // Month-Year to control visible table (updates only on View click)
    const [currentView, setCurrentView] = useState({
        month: selectedMonth,
        year: selectedYear
    });
    const [showSearchInputs, setShowSearchInputs] = useState(false); // Toggle for search inputs

    const location = useLocation();
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return formatDateToIST(dateString);
    };

    const formatTotalHours = (totalHoursString) => {
        const totalHours = parseFloat(totalHoursString);
        if (isNaN(totalHours) || totalHours < 0) return '-';
        if (totalHours === 0) return '0:00 Hrs';

        const hours = Math.floor(totalHours);
        const fractionalPart = totalHours - hours;
        const minutes = Math.round(fractionalPart * 60);
        const formattedMinutes = String(minutes).padStart(2, '0');
        return `${hours}:${formattedMinutes} Hrs`;
    };

    const [filters, setFilters] = useState({
        date: 'all',
        employeeId: '',
        clientName: '',
        projectName: '',

        loginTime: '',
        logoutTime: '',
        totalHours: '',
        remarks: ''
    });

    const [selectedEmployee, setSelectedEmployee] = useState({
        name: passedEmployeeName || sessionStorage.getItem("selectedEmployeeName") || '',
        employeeId: passedEmployeeId || sessionStorage.getItem("selectedEmployeeId") || ''
    });

    // Helper function to update selected employee (mostly for consistency, not directly used in HR table logic)
    const handleEmployeeClick = (emp) => {
        sessionStorage.setItem("selectedEmployeeId", emp.employeeId);
        const fullName = `${emp.firstName} ${emp.lastName}`;

        sessionStorage.setItem("selectedEmployeeName", fullName);

        setSelectedEmployee({
            name: fullName,
            employeeId: emp.employeeId
        });

        navigate("/mngreq", {
            state: { employeeId: emp.employeeId, employeeName: fullName }
        });

    };

    useEffect(() => {
        const storedEmpId = sessionStorage.getItem("selectedEmployeeId");
        const storedEmpName = sessionStorage.getItem("selectedEmployeeName");
        const locationEmpId = location.state?.employeeId;
        const locationEmpName = location.state?.employeeName;
        setSelectedEmployee({
            employeeId: locationEmpId || storedEmpId || "",
            name: (locationEmpName || storedEmpName || "").trim() || "Unknown"
        });

    }, [location.state]);


    // Fetch Timesheet Data, Approved Leave Dates, AND Manager Details
    useEffect(() => {
        const fetchTimesheetData = async () => {
            const employeeId = selectedEmployee.employeeId;
            if (!employeeId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            const token = sessionStorage.getItem("token");

            try {
                // 1. Fetch Timesheets for the selected employee
                const timesheetsResponse = await api.get(`/daily-entry/employee/${employeeId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAllTimesheets(timesheetsResponse.data);

                // 2. Fetch Approved Leave Dates
                const leaveResponse = await api.get(
                    `/leaves/approved-dates/${employeeId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                const leaveData = leaveResponse.data || {};
                const normalizedLeaveData = {};
                Object.entries(leaveData).forEach(([date, type]) => {
                    const d = new Date(date);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    const key = `${yyyy}-${mm}-${dd}`;
                    normalizedLeaveData[key] = type;
                });
                setApprovedLeaveDates(normalizedLeaveData);

                // 3. Fetch Manager Details
                if (timesheetsResponse.data.length > 0) {
                    const firstEntry = timesheetsResponse.data[0];
                    setManagerDetails({
                        managerId: firstEntry.managerId || '',
                        managerName: firstEntry.managerName || ''
                    });
                } else {
                    setManagerDetails({ managerId: '', managerName: '' });
                }

                // 4. Fetch Holidays
                try {
                    const holidaysResponse = await api.get(`/v1/holidays/employee/${employeeId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setHolidays(holidaysResponse.data || []);
                } catch (holidayError) {
                    console.warn("Failed to fetch holidays:", holidayError);
                    setHolidays([]);
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.response?.data?.message || "Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };

        fetchTimesheetData();
    }, [selectedEmployee.employeeId]);


    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value
        }));
    };
    // useMemo Hook - UPDATED TO SHOW HOLIDAY AND WEEKEND
    const filteredEntries = useMemo(() => {
        if (!allTimesheets) return [];

        const timesheetsForSelectedMonth = allTimesheets.filter(entry => {
            if (!entry.date) return false;
            const entryDate = new Date(entry.date);

            return (
                entryDate.getUTCFullYear() === currentView.year &&
                entryDate.getUTCMonth() === currentView.month

            );
        });

        const daysInMonth = new Date(currentView.year, currentView.month + 1, 0).getDate();

        const holidayMap = new Map();
        holidays.forEach(h => {
            const d = new Date(h.date);
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            holidayMap.set(key, h.holiday ? h.holiday.replace(/\uFFFD/g, "'").replace(/â€™/g, "'") : h.holiday);
        });

        const allDates = Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(Date.UTC(currentView.year, currentView.month, i + 1));
            return {
                date,
                dateStr: date.toISOString().split("T")[0], // YYYY-MM-DD
            };
        });


        let mergedEntries = allDates.map(({ date, dateStr }) => {

            const foundEntry = timesheetsForSelectedMonth.find((entry) => {
                const entryDate = new Date(entry.date);
                return (
                    entryDate.getUTCFullYear() === date.getUTCFullYear() &&
                    entryDate.getUTCMonth() === date.getUTCMonth() &&
                    entryDate.getUTCDate() === date.getUTCDate()
                );
            });

            const leaveType = approvedLeaveDates[dateStr];
            const isApprovedLeave = !!leaveType;
            const holidayName = holidayMap.get(dateStr);
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6; // Sunday or Saturday

            let remarks = foundEntry?.remarks || "";

            if (isApprovedLeave) {
                remarks = leaveType;
            } else if (!remarks) {
                if (holidayName) remarks = `${holidayName}`;
                else if (isWeekend) remarks = "Weekend";
            }

            const baseEntry = foundEntry ? { ...foundEntry } : {
                id: `empty-${dateStr}`,
                date: dateStr,
                employeeId: selectedEmployee.employeeId || "",
                employeeName: selectedEmployee.name || "",
                clientName: "",
                projectName: "",
                loginTime: "",
                logoutTime: "",
                totalHours: "",
                remarks: remarks || "-", // Use determined remarks, default to '-' if empty
            };

            baseEntry.remarks = remarks || (foundEntry?.remarks) || (holidayName ? `${holidayName}` : (isWeekend ? "Weekend" : "-"));

            if (isApprovedLeave) {
                baseEntry.clientName = "";
                baseEntry.projectName = "";
                baseEntry.loginTime = "";
                baseEntry.logoutTime = "";
                baseEntry.totalHours = 0;
                baseEntry.remarks = leaveType;
                baseEntry.workLocation = "";
            }
            else if (!foundEntry || !foundEntry.loginTime) {
                // For any unfiled day (weekday or weekend), ensure all time/project fields are empty/zero
                baseEntry.clientName = "";
                baseEntry.projectName = "";
                baseEntry.loginTime = "";
                baseEntry.logoutTime = "";
                baseEntry.totalHours = "";
                baseEntry.workLocation = "";
                // The remark is already set
            }

            baseEntry.isLeave = isApprovedLeave;

            return baseEntry;
        }).filter(entry => entry !== null);

        const normalize = (v) => (v ?? "").toString().toLowerCase();

        mergedEntries = mergedEntries.filter((entry) => {
            const matchesClient = !filters.client || normalize(entry.clientName).includes(normalize(filters.client));
            const matchesProject = !filters.project || normalize(entry.projectName).includes(normalize(filters.project));
            const matchesLogin = !filters.loginTime || normalize(entry.loginTime).includes(normalize(filters.loginTime));
            const matchesLogout = !filters.logoutTime || normalize(entry.logoutTime).includes(normalize(filters.logoutTime));
            const matchesRemarks = !filters.remarks || normalize(entry.remarks).includes(normalize(filters.remarks));

            const total = parseFloat(entry.totalHours) || 0;
            const matchesTotalHours =
                !filters.totalHours ||
                (filters.totalHours === "lessThan8" && total < 8) ||
                (filters.totalHours === "greaterThan8" && total >= 8);

            return (
                matchesClient &&
                matchesProject &&
                matchesLogin &&
                matchesLogout &&
                matchesRemarks &&
                matchesTotalHours
            );
        });

        if (filters.date === "asc") {
            mergedEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (filters.date === "desc") {
            mergedEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return mergedEntries;
    }, [
        allTimesheets,
        filters,
        currentView.month,
        currentView.year,
        selectedEmployee,
        approvedLeaveDates,
        holidays
    ]);



    // UPDATED handleDownload function to remove "Weekend" from Remarks field in Excel

    const handleDownload = async () => {
        if (!startDate || !endDate) {
            alert("Please select a start date and end date to Exports.");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            alert("Start date cannot be after end date.");
            return;
        }

        const employeeId = selectedEmployee.employeeId;
        const storedEmpName = selectedEmployee.name;

        const hrName = sessionStorage.getItem("employeeName") || ""; // HR's Name (current user)
        const { managerId, managerName } = managerDetails; // Employee's Manager's details (fetched once)

        const employeeEntries = allTimesheets.filter(
            (entry) => String(entry.employeeId) === String(employeeId)
        );

        const entryMap = new Map();
        employeeEntries.forEach(entry => {
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
            // YYYY-MM-DD
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const year = dateObj.getUTCFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            const entry = entryMap.get(dateKey); // Timesheet entry if filed

            const leaveType = approvedLeaveDates[dateKey];
            const isApprovedLeave = !!leaveType;
            const holidayName = holidayMap.get(dateKey);
            // Date.getDay() returns 0 for Sunday, 6 for Saturday
            const dayOfWeek = dateObj.getUTCDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            let remarks = "";

            if (isApprovedLeave) {
                remarks = leaveType;
            } else if (entry && entry.remarks) {
                remarks = entry.remarks;
            } else if (holidayName) {
                remarks = `${holidayName}`;
            } else if (isWeekend) {
                remarks = "Weekend";
            } else {
                remarks = "-";
            }

            // Construct the row data
            const rowData = {
                "Employee ID": getDisplayEmployeeId(employeeId),
                "Employee Name": storedEmpName,
                "Date": formattedDate,
                "Client Name": entry?.clientName || "",
                "Project Name": entry?.projectName || "",
                "Login Time": entry?.loginTime || "",
                "Logout Time": entry?.logoutTime || "",
                "Total Hours": formatTotalHours(entry?.totalHours),
                "Remarks": remarks,
                "Work Location": entry?.workLocation || "",

                // "Manager ID": managerId,      
                // "Manager Name": managerName, 

                // "HR ID": hrId, 
                // "HR Name": hrName, 
            };

            // Clear time/project fields for a leave day OR an unfiled holiday/weekend/weekday
            if (isApprovedLeave || !entry || !entry.loginTime) {
                rowData["Client Name"] = "";
                rowData["Project Name"] = "";
                rowData["Login Time"] = "";
                rowData["Logout Time"] = "";
                rowData["Total Hours"] = "-";
                rowData["Work Location"] = "";
            }


            return rowData;
        }).filter(row => row !== null);

        if (dataToExport.length === 0) {
            alert("No entries found for the selected date range.");
            return;
        }

        // Generate Excel sheet (rest of the logic remains the same)
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        // Style header row

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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet");

        const fileName = `${getDisplayEmployeeId(employeeId)}_timesheet.xlsx`;

        XLSX.writeFile(workbook, fileName);
        setIsModalOpen(false);
        setStartDate(null);
        setEndDate(null);
    };

    const handleViewTimesheet = (e) => {
        e.preventDefault();

        // Apply selected values to table view
        setCurrentView({
            month: selectedMonth,
            year: selectedYear
        });

        setIsViewModalOpen(false);
    };



    if (loading) return <p>Loading timesheets...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{
            marginTop: '0',
            paddingTop: '0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            width: '100%',
            marginLeft: "0"
        }}>

            <div className="timesheet-header">
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: "8px 16px",
                        background: "#00B3A4",
                        color: "white",
                        fontSize: "14px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(94, 234, 212, 0.3)",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: "500"
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
                            fontSize: "14px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(94, 234, 212, 0.3)",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "600"
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
                            fontSize: "14px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(94, 234, 212, 0.3)",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "600"
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
            <h2 className="emp-title">
                Attendance_{selectedEmployee.name || "Unknown"} ({getDisplayEmployeeId(selectedEmployee.employeeId) || "N/A"})
            </h2>


            <div className="table-wrapper table-responsive-container" style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="timesheet-table" cellPadding="8">
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <span>Date</span>
                                    <button
                                        onClick={() => setShowSearchInputs(!showSearchInputs)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: '0px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        title="Toggle search"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
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
                                            height: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            fontSize: '10px',
                                            width: '100%',
                                            marginTop: '2px',
                                            color: 'black',
                                            padding: '0 2px'
                                        }}
                                    >
                                        <option value="all">All</option>
                                        <option value="asc">Asc</option>
                                        <option value="desc">Desc</option>
                                    </select>
                                )}
                            </th>

                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center', padding: '4px' }}>
                                <span>Client</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Client"
                                        value={filters.client}
                                        onChange={(e) => handleFilterChange('client', e.target.value)}
                                        style={{ marginTop: '2px', width: '100%', height: '20px', fontSize: '10px', padding: '0 4px' }}
                                    />
                                )}
                            </th>
                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center', padding: '4px' }}>
                                <span>Project</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Project"
                                        value={filters.project}
                                        onChange={(e) => handleFilterChange('project', e.target.value)}
                                        style={{ marginTop: '2px', width: '100%', height: '20px', fontSize: '10px', padding: '0 4px' }}
                                    />
                                )}
                            </th>
                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center', padding: '4px' }}>
                                <span>Login Time</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Time"
                                        value={filters.loginTime}
                                        onChange={(e) => handleFilterChange('loginTime', e.target.value)}
                                        style={{ marginTop: '2px', width: '100%', height: '20px', fontSize: '10px', padding: '0 4px' }}
                                    />
                                )}
                            </th>

                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center', padding: '4px' }}>
                                <span>Logout Time</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Time"
                                        value={filters.logoutTime}
                                        onChange={(e) => handleFilterChange('logoutTime', e.target.value)}
                                        style={{ marginTop: '2px', width: '100%', height: '20px', fontSize: '10px', padding: '0 4px' }}
                                    />
                                )}
                            </th>
                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center', padding: '4px' }}>
                                <span>Total Hours</span>
                                {showSearchInputs && (
                                    <select
                                        value={filters.totalHours}
                                        onChange={(e) => handleFilterChange('totalHours', e.target.value)}
                                        style={{
                                            height: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            fontSize: '10px',
                                            width: '100%',
                                            marginTop: '2px',
                                            color: 'black',
                                            padding: '0 2px'
                                        }}
                                    >
                                        <option value="">All</option>
                                        <option value="lessThan8"> &lt; 8</option>
                                        <option value="greaterThan8"> &ge; 8</option>
                                    </select>
                                )}
                            </th>
                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center', padding: '4px' }}>
                                <span>Remarks</span>
                                {showSearchInputs && (
                                    <input
                                        type="text"
                                        placeholder="Search Remarks"
                                        value={filters.remarks}
                                        onChange={(e) => handleFilterChange('remarks', e.target.value)}
                                        style={{ marginTop: '2px', width: '100%', height: '20px', fontSize: '10px', padding: '0 4px' }}
                                    />
                                )}
                            </th>
                            <th style={{ border: "1px solid #ccc", background: '#629AF1', color: 'white', textAlign: 'center', padding: '4px' }}>
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
                                    <td data-label="Client" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>
                                        {entry.clientName || "-"}
                                    </td>
                                    <td data-label="Project" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>
                                        {entry.projectName || "-"}
                                    </td>
                                    <td data-label="Login Time" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>
                                        {entry.loginTime || "-"}
                                    </td>
                                    <td data-label="Logout Time" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>
                                        {entry.logoutTime || "-"}
                                    </td>
                                    <td data-label="Total Hours" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", }}>
                                        {formatTotalHours(entry.totalHours)}
                                    </td>
                                    <td
                                        data-label="Remarks"
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: "8px",
                                            textAlign: "center",

                                        }}
                                    >
                                        {entry.remarks || "-"}
                                    </td>
                                    <td data-label="Work Location" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                                        {entry.workLocation || "-"}
                                    </td>

                                </tr>
                            ))
                        ) : (
                            <tr>

                                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                                    No timesheet entries found for the selected month.
                                </td>

                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// The main HRTimesheet component remains unchanged.
function HRTimesheet() {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');

    const passedEmployeeId = location.state?.employeeId || sessionStorage.getItem("selectedEmployeeId");
    const hrId = sessionStorage.getItem("employeeId");

    return (
        <Sidebar>
            <div style={{
                marginTop: '0',
                paddingTop: '0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: "auto",
                width: "100%",
                marginLeft: "0"
            }}>
                <HRTimesheetsTable
                    hrId={hrId}
                    passedEmployeeId={passedEmployeeId}
                    searchTerm={searchTerm}
                    passedEmployeeName={location.state?.employeeName || sessionStorage.getItem("selectedEmployeeName") || ""}
                />


            </div>
        </Sidebar>
    );
}


export default HRTimesheet;

