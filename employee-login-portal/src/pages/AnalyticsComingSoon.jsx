import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AttendanceAnalyticsDeep.css'; // Re-use the theme styles

const AnalyticsComingSoon = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine module name from URL
  const pathParts = location.pathname.split('/');
  const moduleNameRaw = pathParts[pathParts.length - 1] || 'module';
  const moduleName = moduleNameRaw.charAt(0).toUpperCase() + moduleNameRaw.slice(1);

  return (
    <Sidebar>
      <div className="coming-soon-page">
        {/* Breadcrumb */}
        <div className="aad-breadcrumb">
          <span style={{ cursor: 'pointer', color: '#14b8a6', fontWeight: 500 }} onClick={() => navigate('/dashboard')}>Home</span>
          <span>/</span>
          <span style={{ cursor: 'pointer', color: '#14b8a6', fontWeight: 500 }} onClick={() => navigate('/analytics')}>Analytics Hub</span>
          <span>/</span>
          <span>{moduleName}</span>
        </div>

        <div className="coming-soon-content">
          <span className="coming-soon-icon">🚧</span>
          <h2 className="coming-soon-title">{moduleName} Analytics</h2>
          <p className="coming-soon-desc">
            We're currently building the enterprise analytics dashboard for {moduleName}. 
            This module will feature deep insights, rich visualizations, and real-time data aggregation to help you make better workforce decisions.
          </p>
          
          <button className="coming-soon-back-btn" onClick={() => navigate('/analytics')}>
            <i className="bi bi-arrow-left" /> Back to Analytics Hub
          </button>
        </div>
      </div>
    </Sidebar>
  );
};

export default AnalyticsComingSoon;
