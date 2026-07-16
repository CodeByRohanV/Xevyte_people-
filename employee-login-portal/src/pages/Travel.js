import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatDateToIST, getPropperDate, getISTAsDateObject } from '../utils/DateUtils';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Travel.css';
import Sidebar from './Sidebar.js';
import MyTeamTravel from './MyTeamTravel.js';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api";
import LocationAutocomplete from '../components/LocationAutocomplete';
import ToastNotification from '../components/ToastNotification';
const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

// ✅ Reformats approver display strings to: "Name (ID)(on behalf of OrigName (OrigID))"
// Handles missing spaces and prevents duplicate IDs from being rendered.
const formatApproverDisplay = (approverName, approverId) => {
  if (!approverName && !approverId) return null;
  const cleanId = getDisplayEmployeeId(approverId);
  if (!approverName) return `(${cleanId})`;

  let formattedName = approverName;

  // Clean up raw ID occurrences inside the name string if they exist
  if (approverId && formattedName.includes(approverId)) {
    formattedName = formattedName.replace(new RegExp(approverId, 'g'), cleanId);
  }

  // Clean up any other tenant-prefixed IDs embedded in the name
  formattedName = formattedName.replace(/\b([a-zA-Z0-9]+)(_|-)([a-zA-Z0-9]+)\b/g, (match, p1, p2, p3) => p3);

  // Fix spacing if there is no space before (on behalf of
  if (formattedName.includes(')(on behalf of')) {
    formattedName = formattedName.replace(')(on behalf of', ') (on behalf of');
  } else if (formattedName.includes('(on behalf of') && !formattedName.includes(' (on behalf of')) {
    formattedName = formattedName.replace('(on behalf of', ' (on behalf of');
  }

  // Old format: "Name (on behalf of OrigName)" with a separate approverId
  if (cleanId && formattedName.includes('(on behalf of')) {
    const onBehalfIdx = formattedName.indexOf('(on behalf of');
    const basePart = formattedName.substring(0, onBehalfIdx).trim();
    const onBehalfPart = formattedName.substring(onBehalfIdx).trim();

    if (!basePart.includes(cleanId)) {
      return `${basePart} (${cleanId}) ${onBehalfPart}`;
    }
  }

  if (cleanId && !formattedName.includes(cleanId)) {
    return `${formattedName} (${cleanId})`;
  }

  return formattedName;
};

