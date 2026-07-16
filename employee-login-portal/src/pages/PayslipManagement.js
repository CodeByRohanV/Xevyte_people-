import React, { useState, useEffect, useRef } from 'react';
import { getPropperDate } from '../utils/DateUtils';
import axios from 'axios';
import api from '../api';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// Employee Suggestion Component
const EmployeeSuggestion = ({
    suggestions,
    showSuggestions,
    suggestionsLoading,
    onSelect,
    activeField,
    inputRef
}) => {
    console.log("EmployeeSuggestion props:", { suggestions, showSuggestions, suggestionsLoading, activeField });

    if (!showSuggestions) return null;

    return (
        <div
            ref={inputRef}
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderTop: 'none',
                borderRadius: '0 0 5px 5px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
            }}
        >
            {suggestionsLoading ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                    Loading...
                </div>
            ) : suggestions.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                    No suggestions found
                </div>
            ) : (
                suggestions.map((employee) => {
                    console.log("Rendering employee:", employee);
                    return (
                        <div
                            key={employee.employeeId}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                fontSize: '13px',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f8f9fa';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                            }}
                            onClick={() => onSelect(employee, activeField)}
                        >
                            {employee.firstName} {employee.lastName} ({employee.employeeId})
                        </div>
                    );
                })
            )}
        </div>
    );
};

const PayslipManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [payslips, setPayslips] = useState([]);
    const [y, m] = getPropperDate().split('-').map(Number);
    const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1];

    const [selectedMonth, setSelectedMonth] = useState(monthName);
    const [selectedYear, setSelectedYear] = useState(y);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('create');
    const [searchEmployeeId, setSearchEmployeeId] = useState(''); // Filter by employee ID
    const [individualSearchId, setIndividualSearchId] = useState(''); // Individual generation search

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [activeSearchField, setActiveSearchField] = useState('');

    // Refs for dropdown management
    const searchRefs = {
        employeeFilter: useRef(null),
        individualGeneration: useRef(null)
    };
    const suggestionsRef = useRef(null);

    // Form state for creating payslips
    const [payslipForm, setPayslipForm] = useState({
        employeeId: '',
        designation: 'EMPLOYEE',
        basicAllowance: 0,
        houseRentAllowance: 0,
        conveyanceAllowance: 0,
        foodAllowance: 0,
        medicalAllowance: 0,
        incomeTax: 0,
        pfDeduction: 0,
        esiDeduction: 0,
        medicalInsurance: 0
    });

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = [2023, 2024, 2025, 2026];

    useEffect(() => {
        fetchEmployees();
        fetchPayslips();
    }, [selectedMonth, selectedYear]);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_BASE}/employees`);
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            alert('Error fetching employees');
        }
    };

    const fetchPayslips = async () => {
        try {
            const response = await axios.get(`${API_BASE}/payslips/month/${selectedMonth}/year/${selectedYear}`);
            setPayslips(response.data);
        } catch (error) {
            console.error('Error fetching payslips:', error);
            setPayslips([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPayslipForm(prev => ({
            ...prev,
            [name]: name.includes('Allowance') || name.includes('Tax') || name.includes('Deduction') || name.includes('Insurance')
                ? parseFloat(value) || 0
                : value
        }));
    };

    const createPayslip = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payslipData = {
                ...payslipForm,
                salaryMonth: selectedMonth,
                salaryYear: selectedYear
            };

            await axios.post(`${API_BASE}/payslips`, payslipData);
            alert('Payslip created successfully!');
            setPayslipForm({
                employeeId: '',
                designation: 'EMPLOYEE',
                basicAllowance: 0,
                houseRentAllowance: 0,
                conveyanceAllowance: 0,
                foodAllowance: 0,
                medicalAllowance: 0,
                incomeTax: 0,
                pfDeduction: 0,
                esiDeduction: 0,
                medicalInsurance: 0
            });
            fetchPayslips();
        } catch (error) {
            console.error('Error creating payslip:', error);
            alert('Error creating payslip');
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async (type, employeeId = null) => {
        setLoading(true);
        try {
            let url = `${API_BASE}/payslips/excel/month/${selectedMonth}/year/${selectedYear}`;
            let filename = `Payslips_${selectedMonth}_${selectedYear}.xlsx`;

            if (type === 'individual' && employeeId) {
                url = `${API_BASE}/payslips/excel/employee/${employeeId}/month/${selectedMonth}/year/${selectedYear}`;
                filename = `Payslip_${employeeId}_${selectedMonth}_${selectedYear}.xlsx`;
            }

            const response = await axios.get(url, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            alert('Excel file downloaded successfully!');
        } catch (error) {
            console.error('Error downloading Excel:', error);
            alert('Error downloading Excel file');
        } finally {
            setLoading(false);
        }
    };

    const deletePayslip = async (payslipId) => {
        if (window.confirm('Are you sure you want to delete this payslip?')) {
            try {
                await axios.delete(`${API_BASE}/payslips/${payslipId}`);
                alert('Payslip deleted successfully!');
                fetchPayslips();
            } catch (error) {
                console.error('Error deleting payslip:', error);
                alert('Error deleting payslip');
            }
        }
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

            console.log("Fetching employee suggestions for query:", query);
            const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("API Response:", response.data);
            setEmployeeSuggestions(response.data);
            setShowEmployeeSuggestions(response.data.length > 0);
        } catch (err) {
            console.error('Error fetching employee suggestions:', err);
            console.error('API Error Details:', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data
            });
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

        // Update the appropriate search term
        if (field === 'employeeFilter') {
            setSearchEmployeeId(value);
        } else if (field === 'individualGeneration') {
            setIndividualSearchId(value);
        }

        if (value.trim().length >= 1) {
            debouncedFetchSuggestions(value);
        } else {
            setEmployeeSuggestions([]);
            setShowEmployeeSuggestions(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (employee, field) => {
        const searchValue = `${employee.firstName} ${employee.lastName} (${employee.employeeId})`;

        if (field === 'employeeFilter') {
            setSearchEmployeeId(searchValue);
        } else if (field === 'individualGeneration') {
            setIndividualSearchId(searchValue);
            // Also trigger the download for this employee
            downloadExcel('individual', employee.employeeId);
        }

        setShowEmployeeSuggestions(false);
        setEmployeeSuggestions([]);
    };

    // Handle input focus
    const handleInputFocus = (field) => {
        setActiveSearchField(field);
        const currentSearchTerm = field === 'employeeFilter' ? searchEmployeeId : (field === 'individualGeneration' ? individualSearchId : '');
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

    const styles = {
        container: {
            maxWidth: '1200px',
            margin: '20px auto',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        },
        header: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '30px',
            borderRadius: '10px',
            marginBottom: '30px',
            textAlign: 'center'
        },
        tabContainer: {
            display: 'flex',
            marginBottom: '20px',
            borderBottom: '2px solid #e0e0e0'
        },
        tab: {
            padding: '15px 30px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            fontWeight: '500',
            borderBottom: '3px solid transparent',
            transition: 'all 0.3s ease'
        },
        activeTab: {
            borderBottom: '3px solid #667eea',
            color: '#667eea',
            fontWeight: '600'
        },
        monthYearSelector: {
            display: 'flex',
            gap: '20px',
            marginBottom: '30px',
            alignItems: 'center'
        },
        select: {
            padding: '10px 15px',
            borderRadius: '5px',
            border: '2px solid #e0e0e0',
            fontSize: '16px',
            minWidth: '150px'
        },
        form: {
            background: '#f9f9f9',
            padding: '30px',
            borderRadius: '10px',
            marginBottom: '30px'
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column'
        },
        label: {
            marginBottom: '5px',
            fontWeight: '600',
            color: '#333'
        },
        input: {
            padding: '12px',
            borderRadius: '5px',
            border: '2px solid #e0e0e0',
            fontSize: '16px',
            transition: 'border-color 0.3s ease'
        },
        button: {
            padding: '12px 30px',
            borderRadius: '5px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        primaryButton: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
        },
        secondaryButton: {
            background: '#28a745',
            color: 'white'
        },
        dangerButton: {
            background: '#dc3545',
            color: 'white'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        },
        th: {
            background: '#667eea',
            color: 'white',
            padding: '15px',
            textAlign: 'left',
            fontWeight: '600'
        },
        td: {
            padding: '15px',
            borderBottom: '1px solid #e0e0e0'
        },
        message: {
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            background: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        actionButtons: {
            display: 'flex',
            gap: '10px'
        },
        downloadSection: {
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>💰 Payslip Management System</h1>
                <p>Generate and manage employee payslips with Excel export functionality</p>
            </div>

            {message && (
                <div style={styles.message}>
                    {message}
                </div>
            )}

            <div style={styles.monthYearSelector}>
                <label style={styles.label}>Select Month & Year:</label>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={styles.select}
                >
                    {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={styles.select}
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            <div style={styles.tabContainer}>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'create' ? styles.activeTab : {})
                    }}
                    onClick={() => setActiveTab('create')}
                >
                    Create Payslip
                </button>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'view' ? styles.activeTab : {})
                    }}
                    onClick={() => setActiveTab('view')}
                >
                    View Payslips
                </button>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'download' ? styles.activeTab : {})
                    }}
                    onClick={() => setActiveTab('download')}
                >
                    Download Excel
                </button>
            </div>

            {activeTab === 'create' && (
                <div style={styles.form}>
                    <h3>Create New Payslip for {selectedMonth} {selectedYear}</h3>
                    <form onSubmit={createPayslip}>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Employee</label>
                                <select
                                    name="employeeId"
                                    value={payslipForm.employeeId}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.employeeId} value={emp.employeeId}>
                                            {emp.employeeId} - {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Designation</label>
                                <input
                                    type="text"
                                    name="designation"
                                    value={payslipForm.designation}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    placeholder="Employee designation"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Basic Allowance (₹)</label>
                                <input
                                    type="number"
                                    name="basicAllowance"
                                    value={payslipForm.basicAllowance}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>House Rent Allowance (₹)</label>
                                <input
                                    type="number"
                                    name="houseRentAllowance"
                                    value={payslipForm.houseRentAllowance}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Conveyance Allowance (₹)</label>
                                <input
                                    type="number"
                                    name="conveyanceAllowance"
                                    value={payslipForm.conveyanceAllowance}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Food Allowance (₹)</label>
                                <input
                                    type="number"
                                    name="foodAllowance"
                                    value={payslipForm.foodAllowance}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Medical Allowance (₹)</label>
                                <input
                                    type="number"
                                    name="medicalAllowance"
                                    value={payslipForm.medicalAllowance}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Income Tax (₹)</label>
                                <input
                                    type="number"
                                    name="incomeTax"
                                    value={payslipForm.incomeTax}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>PF Deduction (₹)</label>
                                <input
                                    type="number"
                                    name="pfDeduction"
                                    value={payslipForm.pfDeduction}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>ESI Deduction (₹)</label>
                                <input
                                    type="number"
                                    name="esiDeduction"
                                    value={payslipForm.esiDeduction}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Medical Insurance (₹)</label>
                                <input
                                    type="number"
                                    name="medicalInsurance"
                                    value={payslipForm.medicalInsurance}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{ ...styles.button, ...styles.primaryButton }}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Payslip'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'view' && (
                <div>
                    <h3>Payslips for {selectedMonth} {selectedYear}</h3>

                    {/* Employee Search Filter */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={styles.label}>Filter by Employee ID or Name:</label>
                        <div style={{ position: 'relative', maxWidth: '400px', marginTop: '8px' }}>
                            <input
                                ref={searchRefs.employeeFilter}
                                type="text"
                                value={searchEmployeeId}
                                onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'employeeFilter')}
                                onFocus={() => handleInputFocus('employeeFilter')}
                                placeholder="Enter Employee ID or Name to search..."
                                style={{
                                    ...styles.input,
                                    width: '100%'
                                }}
                            />
                            <EmployeeSuggestion
                                suggestions={employeeSuggestions}
                                showSuggestions={showEmployeeSuggestions && activeSearchField === 'employeeFilter'}
                                suggestionsLoading={suggestionsLoading}
                                onSelect={handleSuggestionClick}
                                activeField="employeeFilter"
                                inputRef={suggestionsRef}
                            />
                        </div>
                    </div>

                    {payslips.length > 0 ? (
                        <>
                            {/* Filtered Payslips */}
                            {(() => {
                                const filteredPayslips = payslips.filter(payslip => {
                                    if (!searchEmployeeId.trim()) return true;
                                    const searchLower = searchEmployeeId.toLowerCase();
                                    return (
                                        payslip.employeeId?.toLowerCase().includes(searchLower) ||
                                        payslip.employeeName?.toLowerCase().includes(searchLower)
                                    );
                                });

                                if (filteredPayslips.length === 0) {
                                    return (
                                        <p>No payslips found matching "{searchEmployeeId}"</p>
                                    );
                                }

                                return (
                                    <>
                                        <p style={{ marginBottom: '10px', color: '#666' }}>
                                            Showing {filteredPayslips.length} of {payslips.length} payslips
                                        </p>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={styles.th}>Employee ID</th>
                                                    <th style={styles.th}>Employee Name</th>
                                                    <th style={styles.th}>Present Days</th>
                                                    <th style={styles.th}>Total Earnings</th>
                                                    <th style={styles.th}>Total Deductions</th>
                                                    <th style={styles.th}>Net Pay</th>
                                                    <th style={styles.th}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPayslips.map(payslip => (
                                                    <tr key={payslip.id}>
                                                        <td style={styles.td}>{payslip.employeeId}</td>
                                                        <td style={styles.td}>{payslip.employeeName}</td>
                                                        <td style={styles.td}>{payslip.presentDays}/{payslip.payDays}</td>
                                                        <td style={styles.td}>₹{payslip.totalEarnings?.toLocaleString()}</td>
                                                        <td style={styles.td}>₹{payslip.totalDeductions?.toLocaleString()}</td>
                                                        <td style={styles.td}>₹{payslip.netPay?.toLocaleString()}</td>
                                                        <td style={styles.td}>
                                                            <div style={styles.actionButtons}>
                                                                <button
                                                                    style={{ ...styles.button, ...styles.secondaryButton }}
                                                                    onClick={() => downloadExcel('individual', payslip.employeeId)}
                                                                >
                                                                    Download
                                                                </button>
                                                                <button
                                                                    style={{ ...styles.button, ...styles.dangerButton }}
                                                                    onClick={() => deletePayslip(payslip.id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                );
                            })()}
                        </>
                    ) : (
                        <p>No payslips found for {selectedMonth} {selectedYear}</p>
                    )}
                </div>
            )}

            {activeTab === 'download' && (
                <div style={styles.downloadSection}>
                    <h3>Download Excel Reports</h3>
                    <p>Generate and download Excel files for payslips</p>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        <button
                            style={{ ...styles.button, ...styles.secondaryButton }}
                            onClick={() => downloadExcel('all')}
                            disabled={loading}
                        >
                            {loading ? 'Generating...' : `Download All Payslips - ${selectedMonth} ${selectedYear}`}
                        </button>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <h4>Individual Payslip Downloads</h4>
                        <p>Search for an employee to download their individual payslip:</p>
                        <div style={{ position: 'relative', maxWidth: '400px', marginTop: '15px' }}>
                            <input
                                ref={searchRefs.individualGeneration}
                                type="text"
                                value={individualSearchId}
                                onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'individualGeneration')}
                                onFocus={() => handleInputFocus('individualGeneration')}
                                placeholder="Search employee by ID or name..."
                                style={{
                                    ...styles.input,
                                    width: '100%'
                                }}
                            />
                            <EmployeeSuggestion
                                suggestions={employeeSuggestions}
                                showSuggestions={showEmployeeSuggestions && activeSearchField === 'individualGeneration'}
                                suggestionsLoading={suggestionsLoading}
                                onSelect={handleSuggestionClick}
                                activeField="individualGeneration"
                                inputRef={suggestionsRef}
                            />
                        </div>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                            Start typing an employee name or ID, then click on a suggestion to download their payslip.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayslipManagement;
