import React, { useEffect, useState, useCallback } from "react";
import { formatDateTimeToIST } from "../utils/DateUtils";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { RefreshCcw, Eye, XCircle } from "lucide-react";
import HelpDeskPreviewModal from "./HelpDeskPreviewModal";


/* -------------------- INLINE CSS STYLES -------------------- */

// Define styles outside the component to avoid re-creation on every every render
const styles = {
  // ⭐ NEW: Container for the Table to control vertical scrolling
  tableScrollContainer: {
    maxHeight: 'calc(100vh - 300px)', // Requested vertical height restriction
    overflowY: 'auto', // Vertical scroll
    overflowX: 'hidden', // Prevent horizontal scroll on the container itself
    marginTop: "0",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    backgroundColor: "#F5F7FA",
    width: "100%",
    boxSizing: "border-box",
  },

  header: {
    fontSize: "26px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "20px",
    borderBottom: "2px solid #ddd",
    paddingBottom: "10px",
  },
  title: {
    fontSize: "24px",
    marginBottom: "20px",
    color: "#333",
  },
  // --- Table Styles ---
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    backgroundColor: "#F5F7FA",
  },
  th: {
    backgroundColor: "#629AF1",
    color: "white",
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: "700",
    fontSize: "14px",
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: "2px solid #3b82f6",
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    color: "#555",
    // Enforce wrapping and restrict width for readability
    whiteSpace: "normal",
    wordBreak: "break-word",
    maxWidth: "180px",
  },
  viewButton: {
    width: "80px",
    justifyContent: "center",
    padding: "6px 0",
    backgroundColor: "transparent",
    color: "#00B3A4",
    border: "1.5px solid #00B3A4",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.3s ease",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  // --- Status Badges ---
  statusBadge: (status, isMobile) => {
    let color;
    switch (status) {
      case "OPEN":
        color = "#3b82f6";
        break;
      case "IN_PROGRESS":
        color = "#2563eb";
        break;
      case "RESOLVED":
        color = "#10b981";
        break;
      default:
        color = "#6c757d";
    }
    return {
      color: color,
      fontWeight: "600",
      textTransform: "uppercase",
      display: "inline-block",
    };
  },
  resendRequiredBadge: {
    color: "#f39c12",
    fontWeight: "700",
    textTransform: "uppercase",
    display: "inline-block",
  },
  // --- Modal Styles ---
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modal: {
    background: "white",
    padding: "30px",
    width: "90%",
    maxWidth: "600px",
    borderRadius: "10px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    // Added scrolling for content within the modal itself
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalDetail: {
    marginBottom: "8px",
    fontSize: "15px",
    lineHeight: "1.4",
  },
  closeButton: {
    marginTop: "25px",
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "600",
    float: "right",
    marginLeft: "10px",
  },
  reopenButton: {
    marginTop: "25px",
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "600",
    float: "right",
  },
  // --- Timeline Styles (No changes needed) ---
  timelineContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    padding: "10px 0",
  },
  timelineStep: (isActive) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    flex: 1, // Distribute space evenly
  }),
  timelineCircle: (isActive) => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    backgroundColor: isActive ? "#3b82f6" : "#ccc",
    transition: "background-color 0.3s",
    zIndex: 10,
    marginBottom: "5px",
  }),
  timelineLine: (isCompleted) => ({
    position: "absolute",
    top: 9,
    left: "50%",
    width: "100%",
    height: 2,
    backgroundColor: isCompleted ? "#3b82f6" : "#ccc",
    transform: "translateX(-50%)",
    zIndex: 5,
  }),
  timelineLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#666",
    marginTop: "5px",
    textAlign: "center",
  },

  assignedBadge: {
    color: "#000000",
    fontWeight: "normal",
    display: "inline-block",
  },
  notAssignedBadge: {
    display: "inline-block",
  },


  ticketTypeBadge: (isChangeRequest, isMobile) => ({
    color: "#000000",
    fontWeight: "normal",
    whiteSpace: "nowrap",
    display: "inline-block",
  }),

  // Specific styles for content wrapping in the modal
  contentWrap: {
    whiteSpace: 'pre-wrap', // Preserve pre-formatting and allow wrapping
    wordBreak: 'break-word',
  },
  textAreaStyle: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    resize: 'vertical',
    boxSizing: 'border-box',
    marginTop: '5px',
    minHeight: '80px',
  },
  actionButton: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    margin: "0 5px",
    cursor: "pointer",
    fontWeight: "600",
  },
  resendButton: {
    width: "80px",
    justifyContent: "center",
    padding: "6px 0",
    backgroundColor: "transparent",
    color: "#00B3A4",
    border: "1.5px solid #00B3A4",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    textTransform: "none",
  },
  cancelButton: {
    padding: "6px 12px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    marginLeft: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  reopenButton: {
    padding: "6px 12px",
    backgroundColor: "#10b981", // Professional Green
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
};

