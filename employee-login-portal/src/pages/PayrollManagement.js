import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import Sidebar from './Sidebar.js';
import { FiDollarSign, FiPlusCircle, FiFileText, FiUploadCloud, FiUsers, FiAlertCircle } from 'react-icons/fi';
import BulkUploadTab from './payroll/BulkUploadTab';
import GeneratePayslipsTab from './payroll/GeneratePayslipsTab';
import EmployeeDetailsTab from './payroll/EmployeeDetailsTab';
import ITDeclarationTab from './payroll/ITDeclarationTab';
import './PayrollManagement.css';

const PayrollManagement = () => {
    const [activeTab, setActiveTab] = useState('bulkUpload');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloadData, setDownloadData] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const scrollRef = useRef(null);

    const scrollTabs = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - 150 : scrollLeft + 150;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // FIXED ENDPOINT
            const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");
            const response = await api.get('/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEmployees(response.data);
                    } catch (err) {
            alert('Failed to fetch employees: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'bulkUpload', label: 'Bulk Upload', icon: <FiUploadCloud /> },
        { id: 'generatePayslips', label: 'Generate Pay Slips', icon: <FiPlusCircle /> },
        { id: 'employeeDetails', label: 'Employee Details', icon: <FiUsers /> }
    ];

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'bulkUpload':
                return (
                    <div className="payroll-card">
                        <BulkUploadTab
                            onEmployeesUpdate={fetchEmployees}
                            onTemplateData={setDownloadData}
                        />
                    </div>
                );

            case 'generatePayslips':
                return (
                    <div className="payroll-card">
                        <GeneratePayslipsTab
                            employees={employees}
                            onRefresh={fetchEmployees}
                            downloadData={downloadData}
                        />
                    </div>
                );

            case 'employeeDetails':
                return (
                    <div className="payroll-card">
                        <EmployeeDetailsTab employees={employees} />
                    </div>
                );

            case 'itDeclaration':
                return (
                    <div className="payroll-card">
                        <ITDeclarationTab />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Sidebar>
            <div className="payroll-wrapper">
                <div className="payroll-content-wrapper">
                    {/* ✅ HEADER */}
                    <div className="payroll-page-header">
                        <div className="payroll-header-icon">
                            <FiDollarSign />
                        </div>
                        <h1 className="payroll-header-title">
                            {isMobileView ? "Salary" : "Salary Management"}
                        </h1>
                    </div>

                    {error && (
                        <div className="message-banner" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            <FiAlertCircle /> {error}
                        </div>
                    )}

                    {/* ✅ TABS */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1.25rem' }}>
                        {isMobileView && (
                            <button
                                onClick={() => scrollTabs('left')}
                                style={{
                                    position: 'absolute',
                                    left: '0',
                                    zIndex: 10,
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '1px solid #2dd4bf',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#14b8a6',
                                    padding: 0
                                }}
                            >
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                                </svg>
                            </button>
                        )}

                        <div className="payroll-tabs-container" ref={scrollRef} style={{
                            paddingLeft: isMobileView ? '45px' : '0.4rem',
                            paddingRight: isMobileView ? '45px' : '0.4rem',
                            width: '100%',
                            maxWidth: '100%',
                            display: isMobileView ? 'inline-flex' : 'flex',
                            flexDirection: 'row',
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            scrollBehavior: 'smooth',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: '12px',
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch',
                            marginBottom: 0
                        }}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`payroll-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                    style={{
                                        flexShrink: 0,
                                        flexGrow: 0,
                                        flexBasis: 'auto',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        whiteSpace: 'nowrap',
                                        width: 'auto',
                                        minWidth: 'max-content',
                                        maxWidth: 'none'
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {isMobileView && (
                            <button
                                onClick={() => scrollTabs('right')}
                                style={{
                                    position: 'absolute',
                                    right: '0',
                                    zIndex: 10,
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '1px solid #2dd4bf',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#14b8a6',
                                    padding: 0
                                }}
                            >
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* ✅ CONTENT AREA */}
                    <div className="scrollbar-hidden" style={{ flex: 1 }}>
                        {loading && activeTab === 'generatePayslips' ? (
                            <div className="payroll-card" style={{ textAlign: 'center', padding: isMobileView ? '2rem 1rem' : '3rem' }}>
                                <div style={{
                                    display: 'inline-block',
                                    width: isMobileView ? '30px' : '40px',
                                    height: isMobileView ? '30px' : '40px',
                                    border: '4px solid #f1f5f9',
                                    borderTop: '4px solid #2dd4bf',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <p style={{ marginTop: '1.5rem', color: '#64748b', fontWeight: '600', fontSize: isMobileView ? '14px' : '16px' }}>
                                    Loading payroll data...
                                </p>
                            </div>
                        ) : (
                            renderActiveTab()
                        )}
                    </div>
                </div>
            </div >

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </Sidebar >
    );
};

export default PayrollManagement;
