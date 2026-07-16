import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from "../api";
import { FiPlus, FiUser, FiX, FiCalendar, FiFileText, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import './ApprovalRequests.css';

// Debounce function
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SmartDatePicker = ({ value, onChange, placeholder, required, maxDate, minDate, inputStyle }) => {
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={onChange}
            dateFormat="dd-MM-yyyy"
            placeholderText={placeholder}
            className="date-picker-input"
            wrapperClassName="date-picker-wrapper"
            customInput={<input style={inputStyle} required={required} />}
            maxDate={maxDate}
            minDate={minDate}
            portalId="root-portal"

            renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
            }) => {
                const months = [
                    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
                ];

                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 120 }, (_, i) => currentYear + 10 - i);

                return (
                    <div className="custom-calendar-header">
                        <div className="calendar-header-banner">
                            <button
                                type="button"
                                className="header-nav-btn prev"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    decreaseMonth();
                                }}
                            >
                                ‹
                            </button>

                            <div className="header-main-content">
                                <div className="header-text-group">
                                    <div style={{ position: 'relative' }}>
                                        <span
                                            className="clickable-header-text"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMonthOpen(!monthOpen);
                                                setYearOpen(false);
                                            }}
                                        >
                                            {months[date.getMonth()]}
                                        </span>
                                        {monthOpen && (
                                            <div className="header-dropdown month-dropdown">
                                                <div className="dropdown-scroll-pane">
                                                    {months.map((m, idx) => (
                                                        <div
                                                            key={m}
                                                            className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                                                            onClick={() => {
                                                                changeMonth(idx);
                                                                setMonthOpen(false);
                                                            }}
                                                        >
                                                            {m}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <span
                                            className="clickable-header-text"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setYearOpen(!yearOpen);
                                                setMonthOpen(false);
                                            }}
                                        >
                                            {date.getFullYear()}
                                        </span>
                                        {yearOpen && (
                                            <div className="header-dropdown year-dropdown">
                                                <div className="dropdown-scroll-pane">
                                                    {years.map((y) => (
                                                        <div
                                                            key={y}
                                                            className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                                                            onClick={() => {
                                                                changeYear(y);
                                                                setYearOpen(false);
                                                            }}
                                                        >
                                                            {y}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="header-nav-btn next"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    increaseMonth();
                                }}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                );
            }}
        />
    );
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

const formatDateForBackend = (date) => {
    if (!date) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

const getTenantPrefix = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.substring(0, id.lastIndexOf('_'));
    if (id.includes('-')) return id.substring(0, id.lastIndexOf('-'));
    return "";
};

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
            className="employee-suggestions-list"
            style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                maxHeight: '240px',
                overflowY: 'auto',
                zIndex: 9999,
            }}
        >
            {suggestionsLoading ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    Loading...
                </div>
            ) : suggestions.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    No suggestions found
                </div>
            ) : (
                suggestions.map((employee, index) => (
                    <div
                        key={employee.employeeId}
                        style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '0.9rem',
                            backgroundColor: index === selectedSuggestionIndex ? '#f0fdfa' : 'transparent',
                            color: index === selectedSuggestionIndex ? '#0d9488' : '#334155',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => onSelect(employee)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                        <span style={{ fontWeight: '600' }}>{employee.firstName} {employee.lastName}</span>
                        <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '0.8rem' }}>({getDisplayEmployeeId(employee.employeeId)})</span>
                    </div>
                ))
            )}
        </div>
    );
};

