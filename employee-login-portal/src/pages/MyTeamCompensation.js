import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../api';
import { FiCheckSquare, FiAlertCircle, FiEye } from 'react-icons/fi';

function MyTeamCompensation({ onDataLoaded, onActionComplete, refreshTrigger = 0 }) {
    const [pendingTasks, setPendingTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approverComments, setApproverComments] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null); // For View Modal
    const employeeId = sessionStorage.getItem("employeeId")?.replace(/^"|"$/g, "");

    const fetchPendingTasks = async () => {
        if (!employeeId) return;
        setLoading(true);
        const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
        try {
            const resp = await api.get(`/compensation/approver/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingTasks(resp.data);
            if (onDataLoaded) {
                onDataLoaded(resp.data.length);
            }
        } catch (err) {
            console.error("Pending Compensation fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTasks();
    }, [employeeId, refreshTrigger]);

    const handleAction = async (empId, action, id) => {
        if (!approverComments && action === 'reject') {
            alert("Please provide comments for rejection.");
            return;
        }

        setIsActionLoading(true);
        const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
        try {
            await api.post(`/compensation/${action}`, {
                employeeId: empId,
                approverId: employeeId,
                comments: approverComments,
                id: id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Revision ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
            setApproverComments("");
            setSelectedTask(null); // Close modal
            fetchPendingTasks();
            if (onActionComplete) onActionComplete();
        } catch (err) {
            console.error("Compensation Action Error:", err);
            alert("Failed to process action.");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (loading && pendingTasks.length === 0) {
        return (
            <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    Loading compensation tasks...
                </td>
            </tr>
        );
    }

    if (pendingTasks.length === 0) {
        return (
            <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>
                    No pending compensation requests found.
                </td>
            </tr>
        );
    }

    return (
        <>
            {/* Main Table Rows */}
            {pendingTasks.map((task) => (
                <tr key={task.employeeId}>
                    <td style={{ fontWeight: '600' }}>{task.employeeId}</td>
                    <td>{task.employeeName}</td>
                    <td>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                            {task.status?.replace("_", " ")}
                        </div>
                    </td>
                    <td>
                        <button
                            onClick={() => setSelectedTask(task)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                color: '#0f172a',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            <FiEye /> View
                        </button>
                    </td>
                </tr>
            ))}

            {/* View Details Modal */}
            {selectedTask && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        width: '500px',
                        maxWidth: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '24px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                            Compensation Revision Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Employee Name</label>
                                <div style={{ fontWeight: '600' }}>{selectedTask.employeeName}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Employee ID</label>
                                <div style={{ fontWeight: '600' }}>{selectedTask.employeeId}</div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Current Fixed:</span>
                                    <div style={{ fontWeight: '600' }}>₹{selectedTask.currentFixedCtc?.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Current Variable:</span>
                                    <div style={{ fontWeight: '600' }}>₹{selectedTask.currentVariablePay?.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#0d9488' }}>Proposed Fixed:</span>
                                    <div style={{ fontWeight: '700', color: '#0d9488' }}>₹{selectedTask.proposedFixedCtc?.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#0d9488' }}>Proposed Variable:</span>
                                    <div style={{ fontWeight: '700', color: '#0d9488' }}>₹{selectedTask.proposedVariablePay?.toLocaleString()}</div>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', color: '#334155' }}>Final Fixed CTC</span>
                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                        ₹{selectedTask.proposedFixedCtc?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
                                <span style={{ fontSize: '11px', color: '#166534' }}>Salary Hike</span>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>{selectedTask.hikePercentage}%</div>
                            </div>
                            <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                                <span style={{ fontSize: '11px', color: '#1e40af' }}>Effective Date</span>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>{selectedTask.effectiveDate}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Approver Comments</label>
                            <textarea
                                placeholder="Enter comments here..."
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    minHeight: '80px'
                                }}
                                value={approverComments}
                                onChange={(e) => setApproverComments(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedTask(null)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: 'white',
                                    color: '#64748b',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isActionLoading}
                                onClick={() => handleAction(selectedTask.employeeId, 'reject', selectedTask.id)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #ef4444',
                                    backgroundColor: '#fee2e2',
                                    color: '#ef4444',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Reject
                            </button>
                            <button
                                disabled={isActionLoading}
                                onClick={() => handleAction(selectedTask.employeeId, 'approve', selectedTask.id)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default MyTeamCompensation;
