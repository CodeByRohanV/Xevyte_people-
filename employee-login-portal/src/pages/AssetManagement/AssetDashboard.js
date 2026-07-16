import React, { useEffect, useState } from 'react';
import api from "../../api";

const AssetDashboard = () => {
    const [recentActivities, setRecentActivities] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allLogsLoading, setAllLogsLoading] = useState(false);
    const [showAllLogsModal, setShowAllLogsModal] = useState(false);
    const token = sessionStorage.getItem("token");

    const fetchRecentActivities = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Assuming we have an endpoint for audit logs or recent activities
            const response = await api.get('/assets/audit-logs?limit=5', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecentActivities(response.data);
        } catch (err) {
            console.error("Error fetching audit logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllLogs = async () => {
        if (!token) return;
        setAllLogsLoading(true);
        try {
            const response = await api.get('/assets/audit-logs?limit=1000', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllLogs(response.data);
        } catch (err) {
            console.error("Error fetching all audit logs:", err);
            alert("Error fetching all logs. Please try again.");
        } finally {
            setAllLogsLoading(false);
        }
    };

    const handleViewAllLogs = () => {
        setShowAllLogsModal(true);
        fetchAllLogs();
    };

    useEffect(() => {
        fetchRecentActivities();
    }, [token]);

    const handleDeleteActivity = async (logId) => {
        if (!window.confirm("Are you sure you want to delete this activity log?")) {
            return;
        }
        try {
            await api.delete(`/assets/audit-logs/${logId}?userId=ADMIN`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRecentActivities();
            // Refresh all logs if modal is open
            if (showAllLogsModal) {
                fetchAllLogs();
            }
        } catch (error) {
            alert(error.response?.data || "Error deleting activity log");
        }
    };

    const handleDeleteAllActivities = async () => {
        if (!window.confirm("Are you sure you want to delete ALL activity logs? This action cannot be undone.")) {
            return;
        }
        try {
            await api.delete('/assets/audit-logs/all?userId=ADMIN', {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRecentActivities();
        } catch (error) {
            alert(error.response?.data || "Error deleting activity logs");
        }
    };

    return (
        <div className="dashboard-content">
            <div className="section-header">
                <h3 className="section-title">Recent Activities</h3>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }} onClick={handleViewAllLogs}>View All Logs</button>
            </div>

            <div className="asset-table-container">
                <table className="asset-table">
                    <thead>
                        <tr>
                            <th>Action Date</th>
                            <th>Asset Tag</th>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>Previous Status</th>
                            <th>New Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentActivities.length > 0 ? (
                            recentActivities.map((log) => (
                                <tr key={log.id}>
                                    <td>{(() => { const d = new Date(log.actionDate); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })()}</td>
                                    <td>{log.assetTag}</td>
                                    <td>{log.action}</td>
                                    <td>{log.performedBy}</td>
                                    <td>
                                        <span className={`badge ${getStatusClass(log.oldStatus)}`}>
                                            {log.oldStatus || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusClass(log.newStatus)}`}>
                                            {log.newStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="icon-btn-delete"
                                            title="Delete Activity"
                                            onClick={() => handleDeleteActivity(log.id)}
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '0.8rem',
                                                border: '1px solid #fecaca',
                                                background: '#fef2f2',
                                                color: '#ef4444',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                    {loading ? 'Loading activities...' : 'No recent activities found'}
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
            </div>

            {/* View All Logs Modal */}
            {showAllLogsModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '1200px',
                        width: '100%',
                        maxHeight: '80vh',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden'
                    }}>
                        <div className="modal-header" style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f9fafb'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#1f2937', fontWeight: '700' }}>All Asset Activity Logs</h2>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                                    Complete audit history of all asset operations
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAllLogsModal(false)}
                                style={{
                                    background: '#f3f4f6',
                                    border: 'none',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = '#e5e7eb';
                                    e.target.style.color = '#374151';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = '#f3f4f6';
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                            {allLogsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '1rem', color: '#6b7280' }}>Loading all logs...</div>
                                </div>
                            ) : allLogs.length > 0 ? (
                                <div className="asset-table-container">
                                    <table className="asset-table">
                                        <thead>
                                            <tr>
                                                <th>Action Date</th>
                                                <th>Asset Tag</th>
                                                <th>Action</th>
                                                <th>Performed By</th>
                                                <th>Previous Status</th>
                                                <th>New Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allLogs.map((log) => (
                                                <tr key={log.id}>
                                                    <td>{(() => { const d = new Date(log.actionDate); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })()}</td>
                                                    <td>{log.assetTag}</td>
                                                    <td>{log.action}</td>
                                                    <td>{log.performedBy}</td>
                                                    <td>
                                                        <span className={`badge ${getStatusClass(log.oldStatus)}`}>
                                                            {log.oldStatus || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${getStatusClass(log.newStatus)}`}>
                                                            {log.newStatus}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="icon-btn-delete"
                                                            title="Delete Activity"
                                                            onClick={() => handleDeleteActivity(log.id)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '0.8rem',
                                                                border: '1px solid #fecaca',
                                                                background: '#fef2f2',
                                                                color: '#ef4444',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '1rem', color: '#6b7280' }}>No activity logs found</div>
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e5e7eb',
                            background: '#f9fafb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Total Logs: {allLogs.length}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    className="btn-secondary"
                                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to delete ALL activity logs? This action cannot be undone.")) {
                                            handleDeleteAllActivities();
                                            setShowAllLogsModal(false);
                                        }
                                    }}
                                >
                                    <i className="bi bi-trash" style={{ marginRight: '6px' }}></i>
                                    Delete All Logs
                                </button>
                                <button
                                    className="btn-primary"
                                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                                    onClick={() => setShowAllLogsModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function for status classes
const getStatusClass = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('stock')) return 'badge-success';
    if (s.includes('allocated') || s.includes('issued')) return 'badge-info';
    if (s.includes('damaged') || s.includes('broken')) return 'badge-danger';
    if (s.includes('lost')) return 'badge-danger';
    if (s.includes('repair')) return 'badge-warning';
    return '';
};

export default AssetDashboard;
