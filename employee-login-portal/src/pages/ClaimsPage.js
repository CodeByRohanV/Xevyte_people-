import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import NewClaim from './NewClaim';
import Saveddrafts from './Saveddrafts';
import ClaimHistoryPage from './ClaimHistoryPage';
import MyTasks from './MyTasks';
import DesignSummary from './DesignSummary';
import api from "../api";
import './ClaimsPage.css';

function ClaimsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tabsRef = useRef(null);

  const [activeTab, setActiveTab] = useState('New Claim');
  const [draftIdForEdit, setDraftIdForEdit] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [summary, setSummary] = useState({
    totalClaims: 0,
    approved: 0,
    rejected: 0,
    paidAmount: 0
  });
  const [canViewTasks, setCanViewTasks] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const employeeId = sessionStorage.getItem("employeeId");
  const token = sessionStorage.getItem("token");
  const authHeader = { 'Authorization': `Bearer ${token}` };

  // Load view task permission
  useEffect(() => {
    if (employeeId && token) {
      api
        .get(`/claims/assigned-ids/${employeeId}`, { headers: authHeader })
        .then((res) => {
          setCanViewTasks(res.data.canViewTasks === true);
        })
        .catch((err) => {
          console.error("Error fetching task visibility:", err);
          setCanViewTasks(false);
        });
    }
  }, [employeeId, token]);

  const fetchClaimSummary = React.useCallback(async () => {
    if (!employeeId || !token) return;
    try {
      const response = await api.get(`/claims/summary/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setSummary({
        totalClaims: data.totalClaims || 0,
        approved: data.approved || 0,
        rejected: data.rejected || 0,
        paidAmount: data.paidAmount || 0,
      });
    } catch (err) {
      console.error("Error fetching summary:", err.response?.data || err.message);
    }
  }, [employeeId, token]);

  const handleClaimActionComplete = () => {
    fetchClaimSummary();
    // Trigger history refresh
    setRefreshHistory(prev => prev + 1);
  };

  useEffect(() => {
    fetchClaimSummary();
  }, [fetchClaimSummary]);
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      setDraftIdForEdit(location.state.draftId || null);
    }
  }, [location.state]);

  // Build tab list dynamically
  const tabItems = ['New Claim', 'Drafts', 'History'];

  tabItems.push('Summary');

  // Tab icons mapping - Premium SVG icons matching other modules
  const tabIcons = {
    'New Claim': (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
      </svg>
    ),
    'Drafts': (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
      </svg>
    ),
    'History': (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
      </svg>
    ),
    'Summary': (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4zm11 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
      </svg>
    )
  };

  // Check if tabs need scrolling
  const checkScrollButtons = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [tabItems]);

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <Sidebar>
      <div className="claims-page-container">
        {/* Header Section */}
        {/* Page Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #e8ecf1', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 className="claims-page-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0, fontWeight: 'normal' }}>
            Reimbursements
          </h2>
          <p style={{ color: '#00b3a4', fontSize: '15px', fontWeight: 'normal', margin: '4px 0 0 0' }}>
            Submit, track and manage your expense claims efficiently
          </p>
        </div>

        {/* <div className="claims-header">


          <div className="quick-stats">
            <div className="stat-card total">
              <div className="stat-icon-wrapper total-icon">
                <i className="bi bi-grid-fill"></i>
              </div>
              <div className="stat-details">
                <div className="stat-value">{summary.totalClaims}</div>
                <div className="stat-label">TOTAL CLAIMS</div>
              </div>
            </div>

            <div className="stat-card approved">
              <div className="stat-icon-wrapper approved-icon">
                <i className="bi bi-check-lg"></i>
              </div>
              <div className="stat-details">
                <div className="stat-value">{summary.approved}</div>
                <div className="stat-label">APPROVED</div>
              </div>
            </div>

            <div className="stat-card rejected">
              <div className="stat-icon-wrapper rejected-icon">
                <i className="bi bi-x-lg"></i>
              </div>
              <div className="stat-details">
                <div className="stat-value">{summary.rejected}</div>
                <div className="stat-label">REJECTED</div>
              </div>
            </div>

            <div className="stat-card paid">
              <div className="stat-icon-wrapper paid-icon">
                <i className="bi bi-currency-rupee"></i>
              </div>
              <div className="stat-details">
                <div className="stat-value">₹{Math.floor(summary.paidAmount)}</div>
                <div className="stat-label">PAID AMOUNT</div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Tab Navigation */}
        <div className="claims-tabs-container">
          {showLeftArrow && (
            <button
              className="tab-nav-arrow tab-nav-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll left"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
              </svg>
            </button>
          )}
          <div
            className="claims-tabs"
            ref={tabsRef}
            onScroll={checkScrollButtons}
          >
            {tabItems.map(tab => (
              <button
                key={tab}
                className={`claims-tab-btn tab-${tab.toLowerCase().replace(/\s+/g, '-')}${activeTab === tab ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab(tab);

                  // Clear draft edit state if switching away from New Claim, or if clicking New Claim explicitly to start fresh
                  if (tab !== 'New Claim') {
                    setDraftIdForEdit(null);
                  }

                  // Always clear location state when manually switching tabs to prevent sticky state on refresh/re-nav
                  // If clicking "New Claim" tab explicitly, we want a FRESH claim, not the one in history state.
                  navigate(location.pathname, {
                    replace: true,
                    state: { activeTab: tab } // Only keep the active tab, remove draftId/groupId
                  });
                }}
              >
                <span className="tab-text">{tab}</span>
              </button>
            ))}
          </div>
          {showRightArrow && (
            <button
              className="tab-nav-arrow tab-nav-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll right"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="claims-content">
          {activeTab === 'New Claim' && <NewClaim token={token} onActionComplete={handleClaimActionComplete} />}
          {activeTab === 'Drafts' && <Saveddrafts token={token} onActionComplete={handleClaimActionComplete} />}
          {activeTab === 'History' && <ClaimHistoryPage token={token} onActionComplete={handleClaimActionComplete} refreshTrigger={refreshHistory} />}

          {activeTab === 'Summary' && <DesignSummary summary={summary} />}
        </div>
      </div>
    </Sidebar>
  );
}

export default ClaimsPage;

