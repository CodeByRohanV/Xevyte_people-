import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FiUser, FiUsers, FiShield, FiClipboard, FiDollarSign, FiClock, FiUpload, FiCheckSquare, FiEye } from 'react-icons/fi';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './MyTeamRes.css';
import { FaRupeeSign } from 'react-icons/fa';
import api from '../api';

// --- Configuration ---
const EXIT_MGMT_API = `/v1/exit-management`;
const EXIT_FORM_API = `/v1/exit-forms`;
const ACCESS_API = `/access`;
const CLEARANCE_API = `/clearance`; // ✅ NEW


// Define Modal States for clarity
const MODAL_NONE = 0;
const MODAL_HR_CLEARANCE = 1;
const MODAL_EXIT_INTERVIEW_SCHEDULE = 2;
const MODAL_EXIT_INTERVIEW_FEEDBACK = 3;
const MODAL_FINANCE_SETTLEMENT = 4;
const MODAL_TASK_DETAILS = 5;

const SmartDatePicker = ({ selected, onChange, minDate, className, placeholderText }) => {
    const [open, setOpen] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    return (
        <DatePicker
            selected={selected}
            onChange={(date) => {
                onChange(date);
                setTimeout(() => setOpen(false), 20);
            }}
            onSelect={() => setOpen(false)}
            open={open}
            onInputClick={() => setOpen(true)}
            onClickOutside={() => setOpen(false)}
            dateFormat="dd-MM-yyyy"
            minDate={minDate}
            className={className}
            placeholderText={placeholderText || "DD-MM-YYYY"}
            calendarClassName="no-gap-calendar"
            dayClassName={() => "no-gap-day"}
            wrapperClassName="full-width-picker"
            portalId="root"
            popperPlacement="auto"
            strictParsing

            renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => {
                const months = [
                    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
                ];
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 120 }, (_, i) => currentYear + 10 - i);

                return (
                    <div className="custom-calendar-header">
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

const getInitialClearanceForm = () => ({
    laptopSerial: '',
    laptopSerialChecked: false,
    accessCard: false,
    emailClosed: false,
    vpnRevoked: false,
    softwareDeallocated: false,
    idCardReturned: false,
    exitInterviewCompleted: false,
    documentHandover: false,
    knowledgeTransfer: false,
    timesheetFilled: false,
    insuranceDeactivation: false,
    hrFinalApproval: false,
    accessCard_comment: '',
    emailClosed_comment: '',
    vpnRevoked_comment: '',
    softwareDeallocated_comment: '',
    idCardReturned_comment: '',
    exitInterviewCompleted_comment: '',
    documentHandover_comment: '',
    knowledgeTransfer_comment: '',
    timesheetFilled_comment: '',
    insuranceDeactivation_comment: '',
    hrAdditionalComments: '',
    adminAdditionalComments: '',
    editedLastWorkingDay: '',
    hrClearanceDocument: null,
    adminClearanceDocument: null,
    hrDocumentPath: null,
    adminDocumentPath: null,
});

const getInitialScheduleForm = () => ({
    interviewDate: null,   // ✅ store Date object
    interviewer: '',
    meetingLink: '',
});


const getInitialExitForm = () => ({});

const getInitialSettlementForm = () => ({
    pendingDues: 0,
    gratuityAmount: 0,
    noticePeriodRecovery: 0,
    finalAmountPaid: 0,
    settlementDate: new Date().toISOString().substring(0, 10),
    financeComments: '',
    laptopSerial: ''
});


function MyTeamRes({ managerId, onStatusChange }) {
    const getDisplayEmployeeId = (id) => {
        if (!id) return "";
        if (id.includes('_')) return id.split('_').pop();
        if (id.includes('-')) return id.split('-').pop();
        return id;
    };

    const validateFileSize = (file) => {
        if (!file) return true; // no file -> ok
        const maxSize = 2 * 1024 * 1024; // 2 MB
        return file.size <= maxSize;
    };

    const hrFileInputRef = useRef(null);
    const adminFileInputRef = useRef(null);

    const [exitQuestions, setExitQuestions] = useState([]);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // const [role, setRole] = useState('manager'); // Default role for testing
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalState, setModalState] = useState(MODAL_NONE);
    const [scheduling, setScheduling] = useState(false);
    // const [role, setRole] = useState(''); // REMOVED global role state
    const [availableRoles, setAvailableRoles] = useState([]);
    // ✅ Helper: Convert any valid date to DD-MM-YYYY
    const formatDateToDDMMYYYY = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // HR Clearance form state
    const [clearanceForm, setClearanceForm] = useState(getInitialClearanceForm());


    const responsiveContainerStyle = {
        padding: '10px',
        backgroundColor: '#f4f6f8',
        borderRadius: '8px',
        width: '100%',
        overflowX: 'auto',
        boxSizing: 'border-box',
        marginTop: '0px',
    };

    // Exit Interview SCHEDULE form
    const [scheduleForm, setScheduleForm] = useState(getInitialScheduleForm());

    // Preview state
    const [previewFile, setPreviewFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [isResPreviewModalOpen, setIsResPreviewModalOpen] = useState(false);

    const handleClosePreviewModal = () => {
        setIsResPreviewModalOpen(false);
        if (previewFile) URL.revokeObjectURL(previewFile);
        setPreviewFile(null);
        setFileType(null);
    };

    const handleViewDocument = async (id, documentName) => {
        try {
            const token = sessionStorage.getItem('token');
            const role = selectedTask?.actingRole || 'manager';
            const headers = { Authorization: `Bearer ${token}` };

            // Add appropriate ID header based on role, though maybe not strictly needed for document fetch if token is enough
            // But preserving pattern
            if (role === 'manager') headers['managerId'] = managerId;
            else if (role === 'hr') headers['hrId'] = managerId;
            else if (role === 'admin') headers['adminId'] = managerId;
            else if (role === 'finance') headers['financeId'] = managerId;

            const response = await api.get(`${EXIT_MGMT_API}/document/${id}`, {
                responseType: 'arraybuffer',
                headers: { Authorization: `Bearer ${token}` } // Document fetch typically just needs token
            });

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
            setIsResPreviewModalOpen(true);

        } catch (err) {
            console.error("Error viewing document:", err);
            alert('Failed to load document for preview.');
        }
    };


    const handleDownload = async (id, fileName) => {
        try {
            const token = sessionStorage.getItem('token'); // ✅ Include JWT token
            const response = await api.get(`${EXIT_MGMT_API}/document/${id}`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` },
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('❌ Error downloading file:', error);
            alert('Failed to download document. File may not exist.');
        }
    };



    // Exit Interview FEEDBACK form
    const [exitForm, setExitForm] = useState(getInitialExitForm());


    // ✅ Fetch feedback form data from backend
    const fetchFeedbackForm = async (formId, employeeId) => {
        try {
            const feedbackToken = btoa(`${formId}:${employeeId}`);
            const response = await api.get(`${EXIT_FORM_API}/feedback/${feedbackToken}`);

            const data = response.data?.data;
            if (data) {
                setExitForm({
                    overallExperienceRating: data.overallExperienceRating || 5,
                    reasonForLeavingDetailed: data.reasonForLeavingDetailed || '',
                    managerRelationshipFeedback: data.managerRelationshipFeedback || '',
                    managerRelationshipRating: data.managerRelationshipRating || 5,
                    workEnvironmentFeedback: data.workEnvironmentFeedback || '',
                    workEnvironmentRating: data.workEnvironmentRating || 5,
                    suggestionsForImprovement: data.suggestionsForImprovement || '',
                    recommendXevyte: data.recommendXevyte || 'Yes',
                    anyOtherComments: data.anyOtherComments || ''
                });
            } else {
                alert('⚠️ Feedback form data empty from backend.');
            }
        } catch (err) {
            console.error('❌ Failed to fetch feedback form:', err);
            alert('❌ Could not load exit feedback form from backend.');
        }
    };

    // Finance Final Settlement form
    const [settlementForm, setSettlementForm] = useState(getInitialSettlementForm());


    const fetchTasks = async () => {
        const token = sessionStorage.getItem('token');
        setLoading(true);
        setError('');

        try {
            if (!managerId) {
                setError('User ID not found. Please log in again.');
                setLoading(false);
                return;
            }

            if (availableRoles.length === 0) {
                setTasks([]);
                setLoading(false);
                return;
            }

            const promises = availableRoles.map(async (r) => {
                let url = '';
                let headers = { Authorization: `Bearer ${token}` };

                if (r === 'manager') {
                    url = `${EXIT_MGMT_API}/manager/pending-resignations`;
                    headers['managerId'] = managerId;
                } else if (r === 'reviewer') {
                    url = `${EXIT_MGMT_API}/reviewer/pending-resignations`;
                    headers['reviewerId'] = managerId;
                } else if (r === 'hr') {
                    url = `${EXIT_MGMT_API}/hr/approved-resignations`;
                    headers['hrId'] = managerId;
                } else if (r === 'admin') {
                    url = `${EXIT_MGMT_API}/admin/pending-resignations`;
                    headers['adminId'] = managerId;
                } else if (r === 'finance') {
                    url = `${EXIT_MGMT_API}/finance/pending-resignations`;
                    headers['financeId'] = managerId;
                }

                if (!url) return [];

                try {
                    const res = await api.get(url, { headers });
                    let filtered = res.data || [];

                    if (r === "manager") {
                        filtered = filtered.filter(t =>
                            t.status === "Pending Approval" ||
                            t.status === "Approved by Reviewer"
                        );
                    }

                    if (r === "reviewer") {
                        filtered = filtered.filter(t =>
                            t.status === "Pending Approval" ||
                            t.status === "Approved by Manager"
                        );
                    }

                    if (r === "hr") {
                        filtered = filtered.filter(t =>
                            t.status === "Approved by Manager and Reviewer" ||
                            t.status === "HR Approved" ||
                            t.status === "Admin Cleared"
                        );
                        filtered = filtered.filter(t => !t.hrCleared);
                    }

                    if (r === "admin") {
                        filtered = filtered.filter(t =>
                            t.status === "HR Approved" ||
                            t.status === "HR Cleared"
                        );
                        filtered = filtered.filter(t => !t.adminCleared);
                    }

                    if (r === "finance") {
                        filtered = filtered.filter(t => t.status !== "Final Approved - Exit Complete");
                    }

                    return filtered.map(t => ({ ...t, actingRole: r }));
                } catch (e) {
                    console.warn(`Failed to fetch tasks for role ${r}:`, e);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            const allTasks = results.flat();

            // Deduplicate by ID
            const taskMap = new Map();
            allTasks.forEach(t => {
                if (!taskMap.has(t.id)) {
                    taskMap.set(t.id, t);
                }
            });

            setTasks(Array.from(taskMap.values()));

        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(`Failed to fetch tasks.`);
        } finally {
            setLoading(false);
        }
    };

    // Handle approve/reject actions (manager/reviewer/admin/finance)
    // Handle approve/reject actions (manager/reviewer/admin/finance)
    const handleAction = async (id, action, actingRole) => {
        const token = sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        headers[`${actingRole}Id`] = managerId;

        let url = `${EXIT_MGMT_API}/${actingRole}/resignations/${id}/${action}`;

        try {
            await api.put(url, null, { headers });
            alert(`Resignation ${action} successful.`);

            await fetchTasks();

            // 🔥 THIS FIX IS THE REASON YOUR TRACKER WAS NOT UPDATING
            if (onStatusChange) onStatusChange();

        } catch (err) {
            console.error(`Error during ${action}:`, err);
            alert(`Failed to ${action} resignation. ${err.response?.data || 'Unknown error.'}`);
        }
    };


    const fetchUserRoles = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!managerId) {
                setError('⚠️ User ID not found. Please log in again.');
                return;
            }

            const res = await api.get(`${ACCESS_API}/assigned-ids/${managerId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (res.status !== 200 || !res.data) {
                setError('❌ Failed to fetch roles. Please try again later.');
                return;
            }

            const data = res.data;
            const roles = Object.keys(data)
                .filter(
                    (r) =>
                        ['manager', 'reviewer', 'hr', 'admin', 'finance'].includes(r) &&
                        data[r] === true
                );

            setAvailableRoles(roles);

            // ✅ No default role set
            console.log('✅ Roles fetched successfully:', roles);

            if (roles.length === 0) {
                setError('No roles assigned to this user.');
                console.warn('⚠️ No assigned roles found for:', managerId);
            }
        } catch (err) {
            console.error('❌ Error fetching roles:', err);

            if (err.response) {
                console.error('Server Response:', err.response.data);
                setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Failed to load roles.'}`);
            } else if (err.request) {
                setError('❌ Network error. Unable to connect to the server.');
            } else {
                setError(`Unexpected error: ${err.message}`);
            }
        }
    };

    useEffect(() => {
        if (managerId) {
            fetchUserRoles(); // ✅ fetch roles first
        }
    }, [managerId]);

    // ✅ Fetch tasks after role is known
    useEffect(() => {
        if (managerId && availableRoles.length > 0) {
            fetchTasks();
        }
    }, [managerId, availableRoles]);

    const openFeedbackModal = async (task) => {
        setExitForm(getInitialExitForm()); // Ensure clean start
        setSelectedTask(task);
        setModalState(MODAL_EXIT_INTERVIEW_FEEDBACK);


        try {
            const token = sessionStorage.getItem("token");

            // ---------------------------
            // 1️⃣ FETCH EXIT QUESTIONS
            // ---------------------------
            const qRes = await api.get(
                "/v1/exit-management/exit-questions",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Normalize type to uppercase so viewer checks always match
            const normalizedQs = (qRes.data || []).map(q => ({ ...q, type: (q.type || 'TEXT').toUpperCase() }));
            setExitQuestions(normalizedQs);

            // ---------------------------
            // 2️⃣ FETCH EXIT FORM ID FOR EMPLOYEE
            // ---------------------------
            const resForm = await api.get(
                `${EXIT_FORM_API}/resignation/${task.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const exitForms = resForm.data?.data || [];
            if (exitForms.length > 0) {
                const formId = exitForms[0].id;
                const feedbackToken = btoa(`${formId}:${task.employeeId}`);

                // ---------------------------
                // 3️⃣ FETCH ANSWERS
                // ---------------------------
                try {
                    const fRes = await api.get(
                        `${EXIT_FORM_API}/feedback/${feedbackToken}`
                    );

                    // ALWAYS expect map { "questionId": answer }
                    const rawAnswers = fRes.data?.data?.answers || {};

                    // If answers is null/empty but we have legacy data, we might want to handle it, 
                    // but stay focused on dynamic answers for now as per current logic.
                    const answerMap = {};
                    Object.keys(rawAnswers).forEach(k => {
                        answerMap[String(k)] = rawAnswers[k];
                    });

                    setExitForm(answerMap);
                } catch (err) {
                    console.warn("Feedback data not found or error fetching. showing empty form.", err);
                    setExitForm({});
                }
            } else {
                console.log("No exit form created yet for this resignation. showing empty form.");
                setExitForm({});
            }

        } catch (error) {
            console.error("❌ Error loading feedback modal:", error);
            alert("Could not load exit feedback questions.");
        }
    };


    // HR Clearance open
    const openClearanceForm = async (task) => {
        setSelectedTask(task);
        setModalState(MODAL_HR_CLEARANCE);

        const token = sessionStorage.getItem("token");
        const baseForm = getInitialClearanceForm();

        try {
            // Fetch existing clearance data if it exists
            const res = await api.get(`${CLEARANCE_API}/${task.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data) {
                const data = res.data;
                setClearanceForm({
                    ...baseForm,
                    laptopSerial: data.laptopSerial || '',
                    laptopSerialChecked: !!data.laptopSerial,
                    accessCard: data.accessCard || false,
                    emailClosed: data.emailClosed || false,
                    vpnRevoked: data.vpnRevoked || false,
                    softwareDeallocated: data.softwareDeallocated || false,
                    idCardReturned: data.idCardReturned || false,

                    accessCard_comment: data.accessCardComment || '',
                    emailClosed_comment: data.emailClosedComment || '',
                    vpnRevoked_comment: data.vpnRevokedComment || '',
                    softwareDeallocated_comment: data.softwareDeallocatedComment || '',
                    idCardReturned_comment: data.idCardReturnedComment || '',

                    exitInterviewCompleted: data.exitInterviewCompleted || false,
                    documentHandover: data.documentHandover || false,
                    knowledgeTransfer: data.knowledgeTransfer || false,
                    timesheetFilled: data.timesheetFilled || false,
                    insuranceDeactivation: data.insuranceDeactivation || false,
                    hrFinalApproval: data.hrFinalApproval || false,

                    exitInterviewCompleted_comment: data.exitInterviewComment || '',
                    documentHandover_comment: data.documentHandoverComment || '',
                    knowledgeTransfer_comment: data.knowledgeTransferComment || '',
                    timesheetFilled_comment: data.timesheetFilledComment || '',
                    insuranceDeactivation_comment: data.insuranceDeactivationComment || '',

                    hrAdditionalComments: data.hrComments || '',
                    adminAdditionalComments: data.adminComments || '',

                    hrDocumentPath: data.hrDocumentPath || null,
                    adminDocumentPath: data.adminDocumentPath || null,

                    editedLastWorkingDay: data.lastWorkingDay
                        ? new Date(data.lastWorkingDay).toLocaleDateString('en-GB').replace(/\//g, '-')
                        : (task.lastWorkingDay ? new Date(task.lastWorkingDay).toLocaleDateString('en-GB').replace(/\//g, '-') : ''),
                });
            } else {
                setClearanceForm({
                    ...baseForm,
                    hrDocumentPath: null,
                    adminDocumentPath: null,
                    editedLastWorkingDay: task.lastWorkingDay
                        ? new Date(task.lastWorkingDay).toLocaleDateString('en-GB').replace(/\//g, '-')
                        : '',
                });
            }
        } catch (err) {
            console.log("No existing clearance found or error fetching:", err);
            setClearanceForm({
                ...baseForm,
                hrDocumentPath: null,
                adminDocumentPath: null,
                editedLastWorkingDay: task.lastWorkingDay
                    ? new Date(task.lastWorkingDay).toLocaleDateString('en-GB').replace(/\//g, '-')
                    : '',
            });
        }
    };

    const handleActionWithComment = async (id, action, comment = '', actingRole) => {
        const trimmedComment = (comment || '').trim();

        // 🚨 VALIDATION: Rejection must include a comment
        if (action === 'reject') {
            if (trimmedComment.length < 10 || trimmedComment.length > 100) {
                alert("Rejection reason must be between 10 and 100 characters long.");
                return false;
            }
        } else if (trimmedComment.length === 0) {
            // For other actions if comments are needed (though not strictly enforced like rejection here)
        }

        const token = sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        headers[`${actingRole}Id`] = managerId;

        // 🛠️ MANAGER EDIT LWD SUPPORT
        if (actingRole === 'manager' && selectedTask) {
            const originalLwd = selectedTask.lastWorkingDay
                ? new Date(selectedTask.lastWorkingDay).toLocaleDateString('en-GB').replace(/\//g, '-')
                : '';
            const isLwdChanged =
                selectedTask.editedLastWorkingDay &&
                selectedTask.editedLastWorkingDay.trim() !== "" &&
                selectedTask.editedLastWorkingDay !== originalLwd;

            if (isLwdChanged) {
                if (!trimmedComment) {
                    alert("Comments REQUIRED when changing Last Working Day.");
                    return false;
                }
                try {
                    await api.put(
                        `${EXIT_MGMT_API}/manager/resignations/${id}/edit-lwd`,
                        {
                            lastWorkingDay: selectedTask.editedLastWorkingDay,
                            comments: trimmedComment,
                        },
                        { headers }
                    );
                } catch (err) {
                    console.error("Error editing LWD by Manager:", err);
                    alert(`Failed to update Last Working Day: ${err.response?.data || 'Unknown error.'}`);
                    return false; // stop action chain on error
                }
            }
        }

        const url = `${EXIT_MGMT_API}/${actingRole}/resignations/${id}/${action}`;

        try {
            const response = await api.put(url, { comment: trimmedComment }, { headers });
            await fetchTasks();
            if (onStatusChange) onStatusChange();
            alert(`Resignation ${action} successful.`);
            return true;
        } catch (err) {
            console.error(`Error during ${action}:`, err);
            alert(`Failed to ${action} resignation.`);
            return false;
        }
    };

    const handleReject = async (task, role) => {
        let reason = prompt("Enter rejection reason (10-100 characters):");
        if (reason === null) return; // user cancelled

        const trimmedReason = reason.trim();
        if (trimmedReason.length < 10 || trimmedReason.length > 100) {
            alert("Rejection reason must be between 10 and 100 characters long.");
            return;
        }

        const success = await handleActionWithComment(task.id, 'reject', trimmedReason, role);
        if (success) setModalState(MODAL_NONE);
    };



    const handleClearanceChange = (e) => {
        const { name, value, type, checked } = e.target;
        setClearanceForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    const submitClearanceForm = async (isFinal = true) => {
        if (!selectedTask) return;
        const role = selectedTask.actingRole; // Get role from task

        const token = sessionStorage.getItem("token");

        const baseHeaders = { Authorization: `Bearer ${token}` };
        if (role === "hr") baseHeaders["hrId"] = managerId;
        if (role === "admin") baseHeaders["adminId"] = managerId;

        // --- VALIDATIONS ---
        const originalLwd = selectedTask.lastWorkingDay
            ? new Date(selectedTask.lastWorkingDay).toLocaleDateString("en-GB").replace(/\//g, "-")
            : "";

        const isLwdChanged =
            clearanceForm.editedLastWorkingDay &&
            clearanceForm.editedLastWorkingDay.trim() !== "" &&
            clearanceForm.editedLastWorkingDay !== originalLwd;

        if (isFinal) {
            if (role === "hr" && !clearanceForm.exitInterviewCompleted) {
                alert("Exit Interview & Feedback must be completed before HR Clearance.");
                return;
            }

            if (role === "hr" && isLwdChanged) {
                if (!clearanceForm.hrAdditionalComments?.trim()) {
                    alert("Comments REQUIRED when changing Last Working Day.");
                    return;
                }
            }

            if (role === "admin") {
                const serial = (clearanceForm.laptopSerial || "").trim();
                if (!serial) {
                    alert("Laptop Serial Number is mandatory for Admin clearance.");
                    return;
                }
            }
        }

        try {
            // STEP 1: HR edit LWD
            if (role === "hr" && isLwdChanged) {
                await api.put(
                    `${EXIT_MGMT_API}/hr/resignations/${selectedTask.id}/edit-lwd`,
                    {
                        lastWorkingDay: clearanceForm.editedLastWorkingDay,
                        comments: clearanceForm.hrAdditionalComments,
                    },
                    { headers: { Authorization: `Bearer ${token}`, hrId: managerId } }
                );
            }

            // -----------------------------------------------------------------
            // STEP 2: Build DTO object (FULL + COMBINED HR + ADMIN)
            // -----------------------------------------------------------------
            const dto = {
                laptopSerial: clearanceForm.laptopSerial,
                accessCard: clearanceForm.accessCard,
                emailClosed: clearanceForm.emailClosed,
                vpnRevoked: clearanceForm.vpnRevoked,
                softwareDeallocated: clearanceForm.softwareDeallocated,
                idCardReturned: clearanceForm.idCardReturned,

                accessCardComment: clearanceForm.accessCard_comment || "",
                emailClosedComment: clearanceForm.emailClosed_comment || "",
                vpnRevokedComment: clearanceForm.vpnRevoked_comment || "",
                softwareDeallocatedComment: clearanceForm.softwareDeallocated_comment || "",
                idCardReturnedComment: clearanceForm.idCardReturned_comment || "",

                exitInterviewCompleted: clearanceForm.exitInterviewCompleted,
                documentHandover: clearanceForm.documentHandover,
                knowledgeTransfer: clearanceForm.knowledgeTransfer,
                timesheetFilled: clearanceForm.timesheetFilled,
                insuranceDeactivation: clearanceForm.insuranceDeactivation,
                hrFinalApproval: clearanceForm.hrFinalApproval,

                exitInterviewComment: clearanceForm.exitInterviewCompleted_comment || "",
                documentHandoverComment: clearanceForm.documentHandover_comment || "",
                knowledgeTransferComment: clearanceForm.knowledgeTransfer_comment || "",
                timesheetFilledComment: clearanceForm.timesheetFilled_comment || "",
                insuranceDeactivationComment: clearanceForm.insuranceDeactivation_comment || "",

                lastWorkingDay: clearanceForm.editedLastWorkingDay,

                hrComments: clearanceForm.hrAdditionalComments || "",
                adminComments: clearanceForm.adminAdditionalComments || "",

                isFinal: isFinal,
                actingRole: role
            };

            // -----------------------------------------------------------------
            // STEP 3: Build FormData with DTO + Files
            // -----------------------------------------------------------------
            const formData = new FormData();

            // Attach JSON DTO (THIS IS THE FIX 🔥)
            formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));

            // Files
            if (clearanceForm.hrClearanceDocument) {
                formData.append("hrClearanceDocument", clearanceForm.hrClearanceDocument);
            }

            if (clearanceForm.adminClearanceDocument) {
                formData.append("adminClearanceDocument", clearanceForm.adminClearanceDocument);
            }

            // -----------------------------------------------------------------
            // STEP 4: Submit to backend
            // -----------------------------------------------------------------
            const clearanceRes = await api.post(
                `${CLEARANCE_API}/${selectedTask.id}`,
                formData,
                {
                    headers: {
                        ...baseHeaders,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log("Clearance saved:", clearanceRes.data);
            if (isFinal) {
                alert(" Clearance updated successfully.");
            } else {
                alert("Saved successfully");
            }

            setModalState(MODAL_NONE);
            setSelectedTask(null);
            setClearanceForm(getInitialClearanceForm()); // Reset form
            setSettlementForm(getInitialSettlementForm());

            await fetchTasks();
            if (onStatusChange) onStatusChange();

        } catch (err) {
            console.error("❌ Clearance submit ERROR:", err.response || err);

            const msg =
                err.response?.data?.message ||
                err.response?.data ||
                "Internal Server Error. Check backend logs.";

            alert("❌ Clearance submission failed: " + msg);
        }
    };




    // Exit interview scheduling
    const handleScheduleChange = (e) => {
        const { name, value } = e.target;
        setScheduleForm((prev) => ({ ...prev, [name]: value }));
    };

    // Exit interview scheduling
    const submitScheduleForm = async () => {
        if (!selectedTask) return;

        if (scheduling) return; // prevent double-click
        setScheduling(true);
        const role = selectedTask.actingRole;

        const token = sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        if (role === "hr") headers["hrId"] = managerId;

        // ✅ Validate inputs
        const meetingLink = (scheduleForm.meetingLink || "").trim();
        const interviewDate = scheduleForm.interviewDate; // Date object

        if (!(interviewDate instanceof Date) || !meetingLink) {
            alert("❗ Interview Date/Time and Meeting Link are required.");
            setScheduling(false);
            return;
        }

        // ⭐ URL Validation Regex
        const urlPattern = new RegExp(
            "^(https?:\\/\\/)?" +
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
            "((\\d{1,3}\\.){3}\\d{1,3}))" +
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
            "(\\?[;&a-z\\d%_.~+=-]*)?" +
            "(\\#[-a-z\\d_]*)?$",
            "i"
        );

        if (!urlPattern.test(meetingLink)) {
            alert("❌ Invalid link! Please provide a valid meeting URL (e.g., Google Meet or Teams).");
            setScheduling(false);
            return;
        }

        // Optional confirmation for non-standard links
        const isGoogleMeet = meetingLink.includes("meet.google.com");
        const isTeams =
            meetingLink.includes("teams.microsoft.com") ||
            meetingLink.includes("teams.live.com");

        if (!isGoogleMeet && !isTeams) {
            const proceed = window.confirm(
                "⚠️ This doesn't look like a standard Google Meet or Microsoft Teams link. Do you still want to use it?"
            );
            if (!proceed) {
                setScheduling(false);
                return;
            }
        }

        // ✅ FORMAT DATE → yyyy-MM-dd HH:mm:ss (LOCAL TIME)
        const interviewDateIso =
            interviewDate.getFullYear() + "-" +
            String(interviewDate.getMonth() + 1).padStart(2, "0") + "-" +
            String(interviewDate.getDate()).padStart(2, "0") + " " +
            String(interviewDate.getHours()).padStart(2, "0") + ":" +
            String(interviewDate.getMinutes()).padStart(2, "0") + ":00";

        const sendEmail = true;

        try {
            // ✅ STEP 1: Fetch existing ExitForm
            const res = await api.get(
                `${EXIT_FORM_API}/resignation/${selectedTask.id}`,
                { headers }
            );
            const exitForms = Array.isArray(res.data?.data) ? res.data.data : [];

            let exitFormId;
            if (exitForms.length === 0) {
                // Auto-create form if it doesn't exist
                const createRes = await api.post(EXIT_FORM_API, {
                    employeeId: selectedTask.employeeId,
                    resignationId: selectedTask.id
                }, { headers });
                exitFormId = createRes.data?.data?.id;

                if (!exitFormId) {
                    throw new Error("Failed to auto-create exit form.");
                }
            } else {
                exitFormId = exitForms[0].id;
            }

            // ✅ STEP 2: Schedule Exit Interview
            const response = await api.post(
                `${EXIT_FORM_API}/${exitFormId}/schedule-interview`,
                {},
                {
                    headers: headers,
                    params: {
                        hrId: managerId,
                        employeeId: selectedTask.employeeId,
                        dateIso: interviewDateIso,
                        interviewer:
                            scheduleForm.interviewer?.trim() || "HR Representative",
                        meetingLink: meetingLink,
                        sendEmail,
                        resignationId: selectedTask.id,
                    },
                }
            );

            alert(response.data?.message || "✅ Exit interview scheduled successfully.");

            // ✅ UI cleanup
            setModalState(MODAL_NONE);
            setSelectedTask(null);
            setScheduleForm(getInitialScheduleForm());
            fetchTasks();

        } catch (err) {
            console.error("❌ Error scheduling exit interview:", err);

            const msg =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unknown server error.";

            alert(`❌ Failed to schedule exit interview:\n\n${msg}`);
        } finally {
            setScheduling(false);
        }
    };





    // Exit Interview Feedback
    const handleExitFormChange = (e) => {
        const { name, value } = e.target;
        setExitForm((prev) => ({ ...prev, [name]: value }));
    };
    // Exit Interview Feedback
    const submitExitInterviewFeedback = async () => {
        if (!selectedTask) return;
        const token = sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            // ✅ Fetch or Create exit form
            const res = await api.get(`${EXIT_FORM_API}/resignation/${selectedTask.id}`, { headers });
            const exitForms = Array.isArray(res.data?.data) ? res.data.data : [];

            let exitFormId;
            if (exitForms.length === 0) {
                // Auto-create form if it doesn't exist
                const createRes = await api.post(EXIT_FORM_API, {
                    employeeId: selectedTask.employeeId,
                    resignationId: selectedTask.id
                }, { headers });
                exitFormId = createRes.data?.data?.id;

                if (!exitFormId) {
                    throw new Error("Failed to auto-create exit form.");
                }
            } else {
                exitFormId = exitForms[0].id;
            }

            // Step 2: Submit feedback using new endpoint
            const response = await api.post(
                `${EXIT_FORM_API}/${exitFormId}/submit-feedback`,
                { answers: exitForm }, // body contains answers map
                { headers }
            );

            const message = response.data?.message || "✅ Exit interview feedback submitted successfully.";
            alert(message);

            setModalState(MODAL_NONE);
            setSelectedTask(null);
            setExitForm(getInitialExitForm()); // Reset form
            fetchTasks();

        } catch (err) {
            console.error('❌ Error submitting exit interview feedback:', err);

            let msg = "Unknown server error.";
            if (err?.response?.data) {
                if (typeof err.response.data === "string") {
                    msg = err.response.data;
                } else if (typeof err.response.data === "object") {
                    msg = err.response.data.message || JSON.stringify(err.response.data, null, 2);
                }
            } else if (err.message) {
                msg = err.message;
            }

            alert(`❌ Failed to submit feedback:\n\n${msg}`);
        }
    };



    // Finance Settlement open
    const openFinanceSettlementForm = async (task) => {
        setSelectedTask(task);
        setModalState(MODAL_FINANCE_SETTLEMENT);

        const token = sessionStorage.getItem("token");

        try {
            // ⭐ Correct endpoint — backend expects only resignation ID
            const res = await api.get(
                `/clearance/${task.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const clearance = res.data || {};

            setSettlementForm({
                pendingDues: task.pendingDues || 0,
                gratuityAmount: task.gratuityAmount || 0,
                noticePeriodRecovery: task.noticePeriodRecovery || 0,
                settlementDate: task.settlementDate || new Date().toISOString().substring(0, 10),
                financeComments: task.financeComments || '',
                laptopSerial: clearance.laptopSerial || "" // ⭐ NOW IT WILL SHOW
            });

        } catch (err) {
            console.error("Failed to fetch clearance", err);
        }
    };



    const handleSettlementChange = (e) => {
        const { name, value } = e.target;
        setSettlementForm((prev) => ({
            ...prev,
            [name]: (name.includes('Dues') || name.includes('Amount') || name.includes('Recovery') || name.includes('Paid')) ? parseFloat(value) || 0 : value
        }));
    };

    const submitSettlementForm = async () => {
        if (!selectedTask) return;
        const token = sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}`, financeId: managerId };
        const url = `${EXIT_MGMT_API}/finance/final-settlement/${selectedTask.id}`;

        try {
            await api.post(url, settlementForm, { headers });
            alert('Final Settlement details submitted successfully!');
            setModalState(MODAL_NONE);
            setSelectedTask(null);
            setSettlementForm(getInitialSettlementForm()); // Reset form

            await fetchTasks();

            // 🔥 notify parent so tracker jumps to 100%
            if (onStatusChange) {
                onStatusChange();
            }
        } catch (settlementErr) {
            console.error('Error submitting finance settlement:', settlementErr.response || settlementErr);
            alert(`Failed to submit settlement: ${settlementErr.response?.data || 'Server error'}`);
        }
    };

    // Define Preview Modal explicitly so it can be returned alongside other modals
    const previewModal = isResPreviewModalOpen ? ReactDOM.createPortal(
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
    ) : null;


    // 1. Exit Interview Scheduling Modal
    if (modalState === MODAL_EXIT_INTERVIEW_SCHEDULE && selectedTask) {
        return ReactDOM.createPortal(
            <div className="exit-modal-overlay">
                <div className="exit-modal-content">
                    <div className="exit-modal-header">Schedule Exit Interview for {selectedTask.employeeName}</div>
                    <div className="exit-modal-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="exit-label" style={{ marginTop: 0 }}>

                                    Proposed Interview Date:
                                </label>
                                <SmartDatePicker
                                    selected={scheduleForm.interviewDate}
                                    onChange={(date) =>
                                        setScheduleForm(prev => ({
                                            ...prev,
                                            interviewDate: date
                                        }))
                                    }
                                    minDate={new Date()}
                                    className="exit-input"
                                />

                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="exit-label" style={{ marginTop: 0 }}>
                                    <FiClock className="label-icon" />
                                    Proposed Interview Time:
                                </label>
                                <DatePicker
                                    selected={scheduleForm.interviewDate}
                                    onChange={(date) =>
                                        setScheduleForm(prev => ({
                                            ...prev,
                                            interviewDate: date
                                        }))
                                    }
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time"
                                    dateFormat="h:mm aa"
                                    className="exit-input"
                                    portalId="root"
                                    popperClassName="time-only-picker-popper"
                                    placeholderText="Select Time"

                                />

                            </div>
                        </div>

                        <label className="exit-label" style={{ marginTop: 0 }}>
                            <FiUpload className="label-icon" /> Meeting Link (e.g., Zoom/Meet URL):
                        </label>
                        <input
                            type="url"
                            name="meetingLink"
                            value={scheduleForm.meetingLink}
                            onChange={handleScheduleChange}
                            className="exit-input"
                            placeholder="https://meet.google.com/..."
                        />
                        <div className="exit-modal-actions">
                            <button onClick={() => {
                                setModalState(MODAL_NONE);
                                setScheduleForm(getInitialScheduleForm());
                            }} className="exit-btn-secondary">Cancel</button>
                            <button onClick={submitScheduleForm} className="exit-btn-schedule" disabled={scheduling}>
                                {scheduling ? 'Scheduling...' : 'Schedule Interview'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (modalState === MODAL_HR_CLEARANCE && selectedTask) {
        const role = selectedTask.actingRole;

        // HR checklist items
        const hrClearanceChecklist = [
            {
                key: 'exitInterviewCompleted',
                label: <>Exit Interview & Feedback <span style={{ color: 'red' }}>*</span></>
            },
            { key: 'documentHandover', label: 'Document Handover' },
            { key: 'knowledgeTransfer', label: 'Knowledge Transfer' },
            { key: 'timesheetFilled', label: 'Timesheet Filled' },
            { key: 'insuranceDeactivation', label: 'Insurance Deactivation' },
        ];

        // Admin checklist items
        const adminClearanceChecklist = [
            { key: 'laptopSerial', label: <>Laptop serial number <span style={{ color: 'red' }}>*</span></> },
            { key: 'accessCard', label: 'Access card deactivation' },
            { key: 'emailClosed', label: 'Email account closure' },
            { key: 'vpnRevoked', label: 'VPN/system access revocation' },
            { key: 'softwareDeallocated', label: 'Software license de-allocation' },
            { key: 'idCardReturned', label: 'ID card return' },
        ];

        const checklistToRender = role === 'admin' ? adminClearanceChecklist : hrClearanceChecklist;

        return ReactDOM.createPortal(
            <div className="exit-modal-overlay">
                <div className="exit-modal-content">
                    <div className="exit-modal-header">
                        {role === 'admin' ? 'Admin Clearance' : 'HR Clearance'} for {selectedTask.employeeName}
                    </div>

                    <div className="exit-modal-body">
                        {/* Optional Edit LWD for HR only */}
                        {role === 'hr' && (
                            <>
                                <label className="exit-label">
                                    <strong>Edit Last Working Day (DD-MM-YYYY) — optional</strong>
                                </label>
                                <input
                                    type="text"
                                    name="editedLastWorkingDay"
                                    placeholder={
                                        selectedTask.lastWorkingDay
                                            ? new Date(selectedTask.lastWorkingDay)
                                                .toLocaleDateString('en-GB')
                                                .replace(/\//g, '-')
                                            : 'DD-MM-YYYY'
                                    }
                                    value={clearanceForm.editedLastWorkingDay}
                                    onChange={handleClearanceChange}
                                    className="exit-input"
                                />

                                <small style={{ display: 'block', marginBottom: '15px', color: '#64748b' }}>
                                    If you change the LWD, you must add comments below explaining the reason.
                                </small>
                            </>
                        )}

                        {/* Clearance Checklist */}
                        <div style={{ fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>
                            {role === 'admin' ? 'Admin Clearance Checklist' : 'HR Clearance Checklist'}
                        </div>

                        <div className="clearance-checklist-container">
                            {checklistToRender.map((item) => (
                                <div key={item.key} className="clearance-item-row">
                                    {role === 'admin' && item.key === 'laptopSerial' ? (
                                        <div className="clearance-content-group">
                                            <span className="clearance-item-label">{item.label}</span>
                                            <div className="clearance-input-wrapper">
                                                <input
                                                    id="laptopSerialCheckbox"
                                                    type="checkbox"
                                                    name="laptopSerialChecked"
                                                    checked={!!clearanceForm.laptopSerialChecked}
                                                    onChange={handleClearanceChange}
                                                    className="clearance-checkbox"
                                                />
                                                <input
                                                    type="text"
                                                    name="laptopSerial"
                                                    placeholder="Enter serial number"
                                                    value={clearanceForm.laptopSerial || ''}
                                                    onChange={handleClearanceChange}
                                                    required
                                                    className="clearance-comment-input"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="clearance-content-group">
                                            <span className="clearance-item-label">{item.label}</span>
                                            <div className="clearance-input-wrapper">
                                                <input
                                                    id={item.key}
                                                    type="checkbox"
                                                    name={item.key}
                                                    checked={!!clearanceForm[item.key]}
                                                    onChange={handleClearanceChange}
                                                    className="clearance-checkbox"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Add comment..."
                                                    name={`${item.key}_comment`}
                                                    value={clearanceForm[`${item.key}_comment`] || ''}
                                                    onChange={(e) =>
                                                        setClearanceForm((prev) => ({
                                                            ...prev,
                                                            [`${item.key}_comment`]: e.target.value,
                                                        }))
                                                    }
                                                    className="clearance-comment-input"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* --- Separate Document Upload Section for HR and Admin --- */}
                        {role === 'hr' && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <label className="exit-label">
                                    <FiUpload className="label-icon" />
                                    Upload HR Supporting Document(s):
                                </label>
                                {clearanceForm.hrDocumentPath && (
                                    <div style={{ fontSize: '0.75rem', color: '#14b8a6', marginBottom: '0.5rem' }}>
                                        <i className="bi bi-check-circle-fill"></i> Previous document already uploaded
                                    </div>
                                )}
                                <div
                                    className="file-upload-container"
                                    onClick={() => hrFileInputRef.current.click()}
                                    style={{
                                        border: '1.5px dashed #cbd5e1',
                                        borderRadius: '12px',
                                        padding: '1.25rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: '#f8fafc',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.backgroundColor = '#f0fdfa'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                >
                                    <input
                                        ref={hrFileInputRef}
                                        type="file"
                                        style={{ display: 'none' }}
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && !validateFileSize(file)) {
                                                alert("❌ HR supporting document must be less than 2 MB.");
                                                e.target.value = "";
                                                return;
                                            }
                                            setClearanceForm((prev) => ({
                                                ...prev,
                                                hrClearanceDocument: file,
                                            }));
                                        }}
                                    />
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        {clearanceForm.hrClearanceDocument ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0d9488', fontWeight: '600' }}>
                                                <FiCheckSquare style={{ fontSize: '1.1rem' }} />
                                                Selected: {clearanceForm.hrClearanceDocument.name}
                                            </div>
                                        ) : (
                                            <>
                                                <FiUpload style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#94a3b8' }} /><br />
                                                <span style={{ fontWeight: '500' }}>Click here</span> to choose a file or drag & drop
                                                <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: '0.7' }}>
                                                    PDF, JPG, PNG, DOC (Max 2MB)
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {role === 'admin' && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <label className="exit-label">
                                    <FiUpload className="label-icon" />
                                    Upload Admin Supporting Document(s):
                                </label>
                                {clearanceForm.adminDocumentPath && (
                                    <div style={{ fontSize: '0.75rem', color: '#14b8a6', marginBottom: '0.5rem' }}>
                                        <i className="bi bi-check-circle-fill"></i> Previous document already uploaded
                                    </div>
                                )}
                                <div
                                    className="file-upload-container"
                                    onClick={() => adminFileInputRef.current.click()}
                                    style={{
                                        border: '1.5px dashed #cbd5e1',
                                        borderRadius: '12px',
                                        padding: '1.25rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: '#f8fafc',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.backgroundColor = '#f0fdfa'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                >
                                    <input
                                        ref={adminFileInputRef}
                                        type="file"
                                        style={{ display: 'none' }}
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && !validateFileSize(file)) {
                                                alert("❌ Admin supporting document must be less than 2 MB.");
                                                e.target.value = "";
                                                return;
                                            }
                                            setClearanceForm((prev) => ({
                                                ...prev,
                                                adminClearanceDocument: file,
                                            }));
                                        }}
                                    />
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        {clearanceForm.adminClearanceDocument ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0d9488', fontWeight: '600' }}>
                                                <FiCheckSquare style={{ fontSize: '1.1rem' }} />
                                                Selected: {clearanceForm.adminClearanceDocument.name}
                                            </div>
                                        ) : (
                                            <>
                                                <FiUpload style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#94a3b8' }} /><br />
                                                <span style={{ fontWeight: '500' }}>Click here</span> to choose a file or drag & drop
                                                <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: '0.7' }}>
                                                    PDF, JPG, PNG, DOC (Max 2MB)
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- Separate Additional Comments for HR and Admin --- */}
                        {role === 'hr' && (
                            <>
                                <label className="exit-label">HR Additional Comments:</label>
                                <textarea
                                    name="hrAdditionalComments"
                                    value={clearanceForm.hrAdditionalComments || ''}
                                    onChange={handleClearanceChange}
                                    className="exit-textarea"
                                    placeholder="Any HR-specific notes or remarks..."
                                    maxLength={500}
                                />


                            </>
                        )}

                        {role === 'admin' && (
                            <>
                                <label className="exit-label">Admin Additional Comments:</label>
                                <textarea
                                    name="adminAdditionalComments"
                                    value={clearanceForm.adminAdditionalComments || ''}
                                    onChange={handleClearanceChange}
                                    className="exit-textarea"
                                    placeholder="Any Admin-specific notes or remarks... (max 500 characters)"
                                    maxLength={500}
                                />

                            </>
                        )}

                        <div className="exit-modal-actions">
                            <button
                                onClick={() => {
                                    setModalState(MODAL_NONE);
                                    setClearanceForm(getInitialClearanceForm()); // Reset form
                                }}
                                className="exit-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button onClick={() => submitClearanceForm(false)} className="exit-btn-save" style={{ backgroundColor: '#14B8A6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                                Save
                            </button>
                            <button onClick={() => submitClearanceForm(true)} className="exit-btn-initiate">
                                Final Clearance
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }



    // 3. Exit Interview Feedback Modal
    if (modalState === MODAL_EXIT_INTERVIEW_FEEDBACK && selectedTask) {
        return ReactDOM.createPortal(
            <div className="exit-modal-overlay">
                <div className="exit-modal-content">
                    <div className="exit-modal-header">
                        Exit Interview Feedback — {selectedTask.employeeName} ({getDisplayEmployeeId(selectedTask.employeeId)})
                    </div>

                    <div className="exit-modal-body">
                        {exitQuestions.length === 0 ? (
                            <p>Loading questions...</p>
                        ) : (
                            exitQuestions.map((q) => (
                                <div key={q.id} className="exit-form-group">
                                    <label className="exit-label"><strong>{q.label}</strong></label>

                                    {/* ⭐ RATING */}
                                    {q.type === "RATING" && (
                                        <input
                                            type="number"
                                            value={exitForm[String(q.id)] || ""}
                                            className="exit-input"
                                            readOnly
                                        />
                                    )}
                                    {/* ⭐ YES / NO */}
                                    {q.type === "YESNO" && (
                                        <input
                                            type="text"
                                            value={exitForm[String(q.id)] || "—"}
                                            className="exit-input"
                                            readOnly
                                        />
                                    )}

                                    {/* ⭐ TEXT (short answer) */}
                                    {q.type === "TEXT" && (
                                        <input
                                            type="text"
                                            value={exitForm[String(q.id)] || "—"}
                                            className="exit-input"
                                            readOnly
                                        />
                                    )}

                                    {/* ⭐ TEXTAREA (long answer) */}
                                    {q.type === "TEXTAREA" && (
                                        <textarea
                                            value={exitForm[String(q.id)] || ""}
                                            className="exit-textarea"
                                            readOnly
                                        />
                                    )}

                                    {/* ⭐ Fallback for unknown/empty type */}
                                    {!["TEXT", "TEXTAREA", "RATING", "YESNO"].includes(q.type) && (
                                        <input
                                            type="text"
                                            value={exitForm[String(q.id)] || "—"}
                                            className="exit-input"
                                            readOnly
                                        />
                                    )}

                                </div>
                            ))
                        )}

                        <div className="exit-modal-actions">
                            <button
                                onClick={() => {
                                    setModalState(MODAL_NONE);
                                    setExitForm(getInitialExitForm()); // Reset form
                                }}
                                className="exit-btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }


    // 4. Finance Settlement Modal
    if (modalState === MODAL_FINANCE_SETTLEMENT && selectedTask) {
        return ReactDOM.createPortal(
            <div className="exit-modal-overlay">
                <div className="exit-modal-content">
                    <div className="exit-modal-header" style={{ background: '#00b3a4', borderRadius: '8px 8px 0 0' }}>
                        Final Settlement for {selectedTask.employeeName}
                    </div>
                    <div className="exit-modal-body">
                        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#1e293b' }}>Clearance Summary</strong>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div><span style={{ color: '#64748b' }}>HR Cleared:</span> <span style={{ fontWeight: '600', color: selectedTask.hrCleared ? '#10b981' : '#ef4444' }}>{selectedTask.hrCleared ? 'Yes' : 'No'}</span></div>
                                <div><span style={{ color: '#64748b' }}>Admin Cleared:</span> <span style={{ fontWeight: '600', color: selectedTask.adminCleared ? '#10b981' : '#ef4444' }}>{selectedTask.adminCleared ? 'Yes' : 'No'}</span></div>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}><span style={{ color: '#64748b' }}>Laptop Serial:</span> <span style={{ fontWeight: '600' }}>{settlementForm.laptopSerial || '—'}</span></div>
                        </div>

                        <div className="exit-modal-actions">
                            <button onClick={() => {
                                setModalState(MODAL_NONE);
                                setSettlementForm(getInitialSettlementForm()); // Reset form
                            }} className="exit-btn-secondary">Cancel</button>
                            <button onClick={submitSettlementForm} className="exit-btn-settle">Submit Settlement</button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }




    if (modalState === MODAL_TASK_DETAILS && selectedTask) {
        const role = selectedTask.actingRole; // Current role context for this task
        const task = selectedTask;

        return (
            <>
                {ReactDOM.createPortal(
                    <div className="exit-modal-overlay">
                        <div className="exit-modal-content">
                            <div className="exit-modal-header" style={{ background: '#00b3a4', borderRadius: '8px 8px 0 0' }}>
                                Task Details - {task.employeeName}
                            </div>
                            <div className="exit-modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label className="exit-label">Employee ID</label>
                                        <div className="exit-form-value">{getDisplayEmployeeId(task.employeeId)}</div>
                                    </div>
                                    <div>
                                        <label className="exit-label">Employee Name</label>
                                        <div className="exit-form-value">{task.employeeName}</div>
                                    </div>
                                    <div>
                                        <label className="exit-label">Reason</label>
                                        <div className="exit-form-value">{task.reasonForExit}</div>
                                    </div>
                                    <div>
                                        <label className="exit-label">Last Working Day</label>
                                        <div className="exit-form-value">{formatDateToDDMMYYYY(task.lastWorkingDay)}</div>
                                    </div>
                                    <div>
                                        <label className="exit-label">Status</label>
                                        <div className="exit-form-value" style={{ fontWeight: 'bold', color: '#10b981' }}>{task.status}</div>
                                    </div>
                                    <div>
                                        <label className="exit-label">Document</label>
                                        <div className="exit-form-value">
                                            {task.documentName && task.documentName !== "No file uploaded" ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span
                                                        onClick={() => handleDownload(task.id, task.documentName)}
                                                        className="document-download-link"
                                                        title={`Download ${task.documentName}`}
                                                        style={{ cursor: 'pointer', color: '#14b8a6', textDecoration: 'underline', fontWeight: '600', fontSize: '0.9rem' }}
                                                    >
                                                        Download
                                                    </span>
                                                    <span
                                                        onClick={() => handleViewDocument(task.id, task.documentName)}
                                                        className="document-download-link"
                                                        title={`Preview ${task.documentName}`}
                                                        style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        Preview
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="no-document">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Section based on Acting Role */}
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                                    <label className="exit-label">Recommended Actions ({role})</label>

                                    {/* Manager & Reviewer Actions */}
                                    {(role === 'manager' || role === 'reviewer') && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {role === 'manager' && (
                                                <>
                                                    <label className="exit-label">
                                                        <strong>Edit Last Working Day (DD-MM-YYYY) — optional</strong>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder={
                                                            task.lastWorkingDay
                                                                ? new Date(task.lastWorkingDay)
                                                                    .toLocaleDateString('en-GB')
                                                                    .replace(/\//g, '-')
                                                                : 'DD-MM-YYYY'
                                                        }
                                                        value={task.editedLastWorkingDay || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setSelectedTask({ ...task, editedLastWorkingDay: val });
                                                            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, editedLastWorkingDay: val } : t));
                                                        }}
                                                        className="exit-input"
                                                        style={{ marginBottom: '10px' }}
                                                    />
                                                    <small style={{ display: 'block', marginBottom: '15px', color: '#64748b' }}>
                                                        If you change the LWD, you must add comments below explaining the reason.
                                                    </small>
                                                </>
                                            )}

                                            <textarea
                                                placeholder="Enter comment..."
                                                value={task.comment || ''}
                                                maxLength={500}
                                                onChange={(e) => {
                                                    // Local update for comment in modal (reflected in tasks via fetchTasks after action, 
                                                    // but here we need state update? Best to handle local state or update existing tasks)
                                                    // For simplicity, we update selectedTask and tasks
                                                    const val = e.target.value;
                                                    setSelectedTask({ ...task, comment: val });
                                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, comment: val, actingRole: t.actingRole } : t));
                                                }}
                                                className="exit-textarea"
                                            />
                                            <div className="exit-action-buttons">
                                                <button
                                                    onClick={async () => {
                                                        const success = await handleActionWithComment(task.id, 'approve', task.comment || '', role);
                                                        if (success) setModalState(MODAL_NONE);
                                                    }}
                                                    className="exit-btn-approve"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(task, role)}
                                                    className="exit-btn-reject"
                                                >
                                                    Reject
                                                </button>
                                                <button onClick={() => setModalState(MODAL_NONE)} className="exit-btn-secondary" style={{ marginLeft: 'auto' }}>Close</button>
                                            </div>
                                        </div>
                                    )}

                                    {role === 'hr' && (
                                        <div className="exit-action-buttons" style={{ flexWrap: 'wrap' }}>
                                            {task.status === "Approved by Manager and Reviewer" && (
                                                <>
                                                    <button onClick={() => {
                                                        handleActionWithComment(task.id, 'approve', task.comment || '', role);
                                                        setModalState(MODAL_NONE);
                                                    }} className="exit-btn-approve">Approve</button>
                                                    <button onClick={() => handleReject(task, role)} className="exit-btn-reject">Reject</button>
                                                </>
                                            )}

                                            {(task.status === "HR Approved" || task.status === "HR Cleared" || task.status === "Admin Cleared") && (
                                                <>
                                                    <button onClick={() => { setModalState(MODAL_EXIT_INTERVIEW_SCHEDULE) }} className="exit-btn-schedule">Schedule Interview</button>
                                                    <button onClick={() => { openFeedbackModal(task) }} className="exit-btn-feedback">Feedback</button>
                                                    <button onClick={() => { openClearanceForm(task) }} className="exit-btn-initiate">Initiate Clearance</button>
                                                </>
                                            )}
                                            <button onClick={() => setModalState(MODAL_NONE)} className="exit-btn-secondary" style={{ marginLeft: 'auto' }}>Close</button>
                                        </div>
                                    )}

                                    {role === 'admin' && (
                                        (task.status === "HR Approved" || task.status === "HR Cleared" || task.status === "Admin Cleared") && (
                                            <div className="exit-action-buttons">
                                                <button onClick={() => openClearanceForm(task)} className="exit-btn-initiate">Initiate Clearance</button>
                                                <button onClick={() => setModalState(MODAL_NONE)} className="exit-btn-secondary" style={{ marginLeft: 'auto' }}>Close</button>
                                            </div>
                                        )
                                    )}

                                    {role === 'finance' && task.status === 'Clearance Completed' && (
                                        <div className="exit-action-buttons">
                                            <button onClick={() => openFinanceSettlementForm(task)} className="exit-btn-settle">Final Settlement</button>
                                            <button onClick={() => handleReject(task, role)} className="exit-btn-reject">Reject</button>
                                            <button onClick={() => setModalState(MODAL_NONE)} className="exit-btn-secondary" style={{ marginLeft: 'auto' }}>Close</button>
                                        </div>
                                    )}

                                    {/* Fallback Close for roles/statuses with no action buttons */}
                                    {!(
                                        (role === 'manager' || role === 'reviewer') ||
                                        role === 'hr' ||
                                        (role === 'admin' && (task.status === "HR Approved" || task.status === "HR Cleared" || task.status === "Admin Cleared")) ||
                                        (role === 'finance' && task.status === 'Clearance Completed')
                                    ) && (
                                            <div className="exit-action-buttons">
                                                <button onClick={() => setModalState(MODAL_NONE)} className="exit-btn-secondary" style={{ marginLeft: 'auto' }}>Close</button>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
                {previewModal}
            </>
        );
    }

    return (
        <div className="myteam-container" style={{ marginTop: "0px" }}>



            {/* <div className="view-as-wrapper"> ... REMOVED ... </div> */}




            {loading && <p>Loading tasks...</p>}
            {error && (
                <p style={{ color: 'red' }}>
                    {typeof error === 'object' ? JSON.stringify(error) : error}
                </p>
            )}

            {!loading && !error && (
                <div className="tasks-table-wrapper" style={{ marginTop: "-2px", overflowX: "auto" }}>
                    <table className="tasks-main-table">
                        <thead>
                            <tr>
                                <th style={{ background: '#629af1', color: 'white', textAlign: 'center' }}>Employee ID</th>
                                <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '160px' }}>Employee Name</th>
                                <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '140px' }}>Reason</th>
                                <th style={{ background: '#629af1', color: 'white', textAlign: 'center' }}>LWD</th>
                                <th style={{ background: '#629af1', color: 'white', textAlign: 'center' }}>Status</th>
                                <th style={{ background: '#629af1', color: 'white', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tasks.length > 0 ? (
                                tasks.map(task => (
                                    <tr key={task.id} style={{ borderBottom: '1px solid #ddd', color: '#334155' }}>
                                        <td style={{ color: '#334155' }}>{getDisplayEmployeeId(task.employeeId)}</td>
                                        <td className="employee-name-cell" style={{ color: '#334155' }}>
                                            {task.employeeName}
                                        </td>
                                        <td style={{ color: '#334155' }}>{task.reasonForExit}</td>
                                        <td style={{ color: '#334155' }}>{formatDateToDDMMYYYY(task.lastWorkingDay)}</td>
                                        <td className="status-cell" style={{ color: '#334155' }}>{task.status}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div
                                                className="view-action-btn"
                                                onClick={() => {
                                                    const formattedLWD = task.lastWorkingDay
                                                        ? new Date(task.lastWorkingDay).toLocaleDateString('en-GB').replace(/\//g, '-')
                                                        : '';
                                                    setSelectedTask({
                                                        ...task,
                                                        comment: task.comment || '',
                                                        editedLastWorkingDay: formattedLWD
                                                    });
                                                    setModalState(MODAL_TASK_DETAILS);
                                                }}
                                            >
                                                <FiEye size={16} style={{ flexShrink: 0 }} />
                                                View
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                                        No pending tasks found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}


        </div >

    );



}


export default MyTeamRes;
