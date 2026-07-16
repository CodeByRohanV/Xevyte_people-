import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api";
import "./Grievance.css";
import { FiEye, FiDownload, FiX, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight, FiFilter, FiBriefcase, FiClock, FiCheckSquare, FiArchive, FiSearch } from "react-icons/fi";

const statusOptions = ["Submitted", "In Review", "Action Taken", "Closed"];

const formatDateShort = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
};

export default function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dbCategories, setDbCategories] = useState([]);
  const [page, setPage] = useState(0);

  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [pageData, setPageData] = useState(null);

  const [selectedGrievanceId, setSelectedGrievanceId] = useState("");
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [updateStatus, setUpdateStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [stats, setStats] = useState({ total: 0, submitted: 0, inReview: 0, closed: 0 });

  // Preview state
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [fileType, setFileType] = useState("");

  const loadStats = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await api.get("/admin/grievances/reports", {
        params: {
          category: categoryFilter || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const all = res.data || [];
      setStats({
        total: all.length,
        submitted: all.filter(g => g.status === 'Submitted').length,
        inReview: all.filter(g => g.status === 'In Review' || g.status === 'Action Taken').length,
        closed: all.filter(g => g.status === 'Closed').length
      });
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, [categoryFilter]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/v1/all-categories/all");
        const data = res.data;
        const cats = [...new Set(data.filter(x => x.grievanceCategory).map(x => x.grievanceCategory))];
        setDbCategories(cats);
      } catch (err) {
        console.error("Error loading categories", err);
      }
    };
    loadCategories();
  }, []);

  const loadList = async () => {
    setListError("");
    setListLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await api.get("/admin/grievances", {
        params: {
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          page,
          size: 10,
          sort: "createdDate,desc",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let content = res.data.content || [];
      setPageData({ ...res.data, content });
    } catch (err) {
      setListError(err.response?.data?.message || err.message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [statusFilter, categoryFilter, page]);

  const handleSelectGrievance = async (id) => {
    setSelectedGrievanceId(id);
    setDetailError("");
    setUpdateMessage("");
    setDetailLoading(true);

    const token = sessionStorage.getItem("token");

    try {
      const res = await api.get(
        `/admin/grievances/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedGrievance(res.data);
      setUpdateStatus(res.data.status || "");
      setUpdateNotes(res.data.investigationNotes || "");
      setIsModalOpen(true);
    } catch (err) {
      setDetailError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load grievance details"
      );
    } finally {
      setDetailLoading(false);
    }
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGrievance(null);
    setSelectedGrievanceId("");
    setDetailError("");
    setUpdateMessage("");
    // Clean up preview state
    if (previewFile) {
      URL.revokeObjectURL(previewFile);
      setPreviewFile(null);
    }
    setIsPreviewModalOpen(false);
    setPreviewFileName("");
    setFileType("");
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await api.put(`/admin/grievances/${encodeURIComponent(selectedGrievanceId)}`, {
        status: updateStatus,
        investigationNotes: updateNotes || null,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSelectedGrievance(res.data);
      alert("Updated successfully.");
      setUpdateMessage(""); // Clear UI message since we show alert
      loadList();
      loadStats();
      handleCloseModal();
    } catch (err) {
      setDetailError(err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadAttachment = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await api.get(`/admin/grievances/${encodeURIComponent(selectedGrievanceId)}/attachment`, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Get filename from headers
      const contentDisposition = response.headers['content-disposition'];
      const contentType = response.headers['content-type'];
      let fileName = `grievance_${selectedGrievanceId}_attachment`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          fileName = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Use Content-Type from backend
      const mimeType = contentType || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setDetailError("Attachment not found or failed to download.");
    }
  };

  const handlePreview = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return alert("Authorization required.");

    try {
      console.log("Fetching attachment for grievance:", selectedGrievanceId);

      const response = await api.get(`/admin/grievances/${encodeURIComponent(selectedGrievanceId)}/attachment`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      });

      console.log("Response received:", {
        status: response.status,
        headers: response.headers,
        dataLength: response.data?.byteLength
      });

      // Try to get filename and content type from headers
      const contentDisposition = response.headers['content-disposition'];
      const contentType = response.headers['content-type'];
      let fileName = `grievance_${selectedGrievanceId}_attachment`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          fileName = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      console.log("File details:", { fileName, contentType, contentDisposition });

      // Use Content-Type from backend as primary source (it's already correct after decryption)
      let mimeType = contentType || 'application/octet-stream';

      // Only use file extension as fallback if content type is generic
      if (mimeType === 'application/octet-stream') {
        const fileExtension = fileName.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') {
          mimeType = 'application/pdf';
        } else if (['jpg', 'jpeg'].includes(fileExtension)) {
          mimeType = 'image/jpeg';
        } else if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
      }

      console.log("Creating blob with MIME type:", mimeType);
      const blob = new Blob([response.data], { type: mimeType });
      console.log("Blob created:", { size: blob.size, type: blob.type });

      const fileUrl = URL.createObjectURL(blob);
      console.log("Blob URL created:", fileUrl);

      const detectedFileType = mimeType.includes('pdf') ? 'pdf' : 'image';
      console.log("File type detected:", detectedFileType);

      setFileType(detectedFileType);
      setPreviewFile(fileUrl);
      setPreviewFileName(fileName);
      setIsPreviewModalOpen(true);

    } catch (err) {
      console.error("Error viewing document:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      setDetailError('Failed to load document for preview.');
    }
  };

  const handleClosePreviewModal = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile);
    }
    setPreviewFile(null);
    setIsPreviewModalOpen(false);
    setPreviewFileName("");
    setFileType("");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Submitted': return 'status-submitted';
      case 'In Review': return 'status-in-review';
      case 'Action Taken': return 'status-action-taken';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  };

  return (
    <div className="grievance-admin-container">
      {/* Stats Section */}
      <div className="grievance-stats-grid">
        <div className="grievance-stat-card total">
          <div className="stat-icon-wrapper"><FiBriefcase /></div>
          <div className="stat-content">
            <span className="stat-label">Total Grievances</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="grievance-stat-card pending">
          <div className="stat-icon-wrapper"><FiClock /></div>
          <div className="stat-content">
            <span className="stat-label">Pending Review</span>
            <span className="stat-value">{stats.submitted}</span>
          </div>
        </div>
        <div className="grievance-stat-card active">
          <div className="stat-icon-wrapper"><FiCheckSquare /></div>
          <div className="stat-content">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats.inReview}</span>
          </div>
        </div>
        <div className="grievance-stat-card closed">
          <div className="stat-icon-wrapper"><FiArchive /></div>
          <div className="stat-content">
            <span className="stat-label">Closed</span>
            <span className="stat-value">{stats.closed}</span>
          </div>
        </div>
      </div>

      <div className="grievance-card admin-table-card">
        <div className="grievance-admin-controls" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="filter-item">
            <FiFilter className="filter-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => { setPage(0); setCategoryFilter(e.target.value); }}
              className="grievance-select-filter"
            >
              <option value="">All Categories</option>
              {dbCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <FiFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
              className="grievance-select-filter"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {listError && (
          <div className="grievance-message-banner error">
            <FiAlertCircle /> {listError}
          </div>
        )}

        <div className="grievance-table-wrapper premium-scroll">
          <table className="grievance-premium-table">
            <thead>
              <tr>
                <th>Grievance Info</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date Submitted</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                  <div className="grievance-loading-spinner-container">
                    <div className="grievance-loading-spinner"></div>
                    <p>Loading grievances...</p>
                  </div>
                </td></tr>
              ) : pageData?.content?.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                  <div className="no-data-msg">
                    <FiSearch style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No grievances found matching your criteria.</p>
                  </div>
                </td></tr>
              ) : (
                pageData?.content?.map((g) => (
                  <tr key={g.grievanceId}>
                    <td className="grievance-id-cell" data-label="Grievance">
                      <div className="id-badge">{g.grievanceId}</div>
                      <div className="subject-line">{g.subject}</div>
                    </td>
                    <td data-label="Category"><span className="category-pill">{g.category}</span></td>
                    <td data-label="Status">
                      <span className={`status-pill ${getStatusClass(g.status)}`}>
                        <span className="dot"></span>
                        {g.status}
                      </span>
                    </td>
                    <td className="date-cell" data-label="Submitted">{formatDateShort(g.createdDate)}</td>
                    <td style={{ textAlign: 'center' }} data-label="Actions">
                      <button onClick={() => handleSelectGrievance(g.grievanceId)} className="action-btn-view">
                        <FiEye /> <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pageData && pageData.totalPages > 1 && (
        <div className="grievance-pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="grievance-pagination-btn">
            <FiChevronLeft /> Previous
          </button>
          <span className="grievance-pagination-info">
            Page {pageData.number + 1} of {pageData.totalPages}
          </span>
          <button disabled={pageData.last} onClick={() => setPage(page + 1)} className="grievance-pagination-btn">
            Next <FiChevronRight />
          </button>
        </div>
      )}

      {isModalOpen && selectedGrievance && (
        <div className="grievance-modal-overlay" onClick={handleCloseModal}>
          <div className="grievance-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="grievance-modal-header">
              <h2 className="grievance-modal-title">Grievance Details</h2>
              <button className="grievance-modal-close" onClick={handleCloseModal}><FiX /></button>
            </div>

            {detailLoading ? (
              <div className="grievance-loading-spinner-container"><div className="grievance-loading-spinner"></div></div>
            ) : (
              <>
                <div className="grievance-detail-grid">
                  <div className="grievance-detail-item">
                    <span className="grievance-detail-label">Grievance ID</span>
                    <span className="grievance-detail-value">{selectedGrievance.grievanceId}</span>
                  </div>
                  <div className="grievance-detail-item">
                    <span className="grievance-detail-label">Status</span>
                    <span className={`grievance-status ${getStatusClass(selectedGrievance.status)}`} style={{ width: 'fit-content' }}>
                      {selectedGrievance.status}
                    </span>
                  </div>
                  <div className="grievance-detail-item">
                    <span className="grievance-detail-label">Category</span>
                    <span className="grievance-detail-value">{selectedGrievance.category}</span>
                  </div>
                  <div className="grievance-detail-item">
                    <span className="grievance-detail-label">Type</span>
                    <span className="grievance-detail-value">{selectedGrievance.type || "N/A"}</span>
                  </div>
                  <div className="grievance-detail-item full-width">
                    <span className="grievance-detail-label">Subject</span>
                    <span className="grievance-detail-value">{selectedGrievance.subject}</span>
                  </div>
                  <div className="grievance-detail-item full-width">
                    <span className="grievance-detail-label">Description</span>
                    <div className="grievance-description-box">{selectedGrievance.description}</div>
                  </div>
                  {selectedGrievance.hasAttachment && (
                    <div className="grievance-detail-item full-width">
                      <span className="grievance-detail-label">Attachment</span>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={handlePreview} className="grievance-btn grievance-btn-outline" style={{ width: 'fit-content' }}>
                          Preview
                        </button>
                        <button onClick={handleDownloadAttachment} className="grievance-btn grievance-btn-outline" style={{ width: 'fit-content' }}>
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grievance-detail-item">
                    <span className="grievance-detail-label">Created On</span>
                    <span className="grievance-detail-value">{formatDateShort(selectedGrievance.createdDate)}</span>
                  </div>
                  <div className="grievance-detail-item">
                    <span className="grievance-detail-label">Last Updated</span>
                    <span className="grievance-detail-value">{formatDateShort(selectedGrievance.updatedDate)}</span>
                  </div>
                </div>

                <div className="grievance-card" style={{ border: '1px solid #ccfbf1', background: '#f0fdfa', marginTop: '1.5rem', padding: '1.5rem' }}>
                  <h3 style={{ color: '#0f766e', fontWeight: 800, marginBottom: '1rem', marginTop: 0 }}>Update Grievance</h3>

                  <div className="grievance-form-grid">
                    <div className="grievance-form-group">
                      <label className="grievance-label">New Status</label>
                      <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} className="grievance-input full-width">
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="grievance-form-group full-width">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <label className="grievance-label" style={{ margin: 0 }}>Investigation Notes (Internal)</label>
                        <span style={{ fontSize: "11px", color: (updateNotes || "").length >= 255 ? "#ef4444" : "#64748b", fontWeight: "600" }}>
                          {(updateNotes || "").length}/255 characters
                        </span>
                      </div>
                      <textarea
                        value={updateNotes}
                        onChange={(e) => setUpdateNotes(e.target.value)}
                        maxLength="255"
                        rows={3}
                        className="grievance-input full-width textarea"
                        placeholder="Add investigation notes here..."
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button disabled={updating} onClick={handleUpdate} className="grievance-btn grievance-btn-primary" style={{ minWidth: '150px' }}>
                      {updating ? 'Updating...' : 'Save Changes'}
                    </button>
                  </div>

                  {updateMessage && (
                    <div className="grievance-message-banner" style={{ backgroundColor: '#dcfce7', color: '#166534', marginTop: '1rem', marginBottom: 0 }}>
                      <FiCheckCircle /> {updateMessage}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && createPortal(
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
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: '600' }}>
                Document Preview: {previewFileName}
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
                <FiX size={24} />
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
      )}
    </div>
  );
}
