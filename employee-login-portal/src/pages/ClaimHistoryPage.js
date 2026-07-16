import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import api from "../api";
import { formatDateToIST, formatDateTimeToIST } from '../utils/DateUtils';
import ToastNotification from '../components/ToastNotification';
import { Document, Page, pdfjs } from 'react-pdf';
import './ClaimHistoryPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiList,
  FiTable,
  FiFileText,
  FiTarget,
  FiEdit,
  FiXCircle,
  FiPaperclip,
  FiEye
} from "react-icons/fi";

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

// ✅ Reformats approver display strings to: "Name (ID)(on behalf of OrigName (OrigID))"
// Handles both new backend format (ID already embedded) and old legacy format (ID separate)
const formatApproverDisplay = (approverName, approverId) => {
    if (!approverName && !approverId) return null;
    const cleanId = getDisplayEmployeeId(approverId);
    if (!approverName) return `(${cleanId})`;

    let formattedName = approverName;
    
    // Clean up raw ID occurrences inside the name string if they exist
    if (approverId && formattedName.includes(approverId)) {
        formattedName = formattedName.replace(new RegExp(approverId, 'g'), cleanId);
    }
    
    // Clean up any other tenant-prefixed IDs embedded in the name
    formattedName = formattedName.replace(/\b([a-zA-Z0-9]+)(_|-)([a-zA-Z0-9]+)\b/g, (match, p1, p2, p3) => p3);

    // Fix spacing if there is no space before (on behalf of
    if (formattedName.includes(')(on behalf of')) {
        formattedName = formattedName.replace(')(on behalf of', ') (on behalf of');
    } else if (formattedName.includes('(on behalf of') && !formattedName.includes(' (on behalf of')) {
        formattedName = formattedName.replace('(on behalf of', ' (on behalf of');
    }

    // Already in new format — ID is embedded in the name string
    if (cleanId && formattedName.includes(cleanId)) {
        return formattedName;
    }

    // Old format: "Name (on behalf of OrigName)" with a separate approverId
    if (cleanId && formattedName.includes('(on behalf of')) {
        const onBehalfIdx = formattedName.indexOf('(on behalf of');
        const basePart = formattedName.substring(0, onBehalfIdx).trim();
        const onBehalfPart = formattedName.substring(onBehalfIdx).trim();
        return `${basePart} (${cleanId})(${onBehalfPart.substring(1)}`; // remove leading '(' from onBehalfPart
    }

    // Simple name, just append the ID
    if (cleanId) return `${formattedName} (${cleanId})`;

    return formattedName;
};


// Correctly set the PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.js`;

