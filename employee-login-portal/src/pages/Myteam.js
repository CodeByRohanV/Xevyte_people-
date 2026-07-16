import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar.js';

import api from "../api";

// Import the components you want to display for each role.
import Managergoals from './Managergoals';
import Reviewer from './Reviewer';
import Hrgoals from './Hrgoals';

function Myteam() {
  const navigate = useNavigate();
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [assignedRoles, setAssignedRoles] = useState({
    manager: false,
    hr: false,
    reviewer: false,
  });

  const [activeDashboard, setActiveDashboard] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAssignedRoles = async () => {
      if (!employeeId) return;

      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          console.error("Authentication token not found. Please log in again.");
          return;
        }

        const savedRole = sessionStorage.getItem("activeDashboard");

        const response = await api.get(`/access/assigned-ids/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;

        setAssignedRoles({
          manager: data.manager || false,
          hr: data.hr || false,
          reviewer: data.reviewer || false,
        });

        // Restore last active dashboard if valid
        if (savedRole && data[savedRole]) {
          setActiveDashboard(savedRole);
        } else if (data.manager) {
          setActiveDashboard("manager");
        } else if (data.reviewer) {
          setActiveDashboard("reviewer");
        } else if (data.hr) {
          setActiveDashboard("hr");
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err.response?.data || err.message);
      }
    };

    fetchAssignedRoles();
  }, [employeeId]);

  useEffect(() => {
    if (activeDashboard) {
      sessionStorage.setItem("activeDashboard", activeDashboard);
    }
  }, [activeDashboard]);

  const handleRoleChange = (role) => {
    setActiveDashboard(role);
  };

  const renderDashboard = () => {
    switch (activeDashboard) {
      case "manager":
        return <Managergoals />;
      case "reviewer":
        return <Reviewer />;
      case "hr":
        return <Hrgoals />;
      default:
        return null;
    }
  };

  // Bootstrap SVG Icons
  const icons = {
    manager: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
      </svg>
    ),
    reviewer: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z" />
      </svg>
    ),
    hr: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216Z" />
        <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </svg>
    ),
  };

  // Modern Toggle Button Styles
  const containerStyle = {
    marginTop: '0',
    paddingTop: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minHeight: "70vh",
    marginLeft: "0"
  };

  const toggleContainerStyle = {
    display: 'flex',
    flexDirection: isMobileView ? 'column' : 'row',
    alignItems: isMobileView ? 'stretch' : 'center',
    gap: isMobileView ? '12px' : '16px',
    padding: isMobileView ? '16px' : '20px 24px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  };

  const labelStyle = {
    fontSize: isMobileView ? '12px' : '16px',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    minWidth: '80px',
    marginBottom: isMobileView ? '4px' : '0',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    padding: '0',
    width: isMobileView ? '100%' : 'auto',
    overflowX: isMobileView ? 'auto' : 'visible',
  };

  const buttonStyle = (role, isActive) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    padding: isMobileView ? '10px 4px' : '8px 18px',
    fontSize: isMobileView ? '13px' : '14px',
    fontWeight: '600',
    border: isActive ? '1px solid #14b8a6' : '1px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: isActive ? '#ffffff' : '#f1f5f9',
    color: isActive ? '#14b8a6' : '#64748b',
    boxShadow: isActive ? '0 4px 12px rgba(20, 184, 166, 0.1)' : 'none',
    transform: isActive ? 'scale(1.02)' : 'scale(1)',
    flex: isMobileView ? 1 : 'none',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={containerStyle}>
      {/* Modern Toggle Button Group */}
      <div style={toggleContainerStyle}>
        <div style={labelStyle}>VIEW AS:</div>
        <div style={buttonGroupStyle}>
          {assignedRoles.manager && (
            <button
              onClick={() => handleRoleChange("manager")}
              style={buttonStyle("manager", activeDashboard === "manager")}
              onMouseEnter={(e) => {
                if (activeDashboard !== "manager") {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (activeDashboard !== "manager") {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
            >
              MANAGER
            </button>
          )}

          {assignedRoles.reviewer && (
            <button
              onClick={() => handleRoleChange("reviewer")}
              style={buttonStyle("reviewer", activeDashboard === "reviewer")}
              onMouseEnter={(e) => {
                if (activeDashboard !== "reviewer") {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (activeDashboard !== "reviewer") {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
            >
              REVIEWER
            </button>
          )}

          {assignedRoles.hr && (
            <button
              onClick={() => handleRoleChange("hr")}
              style={buttonStyle("hr", activeDashboard === "hr")}
              onMouseEnter={(e) => {
                if (activeDashboard !== "hr") {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (activeDashboard !== "hr") {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
            >
              HR
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content-container" style={{ width: '100%' }}>
        {renderDashboard()}
      </div>
    </div>
  );
}

export default Myteam;