const ManageDelegates = ({ showAddModal, setShowAddModal, onAction }) => {
    const [formData, setFormData] = useState({
        delegateTo: '',
        delegateId: '',
        delegateName: '',
        requestType: '',
        beginDate: '',
        endDate: '',
        reason: '',
        reassignExisting: false
    });

    // Suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const suggestionsRef = useRef(null);

    // Custom dropdown states
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const [delegations, setDelegations] = useState([]);
    const [receivedDelegations, setReceivedDelegations] = useState([]);
    const [viewTab, setViewTab] = useState('sent'); // 'sent' or 'received'
    const [loading, setLoading] = useState(false);

    // Modules structured by categories (Matching Admin => Delegations)
    const moduleCategories = [
        "Reimbursements",
        "Helpdesk",
        "Travel",
        "Exit Management",
        "Leaves"
    ];

    const fetchEmployeeSuggestions = async (query) => {
        if (!query || query.trim().length < 1) {
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
            return;
        }

        setSuggestionsLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const response = await api.get(`/employeesdetails/approver-suggestions?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let fetchedSuggestions = response.data || [];
            
            // Filter by tenant prefix
            const currentEmpId = sessionStorage.getItem("employeeId");
            const tenantPrefix = getTenantPrefix(currentEmpId);
            if (tenantPrefix) {
                fetchedSuggestions = fetchedSuggestions.filter(emp => emp.employeeId.startsWith(tenantPrefix));
            }

            setEmployeeSuggestions(fetchedSuggestions);
            setShowEmployeeSuggestions(fetchedSuggestions.length > 0);
        } catch (err) {
            console.error('Error fetching employee suggestions:', err);
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    // Memoize the debounced function
    const debouncedFetch = useCallback(debounce(fetchEmployeeSuggestions, 300), []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'delegateTo' && type !== 'checkbox') {
            debouncedFetch(value);
        }
    };

    const handleSuggestionSelect = (employee) => {
        const fullName = `${employee.firstName} ${employee.lastName}`;
        setFormData(prev => ({
            ...prev,
            delegateTo: `${fullName} (${getDisplayEmployeeId(employee.employeeId)})`,
            delegateId: employee.employeeId,
            delegateName: fullName
        }));
        setShowEmployeeSuggestions(false);
        setEmployeeSuggestions([]);
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowEmployeeSuggestions(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchDelegations = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const employeeId = sessionStorage.getItem("employeeId");

            // Fetch Sent Delegations
            const sentRes = await api.get(`/delegations/delegator/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDelegations(sentRes.data);

            // Fetch Received Delegations
            const receivedRes = await api.get(`/delegations/delegate/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReceivedDelegations(receivedRes.data);
        } catch (err) {
            console.error('Error fetching delegations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDelegations();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.requestType) {
            alert("Please select the request module.");
            return;
        }

        if (!formData.delegateId) {
            alert("Please select a valid delegate from the employee suggestions list.");
            return;
        }

        if (!formData.beginDate) {
            alert("Please select a Begin Date.");
            return;
        }

        if (!formData.endDate) {
            alert("Please select an End Date.");
            return;
        }

        const payload = {
            delegatorId: sessionStorage.getItem("employeeId"),
            delegateId: formData.delegateId,
            delegateName: formData.delegateName,
            requestType: formData.requestType === 'Reimbursements' ? 'Claims' : formData.requestType,
            beginDate: formatDateForBackend(formData.beginDate),
            endDate: formatDateForBackend(formData.endDate),
            reason: formData.reason,
            reassignExisting: formData.reassignExisting,
            status: 'Active'
        };

        try {
            const token = sessionStorage.getItem("token");
            await api.post('/delegations/save', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Delegation request submitted successfully!");
            setShowAddModal(false);
            fetchDelegations(); // Refresh list
            // Reset form
            setFormData({
                delegateTo: '',
                delegateId: '',
                delegateName: '',
                requestType: '',
                beginDate: '',
                endDate: '',
                reason: '',
                reassignExisting: false
            });
        } catch (err) {
            console.error('Error saving delegation:', err);
            alert("Failed to save delegation. Please try again.");
        }
    };

    return (
        <div className="manage-delegates-container">
            {/* Modal Overlay */}
            {showAddModal && (
                <div className="delegates-modal-overlay">
                    <div className="delegates-modal-content" style={{
                        background: 'white',
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative',
                        animation: 'modalFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        textAlign: 'left'
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '22px', color: '#1F2937', fontWeight: '500', fontFamily: 'inherit', textAlign: 'left' }}>Add Delegation</h2>
                                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#00b3a4', fontFamily: 'inherit', textAlign: 'left' }}>Assign your tasks to another team member</p>
                            </div>
                            <div
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                <FiX size={18} color="#64748b" />
                            </div>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Delegate To with Auto-Suggestion */}
                            <div className="delegates-form-group" style={{ position: 'relative', zIndex: 100 }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'none' }}>Delegate to</label>
                                <div style={{ position: 'relative', zIndex: 10 }}>
                                    <input
                                        type="text"
                                        name="delegateTo"
                                        value={formData.delegateTo}
                                        onChange={handleInputChange}
                                        autoComplete="off"
                                        placeholder="Search employee by name or ID..."
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 38px',
                                            borderRadius: '8px',
                                            border: '1.5px solid #e2e8f0',
                                            outline: 'none',
                                            fontSize: '0.92rem',
                                            transition: 'border-color 0.2s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#2dd4bf'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                    <EmployeeSuggestion
                                        suggestions={employeeSuggestions}
                                        showSuggestions={showEmployeeSuggestions}
                                        suggestionsLoading={suggestionsLoading}
                                        onSelect={handleSuggestionSelect}
                                        suggestionsRef={suggestionsRef}
                                        selectedSuggestionIndex={selectedSuggestionIndex}
                                        setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                                    />
                                </div>
                            </div>

                            {/* Select Request */}
                            <div className="delegates-form-group" style={{ position: 'relative', zIndex: 50 }} ref={dropdownRef}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'none' }}>Select the request</label>
                                <div style={{ position: 'relative', marginTop: '0px' }}>
                                    <div
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: '1.5px solid #e2e8f0',
                                            outline: 'none',
                                            fontSize: '0.92rem',
                                            background: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                            borderColor: showDropdown ? '#2dd4bf' : '#e2e8f0',
                                            userSelect: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <span style={{ color: formData.requestType ? '#1e293b' : '#94a3b8' }}>
                                            {formData.requestType || '-- Choose Module --'}
                                        </span>
                                        <div style={{ pointerEvents: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                                            <i className={`bi bi-chevron-${showDropdown ? 'up' : 'down'}`} style={{ fontSize: '0.85rem' }}></i>
                                        </div>
                                    </div>

                                    {showDropdown && (
                                        <div
                                            className="custom-dropdown-list"
                                            style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 6px)',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                                maxHeight: '240px',
                                                overflowY: 'auto',
                                                zIndex: 9999,
                                                boxSizing: 'border-box',
                                                padding: '4px'
                                            }}
                                        >
                                            <div
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, requestType: '' }));
                                                    setShowDropdown(false);
                                                }}
                                                style={{
                                                    padding: '10px 14px',
                                                    cursor: 'pointer',
                                                    borderRadius: '6px',
                                                    fontSize: '0.95rem',
                                                    color: '#94a3b8',
                                                    backgroundColor: formData.requestType === '' ? '#f1f5f9' : 'transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                                    e.currentTarget.style.color = '#475569';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = formData.requestType === '' ? '#f1f5f9' : 'transparent';
                                                    e.currentTarget.style.color = '#94a3b8';
                                                }}
                                            >
                                                -- Choose Module --
                                            </div>
                                            {moduleCategories.map(module => (
                                                <div
                                                    key={module}
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, requestType: module }));
                                                        setShowDropdown(false);
                                                    }}
                                                    style={{
                                                        padding: '10px 14px',
                                                        cursor: 'pointer',
                                                        borderRadius: '6px',
                                                        fontSize: '0.95rem',
                                                        backgroundColor: formData.requestType === module ? '#00b3a4' : 'transparent',
                                                        color: formData.requestType === module ? 'white' : '#334155',
                                                        transition: 'all 0.2s',
                                                        marginTop: '2px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (formData.requestType !== module) {
                                                            e.currentTarget.style.backgroundColor = '#00b3a4';
                                                            e.currentTarget.style.color = 'white';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (formData.requestType !== module) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = '#334155';
                                                        }
                                                    }}
                                                >
                                                    {module}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dates Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="delegates-form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '6px', zIndex: 1, position: 'relative', textTransform: 'none' }}>Begin Date <span style={{ color: '#ef4444' }}>*</span></label>
                                    <SmartDatePicker
                                        value={formData.beginDate}
                                        onChange={(date) => setFormData(prev => ({ ...prev, beginDate: date }))}
                                        placeholder="Select begin date"
                                        required={true}
                                        inputStyle={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: '1.5px solid #e2e8f0',
                                            outline: 'none',
                                            fontSize: '0.92rem',
                                            transition: 'border-color 0.2s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        minDate={new Date()}
                                    />
                                </div>
                                <div className="delegates-form-group" style={{ position: 'relative', zIndex: 40 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '6px', zIndex: 1, position: 'relative', textTransform: 'none' }}>End Date <span style={{ color: '#ef4444' }}>*</span></label>
                                    <SmartDatePicker
                                        value={formData.endDate}
                                        onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                                        placeholder="Select end date"
                                        required={true}
                                        inputStyle={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: '1.5px solid #e2e8f0',
                                            outline: 'none',
                                            fontSize: '0.92rem',
                                            transition: 'border-color 0.2s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        minDate={formData.beginDate ? new Date(formData.beginDate) : new Date()}
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="delegates-form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'none' }}>Reason</label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    placeholder="Briefly explain why you're delegating these tasks..."
                                    rows="2"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1.5px solid #e2e8f0',
                                        outline: 'none',
                                        fontSize: '0.92rem',
                                        resize: 'none',
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#2dd4bf'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                ></textarea>
                            </div>

                            {/* Reassign Flag */}
                            <div
                                className="delegates-form-group"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    padding: '4px 0'
                                }}
                            >
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: '#475569',
                                        fontWeight: '500',
                                        textTransform: 'none'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        name="reassignExisting"
                                        checked={formData.reassignExisting}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                reassignExisting: e.target.checked
                                            }))
                                        }
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                            accentColor: '#2dd4bf'
                                        }}
                                    />
                                    Reassign all existing open requests to this delegate
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: '#00B3A4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 15px -3px rgba(0, 179, 164, 0.3)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Confirm Delegation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tabs for Sent/Received */}
            <div style={{ display: 'flex', gap: '0', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px', background: 'transparent' }}>
                <button
                    onClick={() => setViewTab('sent')}
                    style={{
                        flex: 1,
                        padding: '12px 24px',
                        border: 'none',
                        background: viewTab === 'sent' ? '#1F6FEB' : '#0B3D91',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderRadius: '0'
                    }}
                >
                    My Delegations ({delegations.length})
                </button>
                <button
                    onClick={() => setViewTab('received')}
                    style={{
                        flex: 1,
                        padding: '12px 24px',
                        border: 'none',
                        background: viewTab === 'received' ? '#1F6FEB' : '#0B3D91',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderRadius: '0'
                    }}
                >
                    Delegated to Me ({receivedDelegations.length})
                </button>
            </div>

            {/* Base Content */}
            <div className="delegates-content">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
                ) : (
                    <>
                        {viewTab === 'sent' ? (
                            delegations.length > 0 ? (
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {delegations.map(del => (
                                        <div key={del.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6' }}>
                                                    <FiUser size={24} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#1f2937' }}>
                                                            {del.delegateName || 'Assigned Delegate'}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '15px', color: '#475569', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div>
                                                            <strong style={{ color: '#1f2937' }}>Module: </strong>
                                                            <span style={{ fontWeight: '600', color: '#00b3a4' }}>
                                                                {del.requestType === 'Claims' ? 'Reimbursements' : del.requestType}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <strong style={{ color: '#1f2937' }}>Duration: </strong>
                                                            <span>{new Date(del.beginDate).toLocaleDateString()} to {new Date(del.endDate).toLocaleDateString()}</span>
                                                        </div>
                                                        {del.reason && (
                                                            <div style={{ marginTop: '2px', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                                                                <strong style={{ color: '#1f2937', fontStyle: 'normal' }}>Reason: </strong>
                                                                "{del.reason}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Delete this delegation?')) {
                                                            await api.delete(`/delegations/delete/${del.id}`);
                                                            fetchDelegations();
                                                        }
                                                    }}
                                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #e2e8f0' }}>
                                    <div style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.15rem', fontWeight: 'normal' }}>No active delegations</div>
                                </div>
                            )
                        ) : (
                            receivedDelegations.length > 0 ? (
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {receivedDelegations.map(del => (
                                        <div key={del.id} style={{ background: '#f0fdfa', padding: '20px', borderRadius: '8px', border: '1px solid #ccfbf1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6', border: '1px solid #ccfbf1' }}>
                                                    <FiCheckCircle size={24} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                                                            Tasks from {getDisplayEmployeeId(del.delegatorId)}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '15px', color: '#475569', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div>
                                                            <strong style={{ color: '#0f172a' }}>Module: </strong>
                                                            <span style={{ fontWeight: '600', color: '#0d9488' }}>
                                                                {del.requestType === 'Claims' ? 'Reimbursements' : del.requestType}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <strong style={{ color: '#0f172a' }}>Duration: </strong>
                                                            <span>Until {new Date(del.endDate).toLocaleDateString()}</span>
                                                        </div>
                                                        {del.reason && (
                                                            <div style={{ marginTop: '2px', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                                                                <strong style={{ color: '#0f172a', fontStyle: 'normal' }}>Reason: </strong>
                                                                "{del.reason}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                style={{ padding: '8px 16px', background: '#00B3A4', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                                                onClick={() => onAction && onAction(del.requestType)}
                                            >
                                                Take Action
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #e2e8f0' }}>
                                    <div style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.15rem', fontWeight: 'normal' }}>No delegated tasks</div>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Injected CSS for Animations and Fixes */}
            <style>
                {`
                @keyframes modalFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .employee-suggestions-list {
                    background-color: #ffffff !important;
                    opacity: 1 !important;
                    display: block !important;
                    visibility: visible !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
                }
                .form-group {
                    overflow: visible !important;
                }
                `}
            </style>
        </div>
    );
};

export default ManageDelegates;
