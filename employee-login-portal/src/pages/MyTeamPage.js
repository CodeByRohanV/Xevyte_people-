import React, { useState, useEffect } from 'react';

import './Dashboard.css';
import './MyTeamPage.css';
import Sidebar from './Sidebar.js';
import Mngtimesheetds from './Mngtimesheetds';
import Hrtimesheetds from './Hrtimesheetds';
import { useNavigate } from 'react-router-dom';
import api from "../api";

const MyTeamPage = () => {
    const employeeId = sessionStorage.getItem("employeeId");
    const navigate = useNavigate();
    const [roles, setRoles] = useState({
        manager: false,
        finance: false,
        hr: false,
        reviewer: false,
        admin: false,
        canViewTasks: false,
    });

    const [activeRole, setActiveRole] = useState(null);

    // Fetch assigned roles (logic is sound)
    useEffect(() => {
        const fetchAssignedRoles = async () => {
            const token = sessionStorage.getItem("token");
            if (!employeeId || !token) {
                console.warn("No employeeId or token found. Skipping role fetch.");
                return;
            }

            try {
                const response = await api.get(`/access/assigned-ids/${employeeId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                const data = response.data;
                setRoles(data);

                // Set first available role as default active
                if (data.manager) setActiveRole("manager");
                else if (data.hr) setActiveRole("hr");
                else if (data.finance) setActiveRole("finance");
            } catch (err) {
                console.error("Failed to fetch roles:", err.response?.data || err.message);
            }
        };

        fetchAssignedRoles();
    }, [employeeId]);

    // Render role-specific component (logic is sound)
    const renderDashboard = () => {
        switch (activeRole) {
            case 'manager':
                return Mngtimesheetds ? <Mngtimesheetds /> : <p>Manager Component not imported/defined.</p>;
            case 'hr':
                return Hrtimesheetds ? <Hrtimesheetds /> : <p>HR Component not imported/defined.</p>;
            default:
                return <p>Please select a role to view dashboard.</p>;
        }
    };

    return (
        <Sidebar>
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
                <div style={{ zIndex: 10, position: 'relative', width: 'fit-content' }}>
                    <button
                        onClick={() => navigate("/TimeSheet")}
                        style={{
                            padding: "8px 16px",
                            background: "#14B8A6",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "600",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            marginBottom: '15px',
                            boxShadow: "0 2px 4px rgba(20, 184, 166, 0.2)",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(94, 234, 212, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(94, 234, 212, 0.3)";
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </div>

                {/* Role Switcher Section */}
                <div className="role-switcher-container1">
                    <span className="role-switcher-label1">View As:</span>
                    <div className="role-segment-group1">
                        {roles.manager && (
                            <label className={`role-segment ${activeRole === 'manager' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="activeRole"
                                    checked={activeRole === 'manager'}
                                    onChange={() => setActiveRole('manager')}
                                />
                                <span className="role-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </span>
                                MANAGER
                            </label>
                        )}
                        {roles.hr && (
                            <label className={`role-segment ${activeRole === 'hr' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="activeRole"
                                    checked={activeRole === 'hr'}
                                    onChange={() => setActiveRole('hr')}
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
                    {renderDashboard()}
                </div>
            </div>
        </Sidebar>
    );
};

export default MyTeamPage;
