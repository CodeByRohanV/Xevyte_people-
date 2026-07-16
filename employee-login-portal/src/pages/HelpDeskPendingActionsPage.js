import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
// Assuming api is an axios-like instance configured for your backend
import api from "../api";
import { formatDateTimeToIST } from "../utils/DateUtils";
import HelpDeskPreviewModal from "./HelpDeskPreviewModal";
import { FiEye } from 'react-icons/fi';

/* -------------------- STYLES -------------------- */
// Define the styles object once for all components

// Local formatDate removed in favor of DateUtils.formatDateTimeToIST
const styles = {
    container: {
        padding: "0px",
        marginTop: "0px",
    },
    title: {
        color: "#1e3a8a",
        marginBottom: "20px",
    },

    // ⭐ NEW: Scroll container for the table (Requirement 1)
    tableScrollContainer: {
        maxHeight: 'calc(100vh - 150px)',
        overflowY: 'auto',
        // 🌟 MODIFIED FOR HORIZONTAL SCROLL
        overflowX: 'auto',
        marginTop: "0px",
        borderRadius: "0",
        boxShadow: "none",
        backgroundColor: "transparent",
    },

    table: {
        // 🌟 ADDED MIN-WIDTH TO ENABLE HORIZONTAL SCROLL ON SMALL SCREENS
        minWidth: '700px',
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: "0",
        // Note: The table itself should not have overflow: hidden if it's inside the scroll container
    },
    th: {
        backgroundColor: "#629AF1",
        color: "white",
        padding: "0.8rem 1rem",
        textAlign: "left",
        fontWeight: "700",
        fontSize: "12px",
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: "none",
        borderRadius: "0",
    },
    td: {
        padding: "12px 18px",
        borderBottom: "1px solid #eee",
        fontSize: "14px",
        color: "#334155",
        // ⭐ NEW: Enforce wrapping for table cells (Requirement 2)
        whiteSpace: "normal",
        wordBreak: "break-word",
        // Applying a max-width specifically to the Summary column's td will be done inline
    },
    // Removed trHover as inline pseudo-selectors are not supported
    viewButton: {
        width: "100px",
        height: "32px",
        lineHeight: "32px",
        textAlign: "center",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        color: "white",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "12px",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 6px rgba(59, 130, 246, 0.2)",
        margin: "auto",
        userSelect: "none",
    },

    /* Modal Styles */
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },
    modal: {
        background: "white",
        padding: "30px",
        width: "90%",
        maxWidth: "700px",
        borderRadius: "10px",
        position: "relative",
        boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
        // ⭐ NEW: Added scrolling for modal content (Requirement 3)
        maxHeight: '90vh',
        overflowY: 'auto',
    },

    closeIcon: {
        position: "absolute",
        top: "15px",
        right: "15px",
        fontSize: "24px",
        cursor: "pointer",
        color: "#888",
        fontWeight: "bold",
        transition: "color 0.2s",
    },
    modalDetail: {
        marginBottom: "10px",
        fontSize: "16px",
        lineHeight: "1.5",
    },
    modalDescription: {
        // ⭐ NEW: Used contentWrap for better, consistent wrapping (Requirement 4)
        ...{
            whiteSpace: "pre-wrap", // Preserve formatting and allow wrapping
            wordBreak: "break-word",
        },
        backgroundColor: "#f9f9f9",
        padding: "10px",
        borderRadius: "5px",
        borderLeft: "3px solid #007bff",
    },
    // ⭐ NEW: Dedicated style for modal content wrapping (Requirement 4)
    contentWrap: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },

    /* Badges */
    assignedBadge: {
        backgroundColor: "#28a745",
        color: "white",
        padding: "4px 10px",
        borderRadius: "12px",
        fontWeight: "600",
        fontSize: "12px",
        display: "inline-block",
    },
    notAssignedBadge: {
        backgroundColor: "#dc3545",
        color: "white",
        padding: "4px 10px",
        borderRadius: "12px",
        fontWeight: "600",
        fontSize: "12px",
        display: "inline-block",
    },

    /* Premium Reject Popup Styles */
    reasonPopupOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 3000,
    },
    reasonPopup: {
        background: "#ffffff",
        padding: "0",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
    },
    reasonPopupHeader: {
        padding: "1.5rem 2rem",
        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        color: "white",
    },
    reasonPopupHeaderTitle: {
        margin: "0",
        fontSize: "1.25rem",
        fontWeight: "700",
        color: "white",
    },
    reasonPopupBody: {
        padding: "2rem",
    },
    modernTextarea: {
        width: "100%",
        padding: "0.75rem",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        resize: "none",
        fontSize: "1rem",
        marginBottom: "0.5rem",
        fontFamily: "inherit",
        boxSizing: "border-box",
    },
    popupActions: {
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
        marginTop: "1.5rem",
    },
    bulkApproveBtn: {
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        color: "white",
        border: "none",
        padding: "12px 24px",
        borderRadius: "12px",
        fontWeight: "700",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 8px 15px -3px rgba(59, 130, 246, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
    },
    bulkRejectBtn: {
        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        color: "white",
        border: "none",
        padding: "12px 24px",
        borderRadius: "12px",
        fontWeight: "700",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 8px 15px -3px rgba(239, 68, 68, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
    },
};

/* ---------------- Timeline (Not changed) ---------------- */

const statusSteps = ["OPEN", "IN_PROGRESS", "RESOLVED"];

function renderTimeline(currentStatus, isMobile) {
    const currentIndex = statusSteps.indexOf(currentStatus);
    return (
        <div className="status-timeline-wrapper" style={{
            width: '100%',
            marginBottom: isMobile ? '15px' : '30px',
            padding: isMobile ? '0 5px' : '0 10px'
        }}>
            <style>
                {`
          .timeline-container-mob {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            width: 100% !important;
            position: relative !important;
            padding: ${isMobile ? '15px 0 10px 0' : '10px 0'} !important;
            border-bottom: ${isMobile ? '1px solid #eee' : 'none'} !important;
          }
          .timeline-step-mob {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            position: relative !important;
            z-index: 2 !important;
            min-width: 0 !important;
          }
          .timeline-line-mob {
            position: absolute !important;
            top: ${isMobile ? '7px' : '9px'} !important;
            left: 50% !important;
            width: 100% !important;
            height: 2px !important;
            z-index: 1 !important;
          }
        `}
            </style>
            <div className="timeline-container-mob">
                {statusSteps.map((step, index) => {
                    const isActive = index <= currentIndex;
                    const isCompleted = index < currentIndex;
                    const isLast = index === statusSteps.length - 1;

                    return (
                        <div key={step} className="timeline-step-mob">
                            {!isLast && (
                                <div
                                    className="timeline-line-mob"
                                    style={{ backgroundColor: isCompleted ? "#3b82f6" : "#ccc" }}
                                />
                            )}
                            <div style={{
                                width: isMobile ? 14 : 20,
                                height: isMobile ? 14 : 20,
                                borderRadius: "50%",
                                backgroundColor: isActive ? "#3b82f6" : "#ccc",
                                zIndex: 10,
                                position: 'relative',
                                border: isMobile && isActive ? '2px solid #fff' : 'none',
                                boxShadow: isMobile && isActive ? '0 0 0 2px #3b82f6' : 'none',
                                transition: "background-color 0.3s"
                            }} />
                            <div style={{
                                fontSize: isMobile ? '9px' : '12px',
                                fontWeight: "600",
                                color: isActive ? "#333" : "#999",
                                marginTop: "8px",
                                textAlign: "center",
                                whiteSpace: isMobile ? "normal" : "nowrap",
                                wordBreak: isMobile ? "break-word" : "normal",
                                lineHeight: isMobile ? "1.2" : "normal",
                                width: "100%",
                                padding: isMobile ? "0 2px" : "0"
                            }}>
                                {step.replace("_", " ")}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


/* ---------------- PAGE COMPONENT ---------------- */

const HelpDeskPendingActionsPage = () => {
    const getDisplayEmployeeId = (id) => {
        if (!id) return "";
        if (id.includes('_')) return id.split('_').pop();
        if (id.includes('-')) return id.split('-').pop();
        return id;
    };
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [tickets, setTickets] = useState([]);

    const [selectedTicket, setSelectedTicket] = useState(null);

    /* ---------------- PREVIEW MODAL STATE ---------------- */
    const [previewFile, setPreviewFile] = useState(null);
    const [fileType, setFileType] = useState("");
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const handleViewDocument = async (ticketId, fileName) => {
        try {
            const response = await api.get(`/tickets/download/${ticketId}`, {
                responseType: 'arraybuffer',
                headers: { Authorization: `Bearer ${token}` }
            });

            const fileExtension = fileName.split('.').pop().toLowerCase();
            let blob;
            if (fileExtension === 'pdf') {
                blob = new Blob([response.data], { type: 'application/pdf' });
            } else {
                blob = new Blob([response.data]);
            }

            const fileUrl = URL.createObjectURL(blob);

            setFileType(fileExtension === 'pdf' ? 'pdf' : 'image');
            setPreviewFile(fileUrl);
            setIsPreviewModalOpen(true);

        } catch (err) {
            console.error("Error viewing document:", err);
            alert('Failed to load document for preview.');
        }
    };

    const handleClosePreviewModal = () => {
        if (previewFile) {
            URL.revokeObjectURL(previewFile);
        }
        setIsPreviewModalOpen(false);
        setPreviewFile(null);
        setFileType("");
    };


    // Retrieve auth data from session storage
    const token = sessionStorage.getItem("token");
    const loggedInEmployee = sessionStorage.getItem("employeeId");

    /* ---- FETCH MANAGER APPROVAL TICKETS ---- */
    const fetchAllTickets = useCallback(async () => {
        if (!loggedInEmployee || !token) {
            console.error("Authentication data missing.");
            return;
        }
        try {
            const res = await api.get(`/tickets/manager/${loggedInEmployee}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTickets(res.data);
        } catch (err) {
            console.error("Error loading tickets", err);
        }
    }, [token, loggedInEmployee]);

    useEffect(() => {
        fetchAllTickets();
        const interval = setInterval(fetchAllTickets, 5000); // Polling every 5 seconds
        return () => clearInterval(interval);
    }, [fetchAllTickets]);

    /* ---- File Download ---- */
    const downloadFile = async (ticketId, fileName) => {
        try {
            const response = await api.get(`/tickets/download/${ticketId}`, {
                responseType: "blob",
                headers: { Authorization: `Bearer ${token}` },
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Clean up
        } catch (error) {
            alert("Failed to download file.");
        }
    };

    /* ---- Approve Ticket ---- */
    const handleApprove = async (ticketId) => {
        if (!window.confirm(`Are you sure you want to APPROVE Ticket #${ticketId}?`)) return;

        try {
            await api.put(
                `/tickets/manager/approve/${ticketId}`,
                {},
                { headers: { Authorization: `Bearer ${token}`, employeeId: loggedInEmployee } }
            );

            alert("Ticket Approved successfully!");
            setSelectedTicket(null);
            fetchAllTickets();
        } catch (err) {
            alert("Failed to approve ticket. Please try again.");
        }
    };

    /* ---- Reject Ticket ---- */
    const handleReject = async (ticketId) => {
        let reason = prompt("Enter rejection reason (10-100 characters):");
        if (reason === null) return; // user cancelled prompt

        const trimmedReason = reason.trim();
        if (trimmedReason.length < 10 || trimmedReason.length > 100) {
            alert("Rejection reason must be between 10 and 100 characters long.");
            return;
        }

        try {
            await api.put(
                `/tickets/manager/reject/${ticketId}?reason=${encodeURIComponent(
                    trimmedReason
                )}`,
                {},
                { headers: { Authorization: `Bearer ${token}`, employeeId: loggedInEmployee } }
            );

            alert("Ticket Rejected successfully!");
            setSelectedTicket(null);
            fetchAllTickets();
        } catch (err) {
            alert("Failed to reject ticket. Please try again.");
        }
    };

    /* ---- Resend Ticket ---- */
    const handleResend = async (ticketId) => {
        let reason = prompt("Enter resend reason (10-100 characters):");
        if (reason === null) return; // user cancelled prompt

        const trimmedReason = reason.trim();
        if (trimmedReason.length < 10 || trimmedReason.length > 100) {
            alert("Resend reason must be between 10 and 100 characters.");
            return;
        }

        try {
            await api.put(
                `/tickets/resend/${ticketId}?reason=${encodeURIComponent(
                    trimmedReason
                )}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        employeeId: loggedInEmployee
                    }
                }
            );

            alert("Ticket marked for Resend successfully!");
            setSelectedTicket(null);
            fetchAllTickets();
        } catch (err) {
            alert("Failed to request resend. Please try again.");
        }
    };

    /* ---- Assign Ticket (For Team Tickets) ---- */
    const handleAssignToMe = async (ticketId) => {
        if (!window.confirm(`Assign Ticket #${ticketId} to yourself?`)) return;
        try {
            await api.put(`/tickets/assign/${ticketId}/${loggedInEmployee}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Ticket assigned to you successfully!");
            setSelectedTicket(null);
            fetchAllTickets();
        } catch (err) {
            alert("Failed to assign ticket.");
        }
    };

    /* ---- Resolve Ticket (For Team Tickets) ---- */
    const handleResolve = async (ticketId) => {
        if (!window.confirm(`Mark Ticket #${ticketId} as RESOLVED?`)) return;
        try {
            await api.put(`/tickets/resolve/${ticketId}`, {}, {
                headers: { Authorization: `Bearer ${token}`, employeeId: loggedInEmployee }
            });
            alert("Ticket resolved successfully!");
            setSelectedTicket(null);
            fetchAllTickets();
        } catch (err) {
            alert("Failed to resolve ticket.");
        }
    };

    return (
        <div style={styles.container}>


            <div style={{
                ...styles.tableScrollContainer,
                maxHeight: 'calc(100vh - 150px)',
                marginTop: "0px",
                overflowX: 'auto',
                boxShadow: isMobileView ? 'none' : styles.tableScrollContainer.boxShadow
            }}>
                <table style={{ ...styles.table, minWidth: isMobileView ? '600px' : '700px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, textAlign: 'center', width: '120px' }}>Employee ID</th>
                            <th style={{ ...styles.th, textAlign: 'center', width: '200px' }}>Employee Name</th>
                            <th style={{ ...styles.th, textAlign: 'center', width: '100px' }}>Category</th>
                            <th style={{ ...styles.th, textAlign: 'center', width: '150px' }}>Summary</th>
                            <th style={{ ...styles.th, textAlign: 'center', width: '120px' }}>Status</th>
                            <th style={{ ...styles.th, textAlign: 'center', width: '100px' }}>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: isMobileView ? '12px' : '14px' }}>
                                    No tickets awaiting your action.
                                </td>
                            </tr>
                        ) : (
                            tickets.map((t) => (
                                <tr key={t.id}>
                                    {/* <td style={{ ...styles.td, padding: isMobileView ? '8px 10px' : '12px 18px', fontSize: isMobileView ? '11px' : '14px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{t.id}</div>
                                    </td> */}
                                    <td style={{ ...styles.td, padding: isMobileView ? '8px 10px' : '12px 18px', fontSize: isMobileView ? '11px' : '14px' }}>{getDisplayEmployeeId(t.employeeId)}</td>
                                    <td style={{ ...styles.td, padding: isMobileView ? '8px 10px' : '12px 18px', fontSize: isMobileView ? '11px' : '14px' }}>{t.employeeName}</td>
                                    <td style={{ ...styles.td, padding: isMobileView ? '8px 10px' : '12px 18px', fontSize: isMobileView ? '11px' : '14px' }}>{t.category}</td>
                                    <td style={{ ...styles.td, padding: isMobileView ? '8px 10px' : '12px 18px', fontSize: isMobileView ? '11px' : '14px', maxWidth: '200px' }}>
                                        <div style={{ fontWeight: '500' }}>{t.issueSummary}</div>
                                        {t.assignedTo && <div style={{ fontSize: '10px', color: '#3b82f6' }}>Assigned: {getDisplayEmployeeId(t.assignedTo)}</div>}
                                    </td>
                                    <td style={{ ...styles.td, padding: isMobileView ? '8px 10px' : '12px 18px', fontSize: isMobileView ? '11px' : '14px', color: 'black' }}>
                                        {t.status}
                                    </td>
                                    <td className="view-action-cell" style={{ ...styles.td, padding: isMobileView ? '8px 10px' : '12px 18px', fontSize: isMobileView ? '11px' : '14px' }}>
                                        <div
                                            className="view-action-btn"
                                            onClick={() => setSelectedTicket(t)}
                                        >
                                            <FiEye size={16} style={{ flexShrink: 0 }} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ------------------------------------- */}
            {/* ---------- VIEW/ACTION MODAL ---------- */}
            {/* ------------------------------------- */}
            {selectedTicket && ReactDOM.createPortal(
                <div style={styles.modalOverlay}>
                    {/* ⭐ USED: The modal now has vertical scrolling (Requirement 3) */}
                    <div style={{ ...styles.modal, padding: isMobileView ? '15px' : '30px' }}>
                        {/* X Close Icon */}
                        <div
                            style={styles.closeIcon}
                            onClick={() => setSelectedTicket(null)}
                            title="Close"
                        >
                            ✖
                        </div>

                        <h3 style={{ color: "#1e3a8a", borderBottom: "2px solid #eee", paddingBottom: "10px", fontSize: isMobileView ? '16px' : '20px' }}>
                            Ticket ID : {selectedTicket.id}
                        </h3>

                        {/* Status Timeline */}
                        <p style={{ fontSize: isMobileView ? "12px" : "14px", color: "#3b82f6", marginBottom: "5px", fontWeight: "700" }}>Status Timeline:</p>
                        {renderTimeline(selectedTicket.status, isMobileView)}

                        <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '16px' }}><b>Employee ID:</b> {getDisplayEmployeeId(selectedTicket.employeeId)}</p>
                        <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '16px' }}><b>Employee Name:</b> {selectedTicket.employeeName}</p>
                        <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '16px' }}>
                            <b>Created On:</b> {formatDateTimeToIST(selectedTicket.createdAt)}
                        </p>
                        <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '16px' }}><b>Category:</b> {selectedTicket.category}</p>
                        <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '16px' }}><b>Subcategory:</b> {selectedTicket.subcategory}</p>




                        <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '16px' }}><b>Current Status:</b> {selectedTicket.status}</p>

                        {/* ⭐ NEW: SHOW REASSIGN DETAILS IF PRESENT */}
                        {selectedTicket.reassignReason && (
                            <div style={{
                                marginTop: "10px",
                                padding: "10px",
                                backgroundColor: "#fff7ed", // Light orange background
                                border: "1px solid #ffedd5",
                                borderRadius: "6px"
                            }}>
                                <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '15px', color: "#c2410c", marginBottom: "5px" }}>
                                    <b>🔄 Reassigned By:</b> {getDisplayEmployeeId(selectedTicket.reassignedBy) || "Unknown"}
                                </p>
                                <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '15px', color: "#ea580c" }}>
                                    <b>Reason:</b> {selectedTicket.reassignReason}
                                </p>
                            </div>
                        )}

                        {/* ⭐ NEW: SHOW TRANSFER DETAILS IF PRESENT */}
                        {selectedTicket.transferReason && (
                            <div style={{
                                marginTop: "10px",
                                padding: "10px",
                                backgroundColor: "#f0f9ff", // Light blue background
                                border: "1px solid #e0f2fe",
                                borderRadius: "6px"
                            }}>
                                <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '15px', color: "#0369a1", marginBottom: "5px" }}>
                                    <b>➡️ Transferred By:</b> {getDisplayEmployeeId(selectedTicket.transferredBy) || "Unknown"}
                                </p>
                                <p style={{ ...styles.modalDetail, fontSize: isMobileView ? '12px' : '15px', color: "#0284c7" }}>
                                    <b>Reason:</b> {selectedTicket.transferReason}
                                </p>
                            </div>
                        )}

                        <h4 style={{ marginTop: "15px", color: "#555", fontSize: isMobileView ? '13px' : '16px' }}>Summary:</h4>
                        {/* ⭐ APPLIED: Content wrap for summary (Requirement 4) */}
                        <p style={{ ...styles.modalDetail, ...styles.contentWrap, fontSize: isMobileView ? '11px' : '16px' }}>{selectedTicket.issueSummary}</p>

                        <h4 style={{ marginTop: "15px", color: "#555", fontSize: isMobileView ? '13px' : '16px' }}>Detailed Description:</h4>
                        {/* ⭐ APPLIED: styles.modalDescription now uses contentWrap (Requirement 4) */}
                        <div style={{ ...styles.modalDescription, fontSize: isMobileView ? '11px' : '14px' }}>
                            {selectedTicket.detailedDescription}
                        </div>


                        {/* Attachment Section */}
                        {selectedTicket.attachmentFileName ? (
                            <div style={{ ...styles.modalDetail, marginTop: "15px", fontSize: isMobileView ? "12px" : "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <b>Attachment:</b>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <button
                                        onClick={() => downloadFile(selectedTicket.id, selectedTicket.attachmentFileName)}
                                        style={{
                                            cursor: "pointer",
                                            color: "#3b82f6",
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            fontWeight: "700",
                                            fontSize: isMobileView ? "11px" : "13px",
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleViewDocument(selectedTicket.id, selectedTicket.attachmentFileName)}
                                        style={{
                                            cursor: "pointer",
                                            color: "#3b82f6",
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            fontWeight: "700",
                                            fontSize: isMobileView ? "11px" : "13px",
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Preview
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p style={{ ...styles.modalDetail, marginTop: "15px", fontSize: isMobileView ? '12px' : '16px' }}><b>Attachment:</b> No File</p>
                        )}

                        {/* ---------- ACTION BUTTONS ---------- */}
                        <div style={{ marginTop: "30px", paddingTop: "15px", borderTop: "1px solid #eee", textAlign: "right" }}>
                            {selectedTicket.status === "PENDING_MANAGER" && (
                                <>
                                    <button
                                        style={{
                                            padding: isMobileView ? "8px 15px" : "12px 25px",
                                            background: "#28a745",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            marginRight: isMobileView ? "8px" : "15px",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            fontSize: isMobileView ? "11px" : "14px"
                                        }}
                                        onClick={() => handleApprove(selectedTicket.id)}
                                    >
                                        {isMobileView ? "Approve" : "✅ Approve"}
                                    </button>

                                    <button
                                        style={{
                                            padding: isMobileView ? "8px 15px" : "12px 25px",
                                            background: "#dc3545",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            marginRight: isMobileView ? "8px" : "15px",
                                            fontSize: isMobileView ? "11px" : "14px"
                                        }}
                                        onClick={() => handleReject(selectedTicket.id)}
                                    >
                                        {isMobileView ? "Reject" : "❌ Reject"}
                                    </button>
                                </>
                            )}

                            {selectedTicket.status !== "PENDING_MANAGER" && !selectedTicket.assignedTo && (
                                <button
                                    style={{
                                        padding: isMobileView ? "8px 15px" : "12px 25px",
                                        background: "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        marginRight: isMobileView ? "8px" : "15px",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        fontSize: isMobileView ? "11px" : "14px"
                                    }}
                                    onClick={() => handleAssignToMe(selectedTicket.id)}
                                >
                                    Assign To Me
                                </button>
                            )}

                            {selectedTicket.assignedTo === loggedInEmployee && selectedTicket.status !== "RESOLVED" && (
                                <button
                                    style={{
                                        padding: isMobileView ? "8px 15px" : "12px 25px",
                                        background: "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        marginRight: isMobileView ? "8px" : "15px",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        fontSize: isMobileView ? "11px" : "14px"
                                    }}
                                    onClick={() => handleResolve(selectedTicket.id)}
                                >
                                    Resolve
                                </button>
                            )}

                            <button
                                style={{
                                    padding: isMobileView ? "8px 15px" : "12px 25px",
                                    background: "#f39c12",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: isMobileView ? "11px" : "14px"
                                }}
                                onClick={() => handleResend(selectedTicket.id)}
                            >
                                {isMobileView ? "Resend" : "🔄 Resend"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* PREVIEW MODAL */}
            <HelpDeskPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={handleClosePreviewModal}
                fileUrl={previewFile}
                fileType={fileType}
                fileName={selectedTicket ? selectedTicket.attachmentFileName : ""}
            />




        </div>
    );
};

export default HelpDeskPendingActionsPage;