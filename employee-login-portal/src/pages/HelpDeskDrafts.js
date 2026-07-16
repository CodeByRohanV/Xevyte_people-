import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const HelpDeskDrafts = () => {
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Check for mobile view
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const employeeId = sessionStorage.getItem("employeeId");
            
            if (!token || !employeeId) {
                setError('Authentication required');
                setLoading(false);
                return;
            }

            // Fetch new ticket drafts first
            let newTicketDrafts = [];
            let changeRequestDrafts = [];

            try {
                const newTicketRes = await api.get(`/tickets/drafts/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                newTicketDrafts = newTicketRes.data || [];
            } catch (err) {
                console.warn('Failed to fetch new ticket drafts:', err);
            }

            // Try to fetch change request drafts, but handle if endpoint doesn't exist
            try {
                const changeRequestRes = await api.get(`/tickets/change-request/drafts/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                changeRequestDrafts = changeRequestRes.data || [];
            } catch (err) {
                console.warn('Change request drafts endpoint not available:', err);
                // Fallback: try to get drafts from the general endpoint with filter
                try {
                    const allTicketsRes = await api.get(`/tickets/my-tickets/${employeeId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    changeRequestDrafts = (allTicketsRes.data || [])
                        .filter(ticket => ticket.status === 'DRAFT' && ticket.ticketType === 'CHANGE_REQUEST');
                } catch (fallbackErr) {
                    console.warn('Fallback method also failed:', fallbackErr);
                }
            }

            const allDrafts = [
                ...newTicketDrafts,
                ...changeRequestDrafts
            ].map(draft => ({
                ...draft,
                ticketType: draft.ticketType || 'NEW_TICKET' // Fallback for drafts without ticketType
            }));

            // Sort by creation date (newest first)
            allDrafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setDrafts(allDrafts);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching drafts:', err);
            setError('Failed to load drafts');
            setLoading(false);
        }
    };

    const handleEdit = (draft) => {
        // Navigate to the appropriate tab with draft data
        if (draft.ticketType === 'NEW_TICKET') {
            navigate('/helpdesk', { 
                state: { 
                    activeTab: 'create',
                    editDraft: draft
                } 
            });
        } else if (draft.ticketType === 'CHANGE_REQUEST') {
            navigate('/helpdesk', { 
                state: { 
                    activeTab: 'changeRequest',
                    editDraft: draft
                } 
            });
        }
    };

    const handleDelete = async (draftId, ticketType) => {
        if (!window.confirm('Are you sure you want to delete this draft?')) {
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            let deleted = false;

            if (ticketType === 'NEW_TICKET') {
                const endpoint = `/tickets/draft/${draftId}`;
                await api.delete(endpoint, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                deleted = true;
            } else if (ticketType === 'CHANGE_REQUEST') {
                // Try the specific change request draft endpoint first
                try {
                    const endpoint = `/tickets/change-request/draft/${draftId}`;
                    await api.delete(endpoint, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    deleted = true;
                } catch (err) {
                    console.warn('Change request draft delete endpoint not available, trying fallback:', err);
                    // Fallback: try to delete via general ticket endpoint
                    try {
                        await api.delete(`/tickets/${draftId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        deleted = true;
                    } catch (fallbackErr) {
                        console.error('Fallback delete also failed:', fallbackErr);
                        throw fallbackErr;
                    }
                }
            }

            if (deleted) {
                // Refresh drafts list
                fetchDrafts();
            }
        } catch (err) {
            console.error('Error deleting draft:', err);
            alert('Failed to delete draft');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const styles = {
        container: {
            padding: isMobileView ? '0' : '0',
            maxWidth: '100%',
            margin: '0 auto',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        header: {
            fontSize: isMobileView ? '20px' : '26px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '20px',
            borderBottom: '2px solid #ddd',
            paddingBottom: '10px',
        },
        title: {
            fontSize: isMobileView ? '20px' : '24px',
            marginBottom: '20px',
            color: '#333',
        },
        tableScrollContainer: {
            maxHeight: isMobileView ? 'calc(100vh - 250px)' : 'calc(100vh - 300px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            marginTop: '0',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            backgroundColor: '#F5F7FA',
        },
        table: {
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0",
            backgroundColor: '#F5F7FA',
        },
        th: {
            backgroundColor: "#629AF1",
            color: "white",
            padding: isMobileView ? "6px 10px" : "8px 16px",
            textAlign: "left",
            fontWeight: "700",
            fontSize: isMobileView ? "12px" : "14px",
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: "2px solid #3b82f6",
        },
        td: {
            padding: isMobileView ? "8px 10px" : "12px 15px",
            borderBottom: "1px solid #eee",
            fontSize: isMobileView ? "11px" : "14px",
            color: "#555",
            whiteSpace: "normal",
            wordBreak: "break-word",
            maxWidth: "180px",
            verticalAlign: 'middle',
        },
        ticketTypeBadge: (isChangeRequest, isMobile) => ({
            backgroundColor: isChangeRequest ? '#2563eb' : '#3b82f6',
            color: 'white',
            padding: isMobile ? '3px 10px' : '5px 14px',
            borderRadius: '20px',
            fontSize: isMobile ? '10px' : '12px',
            fontWeight: '700',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }),
        actionButton: {
            padding: isMobileView ? '6px' : '8px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: isMobileView ? '14px' : '16px',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '6px',
            width: isMobileView ? '32px' : '36px',
            height: isMobileView ? '32px' : '36px',
            verticalAlign: 'middle',
        },
        editButton: {
            backgroundColor: 'transparent',
            color: '#00B3A4',
        },
        deleteButton: {
            backgroundColor: 'transparent',
            color: '#ef4444',
        },
        emptyState: {
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b',
        },
        emptyStateIcon: {
            fontSize: '48px',
            color: '#cbd5e1',
            marginBottom: '20px',
        },
        emptyStateText: {
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '10px',
        },
        emptyStateSubtext: {
            fontSize: '14px',
            color: '#94a3b8',
        },
        loadingState: {
            textAlign: 'center',
            padding: '40px',
            color: '#64748b',
        },
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingState}>
                    <div>Loading drafts...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingState}>
                    <div style={{ color: '#ef4444' }}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            

            {drafts.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>📝</div>
                    <div style={styles.emptyStateText}>No drafts found</div>
                    <div style={styles.emptyStateSubtext}>
                        Your saved drafts will appear here. You can save a draft by clicking "Save as Draft" when creating a ticket or change request.
                    </div>
                </div>
            ) : (
                <div style={{
                    ...styles.tableScrollContainer,
                    maxHeight: isMobileView ? 'calc(100vh - 250px)' : 'calc(100vh - 300px)',
                    marginTop: "0"
                }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, width: "8%", whiteSpace: "nowrap" }}>ID</th>
                                    <th style={{ ...styles.th, width: "12%", minWidth: isMobileView ? '100px' : '130px' }}>Type</th>
                                    <th style={{ ...styles.th, width: "12%" }}>Category</th>
                                    <th style={{ ...styles.th, width: "12%" }}>Subcategory</th>
                                    <th style={{ ...styles.th, width: "20%" }}>Summary</th>
                                    <th style={{ ...styles.th, width: "15%" }}>Description</th>
                                    <th style={{ ...styles.th, width: "15%" }}>Created Date</th>
                                    <th style={{ ...styles.th, width: "12%" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drafts.map((draft) => (
                                    <tr key={draft.id}>
                                        <td style={{ ...styles.td, whiteSpace: "nowrap" }}>{draft.id}</td>
                                        <td style={styles.td}>
                                            {draft.ticketType === 'CHANGE_REQUEST' ? 'Change Request' : 'New Ticket'}
                                        </td>
                                        <td style={styles.td}>{draft.category || '-'}</td>
                                        <td style={styles.td}>{draft.subcategory || '-'}</td>
                                        <td style={styles.td}>
                                            {draft.issueSummary ? (draft.issueSummary.length > 50 ? draft.issueSummary.substring(0, 50) + '...' : draft.issueSummary) : '-'}
                                        </td>
                                        <td style={styles.td}>
                                            {draft.detailedDescription ? (draft.detailedDescription.length > 30 ? draft.detailedDescription.substring(0, 30) + '...' : draft.detailedDescription) : '-'}
                                        </td>
                                        <td style={styles.td}>{formatDate(draft.createdAt)}</td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <button
                                                    style={{ ...styles.actionButton, ...styles.editButton }}
                                                    onClick={() => handleEdit(draft)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = '#00968A';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = '#00B3A4';
                                                    }}
                                                    title="Edit Draft"
                                                >
                                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    style={{ ...styles.actionButton, ...styles.deleteButton }}
                                                    onClick={() => handleDelete(draft.id, draft.ticketType)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = '#dc2626';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = '#ef4444';
                                                    }}
                                                    title="Delete Draft"
                                                >
                                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpDeskDrafts;
