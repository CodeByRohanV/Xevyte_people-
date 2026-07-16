
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import { FiDownload, FiXCircle, FiFileText, FiClock, FiCheckCircle, FiEye } from 'react-icons/fi';
import './Leave.css';

import api from "../api";
import { formatDateToIST, formatDateTimeToIST } from '../utils/DateUtils';

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
        return `${basePart} (${cleanId}) ${onBehalfPart}`;
    }

    // Simple name, just append the ID
    if (cleanId) return `${formattedName} (${cleanId})`;

    return formattedName;
};

function LeaveHistory() {

    const formatDate = (dateString) => {
        return formatDateToIST(dateString);
    };

    const employeeId = sessionStorage.getItem("employeeId");
    const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

    const [searchTerm, setSearchTerm] = useState('');

    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();

    // Leave history states
    const [leavesData, setLeavesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    // Filter and sort states
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
    const [filters, setFilters] = useState({
        leaveType: '',
        totalDays: '',
        reason: '',
        fileName: '',
        rejectionReason: '',
        status: '',
    });

    // Modal States
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusDetails, setStatusDetails] = useState(null);
    const [isCancelRequestHovered, setIsCancelRequestHovered] = useState(false);
    const [isViewStatusHovered, setIsViewStatusHovered] = useState(false);

    // Preview States
    const [previewFile, setPreviewFile] = useState(null);
    const [fileType, setFileType] = useState("");
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewFileName, setPreviewFileName] = useState("");

    const handleOpenDetailModal = (leave) => {
        setSelectedLeave(leave);
        setIsDetailModalOpen(true);
        setIsCancelRequestHovered(false);
        setIsViewStatusHovered(false);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedLeave(null);
        setIsCancelRequestHovered(false);
        setIsViewStatusHovered(false);
    };

    const handleViewStatus = async (id) => {
        try {
            let token = sessionStorage.getItem("token");
            if (!token) throw new Error("No token found");
            if (token.startsWith('"') && token.endsWith('"')) {
                token = token.slice(1, -1);
            }

            const res = await api.get(`/leaves/status-details/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let data = res.data;

            // ✅ Normalize "Pending Level 1" -> "Pending"
            if (data.status === 'Pending Level 1') data.status = 'Pending';

            // ✅ Fallback: If Approved but no approver info, fetch manager details
            if ((data.status === 'Approved' || data.status === 'Rejected') && !data.approverName && !data.managerName) {
                try {
                    // 1. Get Full Employee Details to find Manager ID (Profile endpoint is limited)
                    const empRes = await api.get(`/employees/${employeeId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Note: Endpoint returns full Employee object, so we access assignedManagerId
                    const managerId = empRes.data.assignedManagerId;

                    if (managerId) {
                        data.managerId = managerId;

                        // 2. Get Manager Name
                        const nameRes = await api.get(`/leaves/employee-name/${managerId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: 'text'
                        });
                        data.managerName = nameRes.data;
                    }
                } catch (fetchErr) {
                    console.error("Failed to fetch manager details for fallback:", fetchErr);
                }
            }

            setStatusDetails(data);
            handleCloseDetailModal(); // Close detail modal
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




    // Fetch leave history data
    useEffect(() => {
        if (!employeeId) {
            console.error("Employee ID not found. Redirecting to login.");
            navigate("/LoginPage");
            return;
        }

        const fetchLeaveHistory = async () => {
            setLoading(true);
            setApiError("");

            try {
                let token = sessionStorage.getItem("token");
                if (!token) throw new Error("No token found");

                // Remove surrounding quotes if stored
                if (token.startsWith('"') && token.endsWith('"')) {
                    token = token.slice(1, -1);
                }

                const { data } = await api.get(`/leaves/employee/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });


                if (Array.isArray(data)) {
                    // ✅ Show all leaves including cancelled ones in employee history
                    // ✅ Normalize "Pending Level 1" -> "Pending"
                    const normalizedData = data.map(leave => ({
                        ...leave,
                        status: leave.status === 'Pending Level 1' ? 'Pending' : leave.status
                    }));
                    setLeavesData(normalizedData);
                } else {
                    setApiError("Invalid data format from server.");
                }
            } catch (err) {
                console.error("Failed to fetch leave history:", err.response?.data || err.message);

                setApiError("Failed to load leave history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };


        fetchLeaveHistory();
    }, [employeeId, navigate]);



    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved':
                return 'transparent';
            case 'Pending':
                return 'transparent';
            case 'Rejected':
                return 'transparent';
            case 'Cancelled':
                return 'transparent'; // you can change color if needed (e.g., gray/red)
            default:
                return 'transparent';
        }
    };

    const handleCancelLeave = async (leaveId) => {
        if (!window.confirm("Are you sure you want to cancel this leave request?")) return;

        try {
            let token = sessionStorage.getItem("token");
            if (!token) throw new Error("No token found");

            // Remove surrounding quotes if accidentally stored
            if (token.startsWith('"') && token.endsWith('"')) {
                token = token.slice(1, -1);
            }

            await api.put(`/leaves/cancel/${leaveId}`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // ✅ Remove cancelled leave from view (but it remains in DB with status "Cancelled")
            setLeavesData(prevLeaves =>
                prevLeaves.map(leave =>
                    leave.id === leaveId ? { ...leave, status: "Cancelled" } : leave
                )
            );

            setSuccessMessage("Leave request cancelled successfully!");
            setTimeout(() => setSuccessMessage(""), 2000);
        } catch (err) {
            console.error("Failed to cancel leave:", err.response?.data || err.message);
            setApiError("Failed to cancel leave. Please try again.");
            setTimeout(() => setApiError(""), 3000);
        }
    };




    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Refined function for filtering and sorting
    const sortedAndFilteredLeaves = () => {
        let leavesToProcess = [...leavesData];
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        // 1. Apply global search filter first
        if (lowercasedSearchTerm) {
            leavesToProcess = leavesToProcess.filter(leave =>
                Object.values(leave).some(value =>
                    value && value.toString().toLowerCase().includes(lowercasedSearchTerm)
                )
            );
        }

        // 2. Apply individual column filters on the globally filtered data
        const finalFilteredLeaves = leavesToProcess.filter(leave => {
            const leaveTypeMatch = filters.leaveType === '' || (leave.type && leave.type.toLowerCase() === filters.leaveType.toLowerCase());
            const totalDaysMatch = filters.totalDays === '' || (leave.totalDays && leave.totalDays.toString().includes(filters.totalDays));
            const reasonMatch = filters.reason === '' || (leave.reason && leave.reason.toLowerCase().includes(filters.reason.toLowerCase()));
            const fileNameMatch = filters.fileName === '' || (leave.fileName && leave.fileName.toLowerCase().includes(filters.fileName.toLowerCase()));
            const rejectionReasonMatch = filters.rejectionReason === '' || (leave.rejectionReason && leave.rejectionReason.toLowerCase().includes(filters.rejectionReason.toLowerCase()));
            const statusMatch = filters.status === '' || (leave.status && leave.status.toLowerCase() === filters.status.toLowerCase());

            return leaveTypeMatch && totalDaysMatch && reasonMatch && fileNameMatch && rejectionReasonMatch && statusMatch;
        });

        // 3. Apply sorting
        if (sortConfig.key !== null) {
            finalFilteredLeaves.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (sortConfig.key === 'totalDays') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return finalFilteredLeaves;
    };

    const leavesToDisplay = sortedAndFilteredLeaves();

    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

    return (


        <div className="leave-history-container">
            {/* <div className="tasks-controls-bar">
                <div className="search-wrapper" style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <input
                        type="text"
                        className="task-search-input"
                        placeholder="Search history by ID, Type, Reason..."
                        value={filters.reason}
                        onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                        style={{ flex: 1 }}
                    />
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', backgroundColor: 'white' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div> */}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading history...</div>
            ) : leavesData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontStyle: 'italic' }}>No leave history found.</div>
            ) : (
                <div className="leave-table-wrapper">
                    <table className="leave-main-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                                    ID {getSortIndicator('id')}
                                </th>
                                <th>Type</th>
                                <th onClick={() => handleSort('startDate')} style={{ cursor: 'pointer' }}>
                                    Start Date {getSortIndicator('startDate')}
                                </th>
                                <th onClick={() => handleSort('endDate')} style={{ cursor: 'pointer' }}>
                                    End Date {getSortIndicator('endDate')}
                                </th>
                                <th style={{ textAlign: 'center' }}>Days</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leavesToDisplay.map((leave) => (
                                <tr key={leave.id}>
                                    <td
                                        style={{ cursor: 'pointer', color: '#00b3a4' }}
                                        onClick={() => handleOpenDetailModal(leave)}
                                    >
                                        {leave.id}
                                    </td>
                                    <td>{leave.type}</td>
                                    <td>{formatDate(leave.startDate)}</td>
                                    <td>{formatDate(leave.endDate)}</td>
                                    <td style={{ textAlign: 'center' }}>{leave.totalDays}</td>
                                    <td>{leave.status}</td>
                                    {/* <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleViewStatus(leave.id)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                        >
                                            Status
                                        </button>
                                    </td> */}



                                </tr>
                            ))}
                            {leavesToDisplay.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="no-holidays-cell" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>No leaves found matching the current filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            {isDetailModalOpen && selectedLeave && createPortal(
                <div className="history-detail-modal-overlay" style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 100000
                }}>
                    <div className="history-detail-modal-card" style={{
                        backgroundColor: "#fff", padding: "20px", borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: "500px", maxWidth: "90%",
                        maxHeight: "90vh", overflowY: "auto"
                    }}>
                        <div className="modal-header-v2" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0 }}>Leave Details - {selectedLeave.id}</h3>
                            <button onClick={handleCloseDetailModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div className="detail-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="detail-list-item" style={{ display: 'flex', gap: '10px' }}>
                                <div className="item-icon-box" style={{ color: '#64748b' }}><FiFileText /></div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Reason</label>
                                    <p style={{ margin: 0 }}>{selectedLeave.reason || "N/A"}</p>
                                </div>
                            </div>

                            <div className="detail-list-item" style={{ display: 'flex', gap: '10px' }}>
                                <div className="item-icon-box" style={{ color: '#64748b' }}></div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Duration</label>
                                    <p style={{ margin: 0 }}>
                                        {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)} ({selectedLeave.totalDays} days)
                                    </p>
                                </div>
                            </div>

                            <div className="detail-list-item" style={{ display: 'flex', gap: '10px' }}>
                                <div className="item-icon-box" style={{ color: '#64748b' }}><FiFileText /></div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Document</label>
                                    {selectedLeave.fileName ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <button
                                                className="download-link"
                                                onClick={async () => {
                                                    try {
                                                        let token = sessionStorage.getItem("token");
                                                        if (!token) throw new Error("No token found");
                                                        if (token.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1);

                                                        const response = await api.get(`/leaves/download/${selectedLeave.id}`, {
                                                            headers: { Authorization: `Bearer ${token}` },
                                                            responseType: "blob",
                                                        });
                                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                                        const link = document.createElement("a");
                                                        link.href = url;
                                                        link.download = selectedLeave.fileName;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (error) {
                                                        console.error("Download error:", error);
                                                    }
                                                }}
                                                style={{
                                                    background: "none", border: "none", color: "#14b8a6",
                                                    textDecoration: "underline", cursor: "pointer", display: 'flex',
                                                    alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: '600'
                                                }}
                                            >
                                                Download
                                            </button>
                                            <button
                                                className="preview-link"
                                                onClick={() => handlePreview(selectedLeave.id, selectedLeave.fileName)}
                                                style={{
                                                    background: "none", border: "none", color: "#3b82f6",
                                                    textDecoration: "underline", cursor: "pointer", display: 'flex',
                                                    alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: '600', marginLeft: '10px'
                                                }}
                                            >
                                                Preview
                                            </button>
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, color: '#94a3b8' }}>No document attached</p>
                                    )}
                                </div>
                            </div>

                            <div className="detail-list-item" style={{ display: 'flex', gap: '10px' }}>
                                <div className="item-icon-box" style={{ color: '#64748b' }}><FiCheckCircle /></div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Status</label>
                                    <p style={{ margin: 0 }}>{selectedLeave.status}</p>
                                </div>
                            </div>

                            {selectedLeave.rejectionReason && (
                                <div className="detail-list-item rejection-item" style={{ display: 'flex', gap: '10px' }}>
                                    <div className="item-icon-box" style={{ color: '#ef4444' }}><FiXCircle /></div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Rejection Reason</label>
                                        <p style={{ margin: 0, color: '#ef4444' }}>{selectedLeave.rejectionReason}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer-v2" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <button
                                onClick={() => handleViewStatus(selectedLeave.id)}
                                onMouseEnter={() => setIsViewStatusHovered(true)}
                                onMouseLeave={() => setIsViewStatusHovered(false)}
                                style={{
                                    padding: "10px 20px",
                                    border: "none",
                                    backgroundColor: isViewStatusHovered ? "#00998c" : "#00b3a4",
                                    color: "#fff",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                View Status
                            </button>
                            {(selectedLeave.status?.toLowerCase() === 'pending' || selectedLeave.status?.toLowerCase().startsWith('pending level')) && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to cancel this leave request?")) {
                                            handleCancelLeave(selectedLeave.id);
                                            handleCloseDetailModal();
                                        }
                                    }}
                                    onMouseEnter={() => setIsCancelRequestHovered(true)}
                                    onMouseLeave={() => setIsCancelRequestHovered(false)}
                                    style={{
                                        padding: "10px 20px",
                                        border: "1.5px solid #00b3a4",
                                        backgroundColor: isCancelRequestHovered ? "#00b3a4" : "transparent",
                                        color: isCancelRequestHovered ? "#fff" : "#00b3a4",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    Cancel Request
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Status Flow Modal */}
            {statusModalOpen && statusDetails && createPortal(
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 110000
                }}>
                    <div style={{
                        backgroundColor: "#fff", padding: "30px", borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: "400px", maxWidth: "90%"
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1e293b", textAlign: "center" }}>Leave Status Flow</h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* 1. Created At */}
                            <div style={{ display: "flex", gap: "15px" }}>
                                <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></div>
                                    <div style={{ width: "2px", flex: 1, background: "#e2e8f0", margin: "4px 0" }}></div>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>Created At</p>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: "#0f172a" }}>
                                        {statusDetails.createdAt ? formatDateTimeToIST(statusDetails.createdAt) : "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* 2. Approval History */}
                            {(() => {
                                const historyList = (statusDetails.approvalHistory && statusDetails.approvalHistory.length > 0)
                                    ? statusDetails.approvalHistory
                                    : (statusDetails.status === 'Approved' || statusDetails.status === 'Rejected' || statusDetails.status === 'Cancelled')
                                        ? [{
                                            action: statusDetails.status.toUpperCase(),
                                            approverRole: statusDetails.status === 'Cancelled' ? null : (statusDetails.approverRole || "Manager"),
                                            approverName: statusDetails.status === 'Cancelled' ? null : (statusDetails.approverName || statusDetails.managerName || statusDetails.approvedBy || "System"),
                                            approverId: statusDetails.approverId || statusDetails.managerId || statusDetails.hrId || statusDetails.approvedById,
                                            actionTimestamp: statusDetails.updatedAt || statusDetails.actionDate || statusDetails.approvedAt,
                                            remarks: statusDetails.rejectionReason
                                        }]
                                        : [];

                                return historyList.length > 0 && (
                                    historyList.map((history, index, arr) => (
                                        <div key={index} style={{ display: "flex", gap: "15px" }}>
                                            <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                <div style={{
                                                    width: "12px", height: "12px", borderRadius: "50%",
                                                    background: history.action === "APPROVED" ? "#10b981" :
                                                        history.action === "REJECTED" ? "#ef4444" : "#3b82f6"
                                                }}></div>
                                                {(index < arr.length - 1 || (statusDetails.status && statusDetails.status.startsWith("Pending"))) ? (
                                                    <div style={{ width: "2px", flex: 1, background: "#e2e8f0", margin: "4px 0" }}></div>
                                                ) : null}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>
                                                    {history.action}{history.approverRole ? ` by ${history.approverRole}` : ''}
                                                </p>
                                                {(history.approverName || history.approverId) && (
                                                    <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#475569" }}>
                                                        {formatApproverDisplay(history.approverName, history.approverId) || "Unknown"}
                                                    </p>
                                                )}
                                                <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: "#0f172a" }}>
                                                    {history.actionTimestamp ? formatDateTimeToIST(history.actionTimestamp) : "N/A"}
                                                </p>

                                                {history.remarks &&
                                                    history.remarks.toLowerCase() !== `${history.action} by ${history.approverRole}`.toLowerCase() &&
                                                    !history.remarks.toLowerCase().startsWith('status updated to:') && (
                                                        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
                                                            {history.remarks}
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    ))
                                );
                            })()}

                            {/* 3. Current Stage / Next Approver */}
                            {(statusDetails.status === "Pending" || (statusDetails.status && statusDetails.status.startsWith("Pending"))) && statusDetails.nextApproverRole && (
                                <div style={{ display: "flex", gap: "15px" }}>
                                    <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fbbf24" }}></div>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>Current Stage</p>
                                        <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: "#0f172a" }}>
                                            Pending with {statusDetails.nextApproverRole}
                                        </p>
                                        {statusDetails.approverName && (
                                            <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#475569" }}>
                                                {formatApproverDisplay(statusDetails.approverName, statusDetails.approverId) || statusDetails.approverName}
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
                                    padding: "8px 24px", background: "#1e293b", color: "white",
                                    border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem"
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* PREVIEW MODAL */}
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
export default LeaveHistory;


