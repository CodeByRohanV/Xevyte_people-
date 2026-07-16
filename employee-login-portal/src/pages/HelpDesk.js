import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HelpDeskCreateTicket from "./HelpDeskCreateTicket";
import HelpDeskMyTicketsDashboard from "./HelpDeskMyTicketsDashboard";
import HelpDeskPendingActionsPage from "./HelpDeskPendingActionsPage";
import HelpDeskPendingActionsPage1 from "./HelpDeskPendingActionsPage1";
import HelpDeskChangeRequestPage from "./HelpDeskChangeRequestPage";
import HelpDeskDrafts from "./HelpDeskDrafts";
import Sidebar from "./Sidebar.js";
import api from "../api";
import "./HelpDesk.css";

const HelpDesk = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");

  // Check for mobile view
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollTabs = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 100 : scrollLeft + 100;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const [isManager, setIsManager] = useState(false);
  const [hasTeamAccess, setHasTeamAccess] = useState(false);

  const employeeId = sessionStorage.getItem("employeeId");

  /* ============================================================
     FETCH MANAGER ACCESS (Pending Actions)
     ============================================================ */
  useEffect(() => {
    const fetchManagerAccess = async () => {
      if (!employeeId) return;

      try {
        let rawToken = sessionStorage.getItem("token");
        if (!rawToken) return;

        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;

        const response = await api.get(`/access/assigned-ids/${employeeId}`, {
          headers: { Authorization: token },
        });

        setIsManager(response.data.manager === true);

      } catch (err) {
        console.error("Error checking manager access:", err);
        setIsManager(false);
      }
    };

    fetchManagerAccess();
  }, [employeeId]);

  /* ============================================================
     FETCH HELP DESK TEAM ACCESS (My Tasks)
     ============================================================ */
  useEffect(() => {
    const checkTeamAccess = async () => {
      try {
        let rawToken = sessionStorage.getItem("token");
        if (!rawToken) return;

        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;

        const response = await api.get(
          `/v1/helpdesk-teams/team-exact/${employeeId}`,
          {
            headers: { Authorization: token }
          }
        );

        setHasTeamAccess(response.data.hasAccess === true);

      } catch (err) {
        console.error("Error checking HelpDesk Team Access:", err);
      }
    };

    if (employeeId) checkTeamAccess();
  }, [employeeId]);

  /* ============================================================
     BOOTSTRAP SVG ICONS
     ============================================================ */
  const icons = {
    create: (
      <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
      </svg>
    ),
    changeRequest: (
      <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
      </svg>
    ),
    myTickets: (
      <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z" />
      </svg>
    ),
    pendingActions: (
      <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
      </svg>
    ),
    teamTickets: (
      <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
        <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      </svg>
    ),
    drafts: (
      <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
        <path d="M9.828 3c3.896 0 6.828 2.932 6.828 6.828s-2.932 6.828-6.828 6.828c-3.896 0-6.828-2.932-6.828-6.828S5.932 3 9.828 3zM9.828 2a7.828 7.828 0 1 0 0 15.656A7.828 7.828 0 0 0 9.828 2z" />
        <path d="M7.875 6.068a.5.5 0 0 1 .5.5v3.5h3.5a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5z" />
      </svg>
    ),
  };

  /* ============================================================
     MODERN TAB STYLES
     ============================================================ */
  const tabContainerStyle = {
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: "0",
    padding: "0",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "#0b3d91",
    marginBottom: "1rem",
    position: 'relative',
    scrollBehavior: 'smooth',
    width: "100%",
    alignItems: "stretch",
    boxSizing: "border-box",
  };

  const tabStyle = (isActive) => ({
    cursor: "pointer",
    padding: "0.65rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "white",
    background: isActive ? "#1f6feb" : "#0b3d91",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    flexShrink: 0,
    whiteSpace: "nowrap",
    width: "auto",
    border: "none",
    outline: "none"
  });

  /* ============================================================
     DEFINE TABS
     ============================================================ */
  const tabItems = [
    { id: "create", label: "Incident" },
    { id: "changeRequest", label: "Change Request" },
    { id: "myTickets", label: "My Dashboard" },
    { id: "drafts", label: "Drafts" },

    ...(hasTeamAccess ? [{ id: "teamTickets", label: "Ticket Hub" }] : []),
  ];

  /* ============================================================
     UI RENDER
     ============================================================ */
  return (
    <Sidebar>
      <div className="helpdesk-page w-full" style={{
        fontFamily: "'Inter', sans-serif",
        maxHeight: "calc(100vh - 100px)", // Height of viewport minus some offset
        overflowY: "auto",
        overflowX: "hidden",
        padding: isMobileView ? "0 8px 40px 8px" : "0 20px 40px 20px", // Further reduced padding on mobile for full screen look
      }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 0 0.5rem 0',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <h1 style={{ margin: 0, padding: 0, fontWeight: 'normal', fontSize: '30px', color: '#1F2937', fontFamily: "'Inter', sans-serif", textAlign: 'left' }}>
              Help Desk
            </h1>
            <p style={{ color: '#00b3a4', fontSize: '15px', margin: '5px 0 0 0', padding: 0, fontFamily: "'Inter', sans-serif", textAlign: 'left' }}>
              IT Support & Change Management Portal
            </p>
          </div>
        </div>

        {/* TAB HEADER */}
        <style>
          {`
            #tab-scroll-container {
              display: flex !important;
              flex-direction: row !important;
              flex-wrap: nowrap !important;
              overflow: hidden !important;
              width: 100% !important;
              gap: 0 !important;
              align-items: stretch !important;
              justify-content: flex-start !important;
            }
            .help-tab-item {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: center !important;
              flex-shrink: 0 !important;
              width: auto !important;
              padding: 0.65rem 1.5rem !important;
              font-size: 0.9rem !important;
              white-space: nowrap !important;
            }
          `}
        </style>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <div
            id="tab-scroll-container"
            ref={scrollRef}
            style={{
              ...tabContainerStyle,
              paddingLeft: '0',
              paddingRight: '0'
            }}
          >
            {tabItems.map((tab, index) => (
              <div
                key={tab.id}
                className="help-tab-item"
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(location.pathname, { replace: true, state: {} });
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'rgba(11, 61, 145, 0.95)';
                    e.currentTarget.style.filter = 'brightness(1.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = '#0b3d91';
                    e.currentTarget.style.filter = 'none';
                  }
                }}
                style={{
                  ...tabStyle(activeTab === tab.id),
                  borderRadius: index === 0 ? '8px 0 0 8px' : index === tabItems.length - 1 ? '0 8px 8px 0' : '0'
                }}
              >
                <span>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TAB CONTENT - Now part of the main scroll container */}
        <div style={{
          padding: "0",
          fontFamily: "'Inter', sans-serif",
        }}>
          {activeTab === "create" && <HelpDeskCreateTicket />}
          {activeTab === "changeRequest" && <HelpDeskChangeRequestPage />}
          {activeTab === "myTickets" && <HelpDeskMyTicketsDashboard />}
          {activeTab === "drafts" && <HelpDeskDrafts />}

          {activeTab === "teamTickets" && hasTeamAccess && (
            <HelpDeskPendingActionsPage1 />
          )}

        </div>

      </div>
    </Sidebar>
  );
};

export default HelpDesk;
