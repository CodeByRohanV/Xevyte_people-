import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.js';
import { FiBookOpen, FiCheckCircle, FiUsers, FiFilter, FiCalendar, FiClock, FiCheckSquare, FiXSquare } from 'react-icons/fi';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api";

// SmartDatePicker component with proper month/year scrolling
const SmartDatePicker = ({ value, onChange, placeholder = "DD-MM-YYYY" }) => {
    const [open, setOpen] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={(date) => { 
                onChange(date); 
                setTimeout(() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }, 20); 
            }}
            onSelect={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            open={open} 
            onInputClick={() => setOpen(true)}
            onClickOutside={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            placeholderText={placeholder} 
            dateFormat="dd-MM-yyyy"
            calendarClassName="no-gap-calendar" 
            dayClassName={() => "no-gap-day"} 
            wrapperClassName="full-width-picker"
            renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => (
                <div className="custom-calendar-header">
                    <div className="calendar-header-banner">
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>&#8249;</button>
                        <div className="header-main-content">
                            <div className="header-text-group">
                                <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                                <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                            </div>
                        </div>
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>&#8250;</button>
                    </div>
                    {showMonthDropdown && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{MONTHS.map((m, idx) => (<div key={m} className={"dropdown-item" + (idx === date.getMonth() ? " active" : "")} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>))}</div></div>)}
                    {showYearDropdown && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map(y => (<div key={y} className={"dropdown-item" + (y === date.getFullYear() ? " active" : "")} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>))}</div></div>)}
                </div>
            )}
        />
    );
};

