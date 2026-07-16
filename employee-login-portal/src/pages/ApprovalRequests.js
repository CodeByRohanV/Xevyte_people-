import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from "../api";
import './ApprovalRequests.css';

// Import Components for each module's "My Tasks"
import MyTasks from './MyTasks'; // Claims
import MyTeamLeave from './MyTeamLeave'; // Leaves
import MyTeamTravel from './MyTeamTravel'; // Travel
import HelpDeskPendingActionsPage from './HelpDeskPendingActionsPage'; // Help Desk
import MyTeamRes from './MyTeamRes'; // Exit Management
import Mngtimesheetds from './Mngtimesheetds';
import Hrtimesheetds from './Hrtimesheetds';
import './MyTeamPage.css';
// Compensation Management

// Icons
import {
    FiCheckSquare, // Generic approval icon
    // Leaves
    FiMap,         // Travel
    FiHelpCircle,  // Help Desk
    FiLogOut,      // Exit Management
    FiChevronLeft,
    FiChevronRight,
    FiPlus
} from "react-icons/fi";
import { BsCurrencyRupee } from "react-icons/bs";

import ManageDelegates from './ManageDelegates';

function ApprovalRequests() {
    const navigate = useNavigate();
    const location = useLocation();
    const tabsRef = useRef(null);
    const [activeTab, setActiveTab] = useState('Claims');
    const [activeSubModule, setActiveSubModule] = useState('Pending Actions');
    const [showAddModal, setShowAddModal] = useState(false);
    const [attendanceRole, setAttendanceRole] = useState(null);

    useEffect(() => {
        const handleUpdate = (e) => {
            setActiveSubModule(e.detail);
        };
        window.addEventListener('updateSubModule', handleUpdate);
        return () => window.removeEventListener('updateSubModule', handleUpdate);
    }, []);
    const [roles, setRoles] = useState({
        manager: false,
        hr: false,
        finance: false,
        admin: false,
        reviewer: false,
        travelAdmin: false
    });
    const [taskCounts, setTaskCounts] = useState({});
    const employeeId = sessionStorage.getItem("employeeId");

    const scrollTabs = (direction) => {
        if (tabsRef.current) {
            const scrollAmount = 150;
            tabsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
        }
    };

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
        if (location.state?.activeSubModule) {
            setActiveSubModule(location.state.activeSubModule);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchRoles = async () => {
            if (!employeeId) return;
            const token = sessionStorage.getItem("token");
            try {
                const response = await api.get(`/access/assigned-ids/${employeeId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = response.data;
                setRoles(data);
            } catch (err) {
                console.error("Failed to fetch roles:", err);
            }
        };
        fetchRoles();
    }, []); // Empty dependency array for mount-only fetch

    useEffect(() => {
        if (roles.manager) setAttendanceRole("manager");
        else if (roles.hr) setAttendanceRole("hr");
    }, [roles]);

    const fetchTaskCounts = async () => {
        if (!employeeId) return;
        const token = sessionStorage.getItem("token");
        try {
            const res = await api.get(`/task-counts/${employeeId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setTaskCounts(res.data);
        } catch (err) {
            console.error("Failed to fetch task counts:", err);
        }
    };

    useEffect(() => {
        fetchTaskCounts();
        const interval = setInterval(fetchTaskCounts, 15000);
        return () => clearInterval(interval);
    }, []); // Empty dependency array for mount-only fetch

    const tabsList = [
        { id: 'Claims', label: <>Reimbursements {taskCounts.claims > 0 && <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '4px' }}>({taskCounts.claims})</span>}</>, icon: <BsCurrencyRupee /> },
        { id: 'Leaves', label: <>Leaves {taskCounts.leaves > 0 && <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '4px' }}>({taskCounts.leaves})</span>}</>, icon: null },
        { id: 'Travel', label: <>Travel Management {taskCounts.travel > 0 && <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '4px' }}>({taskCounts.travel})</span>}</>, icon: <FiMap /> },
        { id: 'HelpDesk', label: <>Help Desk {taskCounts.helpdesk > 0 && <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '4px' }}>({taskCounts.helpdesk})</span>}</>, icon: <FiHelpCircle /> },
        { id: 'Exit', label: <>Exit Management {taskCounts.exit > 0 && <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '4px' }}>({taskCounts.exit})</span>}</>, icon: <FiLogOut /> },

    ];

    const getVisibleTabs = () => {
        return tabsList.filter(tab => {
            switch (tab.id) {
                case 'Claims':
                    return roles.manager || roles.finance;
                case 'Leaves':
                    return roles.manager || roles.hr;
                case 'Travel':
                    return roles.manager || roles.travelAdmin;
                case 'HelpDesk':
                    return roles.manager;
                case 'Exit':
                    return roles.manager || roles.hr || roles.admin || roles.finance || roles.reviewer;
                default:
                    return false;
            }
        });
    };

    const visibleTabs = getVisibleTabs();

    useEffect(() => {
        if (visibleTabs.length > 0) {
            const isCurrentTabVisible = visibleTabs.some(tab => tab.id === activeTab);
            if (!isCurrentTabVisible) {
                setActiveTab(visibleTabs[0].id);
            }
        }
    }, [roles, visibleTabs, activeTab]);

    const renderContent = () => {
        if (activeSubModule === 'Delegation') {
            return (
                <div className="approval-tab-content-wrapper">
                    <ManageDelegates 
                        showAddModal={showAddModal} 
                        setShowAddModal={setShowAddModal} 
                        onAction={(module) => {
                            setActiveSubModule('Pending Actions');
                            // Map saved request types to tab IDs if necessary
                            const tabMap = {
                                'Claims': 'Claims',
                                'Leaves': 'Leaves',
                                'Travel': 'Travel',
                                'Help Desk': 'HelpDesk',
                                'Exit Management': 'Exit'
                            };
                            setActiveTab(tabMap[module] || 'Claims');
                        }}
                    />
                </div>
            );
        }

        if (visibleTabs.length === 0) return <div style={{ padding: "20px" }}>No approval tasks available.</div>;

        switch (activeTab) {
            case 'Claims':
                return (
                    <div className="approval-tab-content-wrapper" style={{ padding: '0px' }}>
                        <MyTasks isApprovalPage={true} />
                    </div>
                );
            case 'Leaves':
                return (
                    <div className="approval-tab-content-wrapper" style={{ padding: '0px' }}>
                        <MyTeamLeave />
                    </div>
                );
            case 'Travel':
                return (
                    <div className="approval-tab-content-wrapper">
                        <MyTeamTravel isManagerProp={roles.manager} isAdminProp={roles.travelAdmin} />
                    </div>
                );
            case 'HelpDesk':
                return (
                    <div className="helpdesk-container approval-tab-content-wrapper" style={{ padding: '0px' }}>
                        <HelpDeskPendingActionsPage />
                    </div>
                );
            case 'Exit':
                return <div className="approval-tab-content-wrapper" style={{ padding: '0px' }}><MyTeamRes managerId={employeeId} /></div>;
            case 'Timesheets':
                return (
                    <div className="approval-tab-content-wrapper" style={{ padding: '0px' }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                minHeight: "70vh",
                                width: '100%',
                                padding: '20px',
                                boxSizing: 'border-box'
                            }}
                        >
                            {/* Role Switcher Section */}
                            <div className="role-switcher-container1">
                                <span className="role-switcher-label1">View As:</span>
                                <div className="role-segment-group1">
                                    {roles.manager && (
                                        <label className={`role-segment ${attendanceRole === 'manager' ? 'active' : ''}`} onClick={() => setAttendanceRole('manager')}>
                                            <input
                                                type="radio"
                                                name="attendanceRole"
                                                checked={attendanceRole === 'manager'}
                                                readOnly
                                            />
                                            <span className="role-icon">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            </span>
                                            Manager
                                        </label>
                                    )}
                                    {roles.hr && (
                                        <label className={`role-segment ${attendanceRole === 'hr' ? 'active' : ''}`} onClick={() => setAttendanceRole('hr')}>
                                            <input
                                                type="radio"
                                                name="attendanceRole"
                                                checked={attendanceRole === 'hr'}
                                                readOnly
                                            />
                                            <span className="role-icon">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="9" cy="7" r="4"></circle>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                </svg>
                                            </span>
                                            HR
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Dashboard content */}
                            <div style={{ marginTop: '0px' }}>
                                {attendanceRole === 'manager' && <Mngtimesheetds />}
                                {attendanceRole === 'hr' && <Hrtimesheetds />}
                                {!attendanceRole && <p>You do not have administrative access for Attendance.</p>}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Sidebar>
            <div className="approval-requests-container">
                {/* Header */}
                <div className="approval-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h1 className="approval-title" style={{ margin: 0 }}>
                            My Tasks
                        </h1>
                        <p style={{ margin: 0, marginBottom: '20px', color: '#00B3A4', fontSize: '15px', fontWeight: 'normal' }}>
                            {activeSubModule === 'Delegation'
                                ? 'Manage and assign your task approval delegations'
                                : activeTab === 'Claims'
                                    ? 'Review and approve pending reimbursement claims'
                                    : activeTab === 'Leaves'
                                        ? 'Review and approve pending employee leave applications'
                                        : activeTab === 'Timesheets'
                                            ? 'Review and approve employee attendance and timesheet entries'
                                            : activeTab === 'Travel'
                                                ? 'Review and approve pending employee travel requests'
                                                : activeTab === 'HelpDesk'
                                                    ? 'Review and resolve employee help desk support tickets'
                                                    : activeTab === 'Exit'
                                                        ? 'Review and finalize employee resignation and exit clearances'
                                                        : 'Review and approve pending operational tasks'}
                        </p>
                    </div>
                    {activeSubModule === 'Delegation' && (
                        <button 
                            className="add-delegate-btn"
                            onClick={() => setShowAddModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: '#00B3A4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0, 179, 164, 0.2)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <FiPlus /> Add Delegates
                        </button>
                    )}
                </div>

                {/* Tabs with Arrows (Only for Pending Actions) */}
                {activeSubModule === 'Pending Actions' && visibleTabs.length > 0 && (
                    <div className="tabs-wrapper">
                        <button className="scroll-btn left" onClick={() => scrollTabs('left')}>
                            <FiChevronLeft />
                        </button>

                        <div className="tabs-scroll-container" ref={tabsRef}>
                            {visibleTabs.map(tab => (
                                <div
                                    key={tab.id}
                                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span>{tab.label}</span>
                                </div>
                            ))}
                        </div>

                        <button className="scroll-btn right" onClick={() => scrollTabs('right')}>
                            <FiChevronRight />
                        </button>
                    </div>
                )}
                {/* Content Area */}
                <div className="approval-content">
                    {renderContent()}
                </div>
            </div>
        </Sidebar>
    );
}

export default ApprovalRequests;
