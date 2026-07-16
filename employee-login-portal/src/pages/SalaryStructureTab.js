import React, { useState, useCallback, useEffect } from 'react';
import api from '../api';
import SimpleStructureCreator from './SimpleStructureCreator';
import './Calculations.css';
import { FiTrash, FiPower } from 'react-icons/fi';

const SalaryStructureTab = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [showSimpleCreator, setShowSimpleCreator] = useState(false);
  const [viewingStructure, setViewingStructure] = useState(null);
  const [structureDetails, setStructureDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  const BASE = '/v1/calculations';

  const loadStructures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: pageSize, sortBy, sortDir });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`${BASE}/structures?${params}`);
      setStructures(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch { alert('Failed to load structures.'); }
    finally { setLoading(false); }
  }, [page, sortBy, sortDir, search, statusFilter]);

  useEffect(() => { loadStructures(); }, [loadStructures]);
  useEffect(() => { const t = setTimeout(() => setPage(0), 400); return () => clearTimeout(t); }, [search, statusFilter]);

  const handleSort = col => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setPage(0);
  };

  const deleteStructure = async (id) => {
    try {
      await api.delete(`${BASE}/structures/${id}`);
      alert('Structure deleted successfully!');
      loadStructures();
    } catch (e) { alert('Delete failed: ' + (e.response?.data?.error || e.message)); }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`${BASE}/structures/${id}/status`, null, {
        params: { status: newStatus }
      });
      alert(`Structure ${newStatus.toLowerCase()} successfully!`);
      loadStructures();
    } catch (e) { alert('Status update failed: ' + (e.response?.data?.error || e.message)); }
  };

  const viewStructure = async (id) => {
    setViewingStructure(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`${BASE}/structures/${id}`);
      setStructureDetails(res.data);
    } catch (e) {
      alert('Failed to load structure details: ' + (e.response?.data?.error || e.message));
      setViewingStructure(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const editStructure = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`${BASE}/structures/${id}`);
      setEditingStructure(res.data);
      setShowSimpleCreator(true);
    } catch (e) {
      alert('Failed to load structure for editing: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoadingDetails(false);
    }
  };

  const pageNumbers = () => {
    const nums = [], start = Math.max(0, page - 2), end = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  };

  const fmtDateTime = (dt) => {
    if (!dt) return 'n/a';
    const d = new Date(dt);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace(',', '');
  };

  const StatusBadge = ({ status }) => (
    <span style={{
      padding: '2px 9px',
      borderRadius: 999,
      fontSize: '0.72rem',
      fontWeight: 700,
      background: status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
      color: status === 'ACTIVE' ? '#166534' : '#475569',
      border: `1px solid ${status === 'ACTIVE' ? '#bbf7d0' : '#e2e8f0'}`
    }}>
      {status}
    </span>
  );

  return (
    <div className="calc-page">
      <div className="calc-toolbar">
        <div className="calc-search-box">
          <input id="calc-search-input" type="text" placeholder="Search structures"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px', width: '140px' }}>
          <select id="calc-status-filter" className="calc-filter-select" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            style={{ flex: 1 }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <button className="calc-btn-primary" onClick={() => setShowSimpleCreator(true)}>+ New Structure</button>
        <button className="calc-btn-secondary" style={{ marginLeft: 'auto' }} onClick={loadStructures}>Refresh</button>
      </div>

      <div className="calc-card">
        {loading ? (
          <div className="calc-spinner"><div className="calc-spinner-ring" /></div>
        ) : (
          <div className="calc-table-wrapper">
            <table className="calc-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>Structure Name</th>
                  <th>Components</th>
                  <th onClick={() => handleSort('createdAt')}>Created</th>
                  <th onClick={() => handleSort('status')}>Status</th>
                  <th style={{ cursor: 'default' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, cursor: 'pointer', color: '#0d9488' }}>{s.name}</td>
                    <td>
                      {s.componentCount > 0
                        ? <span style={{ background: '#f0fdfa', border: '1px solid #14b8a6', color: '#0d9488', borderRadius: 999, padding: '2px 9px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {s.componentCount} {s.componentCount === 1 ? 'Component' : 'Components'}
                        </span>
                        : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>-</span>
                      }
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{fmtDateTime(s.createdAt)}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="calc-btn-view" onClick={() => viewStructure(s.id)}>View</button>
                        <button className="calc-btn-edit" onClick={() => editStructure(s.id)}>Edit</button>
                        <button className="calc-btn-secondary" onClick={() => toggleStatus(s.id, s.status)} style={{ backgroundColor: 'transparent', border: 'none', padding: '4px 8px' }}>
                          <FiPower style={{ color: s.status === 'ACTIVE' ? '#ef4444' : '#22c55e' }} />
                        </button>
                        <button className="calc-btn-danger" onClick={() => { if (window.confirm('Delete structure?')) deleteStructure(s.id); }} style={{ backgroundColor: 'transparent', border: 'none', padding: '4px 8px' }}><FiTrash style={{ color: '#ef4444' }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 0 && (
          <div className="calc-pagination">
            <span className="calc-pagination-info">Showing {structures.length} of {totalElements}</span>
            <div className="calc-pagination-controls">
              <button className="calc-page-btn" onClick={() => setPage(0)} disabled={page === 0}>{' < '}</button>
              {pageNumbers().map(n => (
                <button key={n} className={`calc-page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n + 1}</button>
              ))}
              <button className="calc-page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>{'>'}</button>
            </div>
          </div>
        )}
      </div>

      {viewingStructure && (
        <div className="calc-modal-overlay" onClick={() => setViewingStructure(null)}>
          <div className="calc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="calc-modal-header">
              <h2>Structure Details</h2>
              <button className="calc-modal-close" onClick={() => setViewingStructure(null)}>×</button>
            </div>
            <div className="calc-modal-body">
              {loadingDetails ? (
                <div className="calc-spinner"><div className="calc-spinner-ring" /></div>
              ) : structureDetails ? (
                <div>
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{structureDetails.name}</h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#64748b' }}>{structureDetails.description}</p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: '600' }}>Status: {structureDetails.status}</span>
                      <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: '600' }}>Components: {structureDetails.components?.length || 0}</span>
                      <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#e0f2fe', color: '#075985', borderRadius: '4px', fontWeight: '600' }}>Created: {fmtDateTime(structureDetails.createdAt)}</span>
                    </div>
                  </div>

                  {structureDetails.components && structureDetails.components.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: '700', color: '#166534', backgroundColor: '#f0fdf4', padding: '6px 12px', borderRadius: '4px', display: 'inline-block' }}>Earnings Section</h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b', width: '40px' }}>#</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' }}>Component Name</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' }}>Type</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' }}>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {structureDetails.components
                                .filter(c => c.section === 'EARNINGS')
                                .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                                .map((comp, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.8rem' }}>{index + 1}</td>
                                  <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{comp.componentName}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{ color: '#0891b2', fontSize: '0.8rem' }}>{comp.componentType?.replace('_', ' ')}</span>
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                      {comp.componentType === 'AS_APPLICABLE' ? 'As Applicable' : (
                                        comp.componentType === 'FORMULA' ? (
                                          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{comp.formula}</code>
                                        ) : `₹${comp.perMonthValue?.toLocaleString()}/mo`
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: '700', color: '#991b1b', backgroundColor: '#fef2f2', padding: '6px 12px', borderRadius: '4px', display: 'inline-block' }}>Deductions Section</h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b', width: '40px' }}>#</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' }}>Component Name</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' }}>Type</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' }}>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {structureDetails.components
                                .filter(c => c.section === 'DEDUCTIONS')
                                .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                                .map((comp, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.8rem' }}>{index + 1}</td>
                                  <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{comp.componentName}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{ color: '#0891b2', fontSize: '0.8rem' }}>{comp.componentType?.replace('_', ' ')}</span>
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                      {comp.componentType === 'AS_APPLICABLE' ? 'As Applicable' : (
                                        comp.componentType === 'FORMULA' ? (
                                          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{comp.formula}</code>
                                        ) : `₹${comp.perMonthValue?.toLocaleString()}/mo`
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <p>No components found</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>Failed to load structure details</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSimpleCreator && (
        <SimpleStructureCreator
          editingStructure={editingStructure}
          onStructureCreated={(structure) => {
            setShowSimpleCreator(false);
            setEditingStructure(null);
            loadStructures();
          }}
          onCancel={() => {
            setShowSimpleCreator(false);
            setEditingStructure(null);
          }}
        />
      )}
    </div>
  );
};

export default SalaryStructureTab;
