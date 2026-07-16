import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../api';
import axios from 'axios';
import Sidebar from './Sidebar.js';
import MyTeamRes from './MyTeamRes';
import ExitProgressTracker from './ExitProgressTracker';
import ClearanceDetailsModal from "./ClearanceDetailsModal";
import SuccessModal from '../components/SuccessModal';
import { FiPlus, FiClipboard, FiClock, FiList, FiUpload, FiMessageSquare, FiLogOut, FiSend, FiChevronLeft, FiChevronRight, FiEye, FiCheckCircle } from 'react-icons/fi';
import './ExitManagement.css';
import './Leave.css';


// Define API URLs
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const RESIGNATION_API_URL = "/v1/exit-management/resignations";
const NOTIFICATION_API_URL = `${API_BASE_URL}/notifications`;
const POLLING_INTERVAL = 60000; // 60 seconds

function ExitManagement() {
    // --- Navigation Tabs ---
    const [mainActiveTab, setMainActiveTab] = useState('submitResignation');
    const fileInputRef = useRef(null);
    const tabsScrollerRef = useRef(null);
    const [fileKey, setFileKey] = useState(Date.now());
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // --- Form States ---
    const [reasonForExit, setReasonForExit] = useState('');
    const [comments, setComments] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [lastWorkingDay, setLastWorkingDay] = useState(''); // Internal: YYYY-MM-DD format
    const [noticePeriodDays, setNoticePeriodDays] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [editingDraftId, setEditingDraftId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [exitReasons, setExitReasons] = useState([]);

    // Preview state
    const [previewFile, setPreviewFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const handleClosePreviewModal = () => {
        setIsPreviewModalOpen(false);
        if (previewFile) URL.revokeObjectURL(previewFile);
        setPreviewFile(null);
        setFileType(null);
    };

    const handleViewDocument = async (id, documentName) => {
        try {
            const token = sessionStorage.getItem('token');
            const employeeId = sessionStorage.getItem('employeeId');
            const employeeName = sessionStorage.getItem('employeeName');

            if (!token) return displayMessage('error', 'Authentication required');

            // Fix URL: Remove '/resignations' from base and append '/document/{id}'
            const docUrl = `/v1/exit-management/document/${id}`;

            const response = await api.get(
                docUrl,
                {
                    responseType: 'arraybuffer',
                    headers: { employeeId, employeeName }
                }
            );

            const fileExtension = documentName.split('.').pop().toLowerCase();
            let blob;
            if (fileExtension === 'pdf') {
                blob = new Blob([response.data], { type: 'application/pdf' });
            } else {
                blob = new Blob([response.data]);
            }

            const fileUrl = URL.createObjectURL(blob);

            if (fileExtension === 'pdf') {
                setFileType('pdf');
            } else {
                setFileType('image');
            }

            setPreviewFile(fileUrl);
            setIsPreviewModalOpen(true);

        } catch (err) {
            console.error("Error viewing document:", err);
            displayMessage('error', 'Failed to load document for preview.');
        }
    };



    const updateResignationStatus = async (resignationId, action) => {
        try {
            const token = sessionStorage.getItem('token');
            const employeeId = sessionStorage.getItem('employeeId');
            const employeeName = sessionStorage.getItem('employeeName');

            await api.post(
                `/v1/exit-management/resignations/${resignationId}/update-status`,
                { action },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Reload updated history so tracker updates
            await fetchHistory();

        } catch (err) {
            console.error("Failed to update resignation status:", err);
            displayMessage('error', "Failed to update status");
        }
    };


    const [roles, setRoles] = useState({
        manager: false,
        finance: false,
        hr: false,
        reviewer: false,
        admin: false,
        canViewTasks: false,
    });


    // --- Data States ---
    const [drafts, setDrafts] = useState([]);
    // This state holds all submitted resignations
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);




    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Handle tab scrolling
    const handleScroll = () => {
        if (tabsScrollerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsScrollerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    // Scroll tab container
    const scrollTabs = (direction) => {
        if (tabsScrollerRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = direction === 'left'
                ? tabsScrollerRef.current.scrollLeft - scrollAmount
                : tabsScrollerRef.current.scrollLeft + scrollAmount;

            tabsScrollerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

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

    // --- HELPER FUNCTION: Handle Success/Error Messages ---
    const displayMessage = (type, msg) => {
        if (type === 'success') setSuccessMessage(msg);
        if (type === 'error') setErrorMessage(msg);
        if (type === 'clear') {
            setSuccessMessage('');
            setErrorMessage('');
        }
    };



    const fetchAssignedRoles = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        const employeeId = sessionStorage.getItem('employeeId');
        if (!token || !employeeId) return;

        try {
            const response = await api.get(`/access/assigned-ids/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRoles(response.data);
        } catch (err) {
            console.error('Failed to fetch assigned roles:', err);
        }
    }, []);

    const [adjustReason, setAdjustReason] = useState("");

    const adjustDate = async (date) => {
        const token = sessionStorage.getItem('token');
        const employeeId = sessionStorage.getItem('employeeId');

        try {
            const res = await api.get(
                `/v1/exit-management/adjust-lwd`,
                {
                    params: { employeeId, date },
                    headers: { employeeId }
                }
            );

            if (res.data.error) {
                console.error("LWD adjustment error:", res.data.error);
                return;
            }

            setLastWorkingDay(res.data.adjustedDate);

            // ⭐ UI Display Logic:
            // Show note ONLY if adjustment really changed the date
            if (
                res.data.adjustedDate !== res.data.originalDate &&
                res.data.reason &&
                res.data.reason !== "none"
            ) {
                setAdjustReason(
                    `NOTE: Calculated LWD (${res.data.originalDate}) was a ${res.data.reason}. Adjusted to ${res.data.adjustedDate}.`
                );
            } else {
                // Nothing changed → No message
                setAdjustReason("");
            }

        } catch (err) {
            console.error("Adjustment check error", err);
        }
    };



    useEffect(() => {
        const fetchNotice = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const employeeId = sessionStorage.getItem('employeeId');

                // ⭐ NEW: Try to get notice period from the employee's own record first
                if (employeeId) {
                    const empRes = await api.get(`/employees/${employeeId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const empNoticePeriod = empRes.data?.noticePeriod;
                    if (empNoticePeriod && empNoticePeriod.toString().trim() !== '') {
                        const strVal = empNoticePeriod.toString().toLowerCase().trim();
                        let parsed = parseInt(strVal.replace(/\D/g, ''), 10);
                        if (!isNaN(parsed) && parsed > 0) {
                            if (strVal.includes('month')) {
                                parsed = parsed * 30; // convert months to days
                            }
                            setNoticePeriodDays(parsed);
                            return; // Use employee-specific notice period, skip global
                        }
                    }
                }

                // Fallback: fetch global notice period from admin settings, passing employeeId header for backend-level resolution
                const res = await api.get("/v1/exit-management/notice-period", {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        employeeId: employeeId || ''
                    }
                });
                setNoticePeriodDays(res.data);   // <-- Update notice period from backend
            } catch (err) {
                console.error("Failed to fetch notice period");
                setNoticePeriodDays(60);        // <-- Fallback
            }
        };
        fetchNotice();
    }, []);

    useEffect(() => {
        // Prevent overwriting LWD if we are editing a draft or notice period isn't loaded
        if (!noticePeriodDays || editingDraftId) return;

        const today = new Date();
        // Submission day counts as Day 1, so we add (noticePeriodDays - 1) days
        const lwDay = new Date(today.getTime() + (noticePeriodDays - 1) * 24 * 60 * 60 * 1000);

        const year = lwDay.getFullYear();
        const month = String(lwDay.getMonth() + 1).padStart(2, '0');
        const day = String(lwDay.getDate()).padStart(2, '0');
        const calculatedDateISO = `${year}-${month}-${day}`;
        const calculatedDateDisplay = `${day}-${month}-${year}`;

        // Fallback: Set local date first so it's not blank
        setLastWorkingDay(calculatedDateDisplay);

        // Call backend adjustment for UI (using ISO format for backend)
        adjustDate(calculatedDateISO);

    }, [noticePeriodDays, editingDraftId]);


    useEffect(() => {
        fetchAssignedRoles();
    }, [fetchAssignedRoles]);





    useEffect(() => {
        const fetchExitReasons = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const employeeId = sessionStorage.getItem("employeeId");
                const employeeName = sessionStorage.getItem("employeeName");

                const res = await api.get(
                    "/v1/exit-management/exit-reasons",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                setExitReasons(res.data);
            } catch (err) {
                console.error("Failed to load exit reasons:", err);
            }
        };

        fetchExitReasons();
    }, []);


    // --- SUCCESS MESSAGE TIMEOUT EFFECT ---
    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
                setErrorMessage('');
            }, 8000);

            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);


    // --- Fetch Notifications Function (Optimized & Memoized) ---
    const fetchNotifications = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        const employeeId = sessionStorage.getItem('employeeId');

        if (!token || !employeeId) return;

        try {
            const response = await axios.get(
                `${NOTIFICATION_API_URL}/${employeeId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            // Assuming backend returns a list of all notifications, filter for unread
            const unreadNotifications = response.data.filter(n => !n.read);
            setNotifications(unreadNotifications);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, []);

    // --- Notification Polling Effect ---
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, POLLING_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // --- Data Fetching Functions (Refactored and CORRECTED) ---

    const fetchData = useCallback(async (isDrafts) => {
        const token = sessionStorage.getItem('token');
        const employeeId = sessionStorage.getItem('employeeId');
        const employeeName = sessionStorage.getItem('employeeName');

        if (!token || !employeeId || !employeeName) return displayMessage('error', 'User not authenticated.');

        try {
            const response = await api.get(
                RESIGNATION_API_URL,
                { headers: { employeeId, employeeName } }
            );

            // Drafts: status must be 'draft'
            // History: status must NOT be 'draft'
            const data = response.data.filter(
                (item) => item.status && (item.status.toLowerCase() === 'draft') === isDrafts
            );

            if (isDrafts) {
                setDrafts(data);
            } else {
                // IMPORTANT: Sort by ID descending so the most recent submission is history[0]
                const sortedHistory = data.sort((a, b) => b.id - a.id);
                setHistory(sortedHistory);
            }
            // displayMessage('clear');
        } catch (err) {
            console.error(err);
            displayMessage('error', `Failed to fetch ${isDrafts ? 'drafts' : 'history'}.`);
        }
    }, [displayMessage]);

    const fetchDrafts = useCallback(() => fetchData(true), [fetchData]);
    const fetchHistory = useCallback(() => fetchData(false), [fetchData]);

    // --- Trigger Data Fetch based on active tab ---
    useEffect(() => {
        if (mainActiveTab === 'drafts') {
            fetchDrafts();
        }
        if (mainActiveTab === 'history' || mainActiveTab === 'noticePeriod') {
            fetchHistory();
        }
    }, [mainActiveTab, fetchDrafts, fetchHistory]);


    // --- File selection ---
    // --- File selection ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const maxSize = 2 * 1024 * 1024; // ✅ 2 MB

        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        // 1. Clear previous messages
        displayMessage('clear');

        if (!file) {
            setSelectedFile(null);
            return;
        }

        // 2. Validate Type
        if (!validTypes.includes(file.type)) {
            displayMessage('error', 'Invalid file type. PDF/JPG/PNG only.');
            setSelectedFile(null);
            e.target.value = ''; // 🛑 CRITICAL: Clear the input UI
            return;
        }

        // 3. Validate Size
        if (file.size > maxSize) {
            // Display the error message exactly as requested
            displayMessage('error', 'File size exceeds 2 MB.');

            // Ensure the component state is cleared
            setSelectedFile(null);

            // 🛑 CRITICAL: Clear the input UI 
            // This is what makes the input box show "No file chosen" again.
            e.target.value = '';
            return;
        }

        // 4. If validation passes, set the file
        setSelectedFile(file);
    };

    const resetForm = () => {
        setReasonForExit('');
        setComments('');
        setSelectedFile(null);
        setEditingDraftId(null);

        // ✅ DO NOT recalculate LWD here
        // LWD must remain what backend finalized

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setFileKey(Date.now());
    };





    const getPropperDate = () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // --- Submit resignation or save draft (Handles POST and PUT) ---
    const submitResignation = async (status) => {
        const submissionStatus = status === 'Draft' ? 'Draft' : 'pending approval';

        if (submissionStatus !== 'Draft' && !reasonForExit) {
            displayMessage('error', 'Please select a reason for exit.');
            return;
        }

        const employeeId = sessionStorage.getItem('employeeId');

        // Project Assignment Validation (only if NOT a Draft)
        if (submissionStatus !== 'Draft') {
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
        }

        displayMessage('clear');

        if (selectedFile instanceof File && selectedFile.size > 5 * 1024 * 1024) {
            displayMessage("error", "File size exceeds 5 MB.");
            console.error("🚫 SUBMISSION STOPPED DUE TO FILE SIZE"); // Add this
            return;
        }
        // Add this to check if the code proceeds:
        console.log("✅ File size check passed. Proceeding with submission...");
        try {
            const token = sessionStorage.getItem('token');
            const employeeId = sessionStorage.getItem('employeeId');
            const employeeName = sessionStorage.getItem('employeeName');

            if (!token || !employeeId || !employeeName)
                return displayMessage('error', 'User not authenticated.');

            let base64Document = null;
            let documentName = selectedFile ? selectedFile.name : 'No file uploaded';

            // New file → convert to base64
            if (selectedFile instanceof File) {
                base64Document = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(selectedFile);
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = (err) => reject(err);
                });
            }
            // No file uploaded
            else if (selectedFile === null) {
                base64Document = null;
                documentName = "No file uploaded";
            }
            // Editing draft → keep existing file
            else if (editingDraftId && selectedFile?.isExisting) {
                base64Document = undefined;
                documentName = selectedFile.name;
            }

            const payload = {
                lastWorkingDay,
                reasonForExit,
                comments,
                documentName,
                ...(base64Document !== undefined && { base64Document }),
                status: submissionStatus,
            };

            let response;
            if (editingDraftId) {
                response = await api.put(
                    `${RESIGNATION_API_URL}/${editingDraftId}`,
                    payload,
                    {
                        headers: {
                            employeeId,
                            employeeName
                        },
                    }
                );
            } else {
                response = await api.post(RESIGNATION_API_URL, payload, {
                    headers: {
                        employeeId,
                        employeeName
                    },
                });
            }

            // Show success message as alert
            const successMsg = submissionStatus === 'Draft'
                ? 'Your resignation draft has been saved successfully.'
                : 'Your resignation has been submitted successfully.';
            alert(response.data?.message || successMsg);

            // VERY IMPORTANT: Clear adjustment note
            // This prevents Sunday/Saturday from reappearing after submit
            setAdjustReason("");

            // Reset the form (DOES NOT recalculate LWD anymore)
            resetForm();

            // Refresh data
            fetchDrafts();
            fetchHistory();

            if (submissionStatus !== 'Draft') {
                fetchNotifications();
            } else {
                setMainActiveTab('drafts');
            }

        } catch (err) {
            console.error(err.response?.data || err);
            const message = err.response?.data?.message || err.message || 'Failed to process request.';
            displayMessage('error', message);
        }
    };

    // --- Download document ---
    const downloadDocument = async (id, fileName) => {
        try {
            const token = sessionStorage.getItem('token');
            const employeeId = sessionStorage.getItem('employeeId');
            const employeeName = sessionStorage.getItem('employeeName');
            if (!token || !employeeId || !employeeName) return displayMessage('error', 'User not authenticated.');

            // Fix URL: Remove '/resignations' from base and append '/document/{id}'
            const docUrl = `/v1/exit-management/document/${id}`;

            const response = await api.get(
                docUrl,
                { responseType: 'blob', headers: { Authorization: `Bearer ${token}`, employeeId, employeeName } }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            displayMessage('clear');
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to download file.';
            displayMessage('error', message);
        }
    };

    // --- Delete draft (DELETE Action) ---
    const deleteDraft = async (id) => {
        if (!window.confirm("Are you sure you want to delete this draft?")) return;
        try {
            const token = sessionStorage.getItem('token');
            const employeeId = sessionStorage.getItem('employeeId');
            const employeeName = sessionStorage.getItem('employeeName');
            if (!token || !employeeId || !employeeName) return displayMessage('error', 'User not authenticated.');

            await api.delete(`${RESIGNATION_API_URL}/${id}`, {
                headers: { employeeId, employeeName },
            });
            displayMessage('success', 'Draft deleted successfully.');
            fetchDrafts(); // Refresh the drafts list
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to delete draft.';
            displayMessage('error', message);
        }
    };

    // --- Edit draft (Preparation for PUT Action) ---
    const editDraft = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            const employeeId = sessionStorage.getItem('employeeId');
            const employeeName = sessionStorage.getItem('employeeName');
            if (!token || !employeeId || !employeeName) return displayMessage('error', 'User not authenticated.');

            const response = await api.get(`${RESIGNATION_API_URL}/${id}`, {
                headers: { employeeId, employeeName },
            });

            const draft = response.data;

            // Set form fields with draft data
            setReasonForExit(draft.reasonForExit);
            setComments(draft.comments);

            // The date from backend might be in YYYY-MM-DD, convert to DD-MM-YYYY for display/state
            const dateParts = draft.lastWorkingDay.split('-');
            let formattedLWD = draft.lastWorkingDay;
            if (dateParts.length === 3 && dateParts[0].length === 4) { // Assumes YYYY-MM-DD
                formattedLWD = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // Convert to DD-MM-YYYY
            }
            setLastWorkingDay(formattedLWD);

            setEditingDraftId(draft.id);

            // Set selectedFile state with a placeholder object for display
            if (draft.documentName && draft.documentName !== 'No file uploaded') {
                // Create a file-like object to populate the "Current File" text
                setSelectedFile({ name: draft.documentName, isExisting: true });
            } else {
                setSelectedFile(null);
            }

            // Navigate to the form to begin editing
            setMainActiveTab('submitResignation');
            displayMessage('clear');

        } catch (err) {
            console.error(err);
            displayMessage('error', 'Failed to fetch draft for editing.');
        }
    };



    // --- JSX Return ---
    return (
        <>
            <Sidebar notificationCount={notifications.length}>
                <div className="leave-container exit-management-container">
                    <div className="leave-content-wrapper">
                        <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginBottom: '1.5rem' }}>
                            <h1 className="page-title" style={{ margin: 0 }}>
                                Exit Management
                            </h1>
                            <p className="page-subtitle exit-subtitle" style={{ color: '#00B3A4', fontSize: '15px', margin: 0, fontWeight: 500 }}>
                                Manage your resignation and track clearance progress
                            </p>
                        </div>

                        <div className="leave-tabs-container">
                            {showLeftArrow && (
                                <button
                                    className="tab-arrow tab-arrow-left"
                                    onClick={() => scrollTabs('left')}
                                    aria-label="Scroll left"
                                >
                                    <FiChevronLeft />
                                </button>
                            )}

                            <div
                                className="leave-tabs exit-tabs"
                                ref={tabsScrollerRef}
                                onScroll={handleScroll}
                            >
                                <button
                                    className={`leave-tab-btn tab-apply ${mainActiveTab === 'submitResignation' ? 'active' : ''}`}
                                    onClick={() => {
                                        setMainActiveTab('submitResignation');
                                        setEditingDraftId(null);
                                        setReasonForExit('');
                                        setComments('');
                                        setSelectedFile(null);
                                        displayMessage('clear');
                                    }}
                                >
                                    Apply for Resignation
                                </button>

                                <button
                                    className={`leave-tab-btn tab-history ${mainActiveTab === 'noticePeriod' ? 'active' : ''}`}
                                    onClick={() => setMainActiveTab('noticePeriod')}
                                >
                                    Status
                                </button>

                            </div>

                            {showRightArrow && (
                                <button
                                    className="tab-arrow tab-arrow-right"
                                    onClick={() => scrollTabs('right')}
                                    aria-label="Scroll right"
                                >
                                    <FiChevronRight />
                                </button>
                            )}
                        </div>

                        <div className="leave-card">
                            {/* ---------- Submit Resignation ---------- */}
                            {mainActiveTab === 'submitResignation' && (
                                <div key={fileKey}>
                                    <h3 className="leave-card-title">{editingDraftId ? 'Edit Resignation' : 'Apply for Resignation'}</h3>
                                    <form
                                        onSubmit={(e) => { e.preventDefault(); submitResignation('pending approval'); }}
                                        className="leave-form"
                                    >
                                        <div className="leave-form-scroll">

                                            <div className="leave-form-grid exit-form-grid">
                                                <div className="leave-form-group">
                                                    <label className="leave-label">
                                                        Reason for Exit <span className="error-msg">*</span>
                                                    </label>
                                                    <select
                                                        className="leave-select"
                                                        value={reasonForExit}
                                                        onChange={(e) => setReasonForExit(e.target.value)}
                                                    >
                                                        <option value="">Select Reason</option>

                                                        {exitReasons.length > 0 ? (
                                                            exitReasons.map((reason) => (
                                                                <option key={reason.id} value={reason.reason}>
                                                                    {reason.reason}
                                                                </option>
                                                            ))
                                                        ) : (
                                                            <option disabled>Loading reasons...</option>
                                                        )}
                                                    </select>
                                                </div>

                                                {/* <div className="leave-form-group">
                                                    <label className="leave-label">
                                                        Last Working Day <span className="error-msg">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lastWorkingDay}
                                                        readOnly
                                                        className="leave-input"
                                                        style={{ backgroundColor: '#f1f5f9', borderRadius: '8px' }}
                                                    />
                                                    <small className="helper-text" style={{ color: 'var(--slate-500)', marginTop: '4px', display: 'block' }}>
                                                        As per company policy, notice period is {noticePeriodDays} days.
                                                    </small>
                                                </div> */}

                                                <div className="leave-form-group">
                                                    <label className="leave-label">
                                                        Upload Document
                                                    </label>
                                                    <div className="leave-input leave-input-file-container" style={{ display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
                                                        <input
                                                            key={fileKey}
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={handleFileChange}
                                                            accept=".pdf,.jpeg,.jpg,.png"
                                                            style={{ display: 'none' }}
                                                            id="exit-file-upload"
                                                        />
                                                        <label
                                                            htmlFor="exit-file-upload"
                                                            style={{
                                                                backgroundColor: '#f1f5f9',
                                                                padding: '0 1rem',
                                                                cursor: 'pointer',
                                                                borderRight: '1px solid var(--border-color)',
                                                                fontWeight: 700,
                                                                color: '#00B3A4',
                                                                height: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                boxSizing: 'border-box',
                                                                textTransform: 'none'
                                                            }}
                                                        >
                                                            Choose File
                                                        </label>
                                                        <span style={{ padding: '0 1rem', color: selectedFile ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '15px' }}>
                                                            {selectedFile ? (selectedFile.name || "File selected") : "No file chosen"}
                                                        </span>
                                                    </div>
                                                    {editingDraftId && selectedFile?.isExisting && (
                                                        <small className="helper-text">
                                                            (Existing file. Upload a new file to replace.)
                                                        </small>
                                                    )}
                                                    <small className="helper-text">Supported: PDF, JPG, JPEG, PNG (Max 2MB)</small>
                                                </div>

                                                <div className="leave-form-group leave-form-full">
                                                    <label className="leave-label">Comments</label>
                                                    <textarea
                                                        value={comments}
                                                        onChange={(e) => setComments(e.target.value)}
                                                        rows="4"
                                                        className="leave-textarea"
                                                        style={{ resize: 'none', backgroundColor: '#F5F7FA' }}
                                                        placeholder="Provide additional comments ..."
                                                        maxLength={500}
                                                    />
                                                    <small className="helper-text">
                                                        {comments.length}/500
                                                    </small>
                                                </div>
                                            </div>

                                            {errorMessage && <p className="error-msg">{errorMessage}</p>}
                                        </div>

                                        <div className="leave-card-actions">
                                            <button
                                                type="submit"
                                                className="btn-primary"
                                            >
                                                {editingDraftId ? 'Update & Submit' : 'Submit Resignation'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingDraftId(null);
                                                    setReasonForExit('');
                                                    setComments('');
                                                    setSelectedFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                    setFileKey(Date.now());
                                                    displayMessage('clear');
                                                }}
                                                className="btn-cancel"
                                            >
                                                {editingDraftId ? 'Cancel Edit' : 'Clear'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ---------- Drafts Tab ---------- */}
                            {mainActiveTab === 'drafts' && (
                                <div>
                                    <h3 className="leave-card-title">Saved Drafts</h3>
                                    {errorMessage && <p className="error-msg">{errorMessage}</p>}

                                    {drafts.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold">No drafts available.</p>
                                        </div>
                                    ) : (
                                        <div className="leave-table-wrapper">
                                            <table className="leave-main-table">
                                                <thead>
                                                    <tr>
                                                        <th>Reason</th>
                                                        <th>Document</th>
                                                        <th>LWD</th>
                                                        <th>Comments</th>
                                                        <th>Status</th>
                                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {drafts.map((draft) => (
                                                        <tr key={draft.id}>
                                                            <td style={{ fontWeight: 'bold' }}>{draft.reasonForExit}</td>
                                                            <td>
                                                                {draft.documentName && draft.documentName !== 'No file uploaded' ? (
                                                                    <div className="flex gap-3">
                                                                        <button
                                                                            className="text-indigo-600 hover:text-indigo-800 underline font-bold text-sm"
                                                                            onClick={() => downloadDocument(draft.id, draft.documentName)}
                                                                        >
                                                                            Download
                                                                        </button>
                                                                        <button
                                                                            className="text-blue-600 hover:text-blue-800 underline font-bold text-sm"
                                                                            onClick={() => handleViewDocument(draft.id, draft.documentName)}
                                                                        >
                                                                            Preview
                                                                        </button>
                                                                    </div>
                                                                ) : 'No file uploaded'}
                                                            </td>
                                                            <td style={{ color: 'var(--slate-600)' }}>{draft.lastWorkingDay}</td>
                                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draft.comments}</td>
                                                            <td><span className="status-badge pending">{draft.status}</span></td>
                                                            <td>
                                                                <div className="flex justify-center gap-2">
                                                                    <button
                                                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-all"
                                                                        onClick={() => editDraft(draft.id)}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100 transition-all"
                                                                        onClick={() => deleteDraft(draft.id)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ---------- My Tasks Tab ---------- */}
                            {mainActiveTab === 'myTasks' && (
                                <div className="form-card" style={{ padding: 0 }}>
                                    <MyTeamRes />
                                </div>
                            )}

                            {/* ---------- Status Tab ---------- */}
                            {mainActiveTab === 'noticePeriod' && (
                                <div className="p-4">
                                    <ExitProgressTracker
                                        resignation={history.length > 0 ? history[0] : null}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* Preview Modal */}
                {
                    isPreviewModalOpen && ReactDOM.createPortal(
                        <div className="preview-modal-overlay" onClick={handleClosePreviewModal} style={{
                            position: 'fixed',
                            top: 0,
                            left: window.innerWidth > 768 ? '280px' : '0',
                            width: window.innerWidth > 768 ? 'calc(100% - 280px)' : '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 99999
                        }}>
                            <div className="preview-modal-content" onClick={e => e.stopPropagation()} style={{
                                backgroundColor: 'white',
                                width: '100%',
                                height: '100%',
                                maxWidth: '100%',
                                borderRadius: '0',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: 'none',
                                overflow: 'hidden',
                                animation: 'fadeIn 0.2s ease-out'
                            }}>
                                <div className="preview-modal-header" style={{
                                    padding: '16px 24px',
                                    borderBottom: '1px solid #e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#f8fafc'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: '600' }}>Document Preview</h3>
                                    <button
                                        onClick={handleClosePreviewModal}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                        title="Close Preview"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                <div className="preview-modal-body" style={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    padding: '0',
                                    backgroundColor: '#f1f5f9',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    {fileType === 'pdf' ? (
                                        <iframe
                                            src={previewFile}
                                            title="PDF Preview"
                                            width="100%"
                                            height="100%"
                                            style={{ border: 'none', backgroundColor: 'white' }}
                                        />
                                    ) : (
                                        <div style={{ padding: '24px', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                                            <img
                                                src={previewFile}
                                                alt="Document Preview"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="preview-modal-footer" style={{
                                    padding: '12px 24px',
                                    borderTop: '1px solid #e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    backgroundColor: 'white'
                                }}>
                                    <button
                                        onClick={handleClosePreviewModal}
                                        style={{
                                            padding: '8px 20px',
                                            backgroundColor: '#1e293b',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '500',
                                            fontSize: '0.95rem',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                }
            </Sidebar >

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                message="Your resignation has been submitted successfully."
            />
        </>
    );
}

export default ExitManagement;
