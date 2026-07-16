import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { formatDateToIST } from '../utils/DateUtils';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import { FiDownload, FiEye } from 'react-icons/fi';
import './Leave.css';
import './Dashboard.css';
import api from "../api";

function HRDashboard({ embedded = false, searchTerm: externalSearchTerm = '', statusFilter = 'All', refreshTrigger = 0, onActionComplete, onDataLoaded }) {
    const hrId = sessionStorage.getItem("employeeId");
    const getDisplayEmployeeId = (id) => {
        if (!id) return "";
        if (id.includes('_')) return id.split('_').pop();
        if (id.includes('-')) return id.split('-').pop();
        return id;
    };
    const token = sessionStorage.getItem("token");

    const [hrName, setHrName] = useState(sessionStorage.getItem("employeeName"));

    const [profileOpen, setProfileOpen] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [apiError, setApiError] = useState("");

    const navigate = useNavigate();
    const [hrAssignedLeaves, setHrAssignedLeaves] = useState([]);
    const [loading, setLoading] = useState(false);

    // ⭐ NEW STATE: Map to store employee IDs to Names
    const [employeeNameMap, setEmployeeNameMap] = useState({});

    // Modal state for detail view
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);

    /* ---------------- PREVIEW MODAL STATE ---------------- */
    const [previewFile, setPreviewFile] = useState(null);
    const [fileType, setFileType] = useState("");
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewFileName, setPreviewFileName] = useState("");

    // --- NEW: Helper function to fetch a single employee name ---
    const fetchEmployeeName = async (id) => {
        try {
            const res = await api.get(`/leaves/employee-name/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'text' // Ensure we get raw text if backend returns a plain string
            });
            return res.data || id; // Return the name or fallback to ID
        } catch (err) {
            console.error(`Failed to fetch name for ${id}:`, err.response?.data || err.message);
            return id; // Return ID on error
        }
    };



    // --- NEW: Function to fetch all names after leaves are loaded ---
    const fetchEmployeeNames = async (leaves) => {
        if (!leaves.length) return;

        // 1. Get unique employee IDs
        const uniqueEmployeeIds = [...new Set(leaves.map(l => l.employeeId))];

        // 2. Fetch all names concurrently
        const namePromises = uniqueEmployeeIds.map(id => fetchEmployeeName(id));
        const names = await Promise.all(namePromises);

        // 3. Create the ID:Name map
        const nameMap = {};
        uniqueEmployeeIds.forEach((id, index) => {
            nameMap[id] = names[index];
        });

        setEmployeeNameMap(nameMap);
    };

    const handlePreview = async (leaveId, fileName) => {
        const token = sessionStorage.getItem("token");
        if (!token) return alert("Authorization required.");

        try {
            const response = await api.get(`/leaves/download/${leaveId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer',
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


    useEffect(() => {
        if (!hrId || !token) {
            console.error("HR ID or token not found. Redirecting to login.");
            navigate("/LoginPage");
            return;
        }

        const fetchLeavesAndProfile = async () => {
            setLoading(true);
            setApiError("");

            try {
                // Fetch HR-assigned leaves
                const leavesResponse = await api.get(`/leaves/hr/${hrId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                let sortedLeaves = (leavesResponse.data || [])
                    .filter(l => l.status !== 'Cancelled')
                    .sort((a, b) => b.id - a.id);

                // Normalize status "Pending Level 1" -> "Pending"
                sortedLeaves = sortedLeaves.map(item => ({
                    ...item,
                    status: item.status === 'Pending Level 1' ? 'Pending' : item.status
                }));

                setHrAssignedLeaves(sortedLeaves);

                // Fetch employee names for the leaves
                if (sortedLeaves.length > 0) {
                    await fetchEmployeeNames(sortedLeaves); // Assuming this is already defined
                }
            } catch (err) {
                console.error("Failed to fetch leaves:", err.response?.data || err.message);
                setApiError("Failed to load HR-assigned leaves. Please try again later.");
            }

            try {
                // Fetch HR profile info
                const profileResponse = await api.get(`/profile/${hrId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = profileResponse.data;
                if (data.name) {
                    setHrName(data.name);
                    sessionStorage.setItem("employeeName", data.name);
                }
            } catch (err) {
                console.error("Failed to fetch profile info:", err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLeavesAndProfile();
    }, [hrId, token, navigate, refreshTrigger]);





    const filteredLeaves = useMemo(() => {
        // Use external search term (always from props in this component)
        const activeSearchTerm = externalSearchTerm;

        if (!activeSearchTerm && statusFilter === 'All') return hrAssignedLeaves;
        const lowercasedSearchTerm = activeSearchTerm.toLowerCase();

        return hrAssignedLeaves.filter(leave => {
            // 1. Status Filter
            if (statusFilter !== 'All') {
                const s = (leave.status || '').toLowerCase();
                const f = statusFilter.toLowerCase();
                if (!s.startsWith(f)) return false;
            }

            const employeeName = employeeNameMap[leave.employeeId] || ''; // ⭐ Get name for search
            return (
                // ⭐ Include employee name in search
                String(employeeName).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.employeeId).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.id).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.type).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.startDate).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.endDate).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.totalDays).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.reason).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.fileName).toLowerCase().includes(lowercasedSearchTerm) ||
                String(leave.status).toLowerCase().includes(lowercasedSearchTerm)
            );
        });
    }, [hrAssignedLeaves, externalSearchTerm, employeeNameMap, statusFilter]); // ⭐ Added employeeNameMap dependency

    useEffect(() => {
        if (onDataLoaded) {
            onDataLoaded(filteredLeaves.length);
        }
    }, [filteredLeaves.length, onDataLoaded]);


    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved':
            case 'Approved by Manager': return '#4BB543';
            case 'Pending': return '#FFC107';
            case 'Rejected': return '#FF4136';
            case 'Cancelled': return '#007bff';
            default:
                if (status && status.startsWith('Pending')) return '#FFC107';
                return '#000';
        }
    };

    // If embedded, return only table rows
    if (embedded) {
        return (
            <>
                {filteredLeaves.map((leave) => {
                    const employeeName = employeeNameMap[leave.employeeId] || '...';
                    return (
                        <tr key={leave.id}>
                            {/* <td style={{ textAlign: "center", color: '#334155' }}>{leave.id}</td> */}
                            <td style={{ color: '#334155' }}>{getDisplayEmployeeId(leave.employeeId)}</td>
                            <td>
                                <span style={{ color: '#334155' }}>{employeeName}</span>
                            </td>
                            <td style={{ color: '#334155' }}>{leave.type}</td>
                            <td style={{ textAlign: "center", color: '#334155' }}>
                                {leave.status}
                            </td>
                            <td className="view-action-cell">
                                <div
                                    className="view-action-btn"
                                    onClick={() => {
                                        setSelectedClaim(leave);
                                        setIsDetailModalOpen(true);
                                    }}
                                    title="View details"
                                >
                                    <FiEye size={16} style={{ flexShrink: 0 }} />
                                </div>
                            </td>
                        </tr>
                    );
                })}

                {/* Detail Modal */}
                {isDetailModalOpen && selectedClaim && ReactDOM.createPortal(
                    <div className="history-detail-modal-overlay">
                        <div className="history-detail-modal-card">
                            <div className="modal-header-v2">
                                <div className="header-title-group">
                                    <h3>Leave Details - {selectedClaim.id}</h3>
                                </div>
                                <div className="header-actions">
                                    <button
                                        className="close-x-btn"
                                        onClick={() => {
                                            setIsDetailModalOpen(false);
                                            setSelectedClaim(null);
                                        }}
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
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                            </div>
                                            <div className="item-content">
                                                <label>Leave Type</label>
                                                <p>{selectedClaim.type}</p>
                                            </div>
                                        </div>
                                        <div className="detail-list-item">
                                            <div className="item-icon-box">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                            </div>
                                            <div className="item-content">
                                                <label>From Date</label>
                                                <p>{formatDateToIST(selectedClaim.startDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="detail-list-grid">
                                        <div className="detail-list-item">
                                            <div className="item-icon-box">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                            </div>
                                            <div className="item-content">
                                                <label>To Date</label>
                                                <p>{formatDateToIST(selectedClaim.endDate)}</p>
                                            </div>
                                        </div>
                                        <div className="detail-list-item">
                                            <div className="item-icon-box">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                </svg>
                                            </div>
                                            <div className="item-content">
                                                <label>Total Days</label>
                                                <p>{selectedClaim.totalDays}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="detail-list-grid">
                                        <div className="detail-list-item">
                                            <div className="item-icon-box">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                            </div>
                                            <div className="item-content">
                                                <label>Document</label>
                                                {selectedClaim.fileName ? (
                                                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "5px" }}>
                                                        <button
                                                            onClick={async () => {
                                                                const token = sessionStorage.getItem("token");
                                                                if (!token) return;
                                                                try {
                                                                    const response = await api.get(`/leaves/download/${selectedClaim.id}`, {
                                                                        headers: { Authorization: `Bearer ${token}` },
                                                                        responseType: "blob",
                                                                    });
                                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                                    const a = document.createElement("a");
                                                                    a.href = url;
                                                                    a.download = selectedClaim.fileName;
                                                                    document.body.appendChild(a);
                                                                    a.click();
                                                                    a.remove();
                                                                    window.URL.revokeObjectURL(url);
                                                                } catch (error) {
                                                                    console.error(error);
                                                                }
                                                            }}
                                                            style={{
                                                                cursor: "pointer",
                                                                color: "#14b8a6",
                                                                background: "none",
                                                                border: "none",
                                                                padding: 0,
                                                                fontWeight: "700",
                                                                fontSize: "0.9rem",
                                                                textDecoration: 'underline'
                                                            }}
                                                        >
                                                            Download
                                                        </button>
                                                        <button
                                                            onClick={() => handlePreview(selectedClaim.id, selectedClaim.fileName)}
                                                            style={{
                                                                cursor: "pointer",
                                                                color: "#3b82f6",
                                                                background: "none",
                                                                border: "none",
                                                                padding: 0,
                                                                fontWeight: "700",
                                                                fontSize: "0.9rem",
                                                                textDecoration: 'underline'
                                                            }}
                                                        >
                                                            Preview
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p>No File</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="detail-list-item" style={{ alignItems: 'flex-start' }}>
                                        <div className="item-icon-box" style={{ marginTop: '2px' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                        </div>
                                        <div className="item-content">
                                            <label>Reason</label>
                                            <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedClaim.reason || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer-v2">
                                <div style={{ textAlign: 'center', padding: '10px' }}>
                                    <span className={`status-badge status-${selectedClaim.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {selectedClaim.status?.toLowerCase().startsWith('pending level') ? 'Pending' : selectedClaim.status}
                                    </span>
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
            </>
        );
    }

    return (
        <div className="hr-tasks-container">
            {apiError && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{apiError}</div>}


            <div className="leave-table-wrapper">
                <table className="leave-main-table">
                    <thead>
                        <tr>
                            <th style={{ width: '100px', textAlign: 'center' }}>Leave ID</th>
                            <th>Employee Info</th>
                            <th>Leave Type</th>
                            <th>Date Range</th>
                            <th style={{ textAlign: 'center' }}>Days</th>
                            <th>Reason</th>
                            <th>Document</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.map((leave) => {
                            const employeeName = employeeNameMap[leave.employeeId] || '...';
                            return (
                                <tr key={leave.id}>
                                    <td style={{ textAlign: 'center', fontWeight: '600' }}>#{leave.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '700', color: '#0f172a' }}>{employeeName}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {getDisplayEmployeeId(leave.employeeId)}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '700', color: '#0d9488' }}>{leave.type}</td>
                                    <td>
                                        <div style={{ fontSize: '0.8125rem' }}>
                                            <div>{formatDateToIST(leave.startDate)}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>to</div>
                                            <div>{formatDateToIST(leave.endDate)}</div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '800' }}>{leave.totalDays}</td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.8125rem' }}>{leave.reason}</td>
                                    <td>
                                        {leave.fileName ? (
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <button
                                                    onClick={async () => {
                                                        const token = sessionStorage.getItem("token");
                                                        if (!token) return;
                                                        try {
                                                            const response = await api.get(`/leaves/download/${leave.id}`, {
                                                                headers: { Authorization: `Bearer ${token}` },
                                                                responseType: "blob",
                                                            });
                                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                                            const a = document.createElement("a");
                                                            a.href = url;
                                                            a.download = leave.fileName;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            a.remove();
                                                            window.URL.revokeObjectURL(url);
                                                        } catch (error) {
                                                            console.error(error);
                                                        }
                                                    }}
                                                    style={{
                                                        cursor: "pointer",
                                                        color: "#14b8a6",
                                                        background: "none",
                                                        border: "none",
                                                        padding: 0,
                                                        fontWeight: "700",
                                                        fontSize: "0.9rem",
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => handlePreview(leave.id, leave.fileName)}
                                                    style={{
                                                        cursor: "pointer",
                                                        color: "#3b82f6",
                                                        background: "none",
                                                        border: "none",
                                                        padding: 0,
                                                        fontWeight: "700",
                                                        fontSize: "0.9rem",
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No File</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredLeaves.length === 0 && (
                            <tr>
                                <td colSpan="8" className="no-holidays-cell" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>No leave requests found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
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

export default HRDashboard;



