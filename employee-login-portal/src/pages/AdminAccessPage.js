import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import api from "../api";
import Sidebar from "./Sidebar.js";
import AdminLeaveFunctionalityPage from "./AdminLeaveFunctionalityPage";
import AdminLMSPage from "./AdminLMSPage";
import { BsGrid1X2, BsAirplane } from "react-icons/bs";
import ModuleAccessPage from "./ModuleAccessPage";
import AdminTicket from "./AdminTicket";
import AssetCategoryManagement from "./AssetManagement/AssetCategoryManagement";
import AssetDropdownManagement from "./AssetManagement/AssetDropdownManagement";
import CompensationSettings from "./CompensationSettings";
import CompanyLocations from "./CompanyLocations";
import AdminITDeclaration from "./AdminITDeclaration";
import PerformanceAdmin from "./PerformanceAdmin";
import AdminOrgChartSetup from "./AdminOrgChartSetup";
import "./AdminAccessMobile.css";

import {
  FiUserPlus,
  FiHelpCircle,
  FiMessageSquare,
  FiFolder,
  FiLogOut,
  FiLock,
  FiDollarSign,
  FiExternalLink,
  FiBook,
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiBookOpen,
  FiFileText,
  FiBox,
  FiSettings,
  FiMapPin,
  FiUsers,
  FiTrendingUp
} from 'react-icons/fi';

const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

// Employee Suggestion Component
const EmployeeSuggestion = ({
  suggestions,
  showSuggestions,
  suggestionsLoading,
  onSelect,
  suggestionsRef,
  selectedSuggestionIndex,
  setSelectedSuggestionIndex
}) => {
  console.log('EmployeeSuggestion render:', { suggestions, showSuggestions, suggestionsLoading, selectedSuggestionIndex });

  if (!showSuggestions) return null;

  return (
    <div
      ref={suggestionsRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      {suggestionsLoading ? (
        <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
          Loading...
        </div>
      ) : suggestions.length === 0 ? (
        <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
          No suggestions found
        </div>
      ) : (
        suggestions.map((employee, index) => (
          <div
            key={employee.employeeId}
            data-suggestion-item={index}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderBottom: '1px solid #f3f4f6',
              fontSize: '13px',
              transition: 'background-color 0.2s',
              backgroundColor: index === selectedSuggestionIndex ? '#e0e0e0' : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
              setSelectedSuggestionIndex(index);
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              setSelectedSuggestionIndex(-1);
            }}
            onClick={() => onSelect(employee)}
          >
            {employee.firstName} {employee.lastName} ({getDisplayEmployeeId(employee.employeeId)})
          </div>
        ))
      )}
    </div>
  );
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const UPLOAD_API = `${API_BASE_URL}/v1/documents/upload`;
const ROLE_API = `${API_BASE_URL}/v1/roles/save`;
const HELP_DESK_TEAM_API = `${API_BASE_URL}/v1/helpdesk-teams/save`;
const ADMIN_ACCESS_API = `${API_BASE_URL}/v1/admin-access/save`;
const WORKFLOW_API = `${API_BASE_URL}/v1/workflow/upload`;
const CATEGORY_GET_API = `${API_BASE_URL}/v1/admin-access/categories`;
const DOC_CATEGORY_GET_API = `${API_BASE_URL}/v1/admin-access/categories`;
const DOC_CATEGORY_SAVE_API = `${API_BASE_URL}/v1/admin-access/categories/save`;
const DOC_CATEGORY_DELETE_API = `${API_BASE_URL}/v1/admin-access/categories`;

