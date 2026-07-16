import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import { FiSearch, FiFileText, FiTrash2, FiDownload, FiUser, FiAlertTriangle, FiEye } from 'react-icons/fi';
import './EmployeeDetailsTab.css';

// Employee Suggestion Component
const EmployeeSuggestion = ({ 
    suggestions, 
    showSuggestions, 
    suggestionsLoading, 
    onSelect,
    suggestionsRef,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex
}) => {
    if (!showSuggestions) return null;

    return (
        <div 
            ref={suggestionsRef}
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            {suggestionsLoading ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    Loading...
                </div>
            ) : suggestions.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    No suggestions found
                </div>
            ) : (
                suggestions.map((employee, index) => (
                    <div
                        key={employee.employeeId}
                        data-suggestion-item
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '13px',
                            transition: 'background-color 0.2s',
                            backgroundColor: selectedSuggestionIndex === index ? '#e0e0e0' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e0e0e0';
                            setSelectedSuggestionIndex(index);
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            setSelectedSuggestionIndex(-1);
                        }}
                        onClick={() => onSelect(employee)}
                    >
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </div>
                ))
            )}
        </div>
    );
};

const EmployeeDetailsTab = ({ employees = [] }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Employee suggestion states
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs for dropdown management
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchPayslips = async () => {
    setLoading(true);
    setError('');
    // Clear preview state when fetching new data
    setPreviewUrl(null);
    setShowPreview(false);

    try {
      let resp;
      if (selectedMonth && selectedYear) {
        resp = await api.get(`/payroll/payslips/month/${encodeURIComponent(selectedMonth)}/year/${encodeURIComponent(selectedYear)}`);
      } else {
        resp = await api.get('/payroll/payslips');
      }

      let results = Array.isArray(resp.data) ? resp.data : [];

      if (!selectedMonth && selectedYear) {
        results = results.filter(slip => slip.salaryYear === selectedYear);
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        results = results.filter(slip =>
          slip.employeeId?.toLowerCase().includes(searchLower) ||
          slip.employeeName?.toLowerCase().includes(searchLower)
        );
      }

      setPayslips(results);
    } catch (err) {
      setError('Failed to fetch records: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayslip = async (p) => {
    if (!window.confirm(`Delete record for ${p.employeeId}?`)) return;
    try {
      await api.delete(`/payroll/payslips/${p.id}`);
      fetchPayslips();
    } catch (err) {
      alert("Failed: " + (err.message));
    }
  };

  const downloadPdf = async (p) => {
    try {
      const resp = await api.get(`/payroll/payslip/${p.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${p.employeeId}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreview = async (p) => {
    try {
      const id = p.payslipId || p.id;
      const response = await api.get(`/payroll/payslip/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setPreviewFileName(`Payslip_${p.employeeId}_${p.salaryMonth}_${p.salaryYear}`);
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      setError('Failed to preview payslip.');
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setShowPreview(false);
    setPreviewUrl(null);
  };

  // Debounce function for search suggestions
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Fetch employee suggestions from API
  const fetchEmployeeSuggestions = async (query) => {
    if (!query || query.trim().length < 1) {
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      // Get authentication token
      const rawToken = sessionStorage.getItem('token');
      const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;

      if (!token) {
        console.error('Authentication token not found');
        setEmployeeSuggestions([]);
        setShowEmployeeSuggestions(false);
        return;
      }

      const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeSuggestions(response.data);
      setShowEmployeeSuggestions(response.data.length > 0);
    } catch (err) {
      console.error('Error fetching employee suggestions:', err);
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Debounced version of fetchEmployeeSuggestions
  const debouncedFetchSuggestions = debounce(fetchEmployeeSuggestions, 300);

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setSelectedSuggestionIndex(-1); // Reset selection when typing
    
    if (value.trim().length >= 1) {
      debouncedFetchSuggestions(value);
    } else {
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (employee) => {
    const searchValue = employee.employeeId;
    setSearchTerm(searchValue);
    setShowEmployeeSuggestions(false);
    setEmployeeSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showEmployeeSuggestions || employeeSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev < employeeSuggestions.length - 1 ? prev + 1 : 0;
          // Scroll to the selected item
          setTimeout(() => {
            const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
            if (suggestionItems && suggestionItems[newIndex]) {
              suggestionItems[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : employeeSuggestions.length - 1;
          // Scroll to the selected item
          setTimeout(() => {
            const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
            if (suggestionItems && suggestionItems[newIndex]) {
              suggestionItems[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < employeeSuggestions.length) {
          handleSuggestionClick(employeeSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowEmployeeSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowEmployeeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="employee-details-container">
      <h3 style={{ color: '#115e59', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.25rem' }}>
        <FiSearch /> Record Query
      </h3>

      <div className="filters-grid" style={{ marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <label className="payroll-form-label">Employee Filter</label>
          <input
            ref={searchRef}
            className="payroll-input"
            style={{ width: '100%' }}
            placeholder="Search ID or Name"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <EmployeeSuggestion
            suggestions={employeeSuggestions}
            showSuggestions={showEmployeeSuggestions}
            suggestionsLoading={suggestionsLoading}
            onSelect={handleSuggestionClick}
            suggestionsRef={suggestionsRef}
            selectedSuggestionIndex={selectedSuggestionIndex}
            setSelectedSuggestionIndex={setSelectedSuggestionIndex}
          />
        </div>
        <div>
          <label className="payroll-form-label">Month</label>
          <select className="payroll-input" style={{ width: '100%' }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="">All Months</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="payroll-form-label">Year</label>
          <select className="payroll-input" style={{ width: '100%' }} value={selectedYear} onChange={e => setSelectedYear(e.target.value === '' ? '' : parseInt(e.target.value))}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button className="payroll-btn payroll-btn-primary" onClick={fetchPayslips} style={{ marginBottom: '1.5rem', width: 'fit-content' }}>
          <FiSearch /> Execute Search
        </button>
      </div>

      {error && (
        <div className="message-banner" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', marginBottom: '2.5rem' }}>
          <FiAlertTriangle /> {error}
        </div>
      )}

      <div className="payslip-table-wrapper">
        <h4 style={{ padding: '0.75rem 1rem', margin: 0, background: '#f8fafc', borderBottom: '1px solid #f1f5f9', color: '#115e59', fontSize: '0.9rem' }}>
          Query Results ({payslips.length})
        </h4>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Processing...</div>
        ) : payslips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <FiFileText style={{ fontSize: '2.5rem', opacity: 0.1, marginBottom: '1rem' }} />
            <p>No matching payroll records found.</p>
          </div>
        ) : (
          <table className="payslip-main-table">
            <thead>
              <tr>
                <th><FiUser style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Employee</th>
                <th> Period</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((p, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: '700', color: '#334155' }}>{p.employeeName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.employeeId}</div>
                  </td>
                  <td>{p.salaryMonth} {p.salaryYear}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="payroll-btn" style={{ padding: '0.5rem', background: '#f0fdfa', color: '#0d9488' }} onClick={() => handlePreview(p)} title="Preview PDF">
                        <FiEye />
                      </button>
                      <button className="payroll-btn" style={{ padding: '0.5rem', background: '#f0fdfa', color: '#0d9488' }} onClick={() => downloadPdf(p)} title="Download PDF">
                        <FiDownload />
                      </button>
                      <button className="payroll-btn" style={{ padding: '0.5rem', background: '#fef2f2', color: '#dc2626' }} onClick={() => handleDeletePayslip(p)} title="Delete Record">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPreview && createPortal(
        <div className="preview-modal-overlay" onClick={closePreview} style={{
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
                onClick={closePreview}
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
              <iframe
                src={previewUrl}
                title="Payslip Preview"
                width="100%"
                height="100%"
                style={{ border: 'none', backgroundColor: 'white' }}
              />
            </div>

            <div className="preview-modal-footer" style={{
              padding: '12px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: 'white'
            }}>
              <button
                onClick={closePreview}
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
};

export default EmployeeDetailsTab;