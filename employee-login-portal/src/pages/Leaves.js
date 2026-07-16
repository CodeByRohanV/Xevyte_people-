import React, { useState, useEffect, useRef } from 'react';
import { getPropperDate, parseISTDateStringToDatePickerValue, formatDateTimeToIST, formatDateToIST, getISTAsDateObject } from '../utils/DateUtils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Leave.css'

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Sidebar from "./Sidebar.js";
import LeavesDraft from './LeavesDraft';
import LeaveHistory from './LeaveHistory';
import MyTeamLeave from './MyTeamLeave';
import ToastNotification from '../components/ToastNotification';
import api from "../api";

import { registerLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB'; // Monday as first day of week
import { format } from 'date-fns';


registerLocale('en-GB', enGB);

// SmartDatePicker component matching onboarding Date of Birth calendar
const SmartDatePicker = ({ selected, onChange, minDate, maxDate, dayClassName, disabled, selectsStart, selectsEnd, startDate, endDate }) => {
    const [open, setOpen] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setShowMonthDropdown(false);
                setShowYearDropdown(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <DatePicker
            selected={selected}
            disabled={disabled}
            onChange={(date) => {
                onChange(date);
                setTimeout(() => setOpen(false), 20);
            }}
            onSelect={() => setOpen(false)}
            open={open}
            onInputClick={() => setOpen(true)}
            onClickOutside={() => {
                setOpen(false);
                setShowMonthDropdown(false);
                setShowYearDropdown(false);
            }}
            dateFormat="dd-MM-yyyy"
            calendarClassName="no-gap-calendar"
            dayClassName={dayClassName}
            wrapperClassName="full-width-picker"
            minDate={minDate}
            maxDate={maxDate}
            selectsStart={selectsStart}
            selectsEnd={selectsEnd}
            startDate={startDate}
            endDate={endDate}
            strictParsing
            locale="en-GB"
            popperPlacement="top-start"
            portalId="root"
            placeholderText="DD-MM-YYYY"

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
                                    <div className="relative-dropdown-container">
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
                                        {showMonthDropdown && (
                                            <div className="header-dropdown month-dropdown">
                                                <div className="dropdown-scroll-pane">
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
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative-dropdown-container">
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
                    </div>
                );
            }}
        />
    );
};