export default function AdminAccessPage() {
  const [selectedModule, setSelectedModule] = useState(sessionStorage.getItem("selectedAdminModule") || "");
  const [assetTab, setAssetTab] = useState(sessionStorage.getItem("selectedAssetTab") || "CATEGORIES");
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const allModules = [
      { key: "PRE_ONBOARDING", label: "Pre-onboarding", icon: <FiUserPlus />, superAdminKey: "PRE_ONBOARDING" },
      { key: "HELPDESK", label: "Helpdesk", icon: <FiHelpCircle />, superAdminKey: "HELPDESK" },
      { key: "LMS", label: "Lms", icon: <FiBookOpen />, superAdminKey: "LMS" },
      { key: "GRIEVANCE_MASTER", label: "Grievance", icon: <FiMessageSquare />, superAdminKey: "GRIEVANCE" },
      { key: "TRAVEL_ADMIN", label: "Travel admin", icon: <BsAirplane />, superAdminKey: "TRAVELS" },
      { key: "WORKFLOW", label: "Mydocuments", icon: <FiFolder />, superAdminKey: "DOCUMENT HUB" },
      { key: "HOLIDAYS", label: "Holidays", icon: null, superAdminKey: "HOLIDAY CALENDAR" },
      { key: "LEAVE_ADMIN", label: "Leave management", icon: <FiLock />, superAdminKey: "LEAVES" },
      { key: "CLAIM_CATEGORY", label: "Reimbursements", icon: <FiDollarSign />, superAdminKey: "CLAIMS" },
      { key: "ASSET_MANAGEMENT", label: "Asset management", icon: <FiBox />, superAdminKey: "ASSET MANAGEMENT" },
      { key: "EXIT_REASON", label: "Exit management", icon: <FiExternalLink />, superAdminKey: "EXIT MANAGEMENT" },
      { key: "PERFORMANCE_ADMIN", label: "Performance management", icon: <FiTrendingUp />, superAdminKey: "PERFORMANCE" },
      { key: "EMP_HANDBOOK", label: "Policies", icon: <FiBook />, superAdminKey: "HANDBOOK" },
      { key: "KNOWLEDGE_HUB", label: "Knowledge Hub", icon: <FiBookOpen />, superAdminKey: "KNOWLEDGE_HUB" },
      { key: "COMP_SETTINGS", label: "Compensation settings", icon: <FiSettings />, superAdminKey: "COMPENSATION" },
      { key: "COMPANY_LOCATIONS", label: "Company locations", icon: <FiMapPin />, superAdminKey: "COMPANY LOCATIONS" },
      { key: "IT_DECLARATION", label: "IT declaration config", icon: <FiFileText />, superAdminKey: "IT DECLARATION" },
      { key: "ORG_CHART", label: "Org Chart Setup", icon: <FiUsers />, superAdminKey: "ADMIN" },
      { key: "MODULE_ACCESS", label: "Module access", icon: <BsGrid1X2 />, superAdminKey: "ADMIN" },
    ];

    const tenantId = sessionStorage.getItem("tenantId");
    const tenantModulesStr = sessionStorage.getItem("moduleAccess");

    // If application owner (no tenantId) or ALL is specified, show all modules
    if (!tenantId || tenantId === "" || tenantId === "null" || tenantModulesStr === "ALL") {
      setModules(allModules);
    } else if (tenantModulesStr) {
      const allowedList = tenantModulesStr.split(",").map(s => s.trim().toUpperCase());
      const filtered = allModules.filter(m =>
        m.key === "MODULE_ACCESS" || // Always allow module access for admins
        m.key === "PERFORMANCE_ADMIN" || // Always allow performance management template setup
        m.key === "ORG_CHART" || // Always allow org chart setup for admins
        allowedList.includes(m.superAdminKey) ||
        allowedList.includes(m.key)
      );
      setModules(filtered);
    } else {
      setModules([]);
    }
  }, []);
  // upload states
  const [offerLetter, setOfferLetter] = useState(null);
  const [appointmentLetter, setAppointmentLetter] = useState(null);
  const offerLetterRef = useRef(null);
  const appointmentLetterRef = useRef(null);
  const handbookFileRef = useRef(null);
  const holidayFileRef = useRef(null);
  const workflowFileRef = useRef(null);
  const [financeId, setFinanceId] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  // roles
  const [roleName, setRoleName] = useState("HR");
  const [employeeIds, setEmployeeIds] = useState("");
  const [roleStatus, setRoleStatus] = useState("");

  // helpdesk teams
  const [allTeams, setAllTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamEmployeeIds, setTeamEmployeeIds] = useState("");
  const [teamStatus, setTeamStatus] = useState("");


  // Independent Category States
  const [categoryTeam, setCategoryTeam] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryList, setCategoryList] = useState([]);
  const [categoryStatus, setCategoryStatus] = useState("");


  // category/subcategory states
  const [teamType, setTeamType] = useState(""); // NEW_TICKET | CHANGE_REQUEST
  const [teamCategory, setTeamCategory] = useState(""); // new category name input
  const [teamTypeStatus, setTeamTypeStatus] = useState("");

  const [categories, setCategories] = useState([]); // categories for selected team & type (objects)
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subCategoryStatus, setSubCategoryStatus] = useState("");
  const [subCategories, setSubCategories] = useState([]);

  //Claims APIs
  const CLAIM_CATEGORY_GET = `${API_BASE_URL}/claims/categories`;
  const CLAIM_CATEGORY_SAVE = `${API_BASE_URL}/claims/categories`;
  const CLAIM_CATEGORY_DELETE = `${API_BASE_URL}/claims/categories`;

  const [claimCategories, setClaimCategories] = useState([]);
  const [claimCategoryLabel, setClaimCategoryLabel] = useState("");
  const [claimCategoryStatus, setClaimCategoryStatus] = useState("");

  // admin access states
  const [adminRole, setAdminRole] = useState("ADMIN");
  const [adminIds, setAdminIds] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  // workflow states
  const [workflowTarget, setWorkflowTarget] = useState("INDIVIDUAL");
  const [workflowEmployeeIds, setWorkflowEmployeeIds] = useState("");
  const [workflowCategory, setWorkflowCategory] = useState("");
  const [workflowFile, setWorkflowFile] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState("");
  const fileRef = useRef(null);

  const [teamNameCreate, setTeamNameCreate] = useState("");
  const [teamNameAssign, setTeamNameAssign] = useState("");
  const [teamNameCategory, setTeamNameCategory] = useState("");
  const [teamNameSubCategory, setTeamNameSubCategory] = useState("");
  //Employee Handbook
  const HANDBOOK_UPLOAD_API = `${API_BASE_URL}/handbook/upload`;

  const [handbooks, setHandbooks] = useState([]);
  const [handbookFile, setHandbookFile] = useState(null);
  const [handbookUploadStatus, setHandbookUploadStatus] = useState("");
  const [adminName, setAdminName] = useState("HR_ADMIN");
  const [handbookCategory, setHandbookCategory] = useState("");
  const [handbookCategories, setHandbookCategories] = useState([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");

  // Knowledge Hub
  const KNOWLEDGE_HUB_UPLOAD_API = `${API_BASE_URL}/knowledge-hub/upload`;
  const [knowledgeHubs, setKnowledgeHubs] = useState([]);
  const [knowledgeHubFile, setKnowledgeHubFile] = useState(null);
  const [knowledgeHubUploadStatus, setKnowledgeHubUploadStatus] = useState("");
  const [knowledgeHubCategory, setKnowledgeHubCategory] = useState("");
  const [knowledgeHubCategories, setKnowledgeHubCategories] = useState([]);
  const [newKnowledgeHubCategoryLabel, setNewKnowledgeHubCategoryLabel] = useState("");
  const knowledgeHubFileRef = useRef(null);

  // Grievance Master Data
  const [gCategory, setGCategory] = useState("");
  const [gType, setGType] = useState("");
  const [allGrievanceMaster, setAllGrievanceMaster] = useState([]);
  const [gStatus, setGStatus] = useState("");

  const [holidayFile, setHolidayFile] = useState(null);
  const [holidayUploadStatus, setHolidayUploadStatus] = useState("");


  const [existingIds, setExistingIds] = useState([]);
  const [newEmployeeIds, setNewEmployeeIds] = useState("");

  // Employee suggestion states
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs for dropdown management
  const newEmployeeIdsRef = useRef(null);
  const teamEmployeeIdsRef = useRef(null);
  const adminIdsRef = useRef(null);
  const workflowEmployeeIdsRef = useRef(null);
  const uploadEmployeeIdRef = useRef(null);
  const suggestionsRef = useRef(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);


  // Holiday Location Module States
  const [locationName, setLocationName] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  const [docCategoryLabel, setDocCategoryLabel] = useState("");
  const [docCategoryList, setDocCategoryList] = useState([]);
  const [docCategoryStatus, setDocCategoryStatus] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB


  const MAX_PDF_SIZE = 2 * 1024 * 1024; // 2MB

  const validateHandbookFile = (file) => {
    if (!file) { alert("Please select a file."); return "Please select a file."; }

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed."); return "Only PDF files are allowed.";
    }

    if (file.size > MAX_PDF_SIZE) {
      alert("PDF size must be less than or equal to 2 MB."); return "PDF size must be less than or equal to 2 MB.";
    }

    return null;
  };


  useEffect(() => {
    if (selectedModule === "PRE_ONBOARDING" && roleName) {
      loadExistingRoleIds(roleName);
    }
    // Persist selected module
    sessionStorage.setItem("selectedAdminModule", selectedModule);
  }, [selectedModule]);

  useEffect(() => {
    // Persist asset tab
    sessionStorage.setItem("selectedAssetTab", assetTab);
  }, [assetTab]);

  const validateOfferAppointmentFile = (file) => {
    if (!file) return "Please select a file.";

    const allowedTypes = [
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Only DOC or DOCX files are allowed.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than or equal to 2 MB.";
    }

    return null;
  };

  const loadCategoriesByTicketType = async (ticketType) => {
    if (!ticketType) {
      setCategories([]);
      return;
    }

    try {
      const res = await api.get(
        "/v1/helpdesk-categories/ticket-type",
        {
          params: { ticketType }
        }
      );

      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories by ticket type", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (selectedModule === "DOC_CATEGORY") {
      loadDocCategories();
    }
    if (selectedModule === "EMP_HANDBOOK") {
      fetchHandbookCategories();
    }
    if (selectedModule === "KNOWLEDGE_HUB") {
      fetchKnowledgeHubCategories();
      loadAllKnowledgeHubs();
    }
  }, [selectedModule]);

  // Fetch handbook categories from backend
  const fetchHandbookCategories = async () => {
    try {
      const res = await api.get("/handbook/categories", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      const cats = res.data || [];
      setHandbookCategories(cats);
    } catch (err) {
      console.error("Failed to fetch handbook categories", err);
    }
  };

  // Fetch knowledge hub categories from backend
  const fetchKnowledgeHubCategories = async () => {
    try {
      const res = await api.get("/knowledge-hub/categories", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      const cats = res.data || [];
      setKnowledgeHubCategories(cats);
    } catch (err) {
      console.error("Failed to fetch knowledge hub categories", err);
    }
  };

  // Also load categories when component mounts if DOC_CATEGORY is the initial module
  useEffect(() => {
    loadDocCategories();
  }, []); // Empty dependency array means this runs once on component mount

  const loadDocCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('Loading document categories...');
      console.log('API endpoint:', DOC_CATEGORY_GET_API);

      const res = await api.get(DOC_CATEGORY_GET_API, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });

      console.log('Categories response:', res.data);
      console.log('Categories count:', res.data?.length || 0);

      setDocCategoryList(res.data || []);
    } catch (err) {
      console.error("Failed to load document categories", err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      setDocCategoryList([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleDocCategorySubmit = async (e) => {
    e.preventDefault();

    if (!docCategoryLabel.trim()) {
      setDocCategoryStatus("Category name is required.");
      return;
    }

    try {
      console.log('Adding category:', docCategoryLabel.trim());
      console.log('API endpoint:', DOC_CATEGORY_SAVE_API);

      const response = await api.post(
        DOC_CATEGORY_SAVE_API,
        null,
        {
          params: { label: docCategoryLabel.trim() },
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
        }
      );

      console.log('Category add response:', response.data);

      alert("Category added successfully!"); setDocCategoryStatus("");
      setDocCategoryLabel("");
      loadDocCategories();
      // Also refresh workflow categories to update the dropdown
      loadWorkflowCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);

      let errorMessage = "Failed to save category";
      if (err.response?.status === 500) {
        errorMessage = "Server error: Backend issue - check server logs";
      } else if (err.response?.data?.message) {
        errorMessage = "Failed to save category: " + err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = "Failed to save category: " + JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage = "Failed to save category: " + err.message;
      }

      alert(errorMessage); setDocCategoryStatus("");
    }
  };

  const handleDeleteDocCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`${DOC_CATEGORY_DELETE_API}/${id}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });

      loadDocCategories();
      // Also refresh workflow categories to update the dropdown
      loadWorkflowCategories();
    } catch (err) {
      console.error("Failed to delete document category", err);
    }
  };

  const viewHandbookFile = async (hb) => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get(
        `${API_BASE_URL}${hb.downloadUrl}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf"
      });

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("Failed to open handbook PDF", err);
      alert("Unable to open handbook. Please try again.");
    }
  };

  const loadExistingRoleIds = async (role) => {
    try {
      const res = await api.get(
        `/v1/roles/${role}`
      );

      if (Array.isArray(res.data)) {
        setExistingIds(res.data);
      } else {
        setExistingIds([]);
      }
    } catch (err) {
      console.error("Failed to load role IDs", err);
      setExistingIds([]);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    console.log('handleDeleteEmployee called with:', employeeId);
    console.log('Current roleName:', roleName);

    try {
      console.log('Making API call to remove employee:', employeeId);
      const response = await api.delete(
        "/v1/roles/remove",
        {
          params: {
            roleName,
            employeeId
          }
        }
      );
      console.log('API response:', response.data);

      // remove instantly from UI
      setExistingIds(prev => {
        const newIds = prev.filter(id => id !== employeeId);
        console.log('Updated existingIds:', newIds);
        return newIds;
      });

      alert("Employee removed successfully.");

    } catch (err) {
      console.error('Error removing employee:', err);
      alert("Failed to remove employee: " + (err.response?.data?.message || err.message));
    }
  };


  // NEW EXIT REASON APIs
  const EXIT_REASON_SAVE_API = `${API_BASE_URL}/v1/exit-management/exit-reasons`;
  const EXIT_REASON_GET_API = `${API_BASE_URL}/v1/exit-management/exit-reasons`;
  const EXIT_QUESTION_API = `${API_BASE_URL}/v1/exit-management/exit-questions`;

  // Exit reasons
  const [exitReason, setExitReason] = useState("");
  const [exitCategories, setExitCategories] = useState([]);
  const [exitStatus, setExitStatus] = useState("");

  // Exit questions
  const [questions, setQuestions] = useState([]);
  const [questionLabel, setQuestionLabel] = useState("");
  const [questionType, setQuestionType] = useState("TEXT");
  const [questionOrder, setQuestionOrder] = useState(1);
  const [questionStatus, setQuestionStatus] = useState("");

  // Notice Period
  const [noticePeriod, setNoticePeriod] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("");



  const [workflowTab, setWorkflowTab] = useState("INDIVIDUAL");

  const [workflowYear, setWorkflowYear] = useState(new Date().getFullYear());


  // Workflow categories
  const [workflowCategories, setWorkflowCategories] = useState([]);


  const fetchExitReasons = async () => {
    try {
      const response = await api.get(EXIT_REASON_GET_API);
      setExitCategories(response.data);
    } catch (err) {
      console.error("Failed to load exit reasons", err);
    }
  };
  const handleExitReasonSubmit = async (e) => {
    e.preventDefault();

    if (!exitReason.trim()) {
      setExitStatus("Please enter a valid reason.");
      return;
    }

    try {
      await api.post(EXIT_REASON_SAVE_API, { reason: exitReason });

      alert("Reason added successfully!"); setExitStatus("");
      setExitReason("");
      fetchExitReasons();
    } catch (err) {
      alert("Failed to save reason."); setExitStatus("");
    }
  };

  const handleDeleteReason = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reason?")) return;

    try {
      await api.delete(`${EXIT_REASON_SAVE_API}/${id}`);
      fetchExitReasons();
    } catch (err) {
      console.error("Failed to delete reason:", err);
      setExitStatus("Failed to delete reason.");
    }
  };

  const fetchExitQuestions = async () => {
    try {
      const res = await api.get(EXIT_QUESTION_API);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to load questions", err);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    if (!questionLabel.trim()) {
      setQuestionStatus("Label is required.");
      return;
    }

    try {
      await api.post(EXIT_QUESTION_API, {
        label: questionLabel,
        type: questionType,
        displayOrder: Number(questionOrder)
      });

      alert("Question added successfully."); setQuestionStatus("");
      setQuestionLabel("");
      setQuestionOrder(1);

      fetchExitQuestions();
    } catch (err) {
      alert("Failed to add question."); setQuestionStatus("");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await api.delete(`${EXIT_QUESTION_API}/${id}`);
      fetchExitQuestions();
    } catch (err) {
      console.error("Failed to delete question:", err);
      setQuestionStatus("Failed to delete question.");
    }
  };

  const fetchNoticePeriod = async () => {
    try {
      const res = await api.get("/v1/exit-management/notice-period");
      setNoticePeriod(res.data);
    } catch (err) {
      console.error("Failed to load notice period.");
    }
  };

  const updateNotice = async () => {
    try {
      await api.put(
        "/v1/exit-management/notice-period",
        { days: Number(noticePeriod) }
      );

      alert("Updated successfully!"); setNoticeStatus("");
    } catch (err) {
      alert("Failed to update."); setNoticeStatus("");
    }
  };

  useEffect(() => {
    if (selectedModule === "EXIT_REASON") {
      fetchExitReasons();
      fetchExitQuestions();
      fetchNoticePeriod();
    }
  }, [selectedModule]);

  const handleHandbookUpload = async (e) => {
    e.preventDefault();

    if (!handbookCategory) {
      alert("Please select a category.");
      return;
    }

    if (!handbookFile) {
      alert("Please choose a PDF file."); setHandbookUploadStatus("");
      return;
    }

    const formData = new FormData();
    formData.append("file", handbookFile);
    // formData.append("adminName", sessionStorage.getItem("employeeId") || "ADMIN");
    formData.append("category", handbookCategory);


    try {
      const res = await api.post(HANDBOOK_UPLOAD_API, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`
        }
      });

      alert("Handbook uploaded successfully!");
      setHandbookUploadStatus("");
      setHandbookFile(null);
      setHandbookCategory("");

      if (handbookFileRef.current) handbookFileRef.current.value = "";
      loadAllHandbooks();
    } catch (err) {
      console.error(err);
      alert("Upload failed."); setHandbookUploadStatus("");
    }
  };

  const validateKnowledgeHubFile = (file) => {
    if (!file) { alert("Please select a file."); return "Please select a file."; }

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed."); return "Only PDF files are allowed.";
    }

    if (file.size > MAX_PDF_SIZE) {
      alert("PDF size must be less than or equal to 2 MB."); return "PDF size must be less than or equal to 2 MB.";
    }

    return null;
  };

  const handleKnowledgeHubUpload = async (e) => {
    e.preventDefault();

    if (!knowledgeHubCategory) {
      alert("Please select a category.");
      return;
    }

    if (!knowledgeHubFile) {
      alert("Please choose a PDF file."); setKnowledgeHubUploadStatus("");
      return;
    }

    const formData = new FormData();
    formData.append("file", knowledgeHubFile);
    formData.append("category", knowledgeHubCategory);

    try {
      const res = await api.post(KNOWLEDGE_HUB_UPLOAD_API, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`
        }
      });

      alert("Document uploaded successfully!");
      setKnowledgeHubUploadStatus("");
      setKnowledgeHubFile(null);
      setKnowledgeHubCategory("");

      if (knowledgeHubFileRef.current) knowledgeHubFileRef.current.value = "";
      loadAllKnowledgeHubs();
    } catch (err) {
      console.error(err);
      alert("Upload failed."); setKnowledgeHubUploadStatus("");
    }
  };

  // Load all saved locations
  const loadLocations = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await api.get("/v1/locations/all", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setLocations(res.data || []);
    } catch (err) {
      console.error("Error loading locations:", err);
    }
  };

  useEffect(() => {
    if (selectedModule === "WORKFLOW") {
      loadWorkflowCategories();
    }
  }, [selectedModule]);

  const loadWorkflowCategories = async () => {
    try {
      console.log('Loading workflow categories...');
      const res = await api.get(CATEGORY_GET_API);
      console.log('Workflow categories loaded:', res.data);
      console.log('Workflow categories count:', res.data?.length || 0);
      setWorkflowCategories(res.data);
    } catch (err) {
      console.error("Failed to load workflow categories", err);
    }
  };

  const validateFile = (file) => {
    if (!file) return "Please select a file.";
    if (file.type !== "application/pdf") return "Only PDF files allowed.";
    if (file.size > 2 * 1024 * 1024) return "File size must not exceed 2MB.";
    return null;
  };

  const checkEmployeeIdsExist = async (idList) => {
    try {
      const response = await api.post(
        "/employees/validate",
        { employeeIds: idList }
      );
      return response.data.valid;
    } catch (err) {
      console.error("Validation error", err);
      return false;
    }
  };



  // Add a new location
  const handleAddLocation = async () => {
    if (!locationName.trim()) {
      alert("Enter location name");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");

      await api.post(
        "/v1/locations/add",
        null,
        {
          params: { name: locationName },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Location added successfully");
      setLocationName("");
      loadLocations();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Upload holiday file with location
  const handleHolidayUploadWithLocation = async () => {
    if (!selectedLocation) {
      alert("Select a location");
      return;
    }
    if (!holidayFile) {
      alert("Upload an Excel/CSV file");
      return;
    }

    const fd = new FormData();
    fd.append("file", holidayFile);
    fd.append("location", selectedLocation);

    try {
      const res = await api.post(
        "/v1/holidays/upload",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert(res.data); setHolidayUploadStatus(""); setHolidayFile(null);
    } catch (err) {
      alert("Upload failed: " + err.message); setHolidayUploadStatus("");
    }
  };

  useEffect(() => {
    if (selectedModule === "HOLIDAYS") {
      loadLocations();
    }
  }, [selectedModule]);

  const loadAllHandbooks = async () => {
    try {
      const res = await api.get("/handbook/all", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`
        }
      });
      setHandbooks(res.data || []);
    } catch (err) {
      console.error("Handbook fetch error:", err);
    }
  };

  const loadAllKnowledgeHubs = async () => {
    try {
      const res = await api.get("/knowledge-hub/all", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`
        }
      });
      setKnowledgeHubs(res.data || []);
    } catch (err) {
      console.error("Knowledge Hub fetch error:", err);
    }
  };

  useEffect(() => {
    loadAllHandbooks();
    loadAllKnowledgeHubs();
  }, []);



  const downloadHolidayTemplate = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get(
        "/v1/holidays/template",
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "holiday_template.csv";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Template download failed:", error);
      alert("Unable to download template. Check backend or CORS.");
    }
  };


  useEffect(() => {
    if (selectedModule === "CLAIM_CATEGORY") {
      loadClaimCategories();
    }
  }, [selectedModule]);

  const loadClaimCategories = async () => {
    try {
      const res = await api.get(CLAIM_CATEGORY_GET, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`
        }
      });

      setClaimCategories(res.data);
    } catch (err) {
      console.error("Failed to load claim categories", err);
    }
  };



  const handleHolidayUpload = async () => {
    if (!holidayFile) {
      alert("Please upload an Excel file."); setHolidayUploadStatus("");
      return;
    }

    const formData = new FormData();
    formData.append("file", holidayFile);

    try {
      const res = await api.post(
        "/v1/holidays/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert(res.data); setHolidayUploadStatus(""); setHolidayFile(null);
    } catch (err) {
      alert("Upload failed: " + err.message); setHolidayUploadStatus("");
    }
  };

  const loadGrievanceMaster = async () => {
    try {
      const res = await api.get("/v1/all-categories/all");
      setAllGrievanceMaster(res.data || []);
    } catch (err) {
      console.error("Error loading grievance categories", err);
    }
  };

  useEffect(() => {
    if (selectedModule === "GRIEVANCE_MASTER") {
      loadGrievanceMaster();
    }
  }, [selectedModule]);

  const handleSaveGrievanceCategory = async () => {
    if (!gCategory.trim()) return alert("Enter category name"); setGStatus("");

    try {
      await api.post(
        "/v1/all-categories/category/add",
        null,
        { params: { category: gCategory } }
      );
      alert("Category added successfully"); setGStatus("");
      setGCategory("");
      loadGrievanceMaster();
    } catch (err) {
      alert("Error: " + err.message); setGStatus("");
    }
  };

  const handleClaimCategorySubmit = async (e) => {
    e.preventDefault();

    if (!claimCategoryLabel.trim()) {
      setClaimCategoryStatus("Category is required.");
      return;
    }

    try {
      await api.post(
        CLAIM_CATEGORY_SAVE,
        { categoryName: claimCategoryLabel.trim() },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`
          }
        }
      );

      // ✅ SUCCESS
      alert("Category added successfully!"); setClaimCategoryStatus("");
      setClaimCategoryLabel("");
      loadClaimCategories();

    } catch (err) {
      // ✅ DUPLICATE CATEGORY (409)
      if (err.response && err.response.status === 409) {
        setClaimCategoryStatus("Category already exists. Please add a new one.");
      }
      // ✅ OTHER BACKEND ERRORS
      else if (err.response && err.response.data) {
        setClaimCategoryStatus(err.response.data);
      }
      // ✅ NETWORK / SERVER ISSUE
      else {
        setClaimCategoryStatus("Server error. Please try again later.");
      }
    }
  };

  const handleDeleteClaimCategory = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await api.delete(`${CLAIM_CATEGORY_DELETE}/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`
        }
      });

      loadClaimCategories();
    } catch (err) {
      console.error("Failed to delete claim category", err);
    }
  };

  const handleSaveGrievanceType = async () => {
    if (!gType.trim()) return alert("Enter type name"); setGStatus("");

    try {
      await api.post(
        "/v1/all-categories/type/add",
        null,
        { params: { type: gType } }
      );
      alert("Type added successfully"); setGStatus("");
      setGType("");
      loadGrievanceMaster();
    } catch (err) {
      alert("Error: " + err.message); setGStatus("");
    }
  };


  useEffect(() => {
    if (selectedModule === "HELPDESK") {
      loadAllTeams();
    }
  }, [selectedModule]);

  // load teams
  const loadAllTeams = async () => {
    try {
      const res = await api.get("/v1/helpdesk-teams/all");
      setAllTeams(res.data || []);
      // if no team is selected, set the first team as default
      if (!teamName && res.data && res.data.length) {
        setTeamName(res.data[0]);
      }
    } catch (err) {
      console.error("Error loading teams", err);
    }
  };

  const loadExistingTeamIds = async (name) => {
    try {
      const res = await api.get(`/v1/helpdesk-teams/team/${name}`);
      if (res.data && res.data.teamIds) {
        const cleaned = res.data.teamIds.split(",").map(id => getDisplayEmployeeId(id.trim())).join(", ");
        setTeamEmployeeIds(cleaned);
      } else {
        setTeamEmployeeIds("");
      }
    } catch (err) {
      console.error("Error loading team details", err);
      setTeamEmployeeIds("");
    }
  };

  const loadHelpdeskCategories = async () => {
    if (!categoryTeam || !categoryType) {
      setCategoryList([]);
      return;
    }

    try {
      const res = await api.get(
        "/v1/helpdesk-categories/by-team-type",
        {
          params: {
            teamName: categoryTeam,
            ticketType: categoryType
          }
        }
      );
      setCategoryList(res.data || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategoryList([]);
    }
  };

  const loadSubCategoriesForCategory = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const res = await api.get(`/v1/helpdesk-categories/${categoryId}/subcategories`);
      setSubCategories(res.data || []);
    } catch (err) {
      console.error("Error loading subcategories", err);
      setSubCategories([]);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamNameCreate.trim()) {
      alert("Team name cannot be empty."); setTeamStatus("");
      return;
    }

    try {
      await api.post("/v1/helpdesk-teams/create", {
        teamName: teamNameCreate,
      });

      alert("Team created successfully."); setTeamStatus("");
      setTeamNameCreate("");
      loadAllTeams();
    } catch (err) {
      alert("Error: " + err.message); setTeamStatus("");
    }
  };

  // assign employee ids
  const handleSaveTeamIds = async () => {
    if (!teamNameAssign.trim()) {
      alert("Select a team first."); setTeamStatus("");
      return;
    }
    if (!teamEmployeeIds.trim()) {
      alert("Enter employee IDs."); setTeamStatus("");
      return;
    }

    const idList = teamEmployeeIds.split(",").map(id => id.trim()).filter(Boolean);

    try {
      const response = await api.post("/v1/helpdesk-teams/save", {
        teamName: teamNameAssign,
        employeeIds: idList,
      });

      // Display feedback including ticket reassignment info
      const { ticketsReassigned, removedEmployeeIds } = response.data;

      let statusMessage = "Employee IDs assigned successfully.";

      if (ticketsReassigned > 0) {
        statusMessage += ` ${ticketsReassigned} ticket(s) were reassigned back to the team pool from removed member(s): ${removedEmployeeIds.join(", ")}.`;
      }

      alert(statusMessage); setTeamStatus("");
      setTeamEmployeeIds("");

      // Reload team IDs to show updated list
      if (teamNameAssign) {
        await loadExistingTeamIds(teamNameAssign);
      }
    } catch (err) {
      alert("Error: " + err.message); setTeamStatus("");
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryTeam || !categoryType || !categoryName.trim()) {
      alert("All fields are required."); setCategoryStatus("");
      return;
    }

    try {
      await api.post(
        "/v1/helpdesk-categories/create",
        {
          teamName: categoryTeam,
          ticketType: categoryType,
          categoryName
        }
      );

      alert("Category created successfully."); setCategoryStatus("");
      setCategoryName("");
      loadHelpdeskCategories();
    } catch (err) {
      alert("Failed to create category."); setCategoryStatus("");
    }
  };


  // create subcategory under selected category
  const handleCreateSubCategory = async () => {
    if (!selectedCategoryId) {
      alert("Select a category."); setSubCategoryStatus("");
      return;
    }
    if (!subCategoryName.trim()) {
      alert("Enter subcategory name."); setSubCategoryStatus("");
      return;
    }

    try {
      await api.post(
        `/v1/helpdesk-categories/${selectedCategoryId}/subcategories/create`,
        { subCategoryName }
      );

      alert("Subcategory saved."); setSubCategoryStatus("");
      setSubCategoryName("");

      loadSubCategoriesForCategory(selectedCategoryId);
    } catch (err) {
      alert("Error: " + err.message); setSubCategoryStatus("");
    }
  };

  useEffect(() => {
    loadHelpdeskCategories();
  }, [categoryTeam, categoryType]);

  // when category changes, load subcategories
  useEffect(() => {
    if (selectedCategoryId) loadSubCategoriesForCategory(selectedCategoryId);
    else setSubCategories([]);
  }, [selectedCategoryId]);

  /* --------------------------- Remaining existing handlers (role, upload, admin, workflow) --------------------------- */

  // Debounce function for search suggestions
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Fetch employee suggestions from API
  const fetchEmployeeSuggestions = async (query) => {
    console.log('fetchEmployeeSuggestions called with query:', query);

    if (!query || query.trim().length < 1) {
      console.log('Query is empty, clearing suggestions');
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('API endpoint:', `/employeesdetails/suggestions?query=${encodeURIComponent(query)}`);

      const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API response:', response.data);
      setEmployeeSuggestions(response.data);
      setShowEmployeeSuggestions(response.data.length > 0);
    } catch (err) {
      console.error('Error fetching employee suggestions:', err);
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Debounced version of fetchEmployeeSuggestions
  const debouncedFetchSuggestions = debounce(fetchEmployeeSuggestions, 300);

  // Handle employee IDs input change (comma-separated support)
  const handleEmployeeIdsChange = (value, field) => {
    console.log(`handleEmployeeIdsChange called for ${field}:`, value);
    setActiveSearchField(field);

    if (field === 'newEmployeeIds') {
      setNewEmployeeIds(value);
    } else if (field === 'teamEmployeeIds') {
      setTeamEmployeeIds(value);
    } else if (field === 'adminIds') {
      setAdminIds(value);
    } else if (field === 'workflowEmployeeIds') {
      setWorkflowEmployeeIds(value);
    } else if (field === 'financeId') {
      setFinanceId(value);
    }

    // Extract the last typed ID (after the last comma or space)
    const ids = value.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
    const lastId = ids[ids.length - 1] || "";

    console.log('Last ID for suggestions:', lastId);

    if (lastId.length >= 1 && lastId.toLowerCase() !== 'all') {
      console.log('Fetching suggestions for:', lastId);
      debouncedFetchSuggestions(lastId);
      setSelectedSuggestionIndex(-1);
    } else {
      console.log('Clearing suggestions');
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle suggestion click for comma-separated employee IDs
  const handleSuggestionClick = (employee) => {
    console.log('handleSuggestionClick called for field:', activeSearchField);

    let currentValue;
    if (activeSearchField === 'newEmployeeIds') {
      currentValue = newEmployeeIds;
    } else if (activeSearchField === 'teamEmployeeIds') {
      currentValue = teamEmployeeIds;
    } else if (activeSearchField === 'adminIds') {
      currentValue = adminIds;
    } else if (activeSearchField === 'workflowEmployeeIds') {
      currentValue = workflowEmployeeIds;
    } else if (activeSearchField === 'financeId') {
      currentValue = financeId;
    }

    const currentIds = currentValue.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");

    // Replace the last ID with the selected employee
    if (currentIds.length > 0) {
      currentIds[currentIds.length - 1] = getDisplayEmployeeId(employee.employeeId);
    } else {
      currentIds.push(getDisplayEmployeeId(employee.employeeId));
    }

    const newValue = currentIds.join(", ");

    if (activeSearchField === 'newEmployeeIds') {
      setNewEmployeeIds(newValue);
    } else if (activeSearchField === 'teamEmployeeIds') {
      setTeamEmployeeIds(newValue);
    } else if (activeSearchField === 'adminIds') {
      setAdminIds(newValue);
    } else if (activeSearchField === 'workflowEmployeeIds') {
      setWorkflowEmployeeIds(newValue);
    } else if (activeSearchField === 'financeId') {
      setFinanceId(newValue);
    }

    setShowEmployeeSuggestions(false);
    setEmployeeSuggestions([]);
    setActiveSearchField('');
    setSelectedSuggestionIndex(-1);
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showEmployeeSuggestions || employeeSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev < employeeSuggestions.length - 1 ? prev + 1 : 0;
          // Scroll the selected item into view
          setTimeout(() => {
            const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
            if (suggestionItems[newIndex]) {
              suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
          return newIndex;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : employeeSuggestions.length - 1;
          // Scroll the selected item into view
          setTimeout(() => {
            const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
            if (suggestionItems[newIndex]) {
              suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
          return newIndex;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < employeeSuggestions.length) {
          handleSuggestionClick(employeeSuggestions[selectedSuggestionIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowEmployeeSuggestions(false);
        setEmployeeSuggestions([]);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        newEmployeeIdsRef.current && !newEmployeeIdsRef.current.contains(event.target) &&
        teamEmployeeIdsRef.current && !teamEmployeeIdsRef.current.contains(event.target) &&
        adminIdsRef.current && !adminIdsRef.current.contains(event.target) &&
        workflowEmployeeIdsRef.current && !workflowEmployeeIdsRef.current.contains(event.target) &&
        uploadEmployeeIdRef.current && !uploadEmployeeIdRef.current.contains(event.target)) {
        setShowEmployeeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSubmit = async (e) => {
    e.preventDefault();

    const newIds = newEmployeeIds
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);

    const finalIds = [...new Set([...existingIds, ...newIds])];

    if (finalIds.length === 0) {
      setRoleStatus("Please add at least one employee ID.");

      // ⏱️ auto clear after 2 seconds
      setTimeout(() => setRoleStatus(""), 2000);
      return;
    }

    try {
      await api.post(ROLE_API, {
        roleName,
        employeeIds: finalIds
      });

      alert("Role access saved successfully."); setRoleStatus("");
      setNewEmployeeIds("");
      loadExistingRoleIds(roleName);

      // ⏱️ auto clear after 2 seconds
      setTimeout(() => setRoleStatus(""), 2000);

    } catch (err) {
      alert("Error saving role access."); setRoleStatus("");

      // ⏱️ auto clear after 2 seconds
      setTimeout(() => setRoleStatus(""), 2000);
    }
  };


  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const applicantId = financeId.trim() || "1";
    if (!offerLetter && !appointmentLetter) {
      setUploadStatus("Please select at least one letter to upload.");
      return;
    }

    const formData = new FormData();
    if (offerLetter) formData.append("offerLetter", offerLetter);
    if (appointmentLetter) formData.append("appointmentLetter", appointmentLetter);
    formData.append("financeId", financeId); // Keeping for backward compatibility if backend expects it

    try {
      await api.post(`${UPLOAD_API}/${applicantId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Letters uploaded successfully!"); setUploadStatus("");
      setOfferLetter(null);
      setAppointmentLetter(null);
      setFinanceId("");
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message)); setUploadStatus("");
    }
  };

  const handleAdminAccessSubmit = async (e) => {
    e.preventDefault();
    if (!adminIds.trim()) { alert("Please enter Admin employee IDs."); setAdminStatus(""); return; }
    const idList = adminIds.split(",").map(id => id.trim());
    try {
      await api.post(ADMIN_ACCESS_API, { roleName: adminRole, employeeIds: idList });
      alert("Admin access saved successfully."); setAdminStatus(""); setAdminIds("");
    } catch (err) {
      alert("Error: " + err.message); setAdminStatus("");
    }
  };

  const handleWorkflowSubmit = async (e) => {
    e.preventDefault();

    const employeeIdValue =
      workflowTab === "ALL" ? "ALL_EMPLOYEES" : workflowEmployeeIds;

    if (
      (workflowTab === "INDIVIDUAL" && !employeeIdValue.trim()) ||
      !workflowCategory ||
      !workflowFile ||
      !workflowYear
    ) {
      setWorkflowStatus("All fields are required.");
      return;
    }

    const formData = new FormData();
    formData.append("employeeIds", employeeIdValue);
    formData.append("category", workflowCategory);
    formData.append("year", workflowYear);   // ⭐ REQUIRED FIELD
    formData.append("file", workflowFile);

    try {
      const response = await api.post(WORKFLOW_API, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert(response.data); setWorkflowStatus("");
    } catch (err) {
      alert("Upload failed: " + (err.response?.data || err.message)); setWorkflowStatus("");
    }
  };

  const tabContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    cursor: "pointer",
    background: "#f0f0f0",
    padding: "8px",
    borderRadius: "5px"
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "10px",
    textAlign: "center",
    fontWeight: active ? "bold" : "normal",
    background: active ? "#333" : "#ddd",
    color: active ? "white" : "black",
    borderRadius: "5px",
  });

  // UI rendering
  return (
    <Sidebar>
      <div className="admin-access-page-wrapper" style={{
        padding: "24px",
        background: "transparent",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif"
      }}>

        {/* Module Selection Grid */}
        {!selectedModule ? (
          <div style={{ maxWidth: "1200px", margin: "20px auto 40px auto" }}>
            {/* Header Section */}
            <div style={{
              textAlign: "left",
              marginBottom: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px"
            }}>
              <div style={{ textAlign: "left", width: "100%", maxWidth: "700px" }}>
                <h1 className="admin-access-title" style={{
                  color: "#1F2937",
                  fontSize: "30px",
                  fontWeight: "normal",
                  margin: "0 0 6px 0",
                  textAlign: "left"
                }}>
                  Admin access control
                </h1>
                <p style={{ color: "#00B3A4", margin: 0, fontSize: "15px", textAlign: "left" }}>
                  Configure, monitor, and manage enterprise application modules and policies.
                </p>
              </div>
              
              <div style={{
                background: "rgba(8, 61, 145, 0.05)",
                color: "#083D91",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: "normal",
                border: "1px solid rgba(8, 61, 145, 0.1)"
              }}>
                Total Modules: {modules.length}
              </div>
            </div>

            {/* Categorized Admin Modules Layout */}
            {[
              {
                id: "core",
                title: "Employee & core operations",
                items: modules.filter(m => ["PRE_ONBOARDING", "LEAVE_ADMIN", "EXIT_REASON", "HOLIDAYS", "PERFORMANCE_ADMIN"].includes(m.key))
              },
              {
                id: "finance",
                title: "Finance & payroll config",
                items: modules.filter(m => ["CLAIM_CATEGORY", "COMP_SETTINGS", "IT_DECLARATION"].includes(m.key))
              },
              {
                id: "governance",
                title: "Governance & policies",
                items: modules.filter(m => ["EMP_HANDBOOK", "KNOWLEDGE_HUB", "MODULE_ACCESS", "COMPANY_LOCATIONS", "WORKFLOW", "ORG_CHART"].includes(m.key))
              },
              {
                id: "support",
                title: "Operational & support tools",
                items: modules.filter(m => ["HELPDESK", "GRIEVANCE_MASTER", "LMS", "TRAVEL_ADMIN", "ASSET_MANAGEMENT"].includes(m.key))
              }
            ]
            .filter(cat => cat.items.length > 0)
            .map((category) => (
              <div key={category.id} style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #cbd5e1",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)",
                padding: "24px",
                marginBottom: "24px"
              }}>
                {/* Category Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                  borderBottom: "2px solid #f1f5f9",
                  paddingBottom: "12px"
                }}>
                  <div style={{
                    color: "#1F2937",
                    fontSize: "1.25rem",
                    fontWeight: "normal",
                    margin: 0
                  }}>
                    {category.title}
                  </div>
                </div>

                {/* Module Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {category.items.map((m) => (
                    <div
                      key={m.key}
                      onClick={() => setSelectedModule(m.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#1f6feb";
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {/* Left: Info only, no icons */}
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: "#1F2937",
                          fontSize: "0.95rem",
                          fontWeight: "normal",
                          margin: "0 0 2px 0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {m.label}
                        </div>
                        <p style={{
                          color: "#00B3A4",
                          fontSize: "0.8rem",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          Configure options, settings, and workflows for {m.label}
                        </p>
                      </div>

                      {/* Right: Action Button only, no active status */}
                      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexShrink: 0 }}>
                        {/* Quick Action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModule(m.key);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#00B3A4",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#00968A";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#00B3A4";
                          }}
                        >
                          Configure
                          <FiExternalLink />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <button
              onClick={() => setSelectedModule("")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "white",
                border: "1px solid #00b3a4",
                color: "#00b3a4",
                fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                fontWeight: "700",
                cursor: "pointer",
                marginBottom: "24px",
                padding: "clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px)",
                borderRadius: "12px",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                minHeight: "44px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e6f7f6";
                e.currentTarget.style.borderColor = "#00b3a4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#00b3a4";
              }}
            >
              <FiArrowLeft /> Back to Dashboard
            </button>
             {selectedModule === "LMS" && <AdminLMSPage />}

             {selectedModule === "ASSET_MANAGEMENT" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto", textAlign: "left" }}>
                <div style={{ marginBottom: "24px", textAlign: "left" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "1.75rem",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    {assetTab === "CATEGORIES" ? "Asset category management" : "Asset status & conditions management"}
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginTop: "6px", textAlign: "left" }}>
                    {assetTab === "CATEGORIES" 
                      ? "Configure asset categorization, schema rules, and dynamic field properties."
                      : "Manage operational status values, physical conditions, and excel column definitions."}
                  </div>
                </div>

                {/* Internal Tabs for Asset Management */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', textAlign: "left" }}>
                  <button
                    onClick={() => setAssetTab("CATEGORIES")}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: assetTab === "CATEGORIES" ? '#1f6feb' : '#083D91',
                      color: 'white',
                      fontWeight: 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    Asset categories
                  </button>
                  <button
                    onClick={() => setAssetTab("DROPDOWNS")}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: assetTab === "DROPDOWNS" ? '#1f6feb' : '#083D91',
                      color: 'white',
                      fontWeight: 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    Asset status & conditions
                  </button>
                </div>

                <div style={{ background: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  {assetTab === "CATEGORIES" ? <AssetCategoryManagement /> : <AssetDropdownManagement />}
                </div>
              </div>
            )}

            {selectedModule === "PRE_ONBOARDING" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "30px",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    Pre-onboarding management
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Configure candidate portal credentials, view documents, and track completion progress.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  {/* Upload Letters Card */}
                  <div className="admin-preonboarding-card" style={{ border: "1px solid #cbd5e1", borderRadius: "16px" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontWeight: "normal", fontSize: "20px" }}>
                      Upload letters
                    </div>

                    <form onSubmit={handleUploadSubmit}>
                      <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "normal", color: "#1F2937", fontSize: "0.95rem", textTransform: "none" }}>
                          Offer letter (doc/docx, max 2 mb)
                        </label>
                        {!offerLetter ? (
                          <div
                            onClick={() => offerLetterRef.current.click()}
                            style={{
                              position: 'relative',
                              padding: '24px',
                              borderRadius: '12px',
                              border: '2px dashed #00B3A4',
                              background: '#f8fafc',
                              color: '#64748b',
                              fontSize: '14px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#00968A';
                              e.currentTarget.style.background = '#f0fdfd';
                              e.currentTarget.style.color = '#00B3A4';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#00B3A4';
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <input
                              type="file"
                              ref={offerLetterRef}
                              accept=".doc,.docx"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const error = validateOfferAppointmentFile(file);
                                if (error) {
                                  setUploadStatus(error);
                                  e.target.value = "";
                                  setOfferLetter(null);
                                  return;
                                }
                                setUploadStatus("");
                                setOfferLetter(file);
                              }}
                            />
                            <div style={{ fontWeight: 'normal' }}>
                              Click to choose offer letter...
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                              Supports doc, docx up to 2mb
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#f0fdfd",
                            padding: "24px 16px",
                            borderRadius: "12px",
                            border: "1px solid #00B3A4",
                            marginTop: "4px"
                          }}>
                            <span style={{ fontSize: "0.95rem", color: "#1F2937", fontWeight: "normal", display: "flex", alignItems: "center", gap: "10px" }}>
                              {offerLetter.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
                                ({(offerLetter.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                              <FiTrash2
                                style={{ cursor: "pointer", color: "#ef4444", fontSize: "1.4rem" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOfferLetter(null);
                                  if (offerLetterRef.current) offerLetterRef.current.value = "";
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "normal", color: "#1F2937", fontSize: "0.95rem", textTransform: "none" }}>
                          Appointment letter (doc/docx, max 2 mb)
                        </label>
                        {!appointmentLetter ? (
                          <div
                            onClick={() => appointmentLetterRef.current.click()}
                            style={{
                              position: 'relative',
                              padding: '24px',
                              borderRadius: '12px',
                              border: '2px dashed #00B3A4',
                              background: '#f8fafc',
                              color: '#64748b',
                              fontSize: '14px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#00968A';
                              e.currentTarget.style.background = '#f0fdfd';
                              e.currentTarget.style.color = '#00B3A4';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#00B3A4';
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <input
                              type="file"
                              ref={appointmentLetterRef}
                              accept=".doc,.docx"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const error = validateOfferAppointmentFile(file);
                                if (error) {
                                  setUploadStatus(error);
                                  e.target.value = "";
                                  setAppointmentLetter(null);
                                  return;
                                }
                                setUploadStatus("");
                                setAppointmentLetter(file);
                              }}
                            />
                            <div style={{ fontWeight: 'normal' }}>
                              Click to choose appointment letter...
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                              Supports doc, docx up to 2mb
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#f0fdfd",
                            padding: "24px 16px",
                            borderRadius: "12px",
                            border: "1px solid #00B3A4",
                            marginTop: "4px"
                          }}>
                            <span style={{ fontSize: "0.95rem", color: "#1F2937", fontWeight: "normal", display: "flex", alignItems: "center", gap: "10px" }}>
                              {appointmentLetter.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
                                ({(appointmentLetter.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                              <FiTrash2
                                style={{ cursor: "pointer", color: "#ef4444", fontSize: "1.4rem" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAppointmentLetter(null);
                                  if (appointmentLetterRef.current) appointmentLetterRef.current.value = "";
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="admin-btn-group" style={{ display: "flex", gap: "12px" }}>
                        <button
                          type="submit"
                          className="admin-btn-primary"
                          style={{
                            background: "#00B3A4",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: "12px",
                            fontWeight: "normal",
                            cursor: "pointer",
                            fontSize: "1rem",
                            minHeight: "48px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#00968A"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#00B3A4"}
                        >
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOfferLetter(null);
                            setAppointmentLetter(null);
                            setFinanceId("");
                            setUploadStatus("Cleared.");
                          }}
                          className="admin-btn-secondary"
                          style={{
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: "12px",
                            fontWeight: "normal",
                            cursor: "pointer",
                            fontSize: "1rem",
                            minHeight: "48px"
                          }}
                        >
                          Clear form
                        </button>
                      </div>
                    </form>

                    {uploadStatus && (
                      <div style={{
                        marginTop: "16px",
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: uploadStatus.includes("success") ? "#dcfce7" : "#fee2e2",
                        color: uploadStatus.includes("success") ? "#166534" : "#991b1b",
                        fontSize: "0.875rem",
                        fontWeight: "normal"
                      }}>
                        {uploadStatus}
                      </div>
                    )}
                  </div>

                  {/* Role Assignment Card */}
                  <div className="admin-preonboarding-card" style={{ border: "1px solid #cbd5e1", borderRadius: "16px" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontWeight: "normal", fontSize: "20px" }}>
                      Assign management roles
                    </div>

                    <form onSubmit={handleRoleSubmit}>

                      {/* ROLE SELECT */}
                      <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "normal", color: "#1F2937", fontSize: "0.95rem", textTransform: "none" }}>
                          Role type
                        </label>
                        <select
                          value={roleName}
                          onChange={(e) => {
                            const role = e.target.value;
                            setRoleName(role);
                            loadExistingRoleIds(role);
                          }}
                          className="admin-input-field"
                        >
                          <option value="HR">Hr</option>
                          <option value="FINANCE">Finance</option>
                          <option value="AM">Am</option>
                        </select>
                      </div>

                      {/* EXISTING IDS AS CHIPS */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ fontWeight: "normal", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", display: "block", marginBottom: "8px" }}>
                          Existing employee ids
                        </label>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                          {existingIds.map(id => (
                            <div
                              key={id}
                              style={{
                                background: "#e6f7f5",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: "normal",
                                color: "#1F2937"
                              }}
                            >
                              {getDisplayEmployeeId(id)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  console.log('X button clicked for employee:', id);

                                  // Use a timeout to prevent flickering
                                  setTimeout(() => {
                                    const confirmed = window.confirm(`Remove ${getDisplayEmployeeId(id)} permanently?`);
                                    console.log('User confirmed removal for:', id, confirmed);
                                    if (confirmed) {
                                      handleDeleteEmployee(id);
                                    }
                                  }, 100);
                                }}
                                type="button"
                                style={{
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontWeight: "normal",
                                  fontSize: "14px",
                                  width: "20px",
                                  height: "20px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "50%",
                                  transition: "background-color 0.2s ease",
                                  userSelect: "none",
                                  border: "none",
                                  background: "transparent",
                                  position: "relative",
                                  zIndex: 10,
                                  padding: 0,
                                  margin: 0
                                }}
                                className="employee-remove-btn"
                                title={`Remove ${getDisplayEmployeeId(id)}`}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ADD NEW IDS */}
                      <div style={{ marginBottom: "20px", position: 'relative' }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "normal", color: "#1F2937", fontSize: "0.95rem", textTransform: "none" }}>
                          Add employee ids (comma separated)
                        </label>
                        <input
                          ref={newEmployeeIdsRef}
                          type="text"
                          placeholder="EMP111, H100118 or ALL"
                          value={newEmployeeIds}
                          onChange={(e) => handleEmployeeIdsChange(e.target.value, 'newEmployeeIds')}
                          onKeyDown={handleKeyDown}
                          className="admin-input-field"
                        />
                        <EmployeeSuggestion
                          suggestions={employeeSuggestions}
                          showSuggestions={showEmployeeSuggestions && activeSearchField === 'newEmployeeIds'}
                          suggestionsLoading={suggestionsLoading}
                          onSelect={handleSuggestionClick}
                          suggestionsRef={suggestionsRef}
                          selectedSuggestionIndex={selectedSuggestionIndex}
                          setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                        />
                      </div>

                      <button
                        type="submit"
                        className="admin-btn-primary"
                        style={{
                          width: "100%",
                          background: "#00B3A4",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: "12px",
                          fontWeight: "normal",
                          cursor: "pointer",
                          fontSize: "1rem",
                          minHeight: "48px",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#00968A"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#00B3A4"}
                      >
                        Submit
                      </button>
                    </form>

                    {roleStatus && (
                      <div style={{
                        marginTop: "16px",
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontWeight: "normal"
                      }}>
                        {roleStatus}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {selectedModule === "HELPDESK" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto", textAlign: "left" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "1.75rem",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    Helpdesk administration
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Human resource information system - Manage support teams, categories, and subcategories
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", textAlign: "left" }}>
                  {/* FORM 1 — CREATE TEAM */}
                  <div className="admin-preonboarding-card" style={{ borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <h3 style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                      Create support team
                    </h3>
                    <div style={{ minHeight: "280px" }}>
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>New team name</label>
                        <input
                          type="text"
                          placeholder="e.g. HR support, IT support"
                          value={teamNameCreate}
                          onChange={(e) => setTeamNameCreate(e.target.value)}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={handleCreateTeam}
                        style={{
                          width: "100%",
                          background: "#00B3A4",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: "8px",
                          fontWeight: "normal",
                          cursor: "pointer",
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background-color 0.2s"
                        }}
                      >
                        Submit
                      </button>
                      {teamStatus && <p style={{ marginTop: "12px", color: "#0d9488", fontWeight: "normal" }}>{teamStatus}</p>}
                    </div>
                  </div>

                  {/* FORM 2 — ASSIGN EMPLOYEES */}
                  <div className="admin-preonboarding-card" style={{ borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <h3 style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                      Assign team members
                    </h3>
                    <div style={{ minHeight: "280px" }}>
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Target team</label>
                        <select
                          value={teamNameAssign}
                          onChange={async (e) => {
                            const name = e.target.value;
                            setTeamNameAssign(name);
                            if (name) await loadExistingTeamIds(name);
                          }}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        >
                          <option value="">-- Select Team --</option>
                          {allTeams.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div style={{ marginBottom: "16px", position: 'relative' }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Update team members</label>
                        <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "8px", textAlign: "left" }}>
                          Enter the complete list of employee IDs (comma-separated). This will replace the current members.
                        </p>
                        <input
                          ref={teamEmployeeIdsRef}
                          type="text"
                          placeholder="e.g. Emp001, Emp002, Emp003"
                          value={teamEmployeeIds}
                          onChange={(e) => handleEmployeeIdsChange(e.target.value, 'teamEmployeeIds')}
                          onKeyDown={handleKeyDown}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        />
                        <EmployeeSuggestion
                          suggestions={employeeSuggestions}
                          showSuggestions={showEmployeeSuggestions && activeSearchField === 'teamEmployeeIds'}
                          suggestionsLoading={suggestionsLoading}
                          onSelect={handleSuggestionClick}
                          suggestionsRef={suggestionsRef}
                          selectedSuggestionIndex={selectedSuggestionIndex}
                          setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={handleSaveTeamIds}
                        style={{
                          width: "100%",
                          background: "#00B3A4",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: "8px",
                          fontWeight: "normal",
                          cursor: "pointer",
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background-color 0.2s"
                        }}
                      >
                        Submit
                      </button>
                      {teamStatus && <p style={{ marginTop: "12px", color: "#0d9488", fontWeight: "normal" }}>{teamStatus}</p>}
                    </div>
                  </div>

                  {/* FORM 3 — CREATE CATEGORY */}
                  <div className="admin-preonboarding-card" style={{ borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <h3 style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                      Create issue category
                    </h3>
                    <div style={{ minHeight: "280px" }}>
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Support team</label>
                        <select
                          value={categoryTeam}
                          onChange={(e) => setCategoryTeam(e.target.value)}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        >
                          <option value="">-- Select Team --</option>
                          {allTeams.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Ticket type</label>
                        <select
                          value={categoryType}
                          onChange={(e) => setCategoryType(e.target.value)}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        >
                          <option value="">-- Select Type --</option>
                          <option value="NEW_TICKET">NEW TICKET</option>
                          <option value="CHANGE_REQUEST">CHANGE REQUEST</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Category label</label>
                        <input
                          type="text"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="e.g. Software issue"
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={handleCreateCategory}
                        style={{
                          width: "100%",
                          background: "#00B3A4",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: "8px",
                          fontWeight: "normal",
                          cursor: "pointer",
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background-color 0.2s"
                        }}
                      >
                        Submit
                      </button>
                      {categoryStatus && <p style={{ marginTop: "10px", color: "#0d9488", fontWeight: "normal" }}>{categoryStatus}</p>}
                    </div>

                    <div style={{ marginTop: "20px", maxHeight: "150px", overflowY: "auto", padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "left" }}>
                      <h4 style={{ margin: "0 0 10px 0", fontSize: "0.875rem", color: "#64748b", fontWeight: "normal", textAlign: "left" }}>Current Categories</h4>
                      <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem", color: "#1e293b", textAlign: "left" }}>
                        {categoryList.length > 0 ? categoryList.map(c => <li key={c.id} style={{ textAlign: "left" }}>{c.categoryName}</li>) : <li style={{ color: "#94a3b8", listStyle: "none", textAlign: "left" }}>No categories</li>}
                      </ul>
                    </div>
                  </div>

                  {/* FORM 4 — CREATE SUBCATEGORY */}
                  <div className="admin-preonboarding-card" style={{ borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <h3 style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                      Add sub-category
                    </h3>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Ticket type</label>
                      <select
                        value={teamType}
                        onChange={(e) => { setTeamType(e.target.value); setSelectedCategoryId(""); setSubCategories([]); loadCategoriesByTicketType(e.target.value); }}
                        className="admin-input-field"
                        style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                      >
                        <option value="">-- Select Type --</option>
                        <option value="NEW_TICKET">NEW TICKET</option>
                        <option value="CHANGE_REQUEST">CHANGE REQUEST</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Parent category</label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="admin-input-field"
                        style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Sub-category label</label>
                      <input
                        type="text"
                        placeholder="e.g. Windows update"
                        value={subCategoryName}
                        onChange={(e) => setSubCategoryName(e.target.value)}
                        className="admin-input-field"
                        style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ marginTop: "auto" }}>
                      <button
                        onClick={handleCreateSubCategory}
                        style={{
                          width: "100%",
                          background: "#00B3A4",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: "8px",
                          fontWeight: "normal",
                          cursor: "pointer",
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background-color 0.2s"
                        }}
                      >
                        Submit
                      </button>
                      {subCategoryStatus && <p style={{ marginTop: "10px", color: "#0d9488", fontWeight: "normal" }}>{subCategoryStatus}</p>}
                    </div>

                    <div style={{ marginTop: "20px", maxHeight: "150px", overflowY: "auto", padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "left" }}>
                      <h4 style={{ margin: "0 0 10px 0", fontSize: "0.875rem", color: "#64748b", fontWeight: "normal", textAlign: "left" }}>Current Sub-Categories</h4>
                      <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem", color: "#1e293b", textAlign: "left" }}>
                        {subCategories.length > 0 ? subCategories.map(s => <li key={s.id} style={{ textAlign: "left" }}>{s.subCategoryName}</li>) : <li style={{ color: "#94a3b8", listStyle: "none", textAlign: "left" }}>No sub-categories</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN (Grievance Master Data) */}
            {selectedModule === "GRIEVANCE_MASTER" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto", textAlign: "left" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "1.75rem",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    Grievance & admin configuration
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Human resource information system - Configure grievance administration settings and master schemas
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", textAlign: "left" }}>
                  {/* FORM 1 → Assign Admin Access */}
                  <div className="admin-preonboarding-card" style={{ borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                      Admin role assignment
                    </div>
                    <form onSubmit={handleAdminAccessSubmit}>
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Role definition</label>
                        <select
                          value={adminRole}
                          onChange={(e) => setAdminRole(e.target.value)}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        >
                          <option value="ADMIN">System Administrator</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: "20px", position: 'relative' }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Admin employee ids</label>
                        <input
                          ref={adminIdsRef}
                          type="text"
                          placeholder="e.g. H1001, H1002"
                          value={adminIds}
                          onChange={(e) => handleEmployeeIdsChange(e.target.value, 'adminIds')}
                          onKeyDown={handleKeyDown}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        />
                        <EmployeeSuggestion
                          suggestions={employeeSuggestions}
                          showSuggestions={showEmployeeSuggestions && activeSearchField === 'adminIds'}
                          suggestionsLoading={suggestionsLoading}
                          onSelect={handleSuggestionClick}
                          suggestionsRef={suggestionsRef}
                          selectedSuggestionIndex={selectedSuggestionIndex}
                          setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          width: "100%",
                          background: "#00B3A4",
                          color: "white",
                          border: "none",
                          padding: "12px 20px",
                          borderRadius: "8px",
                          fontWeight: "normal",
                          cursor: "pointer",
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background-color 0.2s"
                        }}
                      >
                        Submit
                      </button>
                    </form>
                    {adminStatus && <p style={{ marginTop: "12px", color: "#0d9488", fontWeight: "normal" }}>{adminStatus}</p>}
                  </div>

                  {/* FORM 2 & 3 → Add Category & Type */}
                  <div className="admin-preonboarding-card" style={{ borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                      Grievance master setup
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>New grievance category</label>
                      <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                        <input
                          type="text"
                          placeholder="e.g. Workplace, Facility"
                          value={gCategory}
                          onChange={(e) => setGCategory(e.target.value)}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        />
                        <button
                          onClick={handleSaveGrievanceCategory}
                          style={{
                            width: "100%",
                            background: "#00B3A4",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: "8px",
                            fontWeight: "normal",
                            cursor: "pointer",
                            fontSize: "1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background-color 0.2s"
                          }}
                        >
                          Submit
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>New grievance type</label>
                      <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                        <input
                          type="text"
                          placeholder="e.g. Urgent, Routine"
                          value={gType}
                          onChange={(e) => setGType(e.target.value)}
                          className="admin-input-field"
                          style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                        />
                        <button
                          onClick={handleSaveGrievanceType}
                          style={{
                            width: "100%",
                            background: "#00B3A4",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: "8px",
                            fontWeight: "normal",
                            cursor: "pointer",
                            fontSize: "1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background-color 0.2s"
                          }}
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                    {gStatus && <p style={{ marginTop: "12px", color: "#0d9488", fontWeight: "normal" }}>{gStatus}</p>}
                  </div>

                  {/* FORM 4 → Show All Categories & Types */}
                  <div style={{
                    background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", gridColumn: "span 1", textAlign: "left"
                  }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                      Existing grievance schema
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", textAlign: "left" }}>
                      <div style={{ textAlign: "left" }}>
                        <h4 style={{ color: "#00B3A4", fontSize: "0.9rem", marginBottom: "10px", fontWeight: "normal", textTransform: "none", textAlign: "left" }}>Categories</h4>
                        <ul style={{ paddingLeft: "1.25rem", color: "#1F2937", fontSize: "0.95rem", textAlign: "left" }}>
                          {allGrievanceMaster.filter(row => row.grievanceCategory).map(row => <li key={row.id} style={{ marginBottom: "4px", textAlign: "left" }}>{row.grievanceCategory}</li>)}
                        </ul>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <h4 style={{ color: "#00B3A4", fontSize: "0.9rem", marginBottom: "10px", fontWeight: "normal", textTransform: "none", textAlign: "left" }}>Types</h4>
                        <ul style={{ paddingLeft: "1.25rem", color: "#1F2937", fontSize: "0.95rem", textAlign: "left" }}>
                          {allGrievanceMaster.filter(row => row.grievanceType).map(row => <li key={row.id} style={{ marginBottom: "4px", textAlign: "left" }}>{row.grievanceType}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedModule === "TRAVEL_ADMIN" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto", textAlign: "left" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "1.75rem",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    Travel admin configuration
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Human resource information system - Manage travel administration access and system properties
                  </div>
                </div>
                <AdminTicket />
              </div>
            )}

            {selectedModule === "EMP_HANDBOOK" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                {/* Page Header */}
                <div style={{ marginBottom: "28px", borderBottom: "2px solid #f1f5f9", paddingBottom: "20px" }}>
                  <div style={{ color: "#1F2937", fontSize: "1.75rem", fontWeight: "normal", marginBottom: "6px" }}>
                    Policies management
                  </div>
                  <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginBottom: "0px" }}>
                    Manage policy categories and upload policy documents for employees
                  </div>
                </div>

                {/* Two-column layout */}
                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>

                  {/* LEFT PANEL — Manage Categories */}
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ background: "#629AF1", padding: "14px 20px" }}>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: "normal" }}>Manage policy categories</h3>
                      <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "0.78rem" }}>Add or remove categories</p>
                    </div>
                    <div style={{ padding: "20px" }}>
                      {/* Add new category */}
                      <div style={{ marginBottom: "16px" }}>
                         <input
                          type="text"
                          value={newCategoryLabel}
                          onChange={(e) => setNewCategoryLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (!newCategoryLabel.trim()) {
                                alert("Category name is required.");
                                return;
                              }
                              const isDuplicate = handbookCategories.some(
                                cat => cat.categoryLabel.trim().toLowerCase() === newCategoryLabel.trim().toLowerCase()
                              );
                              if (isDuplicate) {
                                alert(`Category "${newCategoryLabel.trim()}" already exists.`);
                                return;
                              }
                              api.post(`/handbook/categories?label=${encodeURIComponent(newCategoryLabel.trim())}`, null, {
                                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                              }).then(() => { setNewCategoryLabel(""); fetchHandbookCategories(); })
                                .catch(() => alert("Failed to add category"));
                            }
                          }}
                          placeholder="New category name..."
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", marginBottom: "8px" }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newCategoryLabel.trim()) {
                              alert("Category name is required.");
                              return;
                            }
                            const isDuplicate = handbookCategories.some(
                              cat => cat.categoryLabel.trim().toLowerCase() === newCategoryLabel.trim().toLowerCase()
                            );
                            if (isDuplicate) {
                              alert(`Category "${newCategoryLabel.trim()}" already exists.`);
                              return;
                            }
                            try {
                              await api.post(`/handbook/categories?label=${encodeURIComponent(newCategoryLabel.trim())}`, null, {
                                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                              });
                              setNewCategoryLabel("");
                              fetchHandbookCategories();
                            } catch (err) { alert("Failed to add category"); }
                          }}
                          style={{ width: "100%", background: "#00B3A4", color: "#fff", border: "none", padding: "9px", borderRadius: "8px", fontWeight: "normal", cursor: "pointer", fontSize: "0.875rem" }}
                        >
                          Submit
                        </button>
                      </div>
                      {/* Category list */}
                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                        <p style={{ margin: "0 0 10px 0", fontSize: "0.875rem", color: "#1F2937", fontWeight: "normal", textTransform: "none" }}>Existing categories</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {handbookCategories.map(cat => (
                            <div key={cat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                              <span style={{ fontSize: "0.875rem", color: "#1F2937", fontWeight: "normal" }}>{cat.categoryLabel}</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Delete "${cat.categoryLabel}"?`)) return;
                                  try {
                                    await api.delete(`/handbook/categories/${cat.id}`, {
                                      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                                    });
                                    fetchHandbookCategories();
                                  } catch (err) { alert("Failed to delete category"); }
                                }}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "2px 4px" }}
                                title="Delete category"
                              >×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANEL — Upload + Active Policies */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Upload Card */}
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ background: "#629AF1", padding: "14px 20px" }}>
                        <h3 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: "normal" }}>Upload policy document</h3>
                        <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "0.78rem" }}>Upload a PDF to a selected category</p>
                      </div>
                      <div style={{ padding: "24px" }}>
                        <form onSubmit={handleHandbookUpload}>
                          <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none", marginBottom: "6px" }}>Category <span style={{ color: "red" }}>*</span></label>
                            <select
                              value={handbookCategory}
                              onChange={(e) => setHandbookCategory(e.target.value)}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", background: "#fff" }}
                            >
                              <option value="">Choose Category</option>
                              {handbookCategories.map(cat => (
                                <option key={cat.id} value={cat.categoryLabel}>{cat.categoryLabel}</option>
                              ))}
                            </select>
                          </div>

                          {/* Hidden file input + Drop zone */}
                          <div style={{ marginBottom: "16px" }}>
                            <input
                              type="file"
                              ref={handbookFileRef}
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                const error = validateHandbookFile(file);
                                if (error) { e.target.value = ""; setHandbookFile(null); return; }
                                setHandbookUploadStatus("");
                                setHandbookFile(file);
                              }}
                              style={{ display: "none" }}
                            />
                            <div
                              onClick={() => handbookFileRef.current?.click()}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = "#00B3A4";
                                e.currentTarget.style.background = "#f0fdfa";
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.style.borderColor = handbookFile ? "#00B3A4" : "#cbd5e1";
                                e.currentTarget.style.background = handbookFile ? "#f0fdfa" : "#f8fafc";
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                const error = validateHandbookFile(file);
                                if (error) { setHandbookFile(null); return; }
                                setHandbookFile(file);
                                e.currentTarget.style.borderColor = "#00B3A4";
                                e.currentTarget.style.background = "#f0fdfa";
                              }}
                              style={{
                                border: handbookFile ? "2px dashed #00B3A4" : "2px dashed #cbd5e1",
                                padding: "32px 20px",
                                textAlign: "center",
                                background: handbookFile ? "#f0fdfa" : "#f8fafc",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                userSelect: "none",
                                borderRadius: "8px"
                              }}
                            >
                              {handbookFile ? (
                                <>
                                  <p style={{ margin: 0, color: "#1F2937", fontWeight: "normal", fontSize: "0.9rem" }}>
                                    {handbookFile.name}
                                  </p>
                                  <p style={{ margin: "6px 0 0 0", color: "#00B3A4", fontSize: "0.78rem", textDecoration: "underline" }}>
                                    Choose another file
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p style={{ margin: 0, color: "#1F2937", fontWeight: "normal", fontSize: "0.9rem" }}>
                                    Choose file or drag and drop PDF here
                                  </p>
                                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.78rem" }}>
                                    Maximum file size: 2MB
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          <button type="submit" style={{ width: "100%", background: "#00B3A4", color: "#fff", border: "none", padding: "11px", borderRadius: "8px", fontWeight: "normal", cursor: "pointer", fontSize: "0.9rem" }}>
                            Submit
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Active Policies Table */}
                    {handbooks.length > 0 && (
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ background: "#629AF1", padding: "14px 20px" }}>
                          <h3 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: "normal" }}>Active policies</h3>
                          <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "0.78rem" }}>{handbooks.length} document{handbooks.length !== 1 ? "s" : ""} published</p>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>File name</th>
                              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>Category</th>
                              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>Uploaded</th>
                              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {handbooks.map((hb) => (
                              <tr key={hb.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <td style={{ padding: "12px 20px", fontSize: "0.875rem", color: "#1F2937", fontWeight: "normal" }}>
                                  {hb.originalFileName}
                                </td>
                                <td style={{ padding: "12px 20px" }}>
                                  <span style={{ background: "#f0fdfa", color: "#00B3A4", fontSize: "0.78rem", fontWeight: "normal", padding: "3px 10px", borderRadius: "20px" }}>{hb.category}</span>
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "0.82rem", color: "#64748b" }}>{new Date(hb.uploadedAt).toLocaleDateString()}</td>
                                <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                    <button type="button"
                                      onClick={async () => {
                                        if (window.confirm("Delete this policy document?")) {
                                          try { await api.delete(`/handbook/delete/${hb.id}`); alert("Deleted"); loadAllHandbooks(); }
                                          catch (err) { alert("Failed to delete"); }
                                        }
                                      }}
                                      style={{ display: "inline-flex", alignItems: "center", color: "#ef4444", fontWeight: "normal", padding: "5px 12px", background: "transparent", border: "1px solid #ef4444", cursor: "pointer", fontSize: "0.8rem", borderRadius: "8px" }}>
                                      Delete
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
                </div>
              </div>
            )}


            {selectedModule === "KNOWLEDGE_HUB" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                {/* Page Header */}
                <div style={{ marginBottom: "28px", borderBottom: "2px solid #f1f5f9", paddingBottom: "20px" }}>
                  <div style={{ color: "#1F2937", fontSize: "1.75rem", fontWeight: "normal", marginBottom: "6px" }}>
                    Knowledge Hub management
                  </div>
                  <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginBottom: "0px" }}>
                    Manage document categories and upload reference documents for employees
                  </div>
                </div>

                {/* Two-column layout */}
                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>

                  {/* LEFT PANEL — Manage Categories */}
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ background: "#629AF1", padding: "14px 20px" }}>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: "normal" }}>Manage document categories</h3>
                      <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "0.78rem" }}>Add or remove categories</p>
                    </div>
                    <div style={{ padding: "20px" }}>
                      {/* Add new category */}
                      <div style={{ marginBottom: "16px" }}>
                         <input
                          type="text"
                          value={newKnowledgeHubCategoryLabel}
                          onChange={(e) => setNewKnowledgeHubCategoryLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (!newKnowledgeHubCategoryLabel.trim()) {
                                alert("Category name is required.");
                                return;
                              }
                              const isDuplicate = knowledgeHubCategories.some(
                                cat => cat.categoryLabel.trim().toLowerCase() === newKnowledgeHubCategoryLabel.trim().toLowerCase()
                              );
                              if (isDuplicate) {
                                alert(`Category "${newKnowledgeHubCategoryLabel.trim()}" already exists.`);
                                return;
                              }
                              api.post(`/knowledge-hub/categories?label=${encodeURIComponent(newKnowledgeHubCategoryLabel.trim())}`, null, {
                                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                              }).then(() => { setNewKnowledgeHubCategoryLabel(""); fetchKnowledgeHubCategories(); })
                                .catch(() => alert("Failed to add category"));
                            }
                          }}
                          placeholder="New category name..."
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", marginBottom: "8px" }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newKnowledgeHubCategoryLabel.trim()) {
                              alert("Category name is required.");
                              return;
                            }
                            const isDuplicate = knowledgeHubCategories.some(
                              cat => cat.categoryLabel.trim().toLowerCase() === newKnowledgeHubCategoryLabel.trim().toLowerCase()
                            );
                            if (isDuplicate) {
                              alert(`Category "${newKnowledgeHubCategoryLabel.trim()}" already exists.`);
                              return;
                            }
                            try {
                              await api.post(`/knowledge-hub/categories?label=${encodeURIComponent(newKnowledgeHubCategoryLabel.trim())}`, null, {
                                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                              });
                              setNewKnowledgeHubCategoryLabel("");
                              fetchKnowledgeHubCategories();
                            } catch (err) { alert("Failed to add category"); }
                          }}
                          style={{ width: "100%", background: "#00B3A4", color: "#fff", border: "none", padding: "9px", borderRadius: "8px", fontWeight: "normal", cursor: "pointer", fontSize: "0.875rem" }}
                        >
                          Submit
                        </button>
                      </div>
                      {/* Category list */}
                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                        <p style={{ margin: "0 0 10px 0", fontSize: "0.875rem", color: "#1F2937", fontWeight: "normal", textTransform: "none" }}>Existing categories</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {knowledgeHubCategories.map(cat => (
                            <div key={cat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                              <span style={{ fontSize: "0.875rem", color: "#1F2937", fontWeight: "normal" }}>{cat.categoryLabel}</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Delete "${cat.categoryLabel}"?`)) return;
                                  try {
                                    await api.delete(`/knowledge-hub/categories/${cat.id}`, {
                                      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                                    });
                                    fetchKnowledgeHubCategories();
                                  } catch (err) { alert("Failed to delete category"); }
                                }}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "2px 4px" }}
                                title="Delete category"
                              >×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANEL — Upload + Active Documents */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Upload Card */}
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ background: "#629AF1", padding: "14px 20px" }}>
                        <h3 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: "normal" }}>Upload reference document</h3>
                        <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "0.78rem" }}>Upload a PDF to a selected category</p>
                      </div>
                      <div style={{ padding: "24px" }}>
                        <form onSubmit={handleKnowledgeHubUpload}>
                          <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none", marginBottom: "6px" }}>Category <span style={{ color: "red" }}>*</span></label>
                            <select
                              value={knowledgeHubCategory}
                              onChange={(e) => setKnowledgeHubCategory(e.target.value)}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", background: "#fff" }}
                            >
                              <option value="">Choose Category</option>
                              {knowledgeHubCategories.map(cat => (
                                <option key={cat.id} value={cat.categoryLabel}>{cat.categoryLabel}</option>
                              ))}
                            </select>
                          </div>

                          {/* Hidden file input + Drop zone */}
                          <div style={{ marginBottom: "16px" }}>
                            <input
                              type="file"
                              ref={knowledgeHubFileRef}
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                const error = validateKnowledgeHubFile(file);
                                if (error) { e.target.value = ""; setKnowledgeHubFile(null); return; }
                                setKnowledgeHubUploadStatus("");
                                setKnowledgeHubFile(file);
                              }}
                              style={{ display: "none" }}
                            />
                            <div
                              onClick={() => knowledgeHubFileRef.current?.click()}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = "#00B3A4";
                                e.currentTarget.style.background = "#f0fdfa";
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.style.borderColor = knowledgeHubFile ? "#00B3A4" : "#cbd5e1";
                                e.currentTarget.style.background = knowledgeHubFile ? "#f0fdfa" : "#f8fafc";
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                const error = validateKnowledgeHubFile(file);
                                if (error) { setKnowledgeHubFile(null); return; }
                                setKnowledgeHubFile(file);
                                e.currentTarget.style.borderColor = "#00B3A4";
                                e.currentTarget.style.background = "#f0fdfa";
                              }}
                              style={{
                                border: knowledgeHubFile ? "2px dashed #00B3A4" : "2px dashed #cbd5e1",
                                padding: "32px 20px",
                                textAlign: "center",
                                background: knowledgeHubFile ? "#f0fdfa" : "#f8fafc",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                userSelect: "none",
                                borderRadius: "8px"
                              }}
                            >
                              {knowledgeHubFile ? (
                                <>
                                  <p style={{ margin: 0, color: "#1F2937", fontWeight: "normal", fontSize: "0.9rem" }}>
                                    {knowledgeHubFile.name}
                                  </p>
                                  <p style={{ margin: "6px 0 0 0", color: "#00B3A4", fontSize: "0.78rem", textDecoration: "underline" }}>
                                    Choose another file
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p style={{ margin: 0, color: "#1F2937", fontWeight: "normal", fontSize: "0.9rem" }}>
                                    Choose file or drag and drop PDF here
                                  </p>
                                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.78rem" }}>
                                    Maximum file size: 2MB
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          <button type="submit" style={{ width: "100%", background: "#00B3A4", color: "#fff", border: "none", padding: "11px", borderRadius: "8px", fontWeight: "normal", cursor: "pointer", fontSize: "0.9rem" }}>
                            Submit
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Active Documents Table */}
                    {knowledgeHubs.length > 0 && (
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ background: "#629AF1", padding: "14px 20px" }}>
                          <h3 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: "normal" }}>Active documents</h3>
                          <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "0.78rem" }}>{knowledgeHubs.length} document{knowledgeHubs.length !== 1 ? "s" : ""} published</p>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>File name</th>
                              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>Category</th>
                              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>Uploaded</th>
                              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: "0.875rem", fontWeight: "normal", color: "#1F2937", textTransform: "none" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {knowledgeHubs.map((hb) => (
                              <tr key={hb.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <td style={{ padding: "12px 20px", fontSize: "0.875rem", color: "#1F2937", fontWeight: "normal" }}>
                                  {hb.originalFileName}
                                </td>
                                <td style={{ padding: "12px 20px" }}>
                                  <span style={{ background: "#f0fdfa", color: "#00B3A4", fontSize: "0.78rem", fontWeight: "normal", padding: "3px 10px", borderRadius: "20px" }}>{hb.category}</span>
                                </td>
                                <td style={{ padding: "12px 20px", fontSize: "0.82rem", color: "#64748b" }}>{new Date(hb.uploadedAt).toLocaleDateString()}</td>
                                <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                    <button type="button"
                                      onClick={async () => {
                                        if (window.confirm("Delete this document?")) {
                                          try { await api.delete(`/knowledge-hub/delete/${hb.id}`); alert("Deleted"); loadAllKnowledgeHubs(); }
                                          catch (err) { alert("Failed to delete"); }
                                        }
                                      }}
                                      style={{ display: "inline-flex", alignItems: "center", color: "#ef4444", fontWeight: "normal", padding: "5px 12px", background: "transparent", border: "1px solid #ef4444", cursor: "pointer", fontSize: "0.8rem", borderRadius: "8px" }}>
                                      Delete
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
                </div>
              </div>
            )}


            {/* HOLIDAYS MODULE */}
            {selectedModule === "HOLIDAYS" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "30px",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    Holiday calendar management
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Manage company holiday calendars, localized holiday lists, and regional assignments.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div className="admin-preonboarding-card" style={{ border: "1px solid #cbd5e1", borderRadius: "16px" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "20px", fontWeight: "normal" }}>
                      New location
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <input type="text" placeholder="Enter location name (e.g., Chennai)" value={locationName} onChange={(e) => setLocationName(e.target.value)} className="admin-input-field" />
                    </div>
                    <button
                      onClick={handleAddLocation}
                      className="admin-btn-primary"
                      style={{
                        width: "100%",
                        background: "#00B3A4",
                        color: "white",
                        border: "none",
                        padding: "12px 20px",
                        borderRadius: "12px",
                        fontWeight: "normal",
                        cursor: "pointer",
                        fontSize: "1rem",
                        minHeight: "48px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#00968A"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#00B3A4"}
                    >
                      Submit
                    </button>

                    <div style={{ marginTop: "32px" }}>
                      <div style={{ color: "#1F2937", marginBottom: "16px", fontSize: "15px", fontWeight: "normal" }}>
                        Select target location
                      </div>
                      <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="admin-input-field">
                        <option value="">-- Choose location --</option>
                        {locations.map((loc) => <option key={loc.id} value={loc.locationName}>{loc.locationName}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="admin-preonboarding-card" style={{ border: "1px solid #cbd5e1", borderRadius: "16px" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "20px", fontWeight: "normal" }}>
                      Import holiday sheet
                    </div>

                    <button
                      onClick={downloadHolidayTemplate}
                      className="admin-btn-secondary"
                      style={{
                        width: "100%",
                        marginBottom: "24px",
                        color: "#00B3A4",
                        border: "2px solid #00B3A4",
                        background: "#f0fdfd",
                        padding: "12px 20px",
                        borderRadius: "12px",
                        fontWeight: "normal",
                        cursor: "pointer",
                        fontSize: "1rem",
                        minHeight: "48px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e6fcfb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f0fdfd";
                      }}
                    >
                      Download excel template
                    </button>

                    <div
                      onClick={() => !holidayFile && holidayFileRef.current?.click()}
                      style={{
                        marginBottom: "24px",
                        padding: "20px",
                        border: "2px dashed #00B3A4",
                        borderRadius: "16px",
                        background: "#f0fdfd",
                        textAlign: "center",
                        cursor: holidayFile ? "default" : "pointer"
                      }}
                    >
                      {!holidayFile ? (
                        <>
                          <div style={{ margin: "0 0 10px 0", fontWeight: "normal", color: "#1F2937", fontSize: "0.95rem" }}>
                            Select holiday file
                          </div>
                          <input
                            type="file"
                            ref={holidayFileRef}
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setHolidayFile(e.target.files[0]);
                              }
                            }}
                            style={{ display: "none" }}
                            id="holiday-file-input"
                          />
                          <label
                            htmlFor="holiday-file-input"
                            style={{
                              display: "inline-block",
                              padding: "12px 24px",
                              background: "#00B3A4",
                              color: "white",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "normal",
                              fontSize: "0.95rem",
                              transition: "all 0.2s",
                              border: "none",
                              marginTop: "10px"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#00968A"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#00B3A4"}
                          >
                            Choose files
                          </label>
                        </>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "12px 18px", borderRadius: "12px", border: "2px solid #00B3A4" }}>
                          <span style={{ fontSize: "0.95rem", color: "#1F2937", fontWeight: "normal", display: "flex", alignItems: "center", gap: "10px" }}>
                            {holidayFile.name}
                          </span>
                          <FiTrash2
                            style={{ cursor: "pointer", color: "#ef4444", fontSize: "1.2rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setHolidayFile(null);
                              if (holidayFileRef.current) holidayFileRef.current.value = "";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleHolidayUploadWithLocation}
                      className="admin-btn-primary"
                      style={{
                        width: "100%",
                        background: "#00B3A4",
                        color: "white",
                        border: "none",
                        padding: "12px 20px",
                        borderRadius: "12px",
                        fontWeight: "normal",
                        cursor: "pointer",
                        fontSize: "1rem",
                        minHeight: "48px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#00968A"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#00B3A4"}
                    >
                      Submit
                    </button>

                    {holidayUploadStatus && (
                      <div style={{ marginTop: "16px", textAlign: "center", color: "#00B3A4", fontWeight: "normal" }}>{holidayUploadStatus}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedModule === "CLAIM_CATEGORY" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "1.75rem",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    Reimbursements configuration
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Manage employee claim categories, maximum expense limits, and reimbursement rules.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
                  <div className="admin-preonboarding-card" style={{ background: "transparent", border: "none", boxShadow: "none", padding: "0" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal" }}>
                      New expense category
                    </div>
                    <form onSubmit={handleClaimCategorySubmit}>
                      <div style={{ marginBottom: "20px" }}>
                        <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Category label</label>
                        <input
                          type="text"
                          placeholder="Ex: Travel, Food, Internet"
                          value={claimCategoryLabel}
                          onChange={(e) => setClaimCategoryLabel(e.target.value)}
                          className="admin-input-field"
                        />
                      </div>
                      <button type="submit" className="admin-btn-primary" style={{ width: "100%", backgroundColor: "#00B3A4", color: "#ffffff", fontWeight: "normal" }}>
                        Register category
                      </button>
                    </form>
                    {claimCategoryStatus && (
                      <div style={{ marginTop: "16px", padding: "10px", background: "#dcfce7", color: "#166534", borderRadius: "8px", textAlign: "center", fontWeight: "normal" }}>{claimCategoryStatus}</div>
                    )}
                  </div>

                  <div className="admin-preonboarding-card" style={{ background: "transparent", border: "none", boxShadow: "none", padding: "0" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal" }}>Registered categories</div>
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {claimCategories.length === 0 ? (
                        <p style={{ color: "#94a3b8", textAlign: "center" }}>No categories configured yet.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {claimCategories.map((c) => (
                            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                              <span style={{ fontWeight: "normal", color: "#334155" }}>{c.categoryName}</span>
                              <button onClick={() => handleDeleteClaimCategory(c.id)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                <FiTrash2 /> Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedModule === "WORKFLOW" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                <div style={{ color: "#1F2937", fontSize: "1.75rem", fontWeight: "normal", marginBottom: "6px" }}>
                  Enterprise document management
                </div>
                <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginBottom: "24px" }}>
                  Human resource information system - Manage employee documents, letters, and company policies
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
                  {/* Document Upload Area */}
                  <div className="admin-preonboarding-card">
                    <div style={{ color: "#00B3A4", marginBottom: "24px", fontSize: "1.25rem", fontWeight: "normal" }}>
                      Upload new document
                    </div>

                    <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", marginBottom: "24px" }}>
                      <button
                        onClick={() => setWorkflowTab("INDIVIDUAL")}
                        style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: workflowTab === "INDIVIDUAL" ? "#00B3A4" : "transparent", fontWeight: "normal", color: workflowTab === "INDIVIDUAL" ? "white" : "#1F2937", cursor: "pointer" }}
                      >
                        Employee specific
                      </button>
                      <button
                        onClick={() => { setWorkflowTab("ALL"); setWorkflowEmployeeIds(""); }}
                        style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: workflowTab === "ALL" ? "#00B3A4" : "transparent", fontWeight: "normal", color: workflowTab === "ALL" ? "white" : "#1F2937", cursor: "pointer" }}
                      >
                        Policy document
                      </button>
                    </div>

                    <form onSubmit={handleWorkflowSubmit}>
                      {workflowTab === "INDIVIDUAL" && (
                        <div style={{ marginBottom: "20px", position: 'relative' }}>
                          <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Target employee ids</label>
                          <input
                            ref={workflowEmployeeIdsRef}
                            type="text"
                            value={workflowEmployeeIds}
                            onChange={(e) => handleEmployeeIdsChange(e.target.value, 'workflowEmployeeIds')}
                            onKeyDown={handleKeyDown}
                            placeholder="EMP101, EMP102"
                            className="admin-input-field"
                          />
                          <EmployeeSuggestion
                            suggestions={employeeSuggestions}
                            showSuggestions={showEmployeeSuggestions && activeSearchField === 'workflowEmployeeIds'}
                            suggestionsLoading={suggestionsLoading}
                            onSelect={handleSuggestionClick}
                            suggestionsRef={suggestionsRef}
                            selectedSuggestionIndex={selectedSuggestionIndex}
                            setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                          />
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                        <div>
                          <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Fiscal year</label>
                          <select value={workflowYear} onChange={(e) => setWorkflowYear(e.target.value)} className="admin-input-field">
                            {Array.from({ length: 10 }, (_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Category</label>
                          <select value={workflowCategory} onChange={(e) => setWorkflowCategory(e.target.value)} className="admin-input-field">
                            <option value="">-- Select --</option>
                            {workflowCategories.map((c) => <option key={c.id} value={c.id}>{c.categoryLabel}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: "24px", padding: "20px", border: "2px dashed #e2e8f0", borderRadius: "16px", background: "#f8fafc", textAlign: "center" }}>
                        {!workflowFile ? (
                          <>
                            <input
                              type="file"
                              ref={workflowFileRef}
                              onChange={(e) => setWorkflowFile(e.target.files[0])}
                              style={{ display: "none" }}
                              id="workflow-file-input"
                            />
                            <label
                              htmlFor="workflow-file-input"
                              style={{
                                display: "inline-block",
                                padding: "12px 24px",
                                background: "#00B3A4",
                                color: "white",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "normal",
                                fontSize: "0.95rem",
                                transition: "background-color 0.2s",
                                border: "none"
                              }}
                            >
                              Choose files
                            </label>
                          </>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "12px 18px", borderRadius: "12px", border: "2px solid #00B3A4" }}>
                            <span style={{ fontSize: "0.95rem", color: "#00B3A4", fontWeight: "normal", display: "flex", alignItems: "center", gap: "10px" }}>
                              {workflowFile.name}
                            </span>
                            <FiTrash2 style={{ cursor: "pointer", color: "#ef4444", fontSize: "1.2rem" }} onClick={() => { setWorkflowFile(null); if (workflowFileRef.current) workflowFileRef.current.value = ""; }} />
                          </div>
                        )}
                      </div>

                      <button type="submit" className="admin-btn-primary" style={{ width: "100%", backgroundColor: "#00B3A4", color: "white", fontWeight: "normal" }}>
                        Submit
                      </button>
                    </form>
                    {workflowStatus && <div style={{ marginTop: "16px", textAlign: "center", color: "#0d9488", fontWeight: "700" }}>{workflowStatus}</div>}
                  </div>

                  {/* Category Management Area */}
                  <div className="admin-preonboarding-card">
                    <div style={{ color: "#00B3A4", marginBottom: "24px", fontSize: "1.25rem", fontWeight: "normal" }}>
                      Workflow categories
                    </div>

                    <form onSubmit={handleDocCategorySubmit} style={{ marginBottom: "24px" }}>
                      <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                        <input type="text" value={docCategoryLabel} onChange={(e) => setDocCategoryLabel(e.target.value)} placeholder="New category label" className="admin-input-field" />
                        <button type="submit" className="admin-btn-primary" style={{ width: "100%", backgroundColor: "#00B3A4", color: "white", fontWeight: "normal" }}>Submit</button>
                      </div>
                      {docCategoryStatus && (
                        <div style={{
                          marginTop: "12px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          textAlign: "center",
                          backgroundColor: docCategoryStatus.includes("success") ? "#10b981" : docCategoryStatus.includes("Failed") ? "#ef4444" : "#f59e0b",
                          color: "white"
                        }}>
                          {docCategoryStatus}
                        </div>
                      )}
                    </form>

                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {categoriesLoading ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                          Loading categories...
                        </div>
                      ) : docCategoryList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                          No categories found. Add your first category above.
                        </div>
                      ) : (
                        docCategoryList.map((c) => (
                          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#334155", fontWeight: "normal" }}>{c.categoryLabel}</span>
                            <button onClick={() => handleDeleteDocCategory(c.id)} style={{ background: "transparent", color: "#ef4444", border: "none", padding: "4px", cursor: "pointer" }}><FiTrash2 /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedModule === "EXIT_REASON" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    color: "#1F2937",
                    fontSize: "1.75rem",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                  }}>
                    Exit management system
                  </h2>
                  <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Configure resignation reasons, notice periods, and custom exit feedback questions.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
                  {/* EXIT REASONS */}
                  <div className="admin-preonboarding-card">
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal" }}>
                      Exit reasons
                    </div>
                    <form onSubmit={handleExitReasonSubmit} style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                        <input type="text" value={exitReason} onChange={(e) => setExitReason(e.target.value)} placeholder="Ex: Better Opportunity" className="admin-input-field" />
                        <button type="submit" className="admin-btn-primary" style={{ width: "100%", backgroundColor: "#00B3A4", color: "#ffffff", fontWeight: "normal" }}>Add</button>
                      </div>
                    </form>
                    <div style={{ maxHeight: "200px", overflowY: "auto", padding: "4px" }}>
                      {exitCategories.map((r) => (
                        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "0.9rem", color: "#334155" }}>{r.reason}</span>
                          <button onClick={() => handleDeleteReason(r.id)} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}><FiTrash2 /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NOTICE PERIOD */}
                  <div className="admin-preonboarding-card">
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal" }}>
                      Notice period configuration
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Standard notice (days)</label>
                      <input type="number" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} className="admin-input-field" />
                    </div>
                    <button onClick={updateNotice} className="admin-btn-primary" style={{ width: "100%", backgroundColor: "#00B3A4", color: "#ffffff", fontWeight: "normal" }}>
                      Update baseline
                    </button>
                    {noticeStatus && <p style={{ marginTop: "12px", color: "#0d9488", textAlign: "center", fontWeight: "normal" }}>{noticeStatus}</p>}
                  </div>

                  {/* EXIT QUESTIONS */}
                  <div className="admin-preonboarding-card" style={{ gridColumn: "span 1" }}>
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal" }}>
                      Exit survey architect
                    </div>
                    <form onSubmit={handleQuestionSubmit}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "10px" }}>
                        <input type="text" placeholder="Question ?" value={questionLabel} onChange={(e) => setQuestionLabel(e.target.value)} className="admin-input-field" />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                        <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="admin-input-field">
                          <option value="TEXT">Short Text</option>
                          <option value="TEXTAREA">Long Text</option>
                          <option value="RATING">Rating (1–5)</option>
                          <option value="YESNO">Yes / No</option>
                        </select>
                        <input type="number" placeholder="Order" value={questionOrder} onChange={(e) => setQuestionOrder(e.target.value)} className="admin-input-field" />
                      </div>
                      <button type="submit" className="admin-btn-primary" style={{ width: "100%", backgroundColor: "#00B3A4", color: "#ffffff", fontWeight: "normal" }}>Add survey question</button>
                    </form>
                    {questionStatus && <p style={{ marginTop: "10px", color: "#0d9488", textAlign: "center", fontWeight: "normal" }}>{questionStatus}</p>}
                  </div>

                  {/* EXISTING QUESTIONS LIST */}
                  <div className="admin-preonboarding-card">
                    <div style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal" }}>Active question stack</div>
                    <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                      {questions.sort((a, b) => a.displayOrder - b.displayOrder).map((q) => (
                        <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid #f1f5f9" }}>
                          <div>
                            <div style={{ fontWeight: "normal", color: "#1F2937", fontSize: "0.8rem" }}>Order {q.displayOrder} • {q.type.toLowerCase()}</div>
                            <div style={{ color: "#334155", fontWeight: "normal" }}>{q.label}</div>
                          </div>
                          <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}><FiTrash2 /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {selectedModule === "LEAVE_ADMIN" && (
              <div style={{ width: "100%" }}>
                <AdminLeaveFunctionalityPage />
              </div>
            )}

            {selectedModule === "PERFORMANCE_ADMIN" && (
              <div style={{ width: "100%" }}>
                <PerformanceAdmin />
              </div>
            )}

            {selectedModule === "MODULE_ACCESS" && (
              <div style={{ width: "100%" }}>
                <ModuleAccessPage />
              </div>
            )}

            {selectedModule === "ORG_CHART" && (
              <div style={{ width: "100%" }}>
                <AdminOrgChartSetup />
              </div>
            )}

            {selectedModule === "COMPANY_LOCATIONS" && (
              <div style={{ width: "100%" }}>
                <CompanyLocations />
              </div>
            )}

            {selectedModule === "IT_DECLARATION" && (
              <div style={{ width: "100%" }}>
                <AdminITDeclaration />
              </div>
            )}

            {selectedModule === "COMP_SETTINGS" && (
              <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto" }}>
                <CompensationSettings />
              </div>
            )}



          </div>
        )}
      </div>
    </Sidebar>
  );
}