const LMSLandingPage = () => {
    const [activeTab, setActiveTab] = useState('mandatory');
    const [trainings, setTrainings] = useState([]);
    const [teamTrainings, setTeamTrainings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManager, setIsManager] = useState(false);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');

    const employeeId = sessionStorage.getItem("employeeId");
    const token = sessionStorage.getItem("token");

    // UI helper for mobile view
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const processTrainings = (data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return data.map(t => {
            let processedStatus = t.status;
            // Only expire if not already completed or rejected
            if (t.deadline && t.status !== 'Completed' && t.status !== 'Rejected') {
                const dueDate = new Date(t.deadline);
                if (dueDate < today) {
                    processedStatus = 'Expired';
                }
            }
            return { ...t, status: processedStatus };
        });
    };

    const fetchInitialData = async () => {
        if (!employeeId) return;
        setIsLoading(true);
        try {
            // Check if user is manager or admin
            const roleRes = await api.get(`/access/assigned-ids/${employeeId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const managerStatus = roleRes.data.manager === true || roleRes.data.admin === true;
            setIsManager(managerStatus);

            // Fetch employee trainings
            const res = await api.get(`/lms/employee/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrainings(processTrainings(res.data || []));

            // Fetch team trainings if manager
            if (managerStatus) {
                const teamRes = await api.get(`/lms/team-trainings/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeamTrainings(processTrainings(teamRes.data || []));
            }
        } catch (err) {
            console.error("Failed to fetch LMS data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [employeeId]);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/lms/update-status/${id}?status=${status}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh data
            fetchInitialData();
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const getStatusStyle = (status, deadline) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (status === 'Completed') {
            return { color: '#166534', backgroundColor: '#dcfce7', border: '1px solid #86efac' }; 
        }
        if (status === 'Expired') {
            return { color: '#991b1b', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', fontWeight: 'bold' };
        }
        if (status === 'Rejected') {
            return { color: '#dc2626', backgroundColor: '#fee2e2', border: '1px solid #fca5a5' };
        }
        if (status === 'Not Completed' || status === 'Pending') {
            return { color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fcd34d' };
        }
        return { color: '#0369a1', backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc' }; 
    };

    const filterData = (data) => {
        return data.filter(t => {
            const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
            const matchesDate = !dateFilter || (t.deadline && t.deadline.includes(dateFilter));
            return matchesStatus && matchesDate;
        });
    };

    const renderTable = (data, isTeam = false) => {
        const filtered = filterData(data);
        if (filtered.length === 0) {
            return (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '80px 20px', 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    color: '#64748b',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    border: '1px dashed #e2e8f0',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    <FiClock size={48} style={{ marginBottom: '20px', opacity: 0.3, color: '#2dd4bf' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>No trainings found in this category.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Try adjusting your filters or check back later.</p>
                </div>
            );
        }

        return (
            <div className="table-responsive" style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                overflowX: 'auto', 
                overflowY: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s ease'
            }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'separate', 
                    borderSpacing: 0, 
                    textAlign: 'left',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#0D9488 !important', borderBottom: '2px solid #0D9488' }}>
                            {isTeam && <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Employee ID</th>}
                            {isTeam && <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Employee Name</th>}
                            <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Training Name</th>
                            <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Category</th>
                            <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Start Date</th>
                            <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Deadline</th>
                            <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Description</th>
                            <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                backgroundColor: '#0D9488'
                            }}>Status</th>
                            {!isTeam && <th style={{ 
                                padding: '16px 20px', 
                                color: '#FFFFFF', 
                                fontWeight: '600', 
                                fontSize: '12px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em', 
                                textAlign: 'center',
                                backgroundColor: '#0D9488'
                            }}>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((t, idx) => {
                            const statusStyle = getStatusStyle(t.status, t.deadline);
                            return (
                                <tr key={t.id} style={{ 
                                    backgroundColor: 'white',
                                    transition: 'all 0.2s',
                                    borderBottom: '1px solid #f1f5f9'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDFA'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    {isTeam && (
                                        <>
                                            <td style={{ padding: '12px 20px' }}>
                                                <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>
                                                    {t.employeeId}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{t.employeeName}</div>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ fontWeight: '500', color: '#334155', fontSize: '13px' }}>{t.trainingName}</div>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ color: '#64748b', fontSize: '12px' }}>{t.category || '-'}</div>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ color: '#64748b', fontSize: '12px' }}>{t.startDate || '-'}</div>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ color: '#64748b', fontSize: '12px' }}>{t.deadline || '-'}</div>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div 
                                            className="description-scroll-container"
                                            style={{ 
                                                color: '#64748b', 
                                                fontSize: '11px',
                                                minWidth: '150px',
                                                maxWidth: '300px',
                                                maxHeight: '60px',
                                                overflowY: 'auto',
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.4',
                                                scrollbarWidth: 'none',
                                                msOverflowStyle: 'none'
                                            }}
                                        >
                                            <style>{`.description-scroll-container::-webkit-scrollbar { display: none; }`}</style>
                                            {t.description || 'No description provided.'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            textTransform: 'uppercase',
                                            ...statusStyle
                                        }}>
                                            {t.status}
                                        </span>
                                    </td>
                                    {!isTeam && (
                                        <td style={{ padding: '12px 20px' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                {t.status === 'Completed' || t.status === 'Rejected' || t.status === 'Expired' ? (
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        color: '#6b7280',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#f3f4f6',
                                                        border: '1px solid #e5e7eb',
                                                        cursor: 'not-allowed',
                                                        fontStyle: 'italic'
                                                    }} title="Action not allowed">
                                                        {t.status === 'Completed' ? 'Completed' : t.status === 'Rejected' ? 'Rejected' : 'Expired'}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(t.id, 'Completed')}
                                                            title="Mark as Completed"
                                                            style={{
                                                                padding: '6px',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                backgroundColor: 'transparent',
                                                                color: '#16a34a',
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.backgroundColor = '#dcfce7';
                                                                e.target.style.transform = 'scale(1.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.backgroundColor = 'transparent';
                                                                e.target.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <FiCheckSquare />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(t.id, 'Rejected')}
                                                            title="Reject Training"
                                                            style={{
                                                                padding: '6px',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                backgroundColor: 'transparent',
                                                                color: '#dc2626',
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.backgroundColor = '#fee2e2';
                                                                e.target.style.transform = 'scale(1.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.backgroundColor = 'transparent';
                                                                e.target.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <FiXSquare />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Sidebar>
            <div className="w-full" style={{ 
                fontFamily: "'Inter', sans-serif",
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto",
                overflowX: "hidden",
                padding: isMobileView ? "0 8px 40px 8px" : "0 20px 40px 20px",
                backgroundColor: '#ffffff'
            }}>
                <div style={{
                    padding: "20px 0 10px 0",
                    borderBottom: "1px solid #e8ecf1",
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px',
                    backgroundColor: '#0D9488',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    padding: '16px 20px',
                    margin: '0 0 20px 0'
                }}>
                    <h1 style={{
                        fontSize: isMobileView ? "20px" : "28px",
                        fontWeight: "600",
                        color: '#FFFFFF',
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                    }}>
                        <FiBookOpen size={isMobileView ? 22 : 32} style={{ marginRight: '12px', color: '#FFFFFF' }} />
                        Learning Management
                    </h1>

                    <div style={{ 
                        display: 'flex', 
                        gap: '10px',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                            <FiFilter size={14} style={{ color: '#0D9488' }} />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', color: '#374151', fontSize: '12px', fontWeight: '500' }}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Not Completed">Not Completed</option>
                                <option value="Expired">Expired</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                            <FiCalendar size={14} style={{ color: '#0D9488' }} />
                            <SmartDatePicker
                                value={dateFilter}
                                onChange={(date) => setDateFilter(date)}
                                placeholder="Filter by date"
                            />
                        </div>
                    </div>
                </div>

                <div style={{ 
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    gap: isMobileView ? "8px" : "15px",
                    padding: isMobileView ? "10px 2px" : "12px 5px",
                    borderBottom: "2px solid #e8ecf1",
                    overflowX: "auto",
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    whiteSpace: "nowrap",
                    background: "linear-gradient(to bottom, #ffffff 0%, #f0fdfd 100%)",
                    marginBottom: isMobileView ? "15px" : "24px",
                    alignItems: "center",
                    width: "100%",
                }}>
                    <button 
                        onClick={() => setActiveTab('mandatory')}
                        style={{
                            cursor: "pointer",
                            padding: isMobileView ? "6px 14px" : "12px 20px",
                            fontSize: isMobileView ? "11px" : "14px",
                            fontWeight: activeTab === 'mandatory' ? "600" : "500",
                            color: activeTab === 'mandatory' ? "#FFFFFF" : "#374151",
                            background: activeTab === 'mandatory' 
                                ? "#0D9488" 
                                : "transparent",
                            borderRadius: isMobileView ? "6px" : "8px",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            minWidth: isMobileView ? "110px" : "max-content",
                            boxShadow: activeTab === 'mandatory' ? "0 2px 4px rgba(13, 148, 136, 0.3)" : "none",
                            border: activeTab === 'mandatory' ? "1px solid #0D9488" : "1px solid #e5e7eb"
                        }}
                    >
                        <FiBookOpen size={16} style={{ marginRight: '8px' }} /> Assigned Mandatory
                    </button>
                    <button 
                        onClick={() => setActiveTab('new')}
                        style={{
                            cursor: "pointer",
                            padding: isMobileView ? "6px 14px" : "12px 20px",
                            fontSize: isMobileView ? "11px" : "14px",
                            fontWeight: activeTab === 'new' ? "600" : "500",
                            color: activeTab === 'new' ? "#FFFFFF" : "#374151",
                            background: activeTab === 'new' 
                                ? "#0D9488" 
                                : "transparent",
                            borderRadius: isMobileView ? "6px" : "8px",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            minWidth: isMobileView ? "110px" : "max-content",
                            boxShadow: activeTab === 'new' ? "0 2px 4px rgba(13, 148, 136, 0.3)" : "none",
                            border: activeTab === 'new' ? "1px solid #0D9488" : "1px solid #e5e7eb"
                        }}
                    >
                        <FiCheckCircle size={16} style={{ marginRight: '8px' }} /> Assigned New
                    </button>
                    {isManager && (
                        <button 
                            onClick={() => setActiveTab('team')}
                            style={{
                                cursor: "pointer",
                                padding: isMobileView ? "6px 14px" : "12px 20px",
                                fontSize: isMobileView ? "11px" : "14px",
                                fontWeight: activeTab === 'team' ? "600" : "500",
                                color: activeTab === 'team' ? "#FFFFFF" : "#374151",
                                background: activeTab === 'team' 
                                    ? "#0D9488" 
                                    : "transparent",
                                borderRadius: isMobileView ? "6px" : "8px",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                minWidth: isMobileView ? "110px" : "max-content",
                                boxShadow: activeTab === 'team' ? "0 2px 4px rgba(13, 148, 136, 0.3)" : "none",
                                border: activeTab === 'team' ? "1px solid #0D9488" : "1px solid #e5e7eb"
                            }}
                        >
                            <FiUsers size={16} style={{ marginRight: '8px' }} /> Team Trainings
                        </button>
                    )}
                </div>

                <div style={{ marginTop: '5px' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '20px' }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                border: '3px solid #f3f4f6', 
                                borderTop: '3px solid #2dd4bf', 
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading trainings...</p>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                            {activeTab === 'mandatory' && renderTable(trainings.filter(t => t.category === 'Mandatory'))}
                            {activeTab === 'new' && renderTable(trainings.filter(t => t.category === 'Registered' || t.category === 'New'))}
                            {activeTab === 'team' && renderTable(teamTrainings, true)}
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
};

export default LMSLandingPage;