function Leaves() {

    const location = useLocation();
    const draftToEdit = location.state?.draftToEdit;

    // Assuming you already have leaveRequest, setLeaveRequest, setFile, setTotalDays in state
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const draftId = queryParams.get('draftId');

        if (draftId) {
            // 1. Set the active tab to 'applyLeave' to show the form
            setActiveTab('applyLeave');

            // 2. Fetch the draft details using the existing function
            fetchDraftById(draftId);

            // 3. Clean up the URL so that refreshing the page doesn't keep loading the draft
            navigate(location.pathname, { replace: true });
        }
    }, [location.search]);

    const employeeId = sessionStorage.getItem("employeeId");

    const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

    const [profilePic, setProfilePic] = useState(sessionStorage.getItem("employeeProfilePic") || require('../assets/OIP.jpg'));

    const [searchTerm, setSearchTerm] = useState('');
    const [profileOpen, setProfileOpen] = useState(false);
    const fileInputRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const navigate = useNavigate();
    // const location = useLocation();
    const modalRef = useRef(null);
    const [leavesData, setLeavesData] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [canViewTasks, setCanViewTasks] = useState(false);
    const [activeTab, setActiveTab] = useState('applyLeave');
    const tabsRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Handle tab scrolling
    const handleScroll = () => {
        if (tabsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    // Scroll tab container
    const scrollTabs = (direction) => {
        if (tabsRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = direction === 'left'
                ? tabsRef.current.scrollLeft - scrollAmount
                : tabsRef.current.scrollLeft + scrollAmount;

            tabsRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    const [showInlineErrors, setShowInlineErrors] = useState(false);

    const [isContractOpen, setIsContractOpen] = useState(false);
    const [validationErrors, setValidationErrors] = React.useState({});
    const [allocationErrors, setAllocationErrors] = React.useState([]);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [leaveBalance, setLeaveBalance] = useState({
        casualTotal: 0,
        casualUsed: 0,
        sickTotal: 0,
        sickUsed: 0,
        lopUsed: 0,
        encashedCount: 0,
        detailedBalances: [] // ✅ New detailed balances from backend
    });
    // const [isModalOpen, setIsModalToOpen] = useState(true);
    const [showBalances, setShowBalances] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveTypeConfigs, setLeaveTypeConfigs] = useState([]); // ✅ Store configs

    // Add halfDay to initial state
    const [leaveRequest, setLeaveRequest] = useState({
        id: null,
        type: 'Select',
        startDate: null,
        endDate: null,
        halfDay: false, // ✅ Added
        reason: '',
        uploadedFile: null,
        fileName: null,
        existingFileName: null
    });

    // ✅ Restoring missing state variables
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [totalDays, setTotalDays] = useState(0);
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [showLOPAlert, setShowLOPAlert] = useState(false);
    const [falloutInfo, setFalloutInfo] = useState(""); // ✅ Added for Spillover Prompt
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(false);
    const [pendingApprovalsError, setPendingApprovalsError] = useState("");

    // ✅ Optional Holidays for Optional Leave Type
    const [optionalHolidays, setOptionalHolidays] = useState([]);
    const [selectedOptionalHoliday, setSelectedOptionalHoliday] = useState("");
    const [usedOptionalHolidays, setUsedOptionalHolidays] = useState([]); // Track used holidays

    const [viewingPolicyRequest, setViewingPolicyRequest] = useState(null);
    const [policyDetails, setPolicyDetails] = useState(null);
    const [policyDetailsLoading, setPolicyDetailsLoading] = useState(false);
    const [appliedLeaveDates, setAppliedLeaveDates] = useState([]); // ✅ Track dates with existing leave

    // Toast notification state
    const [toast, setToast] = useState({
        isOpen: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        const fetchLeaveTypes = async () => {
            try {
                const token = sessionStorage.getItem("token");
                // ✅ Fetch configs instead of just strings
                const empId = sessionStorage.getItem("employeeId");
                console.log("🔄 Fetching leave type configs for employee:", empId);

                // ✅ Pass employeeId to filter by eligibility
                const res = await api.get(`/leaves/types/config?employeeId=${empId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const configs = res.data || [];
                console.log("📦 Received leave type configs from backend:", configs);
                console.log("🔍 Checking for optional holidays in configs:");
                configs.forEach(config => {
                    if (config.optionalHolidays) {
                        console.log(`  ✅ ${config.name}: ${config.optionalHolidays}`);
                    }
                });

                setLeaveTypeConfigs(configs);
                setLeaveTypes(configs.map(c => c.name)); // Extract names for dropdown
            } catch (err) {
                console.error("❌ Failed to fetch leave types:", err);
            }
        };

        fetchLeaveTypes();
        fetchUsedOptionalHolidays(); // Fetch used optional holidays on mount
    }, []);

    // Handle tab scroll position
    useEffect(() => {
        const checkScroll = () => {
            setTimeout(handleScroll, 100);
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);

        return () => {
            window.removeEventListener('resize', checkScroll);
        };
    }, []);

    // ✅ Clean Holiday Name (removes (optional) suffix)
    const cleanHolidayName = (name) => {
        if (!name) return "";
        return name.replace(/\s*\(optional\)/gi, "").trim();
    };

    const [allHolidaysRaw, setAllHolidaysRaw] = useState([]);



    useEffect(() => {
        if (employeeId) {
            const token = sessionStorage.getItem("token");

            api
                .get(`/access/assigned-ids/${employeeId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then(res => {
                    const { manager, hr } = res.data;

                    const canView = manager || hr;
                    setCanViewTasks(canView);
                })
                .catch(err => {
                    console.error("Error fetching task visibility:", err);
                    setCanViewTasks(false);
                });
        }
    }, [employeeId]);


    // ✅ LOP Reset Logic: Every month midnight (11:59:59 IST), make LOP zero in UI
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date(); // local time is fine for interval check, but logical midnight check in IST might require more precise offset handling. 
            // For UI reset, simple local check or just checking if day changed "in backend time" is better.
            // Simplified: we will trust backend reset more, but for UI we leave as is or update if user sees wrong reset.
            // Keeping existing logic as it's just a UI sweetener.
            const isLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() === now.getDate();

            // Check for 11:59:59 IST on the last day of the month
            if (isLastDay && now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 59) {
                console.log("🌙 Monthly transition: Resetting LOP count in UI at 11:59:59 IST");
                setLeaveBalance(prev => ({
                    ...prev,
                    lopUsed: 0
                }));

                // Refresh balances from backend shortly after midnight to sync for the new month
                setTimeout(() => {
                    fetchLeaveBalance();
                }, 2000);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);




    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setViewingPolicyRequest(null);
    };

    const fetchHolidays = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const employeeId = sessionStorage.getItem("employeeId");

            const res = await api.get(
                `/leaves/holidays/location/${employeeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data || [];
            setAllHolidaysRaw(data);

            // ✅ Filter out optional holidays - only include mandatory/public holidays
            const mandatoryHolidays = data.filter(h =>
                !h.holiday?.toLowerCase().includes("(optional)")
            );

            // Parse holidays as local dates to show correctly in DatePicker
            const holidayDates = mandatoryHolidays.map(h => {
                // h.date is YYYY-MM-DD
                const [y, m, d] = h.date.split('-').map(Number);
                return new Date(y, m - 1, d);
            });

            setHolidays(holidayDates);

        } catch (err) {
            console.error("Failed to fetch location-based holidays:", err);
        }
    };

    // Fetch used optional holidays for the logged-in employee
    const fetchUsedOptionalHolidays = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const empId = sessionStorage.getItem("employeeId");

            const res = await api.get(`/leaves/used-optional-holidays/${empId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUsedOptionalHolidays(res.data || []);
            console.log("📋 Used optional holidays:", res.data);
        } catch (err) {
            console.error("❌ Failed to fetch used optional holidays:", err);
        }
    };




    const fetchLeaveBalance = async () => {
        if (!employeeId) return;
        try {
            const token = sessionStorage.getItem("token");

            // ✅ Fetch BOTH summary and detailed
            const [summaryRes, detailedRes] = await Promise.all([
                api.get(`/leaves/balance/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get(`/leaves/balance-detailed/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            const data = summaryRes.data;
            const detailed = detailedRes.data;

            setLeaveBalance({
                casualTotal: data.casualTotal || 0,
                casualUsed: data.casualUsed || 0,
                sickTotal: data.sickTotal || 0,
                sickUsed: data.sickUsed || 0,
                lopUsed: data.lopUsed || 0,
                encashedCount: data.encashedCount || 0,
                detailedBalances: detailed || []
            });
        } catch (err) {
            console.error("Failed to fetch leave balance:", err);
            alert("Failed to fetch leave balance. Please try again later.");
        }
    };

    const fetchLeaveHistory = async () => {
        if (!employeeId) return;
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            // ✅ Replace fetch with Axios
            const response = await api.get(`/leaves/employee/${employeeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = response.data; // Axios handles JSON automatically
            // ✅ Show all leaves including cancelled ones in employee history
            // ✅ Normalize "Pending Level 1" -> "Pending"
            const normalizedData = Array.isArray(data) ? data.map(leave => ({
                ...leave,
                status: leave.status === 'Pending Level 1' ? 'Pending' : leave.status
            })) : data;
            setLeavesData(normalizedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'applyLeave') {
            fetchLeaveHistory(); // ✅ Fetch latest leave data for overlap validation
        }
        if (activeTab === 'history') {
            fetchLeaveHistory();
        }
        // ✅ Refresh balance when switching to balances tab
        if (activeTab === 'balances') {
            fetchLeaveBalance();
        }

    }, [activeTab, employeeId]);





    useEffect(() => {
        if (policyDetails) {
            console.log("STATE: policyDetails updated", policyDetails);
        }
    }, [policyDetails]);

    const handleViewPolicyDetails = async (request) => {
        setViewingPolicyRequest(request);
        setPolicyDetailsLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const res = await api.get(`/admin/leave-policy/summary/${request.leaveTypeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("DEBUG: Policy Details Fetched for ID", request.leaveTypeId, res.data);
            // Backend might return leaveType instead of leavePolicy in some legacy formats,
            // but LeavePolicySummaryResponse.java says leavePolicy.
            setPolicyDetails(res.data);
        } catch (err) {
            console.error("Failed to fetch policy details:", err);
            alert("Failed to load policy details");
        } finally {
            setPolicyDetailsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveHistory();
        fetchLeaveBalance();
        fetchHolidays();

        const loadDraft = async () => {
            if (location.state && location.state.draftToEdit) {
                const draft = location.state.draftToEdit;
                setLeaveRequest({
                    ...draft,
                    startDate: draft.startDate ? new Date(draft.startDate + "T00:00:00") : null,
                    endDate: draft.endDate ? new Date(draft.endDate + "T00:00:00") : null,
                });

                if (draft.fileName && draft.id) {
                    try {
                        const token = sessionStorage.getItem("token");
                        const res = await api.get(`/leaves/drafts/download/${draft.id}`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            responseType: "blob",
                        });

                        const blob = res.data;
                        const file = new File([blob], draft.fileName, { type: blob.type });
                        setFile(file);
                    } catch (err) {
                        console.error("❌ Failed to fetch draft file:", err);
                    }
                }

                setIsModalOpen(true);
                navigate(location.pathname, { replace: true });
            }
        };

        loadDraft();

        if (employeeId) {
            const token = sessionStorage.getItem("token");

            api
                .get(`/profile/${employeeId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((res) => {
                    const data = res.data;
                    if (data.profilePic) {
                        setProfilePic(data.profilePic);
                        sessionStorage.setItem("employeeProfilePic", data.profilePic);
                    }
                    if (data.name) {
                        setEmployeeName(data.name);
                        sessionStorage.setItem("employeeName", data.name);
                    }
                })
                .catch((err) => console.error("Failed to fetch profile info:", err));
        }
    }, [employeeId, location.state, navigate, location.pathname]);

    useEffect(() => {
        setLeaveRequest(prev => ({
            ...prev,
            type: 'Select'
        }));
    }, []);

    // ✅ Half Day Handler
    const handleHalfDayChange = (e) => {
        setLeaveRequest({ ...leaveRequest, halfDay: e.target.checked });
    };

    useEffect(() => {
        const { startDate, endDate, type, halfDay } = leaveRequest;

        // Reset if missing required fields
        if (!startDate || !endDate || type === 'Select') {
            setTotalDays(0);
            setFormError("");
            setShowLOPAlert(false);
            return;
        }

        // Start and End dates formatted for API (YYYY-MM-DD)
        // Start and End dates formatted for API (YYYY-MM-DD)
        const sDate = format(startDate, 'yyyy-MM-dd');
        const eDate = format(endDate, 'yyyy-MM-dd');

        // Basic date validation
        if (sDate > eDate) {
            setTotalDays(0);
            setFormError("End date must be on or after start date.");
            setShowLOPAlert(false);
            return;
        }

        if (halfDay) {
            if (sDate !== eDate) {
                setTotalDays(0);
                setFormError("Half Day leave is valid only for a single day.");
                return;
            }
        }

        // Fetch calculation from backend
        const calculateDays = async () => {
            try {
                const token = sessionStorage.getItem("token");
                // Using existing 'api' axios instance
                const response = await api.get(`/leaves/calculate-preview`, {
                    params: {
                        startDate: sDate,
                        endDate: eDate,
                        leaveType: type,
                        isHalfDay: halfDay,
                        employeeId: employeeId
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

                const details = response.data;
                const days = details.totalDays;

                setTotalDays(days);
                setFormError(""); // Clear any previous errors if successful

                // ✅ Balance Check & Quota Exhausted Logic
                const balObj = (leaveBalance.detailedBalances || []).find(b => b.type === type);
                const available = balObj ? balObj.balance : 0;

                if (type === "LOP") {
                    setShowLOPAlert(false);
                    setFalloutInfo("");
                    setFormError("");
                } else if (days > available) {
                    setShowLOPAlert(true);
                    setFalloutInfo("");
                    setFormError(""); // User requested to remove this message from under End Date
                } else {
                    setShowLOPAlert(false);
                    setFalloutInfo("");
                    setFormError("");
                }

            } catch (error) {
                console.error("Calculation Error:", error);
                setTotalDays(0);

                let detailedMsg = "Calculation Failed. ";
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    detailedMsg += `Status: ${error.response.status}. `;
                    if (error.response.data) {
                        const d = error.response.data;
                        const serverMsg = typeof d === 'object' ? (d.message || JSON.stringify(d)) : d;
                        detailedMsg += `Message: ${serverMsg}`;
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    detailedMsg += "No response from server. Check network or backend status.";
                } else {
                    // Something happened in setting up the request that triggered an Error
                    detailedMsg += error.message;
                }
                setFormError(detailedMsg);
            }
        };

        calculateDays();

    }, [leaveRequest.startDate, leaveRequest.endDate, leaveRequest.type, leaveRequest.halfDay, leaveBalance]);



    useEffect(() => {
        // Clear the file error if the conditions for mandatory upload are no longer met
        if (leaveRequest.type !== "Sick" || totalDays <= 2) {
            setFileError("");
        }
    }, [leaveRequest.type, totalDays]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // ✅ If leave type is changed, check for optional holidays
        if (name === "type") {
            const isOptional = value && value.toLowerCase().includes("optional");

            if (isOptional) {
                console.log("🎉 Optional Leave selected, filtering from all holidays");
                const optionalHols = allHolidaysRaw
                    .filter(h => h.holiday?.toLowerCase().includes("(optional)"))
                    .map(h => ({
                        name: cleanHolidayName(h.holiday),
                        date: h.date
                    }));
                console.log("🎊 Found optional holidays:", optionalHols);
                setOptionalHolidays(optionalHols);
            } else {
                setOptionalHolidays([]);
            }
            setSelectedOptionalHoliday(""); // Reset selection when type changes
        }

        if (name === "type" && value === "Select") {
            setFormError("Please select a valid leave type.");
            setLeaveRequest({ ...leaveRequest, [name]: "Select" });
        } else {
            setFormError("");

            // ✅ Enforce 1-day restriction when type is changed to Menstrual Leave
            if (name === "type" && value && value.toLowerCase().includes("menstrual")) {
                if (leaveRequest.startDate && leaveRequest.endDate) {
                    const startDateOnly = new Date(leaveRequest.startDate);
                    startDateOnly.setHours(0, 0, 0, 0);
                    const endDateOnly = new Date(leaveRequest.endDate);
                    endDateOnly.setHours(0, 0, 0, 0);

                    if (startDateOnly.getTime() !== endDateOnly.getTime()) {
                        alert("⚠️ Menstrual Leave can only be applied for 1 day.\n\nThe end date has been automatically set to match the start date.");
                        setLeaveRequest({ ...leaveRequest, [name]: value, endDate: leaveRequest.startDate });
                        return; // Exit early since we've updated the state
                    }
                }
            }

            setLeaveRequest({ ...leaveRequest, [name]: value });
        }
    };


    const handleStartDateChange = (date) => {
        // ✅ For Menstrual Leave, automatically set end date to same as start date (single day only)
        if (date && leaveRequest.type && leaveRequest.type.toLowerCase().includes("menstrual")) {
            const today = getISTAsDateObject(); // ✅ Use IST today
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);

            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const requestMonth = date.getMonth();
            const requestYear = date.getFullYear();

            // ✅ Check if trying to apply for past month
            if (requestYear < currentYear || (requestYear === currentYear && requestMonth < currentMonth)) {
                alert("⚠️ Menstrual Leave can only be applied for the current month.\n\nYou cannot apply for previous months. Please select a date in "
                    + today.toLocaleString('default', { month: 'long', year: 'numeric' }) + ".");
                setLeaveRequest({ ...leaveRequest, startDate: null, endDate: null });
                return;
            }

            // ✅ Check if trying to apply for future month
            if (requestYear > currentYear || (requestYear === currentYear && requestMonth > currentMonth)) {
                alert("⚠️ Menstrual Leave can only be applied for the current month.\n\nYou cannot apply for future months. Please select a date in "
                    + today.toLocaleString('default', { month: 'long', year: 'numeric' }) + ".");
                setLeaveRequest({ ...leaveRequest, startDate: null, endDate: null });
                return;
            }

            const existingMenstrualLeaveInMonth = leavesData.filter(leave => {
                if (!leave.type || !leave.type.toLowerCase().includes("menstrual")) return false;
                // ✅ Only count APPROVED or PENDING leaves (not REJECTED or CANCELLED)
                if (leave.status !== "APPROVED" && !(leave.status || "").toUpperCase().startsWith("PENDING")) return false;

                const leaveDate = new Date(leave.startDate);
                return leaveDate.getMonth() === requestMonth && leaveDate.getFullYear() === requestYear;
            });

            if (existingMenstrualLeaveInMonth.length > 0) {
                alert("⚠️ You can only apply for 1 Menstrual Leave per month.\n\nYou have already applied for Menstrual Leave in "
                    + date.toLocaleString('default', { month: 'long', year: 'numeric' }) + ".\n\nPlease select a different month.");
                setLeaveRequest({ ...leaveRequest, startDate: null, endDate: null });
                return;
            }

            // ✅ Auto-set end date to same as start date (Menstrual Leave is always 1 day)
            setLeaveRequest({ ...leaveRequest, startDate: date, endDate: date });
        } else {
            setLeaveRequest({ ...leaveRequest, startDate: date });
        }
    };

    const handleEndDateChange = (date) => {
        // ✅ For Menstrual Leave, end date must equal start date (single day only)
        if (date && leaveRequest.type && leaveRequest.type.toLowerCase().includes("menstrual")) {
            if (!leaveRequest.startDate) {
                alert("⚠️ Please select a start date first for Menstrual Leave.");
                return;
            }

            const today = getISTAsDateObject(); // ✅ Use IST today
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);

            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const requestMonth = date.getMonth();
            const requestYear = date.getFullYear();

            // ✅ Check if trying to apply for future month
            if (requestYear > currentYear || (requestYear === currentYear && requestMonth > currentMonth)) {
                alert("⚠️ Menstrual Leave can only be applied for the current month.\n\nYou cannot apply for future months. Please select a date in "
                    + today.toLocaleString('default', { month: 'long', year: 'numeric' }) + ".");
                setLeaveRequest({ ...leaveRequest, startDate: null, endDate: null });
                return;
            }

            // Check if end date is different from start date
            const startDateOnly = new Date(leaveRequest.startDate);
            startDateOnly.setHours(0, 0, 0, 0);
            const endDateOnly = new Date(date);
            endDateOnly.setHours(0, 0, 0, 0);

            if (startDateOnly.getTime() !== endDateOnly.getTime()) {
                alert("⚠️ Menstrual Leave can only be applied for 1 day.\n\nThe end date has been automatically set to match the start date.");
                setLeaveRequest({ ...leaveRequest, endDate: leaveRequest.startDate });
                return;
            }

            const existingMenstrualLeaveInMonth = leavesData.filter(leave => {
                if (!leave.type || !leave.type.toLowerCase().includes("menstrual")) return false;
                // ✅ Only count APPROVED or PENDING leaves (not REJECTED or CANCELLED)
                if (leave.status !== "APPROVED" && !(leave.status || "").toUpperCase().startsWith("PENDING")) return false;

                const leaveDate = new Date(leave.startDate);
                return leaveDate.getMonth() === requestMonth && leaveDate.getFullYear() === requestYear;
            });

            if (existingMenstrualLeaveInMonth.length > 0) {
                alert("⚠️ You can only apply for 1 Menstrual Leave per month.\n\nYou have already applied for Menstrual Leave in "
                    + date.toLocaleString('default', { month: 'long', year: 'numeric' }) + ".\n\nPlease select a different month.");
                setLeaveRequest({ ...leaveRequest, startDate: null, endDate: null });
                return;
            }

            setLeaveRequest({ ...leaveRequest, endDate: date });
        } else {
            setLeaveRequest({ ...leaveRequest, endDate: date });
        }
    };

    const handleOptionalHolidayChange = (e) => {
        const val = e.target.value;

        // Check if this holiday is already used
        if (usedOptionalHolidays.includes(val)) {
            alert(`You have already used "${val}" optional holiday. Please select a different holiday.`);
            return;
        }

        const holiday = optionalHolidays.find(h => h.name === val);
        if (holiday && holiday.date) {
            // Parse YYYY-MM-DD to local time 00:00
            const [y, m, d] = holiday.date.split('-').map(Number);
            const holidayDate = new Date(y, m - 1, d);

            const today = getISTAsDateObject(); // ✅ Use IST today
            today.setHours(0, 0, 0, 0);

            if (holidayDate < today) {
                alert(`The optional holiday "${val}" (${holiday.date.split('-').reverse().join('-')}) has already passed. You can only apply for future optional holidays.`);
                return;
            }

            setSelectedOptionalHoliday(val);
            setLeaveRequest(prev => ({ ...prev, startDate: holidayDate, endDate: holidayDate }));
        } else {
            setSelectedOptionalHoliday(val);
        }
    };

    const applyLeaveWithExistingFile = async (leaveData) => {
        const token = sessionStorage.getItem("token");

        // ✅ Replaced fetch with Axios api
        const response = await api.post(
            `/leaves/apply-with-existing-file`,
            {

                employeeId: leaveData.employeeId,
                startDate: leaveData.startDate,
                endDate: leaveData.endDate,
                type: leaveData.type,
                reason: leaveData.reason,
                existingFileName: leaveData.existingFileName, // ✅ send this

            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data; // ✅ Axios automatically parses JSON

    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        // If no file is selected, clear states and return
        if (!selectedFile) {
            setFile(null);
            setFileError("");
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        const isExtensionValid = allowedExtensions.includes(fileExtension);
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const isMimeTypeValid = allowedMimeTypes.includes(selectedFile.type);

        // 1. Check file size first and foremost.
        if (selectedFile.size > maxSize) {
            setFileError("Maximum upload file size allowed is 5MB.");
            setFile(null);
            return;
        }

        // 2. Then, check file type by requiring both MIME type AND extension to be valid.
        if (isMimeTypeValid && isExtensionValid) {// ✅ Use AND (&&) instead of OR (||)
            setFile(selectedFile);
            setFileError("");
        } else {
            setFileError("Invalid file type. Only PDF, PNG, JPG, JPEG allowed.");
            setFile(null);
        }
    };

    const getButtonStyle = (tabName) => ({
        background: activeTab === tabName ? '#00c2d7' : 'darkblue',
        border: "none",
        fontWeight: "bold",
        fontSize: "14px",
        cursor: "pointer",
        padding: "6px 10px",
        borderRadius: "4px",
        color: "white",
        marginBottom: "20px",
        marginRight: "10px",
    });
    const resetForm = () => {
        setLeaveRequest({
            id: null,
            type: 'Select',
            startDate: null,
            endDate: null,
            reason: '',
            uploadedFile: null,
            fileName: null,
            existingFileName: null,
            halfDay: false
        });
        setFile(null);
        setTotalDays(0);
        setFormError("");
        setFileError("");
        setShowLOPAlert(false);
        setFalloutInfo(""); // ✅ Reset
        setOptionalHolidays([]);
        setSelectedOptionalHoliday("");
    };


    const fetchDraftById = async (draftId) => {
        try {
            const token = sessionStorage.getItem("token");

            // ✅ Replace fetch with Axios api
            const res = await api.get(`/leaves/drafts/single/${draftId}`, {

                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const draft = res.data; // ✅ Axios automatically parses JSON

            // pre-fill form with draft details
            setLeaveRequest({
                id: draft.id,
                type: draft.type,
                startDate: draft.startDate ? new Date(draft.startDate) : null,
                endDate: draft.endDate ? new Date(draft.endDate) : null,
                reason: draft.reason || "",
                fileName: draft.fileName || null,
            });

            setTotalDays(draft.totalDays || 0);

            if (draft.fileName) {
                setFile(null); // reset new upload, just show existing
            }

            setIsModalOpen(true);
        } catch (err) {
            console.error("❌ Failed to fetch draft:", err);
        }
    };

    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        setFormError("");

        // Helper function to format the date to YYYY-MM-DD string
        // const formatDate = (date) => {
        //     if (!date) return null;
        //     const year = date.getFullYear();
        //     const month = String(date.getMonth() + 1).padStart(2, '0');
        //     const day = String(date.getDate()).padStart(2, '0');
        //     return `${year}-${month}-${day}`;
        // };

        const formatDate = (date) => {
            if (!date) return null;
            return format(date, 'yyyy-MM-dd');
        };

        const dto = {
            id: leaveRequest.id || null,
            employeeId: employeeId,
            type: leaveRequest.type,
            startDate: formatDate(leaveRequest.startDate),
            endDate: formatDate(leaveRequest.endDate),
            reason: leaveRequest.reason,
            totalDays: totalDays,
            fileName: file ? file.name : leaveRequest.fileName || null,
        };

        const formData = new FormData();
        formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
        if (file) {
            formData.append("document", file);
        }

        try {
            const url = leaveRequest.id
                ? `/leaves/drafts/${leaveRequest.id}` // update
                : `/leaves/drafts`; // create

            const method = leaveRequest.id ? "put" : "post";
            const token = sessionStorage.getItem("token");

            // ✅ Replace fetch with Axios api
            const res = await api({
                method,
                url,
                data: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data", // important for FormData
                },
            });

            // Axios automatically throws for non-2xx responses, so no need for res.ok check

            alert("Draft saved successfully");
            setIsModalOpen(false);
            resetForm();

        } catch (err) {
            console.error("❌ Failed to save draft:", err);
            setFormError("Failed to save draft. Please try again.");
        } finally {
            setLoading(false);
        }

    };

    // ✅ Helper function for backend date format "yyyy-MM-dd"
    // ✅ Convert Date -> DD-MM-YYYY
    // const formatDateToBackend = (date) => {
    //     if (!date) return null;
    //     const d = new Date(date);
    //     const day = String(d.getDate()).padStart(2, "0");
    //     const month = String(d.getMonth() + 1).padStart(2, "0");
    //     const year = d.getFullYear();
    //     return `${day}-${month}-${year}`;
    // };
    const formatDateToBackend = (date) => {
        if (!date) return null;
        // format from date-fns ignores timezone offsets and keeps the date as selected
        return format(date, "dd-MM-yyyy");
    };

    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showPopupErrors, setShowPopupErrors] = useState([]);

    const handleSubmitLeave = async (e) => {
        e.preventDefault();

        setFormError("");
        setFileError("");

        if (!employeeId) {
            alert("Please fill in the required field: Employee ID");
            return;
        }

        // Project Assignment Validation
        try {
            const todayStr = getPropperDate();
            const res = await api.get(`/allocations/employee/${employeeId}/date/${todayStr}`, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
            });

            if (!res.data || res.data.length === 0) {
                alert("You are not assigned to any project , please contact your manager or admin");
                return;
            }
        } catch (err) {
            console.error("Failed to verify project assignment", err);
            // alert("Error verifying project assignment. Please try again.");
            // return;
        }

        if (leaveRequest.type === "Select" || !leaveRequest.type) {
            alert("Please fill in the required field: Leave Type");
            return;
        }

        // ✅ Validate optional holiday selection if applicable
        if (optionalHolidays.length > 0 && !selectedOptionalHoliday) {
            alert("Please select an optional holiday");
            return;
        }

        // ✅ LOP RESTRICTION: Block LOP if Earned or Sick Leave balance exists
        if (leaveRequest.type === "LOP" || leaveRequest.type === "Loss of Pay") {
            const hasPaidBalance = (leaveBalance.detailedBalances || []).some(b => {
                if (!b.type) return false;
                const t = b.type.toUpperCase();
                // Check for Earned/Privilege and Sick/SL types
                const isPaidType = t.includes("EARNED") || t.includes("PRIVILEGE") || t === "EL" || t === "PL" ||
                    t.includes("SICK") || t === "SL";
                return isPaidType && b.balance > 0;
            });

            if (hasPaidBalance) {
                const availableTypes = (leaveBalance.detailedBalances || [])
                    .filter(b => {
                        const t = (b.type || "").toUpperCase();
                        return (t.includes("EARNED") || t.includes("PRIVILEGE") || t === "EL" || t === "PL" || t.includes("SICK") || t === "SL") && b.balance > 0;
                    })
                    .map(b => b.type)
                    .join(", ");

                alert(`You cannot apply for Loss of Pay (LOP) while you still have ${availableTypes || 'Earned/Sick Leave'} balance available.`);
                return;
            }
        }

        // ✅ Unified Balance check for all leave types (Enforce Quota)
        if (leaveRequest.type !== "LOP" && leaveRequest.type !== "Select") {
            const currentBalObj = (leaveBalance.detailedBalances || []).find(b => b.type === leaveRequest.type);
            const currentBal = currentBalObj ? currentBalObj.balance : 0;

            if (totalDays > currentBal) {
                alert("The assigned leave quota has been exceeded. Any further leave requests apply through Loss of Pay (LOP).");
                return;
            }
        }

        // ✅ Additional specific validations
        const isOptionalLeave = leaveRequest.type.toLowerCase().includes("optional");
        if (isOptionalLeave) {
            // Check for past dates for Optional Leave
            if (leaveRequest.startDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const normalizedStart = new Date(leaveRequest.startDate);
                normalizedStart.setHours(0, 0, 0, 0);

                if (normalizedStart < today) {
                    alert("Optional holidays can only be applied for future dates (today or later).");
                    return;
                }
            }
        }

        // ✅ Check for Menstrual Leave - Only current month allowed
        const isMenstrualLeave = leaveRequest.type.toLowerCase().includes("menstrual");
        if (isMenstrualLeave && leaveRequest.startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const requestMonth = leaveRequest.startDate.getMonth();
            const requestYear = leaveRequest.startDate.getFullYear();

            // ✅ Check if trying to apply for past month
            if (requestYear < currentYear || (requestYear === currentYear && requestMonth < currentMonth)) {
                alert("⚠️ Menstrual Leave can only be applied for the current month.\n\nYou cannot apply for previous months.");
                return;
            }

            // ✅ Check if trying to apply for future month
            if (requestYear > currentYear || (requestYear === currentYear && requestMonth > currentMonth)) {
                alert("⚠️ Menstrual Leave can only be applied for the current month.\n\nYou cannot apply for future months.");
                return;
            }

            // Check if employee has already applied for menstrual leave in this month
            const existingMenstrualLeaveInMonth = leavesData.filter(leave => {
                if (!leave.type || !leave.type.toLowerCase().includes("menstrual")) return false;
                // ✅ Only count APPROVED or PENDING leaves (not REJECTED or CANCELLED)
                if (leave.status !== "APPROVED" && !(leave.status || "").toUpperCase().startsWith("PENDING")) return false;

                const leaveDate = new Date(leave.startDate);
                return leaveDate.getMonth() === requestMonth && leaveDate.getFullYear() === requestYear;
            });

            if (existingMenstrualLeaveInMonth.length > 0) {
                alert("You can only apply for 1 Menstrual Leave per month. You have already applied for Menstrual Leave in this month.");
                return;
            }

            // ✅ Final safeguard: Must be only 1 day
            if (leaveRequest.endDate) {
                const startStr = format(new Date(leaveRequest.startDate), 'yyyy-MM-dd');
                const endStr = format(new Date(leaveRequest.endDate), 'yyyy-MM-dd');
                if (startStr !== endStr) {
                    alert("⚠️ Menstrual Leave can only be applied for 1 day. Please correct your dates.");
                    return;
                }
            }
        }

        // ✅ Check for Sick Leave - Future dates not allowed
        if (leaveRequest.type && leaveRequest.type.toLowerCase().includes('sick')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (leaveRequest.startDate && new Date(leaveRequest.startDate) > today) {
                alert("Sick Leave cannot be applied for future dates.");
                return;
            }
            if (leaveRequest.endDate && new Date(leaveRequest.endDate) > today) {
                alert("Sick Leave cannot be applied for future dates.");
                return;
            }
        }



        if (!leaveRequest.startDate) {
            alert("Please fill in the required field: Start Date");
            return;
        }

        if (!leaveRequest.endDate) {
            alert("Please fill in the required field: End Date");
            return;
        }

        const normalizeDate = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const normalizedStart = normalizeDate(leaveRequest.startDate);
        const normalizedEnd = normalizeDate(leaveRequest.endDate);

        if (normalizedEnd < normalizedStart) {

            alert("End date cannot be before start date.");
            return;
        }

        if (totalDays <= 0) {
            alert("Please fill in the required field: Total Days");
            return;
        }

        if (!leaveRequest.reason || leaveRequest.reason.trim() === "") {
            alert("Please fill in the required field: Reason");
            return;
        }

        // ✅ Fetch fresh leave history and check for overlapping leaves (PENDING or APPROVED)
        try {
            console.log("🔍 Fetching fresh leave history for overlap check...");
            const token = sessionStorage.getItem("token");
            const response = await api.get(`/leaves/employee/${employeeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const currentLeaves = response.data || [];

            console.log("📋 Total leaves fetched:", currentLeaves.length);
            console.log("📅 Requested dates:", {
                start: normalizedStart,
                end: normalizedEnd,
                startStr: format(normalizedStart, 'yyyy-MM-dd'),
                endStr: format(normalizedEnd, 'yyyy-MM-dd')
            });

            // Log all leaves for debugging
            console.log("📝 All leaves:", currentLeaves.map(l => ({
                id: l.id,
                type: l.type,
                status: l.status,
                startDate: l.startDate,
                endDate: l.endDate
            })));

            const hasOverlappingLeave = currentLeaves.some(leave => {
                console.log(`🔎 Checking leave ${leave.id}:`, {
                    type: leave.type,
                    status: leave.status,
                    dates: `${leave.startDate} to ${leave.endDate}`
                });

                // Only check PENDING and APPROVED leaves (case-insensitive)
                const status = (leave.status || "").toUpperCase();
                if (!status.startsWith("PENDING") && status !== "APPROVED") {
                    console.log(`  ⏭️ Skipping - status is ${status}`);
                    return false;
                }

                // Skip if this is the same leave being edited (draft submission)
                if (leaveRequest.id && leave.id === leaveRequest.id) {
                    console.log("  ⏭️ Skipping same leave (draft edit):", leave.id);
                    return false;
                }

                // ✅ Parse dates more robustly - handle both ISO and DD-MM-YYYY formats
                let existingStart, existingEnd;

                // Check if date contains 'T' (ISO format) or '-' in different positions
                if (leave.startDate.includes('T')) {
                    // ISO format: 2026-01-10T00:00:00
                    existingStart = normalizeDate(new Date(leave.startDate));
                    existingEnd = normalizeDate(new Date(leave.endDate));
                } else if (leave.startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // YYYY-MM-DD format
                    existingStart = normalizeDate(new Date(leave.startDate + 'T00:00:00'));
                    existingEnd = normalizeDate(new Date(leave.endDate + 'T00:00:00'));
                } else if (leave.startDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
                    // DD-MM-YYYY format - need to convert
                    const [d1, m1, y1] = leave.startDate.split('-');
                    const [d2, m2, y2] = leave.endDate.split('-');
                    existingStart = normalizeDate(new Date(`${y1}-${m1}-${d1}T00:00:00`));
                    existingEnd = normalizeDate(new Date(`${y2}-${m2}-${d2}T00:00:00`));
                } else {
                    // Fallback to direct parsing
                    existingStart = normalizeDate(new Date(leave.startDate));
                    existingEnd = normalizeDate(new Date(leave.endDate));
                }

                console.log(`  📅 Parsed existing dates:`, {
                    startStr: format(existingStart, 'yyyy-MM-dd'),
                    endStr: format(existingEnd, 'yyyy-MM-dd'),
                    startTime: existingStart.getTime(),
                    endTime: existingEnd.getTime()
                });

                console.log(`  📅 Requested dates (normalized):`, {
                    startStr: format(normalizedStart, 'yyyy-MM-dd'),
                    endStr: format(normalizedEnd, 'yyyy-MM-dd'),
                    startTime: normalizedStart.getTime(),
                    endTime: normalizedEnd.getTime()
                });

                // Check if there's any overlap between the date ranges
                // Overlap occurs if: (start1 <= end2) AND (end1 >= start2)
                const hasOverlap = (normalizedStart <= existingEnd) && (normalizedEnd >= existingStart);

                console.log(`  📊 Overlap check:`, {
                    condition1: `${format(normalizedStart, 'yyyy-MM-dd')} <= ${format(existingEnd, 'yyyy-MM-dd')} = ${normalizedStart <= existingEnd}`,
                    condition2: `${format(normalizedEnd, 'yyyy-MM-dd')} >= ${format(existingStart, 'yyyy-MM-dd')} = ${normalizedEnd >= existingStart}`,
                    hasOverlap
                });

                if (hasOverlap) {
                    console.log("  ❌ OVERLAP DETECTED with leave:", {
                        id: leave.id,
                        type: leave.type,
                        status: leave.status,
                        existingStart: format(existingStart, 'yyyy-MM-dd'),
                        existingEnd: format(existingEnd, 'yyyy-MM-dd'),
                        requestedStart: format(normalizedStart, 'yyyy-MM-dd'),
                        requestedEnd: format(normalizedEnd, 'yyyy-MM-dd')
                    });
                }

                return hasOverlap;
            });

            if (hasOverlappingLeave) {
                alert("⚠️ You cannot apply for leave on dates that already have a pending or approved leave request.\n\nPlease check your leave history and select different dates.");
                return;
            }

            console.log("✅ No overlapping leaves found. Proceeding with submission...");
        } catch (err) {
            console.error("❌ Error checking for overlapping leaves:", err);
            alert("Failed to validate leave dates. Please try again.");
            return;
        }

        // ✅ Dynamic Document Validation
        const selectedConfig = leaveTypeConfigs.find(c => c.name === leaveRequest.type);
        if (selectedConfig?.documentRequired) {
            const threshold = selectedConfig.documentThreshold || 0;
            if (totalDays >= threshold && !file && !leaveRequest.fileName) {
                if (leaveRequest.type && leaveRequest.type.toLowerCase().includes("sick")) {
                    // ✅ Updated medical document alert text
                    alert(`Medical document is required for Sick Leave of ${threshold} or more consecutive days.`);
                } else {
                    alert(`Document upload is mandatory for ${leaveRequest.type} of ${threshold} or more days.`);
                }
                return;
            }
        }

        try {
            setLoading(true);

            const token = sessionStorage.getItem("token");

            let res;

            if (leaveRequest.id) {
                const dtoWithDraftId = {
                    id: leaveRequest.id,
                    employeeId: employeeId,
                    type: leaveRequest.type,
                    startDate: formatDateToBackend(leaveRequest.startDate),
                    endDate: formatDateToBackend(leaveRequest.endDate),
                    reason: leaveRequest.reason,
                    totalDays: totalDays,
                    halfDay: leaveRequest.halfDay, // ✅ ADDED
                    existingFileName: leaveRequest.fileName,
                };

                // ✅ Replaced fetch with Axios api
                res = await api.post(
                    `/leaves/submit-draft/${leaveRequest.id}`,
                    dtoWithDraftId,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            } else {
                const dto = {
                    employeeId: employeeId,
                    type: leaveRequest.type,
                    startDate: formatDateToBackend(leaveRequest.startDate),
                    endDate: formatDateToBackend(leaveRequest.endDate),
                    reason: leaveRequest.reason,
                    totalDays: totalDays,
                    halfDay: leaveRequest.halfDay, // ✅ ADDED
                    optionalHolidayName: selectedOptionalHoliday || "",
                };

                const formData = new FormData();
                formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));

                if (file) formData.append("document", file);

                // ✅ Replaced fetch with Axios api
                res = await api.post(`/leaves/apply`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
            }

            const data = res.data; // ✅ Axios automatically parses JSON

            // ✅ Check for Negative Balance Warning and Show Popup
            if (data.warningMessage) {
                alert(data.warningMessage);
            }

            alert("Leave request submitted successfully!");

            // ✅ Fetch fresh data from backend before closing modal
            await fetchLeaveBalance();
            await fetchLeaveHistory();

            setIsModalOpen(false);
            resetForm();
            setFile(null);
        } catch (error) {
            console.error("Error submitting leave request:", error);

            let errMsg = error.message;
            if (error.response && error.response.data) {
                // Try to extract message from backend response
                if (typeof error.response.data === 'string') {
                    errMsg = error.response.data;
                } else if (error.response.data.message) {
                    errMsg = error.response.data.message;
                }
            }

            // ✅ Show Menstrual Leave errors as alert instead of form errors
            if (errMsg && errMsg.toLowerCase().includes("menstrual")) {
                alert("⚠️ " + errMsg);
            } else {
                setFormError(`Failed to submit leave request: ${errMsg}`);
            }

        } finally {
            setLoading(false);
        }
    };

    const handleModalClick = (e) => {
        if (modalRef.current && e.target === modalRef.current) {
            console.log("Modal closed");
        }
    };

    const handleMyTasksClick = () => {
        navigate('/myteam2'); // Redirect to the new page with Manager & HR cards
    };

    // const handledraftsClick = () => {
    // navigate('/saved-drafts'); // Redirect to the new page with Manager & HR cards
    // };

    // const handleLeaveHistoryClick = () => {
    // navigate('/leave-history');
    // };

    // ✅ Extract applied leave dates from leavesData
    useEffect(() => {
        const extractAppliedDates = () => {
            const dates = [];
            console.log("🔍 Extracting applied leave dates from leavesData:", leavesData.length, "leaves");

            leavesData.forEach(leave => {
                // Only consider PENDING and APPROVED leaves
                const status = (leave.status || "").toUpperCase();
                console.log(`  📋 Leave ID ${leave.id}: Status = ${status}, Dates = ${leave.startDate} to ${leave.endDate}`);

                if (!status.startsWith("PENDING") && status !== "APPROVED") {
                    console.log(`    ⏭️ Skipping - status is ${status}`);
                    return;
                }

                // Skip if this is a draft being edited
                if (leaveRequest.id && leave.id === leaveRequest.id) {
                    console.log(`    ⏭️ Skipping - this is the draft being edited`);
                    return;
                }

                // Add all dates in the range
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);

                const current = new Date(start);
                while (current <= end) {
                    const dateStr = current.toISOString().split('T')[0];
                    dates.push(dateStr);
                    console.log(`    ✅ Adding date: ${dateStr}`);
                    current.setDate(current.getDate() + 1);
                }
            });

            console.log("📊 Total applied leave dates:", dates.length, dates);
            setAppliedLeaveDates(dates);
        };

        extractAppliedDates();
    }, [leavesData, leaveRequest.id]);

    // Highlight weekends in red, holidays in green, applied leaves in orange
    const highlightDates = (date) => {
        const formattedDate = date.toISOString().split('T')[0];
        const isAppliedLeave = appliedLeaveDates.includes(formattedDate);
        const isHoliday = holidays.some(
            (holiday) => holiday.toISOString().split('T')[0] === formattedDate
        );
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        if (isAppliedLeave) {
            return "react-datepicker__day--highlighted-applied";
        }
        if (isHoliday) {
            return "react-datepicker__day--highlighted-holiday";
        }
        if (isWeekend) {
            return "react-datepicker__day--highlighted-weekend";
        }
        return null;
    };

    const handleHistoryClick = () => {
        setActiveTab('history'); // optional if you still want to highlight the tab
        // navigate('/leave-history'); // navigate to the LeaveHistory page
    };

    return (
        <>
            <Sidebar>
                <>
                    {/* Inline styles removed, relying on Leave.css and DatePicker css */}
                    <div className="leave-container">
                        <div className="leave-content-wrapper">
                            <div className="page-header">
                                <h1 className="page-title">
                                    Leave Management
                                </h1>
                                <p style={{ color: '#00b3a4', fontSize: '0.85rem', fontWeight: '500', margin: '4px 0 0 0' }}>
                                    Apply, track and manage your leaves efficiently
                                </p>
                            </div>

                            {/* Tabs with Arrows */}
                            <div className="leave-tabs-container" style={{ marginBottom: '-10px' }}>
                                {showLeftArrow && (
                                    <button
                                        className="tab-arrow tab-arrow-left"
                                        onClick={() => scrollTabs('left')}
                                        aria-label="Scroll left"
                                    >
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                                        </svg>
                                    </button>
                                )}

                                <div
                                    className="leave-tabs"
                                    ref={tabsRef}
                                    onScroll={handleScroll}
                                >
                                    <button
                                        onClick={() => { handleTabClick('applyLeave'); resetForm(); }}
                                        className={`leave-tab-btn tab-apply ${activeTab === 'applyLeave' ? 'active' : ''}`}
                                    >
                                        Apply for Leave
                                    </button>

                                    <button
                                        onClick={() => handleTabClick('drafts')}
                                        className={`leave-tab-btn tab-drafts ${activeTab === 'drafts' ? 'active' : ''}`}
                                    >
                                        Drafts
                                    </button>

                                    <button
                                        onClick={() => handleTabClick('history')}
                                        className={`leave-tab-btn tab-history ${activeTab === 'history' ? 'active' : ''}`}
                                    >
                                        History
                                    </button>

                                    <button
                                        onClick={() => handleTabClick('balances')}
                                        className={`leave-tab-btn tab-balances ${activeTab === 'balances' ? 'active' : ''}`}
                                    >
                                        Leave Balances
                                    </button>

                                </div>

                                {showRightArrow && (
                                    <button
                                        className="tab-arrow tab-arrow-right"
                                        onClick={() => scrollTabs('right')}
                                        aria-label="Scroll right"
                                    >
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {/* Rest of the content below the tabs (Leave Balances Grid and Apply Leave Form) */}
                            {/* Leave Balances Grid */}

                            {/* Leave Balances Grid */}
                            {activeTab === 'balances' && (
                                <div className="balance-grid">
                                    {/* Dynamic Balances from Backend - Filter out Maternity/Paternity Leave */}
                                    {(leaveBalance.detailedBalances || [])
                                        .filter(bal => {
                                            const type = (bal.type || "").toUpperCase();
                                            return !type.includes("MATERNITY") && !type.includes("PATERNITY");
                                        })
                                        .map((bal, index) => (
                                            <div className="balance-item" key={index}>
                                                <h4 className="balance-label">{bal.type}</h4>
                                                <div className="balance-value">{bal.balance}</div>
                                                <p className="balance-total">days available</p>
                                                <span className="helper-text">
                                                    Used: {bal.consumed} / Granted: {bal.granted}
                                                </span>

                                            </div>
                                        ))}

                                    {/* Encashed Leave Card - Only show if employee is eligible for encashment */}
                                    {(() => {
                                        const hasEncashmentEligibility = (leaveBalance.detailedBalances || []).some(
                                            bal => bal.encashmentAllowed === true
                                        );
                                        return hasEncashmentEligibility && (
                                            <div className="balance-item">
                                                <h4 className="balance-label">Encashed Leaves</h4>
                                                <div className="balance-value">
                                                    {leaveBalance.encashedCount}
                                                </div>
                                                <p className="balance-total">days total</p>
                                            </div>
                                        );
                                    })()}

                                    {/* LOP Card - Only show if "LOP" Leave type added by admin AND at least 1 LOP has been used */}
                                    {leaveTypes.some(t => t.toUpperCase() === "LOP" || t.toUpperCase() === "LOSS OF PAY") && leaveBalance.lopUsed > 0 && (
                                        <div className="balance-item">
                                            <h4 className="balance-label">Total LOP</h4>
                                            <div className="balance-value" style={{ color: "var(--danger-red)" }}>
                                                {leaveBalance.lopUsed}
                                            </div>
                                            <p className="balance-total">days used</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Apply Leave Form */}
                            {/* Apply Leave Form */}
                            {activeTab === 'applyLeave' && (
                                <div className="leave-card">
                                    <h3 className="leave-card-title">Apply for Leave</h3>
                                    <form
                                        onSubmit={handleSubmitLeave}
                                        className="leave-form"
                                    >

                                        <div className="leave-form-scroll">
                                            {/* Static Policy Note Section */}
                                            <div className={`policy-note-container ${leaveRequest.type === 'Select' ? 'centered-banner' : ''}`}>
                                                {leaveRequest.type && leaveRequest.type !== 'Select' && (
                                                    <div className="policy-note-icon">i</div>
                                                )}
                                                <div className="policy-note-text">
                                                    {(() => {
                                                        const type = leaveRequest.type;
                                                        // if (type === 'Earned Leave') return "Earned Leave must be applied for at least 48 working hours in advance.";
                                                        // if (type === 'Sick Leave') return "Sick Leave must be applied for at least 6 hours prior to the start of the leave.";
                                                        if (type && type.toLowerCase().includes('menstrual')) return "Important: Menstrual Leave is limited to 1 day per month and can only be applied for the current month. You cannot apply for previous or future months.";
                                                        if (type && type.toLowerCase().includes('maternity')) return "Note: ML entitlement is 180 days, inclusive of weekends and holidays. Employees must apply at least 8 weeks in advance with a medical certificate.";
                                                        return "Select a leave type to proceed.";
                                                    })()}
                                                </div>
                                            </div>

                                            <div className={`leave-form-grid ${optionalHolidays.length > 0 ? 'grid-4' : ''}`}>
                                                {/* Leave Type */}
                                                <div className="leave-form-group">
                                                    <label className="leave-label">
                                                        Leave Type <span className="error-msg">*</span>
                                                    </label>
                                                    <select
                                                        name="type"
                                                        value={leaveRequest.type}
                                                        onChange={handleInputChange}
                                                        className={`leave-select ${leaveRequest.type === "Select" && showErrorPopup ? "border-red-500" : ""}`}
                                                    >
                                                        <option value="Select" disabled>Select Leave Type</option>
                                                        {leaveTypes.map((t, i) => (
                                                            <option key={i} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    {leaveRequest.type === 'Select' && showInlineErrors && (
                                                        <p className="error-msg">Please select a leave type.</p>
                                                    )}
                                                </div>

                                                {/* ✅ Optional Holiday Selection - Show only if optional holidays exist */}
                                                {
                                                    optionalHolidays.length > 0 && (
                                                        <div className="leave-form-group">
                                                            <label className="leave-label">
                                                                Select Optional Holiday <span className="error-msg">*</span>
                                                            </label>
                                                            <select
                                                                name="optionalHoliday"
                                                                value={selectedOptionalHoliday}
                                                                onChange={handleOptionalHolidayChange}
                                                                className="leave-select"
                                                                required
                                                            >
                                                                <option value="">-- Select Optional Holiday --</option>
                                                                {optionalHolidays.map((holiday, index) => {
                                                                    const isUsed = usedOptionalHolidays.includes(holiday.name);

                                                                    let isPast = false;
                                                                    if (holiday.date) {
                                                                        const hDate = new Date(holiday.date);
                                                                        const today = new Date();
                                                                        today.setHours(0, 0, 0, 0);
                                                                        if (hDate < today) isPast = true;
                                                                    }

                                                                    const isDisabled = isUsed || isPast;

                                                                    return (
                                                                        <option
                                                                            key={index}
                                                                            value={holiday.name}
                                                                            disabled={isDisabled}
                                                                            style={isDisabled ? { color: '#94a3b8', fontStyle: 'italic' } : {}}
                                                                        >
                                                                            {holiday.name} {holiday.date ? `(${holiday.date.split('-').reverse().join('-')})` : ''}
                                                                            {isUsed ? ' (Already Used)' : isPast ? ' (Past Holiday)' : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                            {!selectedOptionalHoliday && showInlineErrors && (
                                                                <p className="error-msg">Please select an optional holiday.</p>
                                                            )}
                                                        </div>
                                                    )
                                                }

                                                {/* Start Date */}
                                                <div className="leave-form-group">
                                                    <label className="leave-label">
                                                        Start Date <span className="error-msg">*</span>
                                                    </label>
                                                    <SmartDatePicker
                                                        selected={leaveRequest.startDate}
                                                        onChange={handleStartDateChange}
                                                        selectsStart
                                                        startDate={leaveRequest.startDate}
                                                        endDate={leaveRequest.endDate}
                                                        minDate={leaveRequest.type && leaveRequest.type.toLowerCase().includes("optional") ? new Date() : null}
                                                        maxDate={leaveRequest.type && leaveRequest.type.toLowerCase().includes('sick') ? new Date() : null}
                                                        dayClassName={highlightDates}
                                                        disabled={!!optionalHolidays.find(h => h.name === selectedOptionalHoliday)?.date}
                                                    />
                                                    {!leaveRequest.startDate && showErrorPopup && (
                                                        <p className="error-msg">Please select a start date.</p>
                                                    )}
                                                </div>

                                                {/* End Date */}
                                                <div className="leave-form-group">
                                                    <label className="leave-label">
                                                        End Date <span className="error-msg">*</span>
                                                    </label>
                                                    <SmartDatePicker
                                                        selected={leaveRequest.endDate}
                                                        onChange={handleEndDateChange}
                                                        selectsEnd
                                                        startDate={leaveRequest.startDate}
                                                        endDate={leaveRequest.endDate}
                                                        minDate={leaveRequest.startDate}
                                                        maxDate={leaveRequest.type && leaveRequest.type.toLowerCase().includes('sick') ? new Date() : null}
                                                        dayClassName={highlightDates}
                                                        disabled={!!optionalHolidays.find(h => h.name === selectedOptionalHoliday)?.date}
                                                    />
                                                    {!leaveRequest.endDate && showErrorPopup && (
                                                        <p className="error-msg">Please select an end date.</p>
                                                    )}
                                                    {formError && <p className="error-msg">{formError}</p>}
                                                </div>


                                                {/* Half Day Checkbox */}
                                                {leaveTypeConfigs.find(c => c.name === leaveRequest.type)?.halfDayAllowed && (
                                                    <div className="leave-form-full leave-form-group">
                                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={leaveRequest.halfDay}
                                                                onChange={handleHalfDayChange}
                                                                style={{ marginRight: '10px', width: '18px', height: '18px' }}
                                                            />
                                                            Apply for Half Day
                                                        </label>
                                                        {leaveRequest.halfDay && (
                                                            <p className="helper-text">Start Date and End Date must be the same.</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Total Days */}
                                                <div className="leave-form-group">
                                                    <label className="leave-label">Total Days</label>
                                                    <input
                                                        type="text"
                                                        value={totalDays}
                                                        readOnly
                                                        className="leave-input"
                                                        style={{ backgroundColor: '#f1f5f9' }}
                                                    />
                                                    {totalDays <= 0 && showErrorPopup && (
                                                        <p className="error-msg">Total Days must be greater than zero.</p>
                                                    )}

                                                    {falloutInfo && (
                                                        <p className="helper-text" style={{ color: "var(--info-blue)", fontWeight: "500", marginTop: "10px" }}>
                                                            {falloutInfo}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* File Upload */}
                                                <div className="leave-form-group">
                                                    <label className="leave-label">
                                                        Upload Medical Document
                                                        {(() => {
                                                            const c = leaveTypeConfigs.find(config => config.name === leaveRequest.type);
                                                            return c?.documentRequired && totalDays >= (c.documentThreshold || 0) ? (
                                                                <span className="error-msg"> *</span>
                                                            ) : null;
                                                        })()}
                                                    </label>
                                                    <div className="leave-input" style={{ display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden' }}>
                                                        <input
                                                            type="file"
                                                            id="fileInput"
                                                            name="document"
                                                            onChange={handleFileChange}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <label
                                                            htmlFor="fileInput"
                                                            style={{
                                                                backgroundColor: '#f1f5f9',
                                                                padding: '0 1rem',
                                                                cursor: 'pointer',
                                                                borderRight: '1px solid var(--border-color)',
                                                                fontWeight: 500,
                                                                color: 'var(--text-primary)',
                                                                height: '45px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        >
                                                            Choose File
                                                        </label>

                                                        <span style={{ padding: '0 1rem', color: file || leaveRequest.fileName ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                            {file ? file.name : leaveRequest.fileName ? leaveRequest.fileName : 'No file chosen'}
                                                        </span>

                                                    </div>
                                                    {fileError && <p className="error-msg">{fileError}</p>}
                                                    <small style={{ fontSize: "10px" }}>Supported: JPG, PNG, PDF (Max 5MB)</small>
                                                </div>

                                                {/* Reason */}
                                                <div className="leave-form-group">
                                                    <label className="leave-label">Reason <span className="error-msg">*</span></label>
                                                    <input
                                                        type="text"
                                                        name="reason"
                                                        value={leaveRequest.reason}
                                                        onChange={handleInputChange}
                                                        className="leave-input"
                                                        maxLength={255}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        <div className="leave-card-actions">
                                            <button
                                                type="submit"
                                                disabled={loading || fileError || formError}
                                                className="btn-primary"
                                            >
                                                {loading ? 'Submitting...' : 'Submit Leave'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleSaveDraft}
                                                className="btn-secondary"
                                            >
                                                Save as Draft
                                            </button>

                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="btn-cancel"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                    </form>
                                </div>
                            )}

                        </div>




                        {activeTab === "drafts" && (

                            <div style={{ marginLeft: "0px" }}>

                                <LeavesDraft />
                            </div>
                        )}

                        {activeTab === "history" && (

                            <div style={{ marginTop: '0px', marginLeft: "0px" }}>

                                <LeaveHistory
                                    key={activeTab}
                                    employeeId={employeeId}
                                    leavesData={leavesData}
                                    loading={loading}
                                />
                            </div>
                        )}




                    </div>


                </>

            </Sidebar >

            {/* Toast Notification */}
            <ToastNotification
                isOpen={toast.isOpen}
                onClose={() => setToast({ ...toast, isOpen: false })}
                message={toast.message}
                type={toast.type}
            />
        </>
    )
};
export default Leaves;

