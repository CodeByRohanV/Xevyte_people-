import React, { useState, useEffect, useRef } from 'react';
import './Saveddrafts.css';
import { useNavigate } from 'react-router-dom';
import "./Dashboard.css";
import axios from 'axios';

import api from "../api";
import ReactDOM from 'react-dom';
import ToastNotification from '../components/ToastNotification';

function Saveddrafts({ onActionComplete }) {
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [role, setRole] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const token = sessionStorage.getItem('token'); // JWT from sessionStorage

  /* ---------------- TOAST STATE ---------------- */
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
  const showToast = (msg, type = 'success') => setToast({ open: true, message: msg, type });
  const closeToast = () => setToast(t => ({ ...t, open: false }));

  /* ---------------- CONFIRM DELETE MODAL STATE ---------------- */
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(null);  // holds draft object
  const [confirmDeleteSingle, setConfirmDeleteSingle] = useState(null); // holds single draftItem

  /* ---------------- PREVIEW MODAL STATE ---------------- */
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // Fetch all drafts for the employee
  const fetchDrafts = () => {
    const empId = sessionStorage.getItem("employeeId");
    if (empId && token) {

      api.get(`/claims/drafts/${empId}`, {

        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          // Group drafts by claimGroupId
          const draftsData = res.data;
          const groupedDrafts = {};
          const solitaryDrafts = [];

          draftsData.forEach(draft => {
            if (draft.claimGroupId) {
              if (!groupedDrafts[draft.claimGroupId]) {
                groupedDrafts[draft.claimGroupId] = [];
              }
              groupedDrafts[draft.claimGroupId].push(draft);
            } else {
              solitaryDrafts.push(draft);
            }
          });

          // Convert groups to displayable objects
          const groupDisplayItems = Object.values(groupedDrafts).map(group => {
            const first = group[0];
            const totalAmount = group.reduce((sum, d) => sum + (d.amount || 0), 0);
            return {
              ...first,
              expenseId: first.expenseId, // Use first ID for display key
              description: group.length > 1
                ? `${first.description || 'Draft'} (+${group.length - 1} more)`
                : first.description,
              amount: totalAmount.toFixed(2), // Total amount
              isGroup: true,
              groupId: first.claimGroupId,
              groupSize: group.length,
              originalGroup: group
            };
          });

          const allDisplayDrafts = [...solitaryDrafts, ...groupDisplayItems].sort((a, b) => b.expenseId - a.expenseId);
          setDrafts(allDisplayDrafts);
        })
        .catch(err => {
          console.error('Failed to fetch drafts:', err);
          setMessage('Error fetching drafts.');
        });
    }
  };

  // Truncate long file names for display
  const truncateFileName = (fileName, length = 10) => {
    if (!fileName) return "No Receipt";
    return fileName.length > length ? `${fileName.substring(0, length)}...` : fileName;
  };

  const handleDownload = async (expenseId, fileName) => {
    if (!token) return showToast("Authorization required.", "error");

    try {
      const response = await api.get(
        `/claims/draft/receipt/${expenseId}?disposition=attachment`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const blob = response.data;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error('Download failed:', message);
      showToast("Failed to download the file. Please try again.", "error");
    }
  };

  const handlePreview = async (expenseId, fileName) => {
    if (!token) return showToast("Authorization required.", "error");

    try {
      const response = await api.get(
        `/claims/draft/receipt/${expenseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer',
        }
      );

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
      setPreviewFileName(fileName);
      setIsPreviewModalOpen(true);

    } catch (err) {
      console.error("Error viewing document:", err);
      showToast('Failed to load document for preview.', 'error');
    }
  };

  const handleClosePreviewModal = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile);
    }
    setIsPreviewModalOpen(false);
    setPreviewFile(null);
    setFileType("");
    setPreviewFileName("");
  };


  // Delete draft — opens custom confirm modal
  const handleDelete = (draft) => {
    if (!token) return showToast("Authorization required.", "error");
    setConfirmDeleteDraft(draft);
  };

  const confirmDeleteDraftAction = () => {
    const draft = confirmDeleteDraft;
    setConfirmDeleteDraft(null);

    const idsToDelete = draft.isGroup ? draft.originalGroup.map(d => d.expenseId) : [draft.expenseId];

    Promise.all(idsToDelete.map(id =>
      api.delete(`/claims/draft/delete/${id}`, { headers: { "Authorization": `Bearer ${token}` } })
    ))
      .then(() => {
        setDrafts(prev => prev.filter(d => d.expenseId !== draft.expenseId));
        alert("Draft deleted successfully.");
        if (onActionComplete) onActionComplete();
      })
      .catch(err => {
        console.error("Error deleting draft:", err);
        showToast("Error deleting draft. Please try again.", "error");
      });
  };

  // Edit draft
  const handleEdit = (draft) => {
    if (draft.isGroup) {
      navigate('/Claims', { state: { activeTab: 'New Claim', groupId: draft.groupId } });
    } else {
      navigate('/Claims', { state: { activeTab: 'New Claim', draftId: draft.expenseId } });
    }
  };

  // Filter drafts based on search
  const filteredDrafts = drafts.filter(draft => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return (
      String(draft.expenseId).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.description?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.category?.toLowerCase().includes(lowercasedSearchTerm) ||
      String(draft.amount).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.date?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.businessPurpose?.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.additionalNotes?.toLowerCase().includes(lowercasedSearchTerm)
    );
  });


  useEffect(() => {
    const empId = sessionStorage.getItem("employeeId");
    const rawToken = sessionStorage.getItem("token");
    let token = rawToken;

    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }

    setEmployeeId(empId);
    setEmployeeName(sessionStorage.getItem("employeeName"));
    setRole(sessionStorage.getItem("role"));

    fetchDrafts();

    if (empId && token) {
      const fetchProfile = async () => {
        try {
          const response = await api.get(`/profile/${empId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = response.data;
          setProfilePic(data.profilePic);
          setEmployeeName(data.name);

        } catch (err) {
          const message = err.response?.data?.message || err.message;
          console.error("Profile fetch failed:", message);
        }
      };

      fetchProfile();
    }
  }, []);


  const [selectedDraftGroup, setSelectedDraftGroup] = useState(null);

  // Handle View (Opens Modal)
  const handleView = (draft) => {
    setSelectedDraftGroup(draft);
  };

  const closeViewModal = () => {
    setSelectedDraftGroup(null);
  };

  // Edit All
  const handleEditAll = () => {
    if (selectedDraftGroup) {
      handleEdit(selectedDraftGroup);
    }
  };

  // Delete All — opens custom confirm modal
  const handleDeleteAll = () => {
    if (selectedDraftGroup) {
      setConfirmDeleteDraft(selectedDraftGroup);
      closeViewModal();
    }
  };

  const handleEditSingle = (draftItem) => {
    navigate('/Claims', { state: { activeTab: 'New Claim', draftId: draftItem.expenseId } });
  };

  // Delete Single (from modal) — opens custom confirm modal
  const handleDeleteSingle = (draftItem) => {
    if (!token) return showToast("Authorization required.", "error");
    setConfirmDeleteSingle(draftItem);
  };

  const confirmDeleteSingleAction = () => {
    const draftItem = confirmDeleteSingle;
    setConfirmDeleteSingle(null);

    api.delete(`/claims/draft/delete/${draftItem.expenseId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(() => {
        if (selectedDraftGroup.isGroup) {
          const newGroup = selectedDraftGroup.originalGroup.filter(d => d.expenseId !== draftItem.expenseId);
          if (newGroup.length === 0) {
            setDrafts(prev => prev.filter(d => d.expenseId !== selectedDraftGroup.expenseId));
            closeViewModal();
          } else {
            const newFirst = newGroup[0];
            const totalAmount = newGroup.reduce((sum, d) => sum + (d.amount || 0), 0);
            const updatedGroupDraft = {
              ...newFirst,
              expenseId: newFirst.expenseId,
              description: newGroup.length > 1
                ? `${newFirst.description || 'Draft'} (+${newGroup.length - 1} more)`
                : newFirst.description,
              amount: totalAmount.toFixed(2),
              isGroup: true,
              groupId: newFirst.claimGroupId,
              groupSize: newGroup.length,
              originalGroup: newGroup
            };
            setDrafts(prev => prev.map(d => d.groupId === selectedDraftGroup.groupId ? updatedGroupDraft : d));
            setSelectedDraftGroup(updatedGroupDraft);
          }
        } else {
          setDrafts(prev => prev.filter(d => d.expenseId !== draftItem.expenseId));
          closeViewModal();
        }
        alert("Draft deleted successfully.");
        if (onActionComplete) onActionComplete();
      })
      .catch(err => {
        console.error("Error deleting draft:", err);
        showToast("Error deleting draft. Please try again.", "error");
      });
  };


  return (
    <div style={{ padding: "0" }}>
      <div className="tableas-scroll">
        {filteredDrafts.length === 0 ? (
          <p>
            {drafts.length === 0 ? "No drafts saved yet." : "No matching drafts found for your search criteria."}
          </p>
        ) : (
          <table className="draftss-table transparent-table">
            <thead>
              <tr className="columns-header">
                <th>Draft ID</th>
                <th>Amount</th>
                <th>Expense Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.map(draft => (
                <tr key={draft.expenseId}>
                  <td style={{ backgroundColor: 'transparent', textAlign: 'center' }}>
                    {draft.expenseId}
                  </td>
                  <td style={{ backgroundColor: 'transparent' }}>₹{draft.amount}</td>
                  <td style={{ backgroundColor: 'transparent' }}>{formatDate(draft.date)}</td>
                  <td style={{ backgroundColor: 'transparent', }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleView(draft)}
                        className="view-claim-btn"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal — rendered via portal so it sits at document.body level */}
      {selectedDraftGroup && ReactDOM.createPortal(
        <div className="summary-modal-overlay" onClick={closeViewModal} style={{ zIndex: 100000 }}>
          <div className="summary-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', borderRadius: '8px' }}>
            <div className="summary-card-header">
              <span className="summary-card-title">Draft Details {selectedDraftGroup.isGroup ? `(${selectedDraftGroup.groupSize} Items)` : ''}</span>
              <button className="close-modal-btn" onClick={closeViewModal}>×</button>
            </div>

            <div className="summary-card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

               {/* Bulk Actions Header */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <button 
                  onClick={handleEditAll} 
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '15px', 
                    fontWeight: 'normal', 
                    color: '#00B3A4', 
                    border: '1.5px solid #00B3A4', 
                    background: 'transparent', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 179, 164, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Edit All
                </button>
                <button 
                  onClick={handleDeleteAll} 
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '15px', 
                    fontWeight: 'normal', 
                    color: '#dc3545', 
                    border: '1.5px solid #dc3545', 
                    background: 'transparent', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Delete All
                </button>
              </div>

              {/* Items List */}
              {(selectedDraftGroup.isGroup ? selectedDraftGroup.originalGroup : [selectedDraftGroup]).map((item, idx) => (
                <div key={item.expenseId} style={{
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px' }}>Claim #{idx + 1}</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditSingle(item)}
                        style={{ background: 'transparent', border: 'none', color: '#00B3A4', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#00968A'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#00B3A4'}
                        title="Edit Claim"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSingle(item)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                        title="Delete Claim"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '15px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '15px' }}>Description</span>
                      <span style={{ color: '#334155' }}>{item.description}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '15px' }}>Category</span>
                      <span style={{ color: '#334155' }}>{item.category}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '15px' }}>Amount</span>
                      <span style={{ color: '#334155', fontWeight: 'normal' }}>₹{item.amount}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '15px' }}>Date</span>
                      <span style={{ color: '#334155' }}>{formatDate(item.date)}</span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '15px' }}>Receipt</span>
                      {item.receiptName ? (
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <button
                            onClick={() => handleDownload(item.expenseId, item.receiptName)}
                            style={{
                              cursor: "pointer",
                              color: "#14b8a6",
                              background: "none",
                              border: "none",
                              padding: 0,
                              fontWeight: 'normal',
                              fontSize: '15px',
                              textDecoration: 'underline'
                            }}
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handlePreview(item.expenseId, item.receiptName)}
                            style={{
                              cursor: "pointer",
                              color: "#3b82f6",
                              background: "none",
                              border: "none",
                              padding: 0,
                              fontWeight: 'normal',
                              fontSize: '15px',
                              textDecoration: 'underline'
                            }}
                          >
                            Preview
                          </button>
                        </div>
                      ) : <span style={{ color: '#94a3b8' }}>No receipt</span>}
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '15px', textAlign: 'right', fontWeight: 'normal', fontSize: '15px', color: '#0f172a' }}>
                Total Amount: ₹{selectedDraftGroup.amount}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PREVIEW MODAL */}
      {isPreviewModalOpen && ReactDOM.createPortal(
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
          zIndex: 200000
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
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: 'normal' }}>
                Receipt Preview: {previewFileName}
              </h3>
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
                onClick={handleClosePreviewModal}
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
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Confirm Delete (whole group or row table) ── */}
      {confirmDeleteDraft !== null && ReactDOM.createPortal(
        <ConfirmDeleteModal
          title="Delete Draft?"
          message="Are you sure you want to delete this draft? This action cannot be undone."
          onConfirm={confirmDeleteDraftAction}
          onCancel={() => setConfirmDeleteDraft(null)}
        />,
        document.body
      )}

      {/* ── Confirm Delete Single item inside modal ── */}
      {confirmDeleteSingle !== null && ReactDOM.createPortal(
        <ConfirmDeleteModal
          title="Delete this claim?"
          message="Are you sure you want to delete this claim entry? This action cannot be undone."
          onConfirm={confirmDeleteSingleAction}
          onCancel={() => setConfirmDeleteSingle(null)}
        />,
        document.body
      )}

      {/* Top-right toast */}
      <ToastNotification
        isOpen={toast.open}
        onClose={closeToast}
        message={toast.message}
        type={toast.type}
      />

    </div>
  );
}

/* ── Reusable styled confirm modal ── */
function ConfirmDeleteModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 999998,
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '28px 28px 24px',
        maxWidth: '380px', width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', textAlign: 'center',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          backgroundColor: '#fef2f2', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 'normal', color: '#1a1a2e' }}>
          {title}
        </h4>
        <p style={{ margin: '0 0 22px', fontSize: '15px', color: '#666', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 22px', borderRadius: '8px', border: '1px solid #d1d5db',
              backgroundColor: '#fff', color: '#374151', fontSize: '15px',
              fontWeight: 'normal', cursor: 'pointer',
            }}
          >
            No, Keep It
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 22px', borderRadius: '8px', border: 'none',
              backgroundColor: '#ef4444', color: '#fff', fontSize: '15px',
              fontWeight: 'normal', cursor: 'pointer',
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default Saveddrafts;
