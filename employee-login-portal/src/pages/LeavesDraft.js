import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom'; // Added ReactDOM for Portal
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import { FiEdit2, FiTrash2, FiDownload, FiEye } from 'react-icons/fi'; // Added FiEye
import './Leave.css';
import api from "../api";
import { formatDateToIST } from '../utils/DateUtils';

function LeavesDrafts() {
  // Common states for sidebar and top bar
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");
  const [holidays, setHolidays] = useState([]);
  const navigate = useNavigate();


  // States for LeavesDrafts functionality
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState("");

  /* ---------------- PREVIEW MODAL STATE ---------------- */
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");

  const formatDate = (dateString) => {
    return formatDateToIST(dateString);
  };


  /**
   * UPDATED: calculateTotalDays function to conditionally exclude weekends/holidays.
   * Paternity and Maternity leave types now count full calendar days (excluding nothing).
   */
  const calculateTotalDays = (startDate, endDate, holidays, leaveType) => {
    if (!startDate || !endDate) return 0;


    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const currentDate = new Date(start.getTime());


    const fullCalendarLeaveTypes = ['Paternity Leave', 'Maternity Leave'];
    const isFullCalendarLeave = fullCalendarLeaveTypes.includes(leaveType);

    const holidayDates = isFullCalendarLeave
      ? new Set()
      : new Set(holidays.map(h => h.toLocaleDateString('en-CA')));

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const dateString = currentDate.toLocaleDateString('en-CA');

      let shouldCount = true;

      if (!isFullCalendarLeave) {

        if (dayOfWeek === 0 || dayOfWeek === 6 || holidayDates.has(dateString)) {
          shouldCount = false;
        }
      }


      if (shouldCount) {
        count++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  };



  /**
   * UPDATED: draftsWithDays useMemo to pass the draft's leave type.
   */
  const draftsWithDays = useMemo(() => {
    return drafts.map(draft => ({
      ...draft,
      // Pass the draft.type to calculateTotalDays
      totalDays: calculateTotalDays(draft.startDate, draft.endDate, holidays, draft.type),
    }));
  }, [drafts, holidays]);




  useEffect(() => {
    async function loadData() {
      if (!employeeId) return;
      setLoadingDrafts(true);
      setDraftsError("");

      try {
        const token = sessionStorage.getItem("token");

        // First, fetch holidays
        await fetchHolidays(token);

        // Then, fetch drafts using Axios
        const res = await api.get(`/leaves/drafts/${employeeId}`, {

          headers: {
            Authorization: `Bearer ${token}`, // ✅ Include token
          },
        });

        const data = res.data;


        // Ensure data is an array before sorting
        const draftsData = Array.isArray(data) ? data : [];

        // Sort drafts by ID desc
        const sortedDrafts = draftsData.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

        setDrafts(sortedDrafts);
      } catch (err) {
        console.error("Failed to fetch data from backend", err);
        setDrafts([]);
        setDraftsError("Failed to load drafts. Please try again.");
      } finally {
        setLoadingDrafts(false);
      }
    }

    loadData();
  }, [employeeId]);




  // Handlers for LeavesDrafts
  const handleEditDraft = (draftToEdit) => {
    navigate(`/Leaves?draftId=${draftToEdit.id}`);

  };
  const fetchHolidays = async () => {
    try {
      const token = sessionStorage.getItem("token");


      const res = await api.get("/leaves/holidays", {

        headers: {
          Authorization: `Bearer ${token}`, // ✅ Add JWT token
        },
      });


      const data = res.data; // Axios parses JSON automatically

      const holidayDates = data.map(h => new Date(h.holidayDate + 'T00:00:00'));
      setHolidays(holidayDates);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
    }
  };


  const handleDeleteDraft = async (draftId) => {

    const confirmed = window.confirm("Are you sure you want to delete this draft?");
    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem("token");


      const res = await api.delete(`/leaves/drafts/${draftId}`, {

        headers: {
          Authorization: `Bearer ${token}`, // ✅ Include JWT token
        },
      });


      if (res.status === 200 || res.status === 204) {
        const updatedDrafts = drafts.filter((draft) => draft.id !== draftId);

        setDrafts(updatedDrafts);
        setSuccessMessage("Draft deleted successfully 🗑️");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Failed to delete draft");
      }
    } catch (err) {
      console.error("Error deleting draft:", err);
      alert("Error deleting draft. See console for details.");
    }
  };


  const handleDownloadDraft = async (draft) => {
    try {
      const token = sessionStorage.getItem("token");


      const res = await api.get(`/leaves/drafts/download/${draft.id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Include token
        },
        responseType: "blob", // important for file download
      });

      const blob = res.data;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = draft.fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download draft file:", err);
      alert("Failed to download file.");
    }
  };

  const handlePreview = async (draft) => {
    const token = sessionStorage.getItem("token");
    if (!token) return alert("Authorization required.");

    try {
      const response = await api.get(`/leaves/drafts/download/${draft.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      });

      const fileName = draft.fileName || "document";
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
    setPreviewFileName("");
  };


  const filteredDrafts = useMemo(() => {
    if (!searchTerm) {
      return draftsWithDays; // Use the calculated drafts
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return draftsWithDays.filter(draft => {
      const draftValues = [
        String(draft.type ?? ''),
        String(draft.startDate ?? ''),
        String(draft.endDate ?? ''),
        String(draft.totalDays ?? ''),
        String(draft.fileName || ''),
        String(draft.reason ?? ''),
      ].map(value => value.toLowerCase());


      return draftValues.some(value => value.includes(lowercasedSearchTerm));
    });
  }, [draftsWithDays, searchTerm]);

  // Define a style object for common cell properties
  const commonCellStyle = {
    padding: '12px',
    border: '1px solid #ddd',
    verticalAlign: 'middle', // Changed from 'top' to 'middle' for better vertical centering
    backgroundColor: '#f4f6f8',
    wordWrap: 'break-word',
    whiteSpace: 'normal', // Ensure wrapping for long text
  };

  return (

    <div className="full-page-table-container">

      <div className="table-content-area">
        <div className="tasks-controls-bar">
          <div className="search-wrapper">
            <input
              type="text"
              className="task-search-input"
              placeholder="Search drafts by Type, Reason or Status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>


        {loadingDrafts && (
          <div style={{ textAlign: 'center', color: '#666' }}>
            Loading drafts…
          </div>
        )}


        {!!draftsError && (
          <div style={{ textAlign: 'center', color: '#d9534f' }}>
            {draftsError}
          </div>
        )}


        {!loadingDrafts && !draftsError && filteredDrafts.length === 0 ? (
          <div >
            No saved drafts found.
          </div>
        ) : (
          !loadingDrafts && !draftsError && (
            <div className="leave-table-wrapper">

              <table className="leave-main-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th style={{ textAlign: 'center' }}>Days</th>
                    <th>Document</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrafts.map((draft, index) => (
                    <tr key={draft.id}>
                      <td style={{ textAlign: 'center' }}>#{draft.id || "--"}</td>
                      <td>{draft.type || "--"}</td>
                      <td>{draft.startDate ? formatDate(draft.startDate) : "--"}</td>
                      <td>{draft.endDate ? formatDate(draft.endDate) : "--"}</td>
                      <td style={{ textAlign: 'center' }}>{draft.totalDays || "--"}</td>
                      <td>
                        {draft.hasFile ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleDownloadDraft(draft)}
                              style={{
                                color: '#00b3a4',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '1.2rem',
                                transition: 'color 0.2s'
                              }}
                              title="Download"
                            >
                              <FiDownload />
                            </button>
                            <button
                              onClick={() => handlePreview(draft)}
                              style={{
                                color: '#3b82f6',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '1.2rem',
                                transition: 'color 0.2s'
                              }}
                              title="Preview"
                            >
                              <FiEye />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No File</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.8125rem' }}>
                        {draft.reason || "--"}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditDraft(draft)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#e6f7f6',
                              color: '#00b3a4',
                              border: '1px solid #c2f0ec',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            title="Edit Draft"
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#00b3a4'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e6f7f6'; e.currentTarget.style.color = '#00b3a4'; }}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fee2e2',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            title="Delete Draft"
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

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
      )}
    </div>

  );
}

export default LeavesDrafts;