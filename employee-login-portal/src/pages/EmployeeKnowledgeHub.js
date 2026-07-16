import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar.js';
import api from '../api';
import { FiEye, FiDownload, FiInfo, FiFileText, FiChevronLeft } from 'react-icons/fi';
import './Dashboard.css';
 
function EmployeeKnowledgeHub() {
    const [allPolicies, setAllPolicies] = useState([]);
    const [filteredPolicies, setFilteredPolicies] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [userModules, setUserModules] = useState([]);
    const [isAccessLoaded, setIsAccessLoaded] = useState(false);

    const employeeId = sessionStorage.getItem("employeeId");
    const token = sessionStorage.getItem("token");

    // Fetch module access permissions
    useEffect(() => {
        if (!employeeId || !token) {
            setIsAccessLoaded(true);
            return;
        }
        api.get(`/v1/module-access/employee/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            const allowedModules = Object.keys(res.data)
                .filter(k => res.data[k] === true)
                .map(k => k.toUpperCase().replace(/\s+/g, '_'));
            setUserModules(allowedModules);
        }).catch(err => {
            console.error("Failed to load module access", err);
            setUserModules([]);
        }).finally(() => {
            setIsAccessLoaded(true);
        });
    }, [employeeId, token]);

    // Fetch dynamic categories from backend
    useEffect(() => {
        if (!isAccessLoaded || !userModules.includes("KNOWLEDGE_HUB")) return;
        api.get('/knowledge-hub/categories', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if (res.data && Array.isArray(res.data)) {
                setCategories(res.data.map(c => ({
                    id: c.categoryLabel,
                    title: c.categoryLabel
                })));
            }
        }).catch(err => console.error("Failed to load categories", err));
    }, [isAccessLoaded, userModules, token]);
 
    // Fetch all policies
    useEffect(() => {
        if (!isAccessLoaded || !userModules.includes("KNOWLEDGE_HUB")) return;
        api.get(`/knowledge-hub/all`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    setAllPolicies(res.data);
                }
            })
            .catch((err) => console.error("Failed to load knowledge hub metadata", err))
            .finally(() => setLoading(false));
    }, [isAccessLoaded, userModules, token]);
 
    useEffect(() => {
        if (selectedCategory) {
            setFilteredPolicies(allPolicies.filter(p => p.category === selectedCategory));
        } else {
            setFilteredPolicies([]);
        }
    }, [selectedCategory, allPolicies]);
 
    const viewPdf = (id) => {
        if (!id) return;
        api.get(`/knowledge-hub/file/${id}`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
            responseType: "blob"
        }).then(res => {
            const file = new Blob([res.data], { type: "application/pdf" });
            window.open(URL.createObjectURL(file), "_blank");
        }).catch(() => alert("Failed to load the document file."));
    };
 
    const downloadPdf = (id, fileName) => {
        if (!id) return;
        api.get(`/knowledge-hub/file/${id}`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
            responseType: "blob"
        }).then(res => {
            const file = new Blob([res.data], { type: "application/pdf" });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = fileURL;
            link.download = fileName || `Doc_${id}.pdf`;
            link.click();
            URL.revokeObjectURL(fileURL);
        }).catch(() => alert("Failed to download the document file."));
    };
    if (!isAccessLoaded) {
        return (
            <Sidebar>
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#f4f6f8',
                    padding: '40px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}>
                    <div className="loading-spinner" style={{ border: '3px solid #f3f4f6', borderTop: '3px solid #0B3D91', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                    <p style={{ color: '#64748b', marginTop: '16px' }}>Checking permissions...</p>
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

    if (!userModules.includes("KNOWLEDGE_HUB")) {
        return (
            <Sidebar>
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#f4f6f8',
                    padding: '40px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}>
                    <FiInfo style={{ fontSize: '48px', color: '#dc2626', marginBottom: '16px' }} />
                    <h2 style={{ color: '#1f2937', marginBottom: '8px' }}>Access Denied</h2>
                    <p style={{ color: '#4b5563' }}>You do not have access to the Knowledge Hub module.</p>
                </div>
            </Sidebar>
        );
    }

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
                            {selectedCategory || "Knowledge Hub"}
                        </h1>
                        <p style={{ color: '#00b3a4', fontSize: '15px', margin: '5px 0 0 0', padding: 0, fontFamily: "'Inter', sans-serif", textAlign: 'left' }}>
                            {selectedCategory ? `Viewing documents in ${selectedCategory}` : "View and access organizational documents and references."}
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
                                <p style={{ color: '#64748b', marginTop: '16px' }}>Loading documents...</p>
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
 
export default EmployeeKnowledgeHub;