function ClaimHistoryPage({ onActionComplete, refreshTrigger }) {
  const [claims, setClaims] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(sessionStorage.getItem("employeeProfilePic"));
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusDetails, setStatusDetails] = useState(null);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isCancelAllHovered, setIsCancelAllHovered] = useState(false);
  const [isCancelClaimHovered, setIsCancelClaimHovered] = useState(false);
  const [isViewStatusHovered, setIsViewStatusHovered] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ open: true, message, type });
  const closeToast = () => setToast(t => ({ ...t, open: false }));



  const navigate = useNavigate();
  const location = useLocation();
  const employeeId = sessionStorage.getItem("employeeId");
  const token = sessionStorage.getItem("token"); // JWT token

  // Format date helper
  const formatDate = (dateString) => {
    return formatDateToIST(dateString);
  };

  // Truncate long file names
  const truncateFileName = (fileName, length = 10) => {
    if (!fileName) return "No Receipt";
    return fileName.length > length ? `${fileName.substring(0, length)}...` : fileName;
  };

  // Fetch claim history
  const fetchClaims = useCallback(() => {
    if (!employeeId || !token) return;
    setLoading(true);
    api.get(`/claims/history/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        // Sort by id descending (newest first) — reliable across all environments
        const sortedClaims = res.data.sort((a, b) => b.id - a.id);
        setClaims(sortedClaims);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching history:", err);
        setLoading(false);
      });
  }, [employeeId, token]);

  // Fetch profile
  const fetchProfile = () => {
    if (!employeeId || !token) return;
    api.get(`/profile/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.data.profilePic) {
          setProfilePic(res.data.profilePic);
          sessionStorage.setItem("employeeProfilePic", res.data.profilePic);
        }
      })
      .catch(err => console.error("Failed to fetch profile info:", err));
  };

  useEffect(() => {
    fetchClaims();
    fetchProfile();

    const params = new URLSearchParams(location.search);
    if (params.get('refresh') === 'true') {
      fetchClaims();
      navigate(location.pathname, { replace: true });
    }
  }, [fetchClaims, location.search, navigate]);

  // Refresh claims when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchClaims();
    }
  }, [refreshTrigger, fetchClaims]);

  // View receipt (PDF or image)
  const handleViewReceipt = (id, receiptName) => {
    if (!token) return showToast("Authorization required.", "error");
    api.get(`/claims/receipt/${id}`, { responseType: "arraybuffer", headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const fileExtension = receiptName.split('.').pop().toLowerCase();

        let blob;
        if (fileExtension === 'pdf') {
          blob = new Blob([res.data], { type: 'application/pdf' });
        } else {
          blob = new Blob([res.data]);
        }

        const fileUrl = URL.createObjectURL(blob);

        if (fileExtension === 'pdf') {
          setFileType('pdf');
          setPreviewFile(fileUrl);
          setIsModalOpen(true);
        } else {
          setFileType('image');
          setPreviewFile(fileUrl);
          setIsModalOpen(true);
        }
      })
      .catch(err => console.error("Error fetching receipt:", err));
  };

  // Download receipt
  const handleDownloadReceipt = (id, receiptName) => {
    if (!token) return showToast("Authorization required.", "error");
    api.get(`/claims/receipt/${id}`, { responseType: "blob", headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const fileUrl = URL.createObjectURL(res.data);
        const link = document.createElement("a");
        link.href = fileUrl;
        link.setAttribute("download", receiptName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileUrl);
      })
      .catch(err => console.error("Error downloading receipt:", err));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (previewFile) URL.revokeObjectURL(previewFile);
    setPreviewFile(null);
    setFileType(null);
    setNumPages(null);
    setPageNumber(1);
  };

  const handleOpenDetailModal = (claim) => {
    setSelectedClaim(claim);
    setIsDetailModalOpen(true);
    setIsCancelClaimHovered(false);
    setIsViewStatusHovered(false);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedClaim(null);
    setIsCancelClaimHovered(false);
    setIsViewStatusHovered(false);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset) => setPageNumber(prev => prev + offset);
  const prevPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  // Cancel claim — using window.confirm
  const handleCancelClaim = (id) => {
    if (!token) return showToast("Authorization required.", "error");
    if (window.confirm("Are you sure you want to cancel this claim? This action cannot be undone.")) {
      api.put(`/claims/cancel/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setClaims(prev => prev.map(c => c.id === id ? { ...c, status: "Cancelled" } : c));
          if (selectedClaim && selectedClaim.id === id) {
            setSelectedClaim(prev => ({ ...prev, status: "Cancelled" }));
          }
          alert("Claim cancelled successfully.");
          if (onActionComplete) onActionComplete();
          handleCloseDetailModal();
        })
        .catch(err => {
          console.error("Error cancelling claim:", err);
          showToast("Failed to cancel claim.", "error");
        });
    }
  };

  // Cancel all claims in a group
  const handleCancelAllClaims = () => {
    if (!selectedGroup || !token) return;

    // Get all pending claims in the group
    const pendingClaims = selectedGroup.claims.filter(claim => claim.status === 'Pending');

    if (window.confirm(`Are you sure you want to cancel all ${pendingClaims.length} pending claim(s)? This action cannot be undone.`)) {
      // Cancel all pending claims
      const cancelPromises = pendingClaims.map(claim =>
        api.put(`/claims/cancel/${claim.id}`, null, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      Promise.all(cancelPromises)
        .then(() => {
          // Update local state
          setClaims(prev => prev.map(c => {
            const isCancelled = pendingClaims.some(pc => pc.id === c.id);
            return isCancelled ? { ...c, status: "Cancelled" } : c;
          }));

          // Update selected group state
          setSelectedGroup(prev => ({
            ...prev,
            claims: prev.claims.map(c =>
              c.status === 'Pending' ? { ...c, status: "Cancelled" } : c
            )
          }));

          alert(`Successfully cancelled ${pendingClaims.length} claim(s).`);
          if (onActionComplete) onActionComplete();
        })
        .catch(err => {
          console.error("Error cancelling claims:", err);
          showToast("Failed to cancel some claims.", "error");
        });
    }
  };

  const handleViewStatus = async (id) => {
    if (!token) return;
    try {
      const res = await api.get(`/claims/status-details/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusDetails(res.data);
      handleCloseDetailModal(); // Close detail modal
      setStatusModalOpen(true);
    } catch (err) {
      console.error("Error fetching status details:", err);
      showToast("Failed to fetch status details.", "error");
    }
  };

  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setStatusDetails(null);
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setIsGroupModalOpen(true);
    setIsCancelAllHovered(false);
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setSelectedGroup(null);
    setIsCancelAllHovered(false);
  };

  // Filter claims based on search
  const filteredClaims = claims.filter(claim => {
    const searchString = searchTerm.toLowerCase();
    return (
      String(claim.id).toLowerCase().includes(searchString) ||
      String(claim.employeeId).toLowerCase().includes(searchString) ||
      (claim.name && claim.name.toLowerCase().includes(searchString)) ||
      (claim.category && claim.category.toLowerCase().includes(searchString)) ||
      (claim.amount && String(claim.amount).toLowerCase().includes(searchString)) ||
      (claim.expenseDescription && claim.expenseDescription.toLowerCase().includes(searchString)) ||
      (claim.businessPurpose && claim.businessPurpose.toLowerCase().includes(searchString)) ||
      (claim.additionalNotes && claim.additionalNotes.toLowerCase().includes(searchString)) ||
      (claim.expenseDate && claim.expenseDate.toLowerCase().includes(searchString)) ||
      (claim.receiptName && claim.receiptName.toLowerCase().includes(searchString)) ||
      (claim.submittedDate && formatDateToIST(claim.submittedDate).includes(searchString)) ||
      (claim.status && claim.status.toLowerCase().includes(searchString)) ||
      (claim.rejectionReason && claim.rejectionReason.toLowerCase().includes(searchString)) ||
      (claim.claimGroupId && claim.claimGroupId.toLowerCase().includes(searchString))
    );
  });

  // Group claims by claimGroupId
  const groupedClaims = filteredClaims.reduce((acc, claim) => {
    const groupId = claim.claimGroupId || `single-${claim.id}`; // Use claimGroupId or create unique key for single claims

    if (!acc[groupId]) {
      acc[groupId] = {
        claimGroupId: claim.claimGroupId,
        displayId: claim.claimGroupId || claim.id, // Show claimGroupId if exists, otherwise show claim ID
        claims: [],
        totalClaims: 0,
        totalAmount: 0,
        activeTotalAmount: 0, // Track active claims amount separately
        lastSubmitted: claim.submittedDate,
        status: claim.status,
        isBulk: !!claim.claimGroupId // Flag to identify bulk submissions
      };
    }

    acc[groupId].claims.push(claim);
    acc[groupId].totalClaims += 1;
    acc[groupId].totalAmount += parseFloat(claim.amount || 0);

    // Only add to active total if claim is not cancelled
    if (claim.status !== 'Cancelled') {
      acc[groupId].activeTotalAmount += parseFloat(claim.amount || 0);
    }

    // Update last submitted date if this claim is more recent
    if (new Date(claim.submittedDate) > new Date(acc[groupId].lastSubmitted)) {
      acc[groupId].lastSubmitted = claim.submittedDate;
    }

    return acc;
  }, {});

  // Sort groups by the maximum claim id inside the group (newest group first)
  // This is reliable across all environments unlike date-string parsing
  const groupedClaimsArray = Object.values(groupedClaims).sort((a, b) => {
    const maxIdA = Math.max(...a.claims.map(c => c.id));
    const maxIdB = Math.max(...b.claims.map(c => c.id));
    return maxIdB - maxIdA;
  });

  return (
    <div style={{ padding: "0" }}>

      <div className="">
        {loading ? <p>Loading claims...</p> :
          claims.length === 0 ? <p>No claims submitted yet.</p> :
            filteredClaims.length === 0 ? <p>No claims found for your search criteria.</p> :
              <div className="tablee1">
                <table className="status-table transparent-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Total Amount</th>
                      <th>Submitted Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedClaimsArray.map((group, index) => (
                      <tr key={index}>
                        <td style={{ backgroundColor: 'transparent' }}>{group.displayId}</td>
                        <td style={{ backgroundColor: 'transparent' }}>₹{group.activeTotalAmount.toFixed(2)}</td>
                        <td style={{ backgroundColor: 'transparent' }}>
                          {group.lastSubmitted ? formatDate(group.lastSubmitted) : "N/A"}
                        </td>
                        <td style={{ backgroundColor: 'transparent', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              onClick={() => handleViewGroup(group)}
                              style={{
                                padding: '6px 12px',
                                background: '#00B3A4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 'normal',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <FiEye size={14} />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }

        {/* Group Modal - Shows all claims in a group */}
        {isGroupModalOpen && selectedGroup && ReactDOM.createPortal(
          <div className="history-detail-modal-overlay">
            <div className="history-detail-modal-card" style={{ maxWidth: '1200px', width: '95%' }}>
              <div className="modal-header-v2">
                <div className="header-title-group">
                  <h3>
                    {selectedGroup.isBulk
                      ? `Claim - ${selectedGroup.claimGroupId}`
                      : `Claim Details - #${selectedGroup.displayId}`}
                  </h3>
                </div>
                <button className="close-x-btn" onClick={handleCloseGroupModal}>&times;</button>
              </div>
              <div className="modal-body-v2">
                <table className="status-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Expense Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.claims.map(claim => (
                      <tr key={claim.id}>
                        <td>{claim.category}</td>
                        <td>₹{claim.amount}</td>
                        <td>{formatDate(claim.expenseDate)}</td>
                        <td>{claim.status}</td>
                        <td>
                          <button
                            onClick={() => {
                              handleCloseGroupModal();
                              handleOpenDetailModal(claim);
                            }}
                            style={{
                              padding: '4px 10px',
                              background: '#00B3A4',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '15px'
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
              <div className="modal-footer-v2" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button className="modal-close-btn" onClick={handleCloseGroupModal}>Close</button>
                {selectedGroup.isBulk && selectedGroup.claims.some(claim => claim.status === 'Pending') && (
                  <button
                    className="modal-cancel-btn"
                    onClick={handleCancelAllClaims}
                    onMouseEnter={() => setIsCancelAllHovered(true)}
                    onMouseLeave={() => setIsCancelAllHovered(false)}
                    style={{
                      padding: "10px 20px",
                      border: "1.5px solid #00b3a4",
                      backgroundColor: isCancelAllHovered ? "#00b3a4" : "transparent",
                      color: isCancelAllHovered ? "#fff" : "#00b3a4",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: 'normal',
                      marginLeft: "10px",
                      transition: "all 0.3s ease"
                    }}
                  >
                    Cancel All
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Modal for detail table */}
        {isDetailModalOpen && selectedClaim && (
          <div className="history-detail-modal-overlay">
            <div className="history-detail-modal-card">
              <div className="modal-header-v2">
                <div className="header-title-group">
                  <h3>Claim Details - #{selectedClaim.id}</h3>
                </div>
                <div className="header-actions">
                  <button className="close-x-btn" onClick={handleCloseDetailModal}>&times;</button>
                </div>
              </div>
              <div className="modal-body-v2">
                <div className="detail-list-wrapper">
                  <div className="detail-list-item">
                    <div className="item-icon-box"><FiFileText /></div>
                    <div className="item-content">
                      <label>Description</label>
                      <p>{selectedClaim.expenseDescription || "N/A"}</p>
                    </div>
                  </div>
                  <div className="detail-list-item">
                    <div className="item-icon-box"></div>
                    <div className="item-content">
                      <label>Expense Date</label>
                      <p>{formatDate(selectedClaim.expenseDate)}</p>
                    </div>
                  </div>
                  <div className="detail-list-item">
                    <div className="item-icon-box"><FiPaperclip /></div>
                    <div className="item-content">
                      <label>Attached Document</label>
                      {selectedClaim.receiptName ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          <p style={{ margin: 0 }}>
                            {truncateFileName(selectedClaim.receiptName, 20)}
                          </p>
                          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <span
                              style={{
                                color: "#14b8a6",
                                fontWeight: 'normal',
                                fontSize: '15px',
                                cursor: "pointer",
                                textDecoration: "underline",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px"
                              }}
                              onClick={() => handleDownloadReceipt(selectedClaim.id, selectedClaim.receiptName)}
                            >
                              Download
                            </span>

                            <span
                              style={{
                                cursor: "pointer",
                                color: "#3b82f6",
                                fontWeight: 'normal',
                                fontSize: '15px',
                                textDecoration: "underline",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px"
                              }}
                              onClick={() => handleViewReceipt(selectedClaim.id, selectedClaim.receiptName)}
                            >
                              Preview
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p>No document attached</p>
                      )}
                    </div>
                  </div>
                  {selectedClaim.rejectionReason && (
                    <div className="detail-list-item rejection-item">
                      <div className="item-icon-box"><FiXCircle /></div>
                      <div className="item-content">
                        <label>Rejection Reason</label>
                        <p>{selectedClaim.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer-v2" style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button
                  className="modal-cancel-btn"
                  onClick={() => handleViewStatus(selectedClaim.id)}
                  onMouseEnter={() => setIsViewStatusHovered(true)}
                  onMouseLeave={() => setIsViewStatusHovered(false)}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    backgroundColor: isViewStatusHovered ? "#00998c" : "#00b3a4",
                    color: "#fff",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: 'normal',
                    transition: "all 0.3s ease"
                  }}
                >
                  View Status
                </button>
                {selectedClaim.status === 'Pending' && (
                  <button
                    className="modal-cancel-btn"
                    onClick={() => handleCancelClaim(selectedClaim.id)}
                    onMouseEnter={() => setIsCancelClaimHovered(true)}
                    onMouseLeave={() => setIsCancelClaimHovered(false)}
                    style={{
                      padding: "10px 20px",
                      border: "1.5px solid #00b3a4",
                      backgroundColor: isCancelClaimHovered ? "#00b3a4" : "transparent",
                      color: isCancelClaimHovered ? "#fff" : "#00b3a4",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: 'normal',
                      transition: "all 0.3s ease"
                    }}
                  >
                    Cancel Claim
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal for receipt preview */}
        {isModalOpen && ReactDOM.createPortal(
          <div className="preview-modal-overlay" onClick={handleCloseModal} style={{
            position: 'fixed',
            top: 0,
            left: window.innerWidth > 768 ? '280px' : '0',
            width: window.innerWidth > 768 ? 'calc(100% - 280px)' : '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999999
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
                <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: 'normal' }}>Receipt Preview</h3>
                <button
                  onClick={handleCloseModal}
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
                  onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
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
                      alt="Receipt Preview"
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
                  onClick={handleCloseModal}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#1e293b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'normal',
                    fontSize: '15px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#334155'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Status Flow Modal */}
        {statusModalOpen && statusDetails && (
          <div style={{
            position: "fixed",
            top: 0,
            left: window.innerWidth > 768 ? "280px" : "0",
            width: window.innerWidth > 768 ? "calc(100% - 280px)" : "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000
          }}>
            <div style={{
              backgroundColor: "#fff", padding: "30px", borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: "500px", maxWidth: "90%",
              maxHeight: "80vh", overflowY: "auto"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1e293b", textAlign: "center" }}>Claim Status Flow</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* 1. Created At */}
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></div>
                    <div style={{ width: "2px", flex: 1, background: "#e2e8f0", margin: "4px 0" }}></div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '15px', color: "#64748b", fontWeight: 'normal' }}>Created At</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: '15px', color: "#0f172a" }}>
                      {statusDetails.createdAt ? formatDateTimeToIST(statusDetails.createdAt) : "N/A"}
                    </p>
                  </div>
                </div>

                {/* 2. Approval History */}
                {statusDetails.approvalHistory && statusDetails.approvalHistory.length > 0 && (
                  statusDetails.approvalHistory.map((history, index) => (
                    <div key={index} style={{ display: "flex", gap: "15px" }}>
                      <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: (history.action === "APPROVED" || history.action === "PROCESSED") ? "#10b981" :
                            history.action === "REJECTED" ? "#ef4444" :
                              "#3b82f6"
                        }}></div>
                        {index < statusDetails.approvalHistory.length - 1 || statusDetails.nextApproverRole ? (
                          <div style={{ width: "2px", flex: 1, background: "#e2e8f0", margin: "4px 0" }}></div>
                        ) : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '15px', color: "#64748b", fontWeight: 'normal' }}>
                          {history.action} by {history.approverRole}
                        </p>
                        {(history.approverName || history.approverId) && (
                          <p style={{ margin: "2px 0", fontSize: '15px', color: "#475569" }}>
                            {history.delegatorName 
                              ? `${history.approverName || getDisplayEmployeeId(history.approverId)} (on behalf of ${history.delegatorName})`
                              : formatApproverDisplay(history.approverName, history.approverId) || "Unknown"
                            }
                          </p>
                        )}
                        <p style={{ margin: "4px 0 0 0", fontSize: '15px', color: "#0f172a" }}>
                          {history.actionTimestamp ? formatDateTimeToIST(history.actionTimestamp) : "N/A"}
                        </p>

                      </div>
                    </div>
                  ))
                )}

                {/* 3. Next Approver (if pending) */}
                {statusDetails.nextApproverRole && (
                  <div style={{ display: "flex", gap: "15px" }}>
                    <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fbbf24" }}></div>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', color: "#64748b", fontWeight: 'normal' }}>Current Stage</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: '15px', color: "#0f172a" }}>
                        {(statusDetails.status === "Initiated" || statusDetails.status.toLowerCase().includes("initiated")) && statusDetails.nextApproverRole === "HR" ? "Initiated by HR" :
                          (statusDetails.status === "In Process" || statusDetails.status.toLowerCase().includes("in process")) && statusDetails.nextApproverRole === "HR" ? "In Process with HR" :
                            `Pending with ${statusDetails.nextApproverRole}`}
                      </p>
                      {(statusDetails.approverName || statusDetails.approverId) && (
                        <p style={{ margin: "2px 0 0 0", fontSize: '15px', color: "#475569" }}>
                          {formatApproverDisplay(statusDetails.approverName, statusDetails.approverId) || "Unknown"}
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
                    fontSize: '15px'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Top-right toast notification */}
      <ToastNotification
        isOpen={toast.open}
        onClose={closeToast}
        message={toast.message}
        type={toast.type}
      />

    </div>

  );
}

export default ClaimHistoryPage;