import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { formatDateTimeToIST } from "../utils/DateUtils";
import HelpDeskPreviewModal from "./HelpDeskPreviewModal";

/* -------------------- STYLES -------------------- */
// Local formatDate removed in favor of DateUtils.formatDateTimeToIST
const styles = {
  container: {
    padding: "0px",

    minHeight: "100vh",
  },

  // ⭐ MODIFIED: Container for the Table to control both vertical and horizontal scrolling
  tableScrollContainer: {
    // 100vh - 300px for the height, including header space and padding
    maxHeight: 'calc(100vh - 300px)',
    overflowY: 'auto', // Vertical scroll (already present)
    overflowX: 'auto', // ⭐ CHANGED to allow horizontal scrolling on overflow
    marginTop: "0",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    borderRadius: "8px",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    backgroundColor: "white",
    // ⭐ ADDED/RESTORED: Important for horizontal scrolling. Forces table to be wider than container if needed.
    minWidth: '800px',
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
    minWidth: '100px',
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    color: "#555",
    // Fixes table content from stretching horizontally, but we need to ensure the columns are wide enough for the content to read well.
    whiteSpace: "normal",
    wordBreak: "break-word",
    maxWidth: "180px", // Helps text wrap sooner in columns like Summary
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

  /* Modal/Popup Common Styles (Kept as is for context) */
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

  /* Main Ticket Detail Modal - UPDATED MAX WIDTH */
  modal: {
    background: "white",
    padding: "30px",
    width: "95%",        // Increased percentage
    maxWidth: "650px",   // ⭐ Increased from 550px to 650px to fit buttons
    borderRadius: "10px",
    position: "relative",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    // Added overflowY to ensure long descriptions scroll within the modal
    maxHeight: '90vh',
    overflowY: 'auto',
  },

  /* Transfer/Reassign Popup - Keeping existing size */
  actionPopup: {
    background: "white",
    padding: "25px",
    width: "90%",
    maxWidth: "450px",
    borderRadius: "10px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    position: "relative",
  },

  closeIcon: {
    position: "absolute",
    top: "15px",
    right: "15px",
    fontSize: "22px",
    cursor: "pointer",
    color: "#444",
    fontWeight: "bold",
  },

  wrap50: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    maxWidth: "100%",
  },


  /* Modal Content Styles */
  modalContent: {
    lineHeight: '1.8',
    paddingTop: '15px'
  },

  detailRow: {
    marginBottom: '5px',
    display: 'block',
  },

  detailHeader: {
    fontWeight: '700',
    color: '#333',
    display: 'inline-block',
    minWidth: '120px',
  },

  descriptionBox: {
    marginTop: '15px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
  },

  descriptionText: {
    backgroundColor: '#f8f8f8',
    padding: '10px',
    borderRadius: '5px',
    borderLeft: '3px solid #3b82f6',
    whiteSpace: 'pre-wrap',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.4',
    marginTop: '5px',
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

  /* Action Buttons */
  actionButton: {
    padding: "8px 10px", // ⭐ Reduced horizontal padding from 16px to 10px
    border: "none",
    borderRadius: "6px",
    margin: "0 3px",     // Reduced margin
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  /* Badges */
  assignedBadge: {
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "4px 10px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "12px",
    display: "inline-block",
  },
  notAssignedBadge: {
    backgroundColor: "#6c757d",
    color: "white",
    padding: "4px 10px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "12px",
    display: "inline-block",
  },
};

/* ---------------- Timeline ---------------- */

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

const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

const cleanEmbeddedIds = (str) => {
  if (!str) return str;
  return str.replace(/\b([a-zA-Z0-9]+)(_|-)([a-zA-Z0-9]+)\b/g, (match, p1, p2, p3) => p3);
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const HelpDeskPendingActionsPage1 = () => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [showTransferPopup, setShowTransferPopup] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [reason, setReason] = useState("");

  const token = sessionStorage.getItem("token");
  const loggedInEmployee = sessionStorage.getItem("employeeId");
  const [dynamicTeams, setDynamicTeams] = useState([]);

  // ⭐ NEW: Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusDetails, setStatusDetails] = useState(null);
  const [statusTicketId, setStatusTicketId] = useState(null);

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

  const handleViewStatus = async (ticketId) => {
    if (!token) return;
    setStatusTicketId(ticketId); // Store ID for display
    try {
      const res = await api.get(`/tickets/status-details/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusDetails(res.data);
      setStatusModalOpen(true);
    } catch (err) {
      console.error("Error fetching status details:", err);
      alert("Failed to fetch status details.");
    }
  };

  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setStatusDetails(null);
    setStatusTicketId(null);
  };




  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await api.get("/v1/helpdesk-teams/all");
        setDynamicTeams(res.data);  // Example: ["HR_TEAM", "FINANCE_TEAM", "ADMIN_TEAM"]
      } catch (err) {
        console.error("Error loading teams", err);
      }
    }
    loadTeams();
  }, []);


  /* ---- FETCH TEAM TICKETS (LOGGED IN EMPLOYEE'S TEAM) ---- */
  const fetchAllTickets = useCallback(async () => {
    if (!loggedInEmployee || !token) return;

    try {
      const res = await api.get("/tickets/team-tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
          employeeId: loggedInEmployee
        },
      });
      const validTickets = res.data.filter(t => t.status !== "PENDING_MANAGER" && t.status !== "PENDING MANAGER");
      setTickets(validTickets);
    } catch (err) {
      console.error("Error loading tickets", err);
      alert("Failed to fetch all tickets.");
    }
  }, [token, loggedInEmployee]);

  useEffect(() => {
    fetchAllTickets();
  }, [fetchAllTickets]);

  /* ---- Download File ---- */
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
      console.error("Error downloading file", error);
      alert("Failed to download file.");
    }
  };

  /* ---- ASSIGN TO ME ---- */
  const handleAssignToMe = async (ticketId) => {
    if (!window.confirm(`Are you sure you want to assign Ticket #${ticketId} to yourself?`)) return;

    try {
      await api.put(`/tickets/assign/${ticketId}/${loggedInEmployee}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("The Ticket is Assigned to you.");
      setSelectedTicket(null);
      fetchAllTickets();

    } catch (err) {
      console.error("Assign error:", err);
      alert("Failed to assign ticket.");
    }
  };

  /* ---- TRANSFER TICKET ---- */
  const handleTransferSubmit = async () => {
    if (!selectedTeam || reason.trim().length < 5) {
      alert("Please select a team and enter a reason (min 5 characters).");
      return;
    }
    if (!window.confirm(`Confirm transfer of Ticket #${selectedTicket.id} to ${selectedTeam}?`)) return;


    try {
      await api.put(
        `/tickets/transfer/${selectedTicket.id}`,
        { team: selectedTeam, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Ticket Transferred Successfully!");
      setShowTransferPopup(false);
      setSelectedTicket(null);
      setSelectedTeam("");
      setReason("");
      fetchAllTickets();
    } catch (e) {
      alert("Transfer failed. The ticket might already be in progress or resolved.");
    }
  };

  /* ---- REASSIGN TICKET (Set to unassigned/open in team queue) ---- */
  const handleReassign = async (ticketId) => {
    const reason = prompt("Please enter a reason for reassigning (min 5 characters):");
    if (reason === null) return;

    if (reason.trim().length < 5) {
      alert("Please enter a reason for reassigning (min 5 characters).");
      return;
    }

    if (!window.confirm(`Confirm reassign of Ticket #${ticketId}? This will remove your assignment.`)) return;

    try {
      await api.put(
        `/tickets/reassign/${ticketId}`,
        { reason: reason.trim() }, // Reason passed in body
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Ticket Reassigned to Team Queue!");
      setSelectedTicket(null);
      fetchAllTickets();
    } catch (e) {
      alert("Reassign failed.");
    }
  };

  /* ---- RESEND TICKET BY TEAM ---- */
  const handleResend = async (ticketId) => {
    const reason = prompt("Enter reason for resending (10-100 characters):");
    if (reason === null) return;

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 100) {
      alert("Resend reason must be between 10 and 100 characters.");
      return;
    }

    if (!window.confirm(`Confirm resend request for Ticket #${ticketId}?`)) return;

    try {
      await api.put(
        `/tickets/resend/${ticketId}?reason=${encodeURIComponent(trimmedReason)}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            employeeId: loggedInEmployee
          }
        }
      );

      alert("Resend Request Sent to Employee!");
      setSelectedTicket(null);
      fetchAllTickets();
    } catch (e) {
      alert("Resend request failed.");
    }
  };


  return (
    <div style={styles.container}>
      {/* ---------- TABLE ---------- */}
      {tickets.length === 0 ? (
        <p style={{ padding: '0px', color: "#666" }}>No tickets available in your team's queue.</p>
      ) : (
        // ⭐ Scroll container for both vertical and horizontal scrolling
        <div style={{
          ...styles.tableScrollContainer,
          maxHeight: isMobileView ? 'calc(100vh - 250px)' : 'calc(100vh - 300px)',
          marginTop: "0",
          overflowX: 'auto',
          boxShadow: isMobileView ? 'none' : styles.tableScrollContainer.boxShadow
        }}>
          <table className="helpdesk-table" style={{ ...styles.table, minWidth: isMobileView ? '700px' : '800px' }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, minWidth: '50px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>ID</th>
                <th style={{ ...styles.th, minWidth: '80px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Employee ID</th>
                <th style={{ ...styles.th, minWidth: '120px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Employee Name</th>
                <th style={{ ...styles.th, minWidth: '150px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Ticket Type</th>
                <th style={{ ...styles.th, minWidth: '120px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Category</th>
                <th style={{ ...styles.th, minWidth: '200px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Summary</th>
                <th style={{ ...styles.th, minWidth: '150px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Assigned To</th>
                <th style={{ ...styles.th, minWidth: '120px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Status</th>
                <th style={{ ...styles.th, minWidth: '80px', padding: isMobileView ? "8px 10px" : "14px 16px", fontSize: isMobileView ? "12px" : "14px" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{t.id}</td>
                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{getDisplayEmployeeId(t.employeeId)}</td>
                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{t.employeeName || "N/A"}</td>
                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                    {t.ticketType === "CHANGE_REQUEST" ? "Change Request" : "Ticket"}
                  </td>

                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>{t.category}</td>
                  {/* Summary wraps within the cell due to styles.td */}
                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                    {t.issueSummary}
                  </td>

                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                    {t.assignedTo ? getDisplayEmployeeId(t.assignedTo) : "Not Assigned"}
                  </td>
                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px", color: 'black' }}>{toTitleCase(t.status)}</td>
                  <td style={{ ...styles.td, padding: isMobileView ? "8px 10px" : "12px 15px", fontSize: isMobileView ? "11px" : "14px" }}>
                    <button
                      className="helpdesk-view-btn"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------- */}
      {/* ---------- MAIN TICKET MODAL (FIXED LAYOUT) ---------- */}
      {/* ------------------------------------- */}
      {selectedTicket && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {/* Close Icon */}
            <div
              style={styles.closeIcon}
              onClick={() => setSelectedTicket(null)}
            >
              ✖
            </div>

            <h3 style={{ color: "#1e3a8a", marginBottom: "5px" }}>Ticket ID : {selectedTicket.id}</h3>

            <p style={{ fontSize: isMobileView ? "12px" : "14px", color: "#3b82f6", marginBottom: "5px", fontWeight: "700" }}>Status Timeline:</p>
            {renderTimeline(selectedTicket.status, isMobileView)}

            {/* Content Display (Fixed Layout) */}
            <div style={{ ...styles.modalContent, paddingTop: isMobileView ? '10px' : '15px' }}>

              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Employee:</b> {getDisplayEmployeeId(selectedTicket.employeeId)}
              </span>
              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Employee Name:</b> {selectedTicket.employeeName || "N/A"}
              </span>

              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Created On:</b> {formatDateTimeToIST(selectedTicket.createdAt)}
              </span>
              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Ticket Type:</b>
                {selectedTicket.ticketType === "CHANGE_REQUEST" ? (
                  <span style={{ color: "#2563eb", fontWeight: "600" }}>Change Request</span>
                ) : (
                  <span style={{ color: "#3b82f6", fontWeight: "600" }}>Ticket</span>
                )}
              </span>


              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Category:</b> {selectedTicket.category}
              </span>

              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Subcategory:</b> {selectedTicket.subcategory}
              </span>

              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Status:</b> {toTitleCase(selectedTicket.status)}
              </span>



              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Assigned To:</b>
                {selectedTicket.assignedTo ? (
                  <span style={{ ...styles.assignedBadge, fontSize: isMobileView ? '10px' : '12px', padding: isMobileView ? '2px 8px' : '4px 10px' }}>{getDisplayEmployeeId(selectedTicket.assignedTo)}</span>
                ) : (
                  <span style={{ ...styles.notAssignedBadge, fontSize: isMobileView ? '10px' : '12px', padding: isMobileView ? '2px 8px' : '4px 10px' }}>Not Assigned</span>
                )}
              </span>

              <span style={{ ...styles.detailRow, fontSize: isMobileView ? '12px' : '14px' }}>
                <b style={{ ...styles.detailHeader, minWidth: isMobileView ? '100px' : '120px' }}>Summary:</b>
                <span style={styles.wrap50}>
                  {selectedTicket.issueSummary}
                </span>
              </span>


              {/* Detailed Description (Full Width) */}
              <div style={{ ...styles.descriptionBox, marginTop: isMobileView ? '10px' : '15px' }}>
                <b style={{ display: 'block', marginBottom: '5px', fontSize: isMobileView ? '12px' : '14px' }}>Detailed Description:</b>
                <div style={{ ...styles.descriptionText, ...styles.wrap50, fontSize: isMobileView ? '11px' : '14px' }}>
                  {selectedTicket.detailedDescription}
                </div>
              </div>

              {/* Attachment (Full Width) */}
              <div style={{ ...styles.descriptionBox, marginTop: isMobileView ? '10px' : '15px' }}>
                <b style={{ display: 'block', marginBottom: '5px', fontSize: isMobileView ? '12px' : '14px' }}>Attachment:</b>
                {selectedTicket.attachmentFileName ? (
                  <>
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
                  </>
                ) : (
                  <span style={{ fontSize: isMobileView ? '11px' : '14px' }}>No File</span>
                )}
              </div>
            </div>

            {/* ---------- ACTION BUTTONS ---------- */}
            <div style={{
              marginTop: "30px",
              paddingTop: "15px",
              borderTop: "1px solid #eee",
              display: "flex",           // Flexbox
              justifyContent: "center",  // Center align to look balanced
              flexWrap: "nowrap",        // Keep single line
              gap: "5px",                // Reduced gap
              overflowX: "auto",         // Keep horizontal scroll just in case
              paddingBottom: "5px"
            }}>

              {/* SHOW ASSIGN BUTTON ONLY IF NOT ASSIGNED */}
              {!selectedTicket.assignedTo && (
                <button
                  className="helpdesk-action-btn"
                  style={{
                    ...styles.actionButton,
                    background: "#3b82f6",
                    color: "white",
                    padding: isMobileView ? "6px 12px" : "8px 16px",
                    fontSize: isMobileView ? "11px" : "13px",
                    whiteSpace: "nowrap" // prevent text wrap
                  }}
                  onClick={() => handleAssignToMe(selectedTicket.id)}
                >
                  Assign To Me
                </button>
              )}

              {/* SHOW VIEW STATUS BUTTON IF ASSIGNED TO ME OR UNASSIGNED */}
              {(!selectedTicket.assignedTo || selectedTicket.assignedTo === loggedInEmployee) && (
                <button
                  style={{
                    ...styles.actionButton,
                    background: "#f59e0b", // Amber/Orange
                    color: "white",
                    padding: isMobileView ? "6px 12px" : "8px 16px",
                    fontSize: isMobileView ? "11px" : "13px",
                    whiteSpace: "nowrap"
                  }}
                  onClick={() => handleViewStatus(selectedTicket.id)}
                >
                  History
                </button>
              )}

              {/* SHOW RESEND BUTTON IF UNASSIGNED OR ASSIGNED TO ME */}
              {(!selectedTicket.assignedTo || selectedTicket.assignedTo === loggedInEmployee) && (
                <button
                  style={{
                    ...styles.actionButton,
                    background: "#f39c12", // Kept original orange for Resend, or adjust if needed
                    color: "white",
                    padding: isMobileView ? "6px 12px" : "8px 16px",
                    fontSize: isMobileView ? "11px" : "13px",
                    whiteSpace: "nowrap"
                  }}
                  onClick={() => handleResend(selectedTicket.id)}
                >
                  Resend
                </button>
              )}

              {/* SHOW REASSIGN + TRANSFER ONLY IF ASSIGNED TO ME */}
              {selectedTicket.assignedTo === loggedInEmployee && (
                <>
                  {/* REASSIGN BUTTON */}
                  <button
                    style={{
                      ...styles.actionButton,
                      background: "#3b82f6",
                      color: "white",
                      padding: isMobileView ? "6px 12px" : "8px 16px",
                      fontSize: isMobileView ? "11px" : "13px",
                      whiteSpace: "nowrap"
                    }}
                    onClick={() => handleReassign(selectedTicket.id)}
                  >
                    Reassign
                  </button>

                  {/* TRANSFER BUTTON */}
                  <button
                    style={{
                      ...styles.actionButton,
                      background: "#3b82f6",
                      color: "white",
                      padding: isMobileView ? "6px 12px" : "8px 16px",
                      fontSize: isMobileView ? "11px" : "13px",
                      whiteSpace: "nowrap"
                    }}
                    onClick={() => {
                      setSelectedTeam('');
                      setReason('');
                      setShowTransferPopup(true);
                    }}
                  >
                    Transfer To
                  </button>

                  {/* RESOLVE BUTTON */}
                  <button
                    style={{
                      ...styles.actionButton,
                      background: "#10b981", // Success green is better for Resolved
                      color: "white",
                      padding: isMobileView ? "6px 12px" : "8px 16px",
                      fontSize: isMobileView ? "11px" : "13px",
                      whiteSpace: "nowrap"
                    }}
                    onClick={async () => {
                      if (!window.confirm(`Mark Ticket #${selectedTicket.id} as RESOLVED?`)) return;

                      try {
                        await api.put(`/tickets/resolve/${selectedTicket.id}`, {}, {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            employeeId: loggedInEmployee
                          }
                        });

                        alert("Ticket marked as RESOLVED!");
                        setSelectedTicket(null);
                        fetchAllTickets();

                      } catch (err) {
                        console.error("Resolve error:", err);
                        alert("Failed to resolve ticket.");
                      }
                    }}
                  >
                    Resolved
                  </button>
                </>
              )}




            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------- */}
      {/* ---------- TRANSFER POPUP ---------- */}
      {/* ------------------------------------- */}
      {showTransferPopup && (
        <div style={styles.modalOverlay}>
          <div style={styles.actionPopup}>
            <h3>Transfer Ticket #{selectedTicket?.id}</h3>

            <label style={{ display: 'block', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>Select Team</label>
            <select
              style={styles.textAreaStyle}
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Choose Team</option>
              {dynamicTeams
                .filter(team => team !== selectedTicket.teamName)  // avoid same team
                .map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}

            </select>

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Reason for Transfer</label>
              <textarea
                rows="4"
                style={styles.textAreaStyle}
                placeholder="Enter reason for transferring this ticket (max 255 characters)..."
                value={reason}
                maxLength="255"
                onChange={(e) => setReason(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: reason.length >= 255 ? '#ef4444' : '#64748b', marginTop: '4px', alignSelf: 'flex-end' }}>
                {reason.length}/255 characters
              </span>
            </div>

            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button
                style={{
                  ...styles.actionButton,
                  background: "#3b82f6",
                  color: "white",
                }}
                onClick={handleTransferSubmit}
              >
                Submit Transfer
              </button>

              <button
                style={{
                  ...styles.actionButton,
                  background: "#ef4444",
                  color: "white",
                }}
                onClick={() => {
                  setShowTransferPopup(false);
                  setSelectedTeam("");
                  setReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      <HelpDeskPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreviewModal}
        fileUrl={previewFile}
        fileType={fileType}
        fileName={selectedTicket ? selectedTicket.attachmentFileName : ""}
      />

      {/* ------------------------------------- */}
      {/* ---------- STATUS DETAILS MODAL ---------- */}
      {/* ------------------------------------- */}
      {statusModalOpen && statusDetails && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "600px" }}>
            <div style={styles.closeIcon} onClick={handleCloseStatusModal}>✖</div>
            <h3 style={{ color: "#1e3a8a", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
              Ticket ID : {statusTicketId}
            </h3>

            <div style={{ maxHeight: "60vh", overflowY: "auto", marginTop: "15px" }}>
              {statusDetails.history && statusDetails.history.length > 0 ? (
                statusDetails.history.map((h, index) => (
                  <div key={index} style={{
                    marginBottom: "15px",
                    padding: "15px",
                    backgroundColor: h.rawAction === "REASSIGNED" ? "#fff7ed" :
                      h.rawAction === "TRANSFERRED" ? "#f0f9ff" :
                        "#f9f9f9",
                    borderLeft: h.rawAction === "REASSIGNED" ? "4px solid #f97316" :
                      h.rawAction === "TRANSFERRED" ? "4px solid #0ea5e9" :
                        "4px solid #3b82f6",
                    borderRadius: "4px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>
                        {h.displayAction}
                      </span>
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {formatDateTimeToIST(h.timestamp)}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", color: "#555", marginBottom: "5px" }}>
                      <strong>By:</strong> {cleanEmbeddedIds(h.actorName) || "System"}
                    </div>

                    {/* Show REASON for ALL actions if notes exist */}
                    {h.notes && (
                      <div style={{
                        marginTop: "8px",
                        fontSize: "13px",
                        color: "#444",
                        backgroundColor: "rgba(255,255,255,0.6)",
                        padding: "8px",
                        borderRadius: "4px",
                        fontStyle: "italic",
                        border: "1px solid #eee" // Added border for clarity
                      }}>
                        <strong>Reason:</strong> {h.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No history available.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HelpDeskPendingActionsPage1;