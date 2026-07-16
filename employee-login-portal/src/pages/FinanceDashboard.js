import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { formatDateToIST } from '../utils/DateUtils';
import './FinanceDashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
import api from "../api";
import {
  FiList,
  FiTable,
  FiFileText,
  FiTarget,

  FiEdit,
  FiXCircle,
  FiPaperclip,
  FiTag,
  FiDollarSign,
  FiUser,
  FiHash,
  FiCheckCircle,
  FiEye,
  FiCheck,
  FiX
} from "react-icons/fi";

function FinanceDashboard({ embedded, employeeId: propEmployeeId, refreshTrigger, onActionComplete, statusFilter = 'All', onDataLoaded }) {
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };
  const [claims, setClaims] = useState([]);
  const [originalClaims, setOriginalClaims] = useState([]);
  const [employeeId, setEmployeeId] = useState(null);
  const [role, setRole] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupedClaims, setGroupedClaims] = useState({});

  // State variables for receipt preview
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local formatDate removed in favor of DateUtils.formatDateToIST

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.startsWith('approved')) return '#4BB543';
    if (s.startsWith('pending')) return '#FFC107';
    if (s.startsWith('rejected')) return '#FF4136';
    if (s.startsWith('initiated')) return '#3b82f6';
    if (s.startsWith('payment')) return '#8b5cf6';
    return '#000';
  };

  const wrapTextEveryNChars = (text, n = 20) => {
    if (!text) return "";
    const regex = new RegExp(`(.{1,${n}})`, "g");
    return text.match(regex);
  };

  const truncateFileName = (name, length = 10) => {
    if (!name) return "";
    return name.length > length ? name.slice(0, length) + "..." : name;
  };

  useEffect(() => {
    const storedId = sessionStorage.getItem("employeeId");
    const storedName = sessionStorage.getItem("employeeName");
    const storedRole = sessionStorage.getItem("role");

    const effectiveId = propEmployeeId || storedId;

    setEmployeeId(effectiveId);
    setRole(storedRole);
    setEmployeeName(storedName);

    if (!effectiveId) return;

    fetchClaims(effectiveId);

    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const response = await api.get(`/profile/${effectiveId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ JWT header
          },
        });

        const data = response.data;


        if (data.name) {
          setEmployeeName(data.name);
          sessionStorage.setItem("employeeName", data.name);
        }
      } catch (err) {
        console.error("Failed to fetch profile info:", err.response?.data || err.message);
      }
    };

    fetchProfile();
  }, [propEmployeeId, refreshTrigger]);


  useEffect(() => {
    let filtered = originalClaims;

    // 1. Status Filter
    if (statusFilter && statusFilter !== 'All') {
      const f = statusFilter.toLowerCase();
      filtered = filtered.filter(claim => (claim.status || '').toLowerCase().startsWith(f));
    }

    // 2. Search Term
    if (searchTerm.length > 0) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(claim => {
        const matchesClaimId = String(claim.id).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesEmployeeId = String(claim.employeeId).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesEmployeeName = claim.name && claim.name.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesCategory = claim.category && claim.category.toLowerCase().includes(lowerCaseSearchTerm);

        const matchesAmount = String(claim.amount).toLowerCase().includes(lowerCaseSearchTerm);
        const matchesDescription = claim.expenseDescription && claim.expenseDescription.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesExpenseDate = claim.expenseDate && claim.expenseDate.includes(searchTerm);
        const matchesSubmittedDate = claim.submittedDate && claim.submittedDate.includes(searchTerm);

        return (
          matchesClaimId ||
          matchesEmployeeId ||
          matchesEmployeeName ||
          matchesCategory ||

          matchesAmount ||
          matchesDescription ||
          matchesExpenseDate ||
          matchesSubmittedDate
        );
      });
    }
    setClaims(filtered);

    // Group claims by claimGroupId (bulk submission) or individual ID
    const grouped = filtered.reduce((acc, claim) => {
      const groupKey = claim.claimGroupId || `single-${claim.id}`;
      if (!acc[groupKey]) {
        acc[groupKey] = {
          groupId: groupKey,
          employeeId: claim.employeeId,
          name: claim.name,
          claims: [],
          totalAmount: 0,
          lastSubmitted: claim.submittedDate
        };
      }
      acc[groupKey].claims.push(claim);
      acc[groupKey].totalAmount += parseFloat(claim.amount || 0);
      if (new Date(claim.submittedDate) > new Date(acc[groupKey].lastSubmitted)) {
        acc[groupKey].lastSubmitted = claim.submittedDate;
      }
      return acc;
    }, {});
    setGroupedClaims(grouped);
    if (onDataLoaded) onDataLoaded(Object.keys(grouped).length);
  }, [searchTerm, originalClaims, statusFilter, onDataLoaded]);

  const fetchClaims = (financeId) => {
    setLoading(true);
    const token = sessionStorage.getItem("token"); // JWT token
    api
      .get(`/claims/finance/${financeId}`, {

        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      .then((response) => {
        const claims = response.data;
        const sortedClaims = claims.sort((a, b) => b.id - a.id);
        setClaims(sortedClaims);
        setOriginalClaims(sortedClaims);
        console.log("Fetched and sorted assigned claims:", sortedClaims);
      })
      .catch((err) => {
        console.error("Error fetching claims:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleApprove = async (claimId) => {
    try {
      const token = sessionStorage.getItem("token");
      await api.post(
        `/claims/approve/${claimId}?role=Finance`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setClaims(prev => prev.filter(c => c.id !== claimId));
      setOriginalClaims(prev => prev.filter(c => c.id !== claimId));

      // ✅ ALERT MESSAGE
      alert("Claim processed successfully");
      if (onActionComplete) onActionComplete();

      handleCloseDetailModal();
    } catch (error) {
      console.error("Error approving claim:", error);
      alert("Failed to approve claim");
    }
  };


  const handleRejectClick = async (claimId) => {
    const token = sessionStorage.getItem("token");
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    if (reason.trim().length < 10 || reason.trim().length > 100) {
      alert("Rejection reason must be between 10 and 100 characters long.");
      return;
    }

    try {
      setLoading(true);
      await api.post(
        `/claims/reject/${claimId}?role=Finance&reason=${encodeURIComponent(reason)}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setClaims(prev => prev.filter(c => c.id !== claimId));
      setOriginalClaims(prev => prev.filter(c => c.id !== claimId));

      alert("Claim rejected successfully");

      if (selectedClaim && selectedClaim.id === claimId) {
        handleCloseDetailModal();
      }

      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Error rejecting claim:", error);
      alert("Failed to reject claim");
    } finally {
      setLoading(false);
    }
  };


  const handleDownloadReceipt = (id, receiptName) => {
    const token = sessionStorage.getItem("token");
    api
      .get(`/claims/receipt/${id}`, {

        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", receiptName || "receipt");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error("Download error:", err));
  };

  const handleOpenDetailModal = (claim) => {
    setSelectedClaim(claim);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedClaim(null);
  };

  const handleOpenBulkModal = (group) => {
    setSelectedGroup(group);
    setIsBulkModalOpen(true);
  };

  const handleCloseBulkModal = () => {
    setIsBulkModalOpen(false);
    setSelectedGroup(null);
  };

  const handleApproveBulk = async (groupClaims) => {
    const token = sessionStorage.getItem("token");
    const count = groupClaims.length;
    const confirmed = window.confirm(`Are you sure you want to approve all ${count} claims?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      for (const claim of groupClaims) {
        await api.post(`/claims/approve/${claim.id}?role=Finance`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      alert(`Successfully processed ${count} claims`);
      fetchClaims(employeeId);
      handleCloseBulkModal();
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Bulk approval failed:", error);
      alert("Failed to approve some claims. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBulk = async (groupClaims) => {
    const token = sessionStorage.getItem("token");
    const count = groupClaims.length;
    const reason = window.prompt(`Enter rejection reason for all ${count} claims:`);
    if (reason === null) return; // Cancelled
    if (!reason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    if (reason.trim().length < 10 || reason.trim().length > 100) {
      alert("Rejection reason must be between 10 and 100 characters long.");
      return;
    }

    try {
      setLoading(true);
      for (const claim of groupClaims) {
        await api.post(`/claims/reject/${claim.id}?reason=${encodeURIComponent(reason)}&role=Finance`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      alert(`Successfully rejected ${count} claims`);
      fetchClaims(employeeId);
      handleCloseBulkModal();
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Bulk rejection failed:", error);
      alert("Failed to reject some claims. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (id, receiptName) => {
    const token = sessionStorage.getItem("token");
    if (!token) return alert("Authorization required.");

    api.get(`/claims/receipt/${id}`, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${token}` }
    })
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
          // Open PDF in modal instead of new tab
          setFileType('pdf');
          setPreviewFile(fileUrl);
          setIsModalOpen(true);
        } else {
          setFileType('image');
          setPreviewFile(fileUrl);
          setIsModalOpen(true);
        }
      })
      .catch(err => {
        console.error("Error fetching receipt:", err);
        alert("Failed to load receipt.");
      });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (previewFile) URL.revokeObjectURL(previewFile);
    setPreviewFile(null);
    setFileType(null);
  };

  if (embedded) {
    return (
      <>
        {!loading && employeeId && claims.length > 0 && Object.values(groupedClaims)
          .sort((a, b) => new Date(b.lastSubmitted) - new Date(a.lastSubmitted))
          .map((group) => (
            <tr key={group.groupId}>
              <td style={{ backgroundColor: "transparent", color: "#334155", fontSize: "15px" }}>{getDisplayEmployeeId(group.employeeId)}</td>
              <td style={{ backgroundColor: "transparent", color: "#334155", fontSize: "15px" }}>{group.name}</td>
              <td style={{ backgroundColor: "transparent", color: "#334155", fontSize: "15px" }}>{group.claims.length}</td>
              <td style={{ backgroundColor: "transparent", color: "#334155", fontSize: "15px" }}>{group.totalAmount.toLocaleString()}</td>
              <td style={{ backgroundColor: "transparent", color: "#334155", fontSize: "15px" }}>
                {formatDateToIST(group.lastSubmitted)}
              </td>
              <td style={{ backgroundColor: "transparent", textAlign: 'center', color: "#334155", fontSize: "15px" }}>
                <div
                  className="view-action-btn"
                  onClick={() => handleOpenBulkModal(group)}
                  title="View details"
                >
                  <FiEye size={16} style={{ flexShrink: 0 }} />
                </div>
              </td>
            </tr>
          ))}

        {isBulkModalOpen && selectedGroup && ReactDOM.createPortal(
          (() => {
            const currentGroup = groupedClaims[selectedGroup.groupId];
            if (!currentGroup) {
              // If group is gone (all approved/rejected), close modal
              setTimeout(handleCloseBulkModal, 0);
              return null;
            }
            return (
              <div className="history-detail-modal-overlay">
                <div className="history-detail-modal-card" style={{ maxWidth: '1000px', width: '90%' }}>
                  <div className="modal-header-v2">
                    <div className="header-title-group">
                      <h3>Review Reimbursements - {currentGroup.name} ({getDisplayEmployeeId(currentGroup.employeeId)})</h3>
                    </div>
                    <button className="close-x-btn" onClick={handleCloseBulkModal}>&times;</button>
                  </div>
                  <div className="modal-body-v2" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.25rem' }}>
                    <div className="bulk-review-summary">
                      <div className="summary-stats">
                        <div className="summary-stat-item">
                          <span className="summary-stat-label">Total Claims</span>
                          <span className="summary-stat-value">{currentGroup.claims.length}</span>
                        </div>
                        <div className="summary-stat-item">
                          <span className="summary-stat-label">Pending Amount</span>
                          <span className="summary-stat-value highlight">₹{currentGroup.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="bulk-action-group">
                        <button
                          className="bulk-approve-btn"
                          onClick={() => handleApproveBulk(currentGroup.claims)}
                        >
                          <FiCheckCircle size={18} />
                          Process All
                        </button>
                        <button
                          className="bulk-reject-btn"
                          onClick={() => handleRejectBulk(currentGroup.claims)}
                        >
                          <FiXCircle size={18} />
                          Reject All
                        </button>
                      </div>
                    </div>

                    <div className="bulk-table-container">
                      <table className="status-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th><span style={{ marginRight: '6px', fontWeight: 'bold' }}></span> Amount</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentGroup.claims.map(claim => (
                            <tr key={claim.id}>
                              <td style={{ fontWeight: '600', color: '#1e293b' }}>{claim.category}</td>
                              <td style={{ fontWeight: '800', color: '#0d9488' }}>₹{claim.amount.toLocaleString()}</td>
                              <td style={{ textAlign: 'center', fontWeight: '500', color: '#64748b' }}>{formatDateToIST(claim.expenseDate)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="status-badge" style={{
                                  backgroundColor: 'transparent',
                                  color: 'black',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  border: 'none'
                                }}>
                                  {claim.status || 'Pending'}
                                </span>
                              </td>
                              <td>
                                <div className="action-btn-group">
                                  <button
                                    className="action-btn approve"
                                    onClick={() => handleApprove(claim.id)}
                                    title="Process Claim"
                                  >
                                    <FiCheck size={16} />
                                  </button>
                                  <button
                                    className="action-btn reject"
                                    onClick={() => handleRejectClick(claim.id)}
                                    title="Reject Claim"
                                  >
                                    <FiX size={16} />
                                  </button>
                                  <button
                                    className="view-action-btn"
                                    onClick={() => handleOpenDetailModal(claim)}
                                    title="View Details"
                                  >
                                    <FiEye size={16} style={{ flexShrink: 0 }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}

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
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: '600' }}>Receipt Preview</h3>
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
                    fontWeight: '500',
                    fontSize: '0.95rem',
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



        {isDetailModalOpen && selectedClaim && ReactDOM.createPortal(
          <div className="history-detail-modal-overlay">
            <div className="history-detail-modal-card">
              <div className="modal-header-v2">
                <div className="header-title-group">
                  <h3>Reimbursements Details - #{selectedClaim.id}</h3>
                </div>
                <div className="header-actions">
                  <button className="close-x-btn" onClick={handleCloseDetailModal}>
                    &times;
                  </button>
                </div>
              </div>
              <div className="modal-body-v2">
                <div className="detail-list-wrapper">
                  <div className="detail-list-grid">
                    <div className="detail-list-item">
                      <div className="item-icon-box">
                        <FiTag />
                      </div>
                      <div className="item-content">
                        <label>Category</label>
                        <p>{selectedClaim.category || "N/A"}</p>
                      </div>
                    </div>
                    <div className="detail-list-item">
                      <div className="item-icon-box">
                        <span style={{ fontWeight: 'bold' }}>₹</span>
                      </div>
                      <div className="item-content">
                        <label>Amount</label>
                        <p>₹{selectedClaim.amount || "0"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="detail-list-item">
                    <div className="item-icon-box">
                      <FiFileText />
                    </div>
                    <div className="item-content">
                      <label>Description</label>
                      <p>{selectedClaim.expenseDescription || "N/A"}</p>
                    </div>
                  </div>
                  <div className="detail-list-grid">
                    <div className="detail-list-item">
                      <div className="item-icon-box">

                      </div>
                      <div className="item-content">
                        <label>Expense Date</label>
                        <p>
                          {formatDateToIST(selectedClaim.expenseDate)}
                        </p>
                      </div>
                    </div>
                    <div className="detail-list-item">
                      <div className="item-icon-box">
                        <FiPaperclip />
                      </div>
                      <div className="item-content">
                        <label>Receipt</label>

                        {selectedClaim.receiptName ? (
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <button
                              onClick={() => handleDownloadReceipt(selectedClaim.id, selectedClaim.receiptName)}
                              style={{
                                cursor: "pointer",
                                color: "#14b8a6",
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontWeight: "700",
                                fontSize: '0.9rem',
                                textDecoration: 'underline'
                              }}
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleViewReceipt(selectedClaim.id, selectedClaim.receiptName)}
                              style={{
                                cursor: "pointer",
                                color: "#3b82f6",
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontWeight: "700",
                                fontSize: '0.9rem',
                                textDecoration: 'underline'
                              }}
                            >
                              Preview
                            </button>
                          </div>
                        ) : (
                          "No Receipt"
                        )}

                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer-v2">
                <button
                  className="modal-close-btn"
                  onClick={handleCloseDetailModal}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  if (embedded) {
    if (loading || !employeeId || claims.length === 0) return null;
    return (
      <>
        {Object.values(groupedClaims).map((group) => (
          <tr key={group.groupId}>
            <td style={{ backgroundColor: "transparent" }}>{getDisplayEmployeeId(group.employeeId)}</td>
            <td style={{ backgroundColor: "transparent" }}>{group.name}</td>
            <td style={{ backgroundColor: "transparent" }}>{group.claims.length}</td>
            <td style={{ backgroundColor: "transparent" }}>₹{group.totalAmount.toLocaleString()}</td>
            <td style={{ backgroundColor: "transparent" }}>
              {formatDateToIST(group.lastSubmitted)}
            </td>
            <td style={{ backgroundColor: "transparent", textAlign: 'center' }}>
              <button
                className="btn primary"
                style={{
                  padding: '5px 15px',
                  fontSize: '12px',
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  borderRadius: '6px',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenBulkModal(group)}
              >
                Review
              </button>
            </td>
          </tr>
        ))}

        {isBulkModalOpen && selectedGroup && ReactDOM.createPortal(
          (() => {
            const currentGroup = groupedClaims[selectedGroup.groupId];
            if (!currentGroup) {
              // If group is gone (all approved/rejected), close modal
              setTimeout(handleCloseBulkModal, 0);
              return null;
            }
            return (
              <div className="history-detail-modal-overlay">
                <div className="history-detail-modal-card" style={{ maxWidth: '1000px', width: '90%' }}>
                  <div className="modal-header-v2">
                    <div className="header-title-group">
                      <h3>Review Reimbursements - {currentGroup.name} ({getDisplayEmployeeId(currentGroup.employeeId)})</h3>
                    </div>
                    <button className="close-x-btn" onClick={handleCloseBulkModal}>&times;</button>
                  </div>
                  <div className="modal-body-v2" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.25rem' }}>
                    <div className="bulk-review-summary">
                      <div className="summary-stats">
                        <div className="summary-stat-item">
                          <span className="summary-stat-label">Total Claims</span>
                          <span className="summary-stat-value">{currentGroup.claims.length}</span>
                        </div>
                        <div className="summary-stat-item">
                          <span className="summary-stat-label">Pending Amount</span>
                          <span className="summary-stat-value highlight">₹{currentGroup.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="bulk-action-group">
                        <button
                          className="bulk-approve-btn"
                          onClick={() => handleApproveBulk(currentGroup.claims)}
                        >
                          <FiCheckCircle size={18} />
                          Approve All
                        </button>
                        <button
                          className="bulk-reject-btn"
                          onClick={() => handleRejectBulk(currentGroup.claims)}
                        >
                          <FiXCircle size={18} />
                          Reject All
                        </button>
                      </div>
                    </div>

                    <div className="bulk-table-container">
                      <table className="status-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentGroup.claims.map(claim => (
                            <tr key={claim.id}>
                              <td style={{ fontWeight: '600', color: '#1e293b' }}>{claim.category}</td>
                              <td style={{ fontWeight: '800', color: '#0d9488' }}>₹{claim.amount.toLocaleString()}</td>
                              <td style={{ fontWeight: '500', color: '#64748b' }}>{formatDateToIST(claim.expenseDate)}</td>
                              <td>
                                <div className="action-btn-group">
                                  <button
                                    className="action-btn approve"
                                    onClick={() => handleApprove(claim.id)}
                                    title="Approve Claim"
                                  >
                                    <FiCheck size={16} />
                                  </button>
                                  <button
                                    className="action-btn reject"
                                    onClick={() => handleRejectClick(claim.id)}
                                    title="Reject Claim"
                                  >
                                    <FiX size={16} />
                                  </button>
                                  <button
                                    className="view-action-btn"
                                    onClick={() => handleOpenDetailModal(claim)}
                                    title="View Details"
                                  >
                                    <FiEye size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}



        {isDetailModalOpen && selectedClaim && (
          <div className="history-detail-modal-overlay">
            <div className="history-detail-modal-card">
              <div className="modal-header-v2">
                <div className="header-title-group">
                  <h3>Reimbursements Details - #{selectedClaim.id}</h3>
                </div>
                <div className="header-actions">
                  <button className="close-x-btn" onClick={handleCloseDetailModal}>
                    &times;
                  </button>
                </div>
              </div>
              <div className="modal-body-v2">
                <div className="detail-list-wrapper">
                  <div className="detail-list-grid">
                    <div className="detail-list-item">
                      <div className="item-icon-box">
                        <FiTag />
                      </div>
                      <div className="item-content">
                        <label>Category</label>
                        <p>{selectedClaim.category || "N/A"}</p>
                      </div>
                    </div>
                    <div className="detail-list-item">
                      <div className="item-icon-box">
                        <span style={{ fontWeight: 'bold' }}>₹</span>
                      </div>
                      <div className="item-content">
                        <label>Amount</label>
                        <p>{selectedClaim.amount || "0"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="detail-list-item">
                    <div className="item-icon-box">
                      <FiFileText />
                    </div>
                    <div className="item-content">
                      <label>Description</label>
                      <p>{selectedClaim.expenseDescription || "N/A"}</p>
                    </div>
                  </div>
                  <div className="detail-list-grid">
                    <div className="detail-list-item">
                      <div className="item-icon-box">

                      </div>
                      <div className="item-content">
                        <label>Expense Date</label>
                        <p>
                          {formatDateToIST(selectedClaim.expenseDate)}
                        </p>
                      </div>
                    </div>
                    <div className="detail-list-item">
                      <div className="item-icon-box">
                        <FiPaperclip />
                      </div>
                      <div className="item-content">
                        <label>Receipt</label>
                        <p>
                          {selectedClaim.receiptName ? (
                            <span
                              style={{
                                position: "relative",
                                display: "inline-block",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.querySelector(
                                  ".hover-box"
                                ).style.display = "block";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.querySelector(
                                  ".hover-box"
                                ).style.display = "none";
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleDownloadReceipt(
                                    selectedClaim.id,
                                    selectedClaim.receiptName
                                  )
                                }
                                style={{
                                  cursor: "pointer",
                                  color: "#14b8a6",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  fontWeight: "600",
                                  maxWidth: "220px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {truncateFileName(selectedClaim.receiptName, 10)}
                              </button>
                              <div
                                className="hover-box"
                                style={{
                                  display: "none",
                                  position: "absolute",
                                  bottom: "130%",
                                  left: 0,
                                  zIndex: 9999,
                                  background: "#0f172a",
                                  color: "#ffffff",
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  fontSize: "0.85rem",
                                  lineHeight: "1.4",
                                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                                  maxWidth: "320px",
                                  whiteSpace: "normal",
                                }}
                              >
                                {wrapTextEveryNChars(
                                  selectedClaim.receiptName,
                                  20
                                ).map((line, idx) => (
                                  <div key={idx}>{line}</div>
                                ))}
                              </div>
                            </span>
                          ) : (
                            "No Receipt"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="detail-list-item action-item-list">
                    <div className="item-icon-box">
                      <FiHash />
                    </div>
                    <div className="item-content" style={{ width: "100%" }}>
                      <label>Review Actions</label>
                      <div
                        className="action-buttons"
                        style={{ display: "flex", gap: "12px", marginTop: "8px" }}
                      >
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(selectedClaim.id)}
                          style={{
                            flex: 1,
                            padding: "8px",
                            background:
                              "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Approve Claim
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRejectClick(selectedClaim.id)}
                          style={{
                            flex: 1,
                            padding: "8px",
                            backgroundColor: "#f87171",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Reject Claim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer-v2">
                <button
                  className="modal-close-btn"
                  onClick={handleCloseDetailModal}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div>

      {loading ? null : !employeeId ? (
        <p>Please login or provide an employee ID.</p>
      ) : originalClaims.length === 0 ? (
        <p>You do not have any assigned claims at the moment.</p>
      ) : claims.length === 0 ? (
        <p>No claims found matching your search criteria.</p>
      ) : (
        <div
          className="table-wrapper"
          style={{
            maxHeight: "calc(100vh - 300px)",
            overflowY: "auto",

          }}
        >
          <table className="status-table transparent-table">
            <thead>
              <tr>
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Claim ID</th>
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Employee ID</th>
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Employee Name</th>
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Submitted Date</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#f7f9fa', }}>
              {claims.map(claim => (
                <tr key={claim.id}>
                  <td
                    style={{ backgroundColor: 'transparent', cursor: 'pointer', color: '#14b8a6', fontWeight: 'bold' }}
                    onClick={() => handleOpenDetailModal(claim)}
                  >
                    {claim.id}
                  </td>
                  <td style={{ backgroundColor: 'transparent' }}>{getDisplayEmployeeId(claim.employeeId)}</td>
                  <td style={{ backgroundColor: 'transparent' }}>{claim.name}</td>
                  <td style={{ backgroundColor: 'transparent' }}>{formatDateToIST(claim.submittedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}



      {isDetailModalOpen && selectedClaim && ReactDOM.createPortal(
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
                <div className="detail-list-grid">
                  <div className="detail-list-item">
                    <div className="item-icon-box"><FiTag /></div>
                    <div className="item-content">
                      <label>Category</label>
                      <p>{selectedClaim.category || "N/A"}</p>
                    </div>
                  </div>
                  <div className="detail-list-item">
                    <div className="item-icon-box"><span style={{ fontWeight: 'bold' }}>₹</span></div>
                    <div className="item-content">
                      <label>Amount</label>
                      <p>₹{selectedClaim.amount || "0"}</p>
                    </div>
                  </div>
                </div>
                <div className="detail-list-item">
                  <div className="item-icon-box"><FiFileText /></div>
                  <div className="item-content">
                    <label>Description</label>
                    <p>{selectedClaim.expenseDescription || "N/A"}</p>
                  </div>
                </div>
                <div className="detail-list-grid">
                  <div className="detail-list-item">
                    <div className="item-icon-box"></div>
                    <div className="item-content">
                      <label>Expense Date</label>
                      <p>{formatDateToIST(selectedClaim.expenseDate)}</p>
                    </div>
                  </div>
                  <div className="detail-list-item">
                    <div className="item-icon-box"><FiPaperclip /></div>
                    <div className="item-content">
                      <label>Receipt</label>
                      <p>
                        {selectedClaim.receiptName ? (
                          <span
                            style={{ position: "relative", display: "inline-block" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.querySelector(".hover-box").style.display = "block";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.querySelector(".hover-box").style.display = "none";
                            }}
                          >
                            {/* Truncated button */}
                            <button
                              onClick={() =>
                                handleDownloadReceipt(
                                  selectedClaim.id,
                                  selectedClaim.receiptName
                                )
                              }
                              style={{
                                cursor: "pointer",
                                color: "#14b8a6",
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontWeight: "600",
                                maxWidth: "220px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {truncateFileName(selectedClaim.receiptName, 10)}
                            </button>

                            {/* 🔥 Hover box with 20-char wrapping */}
                            <div
                              className="hover-box"
                              style={{
                                display: "none",
                                position: "absolute",
                                bottom: "130%",
                                left: 0,
                                zIndex: 9999,
                                background: "#0f172a",
                                color: "#ffffff",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                fontSize: "0.85rem",
                                lineHeight: "1.4",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                                maxWidth: "320px",
                                whiteSpace: "normal",
                              }}
                            >
                              {wrapTextEveryNChars(selectedClaim.receiptName, 20).map((line, idx) => (
                                <div key={idx}>{line}</div>
                              ))}
                            </div>
                          </span>
                        ) : (
                          "No Receipt"
                        )}


                      </p>
                    </div>
                  </div>
                </div>
                <div className="detail-list-item action-item-list">
                  <div className="item-icon-box"><FiHash /></div>
                  <div className="item-content" style={{ width: '100%' }}>
                    <label>Review Actions</label>
                    <div className="action-buttons" style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(selectedClaim.id)}
                        style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                      >
                        Approve Claim
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectClick(selectedClaim.id)}
                        style={{ flex: 1, padding: "10px", backgroundColor: "#f87171", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                      >
                        Reject Claim
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer-v2">
              <button className="modal-close-btn" onClick={handleCloseDetailModal}>Close Window</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default FinanceDashboard;
