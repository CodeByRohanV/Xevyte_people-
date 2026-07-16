import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { formatDateToIST } from '../utils/DateUtils';
import './HRDashboard.css';
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

function HRDashboard({ embedded, employeeId: propEmployeeId, refreshTrigger, onActionComplete, statusFilter = 'All', onDataLoaded }) {
  const [claims, setClaims] = useState([]);
  const [originalClaims, setOriginalClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName") || "");
  const [searchTerm, setSearchTerm] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupedClaims, setGroupedClaims] = useState({});

  // State variables for receipt preview
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [validationErrors, setValidationErrors] = React.useState({});
  const [allocationErrors, setAllocationErrors] = React.useState([]);
  const employeeId = sessionStorage.getItem("employeeId");

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
    const storedName = sessionStorage.getItem("employeeName");
    setEmployeeName(storedName);
    const effectiveId = propEmployeeId || employeeId;
    if (effectiveId) {
      fetchHRClaims(effectiveId);
      fetchProfileInfo(effectiveId);
    }
  }, [employeeId, propEmployeeId, refreshTrigger]);

  const fetchHRClaims = (hrId) => {
    setLoading(true);
    const token = sessionStorage.getItem("token");
    api
      .get(`/claims/hr/${hrId}`, {

        headers: { Authorization: `Bearer ${token}` },
      })

      .then((response) => {
        const fetchedClaims = response.data;
        const sortedClaims = fetchedClaims.sort((a, b) => b.id - a.id);
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

  const fetchProfileInfo = async (empId) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.warn("No token found. Cannot fetch profile info.");
      return;
    }

    try {
      const response = await api.get(`/profile/${empId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add JWT token
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

  const handleUpdateStatus = async (claimId, newStatus) => {
    const token = sessionStorage.getItem("token");

    // ✅ CENTER BROWSER CONFIRM POPUP
    const confirmed = window.confirm(
      `Are you sure you want to update the claim status to "${newStatus}"?`
    );

    if (!confirmed) {
      return; // ❌ user clicked Cancel
    }

    try {
      await api.put(
        `/claims/hr/update-status/${claimId}?status=${newStatus}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ CENTER BROWSER ALERT AFTER SUCCESS
      alert(`Claim status successfully updated to "${newStatus}"`);
      if (onActionComplete) onActionComplete();

      handleCloseDetailModal();

      if (newStatus === "Paid") {
        setClaims(prev => prev.filter(c => c.id !== claimId));
        setOriginalClaims(prev => prev.filter(c => c.id !== claimId));

        if (selectedGroup) {
          const updatedClaims = selectedGroup.claims.filter(c => c.id !== claimId);
          if (updatedClaims.length === 0) {
            handleCloseBulkModal();
          } else {
            setSelectedGroup({
              ...selectedGroup,
              claims: updatedClaims,
              totalAmount: updatedClaims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
            });
          }
        }
      } else {
        const updateFn = c => (c.id === claimId ? { ...c, status: newStatus } : c);
        setClaims(prev => prev.map(updateFn));
        setOriginalClaims(prev => prev.map(updateFn));

        if (selectedGroup) {
          setSelectedGroup({
            ...selectedGroup,
            claims: selectedGroup.claims.map(updateFn)
          });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update claim status");
    }
  };

  const handleDownloadReceipt = (id, receiptName) => {
    const token = sessionStorage.getItem("token");
    api
      .get(`/claims/receipt/${id}`, {

        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      })

      .then((res) => {
        const fileURL = window.URL.createObjectURL(new Blob([res.data]));
        const fileLink = document.createElement("a");
        fileLink.href = fileURL;
        fileLink.setAttribute("download", receiptName);
        document.body.appendChild(fileLink);
        fileLink.click();
        fileLink.remove();
        window.URL.revokeObjectURL(fileURL);
      })
      .catch((err) => console.error("Error fetching receipt for download:", err));
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
      alert("Rejection reason must be between 10 and 100 characters.");
      return;
    }

    try {
      setLoading(true);
      for (const claim of groupClaims) {
        await api.post(`/claims/reject/${claim.id}?reason=${encodeURIComponent(reason)}&role=HR`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      alert(`Successfully rejected ${count} claims`);
      fetchHRClaims(employeeId);
      handleCloseBulkModal();
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Bulk rejection failed:", error);
      alert("Failed to reject some claims. Please try again.");
    } finally {
      setLoading(false);
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
      alert("Rejection reason must be between 10 and 100 characters.");
      return;
    }

    try {
      await api.post(`/claims/reject/${claimId}?reason=${encodeURIComponent(reason)}&role=HR`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Claim rejected successfully");

      // Update local state to reflect change immediately
      if (selectedGroup) {
        const updatedClaims = selectedGroup.claims.filter(c => c.id !== claimId);
        if (updatedClaims.length === 0) {
          handleCloseBulkModal();
        } else {
          setSelectedGroup({
            ...selectedGroup,
            claims: updatedClaims,
            totalAmount: updatedClaims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
          });
        }
      }

      fetchHRClaims(employeeId);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Error rejecting claim:", error);
      alert("Failed to reject claim");
    }
  };

  const handleBulkUpdateStatus = async (groupClaims, newStatus) => {
    const token = sessionStorage.getItem("token");
    const count = groupClaims.length;
    const confirmed = window.confirm(`Are you sure you want to update ${count} claims to "${newStatus}"?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      for (const claim of groupClaims) {
        await api.put(`/claims/hr/update-status/${claim.id}?status=${newStatus}`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      alert(`Successfully updated ${count} claims to "${newStatus}"`);
      fetchHRClaims(employeeId);
      handleCloseBulkModal();
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Bulk update failed:", error);
      alert("Failed to update some claims. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <td style={{ backgroundColor: "transparent", color: "#334155" }}>{group.employeeId}</td>
            <td style={{ backgroundColor: "transparent", color: "#334155" }}>{group.name}</td>
            <td style={{ backgroundColor: "transparent", color: "#334155" }}>{group.claims.length}</td>
            <td style={{ backgroundColor: "transparent", color: "#334155" }}>₹{group.totalAmount.toLocaleString()}</td>
            <td style={{ backgroundColor: "transparent", color: "#334155" }}>
              {formatDateToIST(group.lastSubmitted)}
            </td>
            <td style={{ backgroundColor: "transparent", textAlign: 'center', color: "#334155" }}>
              <div
                className="view-action-btn"
                onClick={() => handleOpenBulkModal(group)}
              >
                <FiEye size={16} style={{ flexShrink: 0 }} />
              </div>
            </td>
          </tr>
        ))}

        {isBulkModalOpen && selectedGroup && ReactDOM.createPortal(
          <div className="history-detail-modal-overlay">
            <div className="history-detail-modal-card" style={{ maxWidth: '1000px', width: '90%' }}>
              <div className="modal-header-v2">
                <div className="header-title-group">
                  <h3>Review Claims - {selectedGroup.name} ({selectedGroup.employeeId})</h3>
                </div>
                <button className="close-x-btn" onClick={handleCloseBulkModal}>&times;</button>
              </div>
              <div className="modal-body-v2" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.25rem' }}>
                <div className="bulk-review-summary">
                  <div className="summary-stats">
                    <div className="summary-stat-item">
                      <span className="summary-stat-label"><FiFileText size={14} style={{ marginRight: '6px' }} /> Total Claims</span>
                      <span className="summary-stat-value">{selectedGroup.claims.length}</span>
                    </div>
                    <div className="summary-stat-item">
                      <span className="summary-stat-label"><span style={{ marginRight: '6px', fontWeight: 'bold' }}>₹</span> Total Pending</span>
                      <span className="summary-stat-value highlight">₹{selectedGroup.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bulk-action-group">
                    <button
                      className="bulk-approve-btn"
                      style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', boxShadow: '0 8px 15px -3px rgba(251, 191, 36, 0.3)' }}
                      onClick={() => handleBulkUpdateStatus(selectedGroup.claims, 'Initiated')}
                    >
                      Initiated
                    </button>
                    <button
                      className="bulk-approve-btn"
                      style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)', boxShadow: '0 8px 15px -3px rgba(96, 165, 250, 0.3)' }}
                      onClick={() => handleBulkUpdateStatus(selectedGroup.claims, 'Payment in Process')}
                    >
                      In Process
                    </button>
                    <button
                      className="bulk-approve-btn"
                      onClick={() => handleBulkUpdateStatus(selectedGroup.claims, 'Paid')}
                    >
                      <FiCheckCircle size={18} />
                      Mark Paid
                    </button>
                  </div>
                </div>

                <div className="bulk-table-container">
                  <table className="status-table">
                    <thead>
                      <tr>
                        <th><FiTag style={{ marginRight: '6px' }} /> CATEGORY</th>
                        <th><span style={{ marginRight: '6px', fontWeight: 'bold' }}>₹</span>AMOUNT</th>
                        <th>DATE</th>
                        <th style={{ textAlign: 'center' }}>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroup.claims.map(claim => (
                        <tr key={claim.id}>
                          <td style={{ fontWeight: '600', color: '#1e293b' }}>{claim.category}</td>
                          <td style={{ fontWeight: '800', color: '#0d9488' }}>₹{claim.amount.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>{formatDateToIST(claim.expenseDate)}</td>
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
          </div >,
          document.body
        )
        }

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

        {
          isDetailModalOpen && selectedClaim && ReactDOM.createPortal(
            <div className="history-detail-modal-overlay">
              <div className="history-detail-modal-card">
                <div className="modal-header-v2">
                  <div className="header-title-group">
                    <h3>Claim Details - #{selectedClaim.id}</h3>
                  </div>
                  <div className="header-actions">
                    <button
                      className="close-x-btn"
                      onClick={handleCloseDetailModal}
                    >
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
                            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
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
                                  textDecoration: 'underline',
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px"
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
                                  textDecoration: 'underline',
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px"
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
                    <div className="detail-list-item action-item-list">
                      <div className="item-icon-box">
                        <FiTarget />
                      </div>
                      <div className="detail-list-item">
                        <div className="item-content">
                          <label>Current Status</label>
                          <p
                            style={{
                              fontWeight: "700",
                              color:
                                selectedClaim.status === "Paid"
                                  ? "#16a34a"
                                  : selectedClaim.status === "Rejected"
                                    ? "#dc2626"
                                    : "#0f766e",
                            }}
                          >
                            {selectedClaim.status || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="item-content" style={{ width: "100%" }}>
                        <label>HR Status Update</label>
                        <div
                          className="action-buttons"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "10px",
                            marginTop: "8px",
                          }}
                        >
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleUpdateStatus(selectedClaim.id, "Initiated")
                            }
                            style={{
                              padding: "8px",
                              backgroundColor: "#fbbf24",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.8rem",
                            }}
                          >
                            Initiated
                          </button>
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleUpdateStatus(
                                selectedClaim.id,
                                "Payment in Process"
                              )
                            }
                            style={{
                              padding: "8px",
                              backgroundColor: "#60a5fa",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.8rem",
                            }}
                          >
                            In Process
                          </button>
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleUpdateStatus(selectedClaim.id, "Paid")
                            }
                            style={{
                              padding: "8px",
                              background:
                                "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.8rem",
                            }}
                          >
                            Mark Paid
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
            </div>,
            document.body
          )
        }
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
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white', width: '90px' }}>Claim ID</th>
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Employee ID</th>
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Employee Name</th>
                <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Submitted Date</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#f7f9fa' }}>
              {claims.map((claim) => (
                <tr key={claim.id}>
                  <td
                    style={{ backgroundColor: 'transparent', cursor: 'pointer', color: '#14b8a6', fontWeight: 'bold' }}
                    onClick={() => handleOpenDetailModal(claim)}
                  >
                    {claim.id}
                  </td>
                  <td style={{ backgroundColor: 'transparent' }}>{claim.employeeId}</td>
                  <td style={{ backgroundColor: 'transparent' }}>{claim.name}</td>
                  <td style={{ backgroundColor: 'transparent' }}>{formatDateToIST(claim.submittedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Detail Modal */}
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
                  <div className="item-icon-box"><FiTarget /></div>
                  <div className="detail-list-item">

                    <div className="item-content">
                      <label>Current Status</label>
                      <p
                        style={{
                          fontWeight: "700",
                          color:
                            selectedClaim.status === "Paid"
                              ? "#16a34a"
                              : selectedClaim.status === "Rejected"
                                ? "#dc2626"
                                : "#0f766e"
                        }}
                      >
                        {selectedClaim.status || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="item-content" style={{ width: '100%' }}>
                    <label>HR Status Update</label>
                    <div className="action-buttons" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "8px" }}>
                      <button
                        className="approve-btn"
                        onClick={() => handleUpdateStatus(selectedClaim.id, "Initiated")}
                        style={{ padding: "8px", backgroundColor: "#fbbf24", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" }}
                      >
                        Initiated
                      </button>
                      <button
                        className="approve-btn"
                        onClick={() => handleUpdateStatus(selectedClaim.id, "Payment in Process")}
                        style={{ padding: "8px", backgroundColor: "#60a5fa", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" }}
                      >
                        In Process
                      </button>
                      <button
                        className="approve-btn"
                        onClick={() => handleUpdateStatus(selectedClaim.id, "Paid")}
                        style={{ padding: "8px", background: "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" }}
                      >
                        Mark Paid
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

export default HRDashboard;