// Helper to check if a ticket is in a state that can be cancelled
const isCancellable = (status) => {
  const finalStates = ['RESOLVED', 'CLOSED', 'REJECTED', 'CANCELLED'];
  return !finalStates.includes(status);
};

/* -------------------- STATUS TIMELINE RENDER -------------------- */
const statusSteps = ["OPEN", "IN_PROGRESS", "RESOLVED"];

function renderTimeline(currentStatus, isMobile) {
  const currentStepIndex = statusSteps.indexOf(currentStatus);

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
        {statusSteps.map((status, index) => {
          const isActive = index <= currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isLast = index === statusSteps.length - 1;

          return (
            <div key={status} className="timeline-step-mob">
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
                {status.replace("_", " ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- MAIN COMPONENT -------------------- */
const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

// Helper to clean up any embedded tenant-prefixed IDs in name strings
const cleanEmbeddedIds = (str) => {
  if (!str) return str;
  return str.replace(/\b([a-zA-Z0-9]+)(_|-)([a-zA-Z0-9]+)\b/g, (match, p1, p2, p3) => p3);
};

// ✅ Reformats approver display strings to ensure consistent spacing for "(on behalf of)"
const formatApproverDisplay = (approverName) => {
    if (!approverName) return null;

    let formattedName = cleanEmbeddedIds(approverName);

    // Fix spacing if there is no space before (on behalf of
    if (formattedName.includes(')(on behalf of')) {
        formattedName = formattedName.replace(')(on behalf of', ') (on behalf of');
    } else if (formattedName.includes('(on behalf of') && !formattedName.includes(' (on behalf of')) {
        formattedName = formattedName.replace('(on behalf of', ' (on behalf of');
    }

    return formattedName;
};

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const HelpDeskMyTicketsDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const employeeId = sessionStorage.getItem("employeeId");
  const token = sessionStorage.getItem("token");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusDetails, setStatusDetails] = useState(null);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [editedTicket, setEditedTicket] = useState({
    attachment: null
  });

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

  const handleResubmit = (ticket) => {
    if (ticket.ticketType === "CHANGE_REQUEST") {
      navigate("/HelpDesk", { state: { activeTab: "changeRequest", resubmitTicket: ticket } });
    } else {
      navigate("/HelpDesk", { state: { activeTab: "create", resubmitTicket: ticket } });
    }
  };


  const fetchTickets = useCallback(async () => {
    if (!employeeId || !token) {
      console.warn("Employee ID or token not found.");
      return;
    }
    try {
      const res = await api.get(`/tickets/my-tickets/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter out drafts from the dashboard
      const nonDraftTickets = res.data.filter(ticket => ticket.status !== 'DRAFT');
      setTickets(nonDraftTickets);
    } catch (err) {
      console.error("Error loading tickets:", err);
      alert("Failed to fetch your tickets.");
    }
  }, [employeeId, token]);

  const downloadFile = async (ticketId, fileName) => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get(`/tickets/download/${ticketId}`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Create a URL and force download
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error("File download error:", error);
      alert("Failed to download the file.");
    }
  };


  // Initial data fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ---------------- TICKET ACTION HANDLERS ----------------
  /* ---- REOPEN TICKET ---- */
  const handleReopen = async (ticketId) => {
    const reason = prompt("Enter reason for reopening (min 5 characters):");
    if (reason === null) return;

    if (reason.trim().length < 5) {
      alert("Please enter a valid reason (min 5 chars)");
      return;
    }

    try {
      await api.put(
        `/tickets/reopen/${ticketId}`,
        { reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Ticket Reopened Successfully!");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert("Failed to reopen ticket.");
    }
  };

  const handleResubmitClick = (ticket) => {
    setEditedTicket({
      issueSummary: ticket.issueSummary,
      detailedDescription: ticket.detailedDescription,
      attachment: null
    });
    setShowResubmitModal(true);
  };

  const handleResubmitSubmit = async () => {
    if (!editedTicket.issueSummary.trim() || !editedTicket.detailedDescription.trim()) {
      alert("Both summary and description are mandatory.");
      return;
    }

    const formData = new FormData();
    formData.append("issueSummary", editedTicket.issueSummary);
    formData.append("detailedDescription", editedTicket.detailedDescription);
    if (editedTicket.attachment) {
      formData.append("attachment", editedTicket.attachment);
    }

    try {
      await api.put(`/tickets/resubmit/${selectedTicket.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Ticket Resubmitted Successfully!");
      setShowResubmitModal(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert("Failed to resubmit ticket.");
    }
  };

  const handleViewStatus = async (ticketId) => {
    if (!token) return;
    try {
      const res = await api.get(`/tickets/status-details/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusDetails(res.data);
      setSelectedTicket(null); // Close detail modal
      setStatusModalOpen(true);
    } catch (err) {
      console.error("Error fetching status details:", err);
      alert("Failed to fetch status details.");
    }
  };

  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setStatusDetails(null);
  };

  const handleCancelTicket = async (ticketId) => {
    if (window.confirm("Are you sure you want to cancel this ticket?")) {
      try {
        await api.put(`/tickets/cancel/${ticketId}`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Ticket cancelled successfully");
        setSelectedTicket(null);
        fetchTickets();
      } catch (err) {
        console.error("Error cancelling ticket:", err);
        alert("Failed to cancel ticket");
      }
    }
  };


  return (
    <div style={styles.dashboardContainer}>

      {tickets.length === 0 ? (
        <p style={{ fontSize: "16px", color: "#666" }}>
          You have not submitted any helpdesk tickets yet.
        </p>
      ) : (
        // Scroll container for the table (handles vertical scroll and styling)
        <div style={{
          ...styles.tableScrollContainer,
          maxHeight: isMobileView ? 'calc(100vh - 250px)' : 'calc(100vh - 300px)',
          marginTop: "0"
        }}>
          {/* ⭐ ADDED: Inner wrapper for horizontal scroll on smaller screens */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "8%", whiteSpace: "nowrap", padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>ID</th>
                  <th style={{ ...styles.th, width: "12%", minWidth: isMobileView ? '100px' : '130px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Ticket Type</th>
                  {/* ⭐ UPDATED WIDTH: 15% -> 12% */}
                  <th style={{ ...styles.th, width: "12%", padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Category</th>
                  {/* ⭐ UPDATED WIDTH: 15% -> 12% */}
                  <th style={{ ...styles.th, width: "12%", padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Subcategory</th>

                  <th style={{ ...styles.th, width: "20%", padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Summary</th>

                  <th style={{ ...styles.th, width: "15%", padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Assigned To</th>
                  <th style={{ ...styles.th, width: "15%", padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Status</th>

                  {/* ⭐ UPDATED WIDTH: 8% -> 12% to prevent button text wrapping */}
                  <th style={{ ...styles.th, width: "12%", padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ ...styles.td, whiteSpace: "nowrap", padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{t.id}</td>
                    <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                      <span style={styles.ticketTypeBadge(t.ticketType === "CHANGE_REQUEST", isMobileView)}>
                        {t.ticketType === "CHANGE_REQUEST" ? "Change Request" : "Ticket"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{t.category}</td>
                    <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{t.subcategory}</td>

                    {/* Summary wrapping ensured by styles.td */}
                    <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{t.issueSummary}</td>

                    <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                      {t.assignedTo ? (
                        <span style={styles.assignedBadge}>{getDisplayEmployeeId(t.assignedTo)}</span>
                      ) : (
                        <span style={styles.notAssignedBadge}>Not Assigned</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                      {toTitleCase(t.status)}
                    </td>


                    <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                      {t.status === "RESEND_REQUIRED" ? (
                        <button
                          style={{
                            ...styles.resendButton,
                            padding: isMobileView ? "4px 0" : "6px 0",
                            fontSize: isMobileView ? "11px" : "13px"
                          }}
                          onClick={() => handleResubmit(t)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#00B3A4";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#00B3A4";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          Resend
                        </button>
                      ) : (
                        <button
                          style={{
                            ...styles.viewButton,
                            padding: isMobileView ? "4px 0" : "6px 0",
                            fontSize: isMobileView ? "11px" : "13px"
                          }}
                          onClick={() => setSelectedTicket(t)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#00B3A4";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#00B3A4";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* ⭐ END OF INNER WRAPPER */}
        </div>
      )
      }

      {/* ---------------- MODAL POPUP (TICKET DETAILS) ---------------- */}
      {
        selectedTicket && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modal, padding: isMobileView ? "15px" : "30px" }}>
              <h2 style={{ color: "#1e3a8a", fontSize: isMobileView ? "18px" : "24px" }}>Ticket ID : {selectedTicket.id}</h2>

              {/* STATUS TIMELINE */}
              <div style={{ margin: isMobileView ? "10px 0" : "20px 0 30px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                <p style={{ fontSize: isMobileView ? "12px" : "14px", color: "#3b82f6", marginBottom: "5px", fontWeight: "700" }}>Status Timeline:</p>
                {renderTimeline(selectedTicket.status, isMobileView)}
              </div>

              <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}>
                <b>Status:</b> <span style={styles.statusBadge(selectedTicket.status, isMobileView)}>{selectedTicket.status.replace('_', ' ')}</span>
              </div>
              <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}>
                <b>Ticket Type:</b>{" "}
                {selectedTicket.ticketType === "CHANGE_REQUEST" ? (
                  <span style={styles.ticketTypeBadge(true, isMobileView)}>Change Request</span>
                ) : (
                  <span style={styles.ticketTypeBadge(false, isMobileView)}>Ticket</span>
                )}
              </div>
              <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}><b>Category:</b> {selectedTicket.category}</div>
              <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}><b>Subcategory:</b> {selectedTicket.subcategory}</div>
              <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}>
                <b>Assigned To:</b>{" "}
                {selectedTicket.assignedTo ? (
                  <span style={{ ...styles.assignedBadge, fontSize: isMobileView ? "11px" : "12px", padding: isMobileView ? "2px 8px" : "4px 10px" }}>{getDisplayEmployeeId(selectedTicket.assignedTo)}</span>
                ) : (
                  <span style={{ ...styles.notAssignedBadge, fontSize: isMobileView ? "11px" : "12px" }}>Not Assigned</span>
                )}
              </div>

              <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}><b>Submitted On:</b> {formatDateTimeToIST(selectedTicket.createdAt)}</div>
              <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}><b>CC to Manager:</b> {selectedTicket.ccToManager ? "Yes" : "No"}</div>


              {/* Summary with forced wrapping */}
              {/* ⭐ NEW: SHOW REASSIGN DETAILS IF PRESENT */}


              <p style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px", marginTop: isMobileView ? "10px" : "15px", borderTop: "1px dashed #ddd", paddingTop: isMobileView ? "10px" : "15px" }}>
                <b>Issue Summary:</b> <span style={styles.contentWrap}>{selectedTicket.issueSummary}</span>
              </p>
              {/* Description with forced wrapping */}
              <p style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}>
                <b>Description:</b> <span style={styles.contentWrap}>{selectedTicket.detailedDescription}</span>
              </p>

              {selectedTicket.attachmentFileName ? (
                <div style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <b>Attachment:</b>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      onClick={() =>
                        downloadFile(selectedTicket.id, selectedTicket.attachmentFileName)
                      }
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
                <p style={{ ...styles.modalDetail, fontSize: isMobileView ? "13px" : "15px" }}><b>Attachment:</b> No file uploaded</p>
              )}


              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobileView ? '8px' : '15px', marginTop: isMobileView ? '15px' : '25px' }}>

                {/* CANCEL BUTTON - Visible for all pending states */}
                {isCancellable(selectedTicket.status) && (
                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#ef4444", // Red
                      color: "#fff",
                      margin: 0,
                      padding: isMobileView ? "8px 12px" : "10px 20px",
                      fontSize: isMobileView ? "11px" : "14px"
                    }}
                    onClick={() => handleCancelTicket(selectedTicket.id)}
                  >
                    Cancel Ticket
                  </button>
                )}

                {/* VIEW STATUS BUTTON */}
                <button
                  style={{
                    ...styles.actionButton,
                    backgroundColor: "#3b82f6", // Blue
                    color: "#fff",
                    margin: 0,
                    padding: isMobileView ? "8px 12px" : "10px 20px",
                    fontSize: isMobileView ? "11px" : "14px"
                  }}
                  onClick={() => handleViewStatus(selectedTicket.id)}
                >
                  View Status
                </button>

                <button
                  style={{
                    padding: isMobileView ? "8px 12px" : "10px 20px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "600",
                    margin: 0,
                    fontSize: isMobileView ? "11px" : "14px"
                  }}
                  onClick={() => setSelectedTicket(null)}
                >
                  Close Window
                </button>


                {/* REOPEN BUTTON - Visible only if RESOLVED */}
                {selectedTicket.status === "RESOLVED" && (
                  <button
                    style={styles.reopenButton}
                    onClick={() => handleReopen(selectedTicket.id)}
                  >
                    Reopen Ticket
                  </button>
                )}

                {selectedTicket.status === "RESEND_REQUIRED" && (
                  <button
                    style={{ ...styles.resendButton, marginTop: 0, padding: isMobileView ? "8px 12px" : "10px 20px", fontSize: isMobileView ? "11px" : "14px" }}
                    onClick={() => handleResubmitClick(selectedTicket)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#d97706";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#f59e0b";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <RefreshCcw size={isMobileView ? 12 : 14} />
                    Resend Details
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* ---------------- STATUS FLOW MODAL ---------------- */}
      {statusModalOpen && statusDetails && (
        <div style={styles.modalOverlay}>
          <div style={{
            backgroundColor: "#fff", padding: isMobileView ? "20px 15px" : "30px", borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: isMobileView ? "95%" : "400px", maxWidth: "95%"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1e293b", textAlign: "center", fontSize: isMobileView ? "1.1rem" : "1.3rem" }}>Ticket Status Flow</h3>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0", // Gap handled by padding/margin of items to create continuous line effect
              position: "relative",
              maxHeight: "60vh",
              overflowY: "auto",
              paddingRight: "10px"
            }}>

              {statusDetails.history && statusDetails.history.length > 0 ? (
                statusDetails.history.map((event, index) => {
                  const isLast = index === statusDetails.history.length - 1;

                  // Determine Color ID
                  let color = "#3b82f6"; // Default Blue
                  const action = event.displayAction || "";

                  if (action.includes("APPROVED") || action.includes("RESOLVED") || action.includes("PAID") || action.includes("INITIATED")) {
                    color = "#10b981"; // Green
                  } else if (action.includes("REJECTED") || action.includes("CANCELLED")) {
                    color = "#ef4444"; // Red
                  } else if (action.includes("RESEND") || action.includes("RESUBMITTED")) {
                    color = "#f59e0b"; // Amber
                  }

                  return (
                    <div key={index} style={{
                      display: !isMobileView ? "flex" : "block",
                      gap: !isMobileView ? "15px" : "0",
                      position: "relative",
                      paddingLeft: isMobileView ? "35px" : "0",
                      paddingBottom: isLast ? "0" : (isMobileView ? "25px" : "30px"),
                      minHeight: isMobileView ? "50px" : "auto"
                    }}>

                      {/* Timeline Line (Vertical) */}
                      {!isLast && (
                        <div style={{
                          position: "absolute",
                          left: isMobileView ? "6px" : "6px",
                          top: isMobileView ? "16px" : "18px",
                          bottom: "0",
                          width: "2px",
                          background: "#e2e8f0",
                          zIndex: 1
                        }}></div>
                      )}

                      {/* Dot */}
                      <div style={{
                        position: isMobileView ? "absolute" : "relative",
                        left: 0,
                        top: isMobileView ? "4px" : "0",
                        minWidth: isMobileView ? "14px" : "14px",
                        width: isMobileView ? "14px" : "14px",
                        height: isMobileView ? "14px" : "14px",
                        borderRadius: "50%",
                        background: color,
                        zIndex: 2,
                        boxShadow: isMobileView ? "0 0 0 3px #fff" : "none",
                        marginTop: !isMobileView ? "4px" : "0"
                      }}></div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0,
                          fontSize: isMobileView ? "0.75rem" : "0.85rem",
                          color: "#64748b",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          lineHeight: "1.2"
                        }}>
                          {event.displayAction}
                        </p>

                        {event.displayAction !== "created" && !event.displayAction.startsWith("RESEND REQUESTED") && (
                          <p style={{
                            margin: "4px 0 0 0",
                            fontSize: isMobileView ? "0.8rem" : "0.95rem",
                            color: "#334155",
                            fontWeight: isMobileView ? "600" : "500",
                            lineHeight: "1.3"
                          }}>
                            {formatApproverDisplay(event.actorName)}
                          </p>
                        )}

                        <p style={{
                          margin: "4px 0 0 0",
                          fontSize: isMobileView ? "0.7rem" : "0.85rem",
                          color: isMobileView ? "#64748b" : "#0f172a"
                        }}>
                          {event.timestamp ? formatDateTimeToIST(event.timestamp) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: "center", color: "#64748b" }}>No history available for this ticket.</p>
              )}

              {/* 3. Current Stage / Next Approver */}
              {(statusDetails.status === "PENDING_MANAGER" || statusDetails.status === "OPEN" || statusDetails.status === "IN_PROGRESS") && statusDetails.nextApproverRole && (
                <div style={{
                  display: !isMobileView ? "flex" : "block",
                  gap: !isMobileView ? "15px" : "0",
                  position: "relative",
                  paddingLeft: isMobileView ? "35px" : "0",
                  minHeight: isMobileView ? "50px" : "auto",
                  marginTop: "10px"
                }}>
                  {/* Timeline Line if inside a flow - but here it's the last item usually */}

                  {/* Dot */}
                  <div style={{
                    position: isMobileView ? "absolute" : "relative",
                    left: 0,
                    top: isMobileView ? "4px" : "0",
                    minWidth: "14px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#fbbf24", // Amber for pending
                    zIndex: 2,
                    boxShadow: isMobileView ? "0 0 0 3px #fff" : "none",
                    marginTop: !isMobileView ? "4px" : "0"
                  }}></div>

                  <div>
                    <p style={{ margin: 0, fontSize: isMobileView ? "0.75rem" : "0.85rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Current Stage</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: isMobileView ? "0.8rem" : "0.95rem", color: "#0f172a", fontWeight: "600" }}>
                      Pending with {statusDetails.nextApproverRole}
                    </p>
                    {statusDetails.approverName && statusDetails.approverName !== "-" && (
                      <p style={{ margin: "2px 0 0 0", fontSize: isMobileView ? "0.75rem" : "0.85rem", color: "#475569" }}>
                        {formatApproverDisplay(statusDetails.approverName)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <button
                onClick={handleCloseStatusModal}
                style={{
                  padding: "8px 24px",
                  background: "#1e293b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- RESUBMIT MODAL ---------------- */}
      {
        showResubmitModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={{ color: "#f39c12" }}>Resubmit Ticket Details</h3>

              {selectedTicket?.resendReason && (
                <div style={{ backgroundColor: "#fff3cd", padding: "10px", borderRadius: "5px", marginBottom: "15px", borderLeft: "4px solid #f39c12" }}>
                  <b>Resend Reason:</b> {selectedTicket.resendReason}
                </div>
              )}

              <label style={{ display: 'block', fontWeight: 'bold', marginTop: '10px' }}>Issue Summary *</label>
              <input
                type="text"
                style={{ ...styles.textAreaStyle, minHeight: '40px' }}
                value={editedTicket.issueSummary}
                onChange={(e) => setEditedTicket({ ...editedTicket, issueSummary: e.target.value })}
              />

              <label style={{ display: 'block', fontWeight: 'bold', marginTop: '15px' }}>Detailed Description *</label>
              <textarea
                rows="6"
                style={styles.textAreaStyle}
                value={editedTicket.detailedDescription}
                onChange={(e) => setEditedTicket({ ...editedTicket, detailedDescription: e.target.value })}
              />

              <label style={{ display: 'block', fontWeight: 'bold', marginTop: '15px' }}>Attachment (Optional)</label>
              <input
                type="file"
                onChange={(e) => setEditedTicket({ ...editedTicket, attachment: e.target.files[0] })}
                style={{ marginTop: '5px' }}
              />

              <div style={{ textAlign: "right", marginTop: "30px" }}>
                <button
                  style={{ ...styles.actionButton, background: "#f39c12", color: "white" }}
                  onClick={handleResubmitSubmit}
                >
                  Submit Resend
                </button>

                <button
                  style={{ ...styles.actionButton, background: "#6c757d", color: "white" }}
                  onClick={() => setShowResubmitModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* PREVIEW MODAL */}
      <HelpDeskPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreviewModal}
        fileUrl={previewFile}
        fileType={fileType}
        fileName={selectedTicket ? selectedTicket.attachmentFileName : ""}
      />

    </div >
  );
};

export default HelpDeskMyTicketsDashboard;