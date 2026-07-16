import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import Sidebar from './Sidebar.js';
import { FiTrendingUp, FiSettings, FiUser, FiBarChart2, FiArrowLeft, FiCalendar, FiPercent, FiCheckSquare, FiUsers, FiSend, FiFilter, FiHash, FiList, FiChevronDown, FiSearch } from 'react-icons/fi';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SmartDatePicker = ({ value, onChange, placeholder, required, maxDate, minDate, inputStyle }) => {
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={(date) => {
                if (!date) {
                    onChange("");
                } else {
                    const d = new Date(date);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    onChange(`${year}-${month}-${day}`);
                }
                setMonthOpen(false);
                setYearOpen(false);
            }}
            onSelect={() => {
                setMonthOpen(false);
                setYearOpen(false);
            }}
            dateFormat="dd-MM-yyyy"
            placeholderText={placeholder}
            className="date-picker-input"
            wrapperClassName="date-picker-wrapper"
            customInput={<input style={inputStyle} required={required} />}
            maxDate={maxDate}
            minDate={minDate}

            renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
            }) => {
                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 121 }, (_, i) => currentYear + 10 - i);

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
                );
            }}
        />
    );
};

// Helper function to extract the real employee ID
const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

// Employee Suggestion Component
const EmployeeSuggestion = ({
    suggestions,
    showSuggestions,
    suggestionsLoading,
    onSelect,
    activeField,
    inputRef,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex
}) => {
    if (!showSuggestions) return null;

    return (
        <div
            ref={inputRef}
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '8px',
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
                            borderBottom: '1px solid #f3f4f6',
                            fontSize: '15px',
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
                        onClick={() => onSelect(employee, activeField)}
                    >
                        {employee.firstName} {employee.lastName} ({getDisplayEmployeeId(employee.employeeId)})
                    </div>
                ))
            )}
        </div>
    );
};

const CompensationManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('salaryRevision');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [approverComments, setApproverComments] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;
    const [revisionData, setRevisionData] = useState({
        currentFixed: '',
        currentVariable: '',
        effectiveDate: '',
        proposedFixed: '',
        proposedVariable: '',
        hikePercentage: 0,
        fixedHikePercentage: 0,
        variableHikePercentage: 0,
        revisionType: '',
        proposedDesignation: ''
    });
    const [selectedBulkEmployees, setSelectedBulkEmployees] = useState([]);
    const initialBulkRevisionData = {
        fixedHike: 0,
        variableHike: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        categoryType: '',
        categoryValue: '',
        salaryOperator: '',
        salaryThreshold: '',
        customField: '',
        customValue: ''
    };

    const [bulkRevisionData, setBulkRevisionData] = useState(initialBulkRevisionData);

    const resetBulkFilters = () => {
        setBulkRevisionData(initialBulkRevisionData);
        setSelectedBulkEmployees([]);
        setManualIdsStr("");
        setSearchTerm("");
    };
    const [historyRecords, setHistoryRecords] = useState([]);
    const [employeeHistory, setEmployeeHistory] = useState([]);
    const [selectedApprovalRecords, setSelectedApprovalRecords] = useState([]);
    const [approvalSearchTerm, setApprovalSearchTerm] = useState("");
    const [approvalRevisionTypeFilter, setApprovalRevisionTypeFilter] = useState("");

    // Employee suggestion states for different search areas
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [activeSearchField, setActiveSearchField] = useState(''); // Track which search field is active
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    // Refs for dropdown management
    const searchRefs = {
        salaryRevision: useRef(null),
        bulkHike: useRef(null),
        approvals: useRef(null),
        quickSelectIds: useRef(null)
    };
    const suggestionsRef = useRef(null);

    // Finalize Modal States
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [finalizeRecord, setFinalizeRecord] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [revisionType, setRevisionType] = useState('');
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [calcTemplates, setCalcTemplates] = useState([]);
    const [selectedCalcTemplateId, setSelectedCalcTemplateId] = useState('');
    const [employeeActiveTab, setEmployeeActiveTab] = useState('revision');
    const [manualIdsStr, setManualIdsStr] = useState("");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Revision Types States
    const [revisionTypes, setRevisionTypes] = useState([]);
    const [newRevisionTypeName, setNewRevisionTypeName] = useState('');
    const [isSettingsLoading, setIsSettingsLoading] = useState(false);

    // Designation Categories States
    const [designationCategories, setDesignationCategories] = useState([]);

    // Template Management States
    const [newTemplateFile, setNewTemplateFile] = useState(null);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateCategory, setNewTemplateCategory] = useState('COMPENSATION');

    // Salary Component States
    const [salaryComponents, setSalaryComponents] = useState([]);
    const [newComponent, setNewComponent] = useState({
        name: '',
        placeholder: '',
        type: 'EARNING',
        calculationType: 'FORMULA',
        calculationValue: '',
        formula: '',
        sourceComponent: '',
        section: 'Monthly Components',
        sortOrder: 1,
        isActive: true,
        showAsApplicable: false
    });

    // Salary Breakup State
    const [salaryBreakup, setSalaryBreakup] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchPendingTasks();
        fetchTemplates();
        fetchCalcTemplates();
        fetchSalaryComponents();
        fetchDesignationCategories();
        fetchRevisionTypes();
    }, []);

    const fetchDesignationCategories = async () => {
        try {
            const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
            const resp = await api.get('/designation-categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDesignationCategories(resp.data);
        } catch (err) {
            console.log("API not available, using localStorage fallback for designations");
            const storedCategories = localStorage.getItem('designationCategories');
            if (storedCategories) {
                setDesignationCategories(JSON.parse(storedCategories));
            }
        }
    };

    const fetchSalaryComponents = async () => {
        try {
            const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
            const resp = await api.get('/salary-components', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSalaryComponents(resp.data);
            // Auto-increment sort order for new component
            if (resp.data.length > 0) {
                const maxOrder = Math.max(...resp.data.map(c => c.sortOrder));
                setNewComponent(prev => ({ ...prev, sortOrder: maxOrder + 1 }));
            }
        } catch (err) {
            console.error("Salary Components fetch error:", err);
        }
    };


    const fetchTemplates = async () => {
        try {
            const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
            const resp = await api.get('/compensation/templates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(resp.data);
        } catch (err) {
            console.error("Templates fetch error:", err);
        }
    };

    const fetchCalcTemplates = async () => {
        try {
            const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
            const resp = await api.get('/v1/calculations/structures', {
                params: { status: 'ACTIVE' },
                headers: { Authorization: `Bearer ${token}` }
            });
            setCalcTemplates(resp.data.content || []);
        } catch (err) {
            console.error("Calculation templates fetch error:", err);
        }
    };

    const fetchRevisionTypes = async () => {
        try {
            const token = sessionStorage.getItem('token')?.replace(/^"|"$/g, "");
            const resp = await api.get('/revision-types', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRevisionTypes(resp.data);
        } catch (err) {
            console.error("Fetch Revision Types error:", err);
        }
    };

    const fetchPendingTasks = async () => {
        const rawId = sessionStorage.getItem('employeeId');
        if (!rawId) return;
        const employeeId = rawId.replace(/^"|"$/g, "");
        const rawToken = sessionStorage.getItem('token');
        const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;
        try {
            const resp = await api.get(`/compensation/approver/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingTasks(resp.data);
        } catch (err) {
            console.error("Pending Tasks fetch error:", err);
        }
    };

    useEffect(() => {
        const results = employees.filter(emp => {
            if (!emp) return false;

            // 1. Search filter
            const searchLower = searchTerm.toLowerCase().trim();
            const fullName = (emp.employeeName || (emp.firstName + ' ' + emp.lastName) || '').toString().toLowerCase();
            const employeeId = emp.employeeId ? emp.employeeId.toString().toLowerCase() : '';
            const matchesSearch = !searchLower || (employeeId.includes(searchLower) || fullName.includes(searchLower));

            if (!matchesSearch) return false;

            // 2. Tab-specific category filters (Applied in Bulk Salary Hike tab)
            if (activeTab === 'bulkHike') {
                const { categoryType, categoryValue, salaryOperator, salaryThreshold, customField, customValue } = bulkRevisionData;

                // Category filters (Department, Designation, Location)
                if (categoryType && categoryValue && !['salary', 'custom'].includes(categoryType)) {
                    if (categoryType === 'department' && emp.department !== categoryValue) return false;
                    if (categoryType === 'designation' && emp.designation !== categoryValue) return false;
                    if (categoryType === 'location' && emp.workLocation !== categoryValue) return false;
                }

                // Salary Range filter
                if (categoryType === 'salary' && salaryOperator && salaryThreshold) {
                    const salary = parseFloat(emp.currentFixedCtc || 0);
                    const threshold = parseFloat(salaryThreshold);
                    if (salaryOperator === 'lt' && !(salary < threshold)) return false;
                    if (salaryOperator === 'lte' && !(salary <= threshold)) return false;
                    if (salaryOperator === 'gt' && !(salary >= threshold)) return false;
                }

                // Custom Field filter
                if (categoryType === 'custom' && customField && customValue) {
                    if (emp[customField] !== customValue) return false;
                }
            }

            return true;
        });
        setFilteredEmployees(results);
        setCurrentPage(1);
    }, [searchTerm, employees, activeTab,
        bulkRevisionData.categoryType, bulkRevisionData.categoryValue,
        bulkRevisionData.salaryOperator, bulkRevisionData.salaryThreshold,
        bulkRevisionData.customField, bulkRevisionData.customValue
    ]);

    const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
    const currentEmployees = filteredEmployees.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Approvals Pagination
    const filteredApprovals = historyRecords
        .filter(r => r.approvalStatus === 'PENDING_FINALIZATION' || r.approvalStatus === 'PENDING_MANAGER')
        .filter(r => {
            if (approvalRevisionTypeFilter && r.revisionType !== approvalRevisionTypeFilter) {
                return false;
            }
            if (!approvalSearchTerm) return true;
            const search = approvalSearchTerm.toLowerCase().trim();
            if (!search) return true;

            const formattedDate = r.effectiveDate ? new Date(r.effectiveDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '';

            return (
                (r.employeeId && r.employeeId.toLowerCase().includes(search)) ||
                (r.employeeName && r.employeeName.toLowerCase().includes(search)) ||
                (r.proposedDesignation && r.proposedDesignation.toLowerCase().includes(search)) ||
                (r.designation && r.designation.toLowerCase().includes(search)) ||
                (r.department && r.department.toLowerCase().includes(search)) ||
                (r.currentFixedCtc && String(r.currentFixedCtc).includes(search)) ||
                (r.proposedFixedCtc && String(r.proposedFixedCtc).includes(search)) ||
                (r.hikePercentage && String(r.hikePercentage).includes(search)) ||
                (r.revisionType && r.revisionType.toLowerCase().includes(search)) ||
                (formattedDate.includes(search))
            );
        })
        .sort((a, b) => {
            // Sort by effectiveDate descending (latest first)
            const dateA = new Date(a.effectiveDate || 0);
            const dateB = new Date(b.effectiveDate || 0);
            if (dateB - dateA !== 0) return dateB - dateA;
            // Fallback to ID descending if dates are equal
            return (b.id || 0) - (a.id || 0);
        });
    const totalPagesApprovals = Math.ceil(filteredApprovals.length / rowsPerPage);
    const currentApprovals = filteredApprovals.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const rawToken = sessionStorage.getItem('token');
            const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;
            if (!token) {
                setError('Authentication required. Please log in.');
                setLoading(false);
                return;
            }
            const response = await api.get('/compensation', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(response.data);
            setFilteredEmployees(response.data);

            const historyResp = await api.get('/compensation/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoryRecords(historyResp.data);
            setError('');
        } catch (err) {
            console.error("API Fetch Error:", err);
            setError('Failed to fetch compensation data');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeHistory = async (empId) => {
        try {
            const rawToken = sessionStorage.getItem('token');
            const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;
            const res = await api.get(`/compensation/history/${empId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployeeHistory(res.data);
        } catch (err) {
            console.error("Fetch history error:", err);
        }
    };

    useEffect(() => {
        if (employeeActiveTab === 'history' && selectedEmployee) {
            fetchEmployeeHistory(selectedEmployee.employeeId);
        }
    }, [employeeActiveTab, selectedEmployee]);

    const handleEmployeeClick = async (emp) => {
        setSelectedEmployee(emp);
        setEmployeeActiveTab('revision');
        setLoading(true);
        try {
            // Use the actual data from the synced compensation record
            setRevisionData({
                currentFixed: emp.currentFixedCtc?.toString() || '0',
                currentVariable: emp.currentVariablePay?.toString() || '0',
                effectiveDate: emp.effectiveDate || new Date().toISOString().split('T')[0],
                // Default proposed to current if not set or 0, preventing -100% hike display
                proposedFixed: (emp.proposedFixedCtc ? emp.proposedFixedCtc.toString() : emp.currentFixedCtc?.toString()) || '0',
                proposedVariable: (emp.proposedVariablePay ? emp.proposedVariablePay.toString() : emp.currentVariablePay?.toString()) || '0',
                hikePercentage: emp.hikePercentage || 0,
                fixedHikePercentage: emp.fixedHikePercentage || 0,
                variableHikePercentage: emp.variableHikePercentage || 0,
                revisionType: '',
                proposedDesignation: emp.proposedDesignation || emp.designation || ''
            });
        } catch (err) {
            console.error("Error setting revision data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRevision = async () => {
        // Validation based on revision type
        const revisionTypeLower = (revisionData.revisionType || "").toLowerCase();

        if (!revisionData.revisionType) {
            alert('Please select a salary revision type');
            return;
        }

        // For Hike type - require at least one of the hike fields to be filled
        if (revisionTypeLower.includes('hike')) {
            const hasFixedHike = parseFloat(revisionData.fixedHikePercentage || 0) > 0;
            const hasVariableHike = parseFloat(revisionData.variableHikePercentage || 0) > 0;
            const hasTotalHike = parseFloat(revisionData.hikePercentage || 0) > 0;

            if (!hasFixedHike && !hasVariableHike && !hasTotalHike) {
                alert('Please enter hike percentage to proceed with salary revision');
                return;
            }
        }

        // For Promotion type - require designation change
        if (revisionTypeLower.includes('promotion')) {
            if (!revisionData.proposedDesignation || revisionData.proposedDesignation === selectedEmployee.designation) {
                alert('Please change designation to proceed with promotion');
                return;
            }
        }

        // For any other revision type - require effective date
        if (!revisionData.effectiveDate) {
            alert('Please select effective date to proceed with salary revision');
            return;
        }

        setLoading(true);
        try {
            const initiatorId = sessionStorage.getItem('employeeId')?.replace(/^"|"$/g, "");

            const payload = {
                employeeId: selectedEmployee.employeeId,
                initiatorId: initiatorId,
                currentFixedCtc: parseFloat(revisionData.currentFixed || 0),
                currentVariablePay: parseFloat(revisionData.currentVariable || 0),
                proposedFixedCtc: parseFloat(revisionData.proposedFixed || 0),
                proposedVariablePay: parseFloat(revisionData.proposedVariable || 0),
                effectiveDate: revisionData.effectiveDate,
                hikePercentage: parseFloat(revisionData.hikePercentage || 0),
                fixedHikePercentage: parseFloat(revisionData.fixedHikePercentage || 0),
                variableHikePercentage: parseFloat(revisionData.variableHikePercentage || 0),
                totalProposedCtc: parseFloat(revisionData.proposedFixed || 0) + parseFloat(revisionData.proposedVariable || 0),
                revisionType: revisionData.revisionType,
                proposedDesignation: revisionData.proposedDesignation
            };

            const rawToken = sessionStorage.getItem('token');
            const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;
            await api.post('/compensation', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Salary revision submitted successfully!');
            fetchEmployees(); // Refresh list structure
            fetchPendingTasks();
            setSelectedEmployee(null);
        } catch (err) {
            console.error("Submit Error:", err);
            alert('Failed to submit salary revision');
        } finally {
            setLoading(false);
        }
    };

    const handleApprovalSearchChange = (val) => {
        setApprovalSearchTerm(val);
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
            const rawToken = sessionStorage.getItem('token');
            const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;

            if (!token) {
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

    // Handle search input change for different fields
    const handleSearchChangeWithSuggestions = (value, field) => {
        setActiveSearchField(field);
        setSelectedSuggestionIndex(-1); // Reset selection when typing

        // Update the appropriate search term
        if (field === 'salaryRevision' || field === 'bulkHike') {
            setSearchTerm(value);
        } else if (field === 'approvals') {
            setApprovalSearchTerm(value);
        } else if (field === 'quickSelectIds') {
            // For Quick Select IDs, we need to get the last typed ID
            const ids = value.split(/[,\s\n]+/).map(id => id.trim()).filter(id => id !== "");
            const lastId = ids[ids.length - 1] || "";

            if (lastId.length >= 1) {
                debouncedFetchSuggestions(lastId);
            } else {
                setEmployeeSuggestions([]);
                setShowEmployeeSuggestions(false);
            }
            return; // Don't proceed with general logic for this field
        }

        if (value.trim().length >= 1) {
            debouncedFetchSuggestions(value);
        } else {
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
        }
    };

    // Handle Quick Select IDs change with auto-suggestions
    const handleQuickSelectIdsChange = (e) => {
        const value = e.target.value;
        setManualIdsStr(value);
        handleSearchChangeWithSuggestions(value, 'quickSelectIds');

        // Automatically update the selected bulk employees based on valid IDs typed so far
        const ids = value.split(/[,\s\n]+/).map(id => id.trim()).filter(id => id !== "");
        const validIds = employees
            .filter(emp => ids.includes(emp.employeeId) || ids.includes(getDisplayEmployeeId(emp.employeeId)))
            .map(emp => emp.employeeId);
        setSelectedBulkEmployees(validIds);
    };

    // Handle suggestion click for Quick Select IDs
    const handleQuickSelectSuggestionClick = (employee) => {
        // Get all currently typed tokens
        const ids = manualIdsStr.split(/[,\s\n]+/).map(id => id.trim()).filter(id => id !== "");

        // Remove the last token (the one being typed) and replace it with the full employee ID
        const shortId = getDisplayEmployeeId(employee.employeeId);
        if (ids.length > 0) {
            ids[ids.length - 1] = shortId;
        } else {
            ids.push(shortId);
        }

        // Deduplicate and rebuild the comma-separated string
        const uniqueIds = [...new Set(ids)];
        const newIdsStr = uniqueIds.join(', ') + (uniqueIds.length > 0 ? ', ' : '');

        setManualIdsStr(newIdsStr);

        // Update selected bulk employees
        const validIds = employees
            .filter(emp => uniqueIds.includes(emp.employeeId) || uniqueIds.includes(getDisplayEmployeeId(emp.employeeId)))
            .map(emp => emp.employeeId);
        setSelectedBulkEmployees(validIds);

        setShowEmployeeSuggestions(false);
        setEmployeeSuggestions([]);
        setSelectedSuggestionIndex(-1);
    };

    // Handle suggestion click
    const handleSuggestionClick = (employee, field) => {
        if (field === 'quickSelectIds') {
            handleQuickSelectSuggestionClick(employee);
            return;
        }

        const searchValue = getDisplayEmployeeId(employee.employeeId);

        if (field === 'salaryRevision' || field === 'bulkHike') {
            setSearchTerm(searchValue);
        } else if (field === 'approvals') {
            setApprovalSearchTerm(searchValue);
        }

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
                    handleSuggestionClick(employeeSuggestions[selectedSuggestionIndex], activeSearchField);
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

    // Handle input focus
    const handleInputFocus = (field) => {
        setActiveSearchField(field);
        setSelectedSuggestionIndex(-1);
        const currentSearchTerm = field === 'approvals' ? approvalSearchTerm : searchTerm;
        if (currentSearchTerm.trim().length >= 1 && employeeSuggestions.length > 0) {
            setShowEmployeeSuggestions(true);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                let shouldClose = true;
                // Check if click is inside any of the search inputs
                Object.values(searchRefs).forEach(ref => {
                    if (ref.current && ref.current.contains(event.target)) {
                        shouldClose = false;
                    }
                });

                if (shouldClose) {
                    setShowEmployeeSuggestions(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBulkFinalize = () => {
        if (selectedApprovalRecords.length === 0) return;
        setFinalizeRecord(null); // Clear single record to indicate bulk

        // If a revision filter is active, pre-select it and it will be locked in the modal
        if (approvalRevisionTypeFilter) {
            setRevisionType(approvalRevisionTypeFilter);
        } else {
            setRevisionType('');
        }

        setIsFinalizeModalOpen(true);
    };

    const toggleApprovalSelection = (id) => {
        setSelectedApprovalRecords(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllApprovals = () => {
        const currentFilteredIds = filteredApprovals.map(r => r.id);

        if (selectedApprovalRecords.length === currentFilteredIds.length && currentFilteredIds.length > 0) {
            setSelectedApprovalRecords([]);
        } else {
            setSelectedApprovalRecords(currentFilteredIds);
        }
    };

    const handleFinalize = (record) => {
        console.log('handleFinalize called with record:', record);
        console.log('record.revisionType:', record?.revisionType);
        setFinalizeRecord(record);

        // Calculate salary breakup based on proposed_fixed_ctc
        if (record && record.proposedFixedCtc) {
            const breakup = calculateSalaryBreakup(record.proposedFixedCtc);
            setSalaryBreakup(breakup);
        } else {
            setSalaryBreakup(null);
        }

        // Auto-select revision type based on record if it exists, otherwise default to "select type"
        if (record) {
            console.log('Finalize record:', record);
            console.log('Record revisionType:', record.revisionType);
            if (record.revisionType) {
                setRevisionType(record.revisionType);
                console.log('Set revisionType to:', record.revisionType);
            } else {
                setRevisionType('');
                console.log('Set revisionType to empty string');
            }
        } else {
            setRevisionType('');
            console.log('No record, set revisionType to empty string');
        }

        // Always reset template selection so the user picks fresh each time
        setSelectedTemplateId('');
        setSelectedCalcTemplateId('');

        setIsFinalizeModalOpen(true);
    };

    const handleFinalizeWithDoc = async () => {
        if (!selectedCalcTemplateId) {
            alert("Please select a calculation template first.");
            return;
        }
        if (!selectedTemplateId) {
            alert("Please select a document template.");
            return;
        }

        setIsFinalizing(true);
        try {
            const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");

            if (finalizeRecord) {
                // Single Finalize - Include salary breakup data
                const payload = {
                    id: finalizeRecord.id,
                    templateId: selectedTemplateId,
                    calcTemplateId: selectedCalcTemplateId,
                    revisionType: revisionType,
                    // Add table styling for PDF generation
                    tableStyle: {
                        alignment: 'center',
                        width: '60%',  // Reduced from 80% to 60%
                        margin: '0 auto',
                        maxWidth: '600px'  // Added max width for better control
                    }
                };

                console.log('Finalize payload with table style:', payload);

                // Add salary breakup data if available
                if (salaryBreakup) {
                    payload.salaryBreakup = {
                        ...salaryBreakup,
                        // Add styling information directly to salary breakup
                        tableStyle: {
                            width: '50%',  // Even smaller width
                            alignment: 'center',
                            margin: '0 auto 20px auto',
                            borderCollapse: 'collapse',
                            fontSize: '15px'
                        }
                    };
                }

                await api.post('/compensation/finalize-with-doc', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (selectedApprovalRecords.length > 0) {
                // Bulk Finalize - Calculate and include salary breakup for each record
                for (const id of selectedApprovalRecords) {
                    const record = historyRecords.find(r => r.id === id);
                    const payload = {
                        id: id,
                        templateId: selectedTemplateId,
                        revisionType: revisionType,
                        // Add table styling for PDF generation
                        tableStyle: {
                            alignment: 'center',
                            width: '60%',  // Reduced from 80% to 60%
                            margin: '0 auto',
                            maxWidth: '600px'  // Added max width for better control
                        }
                    };

                    console.log(`Bulk finalize payload for record ${id} with table style:`, payload);

                    // Calculate and add salary breakup data if record has proposedFixedCtc
                    if (record && record.proposedFixedCtc) {
                        const breakup = calculateSalaryBreakup(record.proposedFixedCtc, record.proposedVariablePay || 0);
                        if (breakup) {
                            payload.salaryBreakup = {
                                ...breakup,
                                // Add styling information directly to salary breakup
                                tableStyle: {
                                    width: '50%',  // Even smaller width
                                    alignment: 'center',
                                    margin: '0 auto 20px auto',
                                    borderCollapse: 'collapse',
                                    fontSize: '15px'
                                }
                            };
                        }
                    }

                    await api.post('/compensation/finalize-with-doc', payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            alert('Compensation finalized successfully!');
            setIsFinalizeModalOpen(false);
            setFinalizeRecord(null);
            setSelectedApprovalRecords([]);
            setSalaryBreakup(null); // Reset salary breakup
            fetchEmployees();
            fetchPendingTasks();
        } catch (err) {
            console.error("Finalize Error:", err);
            alert('Failed to finalize compensation: ' + (err.response?.data || err.message));
        } finally {
            setIsFinalizing(false);
        }
    };

    const handleBulkHikeSubmit = async () => {
        if (selectedBulkEmployees.length === 0) {
            alert("Please select at least one employee.");
            return;
        }
        if (!bulkRevisionData.effectiveDate) {
            alert("Please select an effective date.");
            return;
        }

        setLoading(true);
        try {
            const initiatorId = sessionStorage.getItem('employeeId')?.replace(/^"|"$/g, "");
            const payload = {
                employeeIds: selectedBulkEmployees,
                fixedHikePercentage: parseFloat(bulkRevisionData.fixedHike || 0),
                variableHikePercentage: parseFloat(bulkRevisionData.variableHike || 0),
                effectiveDate: bulkRevisionData.effectiveDate,
                initiatorId: initiatorId,
                revisionType: "Hike"
            };

            const rawToken = sessionStorage.getItem('token');
            const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;
            await api.post('/compensation/bulk', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Bulk salary revision submitted for finalization!');
            fetchEmployees();
            resetBulkFilters();
            setActiveTab('salaryRevision');
        } catch (err) {
            console.error("Bulk Save Error:", err);
            const errorMessage = err.response?.data || 'Failed to submit bulk salary revision';
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleBulkEmployee = (empId) => {
        setSelectedBulkEmployees(prev =>
            prev.includes(empId)
                ? prev.filter(id => id !== empId)
                : [...prev, empId]
        );
    };

    const handleSelectAllBulk = () => {
        if (selectedBulkEmployees.length === filteredEmployees.length && filteredEmployees.length > 0) {
            setSelectedBulkEmployees([]);
        } else {
            setSelectedBulkEmployees(filteredEmployees.map(e => e.employeeId));
        }
    };

    const handleManualIdsChange = (val) => {
        setManualIdsStr(val);
        // Split by comma, space, or newline
        const ids = val.split(/[,\s\n]+/)
            .map(id => id.trim())
            .filter(id => id !== "");

        // Only select IDs that actually exist in our employee list
        const validIds = employees
            .filter(emp => ids.includes(emp.employeeId))
            .map(emp => emp.employeeId);

        setSelectedBulkEmployees(validIds);
    };

    const handleCategorySelect = (type, value) => {
        setBulkRevisionData(prev => ({ ...prev, categoryType: type, categoryValue: value }));

        // Clear value when changing type
        if (type !== bulkRevisionData.categoryType) {
            setBulkRevisionData(prev => ({ ...prev, categoryType: type, categoryValue: '' }));
        }

        // Selection is now handled by the user clicking "Select All Filtered" 
        // or by individual checkmarks to give more control.
    };

    const handleSalaryFilterChange = (field, value) => {
        setBulkRevisionData(prev => ({ ...prev, [field]: value }));
    };

    const handleCustomFilterChange = (field, value) => {
        setBulkRevisionData(prev => {
            const updatedData = { ...prev, [field]: value };
            if (field === 'customField') updatedData.customValue = '';
            return updatedData;
        });
    };

    const uniqueDepartments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].sort();
    const uniqueDesignations = [...new Set(employees.map(emp => emp.designation).filter(Boolean))].sort();
    const uniqueLocations = [...new Set(employees.map(emp => emp.workLocation).filter(Boolean))].sort();

    const getUniqueCustomValues = (field) => {
        if (!field) return [];
        return [...new Set(employees.map(emp => emp[field]).filter(Boolean))].sort();
    };

    const customFields = [
        { id: 'employeeType', name: 'Employee Type' },
        { id: 'probationStatus', name: 'Probation Status' },
        { id: 'gender', name: 'Gender' },
        { id: 'taxRegime', name: 'Tax Regime' }
    ];

    const handleWorkflowAction = async (empId, action, id) => {
        if (!approverComments && action === 'reject') {
            alert("Please provide comments for rejection.");
            return;
        }

        setIsActionLoading(true);
        const myId = sessionStorage.getItem('employeeId')?.replace(/^"|"$/g, "");
        const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
        try {
            await api.post(`/compensation/${action}`, {
                employeeId: empId,
                approverId: myId,
                comments: approverComments,
                id: id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Revision ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
            setApproverComments("");
            fetchPendingTasks();
            fetchEmployees();
        } catch (err) {
            console.error("Workflow Action Error:", err);
            alert("Failed to process approval action.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRevisionChange = (field, value) => {
        const currentRevisionType = revisionData.revisionType || "";
        const hasHikeKeyword = currentRevisionType.toLowerCase().includes('hike');
        const hasPromotionKeyword = currentRevisionType.toLowerCase().includes('promotion');

        // Dynamic Guard
        const isDesignationDisabled = hasHikeKeyword && !hasPromotionKeyword;
        const isSalaryDisabled = hasPromotionKeyword && !hasHikeKeyword;

        if (isDesignationDisabled && field === 'proposedDesignation') return;
        if (isSalaryDisabled &&
            ['proposedFixed', 'proposedVariable', 'hikePercentage', 'fixedHikePercentage', 'variableHikePercentage', 'proposedTotal'].includes(field)) {
            return;
        }

        const updatedData = { ...revisionData, [field]: value };
        const currentFixed = parseFloat(updatedData.currentFixed || 0);
        const currentVariable = parseFloat(updatedData.currentVariable || 0);
        const currentTotal = currentFixed + currentVariable;

        // Reset fields when Revision Type changes
        if (field === 'revisionType') {
            const nextType = value || "";
            const nextHasHike = nextType.toLowerCase().includes('hike');
            const nextHasPromotion = nextType.toLowerCase().includes('promotion');

            if (nextHasHike && !nextHasPromotion) {
                // Hike Only -> reset designation to current
                updatedData.proposedDesignation = selectedEmployee.designation || '';
            } else if (nextHasPromotion && !nextHasHike) {
                // Promotion Only -> reset salary to current
                updatedData.proposedFixed = currentFixed.toString();
                updatedData.proposedVariable = currentVariable.toString();
                updatedData.hikePercentage = 0;
                updatedData.fixedHikePercentage = 0;
                updatedData.variableHikePercentage = 0;
            }
        }

        // Mode 1: If Proposed Pay components change, update Hike %
        if (field === 'proposedFixed' || field === 'proposedVariable') {
            const proposedFixed = parseFloat(updatedData.proposedFixed || 0);
            const proposedVariable = parseFloat(updatedData.proposedVariable || 0);
            const proposedTotal = proposedFixed + proposedVariable;

            if (currentTotal > 0) {
                const hike = ((proposedTotal - currentTotal) / currentTotal) * 100;
                updatedData.hikePercentage = Math.round(hike * 100) / 100;
            } else {
                updatedData.hikePercentage = 0;
            }

            // Individual component hikes
            if (currentFixed > 0) {
                const fixedHike = ((proposedFixed - currentFixed) / currentFixed) * 100;
                updatedData.fixedHikePercentage = Math.round(fixedHike * 100) / 100;
            } else {
                updatedData.fixedHikePercentage = 0;
            }

            if (currentVariable > 0) {
                const variableHike = ((proposedVariable - currentVariable) / currentVariable) * 100;
                updatedData.variableHikePercentage = Math.round(variableHike * 100) / 100;
            } else {
                updatedData.variableHikePercentage = 0;
            }
        }

        // Mode 2: If Overall Hike % changes, update Proposed Pays (pro-rata)
        if (field === 'hikePercentage') {
            const hike = parseFloat(value || 0);
            const factor = 1 + (hike / 100);
            updatedData.proposedFixed = Math.round(currentFixed * factor).toString();
            updatedData.proposedVariable = Math.round(currentVariable * factor).toString();
            updatedData.fixedHikePercentage = hike;
            updatedData.variableHikePercentage = hike;
        }

        // New Mode: Individual Fixed Hike Change
        if (field === 'fixedHikePercentage') {
            const hike = parseFloat(value || 0);
            const factor = 1 + (hike / 100);
            updatedData.proposedFixed = Math.round(currentFixed * factor).toString();

            // Re-calculate overall hike
            const proposedFixed = parseFloat(updatedData.proposedFixed);
            const proposedVariable = parseFloat(updatedData.proposedVariable || 0);
            if (currentTotal > 0) {
                updatedData.hikePercentage = Math.round(((proposedFixed + proposedVariable - currentTotal) / currentTotal) * 100 * 100) / 100;
            }
        }

        // New Mode: Individual Variable Hike Change
        if (field === 'variableHikePercentage') {
            const hike = parseFloat(value || 0);
            const factor = 1 + (hike / 100);
            updatedData.proposedVariable = Math.round(currentVariable * factor).toString();

            // Re-calculate overall hike
            const proposedFixed = parseFloat(updatedData.proposedFixed || 0);
            const proposedVariable = parseFloat(updatedData.proposedVariable);
            if (currentTotal > 0) {
                updatedData.hikePercentage = Math.round(((proposedFixed + proposedVariable - currentTotal) / currentTotal) * 100 * 100) / 100;
            }
        }

        // Mode 3: If Target Total CTC changes, update Proposed Pays (pro-rata) and Hike %
        if (field === 'proposedTotal') {
            const proposedTotal = parseFloat(value || 0);
            if (currentTotal > 0) {
                const factor = proposedTotal / currentTotal;
                updatedData.proposedFixed = Math.round(currentFixed * factor).toString();
                updatedData.proposedVariable = Math.round(currentVariable * factor).toString();

                const hike = ((proposedTotal - currentTotal) / currentTotal) * 100;
                const roundedHike = Math.round(hike * 100) / 100;
                updatedData.hikePercentage = roundedHike;
                updatedData.fixedHikePercentage = roundedHike;
                updatedData.variableHikePercentage = roundedHike;
            } else {
                updatedData.proposedFixed = proposedTotal.toString();
                updatedData.proposedVariable = '0';
                updatedData.hikePercentage = 0;
                updatedData.fixedHikePercentage = 0;
                updatedData.variableHikePercentage = 0;
            }
        }

        setRevisionData(updatedData);
    };

    // Auto-calculate breakup for preview
    useEffect(() => {
        if (revisionData.proposedFixed) {
            const breakup = calculateSalaryBreakup(revisionData.proposedFixed, revisionData.proposedVariable || 0);
            setSalaryBreakup(breakup);
        } else {
            setSalaryBreakup(null);
        }
    }, [revisionData.proposedFixed, revisionData.proposedVariable, salaryComponents]);

    // ============================================================
    // ⭐ Salary Breakup Calculation Function (Dynamic Formulas)
    // ============================================================
    const calculateSalaryBreakup = (proposedFixedCtc, proposedVariablePay = 0) => {
        const fixedCtc = parseFloat(String(proposedFixedCtc).replace(/,/g, '')) || 0;
        const variablePay = parseFloat(proposedVariablePay) || 0;
        if (fixedCtc === 0) return null;

        // If no dynamic components are defined, use a safer default or return empty
        if (!salaryComponents || salaryComponents.length === 0) {
            return {
                earnings: {
                    monthlyTotal: { perMonth: fixedCtc / 12, perAnnum: fixedCtc, name: 'Total Fixed CTC', section: 'Summary' },
                    variablePay: { perMonth: variablePay / 12, perAnnum: variablePay, name: 'Variable Pay', section: 'Summary' }
                },
                deductions: {}
            };
        }

        // Dynamic Calculation Logic
        const context = {
            CTC: fixedCtc,
            FIXED_CTC: fixedCtc,
            ANNUAL_CTC: fixedCtc,
            MONTHLY_CTC: fixedCtc / 12,
            MONTHLY_FIXED_CTC: fixedCtc / 12,
            MONTHLY_TOTAL: fixedCtc / 12,
            VARIABLE_PAY: variablePay,
            ANNUAL_VARIABLE: variablePay,
            MONTHLY_VARIABLE: variablePay / 12,
            // Aliases for user-friendly names (normalized keys)
            FIXEDCTC: fixedCtc,
            ANNUALCTC: fixedCtc,
            MONTHLYCTC: fixedCtc / 12,
            MONTHLYTOTAL: fixedCtc / 12,
            MONTHLYFIXEDCTC: fixedCtc / 12,
            MONTHLYVARIABLE: variablePay / 12,
            MONTHLYVARIABLE_PAY: variablePay / 12
        };
        const breakup = { earnings: {}, deductions: {} };
        const sorted = [...salaryComponents].sort((a, b) => a.sortOrder - b.sortOrder);

        // Helper to safely evaluate formula
        const evaluate = (formula, ctx) => {
            if (!formula) return 0;
            try {
                if (formula.toUpperCase() === 'AS_APPLICABLE') return 0;
                let expr = formula.toUpperCase();
                expr = expr.replace(/%/g, '/100');
                expr = expr.replace(/\s+/g, '');

                const tokens = expr.match(/[A-Z_][A-Z0-9_]*/g) || [];
                const uniqueTokens = [...new Set(tokens)].sort((a, b) => b.length - a.length);

                uniqueTokens.forEach(token => {
                    let val = 0;
                    let found = false;
                    const cleanToken = token.replace(/_/g, '');

                    if (ctx.hasOwnProperty(token)) {
                        val = ctx[token];
                        found = true;
                    } else if (ctx.hasOwnProperty(cleanToken)) {
                        val = ctx[cleanToken];
                        found = true;
                    } else {
                        // Check for underscore version as well
                        const underscoreToken = token.split('').join('_'); // This isn't precise but fallback
                        const comp = salaryComponents.find(c => {
                            const p = c.placeholder?.toUpperCase() || '';
                            const cp = p.replace(/_/g, '');
                            return p === token || cp === token || p === cleanToken || cp === cleanToken;
                        });
                        if (comp) {
                            val = ctx[comp.placeholder] || 0;
                            found = true;
                        }
                    }

                    if (!found && (token.endsWith('PERMONTH') || token.endsWith('MONTHLY'))) {
                        const base = token.replace('PERMONTH', '').replace('MONTHLY', '');
                        const cleanBase = base.replace(/_/g, '');
                        if (ctx.hasOwnProperty(base)) {
                            val = ctx[base] / 12;
                            found = true;
                        } else if (ctx.hasOwnProperty(cleanBase)) {
                            val = ctx[cleanBase] / 12;
                            found = true;
                        } else {
                            const comp = salaryComponents.find(c => {
                                const p = c.placeholder?.toUpperCase() || '';
                                return p === base || p.replace(/_/g, '') === base || p === cleanBase || p.replace(/_/g, '') === cleanBase;
                            });
                            if (comp) {
                                val = (ctx[comp.placeholder] || 0) / 12;
                                found = true;
                            }
                        }
                    }
                    const regex = new RegExp(`\\b${token}\\b`, 'g');
                    expr = expr.replace(regex, val);
                });

                const openCount = (expr.match(/\(/g) || []).length;
                const closeCount = (expr.match(/\)/g) || []).length;
                if (openCount < closeCount) {
                    expr = expr.replace(/\)+$/, match => match.slice(0, openCount));
                }

                // eslint-disable-next-line no-eval
                const result = eval(expr);
                return typeof result === 'number' ? result : 0;
            } catch (e) {
                console.error("Formula evaluation failed:", formula, e);
                return 0;
            }
        };

        // Pass 1: FLAT components
        sorted.filter(c => c.calculationType === 'FLAT' || !c.calculationType).forEach(comp => {
            const val = parseFloat(comp.calculationValue) || 0;
            const p = comp.placeholder.toUpperCase();
            context[p] = val;
            context[p.replace(/_/g, '')] = val;
            context[`MONTHLY_${p}`] = val / 12;
            context[`MONTHLY${p.replace(/_/g, '')}`] = val / 12;
            context[`${p}_MONTHLY`] = val / 12;
            context[`${p.replace(/_/g, '')}MONTHLY`] = val / 12;
            const target = comp.type === 'EARNING' ? breakup.earnings : breakup.deductions;
            const key = comp.placeholder.toLowerCase();
            target[key] = {
                perMonth: val / 12,
                perAnnum: val,
                name: comp.name,
                section: comp.section || (comp.type === 'EARNING' ? 'Earnings' : 'Deductions')
            };
        });

        // Pass 2: PERCENTAGE components
        sorted.filter(c => c.calculationType === 'PERCENTAGE').forEach(comp => {
            let baseVal = 0;
            const source = comp.sourceComponent;
            if (source === 'FIXED_CTC' || source === 'CTC') {
                baseVal = fixedCtc;
            } else if (source) {
                baseVal = context[source] || 0;
            }
            const val = baseVal * ((parseFloat(comp.calculationValue) || 0) / 100);
            const p = comp.placeholder.toUpperCase();
            context[p] = val;
            context[p.replace(/_/g, '')] = val;
            context[`MONTHLY_${p}`] = val / 12;
            context[`MONTHLY${p.replace(/_/g, '')}`] = val / 12;
            context[`${p}_MONTHLY`] = val / 12;
            context[`${p.replace(/_/g, '')}MONTHLY`] = val / 12;
            const target = comp.type === 'EARNING' ? breakup.earnings : breakup.deductions;
            const key = comp.placeholder.toLowerCase();
            target[key] = {
                perMonth: val / 12,
                perAnnum: val,
                name: comp.name,
                section: comp.section || (comp.type === 'EARNING' ? 'Earnings' : 'Deductions')
            };
        });

        // Pass 3: FORMULA types
        sorted.filter(c => c.calculationType === 'FORMULA').forEach(comp => {
            const val = evaluate(comp.formula, context);
            const p = comp.placeholder.toUpperCase();
            context[p] = val;
            context[p.replace(/_/g, '')] = val;
            context[`MONTHLY_${p}`] = val / 12;
            context[`MONTHLY${p.replace(/_/g, '')}`] = val / 12;
            context[`${p}_MONTHLY`] = val / 12;
            context[`${p.replace(/_/g, '')}MONTHLY`] = val / 12;
            const target = comp.type === 'EARNING' ? breakup.earnings : breakup.deductions;
            const key = comp.placeholder.toLowerCase();
            const isAsApplicable = comp.showAsApplicable && val === 0;

            target[key] = {
                perMonth: isAsApplicable ? "As applicable" : val / 12,
                perAnnum: isAsApplicable ? "As applicable" : val,
                name: comp.name,
                section: comp.section || (comp.type === 'EARNING' ? 'Earnings' : 'Deductions')
            };
        });

        // Pass 4: REMAINDER types
        sorted.filter(c => c.calculationType === 'REMAINDER' || (c.formula && c.formula.toUpperCase() === 'REMAINDER')).forEach(comp => {
            const otherEarnings = Object.entries(breakup.earnings)
                .reduce((sum, [k, v]) => {
                    const key = k.toUpperCase().replace(/_/g, '');
                    if (key.includes("TOTAL") || key.includes("CTC") || key.includes("GROSS") ||
                        key.includes("SUBTOTAL") || key.includes("PACKAGE") || key.includes("MONTHLY") ||
                        v.section === 'Summary') {
                        return sum;
                    }
                    return sum + (parseFloat(v.perAnnum) || 0);
                }, 0);
            const val = Math.max(0, fixedCtc - otherEarnings);
            context[comp.placeholder] = val;
            const key = comp.placeholder.toLowerCase();
            breakup.earnings[key] = {
                perMonth: val / 12,
                perAnnum: val,
                name: comp.name,
                section: comp.section || 'Summary'
            };
        });

        // Finalize Summaries
        if (variablePay > 0) {
            breakup.earnings.variable_pay = { perMonth: variablePay / 12, perAnnum: variablePay, name: 'Variable Pay', section: 'Summary' };
        }

        const totalKey = 'monthly_total';
        if (!breakup.earnings.monthlytotal && !breakup.earnings.monthly_total) {
            breakup.earnings[totalKey] = { perMonth: fixedCtc / 12, perAnnum: fixedCtc, name: 'Total Fixed CTC', section: 'Summary' };
        }

        if (!breakup.earnings.sub_total && !breakup.earnings.subtotal) {
            const sumForSubTotal = Object.entries(breakup.earnings)
                .reduce((sum, [k, v]) => {
                    const key = k.toUpperCase().replace(/_/g, '');
                    const name = v.name.toUpperCase();
                    if (key.includes("TOTAL") || key.includes("CTC") || key.includes("EMPLOYER") ||
                        key.includes("GROSS") || key.includes("PACKAGE") || key.includes("SUBTOTAL") ||
                        name.includes("TOTAL") || name.includes("CTC") || name.includes("EMPLOYER") ||
                        name.includes("GROSS") || name.includes("PACKAGE") || name.includes("SUB TOTAL") ||
                        v.section === 'Summary') return sum;
                    return sum + (parseFloat(v.perAnnum) || 0);
                }, 0);
            breakup.earnings.sub_total = { perMonth: sumForSubTotal / 12, perAnnum: sumForSubTotal, name: 'Gross Salary (Sub Total)', section: 'Summary' };
        }

        return breakup;
    };

    // ============================================================
    // ⭐ Format Number with Commas
    // ============================================================
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(Math.round(num));
    };

    // Style constants
    const containerStyle = {
        padding: isMobile ? '10px' : '24px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        color: '#1e293b'
    };

    const headerStyle = {
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)',
        padding: isMobile ? '16px 20px' : '24px 32px',
        margin: isMobile ? '-10px -10px 20px -10px' : '-32px -32px 24px -32px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '4px' : '8px'
    };

    const titleStyle = {
        margin: 0,
        fontSize: '30px',
        fontWeight: 'normal',
        color: '#1F2937',
        letterSpacing: '-0.025em',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    };

    const tabContainerStyle = {
        display: 'flex',
        gap: '0px',
        justifyContent: 'space-between',
        marginBottom: '20px',
        background: '#0B3D91',
        borderRadius: '8px',
        padding: '0px',
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };

    const tabStyle = (active) => ({
        flex: 1,
        padding: '12px 24px',
        background: active ? '#1F6FEB' : 'transparent',
        color: 'white',
        border: 'none',
        borderRadius: '0px',
        fontSize: '15px',
        fontWeight: 'normal',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease-in-out'
    });

    const searchInputStyle = {
        width: isMobile ? '100%' : '300px',
        padding: '10px 16px',
        fontSize: '15px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        outline: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    };

    const cardStyle = {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        border: '1px solid #f1f5f9',
        width: '100%'
    };

    const tableStyle = { borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' };

    const thStyle = {
        padding: '12px 16px',
        background: '#629AF1',
        borderBottom: '1px solid #e2e8f0',
        color: 'white',
        fontWeight: 'normal',
        fontSize: '15px',
        textTransform: 'capitalize',
        letterSpacing: '0.05em',
        textAlign: 'left',
        position: 'sticky',
        top: 0,
        zIndex: 10
    };

    const tdStyle = {
        padding: '14px 20px',
        borderBottom: '1px solid #f1f5f9',
        fontSize: '15px',
        color: '#1e293b',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };

    const rowStyle = { transition: 'background-color 0.15s ease' };

    const labelStyle = {
        fontSize: '15px',
        fontWeight: '800',
        color: '#0d9488',
        marginBottom: '10px',
        display: 'block',
        textTransform: 'capitalize',
        letterSpacing: '0.05em',
        opacity: 0.8
    };
    const inputStyle = {
        width: '100%',
        paddingTop: '12px',
        paddingBottom: '12px',
        paddingLeft: '14px',
        paddingRight: '14px',
        border: '1.5px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: '500',
        outline: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box',
        backgroundColor: 'white',
        color: '#1e293b'
    };

    return (
        <Sidebar>
            <>
                <style>
                    {`
                    input::-webkit-outer-spin-button,
                    input::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input[type=number] {
                        -moz-appearance: textfield;
                    }
                `}
                </style>
                <div style={containerStyle}>
                    <div style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {selectedEmployee && (
                                <button
                                    onClick={() => setSelectedEmployee(null)}
                                    style={{
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b'
                                    }}
                                >
                                    <FiArrowLeft size={18} />
                                </button>
                            )}
                            <h1 style={titleStyle}>
                                {selectedEmployee ? (
                                    <>
                                        Salary Revision Details
                                    </>
                                ) : activeTab === 'salaryRevision' ? (
                                    <>
                                        Salary Revision
                                    </>
                                ) : activeTab === 'bulkHike' ? (
                                    <>
                                        Bulk Salary Hike
                                    </>
                                ) : (
                                    <>
                                        Approvals
                                    </>
                                )}
                            </h1>
                        </div>
                        <p style={{ margin: 0, color: '#00B3A4', fontSize: '15px' }}>
                            {selectedEmployee
                                ? `Revision details for ${selectedEmployee.employeeName || (selectedEmployee.firstName + ' ' + selectedEmployee.lastName)}${selectedEmployee.designation ? ` • ${selectedEmployee.designation}` : ''}`.replace('undefined undefined', '')
                                : activeTab === 'salaryRevision'
                                    ? 'Overview and adjust employee compensation'
                                    : activeTab === 'bulkHike'
                                        ? 'Apply salary increments to multiple employees at once'
                                        : 'Review and finalize pending compensation revisions'}
                        </p>
                    </div>

                    {!selectedEmployee && (
                        <div style={tabContainerStyle}>
                            <button
                                style={tabStyle(activeTab === 'salaryRevision')}
                                onClick={() => {
                                    resetBulkFilters();
                                    setActiveTab('salaryRevision');
                                    setCurrentPage(1);
                                }}
                            >
                                Salary Revision
                            </button>
                            <button
                                style={tabStyle(activeTab === 'bulkHike')}
                                onClick={() => {
                                    resetBulkFilters();
                                    setActiveTab('bulkHike');
                                    setCurrentPage(1);
                                }}
                            >
                                Bulk Salary Hike
                            </button>

                            <button
                                style={tabStyle(activeTab === 'approvals')}
                                onClick={() => {
                                    resetBulkFilters();
                                    setActiveTab('approvals');
                                    setCurrentPage(1);
                                }}
                            >
                                Approvals
                            </button>

                            {/* <button
                            style={tabStyle(activeTab === 'history')}
                            onClick={() => setActiveTab('history')}
                        >
                            Salary History
                        </button> */}

                        </div>
                    )}

                    {loading && !selectedEmployee ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                            <p>Loading records...</p>
                        </div>
                    ) : error ? (
                        <div style={{ padding: '24px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    ) : selectedEmployee ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                            <div style={tabContainerStyle}>
                                <button style={tabStyle(employeeActiveTab === 'revision')} onClick={() => setEmployeeActiveTab('revision')}>
                                    <FiPercent /> Revision Proposal
                                </button>
                                <button style={tabStyle(employeeActiveTab === 'history')} onClick={() => setEmployeeActiveTab('history')}>
                                    <FiTrendingUp /> History
                                </button>
                            </div>
                            {employeeActiveTab === 'revision' ? (
                                <div style={cardStyle}>
                                    <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfc' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Revision Details</h3>
                                    </div>

                                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
                                            {/* Current CTC Section */}
                                            <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a' }}>Current CTC</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={labelStyle}>Fixed Pay (per annum)</label>
                                                            <div style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                                                ₹ {parseInt(revisionData.currentFixed || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label style={labelStyle}>Fixed Hike</label>
                                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    value={revisionData.fixedHikePercentage}
                                                                    onChange={(e) => handleRevisionChange('fixedHikePercentage', e.target.value)}
                                                                    disabled={!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))}
                                                                    onWheel={(e) => e.target.blur()}
                                                                    onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                                                    style={{
                                                                        ...inputStyle,
                                                                        backgroundColor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? '#f1f5f9' : '#f0fdf4',
                                                                        color: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? '#64748b' : '#0d9488',
                                                                        paddingRight: '60px',
                                                                        cursor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? 'not-allowed' : 'text'
                                                                    }}
                                                                    placeholder="0"
                                                                />
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    right: '12px',
                                                                    fontSize: '15px',
                                                                    fontWeight: '700',
                                                                    color: '#0d9488'
                                                                }}>%</span>
                                                            </div>
                                                            <div style={{ fontSize: '15px', color: '#64748b', marginTop: '4px' }}>
                                                                ₹ {(parseInt(revisionData.proposedFixed || 0) - parseInt(revisionData.currentFixed || 0)).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={labelStyle}>Variable Pay (per annum)</label>
                                                            <div style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                                                ₹ {parseInt(revisionData.currentVariable || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label style={labelStyle}>Variable Hike</label>
                                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    value={revisionData.variableHikePercentage}
                                                                    onChange={(e) => handleRevisionChange('variableHikePercentage', e.target.value)}
                                                                    disabled={!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))}
                                                                    onWheel={(e) => e.target.blur()}
                                                                    onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                                                    style={{
                                                                        ...inputStyle,
                                                                        backgroundColor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? '#f1f5f9' : '#f0fdf4',
                                                                        color: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? '#64748b' : '#0d9488',
                                                                        paddingRight: '60px',
                                                                        cursor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? 'not-allowed' : 'text'
                                                                    }}
                                                                    placeholder="0"
                                                                />
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    right: '12px',
                                                                    fontSize: '15px',
                                                                    fontWeight: '700',
                                                                    color: '#0d9488'
                                                                }}>%</span>
                                                            </div>
                                                            <div style={{ fontSize: '15px', color: '#64748b', marginTop: '4px' }}>
                                                                ₹ {(parseInt(revisionData.proposedVariable || 0) - parseInt(revisionData.currentVariable || 0)).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                                                        <label style={labelStyle}>Total Current CTC</label>
                                                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                                                            ₹ {(parseInt(revisionData.currentFixed || 0) + parseInt(revisionData.currentVariable || 0)).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Revision Logic Section */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <div>
                                                    <label style={labelStyle}><FiCalendar style={{ marginRight: '4px' }} /> Effective Date</label>
                                                    <SmartDatePicker
                                                        value={revisionData.effectiveDate}
                                                        onChange={(date) => handleRevisionChange('effectiveDate', date)}
                                                        inputStyle={inputStyle}
                                                        placeholder="Select effective date"
                                                        minDate={new Date()}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={labelStyle}><FiSettings style={{ marginRight: '4px' }} /> Salary Revision</label>
                                                    <select
                                                        style={inputStyle}
                                                        value={revisionData.revisionType}
                                                        onChange={(e) => handleRevisionChange('revisionType', e.target.value)}
                                                    >
                                                        {revisionTypes.length > 0 ? (
                                                            <>
                                                                <option value="" disabled>select type</option>
                                                                {revisionTypes.map(type => (
                                                                    <option key={type.id} value={type.typeName}>{type.typeName}</option>
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <option value="" disabled>No salary revision categories configured</option>
                                                        )}
                                                    </select>
                                                </div>

                                            </div>
                                        </div>

                                        {/* Proposed Designation */}
                                        <div style={{ padding: '20px', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                <FiUser color="#0d9488" />
                                                <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>Designation Change</h4>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle}>Current Designation</label>
                                                    <div style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                                        {selectedEmployee.designation || 'N/A'}
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle}>Proposed Designation</label>
                                                    <select
                                                        style={{
                                                            ...inputStyle,
                                                            backgroundColor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('hike') && !(revisionData.revisionType || "").toLowerCase().includes('promotion'))) ? '#f1f5f9' : 'white',
                                                            cursor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('hike') && !(revisionData.revisionType || "").toLowerCase().includes('promotion'))) ? 'not-allowed' : 'pointer'
                                                        }}
                                                        value={revisionData.proposedDesignation}
                                                        onChange={(e) => handleRevisionChange('proposedDesignation', e.target.value)}
                                                        disabled={!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('hike') && !(revisionData.revisionType || "").toLowerCase().includes('promotion'))}
                                                    >
                                                        <option value="">-- Select Designation --</option>
                                                        <option value={selectedEmployee.designation}>{selectedEmployee.designation} (Current)</option>
                                                        {designationCategories.map((cat) => (
                                                            cat.name !== selectedEmployee.designation && (
                                                                <option key={cat.id || cat.name} value={cat.name}>
                                                                    {cat.name}
                                                                </option>
                                                            )
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
                                            {/* Proposed Section */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={labelStyle}>Proposed Fixed Pay</label>
                                                    <div style={{ color: '#0d9488', fontSize: '15px', fontWeight: '700' }}>
                                                        Hike: {revisionData.fixedHikePercentage}%
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    padding: '0 12px'
                                                }}>
                                                    <span style={{
                                                        color: Number(revisionData.proposedFixed) > Number(revisionData.currentFixed) ? '#16a34a' : '#475569',
                                                        fontWeight: '800',
                                                        marginRight: '8px',
                                                        fontSize: '16px'
                                                    }}>₹</span>
                                                    <input
                                                        type="number"
                                                        style={{
                                                            border: 'none',
                                                            outline: 'none',
                                                            padding: '10px 0',
                                                            width: '100%',
                                                            fontSize: '15px',
                                                            fontWeight: Number(revisionData.proposedFixed) > Number(revisionData.currentFixed) ? '700' : '500',
                                                            color: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? '#64748b' : (Number(revisionData.proposedFixed) > Number(revisionData.currentFixed) ? '#16a34a' : '#1e293b'),
                                                            backgroundColor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? 'transparent' : 'white',
                                                            cursor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? 'not-allowed' : 'text'
                                                        }}
                                                        placeholder="0.00"
                                                        value={revisionData.proposedFixed}
                                                        onChange={(e) => handleRevisionChange('proposedFixed', e.target.value)}
                                                        disabled={!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))}
                                                        onWheel={(e) => e.target.blur()}
                                                        onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                                    />
                                                </div>
                                                {Number(revisionData.proposedFixed) - Number(revisionData.currentFixed) > 0 && (
                                                    <div style={{ fontSize: '15px', color: '#16a34a', fontWeight: '900', marginTop: '6px' }}>
                                                        + ₹ {(Number(revisionData.proposedFixed) - Number(revisionData.currentFixed)).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={labelStyle}>Proposed Variable Pay</label>
                                                    <div style={{ color: '#0d9488', fontSize: '15px', fontWeight: '700' }}>
                                                        Hike: {revisionData.variableHikePercentage}%
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    padding: '0 12px'
                                                }}>
                                                    <span style={{
                                                        color: Number(revisionData.proposedVariable) > Number(revisionData.currentVariable) ? '#16a34a' : '#475569',
                                                        fontWeight: '800',
                                                        marginRight: '8px',
                                                        fontSize: '16px'
                                                    }}>₹</span>
                                                    <input
                                                        type="number"
                                                        style={{
                                                            border: 'none',
                                                            outline: 'none',
                                                            padding: '10px 0',
                                                            width: '100%',
                                                            fontSize: '15px',
                                                            fontWeight: Number(revisionData.proposedVariable) > Number(revisionData.currentVariable) ? '700' : '500',
                                                            color: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? '#64748b' : (Number(revisionData.proposedVariable) > Number(revisionData.currentVariable) ? '#16a34a' : '#1e293b'),
                                                            backgroundColor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? 'transparent' : 'white',
                                                            cursor: (!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))) ? 'not-allowed' : 'text'
                                                        }}
                                                        placeholder="0.00"
                                                        value={revisionData.proposedVariable}
                                                        onChange={(e) => handleRevisionChange('proposedVariable', e.target.value)}
                                                        disabled={!revisionData.revisionType || ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))}
                                                        onWheel={(e) => e.target.blur()}
                                                        onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                                    />
                                                </div>
                                                {Number(revisionData.proposedVariable) - Number(revisionData.currentVariable) > 0 && (
                                                    <div style={{ fontSize: '15px', color: '#16a34a', fontWeight: '900', marginTop: '6px' }}>
                                                        + ₹ {(Number(revisionData.proposedVariable) - Number(revisionData.currentVariable)).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '16px 20px',
                                            backgroundColor: '#f1f5f9',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: '8px',
                                            border: '2px solid #e2e8f0'
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: '600', color: '#475569', display: 'block' }}>Total Proposed CTC</span>
                                                <span style={{ fontSize: '15px', color: '#64748b' }}>Enter total to auto-distribute</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>₹</span>
                                                    <input
                                                        type="number"
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            fontSize: '20px',
                                                            fontWeight: '800',
                                                            color: ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike')) ? '#64748b' : '#0f172a',
                                                            textAlign: 'right',
                                                            width: '150px',
                                                            outline: 'none',
                                                            cursor: ((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike')) ? 'not-allowed' : 'text'
                                                        }}
                                                        value={parseFloat(revisionData.proposedFixed || 0) + parseFloat(revisionData.proposedVariable || 0)}
                                                        onChange={(e) => handleRevisionChange('proposedTotal', e.target.value)}
                                                        disabled={((revisionData.revisionType || "").toLowerCase().includes('promotion') && !(revisionData.revisionType || "").toLowerCase().includes('hike'))}
                                                        onWheel={(e) => e.target.blur()}
                                                        onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                                    />
                                                </div>
                                                {((parseFloat(revisionData.proposedFixed || 0) + parseFloat(revisionData.proposedVariable || 0)) -
                                                    (parseFloat(revisionData.currentFixed || 0) + parseFloat(revisionData.currentVariable || 0))) > 0 && (
                                                        <div style={{ fontSize: '15px', color: '#16a34a', fontWeight: '800', marginTop: '4px' }}>
                                                            + ₹ {(parseFloat(revisionData.proposedFixed || 0) + parseFloat(revisionData.proposedVariable || 0) - (parseFloat(revisionData.currentFixed || 0) + parseFloat(revisionData.currentVariable || 0))).toLocaleString()}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Salary Breakup Preview */}
                                        {/* {salaryBreakup && (
                                            <div style={{ marginTop: '24px', animation: 'fadeIn 0.5s ease-out' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <FiBarChart2 color="#0d9488" />
                                                        Proposed Salary Breakup
                                                    </h4>
                                                </div>

                                                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'auto', maxHeight: '400px' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                                                        <thead>
                                                            <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                                <th style={thStyle}>Section / Component</th>
                                                                <th style={{ ...thStyle, textAlign: 'right' }}>Monthly</th>
                                                                <th style={{ ...thStyle, textAlign: 'right' }}>Annual</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(() => {
                                                                const all = [...Object.values(salaryBreakup.earnings), ...Object.values(salaryBreakup.deductions)];
                                                                const sections = [...new Set(all.map(c => c.section))].sort((a, b) => {
                                                                    if (a === 'Summary') return 1;
                                                                    if (b === 'Summary') return -1;
                                                                    return a.localeCompare(b);
                                                                });

                                                                return sections.map(section => (
                                                                    <React.Fragment key={section}>
                                                                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                                            <td colSpan="3" style={{ padding: '8px 16px', fontWeight: '800', color: '#475569', fontSize: '15px', textTransform: 'capitalize', letterSpacing: '0.05em' }}>
                                                                                {section}
                                                                            </td>
                                                                        </tr>
                                                                        {all.filter(c => c.section === section).map((c, i) => (
                                                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                                <td style={{ padding: '10px 16px', color: '#1e293b', fontWeight: (section === 'Summary' || c.name.includes('Total') || c.name.includes('Sub Total')) ? '700' : '500' }}>
                                                                                    {c.name}
                                                                                </td>
                                                                                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                                                                                    ₹{formatNumber(c.perMonth === "As applicable" ? 0 : c.perMonth)}
                                                                                </td>
                                                                                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '600', color: '#0d9488' }}>
                                                                                    ₹{formatNumber(c.perAnnum === "As applicable" ? 0 : c.perAnnum)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </React.Fragment>
                                                                ));
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )} */}

                                        {(selectedEmployee.managerComments || selectedEmployee.financeComments || selectedEmployee.hrComments) && (
                                            <div style={{
                                                padding: '20px',
                                                backgroundColor: '#f8fafc',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                marginTop: '16px'
                                            }}>
                                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Approval Comments</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {selectedEmployee.managerComments && (
                                                        <div>
                                                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#64748b', textTransform: 'capitalize' }}>Manager</span>
                                                            <p style={{ margin: '4px 0', fontSize: '15px', color: '#334155' }}>{selectedEmployee.managerComments}</p>
                                                        </div>
                                                    )}
                                                    {selectedEmployee.financeComments && (
                                                        <div>
                                                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#64748b', textTransform: 'capitalize' }}>Finance</span>
                                                            <p style={{ margin: '4px 0', fontSize: '15px', color: '#334155' }}>{selectedEmployee.financeComments}</p>
                                                        </div>
                                                    )}
                                                    {selectedEmployee.hrComments && (
                                                        <div>
                                                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#64748b', textTransform: 'capitalize' }}>HR</span>
                                                            <p style={{ margin: '4px 0', fontSize: '15px', color: '#334155' }}>{selectedEmployee.hrComments}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                                            <button
                                                onClick={() => setSelectedEmployee(null)}
                                                style={{
                                                    padding: '10px 20px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    backgroundColor: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    color: '#64748b'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmitRevision}
                                                style={{
                                                    padding: '10px 24px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
                                                    cursor: 'pointer',
                                                    fontWeight: '700',
                                                    color: 'white',
                                                    boxShadow: '0 4px 12px rgba(94, 234, 212, 0.4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <FiSend /> Submit Revision
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={cardStyle}>
                                    <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfc' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Compensation History</h3>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={tableStyle}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#000000', textAlign: 'left' }}>
                                                    <th style={thStyle}>Date</th>
                                                    <th style={thStyle}>Designation</th>
                                                    <th style={thStyle}>Fixed Pay</th>
                                                    <th style={thStyle}>Variable Pay</th>
                                                    <th style={thStyle}>Total CTC</th>
                                                    <th style={thStyle}>Hike %</th>
                                                    <th style={thStyle}>Salary Revision</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employeeHistory.length > 0 ? (
                                                    employeeHistory.map((rec, index) => (
                                                        <tr key={index} style={rowStyle}>
                                                            <td style={tdStyle}>{rec.effectiveDate ? new Date(rec.effectiveDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</td>
                                                            <td style={tdStyle}>{rec.proposedDesignation || rec.designation || '-'}</td>
                                                            <td style={tdStyle}>₹{Number(rec.proposedFixedCtc).toLocaleString()}</td>
                                                            <td style={tdStyle}>₹{Number(rec.proposedVariablePay).toLocaleString()}</td>
                                                            <td style={tdStyle}>₹{Number(rec.totalProposedCtc).toLocaleString()}</td>
                                                            <td style={tdStyle}>
                                                                <span style={{ color: rec.hikePercentage > 0 ? '#16a34a' : 'inherit', fontWeight: 'bold' }}>
                                                                    {rec.hikePercentage}%
                                                                </span>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <span style={{
                                                                    backgroundColor: '#f1f5f9',
                                                                    color: '#475569',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '8px',
                                                                    fontWeight: '600',
                                                                    fontSize: '15px'
                                                                }}>
                                                                    {rec.revisionType || '-'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No history found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {activeTab === 'salaryRevision' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                        <div style={{ position: 'relative', width: '300px' }}>
                                            <input
                                                ref={searchRefs.salaryRevision}
                                                type="text"
                                                placeholder="Search by ID or Name..."
                                                value={searchTerm}
                                                onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'salaryRevision')}
                                                onFocus={() => handleInputFocus('salaryRevision')}
                                                onKeyDown={handleKeyDown}
                                                style={{
                                                    ...searchInputStyle,
                                                    width: '100%'
                                                }}
                                            />
                                            <EmployeeSuggestion
                                                suggestions={employeeSuggestions}
                                                showSuggestions={showEmployeeSuggestions && activeSearchField === 'salaryRevision'}
                                                suggestionsLoading={suggestionsLoading}
                                                onSelect={handleSuggestionClick}
                                                activeField="salaryRevision"
                                                inputRef={suggestionsRef}
                                                selectedSuggestionIndex={selectedSuggestionIndex}
                                                setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                                            />
                                        </div>
                                        <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>
                                            Showing {filteredEmployees.length} employees
                                        </div>
                                    </div>

                                    <div style={cardStyle}>
                                        <div style={{ padding: '0px', overflowX: 'auto' }}>
                                            <table style={tableStyle}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ ...thStyle, width: '15%' }}>Employee ID</th>
                                                        <th style={{ ...thStyle, width: '25%' }}>Employee Name</th>
                                                        <th style={{ ...thStyle, width: '20%' }}>Designation</th>
                                                        <th style={{ ...thStyle, width: '15%' }}>Department</th>
                                                        <th style={{ ...thStyle, width: '15%' }}>Joining Date</th>
                                                        <th style={{ ...thStyle, width: '10%' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentEmployees.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                                                No matches found for your search criteria.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        currentEmployees.map(emp => (
                                                            <tr
                                                                key={emp.employeeId}
                                                                style={rowStyle}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <td
                                                                    style={{ ...tdStyle, fontWeight: '600', color: '#0d9488', cursor: 'pointer' }}
                                                                    onClick={() => handleEmployeeClick(emp)}
                                                                >
                                                                    {getDisplayEmployeeId(emp.employeeId)}
                                                                </td>
                                                                <td style={{ ...tdStyle, fontWeight: '500' }}>
                                                                    {emp.employeeName}
                                                                </td>
                                                                <td style={tdStyle}>{emp.designation || 'N/A'}</td>
                                                                <td style={tdStyle}>{emp.department || 'N/A'}</td>
                                                                <td style={tdStyle}>
                                                                    {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}
                                                                </td>
                                                                <td style={{ ...tdStyle, cursor: 'default', overflow: 'visible', padding: '14px 10px' }}>
                                                                    <span style={{
                                                                        padding: '4px 10px',
                                                                        borderRadius: '8px',
                                                                        fontSize: '15px',
                                                                        fontWeight: '600',
                                                                        backgroundColor: '#f0fdf4',
                                                                        color: '#16a34a',
                                                                        cursor: 'default'
                                                                    }}>Active</span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        {totalPages > 1 && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '16px 20px',
                                                borderTop: '1px solid #f1f5f9',
                                                backgroundColor: '#fcfcfc'
                                            }}>
                                                <div style={{ fontSize: '15px', color: '#64748b' }}>
                                                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        disabled={currentPage === 1}
                                                        onClick={() => setCurrentPage(p => p - 1)}
                                                        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                                    >
                                                        Previous
                                                    </button>
                                                    {[...Array(totalPages)].map((_, i) => {
                                                        const page = i + 1;
                                                        // Only show first, last, and pages around current
                                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                            return (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => setCurrentPage(page)}
                                                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            );
                                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                            return <span key={page} style={{ padding: '8px', color: '#94a3b8' }}>...</span>;
                                                        }
                                                        return null;
                                                    })}
                                                    <button
                                                        disabled={currentPage === totalPages}
                                                        onClick={() => setCurrentPage(p => p + 1)}
                                                        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            {activeTab === 'analytics' && (
                                <div style={{ ...cardStyle, padding: isMobile ? '40px 20px' : '60px', textAlign: 'center', color: '#64748b' }}>
                                    <FiBarChart2 size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <h3>Compensation Analytics</h3>
                                    <p>Visualize salary distributions and trends across your organization.</p>
                                </div>
                            )}

                            {activeTab === 'approvals' && (
                                <div style={{ ...cardStyle }}>
                                    <div style={{
                                        padding: isMobile ? '16px' : '20px',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: isMobile ? 'stretch' : 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', alignItems: isMobile ? 'stretch' : 'center', width: isMobile ? '100%' : 'auto', flexWrap: 'wrap', flex: 1 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: isMobile ? 'none' : 1, minWidth: isMobile ? '100%' : '200px' }}>
                                                <span style={labelStyle}>Revision Filter</span>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={approvalRevisionTypeFilter}
                                                        onChange={(e) => {
                                                            setApprovalRevisionTypeFilter(e.target.value);
                                                            setSelectedApprovalRecords([]);
                                                        }}
                                                        style={{
                                                            ...inputStyle,
                                                            paddingLeft: '36px',
                                                            appearance: 'none',
                                                            backgroundColor: '#ffffff'
                                                        }}
                                                    >
                                                        <option value="">All Types</option>
                                                        {revisionTypes.map((rt) => (
                                                            <option key={rt.id} value={rt.typeName}>{rt.typeName}</option>
                                                        ))}
                                                        {!revisionTypes.length && (
                                                            <>
                                                                <option value="Promotion">Promotion</option>
                                                                <option value="Hike">Hike</option>
                                                                <option value="Hike & Promotion">Hike & Promotion</option>
                                                            </>
                                                        )}
                                                    </select>
                                                    <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: isMobile ? 'none' : 1.5, minWidth: isMobile ? '100%' : '250px' }}>
                                                <span style={labelStyle}>Search History</span>
                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <input
                                                        ref={searchRefs.approvals}
                                                        type="text"
                                                        style={{
                                                            ...inputStyle,
                                                            paddingLeft: '36px',
                                                            backgroundColor: '#ffffff'
                                                        }}
                                                        placeholder="Search by ID, Name..."
                                                        value={approvalSearchTerm}
                                                        onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'approvals')}
                                                        onFocus={() => handleInputFocus('approvals')}
                                                        onKeyDown={handleKeyDown}
                                                    />
                                                    <EmployeeSuggestion
                                                        suggestions={employeeSuggestions}
                                                        showSuggestions={showEmployeeSuggestions && activeSearchField === 'approvals'}
                                                        suggestionsLoading={suggestionsLoading}
                                                        onSelect={handleSuggestionClick}
                                                        activeField="approvals"
                                                        inputRef={suggestionsRef}
                                                        selectedSuggestionIndex={selectedSuggestionIndex}
                                                        setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                                                    />
                                                </div>
                                            </div>
                                            {selectedApprovalRecords.length > 0 && (
                                                <button
                                                    onClick={handleBulkFinalize}
                                                    style={{
                                                        padding: '12px 20px',
                                                        backgroundColor: '#0d9488',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '15px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
                                                        whiteSpace: 'nowrap',
                                                        alignSelf: isMobile ? 'stretch' : 'flex-end',
                                                        marginBottom: isMobile ? '0' : '2px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Finalize {selectedApprovalRecords.length} Selected
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        {employees.filter(e => e.approvalStatus).length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                <FiCheckSquare size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                                <p>No revision history found.</p>
                                            </div>
                                        ) : (
                                            <div style={{ overflowX: 'scroll', overflowY: 'auto', maxHeight: '500px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                                {!isMobile ? (
                                                    <table style={{ ...tableStyle, tableLayout: 'fixed', minWidth: '1500px', width: '100%', fontSize: '13px' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#000000', textAlign: 'left' }}>
                                                                <th style={{ ...thStyle, width: '4%' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        onChange={handleSelectAllApprovals}
                                                                        checked={selectedApprovalRecords.length > 0 && selectedApprovalRecords.length === filteredApprovals.length}
                                                                        disabled={!approvalRevisionTypeFilter}
                                                                        title={!approvalRevisionTypeFilter ? "Please select a Revision Filter to enable bulk selection" : "Select All"}
                                                                    />
                                                                </th>
                                                                <th style={{ ...thStyle, width: '9%' }}>ID</th>
                                                                <th style={{ ...thStyle, width: '14%' }}>Name</th>
                                                                <th style={{ ...thStyle, width: '12%' }}>Designation</th>
                                                                <th style={{ ...thStyle, width: '12%' }}>Department</th>
                                                                <th style={{ ...thStyle, width: '10%' }}>Current</th>
                                                                <th style={{ ...thStyle, width: '10%' }}>Proposed</th>
                                                                <th style={{ ...thStyle, width: '7%' }}>Hike %</th>
                                                                <th style={{ ...thStyle, width: '8%' }}>Type</th>
                                                                <th style={{ ...thStyle, width: '8%' }}>Date</th>
                                                                <th style={{ ...thStyle, width: '6%' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currentApprovals.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="11" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No history found</td>
                                                                </tr>
                                                            ) : (
                                                                currentApprovals.map((record, index) => (
                                                                    <tr
                                                                        key={record.id || index}
                                                                        style={{
                                                                            borderBottom: '1px solid #f1f5f9',
                                                                            cursor: 'default', // Changed cursor to default as row click action might conflict
                                                                            transition: 'background-color 0.2s',
                                                                            backgroundColor: selectedApprovalRecords.includes(record.id) ? '#f0fdfa' : 'transparent'
                                                                        }}
                                                                        onMouseEnter={(e) => { if (!selectedApprovalRecords.includes(record.id)) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                                                        onMouseLeave={(e) => { if (!selectedApprovalRecords.includes(record.id)) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                                    >
                                                                        <td style={{ padding: '12px' }}>
                                                                            {(record.approvalStatus === 'PENDING_FINALIZATION' || record.approvalStatus === 'PENDING_MANAGER') && (
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedApprovalRecords.includes(record.id)}
                                                                                    onChange={() => toggleApprovalSelection(record.id)}
                                                                                />
                                                                            )}
                                                                        </td>
                                                                        <td style={{ padding: '12px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            <div
                                                                                style={{
                                                                                    fontSize: '15px',
                                                                                    color: '#0d9488',
                                                                                    fontWeight: '600',
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis'
                                                                                }}
                                                                            >
                                                                                {getDisplayEmployeeId(record.employeeId)}
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '12px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            <div style={{ fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.employeeName}</div>
                                                                        </td>
                                                                        <td style={{ padding: '12px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            <div style={{ fontWeight: '700', color: '#0d9488', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.proposedDesignation || record.designation || 'N/A'}</div>
                                                                        </td>
                                                                        <td style={{ padding: '12px 8px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.department}</td>
                                                                        <td style={{ padding: '12px 8px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>₹{record.currentFixedCtc?.toLocaleString() || '0'}</td>
                                                                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>₹{record.proposedFixedCtc?.toLocaleString() || '0'}</td>
                                                                        <td style={{ padding: '12px 8px' }}>
                                                                            <span style={{
                                                                                backgroundColor: '#f0fdf4',
                                                                                color: '#16a34a',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '8px',
                                                                                fontWeight: '700',
                                                                                fontSize: '15px'
                                                                            }}>
                                                                                {record.hikePercentage}%
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '12px' }}>
                                                                            <span style={{
                                                                                backgroundColor: '#f1f5f9',
                                                                                color: '#475569',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '8px',
                                                                                fontWeight: '600',
                                                                                fontSize: '15px'
                                                                            }}>
                                                                                {record.revisionType || '-'}
                                                                            </span>
                                                                        </td>

                                                                        <td style={{ padding: '12px', color: '#64748b', fontSize: '15px' }}>
                                                                            {record.effectiveDate ? new Date(record.effectiveDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}
                                                                        </td>
                                                                        <td style={{ padding: '12px' }}>
                                                                            {record.approvalStatus === 'PENDING_FINALIZATION' || record.approvalStatus === 'PENDING_MANAGER' ? (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleFinalize(record);
                                                                                    }}
                                                                                    style={{
                                                                                        backgroundColor: '#14B8A6',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '8px',
                                                                                        padding: '6px 12px',
                                                                                        cursor: 'pointer',
                                                                                        fontSize: '15px',
                                                                                        fontWeight: '600'
                                                                                    }}
                                                                                >
                                                                                    Finalize
                                                                                </button>
                                                                            ) : (
                                                                                <span style={{
                                                                                    fontSize: '15px',
                                                                                    fontWeight: '600',
                                                                                    color: record.approvalStatus === 'APPROVED' ? '#16a34a' : '#64748b',
                                                                                    backgroundColor: record.approvalStatus === 'APPROVED' ? '#f0fdf4' : '#f1f5f9',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '8px'
                                                                                }}>
                                                                                    {record.approvalStatus === 'APPROVED' ? 'Finalized' : record.approvalStatus}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                )))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {currentApprovals.length === 0 ? (
                                                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No history found</div>
                                                        ) : (
                                                            currentApprovals.map((record, index) => (
                                                                <div
                                                                    key={record.id || index}
                                                                    style={{
                                                                        border: '1px solid #e2e8f0',
                                                                        borderRadius: '8px',
                                                                        padding: '16px',
                                                                        backgroundColor: selectedApprovalRecords.includes(record.id) ? '#f0fdfa' : 'white',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '12px',
                                                                        transition: 'all 0.2s',
                                                                        borderLeft: selectedApprovalRecords.includes(record.id) ? '4px solid #0d9488' : '1px solid #e2e8f0'
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                            {(record.approvalStatus === 'PENDING_FINALIZATION' || record.approvalStatus === 'PENDING_MANAGER') && (
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedApprovalRecords.includes(record.id)}
                                                                                    onChange={() => toggleApprovalSelection(record.id)}
                                                                                    style={{ width: '18px', height: '18px' }}
                                                                                />
                                                                            )}
                                                                            <div>
                                                                                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{record.employeeName}</div>
                                                                                <div
                                                                                    style={{ fontSize: '15px', color: '#0d9488', fontWeight: '600' }}
                                                                                >
                                                                                    {getDisplayEmployeeId(record.employeeId)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <span style={{
                                                                            fontSize: '15px',
                                                                            fontWeight: '600',
                                                                            color: record.approvalStatus === 'APPROVED' ? '#16a34a' : '#64748b',
                                                                            backgroundColor: record.approvalStatus === 'APPROVED' ? '#f0fdf4' : '#f1f5f9',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '8px'
                                                                        }}>
                                                                            {record.approvalStatus === 'APPROVED' ? 'Finalized' : record.approvalStatus}
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '15px' }}>
                                                                        <div>
                                                                            <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Revision Type</div>
                                                                            <div style={{ fontWeight: '600' }}>{record.revisionType || '-'}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Department</div>
                                                                            <div style={{ fontWeight: '500' }}>{record.department}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Proposed Fixed</div>
                                                                            <div style={{ fontWeight: '700', color: '#0f172a' }}>₹{record.proposedFixedCtc?.toLocaleString() || '0'}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Effective Date</div>
                                                                            <div style={{ fontWeight: '500' }}>{record.effectiveDate ? new Date(record.effectiveDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</div>
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                                                        <div style={{ fontSize: '15px', color: '#64748b' }}>
                                                                            Hike: <span style={{ color: '#16a34a', fontWeight: '700' }}>{record.hikePercentage}%</span>
                                                                        </div>
                                                                        {(record.approvalStatus === 'PENDING_FINALIZATION' || record.approvalStatus === 'PENDING_MANAGER') && (
                                                                            <button
                                                                                onClick={() => handleFinalize(record)}
                                                                                style={{
                                                                                    backgroundColor: '#14B8A6',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '8px',
                                                                                    padding: '8px 16px',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '15px',
                                                                                    fontWeight: '700'
                                                                                }}
                                                                            >
                                                                                Finalize Now
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {totalPagesApprovals > 1 && (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: isMobile ? 'column' : 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: isMobile ? '16px' : '16px 24px',
                                            borderTop: '1px solid #f1f5f9',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '8px',
                                            gap: isMobile ? '12px' : '0'
                                        }}>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>
                                                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredApprovals.length)} of {filteredApprovals.length}
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', overflowX: isMobile ? 'auto' : 'visible', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end', paddingBottom: isMobile ? '4px' : '0' }}>
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => p - 1)}
                                                    className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                                >
                                                    Previous
                                                </button>
                                                {[...Array(totalPagesApprovals)].map((_, i) => {
                                                    const page = i + 1;
                                                    if (page === 1 || page === totalPagesApprovals || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                        return <span key={page} style={{ padding: '8px', color: '#94a3b8' }}>...</span>;
                                                    }
                                                    return null;
                                                })}
                                                <button
                                                    disabled={currentPage === totalPagesApprovals}
                                                    onClick={() => setCurrentPage(p => p + 1)}
                                                    className={`pagination-btn ${currentPage === totalPagesApprovals ? 'disabled' : ''}`}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'bulkHike' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
                                    <div style={{
                                        ...cardStyle,
                                        padding: isMobile ? '16px' : '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: isMobile ? '16px' : '24px',
                                        backgroundColor: '#f0fdfa',
                                        border: '1px solid #ccfbf1'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', alignItems: 'flex-start' }}>
                                            {/* Categorical filters column */}
                                            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                                <label style={labelStyle}>Categorical Filters</label>
                                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                                                    <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : '180px' }}>
                                                        <FiFilter style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0d9488', zIndex: 1 }} />
                                                        <select
                                                            style={{
                                                                ...inputStyle,
                                                                paddingLeft: '40px',
                                                                cursor: 'pointer',
                                                                appearance: 'none',
                                                                backgroundColor: '#ffffff'
                                                            }}
                                                            value={bulkRevisionData.categoryType}
                                                            onChange={(e) => handleCategorySelect(e.target.value, '')}
                                                        >
                                                            <option value="">Choose Filter Type...</option>
                                                            <option value="department">By Department</option>
                                                            <option value="designation">By Designation</option>
                                                            <option value="location">By Location</option>
                                                            <option value="salary">By Salary Range</option>
                                                            <option value="custom">By Custom Field</option>
                                                        </select>
                                                        <FiChevronDown style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                                    </div>

                                                    {bulkRevisionData.categoryType && !['salary', 'custom'].includes(bulkRevisionData.categoryType) && (
                                                        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : '180px' }}>
                                                            <FiList style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0d9488', zIndex: 1 }} />
                                                            <select
                                                                style={{
                                                                    ...inputStyle,
                                                                    paddingLeft: '40px',
                                                                    cursor: 'pointer',
                                                                    appearance: 'none',
                                                                    backgroundColor: '#ffffff'
                                                                }}
                                                                value={bulkRevisionData.categoryValue}
                                                                onChange={(e) => handleCategorySelect(bulkRevisionData.categoryType, e.target.value)}
                                                            >
                                                                <option value="">Select Value...</option>
                                                                {(bulkRevisionData.categoryType === 'department' ? uniqueDepartments : (bulkRevisionData.categoryType === 'designation' ? uniqueDesignations : uniqueLocations)).map(val => (
                                                                    <option key={val} value={val}>{val}</option>
                                                                ))}
                                                            </select>
                                                            <FiChevronDown style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {bulkRevisionData.categoryType === 'custom' && (
                                                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', width: '100%' }}>
                                                        <div style={{ position: 'relative', flex: 1 }}>
                                                            <FiFilter style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0d9488', zIndex: 1 }} />
                                                            <select
                                                                style={{ ...inputStyle, paddingLeft: '40px', appearance: 'none' }}
                                                                value={bulkRevisionData.customField}
                                                                onChange={(e) => handleCustomFilterChange('customField', e.target.value)}
                                                            >
                                                                <option value="">Select Attribute...</option>
                                                                {customFields.map(f => (
                                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                                ))}
                                                            </select>
                                                            <FiChevronDown style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                                        </div>
                                                        {bulkRevisionData.customField && (
                                                            <div style={{ position: 'relative', flex: 1 }}>
                                                                <FiList style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0d9488', zIndex: 1 }} />
                                                                <select
                                                                    style={{ ...inputStyle, paddingLeft: '40px', appearance: 'none' }}
                                                                    value={bulkRevisionData.customValue}
                                                                    onChange={(e) => handleCustomFilterChange('customValue', e.target.value)}
                                                                >
                                                                    <option value="">Select Value...</option>
                                                                    {getUniqueCustomValues(bulkRevisionData.customField).map(val => (
                                                                        <option key={val} value={val}>{val}</option>
                                                                    ))}
                                                                </select>
                                                                <FiChevronDown style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {bulkRevisionData.categoryType === 'salary' && (
                                                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', width: '100%' }}>
                                                        <select
                                                            style={{ ...inputStyle, flex: 1 }}
                                                            value={bulkRevisionData.salaryOperator}
                                                            onChange={(e) => handleSalaryFilterChange('salaryOperator', e.target.value)}
                                                        >
                                                            <option value="">Operator...</option>
                                                            <option value="lt">Less Than</option>
                                                            <option value="lte">Less Than or Equal</option>
                                                            <option value="gt">Greater Than</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            placeholder="Threshold amount..."
                                                            style={{ ...inputStyle, flex: 1 }}
                                                            value={bulkRevisionData.salaryThreshold}
                                                            onChange={(e) => handleSalaryFilterChange('salaryThreshold', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Select IDs column */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={labelStyle}>Quick Select by Employee IDs</label>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: '800',
                                                        color: '#ffffff',
                                                        backgroundColor: '#0d9488',
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 2px 4px rgba(13, 148, 136, 0.3)',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {selectedBulkEmployees.length} Selected
                                                    </span>
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <textarea
                                                        ref={searchRefs.quickSelectIds}
                                                        style={{
                                                            ...inputStyle,
                                                            minHeight: '82px',
                                                            maxHeight: '150px',
                                                            fontSize: '15px',
                                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                            backgroundColor: '#ffffff',
                                                            padding: '12px 14px 12px 40px',
                                                            borderRadius: '8px',
                                                            lineHeight: '1.6',
                                                            resize: 'none'
                                                        }}
                                                        placeholder="EMP001&#10;EMP002, EMP003..."
                                                        value={manualIdsStr}
                                                        onChange={handleQuickSelectIdsChange}
                                                        onFocus={() => handleInputFocus('quickSelectIds')}
                                                        onKeyDown={handleKeyDown}
                                                    />
                                                    <EmployeeSuggestion
                                                        suggestions={employeeSuggestions}
                                                        showSuggestions={showEmployeeSuggestions && activeSearchField === 'quickSelectIds'}
                                                        suggestionsLoading={suggestionsLoading}
                                                        onSelect={handleSuggestionClick}
                                                        activeField="quickSelectIds"
                                                        inputRef={suggestionsRef}
                                                        selectedSuggestionIndex={selectedSuggestionIndex}
                                                        setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '15px', color: '#64748b', fontWeight: '500', fontStyle: 'italic', opacity: 0.8 }}>Separate IDs with commas, spaces, or new lines. Valid IDs will be auto-selected.</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>Fixed Hike (%)</label>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                value={bulkRevisionData.fixedHike}
                                                onChange={(e) => setBulkRevisionData({ ...bulkRevisionData, fixedHike: e.target.value })}
                                                placeholder="Enter percentage"
                                                onWheel={(e) => e.target.blur()}
                                                onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>Variable Hike (%)</label>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                value={bulkRevisionData.variableHike}
                                                onChange={(e) => setBulkRevisionData({ ...bulkRevisionData, variableHike: e.target.value })}
                                                placeholder="Enter percentage"
                                                onWheel={(e) => e.target.blur()}
                                                onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>Effective Date</label>
                                            <SmartDatePicker
                                                value={bulkRevisionData.effectiveDate}
                                                onChange={(date) => setBulkRevisionData({ ...bulkRevisionData, effectiveDate: date })}
                                                inputStyle={inputStyle}
                                                placeholder="Select effective date"
                                                minDate={new Date()}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-end', width: isMobile ? '100%' : 'auto' }}>
                                            <button
                                                onClick={handleBulkHikeSubmit}
                                                disabled={selectedBulkEmployees.length === 0}
                                                style={{
                                                    padding: '12px 24px',
                                                    width: isMobile ? '100%' : 'auto',
                                                    backgroundColor: selectedBulkEmployees.length > 0 ? '#0d9488' : '#94a3b8',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: selectedBulkEmployees.length > 0 ? 'pointer' : 'not-allowed',
                                                    fontWeight: '700',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Apply Bulk Hike ({selectedBulkEmployees.length})
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: isMobile ? 'stretch' : 'center',
                                        gap: '16px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
                                            <input
                                                ref={searchRefs.bulkHike}
                                                type="text"
                                                placeholder="Search by ID or Name..."
                                                value={searchTerm}
                                                onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'bulkHike')}
                                                onFocus={() => handleInputFocus('bulkHike')}
                                                onKeyDown={handleKeyDown}
                                                style={{
                                                    ...searchInputStyle,
                                                    width: '100%'
                                                }}
                                            />
                                            <EmployeeSuggestion
                                                suggestions={employeeSuggestions}
                                                showSuggestions={showEmployeeSuggestions && activeSearchField === 'bulkHike'}
                                                suggestionsLoading={suggestionsLoading}
                                                onSelect={handleSuggestionClick}
                                                activeField="bulkHike"
                                                inputRef={suggestionsRef}
                                                selectedSuggestionIndex={selectedSuggestionIndex}
                                                setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>
                                                {selectedBulkEmployees.length} selected
                                            </div>
                                            <button
                                                onClick={handleSelectAllBulk}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#f1f5f9',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    color: '#475569'
                                                }}
                                            >
                                                {selectedBulkEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All Filtered'}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={cardStyle}>
                                        <div style={{ padding: '0px' }}>
                                            {!isMobile ? (
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={tableStyle}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ ...thStyle, width: '40px' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedBulkEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                                                        onChange={handleSelectAllBulk}
                                                                        title="Select/Deselect all filtered employees"
                                                                    />
                                                                </th>
                                                                <th style={{ ...thStyle, width: '120px' }}>Employee ID</th>
                                                                <th style={thStyle}>Employee Name</th>
                                                                <th style={thStyle}>Designation</th>
                                                                <th style={{ ...thStyle, width: '120px' }}>Department</th>
                                                                <th style={thStyle}>Current Fixed</th>
                                                                <th style={thStyle}>Current Variable</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredEmployees.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                                        No results found
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                currentEmployees.map(emp => (
                                                                    <tr
                                                                        key={emp.employeeId}
                                                                        style={{
                                                                            ...rowStyle,
                                                                            backgroundColor: selectedBulkEmployees.includes(emp.employeeId) ? '#f0fdfa' : 'transparent'
                                                                        }}
                                                                        onClick={() => toggleBulkEmployee(emp.employeeId)}
                                                                    >
                                                                        <td style={tdStyle}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedBulkEmployees.includes(emp.employeeId)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onChange={() => toggleBulkEmployee(emp.employeeId)}
                                                                            />
                                                                        </td>
                                                                        <td style={tdStyle}>{getDisplayEmployeeId(emp.employeeId)}</td>
                                                                        <td style={tdStyle}>{emp.employeeName || (emp.firstName + ' ' + emp.lastName)}</td>
                                                                        <td style={tdStyle}>{emp.designation || 'N/A'}</td>
                                                                        <td style={tdStyle}>{emp.department || 'N/A'}</td>
                                                                        <td style={tdStyle}>₹{emp.currentFixedCtc?.toLocaleString() || '0'}</td>
                                                                        <td style={tdStyle}>₹{emp.currentVariablePay?.toLocaleString() || '0'}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {filteredEmployees.length === 0 ? (
                                                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No results found</div>
                                                    ) : (
                                                        currentEmployees.map(emp => (
                                                            <div
                                                                key={emp.employeeId}
                                                                style={{
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: '8px',
                                                                    padding: '16px',
                                                                    backgroundColor: selectedBulkEmployees.includes(emp.employeeId) ? '#f0fdfa' : 'white',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '12px',
                                                                    boxShadow: selectedBulkEmployees.includes(emp.employeeId) ? '0 2px 4px rgba(13, 148, 136, 0.1)' : 'none',
                                                                    borderLeft: selectedBulkEmployees.includes(emp.employeeId) ? '4px solid #0d9488' : '1px solid #e2e8f0'
                                                                }}
                                                                onClick={() => toggleBulkEmployee(emp.employeeId)}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedBulkEmployees.includes(emp.employeeId)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onChange={() => toggleBulkEmployee(emp.employeeId)}
                                                                            style={{ width: '18px', height: '18px' }}
                                                                        />
                                                                        <div>
                                                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{emp.employeeName || (emp.firstName + ' ' + emp.lastName)}</div>
                                                                            <div style={{ fontSize: '15px', color: '#0d9488', fontWeight: '600' }}>{getDisplayEmployeeId(emp.employeeId)}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '15px' }}>
                                                                    <div>
                                                                        <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Designation</div>
                                                                        <div style={{ fontWeight: '500', color: '#334155' }}>{emp.designation || 'N/A'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Department</div>
                                                                        <div style={{ fontWeight: '500', color: '#334155' }}>{emp.department || 'N/A'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Current Fixed</div>
                                                                        <div style={{ fontWeight: '700', color: '#0d9488' }}>₹{emp.currentFixedCtc?.toLocaleString() || '0'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: '#64748b', fontSize: '15px', textTransform: 'capitalize', marginBottom: '2px' }}>Current Variable</div>
                                                                        <div style={{ fontWeight: '700', color: '#0d9488' }}>₹{emp.currentVariablePay?.toLocaleString() || '0'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {totalPages > 1 && (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: isMobile ? 'column' : 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: isMobile ? '16px' : '16px 24px',
                                                borderTop: '1px solid #f1f5f9',
                                                backgroundColor: '#f8fafc',
                                                borderRadius: '8px',
                                                gap: isMobile ? '12px' : '0'
                                            }}>
                                                <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>
                                                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', overflowX: isMobile ? 'auto' : 'visible', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end', paddingBottom: isMobile ? '4px' : '0' }}>
                                                    <button
                                                        disabled={currentPage === 1}
                                                        onClick={() => setCurrentPage(p => p - 1)}
                                                        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                                    >
                                                        Previous
                                                    </button>
                                                    {[...Array(totalPages)].map((_, i) => {
                                                        const page = i + 1;
                                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                            return (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => setCurrentPage(page)}
                                                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            );
                                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                            return <span key={page} style={{ padding: '8px', color: '#94a3b8' }}>...</span>;
                                                        }
                                                        return null;
                                                    })}
                                                    <button
                                                        disabled={currentPage === totalPages}
                                                        onClick={() => setCurrentPage(p => p + 1)}
                                                        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <style>{`
            .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #f1f5f9;
                border-top: 3px solid #0d9488;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .pagination-btn {
                padding: 6px 12px;
                font-size: 13px;
                font-weight: 500;
                color: #475569;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .pagination-btn:hover:not(.disabled) {
                background: #f8fafc;
                border-color: #cbd5e1;
                color: #0f172a;
            }
            .pagination-btn.active {
                background: #0d9488;
                color: white;
                border-color: #0d9488;
            }
            .pagination-btn.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: #f1f5f9;
            }
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            .finalize-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                backdrop-filter: blur(4px);
            }

            .finalize-modal-content {
                background: white;
                width: 90%;
                max-width: 500px;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                overflow: hidden;
                animation: modalSlideUp 0.3s ease-out;
            }

            @keyframes modalSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .finalize-modal-header {
                padding: 16px 24px;
                border-bottom: 1px solid #f1f5f9;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8fafc;
            }

            .finalize-modal-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #0f172a;
            }

            .finalize-modal-header .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                color: #64748b;
                cursor: pointer;
            }

            .finalize-modal-body {
                padding: 24px;
            }

            .info-summary {
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .info-summary p {
                margin: 4px 0;
                font-size: 14px;
                color: #0369a1;
            }

            .form-group {
                margin-bottom: 2px;
            }

            .form-group label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #475569;
                margin-bottom: -1s4px;
            }

            .modal-input {
                width: 100%;
                padding: 5px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }

            .modal-input:focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .modal-note {
                font-size: 12px;
                color: #64748b;
                margin-top: 20px;
                font-style: italic;
            }

            .finalize-modal-footer {
                padding: 16px 24px;
                background: #f8fafc;
                border-top: 1px solid #f1f5f9;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }

            .btn-cancel {
                padding: 10px 16px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                color: #64748b;
                cursor: pointer;
            }

            .btn-submit {
                padding: 10px 20px;
                background: #14B8A6;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }

            .btn-submit:hover:not(:disabled) {
                background: #1d4ed8;
            }

            .btn-submit:disabled {
                background: #93c5fd;
                cursor: not-allowed;
            }
        `}</style>
                {
                    isFinalizeModalOpen && (finalizeRecord || selectedApprovalRecords.length > 0) && (
                        <div className="finalize-modal-overlay">
                            <div className="finalize-modal-content">
                                <div className="finalize-modal-header">
                                    <h2>Finalize Compensation</h2>
                                    <button className="close-btn" onClick={() => setIsFinalizeModalOpen(false)}>&times;</button>
                                </div>
                                <div className="finalize-modal-body">
                                    <div className="info-summary">
                                        {finalizeRecord ? (
                                            <>
                                                <p><strong>Employee:</strong> {finalizeRecord.employeeName} ({finalizeRecord.employeeId})</p>
                                                {finalizeRecord.proposedDesignation && finalizeRecord.proposedDesignation !== finalizeRecord.designation && (
                                                    <p><strong>New Designation:</strong> <span style={{ color: '#0d9488', fontWeight: 'bold' }}>{finalizeRecord.proposedDesignation}</span></p>
                                                )}
                                                <p><strong>Revised Salary:</strong> ₹{finalizeRecord.proposedFixedCtc?.toLocaleString()}</p>
                                                <p><strong>Hike:</strong> {finalizeRecord.hikePercentage}%</p>
                                            </>
                                        ) : (
                                            <p><strong>Finalizing {selectedApprovalRecords.length} records in bulk</strong></p>
                                        )}
                                    </div>


                                    <div className="form-group" >
                                        <label style={{ marginBottom: '-20px' }}>Salary Revision</label>
                                        <select
                                            value={finalizeRecord && finalizeRecord.revisionType ? finalizeRecord.revisionType : revisionType}
                                            onChange={(e) => setRevisionType(e.target.value)}
                                            className="modal-input"
                                            disabled={(finalizeRecord && finalizeRecord.revisionType) || (!finalizeRecord && approvalRevisionTypeFilter) ? true : false}
                                            style={{
                                                backgroundColor: (finalizeRecord && finalizeRecord.revisionType) || (!finalizeRecord && approvalRevisionTypeFilter) ? '#f1f5f9' : 'white',
                                                cursor: (finalizeRecord && finalizeRecord.revisionType) || (!finalizeRecord && approvalRevisionTypeFilter) ? 'not-allowed' : 'pointer',
                                                color: (finalizeRecord && finalizeRecord.revisionType) || (!finalizeRecord && approvalRevisionTypeFilter) ? '#000000' : '#1e293b'
                                            }}
                                        >
                                            {revisionTypes.length > 0 ? (
                                                <>
                                                    <option value="" disabled>select type</option>
                                                    {revisionTypes.map(type => (
                                                        <option key={type.id} value={type.typeName}>{type.typeName}</option>
                                                    ))}
                                                </>
                                            ) : (
                                                <option value="" disabled>No salary revision categories configured</option>
                                            )}
                                        </select>
                                        {((finalizeRecord && finalizeRecord.revisionType) || (!finalizeRecord && approvalRevisionTypeFilter)) && (
                                            <small style={{ color: '#02060a', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                                Revision type is locked based on selection and cannot be changed
                                            </small>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label style={{ marginBottom: '-20px', marginTop: '10px' }}>Calculation Template</label>
                                        <select
                                            value={selectedCalcTemplateId}
                                            onChange={(e) => setSelectedCalcTemplateId(e.target.value)}
                                            className="modal-input"
                                        >
                                            <option value="" disabled>Select calculation template</option>
                                            {calcTemplates.map(template => (
                                                <option key={template.id} value={template.id}>{template.name}</option>
                                            ))}
                                        </select>
                                        <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                            Select the salary structure template to calculate component values based on current_fixed_ctc
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ marginBottom: '-20px', marginTop: '10px' }}>Document Template</label>
                                        <select
                                            value={selectedTemplateId}
                                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                                            className="modal-input"
                                        >
                                            <option value="" disabled>Select a template</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.templateName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <p className="modal-note">
                                        * Finalizing will update the employee's current salary in the system, generate a PDF letter, save it to their documents, and send it via email.
                                    </p>
                                </div>
                                <div className="finalize-modal-footer">
                                    <button
                                        className="btn-cancel"
                                        onClick={() => setIsFinalizeModalOpen(false)}
                                        disabled={isFinalizing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-submit"
                                        onClick={handleFinalizeWithDoc}
                                        disabled={isFinalizing || !selectedCalcTemplateId || !selectedTemplateId || !revisionType}
                                    >
                                        {isFinalizing ? 'Processing...' : 'Send to Applicant'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            </>
        </Sidebar >
    );
};

export default CompensationManagement;