function Travel() {
  const employeeId = sessionStorage.getItem("employeeId");
  const role = sessionStorage.getItem("role");
  const adminId = (role === "admin") ? employeeId : null;
  const [selectedFiles, setSelectedFiles] = useState({});
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName") || '');

  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [canViewTasks, setCanViewTasks] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [managerRequests, setManagerRequests] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('New Ticket');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState(false);
  const [draftsLoading, setDraftsLoading] = useState(false);


  const [newRequest, setNewRequest] = useState({
    name: '',
    fromLocation: '',
    toLocation: '',
    modeOfTravel: 'Select',
    category: 'Select',
    departureDate: '',
    returnDate: '',
    accommodationRequired: 'No',
    advanceRequired: 'No',
    remarks: '',
    employeeId: employeeId,
  });
  const [activeTickets, setActiveTickets] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [activeFetched, setActiveFetched] = useState(false);
  const [draftsFetched, setDraftsFetched] = useState(false);
  const [managerFetched, setManagerFetched] = useState(false);
  const [adminFetched, setAdminFetched] = useState(false);
  const [selectedTravelDetail, setSelectedTravelDetail] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusDetails, setStatusDetails] = useState(null);

  // DatePicker Custom Header States
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const [filters, setFilters] = useState({
    travelId: '',
    category: 'All',
    modeOfTravel: 'All',
    departDate: 'None',
    returnDate: 'None',
    fromLocation: '',
    toLocation: '',
    accommodationRequired: 'All',
    advanceRequired: 'All',
    remarks: '',
    status: 'All',
    rejectedReason: ''
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const [visibleFilter, setVisibleFilter] = useState(null); // stores the column name of the visible filter

  const toggleFilter = (columnName) => {
    setVisibleFilter(prev => (prev === columnName ? null : columnName));
  };

  const handleViewStatus = async (travel) => {
    try {
      let detail = { ...travel };
      let token = sessionStorage.getItem("token");
      if (!token) throw new Error("No token found");
      // Remove surrounding quotes if stored
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      // 1. Try to fetch real history from backend


      // 1. Synthesize approval history from the request object itself (since travel_request_history is decommissioned)

      // Fallback: If Approved/Processed but no manager/admin name, fetch it
      const isManagerApproved = ['Booking In Progress', 'Booked', 'Downloaded', 'Rejected'].includes(detail.status);

      if (isManagerApproved && !detail.managerName && detail.assignedManagerId) {
        try {
          const nameRes = await api.get(`/leaves/employee-name/${detail.assignedManagerId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'text'
          });
          detail.managerName = nameRes.data;
        } catch (e) { console.error("Failed to fetch manager name", e); }
      }

      const isAdminProcessed = (['Booked', 'Downloaded'].includes(detail.status)) || (detail.status === 'Rejected' && detail.approvedAt);
      if (isAdminProcessed && !detail.adminName) {
        // Try to use adminActorName first (set by backend when admin processes)
        if (!detail.adminActorName) {
          // Fallback: Try to fetch admin name if travelAdmin is a single ID (not comma-separated)
          if (detail.travelAdmin && !detail.travelAdmin.includes(',')) {
            try {
              const nameRes = await api.get(`/leaves/employee-name/${detail.travelAdmin}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'text'
              });
              detail.adminName = nameRes.data;
            } catch (e) { console.error("Failed to fetch admin name", e); }
          }
        }
      }

      // Also fetch admin name for pending requests if it's a single admin
      if (detail.status === 'Approved By Manager' && detail.travelAdmin && !detail.travelAdmin.includes(',') && !detail.adminName) {
        try {
          const nameRes = await api.get(`/leaves/employee-name/${detail.travelAdmin}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'text'
          });
          detail.adminName = nameRes.data;
        } catch (e) { console.error("Failed to fetch admin name", e); }
      }

      // Construct approval history
      const history = [];

      // 1. Created
      history.push({
        action: "SUBMITTED",
        approverRole: "Employee",
        approverName: detail.employeeName || "You",
        approverId: detail.employeeId,
        actionTimestamp: detail.createdAt || detail.createdDate
      });

      // 2. Manager Action (If approved)
      if (detail.approvedAt) {
        history.push({
          action: "APPROVED",
          approverRole: "Manager",
          approverName: detail.managerActorName || detail.managerName,
          approverId: detail.assignedManagerId,
          actionTimestamp: detail.approvedAt,
          delegatorId: detail.managerDelegatorId || null,
          delegatorName: detail.managerDelegatorName || null
        });
      }

      // 3. Pending with Travel Admin (if approved by manager but not yet booked)
      if (detail.status === 'Approved By Manager' && detail.travelAdmin) {
        // Show which travel admins it's assigned to
        const adminIds = detail.travelAdmin.split(',').map(id => id.trim());
        let adminDisplayName;
        if (adminIds.length > 1) {
          // Multiple admins - show as pool
          adminDisplayName = "Pending with Pool";
        } else {
          // Single admin - try to get their name (means someone has claimed it)
          adminDisplayName = detail.adminName || adminIds[0];
        }
        history.push({
          action: "PENDING",
          approverRole: "Travel Admin",
          approverName: adminDisplayName,
          approverId: detail.travelAdmin,
          actionTimestamp: detail.approvedAt || detail.updatedAt
        });
      }

      // 4. Final Action (Rejected, Cancelled, or Booked)
      if (detail.status === 'Rejected') {
        const isAdminRejection = !!detail.approvedAt;
        history.push({
          action: "REJECTED",
          approverRole: isAdminRejection ? "Travel Admin" : "Manager",
          approverName: isAdminRejection ? (detail.adminActorName || detail.adminName) : (detail.managerActorName || detail.managerName),
          approverId: isAdminRejection ? detail.travelAdmin : detail.assignedManagerId,
          actionTimestamp: detail.updatedAt,
          remarks: detail.rejectedReason,
          delegatorId: isAdminRejection ? (detail.adminDelegatorId || null) : (detail.managerDelegatorId || null),
          delegatorName: isAdminRejection ? (detail.adminDelegatorName || null) : (detail.managerDelegatorName || null)
        });
      } else if (detail.status === 'Cancelled') {
        history.push({
          action: "CANCELLED",
          approverRole: "Employee",
          approverName: detail.employeeName || "You",
          approverId: detail.employeeId,
          actionTimestamp: detail.updatedAt
        });
      } else if (['Booked', 'Downloaded'].includes(detail.status)) {
        history.push({
          action: "BOOKED",
          approverRole: "Travel Admin",
          approverName: detail.adminActorName || detail.adminName,
          approverId: detail.travelAdmin,
          actionTimestamp: detail.updatedAt,
          delegatorId: detail.adminDelegatorId || null,
          delegatorName: detail.adminDelegatorName || null
        });
      }

      detail.approvalHistory = history;
      setStatusDetails(detail);
      setStatusModalOpen(true);
    } catch (err) {
      console.error(err);
      // Fallback
      setStatusDetails(travel);
      setStatusModalOpen(true);
    }
  };

  useEffect(() => {
    if (!employeeId) return;

    const fetchAccessInfo = async () => {
      try {
        const token = sessionStorage.getItem("token"); // Get JWT
        const response = await api.get(`/access/assigned-ids/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { manager, travelAdmin } = response.data; // Use travelAdmin specifically for Travel module
        const canView = manager || travelAdmin;
        setCanViewTasks(canView);
        setIsManager(!!manager);
        setIsAdmin(!!travelAdmin);

        // Pre-fetch everything in parallel
        fetchAllData(!!manager, !!travelAdmin);
      } catch (err) {
        console.error("Error fetching task visibility:", err);
        setCanViewTasks(false); // Default to false if there's an error
        setIsManager(false);
        setIsAdmin(false);
        // Still try to fetch employee-only data
        fetchAllData(false, false);
      }
    };

    const fetchAllData = async (isMgr, isAdm) => {
      const token = sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Define all parallel fetches
      const tasks = [
        // 1. History
        api.get(`/travel/employee/all/${employeeId}`, { headers })
          .then(res => { setHistoryTickets(res.data); setHistoryFetched(true); })
          .catch(e => console.error("History fetch error:", e)),



        // 3. Drafts
        api.get(`/travel/drafts`, { headers, params: { employeeId } })
          .then(res => { setDrafts(res.data); setDraftsFetched(true); })
          .catch(e => console.error("Drafts fetch error:", e))
      ];

      // 4. Manager Requests
      if (isMgr) {
        tasks.push(
          api.get(`/travel/manager/pending/${employeeId}`, { headers })
            .then(res => { setManagerRequests(res.data); setManagerFetched(true); })
            .catch(e => console.error("Manager fetch error:", e))
        );
      } else {
        setManagerFetched(true); // Nothing to fetch
      }

      // 5. Admin Requests
      if (isAdm) {
        tasks.push(
          api.get(`/travel/admin/assigned-requests/${employeeId}`, { headers })
            .then(res => { setAdminRequests(res.data); setAdminFetched(true); })
            .catch(e => console.error("Admin fetch error:", e))
        );
      } else {
        setAdminFetched(true); // Nothing to fetch
      }

      setHistoryLoading(true);
      setDraftsLoading(true);

      await Promise.all(tasks);

      setHistoryLoading(false);

      setDraftsLoading(false);
    };

    fetchAccessInfo();

  }, [employeeId]);

  const isValidDepartureDate = (date, category) => {
    // getPropperDate returns YYYY-MM-DD string of IST
    const todayStr = getPropperDate();
    const today = new Date(todayStr); // Local midnight of that IST date
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      alert("Departure date cannot be in the past.");
      return false;
    }

    return true;
  };

  const filteredHistory = useMemo(() => {
    let filtered = [...historyTickets];

    // Apply filters
    if (filters.travelId) {
      filtered = filtered.filter(ticket => ticket.id.toString().includes(filters.travelId));
    }
    if (filters.category !== 'All') {
      filtered = filtered.filter(ticket => ticket.category === filters.category);
    }
    if (filters.modeOfTravel !== 'All') {
      filtered = filtered.filter(ticket => ticket.modeOfTravel === filters.modeOfTravel);
    }
    if (filters.fromLocation) {
      filtered = filtered.filter(ticket => ticket.fromLocation.toLowerCase().includes(filters.fromLocation.toLowerCase()));
    }
    if (filters.toLocation) {
      filtered = filtered.filter(ticket => ticket.toLocation.toLowerCase().includes(filters.toLocation.toLowerCase()));
    }
    if (filters.accommodationRequired !== 'All') {
      filtered = filtered.filter(ticket => ticket.accommodationRequired === filters.accommodationRequired);
    }
    if (filters.advanceRequired !== 'All') {
      filtered = filtered.filter(ticket => ticket.advanceRequired === filters.advanceRequired);
    }
    if (filters.remarks) {
      filtered = filtered.filter(ticket => ticket.remarks.toLowerCase().includes(filters.remarks.toLowerCase()));
    }
    if (filters.status !== 'All') {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }
    if (filters.rejectedReason) {
      filtered = filtered.filter(ticket => ticket.rejectedReason && ticket.rejectedReason.toLowerCase().includes(filters.rejectedReason.toLowerCase()));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const parseDate = (dateInput) => {
        if (!dateInput) return new Date(0);
        if (Array.isArray(dateInput)) {
          const [year, month, day] = dateInput;
          return new Date(year, month - 1, day);
        }
        return new Date(dateInput);
      };

      // 1. Depart Date Sort
      const dateA = parseDate(a.departureDate);
      const dateB = parseDate(b.departureDate);
      if (filters.departDate === 'ASC') {
        if (dateA - dateB !== 0) return dateA - dateB;
      } else if (filters.departDate === 'DESC') {
        if (dateB - dateA !== 0) return dateB - dateA;
      }

      // 2. Return Date Sort
      const rDateA = parseDate(a.returnDate);
      const rDateB = parseDate(b.returnDate);
      if (filters.returnDate === 'ASC') {
        if (rDateA - rDateB !== 0) return rDateA - rDateB;
      } else if (filters.returnDate === 'DESC') {
        if (rDateB - rDateA !== 0) return rDateB - rDateA;
      }

      // 3. Fallback to ID DESC (Newest first)
      return b.id - a.id;
    });

    return filtered;
  }, [historyTickets, filters]);

  const handleFileChange = (requestId, e) => {
    const newFiles = Array.from(e.target.files); // Convert FileList to array

    setSelectedFiles(prev => ({
      ...prev,
      [requestId]: prev[requestId]
        ? [...prev[requestId], ...newFiles] // Append to existing
        : newFiles, // First time selection
    }));
  };

  // helper function to split text into equal rows
  const splitIntoRows = (text, rowLength) => {
    const rows = [];
    for (let i = 0; i < text.length; i += rowLength) {
      rows.push(text.slice(i, i + rowLength));
    }
    return rows;
  };






  const handleUpload = async (requestId) => {
    const files = selectedFiles[requestId];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB in bytes
    let totalSize = 0;

    if (!files || files.length === 0) {
      alert("Kindly attach the booking details to complete your submission.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const invalidFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) invalidFiles.push(file.name);
      totalSize += file.size;
    }

    if (invalidFiles.length > 0) {
      alert(
        `The following files are not allowed:\n${invalidFiles.join(
          "\n"
        )}\n\nOnly PDF, JPG, and PNG files are supported.`
      );
      return;
    }

    if (totalSize > MAX_SIZE) {
      alert("Total file size exceeds the 5 MB limit. Please select smaller files.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const token = sessionStorage.getItem("token"); // Get JWT

      const res = await api.post(
        `/travel/admin/upload-pdfs/${requestId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Booking details have been sent successfully.");

      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );

      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } catch (err) {
      alert("Error uploading files: " + (err.response?.data?.message || err.response?.data || err.message));

    }
  };

  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    if (!employeeId) return;

    const fetchDrafts = async () => {
      try {
        const token = sessionStorage.getItem("token"); // Get JWT
        const { data } = await api.get(`/travel/drafts/employee/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDrafts(data);
      } catch (err) {
        console.error('Error fetching drafts:', err.response?.data || err.message);
      }
    };

    fetchDrafts();
  }, [employeeId]);



  // **FIX:** Use useEffect to save drafts to sessionStorage whenever the 'drafts' state changes
  useEffect(() => {
    sessionStorage.setItem(`travelDrafts_${employeeId}`, JSON.stringify(drafts));
  }, [drafts, employeeId]);



  // Handle clicks outside the profile dropdown
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

  // Fetches tickets based on the endpoint and sets state
  // Fetches tickets based on the endpoint and sets state

  const fetchTickets = async (endpoint, setState) => {
    try {
      const token = sessionStorage.getItem("token"); // Get JWT
      const { data } = await api.get(`/travel/${endpoint}/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState(data);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err.response?.data || err.message);
    }
  };

  // Fetch pending requests based on role
  const fetchPendingRequests = async () => {
    try {
      const token = sessionStorage.getItem("token"); // Get JWT
      let url = "";

      if (role === "Manager") {
        url = `/travel/manager/pending/${employeeId}`;
      } else if (role === "admin") {
        url = `/travel/admin/assigned-requests/${adminId}`;
      }

      if (!url) return; // Nothing to fetch

      const { data } = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPendingRequests(data);
    } catch (err) {
      console.error("Error fetching pending requests:", err.response?.data || err.message);
    }
  };




  useEffect(() => {
    if (activeTab === "My Tasks") {

    }
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      const token = sessionStorage.getItem("token"); // Get JWT

      // Axios PUT request with query params
      await api.put(`/travel/approve/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { managerId: employeeId },
      });

      alert("Request approved!");
      fetchPendingRequests(); // Refresh the pending requests
    } catch (err) {
      console.error(err);
      alert("Error approving request: " + (err.response?.data?.message || err.response?.data || err.message));
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      const token = sessionStorage.getItem("token");
      await api.put(`/travel/cancel/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Travel request cancelled successfully");
      // Remove from activeTickets
      setActiveTickets(prev => prev.filter(t => t.id !== id));

      // Update historyTickets to reflect cancellation
      setHistoryTickets(prev => prev.map(t =>
        t.id === id ? { ...t, status: 'Cancelled' } : t
      ));

    } catch (err) {
      console.error("Error cancelling travel request:", err);
      alert("Failed to cancel travel request: " + (err.response?.data?.message || err.response?.data || err.message));
    }
  };


  // Reject a travel request (Manager/Admin function)
  const handleReject = async (id) => {
    let remarks = prompt("Enter rejection reason (10-100 characters):");
    if (remarks === null) return; // user cancelled
    remarks = remarks.trim();
    if (remarks.length < 10 || remarks.length > 100) {
      alert("Rejection reason must be between 10 and 100 characters.");
      return;
    }

    try {
      const token = sessionStorage.getItem("token"); // Get JWT

      // Prepare query params
      const params = {
        managerId: employeeId,
        rejectedReason: remarks,
      };

      // Axios PUT request
      await api.put(`/travel/reject/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params, // Axios automatically converts object to query string
      });

      alert("Request rejected!");
      fetchPendingRequests(); // Refresh the pending requests
    } catch (err) {
      console.error(err);
      alert("Error rejecting request: " + (err.response?.data?.message || err.response?.data || err.message));
    }
  };




  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({ ...prev, [name]: value }));
  };

  // Handler for clearing the form fields
  const handleCancel = (e) => {
    e.preventDefault();
    setNewRequest({
      name: '',
      fromLocation: '',
      toLocation: '',
      modeOfTravel: 'Select',
      category: 'Select',
      departureDate: '',
      returnDate: '',
      accommodationRequired: 'No',
      advanceRequired: 'No',
      remarks: '',
      employeeId: employeeId,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Required fields (must match state keys exactly!)
    const requiredFields = [
      "category",
      "modeOfTravel",
      "fromLocation",
      "toLocation",
      "departureDate",
      "accommodationRequired",
      "advanceRequired",

      "remarks",

    ];

    // Human-readable labels for alerts
    const fieldLabels = {
      category: "Category",
      modeOfTravel: "Mode of Travel",
      fromLocation: "From Location",
      toLocation: "To Location",
      departureDate: "Departure Date",
      accommodationRequired: "Accommodation Required",
      advanceRequired: "Advance Required",

      remarks: "Purpose of Travel",

    };

    for (const field of requiredFields) {
      const value = newRequest[field];
      if (!value || (typeof value === "string" && value.trim() === "") || value === "Select") {
        alert(`Please fill in the required field: ${fieldLabels[field]}`);
        return;
      }
    }

    // 1b. Project Assignment Validation
    try {
      const todayStr = getPropperDate();
      const res = await api.get(`/allocations/employee/${employeeId}/date/${todayStr}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      if (!res.data || res.data.length === 0) {
        alert("You are not assigned to any project , please contact your manager or admin");
        return;
      }
    } catch (err) {
      console.error("Failed to verify project assignment", err);
      // alert("Error verifying project assignment. Please try again.");
      // return;
    }

    // 2. Date validations
    const { category, departureDate, returnDate, id } = newRequest;

    // Use IST "today"
    const todayStr = getPropperDate();
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    const depart = new Date(departureDate);
    depart.setHours(0, 0, 0, 0);
    const returnD = returnDate ? new Date(returnDate) : null;
    if (returnD) returnD.setHours(0, 0, 0, 0);

    if (depart < today) {
      alert("Departure date cannot be in the past.");
      return;
    }

    if (returnD && returnD < depart) {
      alert("Return date cannot be before the departure date.");
      return;
    }

    // No advance booking restrictions - only past date validation is enforced above

    // 3. Prepare submission payload
    // Helper to format Date to YYYY-MM-DD
    const formatDate = (dateInput) => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const requestData = {
      ...newRequest,
      departureDate: formatDate(newRequest.departureDate),
      returnDate: newRequest.returnDate ? formatDate(newRequest.returnDate) : null,
      employeeId: employeeId,
      name: employeeName,
    };

    // Remove `id` if this is from a draft to force CREATE
    if (id) {
      delete requestData.id;
    }

    console.log("Submitting final request:", requestData);

    try {
      const token = sessionStorage.getItem("token"); // get JWT

      const res = await api.post("/travel/create", requestData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Travel request submitted successfully!");

      // Refresh history tickets
      api.get(`/travel/employee/all/${employeeId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setHistoryTickets(res.data))
        .catch(e => console.error("History fetch error:", e));


      // If created from a draft, delete that draft
      if (id) {
        try {
          await api.delete(`/travel/drafts/${id}?employeeId=${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDrafts((prevDrafts) => prevDrafts.filter((draft) => draft.id !== id));
        } catch (deleteError) {
          console.error("Failed to delete draft after submission:", deleteError);
        }
      }

      // Reset form
      setNewRequest({
        id: "",
        name: "",
        fromLocation: "",
        toLocation: "",
        modeOfTravel: "Select",
        category: "Select",
        departureDate: "",
        returnDate: "",
        accommodationRequired: "No",
        advanceRequired: "No",
        remarks: "",
        employeeId: employeeId,
      });

    } catch (error) {
      console.error("Error submitting travel request:", error);
      alert(`Error submitting travel request: ${error.response?.data?.message || error.response?.data || error.message}`);
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();

    // Include the ID if editing
    const formatDate = (dateInput) => {
      if (!dateInput) return null;
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const draftToSave = {
      ...newRequest,
      departureDate: formatDate(newRequest.departureDate),
      returnDate: newRequest.returnDate ? formatDate(newRequest.returnDate) : null,
      name: employeeName,
    };

    try {
      const token = sessionStorage.getItem("token"); // get JWT

      const res = await api.post("/travel/drafts", draftToSave, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // attach JWT
        },
      });

      const savedDraft = res.data;

      setDrafts((prevDrafts) => {
        const exists = prevDrafts.some((d) => d.id === savedDraft.id);
        if (exists) {

          // Update the draft in state
          return prevDrafts.map((d) => (d.id === savedDraft.id ? savedDraft : d));
        } else {
          // Add as new draft

          return [...prevDrafts, savedDraft];
        }
      });

      // Reset form but keep `id` cleared (so next new save won’t overwrite the last draft)

      setNewRequest({
        id: "", // clear id so next is a new draft
        name: "",
        fromLocation: "",
        toLocation: "",
        modeOfTravel: "Select",
        category: "Select",
        departureDate: "",
        returnDate: "",
        accommodationRequired: "No",
        advanceRequired: "No",
        remarks: "",
        employeeId: employeeId,
      });

      alert(draftToSave.id ? "Draft updated successfully!" : "Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);

      alert(`Error saving draft: ${error.response?.data?.message || error.response?.data || error.message}`);

    }
  };



  // Edit draft
  const handleEditDraft = (draft) => {
    const formatDateForInput = (dateInput) => {
      if (!dateInput) return "";

      // If already YYYY-MM-DD string, return as is
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }

      // Handle array [yyyy, mm, dd]
      if (Array.isArray(dateInput)) {
        const [y, m, d] = dateInput;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }

      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const draftForForm = {
      ...draft,
      departureDate: formatDateForInput(draft.departureDate),
      returnDate: formatDateForInput(draft.returnDate),
    };

    setNewRequest(draftForForm); // ✅ load with ID
    setActiveTab("New Ticket");
  };

  // Delete Draft
  const handleDeleteDraft = async (id, showAlert = true) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      await api.delete(`/travel/drafts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          employeeId: employeeId,
        },
      });

      setDrafts(prevDrafts => prevDrafts.filter(draft => draft.id !== id));

      if (showAlert) {
        alert("Draft deleted successfully!");
      }
    } catch (error) {
      console.error('Error deleting draft:', error);

      alert(`Error deleting draft: ${error.response?.data?.message || error.response?.data || error.message}`);

    }
  };




  const filteredDrafts = drafts.filter(draft =>
    Object.values(draft).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );



  const filteredPendingRequests = pendingRequests.filter(req =>
    Object.values(req).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );




  // Add this function to your component
  const handleRemoveFile = (requestId, fileIndexToRemove) => {
    setSelectedFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      // Filter out the file at the specified index
      newFiles[requestId] = newFiles[requestId].filter(
        (_, index) => index !== fileIndexToRemove
      );
      // If no files are left, you might want to clean up the state
      if (newFiles[requestId].length === 0) {
        delete newFiles[requestId];
      }
      return newFiles;
    });
  };

  return (
    <>
      <Sidebar>

        <div className="travel-management">
          <div className="travel-header">
            <div className="travel-title-section">
              <h1>Travel Management</h1>
              <p>Plan your trips, track requests, and manage bookings in one place.</p>
            </div>
          </div>

          <div className="tabs-container">
            <div className="tabs">
              {[
                {
                  name: 'New Ticket',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  )
                },

                {
                  name: 'History',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                  )
                },
                {
                  name: 'Drafts',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  )
                },

              ].map((tab) => (
                <button
                  key={tab.name}
                  className={activeTab === tab.name ? 'tab active' : 'tab'}
                  onClick={() => setActiveTab(tab.name)}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="travel-content">
            {activeTab === 'New Ticket' && (
              <>
                <p
                  className={
                    newRequest.category === 'Domestic' ||
                      newRequest.category === 'International'
                      ? 'warning-text'
                      : 'welcome-text'
                  }
                  style={{ marginTop: '0px' }}
                >
                  {newRequest.category === 'Domestic'
                    ? 'Kindly book the ticket at least one week before the travel date.'
                    : newRequest.category === 'International'
                      ? 'Kindly book the ticket at least one month before the travel date.'
                      : 'Welcome! Please fill out the form to create a new travel ticket.'}
                </p>
                <form>
                  <div className="travelform-container">
                    <label className="travel-field-label">
                      <span>Category <span style={{ color: 'red' }}>*</span></span>
                      <select
                        name="category"
                        value={newRequest.category}
                        onChange={(e) => {
                          handleInputChange(e);
                          if (e.target.value === 'International') {
                            handleInputChange({
                              target: { name: 'modeOfTravel', value: 'Flight' },
                            });
                          }
                        }}
                        required
                        tabIndex={1}
                      >
                        <option value="">Select</option>
                        <option value="Domestic">Domestic</option>
                        <option value="International">International</option>
                      </select>
                    </label>

                    <label className="travel-field-label">
                      <span>Mode of Travel <span style={{ color: 'red' }}>*</span></span>
                      <select
                        name="modeOfTravel"
                        value={newRequest.modeOfTravel}
                        onChange={handleInputChange}
                        required
                        disabled={newRequest.category === 'International'}
                        tabIndex={2}
                      >
                        {newRequest.category === 'International' ? (
                          <option value="Flight">Flight</option>
                        ) : (
                          <>
                            <option value="">Select</option>
                            <option value="Flight">Flight</option>
                            <option value="Bus">Bus</option>
                            <option value="Train">Train</option>
                          </>
                        )}
                      </select>
                    </label>

                    <div className="travel-field-label">
                      <span>Depart Date <span style={{ color: 'red' }}>*</span></span>
                      <DatePicker
                        selected={newRequest.departureDate ? new Date(newRequest.departureDate) : null}
                        onChange={(date) => {
                          if (!date) return;

                          if (!newRequest.category || newRequest.category === "Select") {
                            alert("Please select Category before choosing departure date.");
                            return;
                          }

                          const isValid = isValidDepartureDate(date, newRequest.category);
                          if (!isValid) return;

                          const fixedDate = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate()
                          );

                          handleInputChange({
                            target: { name: "departureDate", value: fixedDate },
                          });

                          // Reset return date if it becomes invalid
                          if (
                            newRequest.returnDate &&
                            new Date(newRequest.returnDate) < fixedDate
                          ) {
                            handleInputChange({
                              target: { name: "returnDate", value: null },
                            });
                          }
                        }}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="DD-MM-YYYY"
                        className="custom-datepicker-input"
                        minDate={getISTAsDateObject()}
                        shouldCloseOnSelect
                        tabIndex={3}

                        renderCustomHeader={({
                          date,
                          changeYear,
                          changeMonth,
                          decreaseMonth,
                          increaseMonth,
                        }) => {
                          const months = [
                            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
                          ];
                          const currentYear = new Date().getFullYear();
                          const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

                          return (
                            <div className="custom-calendar-header">
                              <div className="calendar-header-banner">
                                <button
                                  type="button"
                                  className="header-nav-btn prev"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    decreaseMonth();
                                  }}
                                >
                                  ‹
                                </button>

                                <div className="header-main-content">

                                  <div className="header-text-group">
                                    <span
                                      className="clickable-header-text"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMonthOpen(!monthOpen);
                                        setYearOpen(false);
                                      }}
                                    >
                                      {months[date.getMonth()]}
                                    </span>
                                    <span
                                      className="clickable-header-text"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setYearOpen(!yearOpen);
                                        setMonthOpen(false);
                                      }}
                                    >
                                      {date.getFullYear()}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="header-nav-btn next"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    increaseMonth();
                                  }}
                                >
                                  ›
                                </button>
                              </div>

                              {monthOpen && (
                                <div className="header-dropdown month-dropdown">
                                  <div className="dropdown-scroll-pane">
                                    {months.map((m, idx) => (
                                      <div
                                        key={m}
                                        className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                                        onClick={() => {
                                          changeMonth(idx);
                                          setMonthOpen(false);
                                        }}
                                      >
                                        {m}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {yearOpen && (
                                <div className="header-dropdown year-dropdown">
                                  <div className="dropdown-scroll-pane">
                                    {years.map((y) => (
                                      <div
                                        key={y}
                                        className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                                        onClick={() => {
                                          changeYear(y);
                                          setYearOpen(false);
                                        }}
                                      >
                                        {y}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                    </div>

                    <div className="travel-field-label">
                      <span>Return Date</span>
                      <DatePicker
                        selected={newRequest.returnDate ? new Date(newRequest.returnDate) : null}
                        onChange={(date) => {
                          if (!date) return;

                          if (!newRequest.departureDate) {
                            alert("Please select Departure Date first.");
                            return;
                          }

                          const depart = new Date(newRequest.departureDate);
                          depart.setHours(0, 0, 0, 0);

                          const selected = new Date(date);
                          selected.setHours(0, 0, 0, 0);

                          if (selected < depart) {
                            alert("Return date cannot be before departure date.");
                            return;
                          }

                          handleInputChange({
                            target: { name: "returnDate", value: selected },
                          });
                        }}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="DD-MM-YYYY"
                        className="custom-datepicker-input"
                        minDate={
                          newRequest.departureDate
                            ? new Date(newRequest.departureDate)
                            : getISTAsDateObject()
                        }
                        shouldCloseOnSelect
                        tabIndex={4}

                        renderCustomHeader={({
                          date,
                          changeYear,
                          changeMonth,
                          decreaseMonth,
                          increaseMonth,
                        }) => {
                          const months = [
                            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
                          ];
                          const currentYear = new Date().getFullYear();
                          const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

                          return (
                            <div className="custom-calendar-header">
                              <div className="calendar-header-banner">
                                <button
                                  type="button"
                                  className="header-nav-btn prev"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    decreaseMonth();
                                  }}
                                >
                                  ‹
                                </button>

                                <div className="header-main-content">

                                  <div className="header-text-group">
                                    <span
                                      className="clickable-header-text"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMonthOpen(!monthOpen);
                                        setYearOpen(false);
                                      }}
                                    >
                                      {months[date.getMonth()]}
                                    </span>
                                    <span
                                      className="clickable-header-text"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setYearOpen(!yearOpen);
                                        setMonthOpen(false);
                                      }}
                                    >
                                      {date.getFullYear()}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="header-nav-btn next"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    increaseMonth();
                                  }}
                                >
                                  ›
                                </button>
                              </div>

                              {monthOpen && (
                                <div className="header-dropdown month-dropdown">
                                  <div className="dropdown-scroll-pane">
                                    {months.map((m, idx) => (
                                      <div
                                        key={m}
                                        className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                                        onClick={() => {
                                          changeMonth(idx);
                                          setMonthOpen(false);
                                        }}
                                      >
                                        {m}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {yearOpen && (
                                <div className="header-dropdown year-dropdown">
                                  <div className="dropdown-scroll-pane">
                                    {years.map((y) => (
                                      <div
                                        key={y}
                                        className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                                        onClick={() => {
                                          changeYear(y);
                                          setYearOpen(false);
                                        }}
                                      >
                                        {y}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                    </div>

                    <LocationAutocomplete
                      value={newRequest.fromLocation}
                      onChange={handleInputChange}
                      placeholder="Source City"
                      label="From"
                      required={true}
                      name="fromLocation"
                      tabIndex={5}
                    />

                    <LocationAutocomplete
                      value={newRequest.toLocation}
                      onChange={handleInputChange}
                      placeholder="Destination City"
                      label="To"
                      required={true}
                      name="toLocation"
                      tabIndex={6}
                    />

                    <label className="travel-field-label">
                      <span>Advance Required <span style={{ color: 'red' }}>*</span></span>
                      <select
                        name="advanceRequired"
                        value={newRequest.advanceRequired}
                        onChange={handleInputChange}
                        required
                        tabIndex={7}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </label>

                    <label className="travel-field-label">
                      <span>Accommodation Required <span style={{ color: 'red' }}>*</span></span>
                      <select
                        name="accommodationRequired"
                        value={newRequest.accommodationRequired}
                        onChange={handleInputChange}
                        required
                        tabIndex={9}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </label>
                    <label className="travel-field-label">
                      <span>Purpose Of Travel <span style={{ color: 'red' }}>*</span></span>
                      <textarea
                        name="remarks"
                        value={newRequest.remarks}
                        onChange={handleInputChange}
                        placeholder="Please Enter The Purpose Of Your Travel"
                        maxLength={255}
                        required
                        rows={1}
                        tabIndex={8}
                      />
                      <small style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'block', textAlign: 'right' }}>
                        {(newRequest.remarks || '').length}/255
                      </small>
                    </label>
                  </div>

                  <div className="submit-button-container">
                    <button className="submit-button" type="submit" onClick={handleSubmit}>
                      Submit Request
                    </button>
                    <button className="submited-button" onClick={handleSaveDraft} type="button">
                      Save as Draft
                    </button>
                    <button className="cancel-button" type="button" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}



            {activeTab === 'History' && (
              <div className="travel-content">
                <div className="travel-table-container">
                  <table>
                    <thead className="columns-header">
                      <tr>
                        {[
                          { name: 'travelId', label: 'Travel' },
                          { name: 'category', label: 'Category' },
                          { name: 'modeOfTravel', label: 'Mode of Travel' },
                          { name: 'departDate', label: 'Depart Date' },
                          { name: 'returnDate', label: 'Return Date' },
                          { name: 'status', label: 'Status' },
                        ].map((col) => (
                          <th
                            key={col.name}
                            style={{ minWidth: '140px', cursor: 'pointer' }}
                            onClick={() => toggleFilter(col.name)}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>

                      {visibleFilter && (
                        <tr>
                          {[
                            { name: 'travelId', type: 'text', placeholder: 'Search...' },
                            { name: 'category', type: 'select', options: ['All', 'Domestic', 'International'] },
                            { name: 'modeOfTravel', type: 'select', options: ['All', 'Flight', 'Bus', 'Train'] },
                            { name: 'departDate', type: 'select', options: ['None', 'DESC', 'ASC'] },
                            { name: 'returnDate', type: 'select', options: ['None', 'DESC', 'ASC'] },
                            { name: 'status', type: 'select', options: ['All', 'Pending For Approval', 'Booking In Progress', 'Rejected', 'Booked', 'Downloaded'] },
                          ].map((col) => (
                            <th key={col.name} style={{ padding: '4px' }}>
                              {visibleFilter === col.name && col.type === 'text' && (
                                <input
                                  type="text"
                                  name={col.name}
                                  value={filters[col.name] || ''}
                                  onChange={handleFilterChange}
                                  placeholder={col.placeholder}
                                  className="custom-datepicker-input"
                                  style={{ height: '32px', fontSize: '0.85rem' }}
                                  autoFocus
                                />
                              )}
                              {visibleFilter === col.name && col.type === 'select' && (
                                <select
                                  name={col.name}
                                  value={filters[col.name] || col.options[0]}
                                  onChange={handleFilterChange}
                                  className="custom-datepicker-input"
                                  style={{ height: '32px', fontSize: '0.85rem' }}
                                  autoFocus
                                >
                                  {col.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>

                    <tbody>
                      {!historyFetched ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                            Fetching your history…
                          </td>
                        </tr>
                      ) : filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                            No records found
                          </td>
                        </tr>
                      ) : (
                        filteredHistory
                          .map((ticket) => (
                            <tr key={ticket.id} className="table-row">
                              <td>
                                <button
                                  type="button"
                                  style={{
                                    color: "#0B3D91",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    font: "inherit",
                                    fontWeight: 'normal',
                                    textDecoration: "underline",
                                  }}
                                  onClick={() => setSelectedTravelDetail(ticket)}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = "#629AF1")}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = "#0B3D91")}
                                >
                                  {ticket.id}
                                </button>
                              </td>
                              <td>{ticket.category}</td>
                              <td>{ticket.modeOfTravel}</td>
                              <td>
                                {ticket.departureDate
                                  ? formatDateToIST(ticket.departureDate)
                                  : "-"}
                              </td>
                              <td>
                                {ticket.returnDate
                                  ? formatDateToIST(ticket.returnDate)
                                  : "-"}
                              </td>
                              <td>
                                <span
                                  className="status-badge"
                                  style={{ color: "black", background: "transparent", fontSize: "15px", fontWeight: "normal" }}
                                >
                                  {ticket.status ? ticket.status.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ''}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>

                  </table>
                </div>

                {/* Travel Detail Modal */}

              </div>
            )}

            {activeTab === 'Drafts' && (
              <div className="travel-content">
                {!draftsFetched ? (
                  <div className="welcome-text">Fetching your drafts...</div>
                ) : filteredDrafts.length === 0 ? (
                  <div className="welcome-text">No drafts found.</div>
                ) : (
                  <div className="travel-table-container">
                    <table>
                      <thead className="columns-header">
                        <tr>
                          <th>Draft ID</th>
                          <th>Category</th>
                          <th>Mode of Travel</th>
                          <th>Depart Date</th>
                          <th>Return Date</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Accommodation Required</th>
                          <th>Advance Required</th>
                          <th>Purpose Of Travel</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredDrafts]
                          .sort((a, b) => b.id - a.id)
                          .map((draft) => (
                            <tr key={draft.id} className="table-row">
                              <td>{draft.id}</td>
                              <td>{draft.category}</td>
                              <td>{draft.modeOfTravel}</td>
                              <td>{draft.departureDate ? formatDateToIST(draft.departureDate) : ''}</td>
                              <td>{draft.returnDate ? formatDateToIST(draft.returnDate) : '-'}</td>
                              <td>{draft.fromLocation}</td>
                              <td>{draft.toLocation}</td>
                              <td>{draft.accommodationRequired}</td>
                              <td>{draft.advanceRequired}</td>
                              <td style={{ maxWidth: '250px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{draft.remarks || ''}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    style={{ background: 'transparent', border: 'none', color: '#00B3A4', cursor: 'pointer', padding: '4px 8px' }}
                                    onClick={() => handleEditDraft(draft)}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#00968A'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#00B3A4'}
                                    title="Edit Draft"
                                  >
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
                                    </svg>
                                  </button>
                                  <button
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px' }}
                                    onClick={() => handleDeleteDraft(draft.id)}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                                    title="Delete Draft"
                                  >
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}



            {selectedTravelDetail && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000,
                }}
                onClick={() => setSelectedTravelDetail(null)}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '0',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      background: "#0B3D91",
                      padding: "20px",
                      borderRadius: "0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 'normal' }}>
                      Travel Details - #{selectedTravelDetail.id}
                    </h3>
                    <button
                      onClick={() => setSelectedTravelDetail(null)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'normal',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ padding: '24px' }}>
                    {/* VIEW STATUS FLOW */}










                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Category</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.category}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Mode of Travel</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.modeOfTravel}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Depart Date</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.departureDate ? formatDateToIST(selectedTravelDetail.departureDate) : '-'}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Return Date</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.returnDate ? formatDateToIST(selectedTravelDetail.returnDate) : '-'}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>From</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.fromLocation}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>To</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.toLocation}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" /><path d="M9 21V9" /><path d="M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Accommodation Required</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.accommodationRequired}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Advance Required</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal' }}>{selectedTravelDetail.advanceRequired}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#1F2937', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Purpose of Travel</div>
                            <div style={{ fontSize: '0.9375rem', color: '#1F2937', fontWeight: 'normal', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{selectedTravelDetail.remarks || '-'}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '0px solid #e5e7eb', paddingBottom: '0px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12" /></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '4px' }}>Status</div>
                            <span className={`status-badge status-${selectedTravelDetail.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {selectedTravelDetail.status ? selectedTravelDetail.status.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Action Buttons Moved Here */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                      {selectedTravelDetail.status === 'Pending For Approval' && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to cancel this travel request?")) {
                              handleCancelRequest(selectedTravelDetail.id);
                              setSelectedTravelDetail(null);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9375rem',
                            fontWeight: 'normal',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel Request
                        </button>
                      )}

                      <button
                        onClick={() => handleViewStatus(selectedTravelDetail)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#00b3a4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9375rem',
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        View Status
                      </button>

                      {(selectedTravelDetail.status === 'Booked' || selectedTravelDetail.status === 'Downloaded') && (
                        <button
                          onClick={async () => {
                            try {
                              const token = sessionStorage.getItem("token");
                              const res = await api.get(`/travel/documents/${selectedTravelDetail.id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              const docs = res.data;
                              if (!docs.length) {
                                alert("No documents found for this request.");
                                return;
                              }
                              for (const doc of docs) {
                                const downloadRes = await api.get(`/travel/download-document/${doc.id}`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                  responseType: "blob",
                                });
                                const blob = new Blob([downloadRes.data]);
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = doc.fileName;
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                              }
                              await api.put(`/travel/mark-downloaded/${selectedTravelDetail.id}`, null, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              // Update active tickets as needed
                            } catch (err) {
                              console.error(err);
                              alert("Error downloading: " + (err.response?.data?.message || err.response?.data || err.message));
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: '#629AF1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9375rem',
                            fontWeight: 'normal',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          Download Ticket
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTravelDetail(null)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'transparent',
                          color: '#1e293b',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '0.9375rem',
                          fontWeight: 'normal',
                          cursor: 'pointer',
                        }}
                      >
                        Close
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Status Flow Modal */}
            {statusModalOpen && statusDetails && (
              <div style={{
                position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                justifyContent: "center", zIndex: 1100
              }}
                onClick={() => setStatusModalOpen(false)}
              >
                <div style={{
                  backgroundColor: "#fff", padding: "30px", borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: "400px", maxWidth: "90%"
                }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1e293b", textAlign: "center" }}>Travel Request Status</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* 1. Created At - Usually in History, but double check start */}
                    {/* We iterate history from the start. */}

                    {statusDetails.approvalHistory && statusDetails.approvalHistory.map((history, index, arr) => (
                      <div key={index} style={{ display: "flex", gap: "15px" }}>
                        <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{
                            width: "12px", height: "12px", borderRadius: "50%",
                            background: (history.action === "REJECTED" || history.action === "CANCELLED") ? "#ef4444" : "#629AF1"
                          }}></div>
                          {(index < arr.length - 1 || (statusDetails.status === 'Pending For Approval' || statusDetails.status === 'Booking In Progress')) && (
                            <div style={{ width: "2px", flex: 1, background: "#e2e8f0", margin: "4px 0" }}></div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: 'normal' }}>
                            {history.action === "SUBMITTED" ? "Created At" :
                              history.action === "APPROVED" ? "Approved by Manager" :
                                history.action === "BOOKED" ? "Booked by Travel Admin" :
                                  history.action === "REJECTED" ? (history.approverRole === "Travel Admin" ? "Rejected by Admin" : "Rejected by Manager") :
                                    history.action === "CANCELLED" ? "Cancelled At" :
                                      history.action === "TRANSFERRED" ? "TRANSFERRED TO Admin" : history.action}
                          </p>
                          {history.action !== "SUBMITTED" && history.action !== "CANCELLED" && (
                            <>
                              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#475569" }}>
                                {history.action === "TRANSFERRED" ? (
                                  `${history.toUserName || "Manager"} ${history.toUser ? `(${getDisplayEmployeeId(history.toUser)})` : ''}`
                                ) : (
                                  formatApproverDisplay(history.approverName, history.approverId) || "Unknown"
                                )}
                              </p>
                              {/* Delegation attribution */}
                              {history.delegatorName && (
                                <p style={{ margin: "1px 0 2px 0", fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                                  on behalf of {formatApproverDisplay(history.delegatorName, history.delegatorId)}
                                </p>
                              )}
                            </>
                          )}
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#475569" }}>
                            {history.actionTimestamp ? new Date(history.actionTimestamp).toLocaleString() : '-'}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Next Step / Current Pending Status */}
                    {statusDetails.status === 'Pending For Approval' && (
                      <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fbbf24" }}></div>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: 'normal' }}>Pending With Manager</p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: "#0f172a" }}>
                            {statusDetails.managerName || "Manager"} {statusDetails.assignedManagerId ? `(${getDisplayEmployeeId(statusDetails.assignedManagerId)})` : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {statusDetails.status === 'Booking In Progress' && (
                      <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ minWidth: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fbbf24" }}></div>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: 'normal' }}>Pending With Admin</p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: "#0f172a" }}>
                            {(statusDetails.assignedAdminId && statusDetails.assignedAdminId.includes(','))
                              ? "Pool"
                              : `${statusDetails.adminName || "Travel Admin"} ${statusDetails.assignedAdminId ? `(${getDisplayEmployeeId(statusDetails.assignedAdminId)})` : ''}`
                            }
                          </p>
                        </div>
                      </div>
                    )}

                  </div>

                  <div style={{ textAlign: "center", marginTop: "30px" }}>
                    <button
                      onClick={() => setStatusModalOpen(false)}
                      style={{
                        padding: "6px 20px",
                        background: "transparent",
                        color: "#1e293b",
                        border: "1px solid #1e293b",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </Sidebar >

      {/* Toast Notification */}
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
}

export default Travel;