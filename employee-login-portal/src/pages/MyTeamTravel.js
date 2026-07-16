import React, { useEffect, useState, useRef } from "react";
import ReactDOM from 'react-dom';
import { formatDateToIST } from '../utils/DateUtils';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Travel.css';
import Sidebar from './Sidebar.js';

import api from "../api";
import { FiChevronDown, FiEye } from 'react-icons/fi';
function MyTeamTravel({ isManagerProp, isAdminProp, managerRequestsProp, adminRequestsProp, setManagerRequests, setAdminRequests, managerFetched, adminFetched }) {
  const employeeId = sessionStorage.getItem("employeeId");
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Removed roleView state
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});

  const [canViewTasks, setCanViewTasks] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTransferPopup, setShowTransferPopup] = useState(false);
  const [allAdmins, setAllAdmins] = useState([]);
  const [selectedTransferAdmin, setSelectedTransferAdmin] = useState("");


  const [transferReason, setTransferReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (isManagerProp !== undefined && isAdminProp !== undefined) {
      setIsManager(isManagerProp);
      setIsAdmin(isAdminProp);
      return;
    }

    const token = sessionStorage.getItem("token"); // JWT token
    if (!employeeId) return;

    const fetchRoles = async () => {
      try {
        const response = await api.get(`/access/assigned-ids/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data || {};
        setIsManager(!!data.manager);
        setIsAdmin(!!data.travelAdmin);

      } catch (err) {
        console.error("Error fetching assigned roles:", err.response?.data || err.message);
      }
    };

    fetchRoles();
  }, [employeeId, isManagerProp, isAdminProp]);

  // Unified Fetch Function
  const fetchPendingRequests = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    let allReqs = [];
    const seenIds = new Set();

    try {
      // 1. Fetch Manager Requests
      if (isManager) {
        try {
          const res = await api.get(`/travel/manager/pending/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          (res.data || []).forEach(r => {
            allReqs.push({ ...r, sourceRole: 'Manager' });
            seenIds.add(r.id);
          });
        } catch (e) { console.error("Manager fetch error", e); }
      }

      // 2. Fetch Admin Requests
      if (isAdmin) {
        try {
          const res = await api.get(`/travel/admin/assigned-requests/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          (res.data || []).forEach(r => {
            if (!seenIds.has(r.id)) {
              allReqs.push({ ...r, sourceRole: 'Admin' });
              seenIds.add(r.id);
            }
          });
          // Fetch admins list if needed
          if (allAdmins.length === 0) {
            api.get("/travel/admin/travel-admins", {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => setAllAdmins(res.data)).catch(console.error);
          }
        } catch (e) { console.error("Admin fetch error", e); }
      }

      setPendingRequests(allReqs.sort((a, b) => b.id - a.id));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager || isAdmin) {
      fetchPendingRequests();
    }
  }, [isManager, isAdmin]);

  const handleApprove = async (id) => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      alert("Authentication token missing. Please log in again.");
      return;
    }

    try {
      const params = { managerId: employeeId };

      const response = await api.put(`/travel/approve/${id}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params, // axios automatically appends these as query string
      });

      if (response.status === 200) {
        alert("Request approved!");
        fetchPendingRequests(); // refresh the pending requests list

      } else {
        alert("Failed to approve request. Please try again.");
      }
    } catch (err) {

      console.error("handleApprove error:", err.response?.data || err.message);
      alert("Error approving request. Check console for details.");
    }
  };


  const handleReject = async (id) => {
    let remarks = prompt("Enter rejection reason (10-100 characters):");
    if (remarks === null) return;

    remarks = remarks.trim();
    if (remarks.length < 10 || remarks.length > 100) {
      alert("Rejection reason must be between 10 and 100 characters.");
      return;
    }

    const token = sessionStorage.getItem("token");

    if (!token) {
      alert("Authentication token missing. Please log in again.");
      return;
    }

    try {
      const params = {
        managerId: employeeId,
        rejectedReason: remarks,
      };

      const response = await api.put(`/travel/reject/${id}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params, // axios automatically appends these as query string
      });

      if (response.status === 200) {
        alert("Request rejected!");
        fetchPendingRequests(); // refresh the pending requests list

      } else {
        alert("Failed to reject request. Please try again.");
      }
    } catch (err) {

      console.error("handleReject error:", err.response?.data || err.message);
      alert("Error rejecting request. Check console for details.");

    }
  };

  const handleAssignToMe = async (id) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      return;
    }

    try {
      const response = await api.put(`/travel/admin/assign/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { adminId: employeeId },
      });

      if (response.status === 200) {
        alert("Request assigned to you successfully!");
        fetchPendingRequests(); // refresh the list
      } else {
        alert("Failed to assign request.");
      }
    } catch (err) {
      console.error("handleAssignToMe error:", err.response?.data || err.message);
      alert("Error assigning request: " + (err.response?.data || err.message));
    }
  };

  const handleAdminReject = async (id) => {
    let remarks = prompt("Enter rejection reason (10-100 characters):");
    if (remarks === null) return;
    remarks = remarks.trim();
    if (remarks.length < 10 || remarks.length > 100) {
      alert("Rejection reason must be between 10 and 100 characters.");
      return;
    }
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      return;
    }

    try {
      const params = {
        adminId: employeeId,
        rejectedReason: remarks,
      };

      const response = await api.put(`/travel/admin/reject/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.status === 200) {
        alert("Request rejected by Admin!");
        fetchPendingRequests();
        setSelectedRequest(null);
      } else {
        alert("Failed to reject request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting request: " + (err.response?.data || err.message));
    }
  };

  const handleTransfer = async () => {
    if (!selectedTransferAdmin) {
      alert("Please select an admin to transfer to.");
      return;
    }
    const token = sessionStorage.getItem("token");
    try {
      const response = await api.put(`/travel/admin/transfer/${selectedRequest.id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          adminId: selectedTransferAdmin,
          reason: transferReason
        },
      });

      if (response.status === 200) {
        alert("Request transferred successfully!");
        setShowTransferPopup(false);
        setSelectedRequest(null);
        fetchPendingRequests();
      }
    } catch (err) {
      console.error("Transfer error:", err);
      alert("Error transferring request.");
    }
  };

  const handleFileChange = (requestId, event) => {
    const newFiles = Array.from(event.target.files);
    setSelectedFiles((prev) => {
      const existingFiles = prev[requestId] || [];

      // Filter out duplicates by name and size
      const allFilesMap = new Map();
      [...existingFiles, ...newFiles].forEach(file => {
        allFilesMap.set(file.name + file.size, file);
      });

      const mergedFiles = Array.from(allFilesMap.values());

      return {
        ...prev,
        [requestId]: mergedFiles,
      };
    });

    // Clear the input value so that selecting the same file again works
    event.target.value = '';
  };

  const handleRemoveFile = (requestId, index) => {
    setSelectedFiles((prev) => {
      const updatedFiles = [...(prev[requestId] || [])];
      updatedFiles.splice(index, 1);
      return {
        ...prev,
        [requestId]: updatedFiles,
      };
    });
  };


  const handleUpload = async (requestId) => {
    const files = selectedFiles[requestId];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB


    if (!files || files.length === 0) {
      alert("Kindly attach the booking details to complete your submission.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const invalidFiles = [];

    let totalSize = 0;

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) invalidFiles.push(file.name);

      totalSize += file.size;
    }

    if (invalidFiles.length > 0) {
      alert(`Invalid files:\n${invalidFiles.join("\n")}\nOnly PDF, JPG, and PNG allowed.`);
      return;
    }

    if (totalSize > MAX_SIZE) {
      alert("Total file size exceeds 5MB limit.");
      return;
    }

    const formData = new FormData();

    files.forEach((file) => formData.append("files", file));

    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      return;
    }

    try {
      const response = await api.post(`/travel/admin/upload-pdfs/${requestId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {

        alert("Booking details uploaded successfully.");
        setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
        setSelectedRequest(null);
        setSelectedFiles((prev) => {
          const copy = { ...prev };
          delete copy[requestId];
          return copy;
        });
      } else {

        alert("Upload failed: " + (response.data || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading files: " + (err.response?.data || err.message));

    }
  };


  const splitIntoRows = (text, maxLength) => {
    if (!text) return [];
    const lines = [];
    for (let i = 0; i < text.length; i += maxLength) {
      lines.push(text.slice(i, i + maxLength));
    }
    return lines;
  };
  // --- MyTeam3 Component Logic Ends Here ---

  return (



    <div style={{
      marginTop: '0px',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      width: '100%',
    }}>

      {/* <button
  onClick={() => {
    if (roleView) {
      setRoleView(null);  // Back to cards view on this page
    } else {
      navigate(-1);       // Back in browser history from cards view
    }
  }}
  style={{
    padding: "8px 16px", // Slightly reduced padding
    backgroundColor: "#f0f0f0",
    color: "#333",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    margin: "20px 0 20px 0", // Top and bottom margins only
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "background-color 0.3s ease",
    width: "fit-content", // Make width only as big as content
    display: "block", // Ensure it respects margin auto if needed
  }}
>
  ⬅ Back
</button> */}

      <div style={{ top: 0, left: 0, padding: "0px", marginTop: "0px" }}>

        <div
          style={{
            padding: '0px',
            width: '100%',
          }}
        >
          {loading && pendingRequests.length === 0 ? (
            <div className="welcome-text" style={{ textAlign: 'left', margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="loading-spinner-small"></div>
              Fetching travel requests...
            </div>
          ) : (
            <div className="travel-table-container" style={{ marginTop: "0px", borderRadius: "0", overflowX: "auto" }}>

              <table style={{ minWidth: '900px' }}>
                <thead className="columns-header">
                  <tr>
                    <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '120px', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '12px' }}>Employee ID</th>
                    <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '200px', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '12px' }}>Employee Name</th>
                    <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '100px', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '12px' }}>Category</th>
                    <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '120px', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '12px' }}>Mode</th>
                    <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '150px', cursor: 'pointer', userSelect: 'none', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '12px' }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom, left: rect.left });
                        setShowFilterDropdown(!showFilterDropdown);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                        Status <FiChevronDown />
                      </div>
                      {showFilterDropdown && (
                        <>
                          <div
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFilterDropdown(false);
                            }}
                          />
                          <div style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            backgroundColor: 'white',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            borderRadius: '8px',
                            padding: '4px',
                            zIndex: 50,
                            minWidth: '160px',
                            marginTop: '4px',
                            border: '1px solid #e2e8f0'
                          }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {['All', 'Pending For Approval', 'Booking In Progress'].map((option) => (
                              <div
                                key={option}
                                onClick={() => {
                                  setStatusFilter(option === 'All' ? 'All' : option);
                                  setShowFilterDropdown(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '14px',
                                  color: statusFilter === (option === 'All' ? 'All' : option) ? '#10b981' : '#334155',
                                  fontWeight: statusFilter === (option === 'All' ? 'All' : option) ? '600' : '400',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  backgroundColor: statusFilter === (option === 'All' ? 'All' : option) ? '#ecfdf5' : 'transparent',
                                  textAlign: 'left'
                                }}
                              >
                                {option === 'All' ? 'All Statuses' : option}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </th>
                    <th style={{ background: '#629af1', color: 'white', textAlign: 'center', width: '100px', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredItems = pendingRequests
                      .filter(req => statusFilter === 'All' || req.status === statusFilter)
                      .sort((a, b) => b.id - a.id);

                    if (filteredItems.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                            No records found
                          </td>
                        </tr>
                      );
                    }

                    return filteredItems.map((req) => (
                      <tr key={req.id} className="table-row">
                        {/* <td>
                          <span
                            onClick={() => setSelectedRequest(req)}
                            style={{ color: '#334155', cursor: 'pointer', textDecoration: 'none' }}
                          >
                            {req.id}
                          </span>
                        </td> */}
                        <td style={{ color: '#334155' }}>{getDisplayEmployeeId(req.employeeId)}</td>
                        <td style={{ color: '#334155' }}>{req.employeeName}</td>
                        <td style={{ color: '#334155' }}>{req.category}</td>
                        <td style={{ color: '#334155' }}>{req.modeOfTravel}</td>
                        <td>
                          <span className={`status-badge status-${req.status?.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: '#334155' }}>
                            {req.status ? req.status.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ''}
                          </span>
                        </td>
                        <td className="view-action-cell">
                          <div
                            className="view-action-btn"
                            onClick={() => setSelectedRequest(req)}
                            title="View details"
                          >
                            <FiEye size={16} style={{ flexShrink: 0 }} />
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
 
        {/* ---------- DETAILED MODAL ---------- */}
        {selectedRequest && ReactDOM.createPortal(
          <div className="modal-overlay-travel" onClick={() => {
            setSelectedRequest(null);
            // Clear selected files when modal is closed via overlay
            if (selectedRequest && selectedFiles[selectedRequest.id]) {
              setSelectedFiles(prev => {
                const copy = { ...prev };
                delete copy[selectedRequest.id];
                return copy;
              });
            }
          }}>
            <div className="modal-travel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-close-travel" onClick={() => {
                setSelectedRequest(null);
                // Clear selected files when modal is closed
                if (selectedRequest && selectedFiles[selectedRequest.id]) {
                  setSelectedFiles(prev => {
                    const copy = { ...prev };
                    delete copy[selectedRequest.id];
                    return copy;
                  });
                }
              }}>✖</div>
              <h3 style={{ color: "#14b8a6", marginBottom: "20px" }}>Travel Request Details - #{selectedRequest.id}</h3>
 
              <div className="modal-content-travel">
                <div className="detail-row-travel"><b>Employee ID:</b> {getDisplayEmployeeId(selectedRequest.employeeId)}</div>
                <div className="detail-row-travel"><b>Employee Name:</b> {selectedRequest.employeeName}</div>
                <div className="detail-row-travel"><b>Category:</b> {selectedRequest.category}</div>
                <div className="detail-row-travel"><b>Mode of Travel:</b> {selectedRequest.modeOfTravel}</div>
                <div className="detail-row-travel"><b>Depart Date:</b> {formatDateToIST(selectedRequest.departureDate)}</div>
                <div className="detail-row-travel"><b>Return Date:</b> {selectedRequest.returnDate ? formatDateToIST(selectedRequest.returnDate) : "-"}</div>
                <div className="detail-row-travel"><b>From:</b> {selectedRequest.fromLocation}</div>
                <div className="detail-row-travel"><b>To:</b> {selectedRequest.toLocation}</div>
                <div className="detail-row-travel"><b>Accommodation:</b> {selectedRequest.accommodationRequired}</div>
                <div className="detail-row-travel"><b>Advance:</b> {selectedRequest.advanceRequired}</div>
                <div className="detail-row-travel" style={{ display: "flex", alignItems: "flex-start" }}>
                  <b>Purpose:</b>
                  <div style={{ flex: 1, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {selectedRequest.remarks}
                  </div>
                </div>
                <div className="detail-row-travel"><b>Status:</b> {selectedRequest.status ? selectedRequest.status.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ''}</div>
                {selectedRequest.sourceRole !== "Manager" && (
                  <div className="detail-row-travel">
                    <b>Assigned To:</b> {selectedRequest.travelAdmin && !selectedRequest.travelAdmin.includes(',') ?
                      <span className="status-badge status-booked" style={{ padding: '2px 8px' }}>{selectedRequest.travelAdmin}</span> :
                      <span className="status-badge" style={{ background: '#64748b', color: 'white', padding: '2px 8px' }}>Not Claimed</span>}
                  </div>
                )}
              </div>

              <div className="modal-actions-travel">
                {selectedRequest.sourceRole === "Manager" ? (
                  <>
                    <button onClick={() => { handleApprove(selectedRequest.id); setSelectedRequest(null); }} className="submit-button" style={{ background: '#10b981' }}>Approve</button>
                    <button onClick={() => { handleReject(selectedRequest.id); setSelectedRequest(null); }} className="cancel-button">Reject</button>
                  </>
                ) : (
                  <>
                    {/* Admin Actions */}
                    {(!selectedRequest.travelAdmin || selectedRequest.travelAdmin.includes(',')) ? (
                      <button onClick={() => { handleAssignToMe(selectedRequest.id); setSelectedRequest(null); }} className="submit-button" style={{ background: '#14b8a6' }}>Assign to me</button>
                    ) : selectedRequest.travelAdmin === employeeId ? (
                      <>
                        <div className="booking-upload-container">
                          <span className="upload-title">
                            UPLOAD BOOKING DETAIL <span style={{ color: 'red' }}>*</span>
                          </span>

                          <div className="custom-file-upload-wrapper">
                            <input
                              type="file"
                              id={`upload-${selectedRequest.id}`}
                              accept="application/pdf,image/jpeg,image/png"
                              multiple
                              onChange={(e) => handleFileChange(selectedRequest.id, e)}
                              className="hidden-file-input"
                            />

                            <label htmlFor={`upload-${selectedRequest.id}`} className="custom-choose-btn">
                              Choose files
                            </label>

                            <span className="file-status-text">
                              {selectedFiles[selectedRequest.id]?.length > 0
                                ? selectedFiles[selectedRequest.id].length === 1
                                  ? selectedFiles[selectedRequest.id][0].name
                                  : `${selectedFiles[selectedRequest.id].length} files chosen`
                                : "No file chosen"}
                            </span>
                          </div>

                          {/* Display selected files with names and cancel buttons */}
                          {selectedFiles[selectedRequest.id]?.length > 0 && (
                            <div style={{ marginTop: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                              {selectedFiles[selectedRequest.id].map((file, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 10px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    marginBottom: '6px',
                                    fontSize: '0.875rem',
                                    color: '#334155'
                                  }}
                                >
                                  <span style={{ 
                                    flex: 1, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap',
                                    marginRight: '8px'
                                  }}>
                                    {file.name}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveFile(selectedRequest.id, index)}
                                    style={{
                                      background: 'transparent',
                                      color: '#ef4444',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '20px',
                                      height: '20px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '16px',
                                      fontWeight: 'bold',
                                      flexShrink: 0,
                                      transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                                    title="Remove file"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}


                          <button
                            onClick={() => handleUpload(selectedRequest.id)}
                            className="submit-button"
                            style={{ margin: 0, width: '100%', background: '#14b8a6', marginTop: '12px' }}
                          >
                            Confirm Booking
                          </button>
                        </div>
                        <div className="admin-actions-row" style={{ display: 'flex', gap: '10px', marginTop: '10px', width: '100%' }}>
                          <button onClick={() => { setSelectedTransferAdmin(""); setTransferReason(""); setShowTransferPopup(true); }} className="submit-button" style={{ background: '#14b8a6', color: 'white', flex: 1 }}>Transfer To</button>
                          <button onClick={() => handleAdminReject(selectedRequest.id)} className="reject-button" style={{ flex: 1 }}>Reject</button>
                          <button onClick={() => {
                            setSelectedRequest(null);
                            // Clear selected files when modal is closed via Close button
                            if (selectedFiles[selectedRequest.id]) {
                              setSelectedFiles(prev => {
                                const copy = { ...prev };
                                delete copy[selectedRequest.id];
                                return copy;
                              });
                            }
                          }} className="cancel-button" style={{ flex: 1, margin: 0 }}>Close</button>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: '#64748b', fontStyle: 'italic' }}>This request is assigned to {selectedRequest.travelAdmin}</p>
                    )}
                  </>
                )}
                {!(selectedRequest.sourceRole !== "Manager" && selectedRequest.travelAdmin === employeeId) && (
                  <button onClick={() => {
                    setSelectedRequest(null);
                    // Clear selected files when modal is closed via Close button
                    if (selectedFiles[selectedRequest.id]) {
                      setSelectedFiles(prev => {
                        const copy = { ...prev };
                        delete copy[selectedRequest.id];
                        return copy;
                      });
                    }
                  }} className="cancel-button">Close</button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ---------- TRANSFER POPUP ---------- */}
        {showTransferPopup && ReactDOM.createPortal(
          <div className="modal-overlay-travel" style={{ zIndex: 10001 }}>
            <div className="modal-travel" style={{ maxWidth: '400px' }}>
              <h3>Transfer Request #{selectedRequest.id}</h3>
              <div className="modal-content-travel">
                <div className="travel-field-group" style={{ marginBottom: '15px' }}>
                  <label className="travel-field-label" style={{ textAlign: 'left', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Select Admin <span style={{ color: 'red' }}>*</span></label>
                  <select
                    value={selectedTransferAdmin}
                    onChange={(e) => setSelectedTransferAdmin(e.target.value)}
                    className="travel-select-field"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                  >
                    <option value="">Choose Admin</option>
                    {allAdmins.filter(adm => adm.employeeId !== employeeId).map(adm => (
                      <option key={adm.employeeId} value={adm.employeeId}>{adm.firstName} {adm.lastName} ({getDisplayEmployeeId(adm.employeeId)})</option>
                    ))}
                  </select>
                </div>
                <div className="travel-field-group" style={{ marginBottom: '15px', position: 'relative' }}>
                  <label className="travel-field-label" style={{ textAlign: 'left', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Reason for Transfer <span style={{ color: 'red' }}>*</span></label>
                  <textarea
                    rows="3"
                    placeholder="Enter reason for transferring..."
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    maxLength={255}
                    className="travel-textarea-field"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', minHeight: '80px' }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '28px',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    pointerEvents: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 4px',
                    borderRadius: '4px'
                  }}>
                    {transferReason ? transferReason.length : 0}/255
                  </div>
                </div>
              </div>
              <div className="modal-actions-travel">
                <button
                  onClick={handleTransfer}
                  className="submit-button"
                  disabled={!selectedTransferAdmin || transferReason.trim().length < 5}
                >
                  Transfer
                </button>
                <button onClick={() => setShowTransferPopup(false)} className="cancel-button">Cancel</button>
              </div>
            </div>
          </div>,
          document.body
        )}


      </div>
    </div>

  );
}

export default MyTeamTravel;
