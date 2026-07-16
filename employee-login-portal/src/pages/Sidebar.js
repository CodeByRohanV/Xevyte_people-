import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import './Sidebar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from "../api";
import { getDynamicIAMLoginUrl } from "../auth/SSOHandler";
import xevyteFullLogo from '../assets/Xevyte.png';
import xevyteIconLogo from '../assets/xevyte.jpeg';

const Sidebar = ({ children }) => {
  const MANAGED_MODULES = [
    "EMPLOYEE DIRECTORY",
    "PAYSLIPS", "ADMIN",
    "PRE_ONBOARDING", "ONBOARDING", "CONTRACT MANAGEMENT", "REPORTS", "COMPENSATION", "ASSET MANAGEMENT", "KNOWLEDGE HUB"
  ];
  const employeeId = sessionStorage.getItem("employeeId");
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };
  const token = sessionStorage.getItem("token");
  const [userModules, setUserModules] = useState([]);
  const [isAccessLoaded, setIsAccessLoaded] = useState(false);
  const [userRole, setUserRole] = useState(sessionStorage.getItem("role") || "");
  const [roles, setRoles] = useState({
    manager: false,
    finance: false,
    hr: false,
    reviewer: false,
    admin: false,
    travelAdmin: false
  });

  const fetchRoles = async () => {
    if (!employeeId || !token) return;
    try {
      const response = await api.get(`/access/assigned-ids/${employeeId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = response.data;
      setRoles(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const canViewMyTasks = roles.manager || roles.hr || roles.finance || roles.reviewer || roles.admin || roles.travelAdmin;
  const canViewAnalytics = roles.manager || roles.hr || roles.admin || userRole.toUpperCase() === "ADMIN" || userRole.toUpperCase() === "HR" || userRole.toUpperCase() === "MANAGER";


  // Default image used for fallback, ensure the path is correct in your project
  const [profilePic, setProfilePic] = useState(sessionStorage.getItem("employeeProfilePic") || "");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName") || "");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktopFrozen, setIsDesktopFrozen] = useState(true);
  // Removed searchTerm as it was unused
  const [profileOpen, setProfileOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isEmployeeHubOpen, setIsEmployeeHubOpen] = useState(false);
  const [isOrganizationOpen, setIsOrganizationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isTimeAttendanceOpen, setIsTimeAttendanceOpen] = useState(false);
  const [isReimbursementsOpen, setIsReimbursementsOpen] = useState(false);
  const [isEmployeePayOpen, setIsEmployeePayOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isProjectManagementOpen, setIsProjectManagementOpen] = useState(false);
  const [isMyTasksOpen, setIsMyTasksOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [taskCounts, setTaskCounts] = useState({ total: 0 });
  const [pendingPoliciesCount, setPendingPoliciesCount] = useState(0);


  const toggleContractMenu = () => {
    if (!isContractOpen) {
      if (hasAccess("CONTRACT MANAGEMENT")) navigate('/Customers');
    }
    setIsContractOpen(!isContractOpen);
  };
  const toggleEmployeeHubMenu = () => {
    if (!isEmployeeHubOpen) {
      if (hasAccess("MY PROFILE")) navigate('/ProfileSettings');
      else if (hasAccess("ALLOCATIONS")) navigate('/AllocationsPage');
      else if (hasAccess("DOCUMENT HUB")) navigate('/documenthub');
    }
    setIsEmployeeHubOpen(!isEmployeeHubOpen);
    // Close other parent modules when opening this one
    setIsOrganizationOpen(false);
    setIsOnboardingOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsReimbursementsOpen(false);
    setIsEmployeePayOpen(false);
    setIsSupportOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);
  };
  const toggleOrganizationMenu = () => {
    if (!isOrganizationOpen) {
      if (hasAccess("EMPLOYEE DIRECTORY")) navigate('/EmployeeDirectory');
      else if (hasAccess("HOLIDAY CALENDAR")) navigate('/HolidayCalender');
      else if (hasAccess("HANDBOOK")) navigate('/EmployeeHandBook');
      else if (hasAccess("KNOWLEDGE_HUB")) navigate('/EmployeeKnowledgeHub');
    }
    setIsOrganizationOpen(!isOrganizationOpen);
    // Close other parent modules when opening this one
    setIsEmployeeHubOpen(false);
    setIsOnboardingOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsReimbursementsOpen(false);
    setIsEmployeePayOpen(false);
    setIsSupportOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);
  };
  const toggleOnboardingMenu = () => {
    if (!isOnboardingOpen) {
      if (hasAccess("PRE_ONBOARDING")) navigate('/Preonboarding');
      else if (hasAccess("ONBOARDING")) navigate('/Onboarding');
    }
    setIsOnboardingOpen(!isOnboardingOpen);
    // Close other parent modules when opening this one
    setIsEmployeeHubOpen(false);
    setIsOrganizationOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsReimbursementsOpen(false);
    setIsEmployeePayOpen(false);
    setIsSupportOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);
  };
  const toggleTimeAttendanceMenu = () => {
    if (!isTimeAttendanceOpen) {
      if (hasAccess("TIMESHEET")) navigate('/TimeSheet');
      else if (hasAccess("LEAVES")) navigate('/Leaves');
    }
    setIsTimeAttendanceOpen(!isTimeAttendanceOpen);
    // Close other parent modules when opening this one
    setIsEmployeeHubOpen(false);
    setIsOrganizationOpen(false);
    setIsOnboardingOpen(false);
    setIsReimbursementsOpen(false);
    setIsEmployeePayOpen(false);
    setIsSupportOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);
  };
  const toggleReimbursementsMenu = () => {
    setIsReimbursementsOpen(!isReimbursementsOpen);
    // Close other parent modules when opening this one
    setIsEmployeeHubOpen(false);
    setIsOrganizationOpen(false);
    setIsOnboardingOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsEmployeePayOpen(false);
    setIsSupportOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);
  };
  const toggleEmployeePayMenu = () => {
    if (!isEmployeePayOpen) {
      if (hasAccess("COMPENSATION")) navigate('/CompensationManagement');
      else if (hasAccess("PAYSLIPS")) navigate('/PayrollManagement');
      else if (hasAccess("IT DECLARATION")) navigate('/ITDeclaration');
      else if (hasAccess("YTD REPORT")) navigate('/YTDReport');
    }
    setIsEmployeePayOpen(!isEmployeePayOpen);
    // Close other parent modules when opening this one
    setIsEmployeeHubOpen(false);
    setIsOrganizationOpen(false);
    setIsOnboardingOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsReimbursementsOpen(false);
    setIsSupportOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);
  };
  const toggleSupportMenu = () => {
    if (!isSupportOpen) {
      if (hasAccess("HELPDESK")) navigate('/HelpDesk');
      else if (hasAccess("GRIEVANCE")) navigate('/Grievance');
    }
    setIsSupportOpen(!isSupportOpen);
    // Close other parent modules when opening this one
    setIsEmployeeHubOpen(false);
    setIsOrganizationOpen(false);
    setIsOnboardingOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsReimbursementsOpen(false);
    setIsEmployeePayOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);
  };
  const toggleMyTasksMenu = () => {
    if (!isMyTasksOpen) {
      navigate('/approval-requests', { state: { activeSubModule: 'Pending Actions' } });
      window.dispatchEvent(new CustomEvent('updateSubModule', { detail: 'Pending Actions' }));
    }
    setIsMyTasksOpen(!isMyTasksOpen);
    // Close other parent modules when opening this one
    setIsEmployeeHubOpen(false);
    setIsOrganizationOpen(false);
    setIsOnboardingOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsReimbursementsOpen(false);
    setIsEmployeePayOpen(false);
    setIsContractOpen(false);
    setIsSupportOpen(false);
  };
  const hasAccess = (moduleName) => {
    const normalizedName = moduleName.toUpperCase().replace(/\s+/g, '_');

    // =====================================================
    // SUPER ADMIN / APPLICATION OWNER
    // =====================================================
    const tenantId = sessionStorage.getItem("tenantId");

    // Application owner bypass removed since super admin is migrated
    if (!tenantId || tenantId === "null" || tenantId === "") {
      return false;
    }

    // =====================================================
    // TENANT LEVEL ACCESS
    // =====================================================
    const tenantModules = sessionStorage.getItem("moduleAccess");

    if (tenantModules && tenantModules !== "ALL") {
      const allowedTenantModules = tenantModules
        .split(",")
        .map(m => m.trim().toUpperCase().replace(/\s+/g, '_'));

      const tenantHasAccess = allowedTenantModules.includes(normalizedName);

      if (!tenantHasAccess) {
        return false;
      }
    }

    // =====================================================
    // EMPLOYEE LEVEL ACCESS
    // =====================================================

    const normalizedManagedModules = MANAGED_MODULES.map(m => m.toUpperCase().replace(/\s+/g, '_'));
    const isManagedModule = normalizedManagedModules.includes(normalizedName);

    // Non-managed modules visible to everyone
    if (!isManagedModule) {
      return true;
    }

    // Tenant Admins/Sub Admins get implicit access to the ADMIN module so they can manage permissions
    const upperRole = (userRole || "").toUpperCase();
    const isSubAdmin = sessionStorage.getItem("isSubAdmin") === "true";
    if (normalizedName === "ADMIN" && (upperRole === "ADMIN" || upperRole === "SUB ADMIN" || upperRole === "SUB_ADMIN" || isSubAdmin)) {
      return true;
    }

    // Wait until API completes
    if (!isAccessLoaded) {
      return false;
    }

    // Only explicitly assigned employees can see
    return userModules.includes(normalizedName);
  };

  const fetchModuleAccess = async () => {
    if (!employeeId || !token) return;

    try {
      const res = await api.get(
        `/v1/module-access/employee/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allowedModules = Object.keys(res.data)
        .filter(k => res.data[k] === true)
        .map(k => k.toUpperCase().replace(/\s+/g, '_'));

      setUserModules(allowedModules);
      setIsAccessLoaded(true);
    } catch (err) {
      console.error("Module access fetch failed", err);
      setUserModules([]);
      setIsAccessLoaded(true);
    }
  };

  const fetchNotifications = async () => {
    if (!employeeId || !token) return;
    try {
      // Using 'api' for consistency, but your original code used 'fetch' with a hardcoded URL.
      // Assuming 'api' is configured to handle the base URL.
      const res = await api.get(`/notifications/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data; // Assuming axios/api returns data in .data



      setNotifications(data);
      const unread = data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      // Optionally, set unreadCount to 0 on failure
      setUnreadCount(0);
    }
  };

  const fetchTaskCounts = async () => {
    if (!employeeId || !token) return;
    try {
      const res = await api.get(`/task-counts/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaskCounts(res.data);
    } catch (err) {
      console.error("Failed to fetch task counts:", err);
    }
  };

  // Function to fetch initial profile data
  const fetchProfileData = async () => {
    if (employeeId && token) {
      try {
        const response = await api.get(`/profile/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;

        if (data.profilePic) {
          setProfilePic(data.profilePic);
          sessionStorage.setItem("employeeProfilePic", data.profilePic);
        }
        if (data.firstName && data.lastName) {
          const fullName = `${data.firstName} ${data.lastName}`;
          setEmployeeName(fullName);
          sessionStorage.setItem("employeeName", fullName);
        }

      } catch (err) {
        console.error("Failed to fetch profile info:", err);
      }
    }
  };

  // Effect for notifications interval
  // Dedicated polling effect for notifications and task counts (optimized to 15 seconds)
  useEffect(() => {
    fetchNotifications();
    fetchTaskCounts();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchTaskCounts();
    }, 15000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array for mount-only fetch

  // Effect for profile data fetch and event listener
  useEffect(() => {
    setUserRole(sessionStorage.getItem("role") || "");
    fetchProfileData();
    fetchModuleAccess();
    fetchRoles();

    const handleProfilePicUpdate = () => {
      // Read from sessionStorage after update event
      const updatedPic = sessionStorage.getItem("employeeProfilePic");
      if (updatedPic) {
        setProfilePic(updatedPic);
      }
    };

    window.addEventListener('profilePicUpdated', handleProfilePicUpdate);

    return () => {
      window.removeEventListener('profilePicUpdated', handleProfilePicUpdate);
    };
  }, []); // Empty dependency array for mount-only fetch
  useEffect(() => {
    if (!token) return;

    const fetchPendingPolicies = () => {
      api.get("/policies/pending", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            setPendingPoliciesCount(res.data.length);
          }
        })
        .catch(err => {
          console.error("Failed to load pending policies in sidebar", err);
        });
    };

    fetchPendingPolicies();

    window.addEventListener("refreshPendingPoliciesCount", fetchPendingPolicies);
    return () => {
      window.removeEventListener("refreshPendingPoliciesCount", fetchPendingPolicies);
    };
  }, []); // Empty dependency array for mount-only fetch

  // Effect to automatically open parent menu based on current route
  useEffect(() => {
    const currentPath = location.pathname.toLowerCase();

    // Close all menus first
    setIsEmployeeHubOpen(false);
    setIsOrganizationOpen(false);
    setIsOnboardingOpen(false);
    setIsTimeAttendanceOpen(false);
    setIsReimbursementsOpen(false);
    setIsEmployeePayOpen(false);
    setIsSupportOpen(false);
    setIsContractOpen(false);
    setIsMyTasksOpen(false);

    // Open the appropriate menu based on current path
    if (currentPath.startsWith('/profilesettings') ||
      currentPath.startsWith('/allocationspage') ||
      currentPath.startsWith('/documenthub')) {
      setIsEmployeeHubOpen(true);
    } else if (currentPath.startsWith('/employeedirectory') ||
      currentPath.startsWith('/orgchart') ||
      currentPath.startsWith('/holidaycalender') ||
      currentPath.startsWith('/employeehandbook') ||
      currentPath.startsWith('/employeeknowledgehub')) {
      setIsOrganizationOpen(true);
    } else if (currentPath.startsWith('/preonboarding') ||
      currentPath.startsWith('/onboarding')) {
      setIsOnboardingOpen(true);
    } else if (currentPath.startsWith('/leaves') ||
      currentPath.startsWith('/timesheet')) {
      setIsTimeAttendanceOpen(true);
    } else if (currentPath.startsWith('/claims') ||
      currentPath.startsWith('/travels')) {
      setIsReimbursementsOpen(true);
    } else if (currentPath.startsWith('/compensationmanagement') ||
      currentPath.startsWith('/payrollmanagement') ||
      currentPath.startsWith('/ytdreport') ||
      currentPath.startsWith('/itdeclaration')) {
      setIsEmployeePayOpen(true);
    } else if (currentPath.startsWith('/assetmanagement')) {
      // Asset Management is now standalone, no parent menu to open
    } else if (currentPath.startsWith('/helpdesk') ||
      currentPath.startsWith('/grievance')) {
      setIsSupportOpen(true);
    } else if (currentPath.startsWith('/customers') ||
      currentPath.startsWith('/sows') ||
      currentPath.startsWith('/projects') ||
      currentPath.startsWith('/allocation')) {
      setIsContractOpen(true);
    } else if (currentPath.startsWith('/approval-requests')) {
      setIsMyTasksOpen(true);
    }
  }, [location.pathname]);


  // Effect to close profile dropdown when clicking outside
  // useEffect(() => {
  //   function handleClickOutside(event) {
  //     if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
  //       setProfileOpen(false);
  //     }
  //   }
  //   if (profileOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [profileOpen]);

  const handleBellClick = () => {
    navigate("/Notifications");
  };

  const toggleSidebar = () => {
    if (!isDesktopFrozen) {
      setIsCollapsed(!isCollapsed);
    }
  };
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleDesktopFreeze = () => {
    const newFrozenState = !isDesktopFrozen;
    setIsDesktopFrozen(newFrozenState);
    // Save to sessionStorage for persistence across modules
    sessionStorage.setItem('sidebarFrozen', newFrozenState.toString());

    // If unfreezing, collapse the sidebar
    if (!newFrozenState) {
      setIsCollapsed(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    const workspaceBase = getDynamicIAMLoginUrl();
    window.location.href = `${workspaceBase}/Home`;
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    navigate("/ProfileSettings"); // Navigate to the separate settings page
  };

  const getLinkStyle = (path) => {
    const currentPath = location.pathname;
    let isActive = false;

    const modulePaths = {
      "/Claims": ['/new', '/claims/status', '/claims/history', '/drafts', '/task', '/manager-dashboard', '/finance-dashboard'],
      "/TimeSheet": ['/mngtime', '/mngreq', '/hrgreq', '/timesheets', '/MyTimeSheets', '/MyTeam'],
      "/Leaves": ['/manager/tasks', '/hr/tasks', '/saved-drafts', '/leave-history', '/myteam2'],
      "/PerformanceManagement": ['/goals', '/selfassessment', '/myteam', '/myteam/newgoal', '/managergoals', '/reviewer', '/GoalsPage', '/inprogressgoals', '/submittedgoals', '/rejectedgoals', '/pendinggoals', "/ReviewerGoalsPage", '/hrgoals', "/HrGoalsPage", '/submitfeedback', '/goalhistory'],
      "/Travels": ['/myteam3'],
      "/CompensationManagement": [],
      "/ITDeclaration": [],
      "/ContractManagement": ['/Customers', '/Sows', '/Projects', '/Allocations'],
      "/Reports": [],
      "/approval-requests": [],
      // "/LMS": [],
      "/Organization": ['/EmployeeDirectory', '/OrgChart', '/HolidayCalender', '/EmployeeHandBook', '/EmployeeKnowledgeHub'],
      "/AssetManagement": [],
      "/ExitManagement": [],
    };

    const associatedPaths = modulePaths[path] || [];

    if (associatedPaths.includes(currentPath) || currentPath === path || (path === "/contract-management" && ['/Customers', '/Sows', '/Projects'].some(p => currentPath.startsWith(p)))) {
      isActive = true;
    }

    return {
      textDecoration: 'none',
      color: isActive ? '#FFFFFF' : '#1F2937',
      background: isActive ? '#0B3D91' : 'transparent',
    };
  };

  // Effect to close profile dropdown when clicking outside
  // useEffect(() => {
  //   function handleClickOutside(event) {
  //     if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
  //       setProfileOpen(false);
  //     }
  //   }
  //   if (profileOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [profileOpen]);

  const getSubLinkStyle = (path) => {
    const currentPath = location.pathname;
    let isActive = currentPath.toLowerCase().startsWith(path.toLowerCase());

    return {
      textDecoration: 'none',
      color: isActive ? '#1F6FEB' : '#1F2937',
      fontSize: '14px',
      display: 'block',
      padding: '4px 0',
      backgroundColor: 'transparent',
      borderRadius: '4px',
      paddingLeft: '8px',
      transition: 'all 0.3s ease',
    };
  };

  // Effect to close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Effect to close profile dropdown when mouse leaves sidebar
  useEffect(() => {
    const handleMouseLeaveSidebar = () => {
      if (profileOpen) {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        // Set a small delay to allow moving to dropdown if it's positioned outside sidebar
        hoverTimeoutRef.current = setTimeout(() => {
          setProfileOpen(false);
        }, 300);
      }
    };

    const handleMouseEnterSidebar = () => {
      // Clear timeout when mouse re-enters sidebar
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };

    const handleMouseEnterDropdown = () => {
      // Clear timeout when mouse enters the dropdown
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };

    const handleMouseLeaveDropdown = () => {
      if (profileOpen) {
        // Set timeout when mouse leaves dropdown
        hoverTimeoutRef.current = setTimeout(() => {
          setProfileOpen(false);
        }, 200);
      }
    };

    const sidebar = document.querySelector('.sidebar');
    const dropdowns = document.querySelectorAll('.sidebar-profile-dropdown');

    if (sidebar) {
      sidebar.addEventListener('mouseleave', handleMouseLeaveSidebar);
      sidebar.addEventListener('mouseenter', handleMouseEnterSidebar);
    }

    // Add event listeners to dropdown elements
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('mouseenter', handleMouseEnterDropdown);
      dropdown.addEventListener('mouseleave', handleMouseLeaveDropdown);
    });

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (sidebar) {
        sidebar.removeEventListener('mouseleave', handleMouseLeaveSidebar);
        sidebar.removeEventListener('mouseenter', handleMouseEnterSidebar);
      }
      dropdowns.forEach(dropdown => {
        dropdown.removeEventListener('mouseenter', handleMouseEnterDropdown);
        dropdown.removeEventListener('mouseleave', handleMouseLeaveDropdown);
      });
    };
  }, [profileOpen]);

  const renderMenuItems = () => (
    <>
      <h3><Link to="/Home" className="side" style={getLinkStyle("/Home")}><span className="sidebar-link-text"><i className="bi bi-house-door"></i> Home</span></Link></h3>
      <h3><NavLink to="/analytics" className={({ isActive }) => `side ${isActive ? 'active' : ''}`} style={({ isActive }) => isActive ? { textDecoration: 'none', color: '#FFFFFF', background: '#0B3D91' } : { textDecoration: 'none', color: '#1F2937', background: 'transparent' }}><span className="sidebar-link-text"><i className="bi bi-graph-up"></i> Analytics</span></NavLink></h3>
      {canViewMyTasks && (
        <>
          <h3 style={{ margin: '0.1rem 0' }}>
            <div
              className="side"
              onClick={toggleMyTasksMenu}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isMyTasksOpen ? '#FFFFFF' : '#1F2937',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isMyTasksOpen
                  ? '#0B3D91' : 'transparent',
                boxShadow: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="bi bi-check-square"></i> My Tasks
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {taskCounts.total > 0 && !isMyTasksOpen && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      flexShrink: 0,
                      fontSize: '10px',
                      fontWeight: '700',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      borderRadius: '4px',
                      border: 'none',
                      boxShadow: '0 2px 5px rgba(239, 68, 68, 0.3)',
                      marginLeft: '4px'
                    }}>
                      {taskCounts.total}
                    </span>
                  )}
                  <i
                    className={`bi ${isMyTasksOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                    style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
                  ></i>
                </span>
              </span>
            </div>
          </h3>

          {isMyTasksOpen && (
            <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
              <li style={{ marginBottom: '6px' }}>
                <Link
                  to="/approval-requests"
                  state={{ activeSubModule: 'Pending Actions' }}
                  style={{
                    ...getSubLinkStyle('/approval-requests'),
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    color: location.pathname === '/approval-requests' && location.state?.activeSubModule !== 'Delegation' ? '#1F6FEB' : '#1F2937'
                  }}
                  onClick={() => {
                    setIsMyTasksOpen(true);
                    window.dispatchEvent(new CustomEvent('updateSubModule', { detail: 'Pending Actions' }));
                  }}
                >
                  <i className="bi bi-inbox" style={{ marginRight: '0.5rem' }}></i>
                  <span style={{ flexGrow: 1 }}>Pending Actions</span>
                  {taskCounts.total > 0 && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '700',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      borderRadius: '4px',
                      marginLeft: 'auto',
                      marginRight: '8px'
                    }}>
                      {taskCounts.total}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/approval-requests"
                  state={{ activeSubModule: 'Delegation' }}
                  style={{
                    ...getSubLinkStyle('/approval-requests'),
                    backgroundColor: 'transparent',
                    color: location.pathname === '/approval-requests' && location.state?.activeSubModule === 'Delegation' ? '#1F6FEB' : '#1F2937'
                  }}
                  onClick={(e) => {
                    if (location.pathname === '/approval-requests') {
                      window.dispatchEvent(new CustomEvent('updateSubModule', { detail: 'Delegation' }));
                    }
                  }}
                >
                  <i className="bi bi-person-gear" style={{ marginRight: '0.5rem' }}></i>
                  Manage Delegations
                </Link>
              </li>
            </ul>
          )}
        </>
      )}

      {/* Employee Hub Parent Module */}
      {(hasAccess("MY PROFILE") || hasAccess("ALLOCATIONS") || hasAccess("DOCUMENT HUB")) && (
        <>
          <h3 style={{ margin: '0.1rem 0' }}>
            <div
              className="side"
              onClick={toggleEmployeeHubMenu}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isEmployeeHubOpen ? '#FFFFFF' : '#1F2937',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isEmployeeHubOpen
                  ? '#0B3D91' : 'transparent',
                boxShadow: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="bi bi-building"></i> People
                </span>
                <i
                  className={`bi ${isEmployeeHubOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
                ></i>
              </span>
            </div>
          </h3>

          {isEmployeeHubOpen && (
            <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
              {hasAccess("MY PROFILE") && (
                <li>
                  <Link to="/ProfileSettings" style={getSubLinkStyle('/profilesettings')}>
                    <i className="bi bi-person-circle" style={{ marginRight: '0.5rem' }}></i>
                    My Profile
                  </Link>
                </li>
              )}
              {hasAccess("ALLOCATIONS") && (
                <li>
                  <Link to="/AllocationsPage" style={getSubLinkStyle('/allocationspage')}>
                    <i className="bi bi-diagram-3" style={{ marginRight: '0.5rem' }}></i>
                    Allocations
                  </Link>
                </li>
              )}
              {hasAccess("DOCUMENT HUB") && (
                <li>
                  <Link to="/documenthub" style={getSubLinkStyle('/documenthub')}>
                    <i className="bi bi-folder" style={{ marginRight: '0.5rem' }}></i>
                    My Documents
                  </Link>
                </li>
              )}
            </ul>
          )}
        </>
      )}

      {/* Organization Parent Module */}
      {(hasAccess("EMPLOYEE DIRECTORY") || hasAccess("HOLIDAY CALENDAR") || hasAccess("HANDBOOK") || hasAccess("KNOWLEDGE_HUB")) && (
        <>
          <h3 style={{ margin: '0.1rem 0' }}>
            <div
              className="side"
              onClick={toggleOrganizationMenu}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isOrganizationOpen ? '#FFFFFF' : '#1F2937',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isOrganizationOpen
                  ? '#0B3D91' : 'transparent',
                boxShadow: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="bi bi-diagram-3"></i> Organization
                  {pendingPoliciesCount > 0 && (
                    <span
                      className="sidebar-red-dot"
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        marginLeft: '4px'
                      }}
                    />
                  )}
                </span>
                <i
                  className={`bi ${isOrganizationOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
                ></i>
              </span>
            </div>
          </h3>

          {isOrganizationOpen && (
            <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
              {hasAccess("EMPLOYEE DIRECTORY") && (
                <li>
                  <Link to="/EmployeeDirectory" style={getSubLinkStyle('/employeedirectory')}>
                    <i className="bi bi-people" style={{ marginRight: '0.5rem' }}></i>
                    Directory
                  </Link>
                </li>
              )}
              <li>
                <Link to="/OrgChart" style={getSubLinkStyle('/orgchart')}>
                  <i className="bi bi-diagram-3" style={{ marginRight: '0.5rem' }}></i>
                  Org Chart
                </Link>
              </li>
              {hasAccess("HOLIDAY CALENDAR") && (
                <li>
                  <Link to="/HolidayCalender" style={getSubLinkStyle('/holidaycalender')}>
                    <i className="bi bi-calendar-event" style={{ marginRight: '0.5rem' }}></i>
                    Holiday Calendar
                  </Link>
                </li>
              )}
              {hasAccess("HANDBOOK") && (
                <li>
                  <Link to="/EmployeeHandBook" style={{ ...getSubLinkStyle('/employeehandbook'), display: 'flex', alignItems: 'center' }}>
                    <i className="bi bi-book" style={{ marginRight: '0.5rem' }}></i>
                    Policies
                    {pendingPoliciesCount > 0 && (
                      <span
                        className="sidebar-pending-count"
                        style={{
                          marginLeft: 'auto',
                          marginRight: '1rem',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          display: 'inline-block'
                        }}
                      >
                        {pendingPoliciesCount}
                      </span>
                    )}
                  </Link>
                </li>
              )}
              {hasAccess("KNOWLEDGE_HUB") && (
                <li>
                  <Link to="/EmployeeKnowledgeHub" style={getSubLinkStyle('/employeeknowledgehub')}>
                    <i className="bi bi-book-half" style={{ marginRight: '0.5rem' }}></i>
                    Knowledge Hub
                  </Link>
                </li>
              )}
            </ul>
          )}
        </>
      )}


      {/* Employee Onboarding Parent Module */}
      {(hasAccess("PRE_ONBOARDING") || hasAccess("ONBOARDING")) && (
        <>
          <h3 style={{ margin: '0.1rem 0' }}>
            <div
              className="side"
              onClick={toggleOnboardingMenu}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isOnboardingOpen ? '#FFFFFF' : '#1F2937',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isOnboardingOpen
                  ? '#0B3D91' : 'transparent',
                boxShadow: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="bi bi-person-plus"></i> Onboarding
                </span>
                <i
                  className={`bi ${isOnboardingOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
                ></i>
              </span>
            </div>
          </h3>

          {isOnboardingOpen && (
            <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
              {hasAccess("PRE_ONBOARDING") && (
                <li>
                  <Link to="/Preonboarding" style={getSubLinkStyle('/preonboarding')}>
                    <i className="bi bi-person-plus" style={{ marginRight: '0.5rem' }}></i>
                    Pre-onboarding
                  </Link>
                </li>
              )}
              {hasAccess("ONBOARDING") && (
                <li>
                  <Link to="/Onboarding" style={getSubLinkStyle('/onboarding')}>
                    <i className="bi bi-person-check" style={{ marginRight: '0.5rem' }}></i>
                    Onboarding
                  </Link>
                </li>
              )}
            </ul>
          )}
        </>
      )}

      {/* Time & Attendance Parent Module */}
      {(hasAccess("LEAVES") || hasAccess("TIMESHEET")) && (
        <>
          <h3 style={{ margin: '0.1rem 0' }}>
            <div
              className="side"
              onClick={toggleTimeAttendanceMenu}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isTimeAttendanceOpen ? '#FFFFFF' : '#1F2937',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isTimeAttendanceOpen
                  ? '#0B3D91' : 'transparent',
                boxShadow: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="bi bi-clock"></i> Time & Attendance
                </span>
                <i
                  className={`bi ${isTimeAttendanceOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
                ></i>
              </span>
            </div>
          </h3>

          {isTimeAttendanceOpen && (
            <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
              {hasAccess("TIMESHEET") && (
                <li>
                  <Link to="/TimeSheet" style={getSubLinkStyle('/timesheet')}>
                    <i className="bi bi-clock-history" style={{ marginRight: '0.5rem' }}></i>
                    Attendance
                  </Link>
                </li>
              )}
              {hasAccess("LEAVES") && (
                <li>
                  <Link to="/Leaves" style={getSubLinkStyle('/leaves')}>
                    <i className="bi bi-calendar-check" style={{ marginRight: '0.5rem' }}></i>
                    Leaves
                  </Link>
                </li>
              )}
            </ul>
          )}
        </>
      )}

      {/* Reimbursements Individual Module */}
      {hasAccess("CLAIMS") && (
        <h3 style={{ margin: '0.1rem 0' }}>
          <Link to="/Claims" className="side" style={getLinkStyle("/Claims")}>
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-receipt"></i> Reimbursements
              </span>
              <i className="bi bi-chevron-right standalone-chevron" style={{ fontSize: '0.75rem' }}></i>
            </span>
          </Link>
        </h3>
      )}

      {/* Travel Management Individual Module */}
      {hasAccess("TRAVELS") && (
        <h3 style={{ margin: '0.1rem 0' }}>
          <Link to="/Travels" className="side" style={getLinkStyle("/Travels")}>
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-airplane"></i> Travel Management
              </span>
              <i className="bi bi-chevron-right standalone-chevron" style={{ fontSize: '0.75rem' }}></i>
            </span>
          </Link>
        </h3>
      )}

      {/* Employee Pay Parent Module - Always visible to employees */}
      {(hasAccess("PAYSLIPS") || hasAccess("COMPENSATION") || hasAccess("IT DECLARATION")) && (
        <>
          <h3 style={{ margin: '0.1rem 0' }}>
            <div
              className="side"
              onClick={toggleEmployeePayMenu}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isEmployeePayOpen ? '#FFFFFF' : '#1F2937',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isEmployeePayOpen
                  ? '#0B3D91' : 'transparent',
                boxShadow: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="bi bi-credit-card"></i> Salary
                </span>
                <i
                  className={`bi ${isEmployeePayOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
                ></i>
              </span>
            </div>
          </h3>

          {isEmployeePayOpen && (
            <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
              {hasAccess("COMPENSATION") && (
                <li>
                  <Link to="/CompensationManagement" style={getSubLinkStyle('/compensationmanagement')}>
                    <i className="bi bi-cash-stack" style={{ marginRight: '0.5rem' }}></i>
                    Compensation
                  </Link>
                </li>
              )}
              {hasAccess("PAYSLIPS") && (
                <li>
                  <Link to="/PayrollManagement" style={getSubLinkStyle('/payrollmanagement')}>
                    <i className="bi bi-cash-stack" style={{ marginRight: '0.5rem' }}></i>
                    Payslips
                  </Link>
                </li>
              )}
              {hasAccess("IT DECLARATION") && (
                <li>
                  <Link to="/ITDeclaration" style={getSubLinkStyle('/itdeclaration')}>
                    <i className="bi bi-file-earmark-medical" style={{ marginRight: '0.5rem' }}></i>
                    IT Declaration
                  </Link>
                </li>
              )}
              {hasAccess("YTD REPORT") && (
                <li>
                  <Link to="/YTDReport" style={getSubLinkStyle('/ytdreport')}>
                    <i className="bi bi-file-earmark-bar-graph" style={{ marginRight: '0.5rem' }}></i>
                    YTD Reports
                  </Link>
                </li>
              )}
            </ul>
          )}
        </>
      )}

      {/* Standalone Asset Management */}
      {hasAccess("ASSET MANAGEMENT") && (
        <h3>
          <Link to="/AssetManagement" className="side" style={getLinkStyle("/AssetManagement")}>
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-archive"></i> Asset Management
              </span>
              <i className="bi bi-chevron-right standalone-chevron" style={{ fontSize: '0.75rem' }}></i>
            </span>
          </Link>
        </h3>
      )}

      {/* Standalone Exit Management */}
      {hasAccess("EXIT MANAGEMENT") && (
        <h3>
          <Link to="/ExitManagement" className="side" style={getLinkStyle("/ExitManagement")}>
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-door-open"></i> Exit Management
              </span>
              <i className="bi bi-chevron-right standalone-chevron" style={{ fontSize: '0.75rem' }}></i>
            </span>
          </Link>
        </h3>
      )}

      {/* Support Parent Module */}
      {(hasAccess("HELPDESK") || hasAccess("GRIEVANCE")) && (
        <>
          <h3 style={{ margin: '0.1rem 0' }}>
            <div
              className="side"
              onClick={toggleSupportMenu}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isSupportOpen ? '#FFFFFF' : '#1F2937',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isSupportOpen
                  ? '#0B3D91' : 'transparent',
                boxShadow: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="bi bi-headset" style={{ color: '#898a8d' }}></i> Support
                </span>
                <i
                  className={`bi ${isSupportOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
                ></i>
              </span>
            </div>
          </h3>

          {isSupportOpen && (
            <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
              {hasAccess("HELPDESK") && (
                <li>
                  <Link to="/HelpDesk" style={getSubLinkStyle('/helpdesk')}>
                    <i className="bi bi-headset" style={{ marginRight: '0.5rem' }}></i>
                    Helpdesk
                  </Link>
                </li>
              )}
              {hasAccess("GRIEVANCE") && (
                <li>
                  <Link to="/Grievance" style={getSubLinkStyle('/grievance')}>
                    <i className="bi bi-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                    Grievance
                  </Link>
                </li>
              )}
            </ul>
          )}
        </>
      )}

      {/* Contract Management Standalone Module */}
      {hasAccess("CONTRACT MANAGEMENT") && (
        <h3 style={{ margin: '0.1rem 0' }}>
          <div
            className="side"
            onClick={toggleContractMenu}
            style={{
              display: 'block',
              padding: '0.5rem 1rem',
              fontSize: '0.9375rem',
              fontWeight: '500',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: isContractOpen ? '#FFFFFF' : '#1F2937',
              textDecoration: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              background: isContractOpen
                ? '#0B3D91' : 'transparent',
              boxShadow: 'none',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-file-earmark"></i> Contract Management
              </span>
              <i
                className={`bi ${isContractOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                style={{ fontSize: '0.75rem', transition: 'transform 0.3s ease' }}
              ></i>
            </span>
          </div>
        </h3>
      )}

      {isContractOpen && (
        <ul style={{ listStyle: 'none', paddingLeft: '2rem', marginTop: '0.5rem' }}>
          <li>
            <Link to="/Customers" style={getSubLinkStyle('/customers')}>
              <i className="bi bi-building" style={{ marginRight: '0.5rem' }}></i>
              Customers
            </Link>
          </li>
          <li>
            <Link to="/Sows" style={getSubLinkStyle('/sows')}>
              <i className="bi bi-file-text" style={{ marginRight: '0.5rem' }}></i>
              SOWs/POs
            </Link>
          </li>
          <li>
            <Link to="/Projects" style={getSubLinkStyle('/projects')}>
              <i className="bi bi-kanban" style={{ marginRight: '0.5rem' }}></i>
              Projects
            </Link>
          </li>
          <li>
            <Link to="/Allocations" style={getSubLinkStyle('/allocation')}>
              <i className="bi bi-diagram-2" style={{ marginRight: '0.5rem' }}></i>
              Allocation
            </Link>
          </li>
        </ul>
      )}
      {hasAccess("PERFORMANCE MANAGEMENT") && (
        <h3>
          <Link to="/PerformanceManagement" className="side" style={getLinkStyle("/PerformanceManagement")}>
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-graph-up-arrow"></i> Performance Management
              </span>
              <i className="bi bi-chevron-right standalone-chevron" style={{ fontSize: '0.75rem' }}></i>
            </span>
          </Link>
        </h3>
      )}
      {/* LMS Module */}
      {/* {hasAccess("LMS") && (
        <h3>
          <Link
            to="/LMS"
            className="side"
            style={getLinkStyle("/LMS")}
          >
            <span className="sidebar-link-text">
              <i className="bi bi-mortarboard"></i> LMS
            </span>
          </Link>
        </h3>
      )} */}

      {hasAccess("REPORTS") && (
        <h3>
          <Link
            to="/Reports"
            className="side"
            style={getLinkStyle("/Reports")}
          >
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-bar-chart"></i> Reports
              </span>
              <i className="bi bi-chevron-right standalone-chevron" style={{ fontSize: '0.75rem' }}></i>
            </span>
          </Link>
        </h3>
      )}


      {(hasAccess("ADMIN") || roles.admin) && (
        <h3>
          <Link
            to="/Admin"
            className="side"
            style={getLinkStyle("/Admin")}
            onClick={() => {
              sessionStorage.removeItem("selectedAdminModule");
              if (location.pathname === "/Admin") {
                window.location.reload();
              }
            }}
          >
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-shield-lock"></i> Admin
              </span>
              <i className="bi bi-chevron-right standalone-chevron" style={{ fontSize: '0.75rem' }}></i>
            </span>
          </Link>
        </h3>
      )}




    </>
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar (Desktop/Tablet) */}
      <div
        className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} desktop-frozen`}
      >

        <div className="sidebar-main-content">
          {!isCollapsed ? (
            <>
              <div className="sidebar-user-section" ref={profileDropdownRef}>
                <div className="user-profile-info" onClick={toggleProfileMenu}>
                  <div className="user-avatar-wrapper">
                    {profilePic && !profilePic.includes('OIP.jpg') ? (
                      <img src={profilePic} alt="Profile" className="sidebar-profile-pic" />
                    ) : (
                      <div className="sidebar-profile-placeholder">
                        {employeeName ? employeeName.trim().charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    {unreadCount > 0 && <span className="notification-badge-dot"></span>}
                  </div>
                  <div className="user-text-info">
                    <span className="user-name">{employeeName}</span>
                    <span className="user-id">{getDisplayEmployeeId(employeeId)}</span>
                  </div>
                  <div className="sidebar-actions-wrapper">
                    <div className="sidebar-bell-wrapper" onClick={(e) => { e.stopPropagation(); handleBellClick(); }}>
                      <i className="bi bi-bell"></i>
                      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                    </div>
                  </div>
                </div>

                {profileOpen && (
                  <div className="sidebar-profile-dropdown">
                    <button onClick={handleEditProfile}><i className="bi bi-person-gear"></i> Edit Profile</button>
                    <button onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Logout</button>
                  </div>
                )}
              </div>

              <div className="sidebar-menu-items">
                {renderMenuItems()}
              </div>
            </>
          ) : (
            <div className="collapsed-wrapper">
              <div className="sidebar-user-section collapsed" ref={profileDropdownRef}>
                <div className="user-avatar-wrapper" onClick={toggleProfileMenu}>
                  {profilePic && !profilePic.includes('OIP.jpg') ? (
                    <img src={profilePic} alt="Profile" className="sidebar-profile-pic" />
                  ) : (
                    <div className="sidebar-profile-placeholder">
                      {employeeName ? employeeName.trim().charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  {unreadCount > 0 && <span className="notification-badge-dot"></span>}
                </div>
                {profileOpen && (
                  <div className="sidebar-profile-dropdown collapsed">
                    <div className="dropdown-header">
                      <strong>{employeeName}</strong>
                      <span>{getDisplayEmployeeId(employeeId)}</span>
                    </div>
                    <button onClick={handleBellClick}><i className="bi bi-bell"></i> Notifications ({unreadCount})</button>
                    <button onClick={toggleDesktopFreeze}><i className={`bi ${isDesktopFrozen ? 'bi-lock' : 'bi-unlock'}`}></i> {isDesktopFrozen ? 'Unfreeze' : 'Freeze'} Sidebar</button>
                    <button onClick={handleEditProfile}><i className="bi bi-person-gear"></i> Edit Profile</button>
                    <button onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Logout</button>
                  </div>
                )}
              </div>

              <div className="collapsed-menu-items">
                <Link to="/Home" className="collapsed-icon-link" title="Home" style={{ color: '#898a8d' }}><i className="bi bi-house-door"></i></Link>
                {canViewMyTasks && (
                  <Link to="/approval-requests" className="collapsed-icon-link" title="My Tasks" style={{
                    color: '#898a8d',
                    position: 'relative'
                  }}>
                    <i className="bi bi-check-square"></i>
                    {taskCounts.total > 0 && (
                      <span className="notification-count" style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        width: '16px',
                        height: '16px',
                        fontSize: '10px'
                      }}>
                        {taskCounts.total}
                      </span>
                    )}
                  </Link>
                )}

                <div className="collapsed-icon-link" title="People" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleEmployeeHubMenu}>
                  <i className="bi bi-building" style={{ color: isEmployeeHubOpen ? '#5eead4' : '#898a8d' }}></i>
                </div>
                <div className="collapsed-icon-link" title="Organization" style={{ color: '#898a8d', cursor: 'pointer', position: 'relative' }} onClick={toggleOrganizationMenu}>
                  <i className="bi bi-diagram-3" style={{ color: isOrganizationOpen ? '#5eead4' : '#898a8d' }}></i>
                  {pendingPoliciesCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                </div>

                <div className="collapsed-icon-link" title="Organization" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleOrganizationMenu}>
                  <i className="bi bi-diagram-3" style={{ color: isOrganizationOpen ? '#5eead4' : '#898a8d' }}></i>
                </div>

                {(hasAccess("PRE_ONBOARDING") || hasAccess("ONBOARDING")) && (
                  <div className="collapsed-icon-link" title="Employee Onboarding" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleOnboardingMenu}>
                    <i className="bi bi-person-plus" style={{ color: isOnboardingOpen ? '#5eead4' : '#898a8d' }}></i>
                  </div>
                )}

                {(hasAccess("LEAVES") || hasAccess("TIMESHEET")) && (
                  <div className="collapsed-icon-link" title="Time & Attendance" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleTimeAttendanceMenu}>
                    <i className="bi bi-clock" style={{ color: isTimeAttendanceOpen ? '#5eead4' : '#898a8d' }}></i>
                  </div>
                )}

                {(hasAccess("CLAIMS") || hasAccess("TRAVELS")) && (
                  <div className="collapsed-icon-link" title="Expenses" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleReimbursementsMenu}>
                    <i className="bi bi-cash" style={{ color: isReimbursementsOpen ? '#5eead4' : '#898a8d' }}></i>
                  </div>
                )}

                {(hasAccess("PAYSLIPS") || hasAccess("COMPENSATION") || hasAccess("IT DECLARATION")) && (
                  <div className="collapsed-icon-link" title="Salary" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleEmployeePayMenu}>
                    <i className="bi bi-credit-card" style={{ color: isEmployeePayOpen ? '#5eead4' : '#898a8d' }}></i>
                  </div>
                )}

                {hasAccess("ASSET MANAGEMENT") && (
                  <Link to="/AssetManagement" className="collapsed-icon-link" title="Asset Management" style={{ color: getLinkStyle("/AssetManagement").color === 'white' ? '#5eead4' : '#898a8d' }}><i className="bi bi-archive"></i></Link>
                )}

                {hasAccess("EXIT MANAGEMENT") && (
                  <Link to="/ExitManagement" className="collapsed-icon-link" title="Exit Management" style={{ color: getLinkStyle("/ExitManagement").color === 'white' ? '#5eead4' : '#898a8d' }}><i className="bi bi-door-open"></i></Link>
                )}

                {(hasAccess("HELPDESK") || hasAccess("GRIEVANCE")) && (
                  <div className="collapsed-icon-link" title="Support" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleSupportMenu}>
                    <i className="bi bi-headset" style={{ color: isSupportOpen ? '#5eead4' : '#898a8d' }}></i>
                  </div>
                )}

                {hasAccess("CONTRACT MANAGEMENT") && (
                  <div className="collapsed-icon-link" title="Contract Management" style={{ color: '#898a8d', cursor: 'pointer' }} onClick={toggleContractMenu}>
                    <i className="bi bi-file-earmark-text" style={{ color: isContractOpen ? '#5eead4' : '#898a8d' }}></i>
                  </div>
                )}

                {hasAccess("PERFORMANCE MANAGEMENT") && (
                  <Link to="/PerformanceManagement" className="collapsed-icon-link" title="Performance" style={{ color: getLinkStyle("/PerformanceManagement").color === 'white' ? '#5eead4' : '#898a8d' }}><i className="bi bi-graph-up-arrow"></i></Link>
                )}

                {/* {hasAccess("LMS") && (
                  <Link to="/LMS" className="collapsed-icon-link" title="LMS" style={{ color: getLinkStyle("/LMS").color === 'white' ? '#5eead4' : '#898a8d' }}><i className="bi bi-mortarboard"></i></Link>
                )} */}

                {hasAccess("REPORTS") && (
                  <Link to="/Reports" className="collapsed-icon-link" title="Reports" style={{ color: getLinkStyle("/Reports").color === 'white' ? '#5eead4' : '#898a8d' }}><i className="bi bi-bar-chart"></i></Link>
                )}

                {(hasAccess("ADMIN") || roles.admin) && (
                  <Link to="/Admin" className="collapsed-icon-link" title="Admin" style={{ color: getLinkStyle("/Admin").color === 'white' ? '#5eead4' : '#898a8d' }}><i className="bi bi-shield-lock"></i></Link>
                )}


              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 0 }}>

          {!isCollapsed ? (
            <div className="sidebar-logo-container" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', padding: '1rem 0 0 1.25rem', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <div className="logo-full" style={{ width: '130px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', margin: '0' }}>
                <img src={xevyteFullLogo} alt="Xevyte" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'left', margin: '0' }} />
              </div>
            </div>
          ) : (
            <div className="logo-icon-collapsed">
              <img src={xevyteIconLogo} alt="Xevyte" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu}>
          <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>

            {/* PROFILE DETAILS & BELL AT THE TOP */}
            <div className="mobile-menu-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                {profilePic && !profilePic.includes('OIP.jpg') ? (
                  <img src={profilePic} alt="Profile" className="mobile-profile-pic" style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #00B3A4'
                  }} />
                ) : (
                  <div className="mobile-profile-placeholder" style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    border: '2px solid #00B3A4'
                  }}>
                    {employeeName ? employeeName.trim().charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>{employeeName}</span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif" }}>{getDisplayEmployeeId(employeeId)}</span>
                </div>
              </div>

              {/* Bell + Close grouped tightly on the right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>

                {/* Notification Bell */}
                <button
                  onClick={handleBellClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    position: 'relative',
                    padding: '6px',
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="bi bi-bell"></i>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Close (X) Button */}
                <button
                  onClick={toggleMobileMenu}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    transition: 'background 0.2s ease, color 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
                  aria-label="Close menu"
                >
                  <i className="bi bi-x-lg"></i>
                </button>

              </div>
            </div>

            {/* SCROLLABLE MENU ITEMS */}
            <div className="mobile-menu-scrollable" style={{ flexGrow: 1, overflowY: 'auto' }}>
              {renderMenuItems()}
            </div>

            {/* STACKED PROFILE BUTTONS AT THE BOTTOM */}
            <div className="mobile-user-section" style={{
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              paddingTop: '1rem',
              marginTop: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              width: '100%'
            }}>
              <button
                onClick={handleEditProfile}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <i className="bi bi-person" style={{ fontSize: '1.1rem' }}></i> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <i className="bi bi-box-arrow-right" style={{ fontSize: '1.1rem' }}></i> Logout
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="main-content">
        {!isMobileMenuOpen && (
          <button className="hamburger-btn" onClick={toggleMobileMenu}>☰</button>
        )}
        {/* Render children component */}
        {children}
      </div>
    </div>
  );

};

export default Sidebar;
