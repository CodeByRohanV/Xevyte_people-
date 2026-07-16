import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatDateToIST, getPropperDate } from '../utils/DateUtils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx-js-style";

import './Mytimesheet.css';
import Sidebar from './Sidebar.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from "../api";

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

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
            selected={value ? (value instanceof Date ? value : new Date(value + "T00:00:00")) : null}
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
                const years = Array.from({ length: 120 }, (_, i) => currentYear + 10 - i);

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

// Import the download icon as a component
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

const LockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const UpdateIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const CancelIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

function Mngtimesheetrequest() {
    const navigate = useNavigate();
    const location = useLocation();

    const employeeId = sessionStorage.getItem("employeeId");

    const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));



    const [searchTerm, setSearchTerm] = useState('');
    const [profileOpen, setProfileOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const fileInputRef = useRef(null);
    const profileDropdownRef = useRef(null);




    // Key state for approved leave dates (Array of 'YYYY-MM-DD' strings)
    const [approvedLeaveDates, setApprovedLeaveDates] = useState([]);
    const [holidays, setHolidays] = useState([]);

    const [selectedEmployee, setSelectedEmployee] = useState({
        name: '',
        employeeId: ''
    });

    const hrIdForExport = selectedEmployee?.hrId || sessionStorage.getItem("hrId") || "";
    const hrNameForExport = selectedEmployee?.hrName || sessionStorage.getItem("hrName") || "";



    const [employeeHrDetails, setEmployeeHrDetails] = useState({
        hrId: sessionStorage.getItem("hrId") || "",
        hrName: sessionStorage.getItem("hrName") || ""
    });


    const hrId = selectedEmployee?.hrId || sessionStorage.getItem("hrId") || "";
    const hrName = selectedEmployee?.hrName || sessionStorage.getItem("hrName") || "";

    function getAllDatesInMonth(month, year) {
        const date = new Date(year, month, 1);
        const dates = [];

        while (date.getMonth() === month) {
            dates.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }

        return dates;
    }


    const handleEmployeeClick = (emp) => {
        sessionStorage.setItem("selectedEmployeeId", emp.employeeId);
        sessionStorage.setItem(
            "selectedEmployeeName",
            `${emp.firstName} ${emp.lastName}`
        );


        // Store HR info here — this is crucial
        sessionStorage.setItem("hrId", emp.hrId || "");
        sessionStorage.setItem("hrName", emp.hrName || "");


        setSelectedEmployee({
            employeeId: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            hrId: emp.hrId || "",
            hrName: emp.hrName || ""
        });

        navigate("/mngreq", {
            state: {
                employeeId: emp.employeeId,
                employeeName: `${emp.firstName} ${emp.lastName}`
            }
        });

    };

    const [employeeRelations, setEmployeeRelations] = useState({
        managerId: '',
        managerName: '',
        hrId: '',
        hrName: ''
    });



    // Manager Timesheet state
    const [allTimesheets, setAllTimesheets] = useState([]); // Store all timesheets from the API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isModalsOpen, setIsModalsOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false); // New state for view modal
    const [showSearchInputs, setShowSearchInputs] = useState(false); // Toggle for search inputs
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const timesheetEmployeeId = location.state?.employeeId || sessionStorage.getItem("selectedEmployeeId") || "";

    // Edit state for timesheet entries
    const [editingEntry, setEditingEntry] = useState(null);
    const [editFormData, setEditFormData] = useState({});


    const managerId = sessionStorage.getItem("employeeId");

    // State for selected month and year
    const todayStr = getPropperDate();
    const todayIST = new Date(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(todayIST.getMonth());
    const [selectedYear, setSelectedYear] = useState(todayIST.getFullYear());

    // Month-Year that controls the table view (only updates when View is clicked)
    const [currentView, setCurrentView] = useState({
        month: selectedMonth,
        year: selectedYear
    });


    const storedEmpName =
        selectedEmployee?.name ||
        sessionStorage.getItem("selectedEmployeeName") ||
        sessionStorage.getItem("employeeName") ||
        "";

    const storedEmpId =
        timesheetEmployeeId ||
        selectedEmployee?.employeeId ||
        sessionStorage.getItem("selectedEmployeeId") ||
        "";

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


    // State for column filters
    const [filters, setFilters] = useState({
        date: 'All',
        employeeName: '',
        employeeId: '',
        clientName: '',
        projectName: '',

        loginTime: '',
        logoutTime: '',
        totalHours: '',
        status: '',
        remarks: ''
    });


    const getDateOnlyUTC = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        return d.toISOString().split("T")[0];
    };

    const handleFreezeTimesheets = async () => {
        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        const formattedStartDate = getDateOnlyUTC(new Date(startDate));
        const formattedEndDate = getDateOnlyUTC(new Date(endDate)); // No +1 needed

        try {
            const token = sessionStorage.getItem("token");
            const response = await api.put(
                `/daily-entry/freeze`,
                {
                    managerId: managerId,
                    employeeId: timesheetEmployeeId,
                    startDate: formattedStartDate,
                    endDate: formattedEndDate
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                alert(`Timesheets successfully frozen for Employee ${timesheetEmployeeId}`);
                setIsModalsOpen(false);
                setStartDate(null);   // optional reset
                setEndDate(null);     // optional reset
                fetchEmployeeData();
            } else {
                alert("Failed to freeze timesheets. Please try again.");
            }
        } catch (error) {
            console.error("Error freezing timesheets:", error);
            // Show specific backend error message if available
            const errorMsg = error.response?.data?.message || error.response?.data || "An error occurred while freezing timesheets.";
            alert(errorMsg);
        }
    };

    const handleUnfreezeEmployee = async () => {

        if (!selectedEmployee.employeeId) {
            alert("Please select an employee first.");
            return;
        }

        if (!startDate || !endDate) {
            alert("Please select start and end date.");
            return;
        }

        const token = sessionStorage.getItem("token");

        try {
            const payload = {
                managerId: employeeId,
                employeeId: selectedEmployee.employeeId,
                startDate: getDateOnly(startDate),
                endDate: getDateOnly(endDate)
            };

            await api.put("/daily-entry/unfreeze", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert(`Timesheets UNFROZEN for ${selectedEmployee.name}`);

            // ✅ Close modal & reset
            setIsModalsOpen(false);
            setStartDate(null);
            setEndDate(null);
            fetchEmployeeData();

        } catch (error) {
            alert(
                "❌ Unfreeze failed: " +
                (error.response?.data || error.message)
            );
        }
    };



    // This section is generally correct, ensuring the state is updated
    useEffect(() => {
        const storedEmpId = sessionStorage.getItem("selectedEmployeeId");
        const storedEmpName = sessionStorage.getItem("selectedEmployeeName") || sessionStorage.getItem("employeeName") || "";
        const storedHrId = sessionStorage.getItem("hrId") || selectedEmployee?.hrId || "";
        const storedHrName = sessionStorage.getItem("hrName") || selectedEmployee?.hrName || "";

        setSelectedEmployee({
            employeeId: storedEmpId || "",
            name: storedEmpName || "",
            hrId: storedHrId,
            hrName: storedHrName
        });
    }, [location.state]);






    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        }
        if (profileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileOpen]);

    // Fetch ALL timesheet data and approved leave dates
    // Fetch ALL timesheet data and approved leave dates
    const fetchEmployeeData = async () => {
        if (!timesheetEmployeeId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        const token = sessionStorage.getItem("token"); // JWT token

        try {
            // 1. Fetch Timesheets
            const timesheetsResponse = await api.get(
                `/daily-entry/employee/${timesheetEmployeeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setAllTimesheets(timesheetsResponse.data);

            // ⭐ 3. Extract Manager and HR Details from the first timesheet entry ⭐
            if (timesheetsResponse.data.length > 0) {
                const firstEntry = timesheetsResponse.data[0];
                setEmployeeRelations({
                    managerId: firstEntry.managerId || '',
                    managerName: firstEntry.managerName || '',
                    hrId: firstEntry.hrId || '',
                    hrName: firstEntry.hrName || ''
                });
            } else {
                // Reset if no timesheets found, or ideally, fetch from a separate employee details endpoint
                setEmployeeRelations({ managerId: '', managerName: '', hrId: '', hrName: '' });
            }


            // 2. Fetch Approved Leave Dates (CORRECTED ENDPOINT)
            try {
                const leaveResponse = await api.get(
                    `/leaves/approved-dates/${timesheetEmployeeId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
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

            } catch (leaveErr) {
                console.warn("Could not fetch approved leave dates.", leaveErr.response?.statusText || leaveErr.message);
                setApprovedLeaveDates([]); // Fallback to empty array
            }

            // 3. Fetch Holidays
            try {
                const holidayResponse = await api.get(
                    `/v1/holidays/employee/${timesheetEmployeeId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setHolidays(holidayResponse.data || []);
            } catch (holidayErr) {
                console.warn("Could not fetch holidays.", holidayErr.response?.statusText || holidayErr.message);
                setHolidays([]);
            }

        } catch (err) {
            setError(err.response?.data || "Failed to fetch employee timesheet entries.");
            console.error("Error fetching employee timesheets:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Rerun fetch when employeeId changes
        fetchEmployeeData();
    }, [timesheetEmployeeId]);


    const filteredEntries = useMemo(() => {
        if (!allTimesheets) return [];

        // 1. Filter API data to only include the selected month/year
        const timesheetsForSelectedMonth = allTimesheets.filter(entry => {
            if (!entry.date) return false;
            // Parse date once
            const entryDate = new Date(entry.date);

            // Ensure only entries for the selected month/year are included
            return (
                entryDate.getFullYear() === currentView.year &&
                entryDate.getMonth() === currentView.month

            );
        });

        // 2. Determine the number of days in the selected month
        const daysInMonth = new Date(currentView.year, currentView.month + 1, 0).getDate();

        const holidayMap = new Map();
        holidays.forEach(h => {
            const d = new Date(h.date);
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            holidayMap.set(key, h.holiday ? h.holiday.replace(/\uFFFD/g, "'").replace(/â€™/g, "'") : h.holiday);
        });

        // 3. Generate a list of all dates in the selected month
        const allDates = Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(Date.UTC(currentView.year, currentView.month, i + 1));

            return {
                date,
                dateStr: date.toISOString().split("T")[0], // YYYY-MM-DD
            };
        });


        // 4. Merge generated dates with actual timesheets, leaves, and holiday/weekend status
        const mergedEntries = allDates.map(({ date, dateStr }) => {

            // Find the actual timesheet entry for this date
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
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

            let remarks = foundEntry?.remarks || "";

            // Priority for Remarks: Leave > Holiday > Weekend > Timesheet Remark
            if (isApprovedLeave) {
                remarks = leaveType;
            } else if (!remarks) {
                if (holidayName) remarks = `${holidayName}`;
                else if (isWeekend) remarks = "Weekend";
            }

            // Return the combined entry
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
                frozen: false,
            };

            // Ensure remarks is correctly set based on priority
            baseEntry.remarks = remarks || (foundEntry?.remarks) || (holidayName ? `${holidayName}` : (isWeekend ? "Weekend" : "-"));

            // Clear time-related fields if it's an approved leave day or a non-working day with no timesheet entry
            if (isApprovedLeave) {
                baseEntry.clientName = "";
                baseEntry.projectName = "";
                baseEntry.loginTime = "";
                baseEntry.logoutTime = "";
                baseEntry.totalHours = 0;
                baseEntry.remarks = leaveType;
                baseEntry.workLocation = "";
            } else if (!foundEntry || !foundEntry.loginTime) {
                baseEntry.clientName = "";
                baseEntry.projectName = "";
                baseEntry.loginTime = "";
                baseEntry.logoutTime = "";
                baseEntry.totalHours = "";
                baseEntry.workLocation = "";
            }

            // Ensure isLeave flag is set
            baseEntry.isLeave = isApprovedLeave;

            return baseEntry;
        }).filter(entry => entry !== null);

        // 5. Apply table-level filters
        let finalFiltered = mergedEntries.filter(entry => {
            // Filter by clientName
            if (filters.clientName && !entry.clientName?.toLowerCase().includes(filters.clientName.toLowerCase())) {
                return false;
            }
            // Filter by projectName
            if (filters.projectName && !entry.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) {
                return false;
            }
            // Filter by loginTime
            if (filters.loginTime && !entry.loginTime?.toLowerCase().includes(filters.loginTime.toLowerCase())) {
                return false;
            }
            // Filter by logoutTime
            if (filters.logoutTime && !entry.logoutTime?.toLowerCase().includes(filters.logoutTime.toLowerCase())) {
                return false;
            }
            // Filter by remarks
            if (filters.remarks && !entry.remarks?.toLowerCase().includes(filters.remarks.toLowerCase())) {
                return false;
            }
            // Filter by totalHours
            // ✅ Filter by totalHours (FIXED)
            if (filters.totalHours) {
                const total = Number(entry.totalHours);

                // Ignore empty / invalid rows
                if (isNaN(total)) return false;

                if (filters.totalHours === "lessThan8" && total >= 8) {
                    return false;
                }

                if (filters.totalHours === "greaterThan8" && total < 8) {
                    return false;
                }
            }

            // Filter by status
            if (filters.status) {
                const isFrozen = entry.frozen === true;
                if (filters.status === "Frozen" && !isFrozen) return false;
                if (filters.status === "Active" && isFrozen) return false;
            }

            return true;
        });

        // 6. Apply date sorting
        if (filters.date !== 'All') {
            finalFiltered.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (filters.date === 'asc') {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            });
        }

        return finalFiltered;
    }, [
        allTimesheets,
        currentView.month,
        currentView.year,
        selectedEmployee,
        approvedLeaveDates,
        holidays,
        filters
    ]);



    const getDateOnly = (date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };



    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value
        }));
    };

    // Helper function to calculate total hours from login/logout times
    const calculateTotalHours = (loginTime, logoutTime) => {
        if (!loginTime || !logoutTime) return 0;

        try {
            // Parse time strings (HH:MM format)
            const [loginHours, loginMinutes] = loginTime.split(':').map(Number);
            const [logoutHours, logoutMinutes] = logoutTime.split(':').map(Number);

            // Validate time values
            if (isNaN(loginHours) || isNaN(loginMinutes) || isNaN(logoutHours) || isNaN(logoutMinutes)) {
                return 0;
            }

            // Convert to minutes since midnight
            const loginTotalMinutes = loginHours * 60 + loginMinutes;
            const logoutTotalMinutes = logoutHours * 60 + logoutMinutes;

            // Calculate difference in hours
            if (logoutTotalMinutes > loginTotalMinutes) {
                const diffMinutes = logoutTotalMinutes - loginTotalMinutes;
                const totalHours = diffMinutes / 60;
                return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
            } else {
                return 0; // Invalid time range
            }
        } catch (error) {
            console.error('Error calculating total hours:', error);
            return 0;
        }
    };

    // Edit handlers
    const convertTo24Hour = (timeStr) => {
        if (!timeStr) return '';
        const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
        if (!match) return timeStr;
        let [_, hours, minutes, period] = match;
        hours = parseInt(hours, 10);
        if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        else if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    };

    const convertTo12Hour = (time24) => {
        if (!time24) return '';
        const [hours24, minutes] = time24.split(':');
        let hours = parseInt(hours24, 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry.id);
        const login24 = convertTo24Hour(entry.loginTime);
        const logout24 = convertTo24Hour(entry.logoutTime);
        setEditFormData({
            clientName: entry.clientName || '',
            projectName: entry.projectName || '',
            loginTime: login24,
            logoutTime: logout24,
            totalHours: entry.totalHours || 0,
            remarks: entry.remarks || '',
            date: entry.date
        });
    };

    const handleCancelEdit = () => {
        setEditingEntry(null);
        setEditFormData({});
    };

    const handleInputChange = (field, value) => {
        setEditFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-calculate total hours when login or logout time changes
            if (field === 'loginTime' || field === 'logoutTime') {
                updated.totalHours = calculateTotalHours(updated.loginTime, updated.logoutTime);
            }

            return updated;
        });
    };

    const handleUpdate = async (entryId) => {
        try {
            const token = sessionStorage.getItem("token");

            // Prepare the update payload
            const updatePayload = {
                ...editFormData,
                loginTime: convertTo12Hour(editFormData.loginTime),
                logoutTime: convertTo12Hour(editFormData.logoutTime),
                totalHours: parseFloat(editFormData.totalHours) || 0,
                // Ensure date is included for new submissions
                date: editFormData.date || ""
            };

            // Determine if it's a new entry (placeholder ID) or existing
            const isNew = String(entryId).startsWith("empty-");

            let response;
            if (isNew) {
                // For new entries, use the submit endpoint
                console.log("Submitting new entry for date:", updatePayload.date);
                response = await api.post(
                    `/daily-entry/submit/${timesheetEmployeeId}`,
                    updatePayload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } else {
                // For existing entries, use the update endpoint
                console.log("Updating existing entry ID:", entryId);
                response = await api.put(
                    `/daily-entry/update/${entryId}`,
                    updatePayload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }

            if (response.status === 200 || response.status === 201) {
                // Refresh the data
                await fetchEmployeeData();
                setEditingEntry(null);
                setEditFormData({});
                const msg = isNew ? "Timesheet submitted successfully!" : "Timesheet updated successfully!";
                alert(msg);
            }
        } catch (error) {
            console.error("Error saving timesheet:", error);
            const errorMsg = error.response?.data?.message ||
                (typeof error.response?.data === 'string' ? error.response.data : "") ||
                error.message;
            setError("Failed to save timesheet: " + errorMsg);
            setTimeout(() => setError(""), 5000);
        }
    };


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

        try {
            const { managerId, managerName, hrId, hrName } = employeeRelations;
            const employeeId = selectedEmployee?.employeeId;
            const storedEmpName = selectedEmployee?.name;

            if (!employeeId) {
                alert("Employee ID is missing. Cannot download timesheets.");
                return;
            }

            const token = sessionStorage.getItem("token");

            // Fetch filed timesheets
            const timesheetsResponse = await api.get(
                `/daily-entry/employee/${employeeId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const employeeEntries = timesheetsResponse.data || [];

            // Fetch approved leave dates
            const leaveResponse = await api.get(
                `/leaves/approved-dates/${employeeId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const leaveData = leaveResponse.data || {};
            const approvedLeaveMap = {};
            Object.entries(leaveData).forEach(([date, type]) => {
                const d = new Date(date);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                const key = `${yyyy}-${mm}-${dd}`;
                approvedLeaveMap[key] = type;
            });

            // Fetch holidays
            const holidayResponse = await api.get(
                `/v1/holidays/employee/${employeeId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const employeeHolidays = holidayResponse.data || [];

            // Map holiday dates
            const holidayMap = new Map();
            employeeHolidays.forEach(h => {
                if (h.date) {
                    const d = new Date(h.date);
                    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
                    holidayMap.set(key, h.holiday ? h.holiday.replace(/\uFFFD/g, "'").replace(/â€™/g, "'") : h.holiday);
                }
            });

            // Map filed entries by date
            const entryMap = new Map();
            employeeEntries.forEach(entry => {
                if (entry.date) {
                    const key = entry.date.split("T")[0]; // YYYY-MM-DD
                    entryMap.set(key, entry);
                }
            });

            // ✅ Generate all dates within the range — fixed for timezone issues
            const allDates = [];
            let current = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
            const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

            while (current <= endUTC) {
                allDates.push(new Date(current));
                current.setUTCDate(current.getUTCDate() + 1);
            }

            // Prepare data to export
            const dataToExport = allDates.map((dateObj) => {
                const dateKey = getDateOnly(dateObj); // Use same helper as above
                // YYYY-MM-DD
                const day = String(dateObj.getUTCDate()).padStart(2, '0');
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const year = dateObj.getUTCFullYear();
                const formattedDate = `${day}-${month}-${year}`;

                const entry = entryMap.get(dateKey);
                const leaveType = approvedLeaveMap[dateKey];
                const isApprovedLeave = !!leaveType;
                const holidayName = holidayMap.get(dateKey);
                const dayOfWeek = dateObj.getUTCDay(); // Use UTC day to stay consistent
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                let remarks = entry?.remarks || "-";
                if (isApprovedLeave) remarks = leaveType;
                else if (!entry?.remarks) {
                    if (holidayName) remarks = `${holidayName}`;
                    else if (isWeekend) remarks = "Weekend";
                }

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
                };

                if (isApprovedLeave || !entry || !entry.loginTime) {
                    rowData["Client Name"] = "";
                    rowData["Project Name"] = "";
                    rowData["Login Time"] = "";
                    rowData["Logout Time"] = "";
                    rowData["Work Location"] = "";
                    rowData["Total Hours"] = "-";

                    // Preserve the remarks we already calculated (Leave, Holiday, Weekend)
                    rowData["Remarks"] = remarks;
                }

                return rowData;
            }).filter(row => row !== null);

            if (dataToExport.length === 0) {
                alert("No timesheet entries or leave days found for the selected date range.");
                return;
            }

            // Excel generation
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

            // Close modal after successful export and reset dates
            setIsModalOpen(false);
            setStartDate(null);
            setEndDate(null);

        } catch (error) {
            console.error("Error downloading timesheets:", error);
            alert("Failed to download timesheets.");
            // Close modal even on error and reset dates
            setIsModalOpen(false);
            setStartDate(null);
            setEndDate(null);
        }

    };


    const handleViewTimesheet = (e) => {
        e.preventDefault();

        // Update month/year used for table filtering
        setCurrentView({
            month: selectedMonth,
            year: selectedYear
        });

        setIsViewModalOpen(false);
    };





    return (
        <Sidebar>
            <div
                // This is the main outer container. Keep this for overall layout.
                style={{
                    marginTop: '0',
                    paddingTop: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    height: "70vh",
                    marginLeft: "0"
                }}
            >

                {/* THIS IS THE MODIFIED BUTTON ROW CONTAINER */}
                <div className="timesheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    {/* 1. The Back Button */}
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
                            transition: "all 0.3s ease",
                            width: "fit-content",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
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

                    {/* 2, 3, & 4. Container for Freeze, View, and Export Buttons */}
                    <div className="timesheet-actions"
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: "12px"
                        }}
                    >
                        <button
                            onClick={() => setIsModalsOpen(true)}
                            style={{
                                padding: "8px 16px",
                                background: "#00B3A4",
                                color: "white",
                                fontSize: "14px",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0, 179, 164, 0.2)",
                                transition: "all 0.3s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: "500",
                                flexShrink: 0,
                                whiteSpace: 'nowrap'
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
                            <LockIcon /> Freeze/Unfreeze
                        </button>
                        <button
                            onClick={() => setIsViewModalOpen(true)}
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
                                fontWeight: "500",
                                flexShrink: 0,
                                whiteSpace: 'nowrap'
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
                            <ViewIcon /> View Attendances
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
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
                                fontWeight: "500",
                                flexShrink: 0,
                                whiteSpace: 'nowrap'
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

                {/* Manager Timesheet Content */}
                <div className="p-4">

                    {/* Export Modal (Unchanged) */}
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



                                    <div className="date-input-group">
                                        {/* End Date DatePicker */}
                                        <label htmlFor="modal-end-date">End Date:</label>
                                        <SmartDatePicker
                                            value={endDate}
                                            onChange={(date) => setEndDate(date)}
                                            disabled={false}
                                        />


                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>

                                    <button onClick={handleDownload} className="download-btn">Download</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Freeze Modal (Unchanged) */}
                    {isModalsOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Freeze Timesheet</h3>
                                    <button onClick={() => setIsModalsOpen(false)} className="close-btn">&times;</button>
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
                                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'nowrap', width: '100%', boxSizing: 'border-box' }}>
                                    <button
                                        onClick={handleFreezeTimesheets}
                                        style={{
                                            padding: '10px 15px',
                                            background: '#00B3A4',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            boxShadow: '0 2px 8px rgba(0, 179, 164, 0.2)',
                                            transition: 'all 0.3s ease',
                                            whiteSpace: 'nowrap',
                                            flex: '1'
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
                                        Freeze
                                    </button>
                                    <button
                                        onClick={handleUnfreezeEmployee}
                                        style={{
                                            padding: '10px 15px',
                                            background: '#00B3A4',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            boxShadow: '0 2px 8px rgba(94, 234, 212, 0.3)',
                                            transition: 'all 0.3s ease',
                                            whiteSpace: 'nowrap',
                                            flex: '1'
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
                                        Unfreeze
                                    </button>
                                    <button
                                        onClick={() => setIsModalsOpen(false)}
                                        className="cancel-btn"
                                        style={{
                                            padding: '10px 15px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            borderRadius: '8px',
                                            whiteSpace: 'nowrap',
                                            flex: '1'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* View Attendance Modal (Unchanged) */}
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

                    {/* Employee Title */}
                    <h2 className="emp-title">
                        Attendance_{selectedEmployee.name || "Unknown"} ({getDisplayEmployeeId(selectedEmployee.employeeId) || "N/A"})
                    </h2>

                    {/* Success Message */}
                    {successMessage && (
                        <div style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            textAlign: 'center',
                            fontWeight: '600',
                            animation: 'fadeIn 0.3s ease-in'
                        }}>
                            {successMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Table Content (Unchanged) */}
                    {loading && <p>Loading timesheets...</p>}

                    {!loading && !error && (
                        <div className="table-wrapper table-responsive-container" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', overflowX: 'auto' }}>
                            <table
                                className="timesheet-table"
                                style={{ borderCollapse: "collapse", width: "100%" }}
                            >
                                <thead>
                                    <tr>
                                        {/* ... all the filter <th>s ... (Unchanged) */}
                                        {/* Date Filter */}
                                        <th style={{ color: '#ffffff', background: '#629AF1', textAlign: 'center' }}>
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
                                                        borderRadius: '0',
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

                                        {/* Client Filter */}
                                        <th style={{ padding: "4px", background: '#629AF1', color: "#fff", textAlign: 'center' }}>
                                            <span>Client</span>
                                            {showSearchInputs && (
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    value={filters.clientName}
                                                    onChange={(e) => handleFilterChange("clientName", e.target.value)}
                                                    style={{ marginTop: "2px", width: "100%", height: "20px", fontSize: "10px", padding: "0 4px" }}
                                                />
                                            )}
                                        </th>

                                        {/* Project Filter */}
                                        <th style={{ padding: "4px", background: '#629AF1', color: "#fff", textAlign: 'center' }}>
                                            <span>Project</span>
                                            {showSearchInputs && (
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    value={filters.projectName}
                                                    onChange={(e) => handleFilterChange("projectName", e.target.value)}
                                                    style={{ marginTop: "2px", width: "100%", height: "20px", fontSize: "10px", padding: "0 4px" }}
                                                />
                                            )}
                                        </th>

                                        {/* Login Time Filter */}
                                        <th style={{ padding: "4px", background: '#629AF1', color: "#fff", width: "10%", textAlign: 'center' }}>
                                            <span>Login Time</span>
                                            {showSearchInputs && (
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    value={filters.loginTime}
                                                    onChange={(e) => handleFilterChange("loginTime", e.target.value)}
                                                    style={{ marginTop: "2px", width: "100%", height: "20px", fontSize: "10px", padding: "0 4px" }}
                                                />
                                            )}
                                        </th>

                                        {/* Logout Time Filter */}
                                        <th style={{ padding: "4px", background: '#629AF1', color: "#fff", width: "10%", textAlign: 'center' }}>
                                            <span>Logout Time</span>
                                            {showSearchInputs && (
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    value={filters.logoutTime}
                                                    onChange={(e) => handleFilterChange("logoutTime", e.target.value)}
                                                    style={{ marginTop: "2px", width: "100%", height: "20px", fontSize: "10px", padding: "0 4px" }}
                                                />
                                            )}
                                        </th>

                                        {/* Total Hours Filter */}
                                        <th style={{ color: '#ffffff', background: '#629AF1', textAlign: 'center' }}>
                                            <span>Total Hours</span>
                                            {showSearchInputs && (
                                                <select
                                                    value={filters.totalHours}
                                                    onChange={(e) => handleFilterChange('totalHours', e.target.value)}
                                                    style={{
                                                        height: '20px',
                                                        borderRadius: '0',
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

                                        {/* Status Filter */}
                                        <th style={{ padding: "8px", background: '#629AF1', color: "#fff", textAlign: 'center' }}>
                                            <span>Status</span>
                                            {showSearchInputs && (
                                                <select
                                                    value={filters.status}
                                                    onChange={(e) => handleFilterChange("status", e.target.value)}
                                                    style={{
                                                        height: '25px',
                                                        borderRadius: '0',
                                                        border: '1px solid #ccc',
                                                        fontSize: '14px',
                                                        width: '100%',
                                                        marginTop: '8px',
                                                        color: 'black'
                                                    }}
                                                >
                                                    <option value="">All</option>
                                                    <option value="Active">Active</option>
                                                    <option value="Frozen">Frozen</option>
                                                </select>
                                            )}
                                        </th>

                                        {/* Remarks Filter */}
                                        <th style={{ padding: "8px", background: '#629AF1', color: "#fff", textAlign: 'center' }}>
                                            <span>Remarks</span>
                                            {showSearchInputs && (
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    value={filters.remarks}
                                                    onChange={(e) => handleFilterChange("remarks", e.target.value)}
                                                    style={{ marginTop: "8px", width: "90%" }}
                                                />
                                            )}
                                        </th>
                                        <th style={{ padding: "8px", background: '#629AF1', color: "#fff", textAlign: 'center' }}>
                                            <span>Work Location</span>
                                        </th>

                                        {/* Actions Column */}
                                        <th style={{ padding: "8px", background: '#629AF1', color: "#fff", textAlign: 'center' }}>
                                            <span>Actions</span>
                                        </th>
                                    </tr>
                                </thead>

                                {/* ... rest of the table body ... (Unchanged) */}
                                <tbody>
                                    {filteredEntries.map((entry) => {
                                        // Find the date object to check for weekends
                                        const dateObj = new Date(entry.date);
                                        // Use the logic already established in useMemo for remarks and styling
                                        const isLeave = entry.isLeave;
                                        const isHoliday = entry.remarks?.startsWith("");
                                        const isWeekend = entry.remarks === "Weekend";

                                        // Determine the background color
                                        let rowBackgroundColor = isLeave ? "#d3d3d3" : "#f4f6f8";

                                        return (
                                            <tr key={entry.id} style={{ backgroundColor: rowBackgroundColor }}>
                                                <td data-label="Date" style={{ padding: "8px", textAlign: "center", border: "1px solid #ccc" }}>
                                                    {formatDate(entry.date)}
                                                </td>
                                                <td data-label="Client" style={{ padding: "8px", textAlign: "center", border: "1px solid #ccc" }}>
                                                    {editingEntry === entry.id ? (
                                                        <input
                                                            type="text"
                                                            value={editFormData.clientName}
                                                            onChange={(e) => handleInputChange('clientName', e.target.value)}
                                                            style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '0' }}
                                                            placeholder="Client name"
                                                        />
                                                    ) : (
                                                        entry.clientName || "-"
                                                    )}
                                                </td>
                                                <td data-label="Project" style={{ padding: "8px", textAlign: "center", border: "1px solid #ccc" }}>
                                                    {editingEntry === entry.id ? (
                                                        <input
                                                            type="text"
                                                            value={editFormData.projectName}
                                                            onChange={(e) => handleInputChange('projectName', e.target.value)}
                                                            style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '0' }}
                                                            placeholder="Project name"
                                                        />
                                                    ) : (
                                                        entry.projectName || "-"
                                                    )}
                                                </td>
                                                <td data-label="Login Time" style={{ padding: "8px", textAlign: "center", border: "1px solid #ccc" }}>
                                                    {editingEntry === entry.id ? (
                                                        <input
                                                            type="time"
                                                            value={editFormData.loginTime}
                                                            onChange={(e) => handleInputChange('loginTime', e.target.value)}
                                                            style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '0' }}
                                                        />
                                                    ) : (
                                                        entry.loginTime || "-"
                                                    )}
                                                </td>
                                                <td data-label="Logout Time" style={{ padding: "8px", textAlign: "center", border: "1px solid #ccc" }}>
                                                    {editingEntry === entry.id ? (
                                                        <input
                                                            type="time"
                                                            value={editFormData.logoutTime}
                                                            onChange={(e) => handleInputChange('logoutTime', e.target.value)}
                                                            style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '0' }}
                                                        />
                                                    ) : (
                                                        entry.logoutTime || "-"
                                                    )}
                                                </td>
                                                <td data-label="Total Hours" style={{ padding: "8px", textAlign: "center", border: "1px solid #ccc" }}>
                                                    {editingEntry === entry.id ? (
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            value={editFormData.totalHours}
                                                            readOnly
                                                            style={{
                                                                width: '80px',
                                                                padding: '4px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '0',
                                                                backgroundColor: '#f5f5f5',
                                                                cursor: 'not-allowed'
                                                            }}
                                                            title="Auto-calculated from login/logout times"
                                                        />
                                                    ) : (
                                                        formatTotalHours(entry.totalHours)
                                                    )}
                                                </td>
                                                <td data-label="Status" style={{ padding: "8px", textAlign: "center", border: "1px solid #ccc", color: "#0c0b0cff", fontWeight: "600" }}>
                                                    {isLeave ? "Leave" : (entry.frozen ? "Freezed" : "Active")}
                                                </td>
                                                <td
                                                    data-label="Remarks"
                                                    style={{
                                                        border: "1px solid #ccc",
                                                        padding: "8px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {editingEntry === entry.id ? (
                                                        <input
                                                            type="text"
                                                            value={editFormData.remarks}
                                                            onChange={(e) => handleInputChange('remarks', e.target.value)}
                                                            style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '0' }}
                                                            placeholder="Remarks"
                                                        />
                                                    ) : (
                                                        entry.remarks || "-"
                                                    )}
                                                </td>
                                                <td data-label="Work Location" style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                                                    {entry.workLocation || "-"}
                                                </td>
                                                <td data-label="Actions" style={{ padding: "8px", border: "1px solid #ccc", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    {editingEntry === entry.id ? (
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleUpdate(entry.id)}
                                                                style={{
                                                                    padding: '6px',
                                                                    background: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '0',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                                                            >
                                                                <UpdateIcon />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                style={{
                                                                    padding: '6px',
                                                                    background: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '0',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                                                            >
                                                                <CancelIcon />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(entry)}
                                                            disabled={entry.frozen}
                                                            style={{
                                                                padding: '6px',
                                                                background: entry.frozen ? '#9ca3af' : '#0D9488',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '0',
                                                                cursor: entry.frozen ? 'not-allowed' : 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '32px',
                                                                height: '32px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!entry.frozen) e.currentTarget.style.background = '#0a7d6f';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!entry.frozen) e.currentTarget.style.background = '#0D9488';
                                                            }}
                                                            title={entry.frozen ? "Cannot edit frozen timesheet" : "Edit timesheet"}
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
}

export default Mngtimesheetrequest;


