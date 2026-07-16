import React, { useState, useEffect } from 'react';
import api from '../../api';
import { FiFileText, FiCheck, FiX, FiEye, FiDownload, FiSearch, FiFilter } from 'react-icons/fi';
import './EmployeeDetailsTab.css'; // Reusing some styles

const ITDeclarationTab = () => {
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedDecl, setSelectedDecl] = useState(null);

    useEffect(() => {
        fetchDeclarations();
    }, []);

    const fetchDeclarations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/it-declarations/all');
            setDeclarations(response.data);
        } catch (error) {
            console.error("Failed to fetch declarations", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status, remarks = "") => {
        try {
            await api.put(`/it-declarations/${id}/status?status=${status}&remarks=${remarks}`);
            fetchDeclarations();
            if (selectedDecl && selectedDecl.id === id) {
                setSelectedDecl(null);
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const filteredDeclarations = declarations.filter(d => {
        const matchesSearch = d.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             d.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="payroll-tab-content">
            <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ color: '#115e59', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiFileText /> Employee IT Declarations
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="search-box" style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search employee..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', height: '40px' }}
                        />
                    </div>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ borderRadius: '8px', border: '1px solid #e2e8f0', height: '40px', padding: '0 0.5rem' }}
                    >
                        <option value="All">All Status</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading declarations...</div>
            ) : (
                <div className="table-responsive">
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Financial Year</th>
                                <th>Total 80C</th>
                                <th>Monthly Rent</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeclarations.map(decl => (
                                <tr key={decl.id}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{decl.employee?.firstName} {decl.employee?.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{decl.employee?.employeeId}</div>
                                    </td>
                                    <td>{decl.financialYear}</td>
                                    <td>₹ {(decl.licPremium + decl.epfVpf + decl.ppf + decl.elss + decl.homeLoanPrincipal + decl.tuitionFees + decl.nsc + decl.fixedDeposit5Year + decl.other80C).toLocaleString()}</td>
                                    <td>₹ {decl.monthlyRent.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-pill ${decl.status.toLowerCase()}`}>
                                            {decl.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="icon-btn" title="View Details" onClick={() => setSelectedDecl(decl)}><FiEye /></button>
                                            {decl.status === 'Submitted' && (
                                                <>
                                                    <button className="icon-btn success" title="Approve" onClick={() => updateStatus(decl.id, 'Approved')}><FiCheck /></button>
                                                    <button className="icon-btn danger" title="Reject" onClick={() => updateStatus(decl.id, 'Rejected')}><FiX /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDeclarations.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No declarations found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedDecl && (
                <div className="modal-overlay" onClick={() => setSelectedDecl(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>IT Declaration Details - {selectedDecl.employee?.firstName}</h3>
                            <button onClick={() => setSelectedDecl(null)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ color: '#0d9488', borderBottom: '1px solid #ccfbf1', paddingBottom: '0.5rem' }}>Section 80C</h4>
                                    <DetailRow label="LIC Premium" value={selectedDecl.licPremium} />
                                    <DetailRow label="EPF/VPF" value={selectedDecl.epfVpf} />
                                    <DetailRow label="PPF" value={selectedDecl.ppf} />
                                    <DetailRow label="ELSS" value={selectedDecl.elss} />
                                    <DetailRow label="Home Loan Principal" value={selectedDecl.homeLoanPrincipal} />
                                    <DetailRow label="Tuition Fees" value={selectedDecl.tuitionFees} />
                                </div>
                                <div>
                                    <h4 style={{ color: '#0d9488', borderBottom: '1px solid #ccfbf1', paddingBottom: '0.5rem' }}>HRA & Others</h4>
                                    <DetailRow label="Monthly Rent" value={selectedDecl.monthlyRent} />
                                    <DetailRow label="Landlord Name" value={selectedDecl.landlordName} isText />
                                    <DetailRow label="Landlord PAN" value={selectedDecl.landlordPan} isText />
                                    <DetailRow label="Medical (80D)" value={selectedDecl.medicalInsurance80D} />
                                    <DetailRow label="HL Interest (24b)" value={selectedDecl.homeLoanInterest24b} />
                                </div>
                            </div>
                            {selectedDecl.remarks && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                    <strong>Employee Remarks:</strong>
                                    <p style={{ margin: '0.5rem 0 0 0' }}>{selectedDecl.remarks}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                             {selectedDecl.status === 'Submitted' && (
                                <>
                                    <button className="btn-secondary danger" onClick={() => updateStatus(selectedDecl.id, 'Rejected')}>Reject</button>
                                    <button className="btn-primary" onClick={() => updateStatus(selectedDecl.id, 'Approved')}>Approve</button>
                                </>
                             )}
                             <button className="btn-secondary" onClick={() => setSelectedDecl(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .status-pill { padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
                .status-pill.submitted { background: #ecfeff; color: #0891b2; }
                .status-pill.approved { background: #f0fdf4; color: #16a34a; }
                .status-pill.rejected { background: #fef2f2; color: #dc2626; }
                .status-pill.draft { background: #f1f5f9; color: #64748b; }
                
                .icon-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .icon-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .icon-btn.success { color: #16a34a; }
                .icon-btn.success:hover { background: #f0fdf4; border-color: #bcfecb; }
                .icon-btn.danger { color: #dc2626; }
                .icon-btn.danger:hover { background: #fef2f2; border-color: #fecaca; }

                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
                .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
                .modal-header h3 { margin: 0; color: #1e293b; }
                .modal-header button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
            `}</style>
        </div>
    );
};

const DetailRow = ({ label, value, isText = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc' }}>
        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{label}</span>
        <span style={{ fontWeight: '600', color: '#1e293b' }}>
            {isText ? (value || 'N/A') : `₹ ${value?.toLocaleString() || 0}`}
        </span>
    </div>
);

export default ITDeclarationTab;
