import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import './GeneratePayslipsTab.css';
import { FiFileText, FiChevronRight, FiDownload, FiSend, FiPlusCircle, FiCheckCircle, FiAlertCircle, FiEye } from 'react-icons/fi';

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

const GeneratePayslipsTab = ({ employees, onRefresh }) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [generatedPayslips, setGeneratedPayslips] = useState([]);
    const [releasing, setReleasing] = useState(false);
    const [search, setSearch] = useState("");
    const [payslipsExist, setPayslipsExist] = useState(false);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    // Refs for dropdown management
    const searchRef = useRef(null);
    const suggestionsRef = useRef(null);

    const currentYear = new Date().getFullYear();
    // Generate years: 3 years in the past, current year, and 2 years in the future
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

    const fetchExistingPayslips = async (month, year) => {
        if (!month || !year) {
            setGeneratedPayslips([]);
            return;
        }

        try {
            const res = await api.get(`/payroll/payslips/month/${month}/year/${year}`);
            setGeneratedPayslips(res.data || []);

            if (res.data && res.data.length > 0) {
                alert(`${res.data.length} records for ${month} ${year} already exist.`);
            } else {
                            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchExistingPayslips(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear]);

    const handleReleasePayslips = async (payslipIds = generatedPayslips.map(p => p.payslipId || p.id).filter(id => id)) => {
        if (payslipIds.length === 0) {
            alert('No payslips available to release.');
            return;
        }

        const isBulk = payslipIds.length === generatedPayslips.length;
        if (isBulk) setReleasing(true);

        try {
            const response = await api.post('/payroll/release-payslips', { payslipIds: payslipIds.filter(id => id) });
            alert(`✅ ${payslipIds.length === 1 ? 'Payslip released' : 'Successfully released ' + response.data.count + ' payslips'} and notified employees.`);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to release payslips.');
        } finally {
            if (isBulk) setReleasing(false);
        }
    };

    const isFutureOrCurrentMonth = (month, year) => {
        const selectedDate = new Date(`${month} 1, ${year}`);
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return selectedDate >= currentMonthStart;
    };

    const handleGeneratePayslips = async () => {
        if (generating) return; // Guard against multiple clicks

        if (!selectedMonth || isFutureOrCurrentMonth(selectedMonth, selectedYear)) {
            alert('Please select a valid past month.');
            return;
        }

        setGenerating(true);
                // No longer resetting generatedPayslips to empty here to allow updates
        // but it's safe to keep it if we want a fresh start for batch

        try {
            const response = await api.post('/payroll/generate-payslips', { month: selectedMonth, year: selectedYear });
            let payslipArray = response.data?.payslips || [];
            const validPayslips = payslipArray.filter(p => p.id || p.payslipId);

            if (validPayslips.length > 0) {
                setGeneratedPayslips(validPayslips);
                alert(`✅ Successfully generated ${validPayslips.length} new payslips!`);
            } else {
                alert("No new payslips generated. All employees for this period already have records.");
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to generate payslips.');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateForEmployee = async (employeeId) => {
        if (generating) return; // Guard against multiple clicks

        if (!selectedMonth || isFutureOrCurrentMonth(selectedMonth, selectedYear)) {
            alert('Please select a valid month.');
            return;
        }

        setGenerating(true);
        try {
            const generateResponse = await api.post(`/payroll/generate-payslip/${employeeId}`, { month: selectedMonth, year: selectedYear });
            const newPayslip = generateResponse.data;

            setGeneratedPayslips(prev => {
                // If this employee already exists in the recent list, replace it
                const exists = prev.some(p => p.employeeId === employeeId);
                if (exists) {
                    return prev.map(p => p.employeeId === employeeId ? newPayslip : p);
                }
                // Otherwise append
                return [...prev, newPayslip];
            });

            alert(`Generated for ${employeeId}.`);
        } catch (error) {
            alert(error.response?.data?.error || `Failed for ${employeeId}.`);
        } finally {
            setGenerating(false);
        }
    };

    const downloadPayslip = async (p) => {
        try {
            const id = p.payslipId || p.id;
            const response = await api.get(`/payroll/payslip/${id}/pdf`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `Payslip_${p.employeeId}.pdf`;
            a.click();
        } catch (err) {
            console.error(err);
        }
    };

    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewFileName, setPreviewFileName] = useState("");

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
            alert('Failed to preview payslip.');
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
        setSearch(value);
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
        setSearch(searchValue);
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
        <div className="generate-payslips-container">
            <div className="gen-filter-row">
                <div style={{ flex: 1 }}>
                    <label className="payroll-form-label" style={{ fontWeight: '700', color: '#0d9488', fontSize: '0.875rem' }}>Accounting Month</label>
                    <select
                        className="payroll-input"
                        style={{ width: '100%' }}
                        value={selectedMonth}
                        onChange={(e) => { setSelectedMonth(e.target.value); }}
                    >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label className="payroll-form-label" style={{ fontWeight: '700', color: '#0d9488', fontSize: '0.875rem' }}>Fiscal Year</label>
                    <select
                        className="payroll-input"
                        style={{ width: '100%' }}
                        value={selectedYear}
                        onChange={(e) => { setSelectedYear(parseInt(e.target.value)); }}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {isFutureOrCurrentMonth(selectedMonth, selectedYear) && (
                <div className="message-banner" style={{
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                    border: '1px solid #fbbf24',
                    opacity: 0.9,
                    marginBottom: '2.5rem'
                }}>
                    <FiAlertCircle /> ⚠️ Payslips can only be generated for past months. Please select a month before {months[new Date().getMonth()]} {new Date().getFullYear()}.
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                <button
                    className="payroll-btn payroll-btn-primary"
                    onClick={handleGeneratePayslips}
                    disabled={generating || isFutureOrCurrentMonth(selectedMonth, selectedYear)}
                    style={{ flex: 1, height: '3rem' }}
                >
                    {generating ? 'Processing...' : <><FiPlusCircle /> Generate Batch</>}
                </button>
                <button
                    className="payroll-btn"
                    onClick={() => handleReleasePayslips()}
                    disabled={releasing || generatedPayslips.length === 0}
                    style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', height: '3rem' }}
                >
                    {releasing ? 'Releasing...' : <><FiSend /> Release to Employees</>}
                </button>
            </div>

            {message && (
                <div className="message-banner" style={{
                    backgroundColor: messageType === 'success' ? '#f0fdf4' : messageType === 'warning' ? '#fffbeb' : '#fef2f2',
                    color: messageType === 'success' ? '#16a34a' : messageType === 'warning' ? '#d97706' : '#dc2626',
                    border: '1px solid currentColor', opacity: 0.9, marginBottom: '2.5rem'
                }}>
                    {messageType === 'success' ? <FiCheckCircle /> : <FiAlertCircle />} {message}
                </div>
            )}

            {generatedPayslips.length > 0 && (
                <div className="payslip-table-wrapper" style={{ marginBottom: '3rem' }}>
                    <h4 style={{ padding: '1.5rem', margin: 0, background: '#f8fafc', borderBottom: '1px solid #f1f5f9', color: '#115e59' }}>
                        Recently Generated ({generatedPayslips.length})
                    </h4>
                    <table className="payslip-main-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Period</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {generatedPayslips.map((p, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: '600' }}>{p.employeeId}</td>
                                    <td>{p.salaryMonth} {p.salaryYear}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="payroll-btn" style={{ padding: '0.5rem', background: '#f8fafc' }} onClick={() => handlePreview(p)} title="Preview PDF">
                                                <FiEye />
                                            </button>
                                            <button className="payroll-btn" style={{ padding: '0.5rem', background: '#f8fafc' }} onClick={() => downloadPayslip(p)} title="Download PDF">
                                                <FiDownload />
                                            </button>
                                            <button className="payroll-btn" style={{ padding: '0.5rem', background: '#f0fdfa', color: '#0d9488' }} onClick={() => handleReleasePayslips([p.payslipId || p.id])} title="Release Individually">
                                                <FiSend />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="individual-section">
                <h4 style={{ color: '#115e59', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiChevronRight /> Individual Generation
                </h4>
                <div className="payslip-form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                    <input
                        ref={searchRef}
                        className="payroll-input"
                        style={{ width: '100%' }}
                        placeholder="Search employee by ID or name..."
                        value={search}
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
                <div className="scrollbar-hidden" style={{ maxHeight: '400px', border: '1px solid #f1f5f9', borderRadius: '14px' }}>
                    {employees.filter(e => {
                        const fullName = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
                        const searchLower = search.toLowerCase();
                        return fullName.includes(searchLower) || e.employeeId?.toLowerCase().includes(searchLower);
                    }).map(emp => (
                        <div key={emp.employeeId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontWeight: '700', color: '#334155' }}>{emp.firstName} {emp.lastName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.employeeId}</div>
                            </div>
                            <button
                                className="payroll-btn payroll-btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                                onClick={() => handleGenerateForEmployee(emp.employeeId)}
                                disabled={generating || isFutureOrCurrentMonth(selectedMonth, selectedYear) || generatedPayslips.some(p => p.employeeId === emp.employeeId)}
                            >
                                {generatedPayslips.some(p => p.employeeId === emp.employeeId) ? "Generated" : "Generate"}
                            </button>
                        </div>
                    ))}
                </div>
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

export default GeneratePayslipsTab;
