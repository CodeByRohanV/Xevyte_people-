import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar.js';
import api from '../api';
import { FiEye, FiDownload, FiInfo, FiFileText, FiChevronLeft, FiCheckCircle } from 'react-icons/fi';
import AcknowledgePoliciesOverlay from './AcknowledgePoliciesOverlay';
import './Dashboard.css';

function EmployeeHandBook() {
    console.log("DEBUG IMPORTS:", {
        Sidebar,
        FiEye,
        FiDownload,
        FiInfo,
        FiFileText,
        FiChevronLeft,
        FiCheckCircle,
        AcknowledgePoliciesOverlay
    });
    const [allPolicies, setAllPolicies] = useState([]);
    const [filteredPolicies, setFilteredPolicies] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    const [pendingPolicies, setPendingPolicies] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showBanner, setShowBanner] = useState(true);

    const fetchPendingPolicies = () => {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        api.get('/policies/pending', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            if (res.data && Array.isArray(res.data)) {
                setPendingPolicies(res.data);
                setPendingCount(res.data.length);
            }
        })
        .catch(err => console.error("Failed to fetch pending policies", err));
    };

    useEffect(() => {
        fetchPendingPolicies();
    }, []);

    const handleCompleteAll = () => {
        setShowOverlay(false);
        fetchPendingPolicies();
        window.dispatchEvent(new Event("refreshPendingPoliciesCount"));
    };

    const handleCancelOverlay = () => {
        setShowOverlay(false);
    };

    const [submittingAckAll, setSubmittingAckAll] = useState(false);

    const handleAcknowledgeAllDirectly = () => {
        const token = sessionStorage.getItem("token");
        if (!token || pendingPolicies.length === 0) return;

        setSubmittingAckAll(true);
        Promise.all(
            pendingPolicies.map(policy =>
                api.post(`/policies/acknowledge/${policy.id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            )
        )
        .then(() => {
            // Refresh handbook document list
            api.get(`/handbook/all`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    setAllPolicies(res.data);
                }
            })
            .catch(err => console.error(err));

            fetchPendingPolicies();
            window.dispatchEvent(new Event("refreshPendingPoliciesCount"));
        })
        .catch(err => {
            console.error("Failed to acknowledge all policies directly", err);
            alert("Failed to acknowledge all documents. Please try again.");
        })
        .finally(() => {
            setSubmittingAckAll(false);
        });
    };

    // Fetch dynamic categories from backend
    useEffect(() => {
        api.get('/handbook/categories', {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
        }).then(res => {
            if (res.data && Array.isArray(res.data)) {
                setCategories(res.data.map(c => ({
                    id: c.categoryLabel,
                    title: c.categoryLabel
                })));
            }
        }).catch(err => console.error("Failed to load categories", err));
    }, []);

    // Fetch all policies
    useEffect(() => {
        api.get(`/handbook/all`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
        })
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    setAllPolicies(res.data);
                }
            })
            .catch((err) => console.error("Failed to load handbook metadata", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            setFilteredPolicies(allPolicies.filter(p => p.category === selectedCategory));
        } else {
            setFilteredPolicies([]);
        }
    }, [selectedCategory, allPolicies]);

    const viewPdf = (id) => {
        if (!id) return;
        api.get(`/handbook/file/${id}`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
            responseType: "blob"
        }).then(res => {
            const file = new Blob([res.data], { type: "application/pdf" });
            window.open(URL.createObjectURL(file), "_blank");
        }).catch(() => alert("Failed to load the policy file."));
    };

    const downloadPdf = (id, fileName) => {
        if (!id) return;
        api.get(`/handbook/file/${id}`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
            responseType: "blob"
        }).then(res => {
            const file = new Blob([res.data], { type: "application/pdf" });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = fileURL;
            link.download = fileName || `Policy_${id}.pdf`;
            link.click();
            URL.revokeObjectURL(fileURL);
        }).catch(() => alert("Failed to download the policy file."));
    };

    const handleDirectAcknowledge = (id) => {
        if (!id) return;
        api.post(`/policies/acknowledge/${id}`, {}, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
        })
        .then(() => {
            setAllPolicies(prev => prev.map(p => p.id === id ? { ...p, acknowledged: true } : p));
            fetchPendingPolicies();
            window.dispatchEvent(new Event("refreshPendingPoliciesCount"));
        })
        .catch(err => {
            console.error("Failed to acknowledge policy", err);
            alert("Failed to submit acknowledgment.");
        });
    };

    return (
        <Sidebar>
            <div className="policies-container" style={{
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                padding: '1rem',
                fontFamily: "'Inter', sans-serif"
            }}>

                {/* Header Section */}
                <div className="policies-header-top" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {selectedCategory ? (
                            <button
                                onClick={() => setSelectedCategory(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'none', border: 'none', color: '#00b3a4',
                                    fontWeight: '600', cursor: 'pointer', padding: 0, marginBottom: '12px',
                                    fontSize: '15px', fontFamily: "'Inter', sans-serif"
                                }}
                            >
                                <FiChevronLeft strokeWidth={2.5} /> Back to Categories
                            </button>
                        ) : null}
                        <h1 style={{ margin: 0, padding: 0, fontWeight: 'normal', fontSize: '30px', color: '#1F2937', fontFamily: "'Inter', sans-serif", textAlign: 'left' }}>
                            {selectedCategory || "Company Policies"}
                        </h1>
                        <p style={{ color: '#00b3a4', fontSize: '15px', margin: '5px 0 0 0', padding: 0, fontFamily: "'Inter', sans-serif", textAlign: 'left' }}>
                            {selectedCategory ? `Viewing documents in ${selectedCategory}` : "View and manage organizational policies and guidelines."}
                        </p>
                    </div>
                </div>

                {!selectedCategory ? (
                    /* Category Cards Grid */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        maxWidth: '960px'
                    }}>
                        {categories.map(cat => {
                            const count = allPolicies.filter(p => p.category === cat.id).length;
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    style={{
                                        background: '#ffffff',
                                        padding: '22px 24px 20px 24px',
                                        borderRadius: '8px',
                                        border: '1px solid #e4e8ef',
                                        boxShadow: 'none',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#00b3a4';
                                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,179,164,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e4e8ef';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <p style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '400', color: '#0d1b2a', letterSpacing: '0' }}>{cat.title}</p>
                                    <p style={{ margin: '0 0 10px 0', color: '#9ca3af', fontSize: '15px', fontWeight: '400' }}>{count} {count === 1 ? 'document' : 'documents'}</p>
                                    <div style={{ color: '#00b3a4', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        View All <FiChevronLeft style={{ transform: 'rotate(180deg)', strokeWidth: 2.5 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Documents Table */
                    <div className="policies-card" style={{
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e4e8ef',
                        boxShadow: 'none',
                        overflow: 'hidden'
                    }}>
                        {loading ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <div className="loading-spinner" style={{ border: '3px solid #f3f4f6', borderTop: '3px solid #0B3D91', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                                <p style={{ color: '#64748b', marginTop: '16px' }}>Loading policies...</p>
                            </div>
                        ) : filteredPolicies.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <FiInfo style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
                                <h3 style={{ color: '#334155', marginBottom: '8px' }}>No documents available</h3>
                                <p style={{ color: '#64748b' }}>There are currently no documents published in this category.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '14px 24px', backgroundColor: '#629AF1', color: '#ffffff', fontWeight: '700', fontSize: '15px', letterSpacing: '0.02em' }}>Document Name</th>
                                            <th style={{ padding: '14px 24px', backgroundColor: '#629AF1', color: '#ffffff', fontWeight: '700', fontSize: '15px', letterSpacing: '0.02em' }}>Date Published</th>
                                            <th style={{ padding: '14px 24px', backgroundColor: '#629AF1', color: '#ffffff', fontWeight: '700', fontSize: '15px', letterSpacing: '0.02em' }}>Status</th>
                                            <th style={{ padding: '14px 24px', backgroundColor: '#629AF1', color: '#ffffff', fontWeight: '700', fontSize: '15px', letterSpacing: '0.02em', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPolicies.map((policy) => (
                                            <tr key={policy.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f5ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '500', fontSize: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <FiFileText style={{ color: '#629AF1', flexShrink: 0 }} />
                                                        {policy.originalFileName}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '15px' }}>
                                                    {new Date(policy.uploadedAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '15px' }}>
                                                    {policy.acknowledged ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                            color: '#10b981',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: '600'
                                                        }}>
                                                            <FiCheckCircle /> Acknowledged
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleDirectAcknowledge(policy.id)}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                backgroundColor: '#f1f5f9',
                                                                color: '#64748b',
                                                                border: '1px solid #cbd5e1',
                                                                padding: '4px 10px',
                                                                borderRadius: '12px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#00b3a4';
                                                                e.currentTarget.style.color = '#ffffff';
                                                                e.currentTarget.style.borderColor = '#00b3a4';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f1f5f9';
                                                                e.currentTarget.style.color = '#64748b';
                                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                                            }}
                                                        >
                                                            Acknowledge
                                                        </button>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <button onClick={() => viewPdf(policy.id)} style={{ background: 'none', border: 'none', color: '#629AF1', cursor: 'pointer', marginRight: '16px', padding: '4px' }} title="View Document">
                                                        <FiEye size={18} />
                                                    </button>
                                                    <button onClick={() => downloadPdf(policy.id, policy.originalFileName)} style={{ background: 'none', border: 'none', color: '#00b3a4', cursor: 'pointer', padding: '4px' }} title="Download Document">
                                                        <FiDownload size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                 {pendingCount > 0 && !showOverlay && showBanner && (
                    <div className="ack-floating-banner">
                        <div className="ack-banner-content">
                            <FiInfo className="ack-banner-info-icon" />
                            <span>You have <strong>{pendingCount}</strong> pending document acknowledgment(s).</span>
                        </div>
                        <div className="ack-banner-actions">
                            <button className="ack-banner-btn-view" onClick={() => setShowOverlay(true)}>View</button>
                            <button 
                                className="ack-banner-btn-ackall" 
                                onClick={handleAcknowledgeAllDirectly}
                                disabled={submittingAckAll}
                            >
                                {submittingAckAll ? "Acknowledging..." : "Acknowledge All"}
                            </button>
                            <button className="ack-banner-btn-later" onClick={() => setShowBanner(false)}>Later</button>
                        </div>
                    </div>
                )}

                {pendingPolicies.length > 0 && showOverlay && (
                    <AcknowledgePoliciesOverlay
                        policies={pendingPolicies}
                        token={sessionStorage.getItem("token")}
                        onComplete={handleCompleteAll}
                        onCancel={handleCancelOverlay}
                    />
                )}

                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </Sidebar>
    );
}

export default EmployeeHandBook;
