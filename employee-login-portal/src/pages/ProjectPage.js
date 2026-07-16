import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
import api from "../api";
import DatePicker, { registerLocale } from "react-datepicker";
import { FiBriefcase, FiPlus, FiDownload, FiEdit } from 'react-icons/fi';
import "react-datepicker/dist/react-datepicker.css";
import enGB from 'date-fns/locale/en-GB';
import './Leave.css';
import './ContractManagement.css';

const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

const getTenantPrefix = () => {
  const fullId = sessionStorage.getItem("employeeId");
  if (!fullId) return "";
  if (fullId.includes('_')) {
    return fullId.substring(0, fullId.lastIndexOf('_') + 1);
  }
  if (fullId.includes('-')) {
    const lastHyphen = fullId.lastIndexOf('-');
    return fullId.substring(0, lastHyphen + 1);
  }
  return "";
};

const getFullEmployeeId = (cleanId) => {
  if (!cleanId) return "";
  if (cleanId.includes('_') || cleanId.includes('-')) {
    return cleanId;
  }
  const prefix = getTenantPrefix();
  return prefix + cleanId;
};


// Employee Suggestion Component
const EmployeeSuggestion = ({
  suggestions,
  showSuggestions,
  suggestionsLoading,
  onSelect,
  suggestionsRef,
  fieldName,
  selectedSuggestionIndex,
  setSelectedSuggestionIndex
}) => {
  if (!showSuggestions) return null;

  return (
    <div
      ref={suggestionsRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        backgroundColor: 'white',
        border: '1px solid #99f6e4',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000,
        width: '100%',
        boxSizing: 'border-box'
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
            data-suggestion-item
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '13px',
              transition: 'background-color 0.2s',
              backgroundColor: selectedSuggestionIndex === index ? '#e0e0e0' : 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
              setSelectedSuggestionIndex(index);
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              setSelectedSuggestionIndex(-1);
            }}
            onClick={() => onSelect(employee, fieldName)}
          >
            {employee.firstName} {employee.lastName} ({getDisplayEmployeeId(employee.employeeId)})
          </div>
        ))
      )}
    </div>
  );
};

registerLocale('en-GB', enGB);
// --- START: Responsive Constants ---
const mobileBreakpoint = 768;
// Function to check if the current width is mobile size
const isMobile = (width) => width < mobileBreakpoint;
// --- END: Responsive Constants ---

// SmartDatePicker component matching onboarding/Leaves calendar
const SmartDatePicker = ({ selected, onChange, minDate, maxDate, dayClassName, disabled, selectsStart, selectsEnd, startDate, endDate, placeholderText, required }) => {
  const [open, setOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = useRef(null);

  // Auto-scroll to current year when year dropdown opens
  useEffect(() => {
    if (showYearDropdown && yearDropdownRef.current) {
      const activeYearElement = yearDropdownRef.current.querySelector('.dropdown-item.active');
      if (activeYearElement) {
        // Scroll the active year into view
        activeYearElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [showYearDropdown]);

  return (
    <DatePicker
      selected={selected}
      disabled={disabled}
      onChange={(date) => {
        onChange(date);
        setTimeout(() => setOpen(false), 20);
      }}
      onSelect={() => setOpen(false)}
      open={open}
      onInputClick={() => setOpen(true)}
      onClickOutside={() => setOpen(false)}
      dateFormat="dd-MM-yyyy"
      calendarClassName="no-gap-calendar"
      dayClassName={dayClassName}
      wrapperClassName="full-width-picker"
      minDate={minDate}
      maxDate={maxDate}
      selectsStart={selectsStart}
      selectsEnd={selectsEnd}
      startDate={startDate}
      endDate={endDate}
      strictParsing
      locale="en-GB"
      popperPlacement="top-start"
      portalId="root"
      placeholderText={placeholderText || "DD-MM-YYYY"}
      required={required}

      renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => {
        const months = [
          "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
          "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
        ];
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 101 }, (_, i) => currentYear - 75 + i);

        return (
          <div className="custom-calendar-header">
            {/* Main Banner */}
            <div className="calendar-header-banner">
              <button
                type="button"
                className="header-nav-btn prev"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
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
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                  >
                    {months[date.getMonth()]}
                  </span>
                  <span
                    className="clickable-header-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
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
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
                  increaseMonth();
                }}
              >
                ›
              </button>
            </div>

            {/* Selection Lists */}
            {showMonthDropdown && (
              <div className="header-dropdown month-dropdown">
                <div className="dropdown-scroll-pane">
                  {months.map((m, idx) => (
                    <div
                      key={m}
                      className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                      onClick={() => {
                        changeMonth(idx);
                        setShowMonthDropdown(false);
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showYearDropdown && (
              <div className="header-dropdown year-dropdown" ref={yearDropdownRef}>
                <div className="dropdown-scroll-pane">
                  {years.map((y) => (
                    <div
                      key={y}
                      className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                      onClick={() => {
                        changeYear(y);
                        setShowYearDropdown(false);
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
  );
};

function ProjectPage() {
  // 1. New State for Customers and selected Customer ID
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [sows, setSows] = useState([]);
  const [selectedSowId, setSelectedSowId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [linkedAllocations, setLinkedAllocations] = useState([]);

  // --- NEW: State for screen width ---
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobileView = isMobile(windowWidth);

  // Employee suggestion states
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs for dropdown management
  const searchRefs = {
    manager: useRef(null),
    reviewer: useRef(null),
    hr: useRef(null),
    finance: useRef(null),
    admin: useRef(null)
  };
  const suggestionsRef = useRef(null);

  // Get selected Customer and SOW objects
  const selectedCustomer = customers.find((cust) => cust.customerId.toString() === selectedCustomerId?.toString());
  const selectedSow = sows.find((sow) => sow.sowId.toString() === selectedSowId?.toString());

  // SOW Date range for Project form validation
  const sowStartDate = selectedSow?.sowStartDate
    ? new Date(selectedSow.sowStartDate).toISOString().split("T")[0]
    : null;
  const sowEndDate = selectedSow?.sowEndDate
    ? new Date(selectedSow.sowEndDate).toISOString().split("T")[0]
    : null;

  const [projectFormData, setProjectFormData] = useState({

    projectName: "",
    projectStartDate: "",
    projectEndDate: "",
    totalEffort: "",
    totalCost: "",
    manager: "",
    reviewer: "",
    hr: "",
    finance: "",
    admin: "",

  });


  // Normalize date to remove time (00:00:00)
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Format date for alerts → DD-MM-YYYY
  const formatDateDMY = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // --- NEW: Effect to track window width for responsiveness ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetForm = () => {
    setProjectFormData({
      projectName: '',
      projectStartDate: '',
      projectEndDate: '',
      totalEffort: '',
      totalCost: '',
      manager: '',
      reviewer: '',
      hr: '',
      finance: '',
      admin: '',
    });
  };

  // Function to extract employee ID from full format
  const extractEmployeeId = (value) => {
    if (!value) return '';
    // Check if value contains parentheses with employee ID
    const match = value.match(/\(([^)]+)\)$/);
    if (match) {
      return match[1]; // Return the content inside parentheses
    }
    // If no parentheses, check if it's just an ID (like "EMP002")
    if (value.match(/^EMP\d+$/)) {
      return value;
    }
    // Otherwise, return the value as-is (might be just a name)
    return value;
  };

  // Initialize form with selected project data when editing
  useEffect(() => {
    if (isEditMode && selectedProject) {
      setProjectFormData({
        projectName: selectedProject.projectName || '',
        projectStartDate: selectedProject.projectStartDate || '',
        projectEndDate: selectedProject.projectEndDate || '',
        totalEffort: selectedProject.totalEffort || '',
        totalCost: selectedProject.totalCost || '',
        manager: extractEmployeeId(selectedProject.manager || ''),
        reviewer: extractEmployeeId(selectedProject.reviewer || ''),
        hr: extractEmployeeId(selectedProject.hr || ''),
        finance: extractEmployeeId(selectedProject.finance || ''),
        admin: extractEmployeeId(selectedProject.admin || ''),
      });

      // Fetch linked allocations for validation
      const fetchLinkedAllocations = async () => {
        try {
          const token = sessionStorage.getItem("token");
          const { data } = await api.get(`/allocations/project/${selectedProject.projectId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setLinkedAllocations(data || []);
        } catch (err) {
          console.error("Failed to fetch linked allocations:", err);
          setLinkedAllocations([]);
        }
      };
      fetchLinkedAllocations();
    }
  }, [isEditMode, selectedProject]);

  const handleCloseModal = () => {
    resetForm();
    setShowProjectForm(false);
    setIsEditMode(false);
    setSelectedProject(null);
  };

  const navigate = useNavigate();

  // Utility to get the token
  const getToken = () => {
    let rawToken = sessionStorage.getItem("token");
    if (!rawToken) return null;
    // Remove extra quotes if present
    if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
      rawToken = rawToken.slice(1, -1);
    }
    return `Bearer ${rawToken}`;
  };

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
    if (!query || query.trim().length < 1) {
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.error('Authentication token not found');
        setEmployeeSuggestions([]);
        setShowEmployeeSuggestions(false);
        return;
      }

      const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: token }
      });
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

  // Handle search input change for different fields
  const handleSearchChangeWithSuggestions = (value, field) => {
    setActiveSearchField(field);
    setSelectedSuggestionIndex(-1); // Reset selection when typing

    // Update the appropriate search term
    setProjectFormData(prev => ({ ...prev, [field]: value }));

    if (value.trim().length >= 1) {
      debouncedFetchSuggestions(value);
    } else {
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (employee, field) => {
    // Only set the employee ID
    const searchValue = employee.employeeId;

    setProjectFormData(prev => ({ ...prev, [field]: searchValue }));
    setShowEmployeeSuggestions(false);
    setEmployeeSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showEmployeeSuggestions || employeeSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev < employeeSuggestions.length - 1 ? prev + 1 : 0;
          // Scroll to the selected item
          setTimeout(() => {
            const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
            if (suggestionItems && suggestionItems[newIndex]) {
              suggestionItems[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : employeeSuggestions.length - 1;
          // Scroll to the selected item
          setTimeout(() => {
            const suggestionItems = suggestionsRef.current?.querySelectorAll('[data-suggestion-item]');
            if (suggestionItems && suggestionItems[newIndex]) {
              suggestionItems[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < employeeSuggestions.length) {
          handleSuggestionClick(employeeSuggestions[selectedSuggestionIndex], activeSearchField);
        }
        break;
      case 'Escape':
        setShowEmployeeSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = (field) => {
    setActiveSearchField(field);
    setSelectedSuggestionIndex(-1);
    const currentSearchTerm = projectFormData[field] || '';
    if (currentSearchTerm.trim().length >= 1 && employeeSuggestions.length > 0) {
      setShowEmployeeSuggestions(true);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        let shouldClose = true;
        // Check if click is inside any of the search inputs
        Object.values(searchRefs).forEach(ref => {
          if (ref.current && ref.current.contains(event.target)) {
            shouldClose = false;
          }
        });

        if (shouldClose) {
          setShowEmployeeSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ----------------------------------------------------
  * 1. Fetch Customers on component mount
  * --------------------------------------------------- */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api.get("/customers", {
      headers: { Authorization: token }
    })
      .then(res => setCustomers(res.data))
      .catch(err => console.error("Error fetching customers:", err));
  }, []);

  /* ----------------------------------------------------
  * 2. Fetch SOWs when a Customer is selected
  * --------------------------------------------------- */
  useEffect(() => {
    const fetchSows = async () => {
      setSows([]); // Clear SOWs list
      setSelectedSowId(null); // Reset selected SOW
      setProjects([]); // Clear projects list

      if (!selectedCustomerId) return;

      let rawToken = sessionStorage.getItem("token");
      if (!rawToken) return;

      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }
      const authHeader = `Bearer ${rawToken}`;

      try {
        const { data } = await api.get(`/sows/customer/${selectedCustomerId}`, {
          headers: { Authorization: authHeader },
        });
        setSows(data || []);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setSows([]); // No SOWs found
        } else {
          console.error("Error fetching SOWs:", err);
        }
      }
    };

    fetchSows();
  }, [selectedCustomerId]);


  /* ----------------------------------------------------
  * 3. Fetch Projects when a SOW is selected
  * --------------------------------------------------- */
  useEffect(() => {
    const fetchProjects = async () => {
      setProjects([]); // Clear projects list

      if (!selectedSowId) return;

      let rawToken = sessionStorage.getItem("token");
      if (!rawToken) return;

      // Remove quotes if token is wrapped in quotes
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }
      const authHeader = `Bearer ${rawToken}`;

      try {
        const { data } = await api.get(`/projects/sow/${selectedSowId}`, {
          headers: { Authorization: authHeader },
        });
        setProjects(data || []);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setProjects([]); // No projects found
        } else {
          console.error("Error fetching projects:", err);
        }
      }
    };

    fetchProjects();
  }, [selectedSowId]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = name === 'projectName' ? value.replace(/\p{Extended_Pictographic}/gu, '') : value;
    setProjectFormData((prev) => ({ ...prev, [name]: cleanValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomerId || !selectedSowId) {
      alert("Please select both a Customer and a Sow/PO before adding a project.");
      return;
    }

    if (!projectFormData.projectName || !projectFormData.projectName.trim()) {
      alert("Please enter Project name.");
      return;
    }

    if (!projectFormData.projectStartDate) {
      alert("Please select Project start date.");
      return;
    }

    if (!projectFormData.projectEndDate) {
      alert("Please select Project end date.");
      return;
    }

    if (!projectFormData.totalEffort) {
      alert("Please enter Total effort.");
      return;
    }

    if (!projectFormData.totalCost) {
      alert("Please enter Total cost.");
      return;
    }

    if (!projectFormData.manager) {
      alert("Please enter Project Manager.");
      return;
    }

    if (!projectFormData.reviewer) {
      alert("Please enter Project Reviewer.");
      return;
    }

    if (!projectFormData.hr) {
      alert("Please enter Project HR.");
      return;
    }

    if (!projectFormData.finance) {
      alert("Please enter Project Finance.");
      return;
    }

    if (!projectFormData.admin) {
      alert("Please enter Project Admin.");
      return;
    }

    const newProjStart = new Date(projectFormData.projectStartDate);
    const newProjEnd = new Date(projectFormData.projectEndDate);

    if (newProjEnd < newProjStart) {
      alert("Project End Date cannot be before the Start Date.");
      return;
    }

    if (selectedSow) {
      const sowStart = normalizeDate(selectedSow.sowStartDate);
      const sowEnd = normalizeDate(selectedSow.sowEndDate);
      const projStart = normalizeDate(newProjStart);
      const projEnd = normalizeDate(newProjEnd);

      // ✅ Allow SAME dates
      if (projStart < sowStart) {
        alert(
          `Project Start Date cannot be before Sow/PO Start Date (${formatDateDMY(selectedSow.sowStartDate)}).`
        );
        return;
      }

      if (projEnd > sowEnd) {
        alert(
          `Project End Date cannot be after Sow/PO End Date (${formatDateDMY(selectedSow.sowEndDate)}).`
        );
        return;
      }
    }


    // --- Allocation (Child) Validation ---
    if (isEditMode && linkedAllocations.length > 0) {
      for (const alloc of linkedAllocations) {
        const allocStart = new Date(alloc.startDate);
        const allocEnd = new Date(alloc.endDate);

        if (newProjStart > allocStart) {
          alert(`Cannot change Project Start Date because an Employee (${getDisplayEmployeeId(alloc.employeeId)}) is allocated starting ${alloc.startDate}.`);
          return;
        }
        if (newProjEnd < allocEnd) {
          alert(`Cannot change Project End Date because an Employee (${getDisplayEmployeeId(alloc.employeeId)}) is allocated until ${alloc.endDate}.`);
          return;
        }
      }
    }

    const projectData = {
      ...projectFormData,
      manager: getFullEmployeeId(projectFormData.manager),
      reviewer: getFullEmployeeId(projectFormData.reviewer),
      hr: getFullEmployeeId(projectFormData.hr),
      finance: getFullEmployeeId(projectFormData.finance),
      admin: getFullEmployeeId(projectFormData.admin),
      sowId: selectedSowId,
    };

    try {
      let rawToken = sessionStorage.getItem("token");
      if (!rawToken) throw new Error("You are not logged in.");

      // Remove quotes if present
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }

      const authHeader = `Bearer ${rawToken}`;

      if (isEditMode && selectedProject) {
        // Update existing project
        const { data: updatedProject } = await api.put(
          `/projects/${selectedProject.projectId}`,
          projectData,
          {
            headers: { Authorization: authHeader },
          }
        );
        setProjects((prev) => prev.map(p => p.projectId === selectedProject.projectId ? updatedProject : p));
      } else {
        // Create new project
        const { data: createdProject } = await api.post(
          "/projects",
          projectData,
          {
            headers: { Authorization: authHeader },
          }
        );
        setProjects((prev) => [...prev, createdProject]);
      }

      // Update project list and reset form
      setShowProjectForm(false);
      resetForm();
      setIsEditMode(false);
      setSelectedProject(null);
      alert(`Project ${isEditMode ? 'updated' : 'created'} successfully.`);

    } catch (err) {
      console.error(`Project ${isEditMode ? 'update' : 'creation'} failed:`, err);
      if (err.response && err.response.data && typeof err.response.data === 'string') {
        // If the backend returns a simple string message (like our validation errors)
        alert(err.response.data);
      } else if (err.response && err.response.data && err.response.data.message) {
        // If it returns a JSON object with a message field
        alert(err.response.data.message);
      } else {
        alert(`Failed to ${isEditMode ? 'update' : 'create'} project: ${err.message}`);
      }
    }
  };

  const handleEditClick = (project) => {
    setSelectedProject(project);
    setIsEditMode(true);
    setShowProjectForm(true);
  };

  const handleAddClick = () => {
    setSelectedProject(null);
    setIsEditMode(false);
    setShowProjectForm(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <Sidebar>
      <style>{`
/* Styling for the horizontal scrollable table container */
.responsive-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.responsive-table-container::-webkit-scrollbar {
    height: 8px;
    width: 8px;
}

.responsive-table-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
}

.responsive-table-container::-webkit-scrollbar-thumb {
    background: #2dd4bf;
    border-radius: 10px;
}

.responsive-table-container::-webkit-scrollbar-thumb:hover {
    background: #14b8a6;
}
/* Modal responsiveness */
@media (max-width: ${mobileBreakpoint - 1}px) {
.project-modal-form {
width: 95% !important;
margin: 10px auto !important;
}
}
`}</style>

      <div
        className="contract-management-page"
        style={{
          padding: "24px",
          background: 'linear-gradient(to bottom, #ffffff 0%, #f0fdfd 100%)',
          minHeight: "100vh",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{
          padding: '24px 0',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobileView ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobileView ? 'flex-start' : 'center',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobileView ? '12px' : '16px' }}>
              <div>
                <h3 className="contract-management-title" style={{
                  color: '#1F2937',
                  fontSize: '30px',
                  fontWeight: 'normal',
                  margin: 0
                }}>
                  Project Management
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#00B3A4', fontSize: isMobileView ? '0.75rem' : '0.9rem', fontWeight: 'normal' }}>
                  Assign and monitor corporate project deliverables
                </p>
              </div>
            </div>

            {/* Summary Info (Visible on Desktop) */}
            {!isMobileView && (selectedCustomer || selectedSow) && (
              <div style={{
                display: 'flex',
                gap: '20px',
                padding: '10px 20px',
                background: '#f0fdfd',
                borderRadius: '12px',
                border: '1px solid #99f6e4'
              }}>
                {selectedCustomer && (
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: '#14b8a6', fontWeight: '700', marginRight: '4px' }}>CUSTOMER:</span>
                    <span style={{ color: '#0f766e', fontWeight: '600' }}>{selectedCustomer.customerName}</span>
                  </div>
                )}
                {selectedSow && (
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: '#14b8a6', fontWeight: '700', marginRight: '4px' }}>SOW/PO:</span>
                    <span style={{ color: '#0f766e', fontWeight: '600' }}>{selectedSow.sowName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dropdowns and Button Container (Responsive Flex) */}
          <div
            style={{
              marginBottom: "24px",
              display: "flex",
              flexDirection: isMobileView ? 'column' : 'row',
              justifyContent: isMobileView ? 'flex-start' : 'flex-end',
              alignItems: 'center',
              gap: "12px",
              padding: "16px",
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0'
            }}
          >

            {/* 1. Customer Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: isMobileView ? '100%' : 'auto' }}>
              <select
                id="customer-select"
                value={selectedCustomerId || ""}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                }}
                style={{
                  padding: isMobileView ? "14px 16px" : "4px 14px",
                  fontSize: isMobileView ? 16 : 14,
                  width: isMobileView ? '100%' : 220,
                  minHeight: isMobileView ? '50px' : 'auto',
                  boxSizing: "border-box",
                  borderRadius: isMobileView ? '16px' : '12px',
                  border: isMobileView ? '1.5px solid #cbd5e1' : '2px solid #99f6e4',
                  backgroundColor: isMobileView ? '#ffffff' : '#fff',
                  color: '#1e293b',
                  fontWeight: isMobileView ? '500' : '400',
                  lineHeight: '1.5',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2314b8a6' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '18px',
                }}
              >
                <option value="" style={{ color: '#64748b' }}>Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.customerId} value={customer.customerId} style={{ color: '#1e293b' }}>
                    {customer.customerName} (CID{customer.tenantCustomerId || customer.customerId})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. SOW Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: isMobileView ? '100%' : 'auto' }}>
              <select
                id="sow-select"
                value={selectedSowId || ""}
                onChange={(e) => setSelectedSowId(e.target.value)}
                disabled={!selectedCustomerId} // Disabled until customer is selected
                style={{
                  padding: isMobileView ? "14px 16px" : "4px 14px",
                  fontSize: isMobileView ? 16 : 14,
                  width: isMobileView ? '100%' : 220,
                  minHeight: isMobileView ? '50px' : 'auto',
                  boxSizing: "border-box",
                  borderRadius: isMobileView ? '16px' : '12px',
                  border: isMobileView ? '1.5px solid #cbd5e1' : '2px solid #99f6e4',
                  backgroundColor: isMobileView ? '#ffffff' : '#fff',
                  color: '#1e293b',
                  fontWeight: isMobileView ? '500' : '400',
                  lineHeight: '1.5',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2314b8a6' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '18px',
                  cursor: (!selectedCustomerId) ? "not-allowed" : "pointer",
                  opacity: (!selectedCustomerId) ? 0.7 : 1,
                }}
              >
                <option value="" style={{ color: '#64748b' }}>Select SOW/PO</option>
                {sows.map((sow) => (
                  <option key={sow.sowId} value={sow.sowId} style={{ color: '#1e293b' }}>
                    {sow.sowName} (Sow/PO{sow.tenantSowId || sow.sowId})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Add New Project Button */}
            <button
              onClick={() => {
                if (!selectedCustomerId || !selectedSowId) {
                  alert("Please select both a Customer and a Sow/PO before adding a project.");
                  return;
                }
                handleAddClick();
              }}
              disabled={!selectedCustomerId || !selectedSowId}
              style={{
                background: (selectedCustomerId && selectedSowId)
                  ? "#00B3A4"
                  : "#e2e8f0",
                color: "white",
                border: "none",
                padding: isMobileView ? "14px 20px" : "12px 24px",
                fontSize: isMobileView ? 15 : 14,
                cursor: (selectedCustomerId && selectedSowId) ? "pointer" : "not-allowed",
                borderRadius: '12px',
                fontWeight: 'normal',
                height: isMobileView ? 50 : 44,
                width: isMobileView ? '100%' : 'auto',
                boxShadow: (selectedCustomerId && selectedSowId) ? '0 4px 12px rgba(0, 179, 164, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
              }}
            >
              Add new project
            </button>
          </div>

          {/* Projects Table */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: isMobileView ? '1rem' : '1.17rem', color: '#115e59', fontWeight: '700' }}>Projects for SOW/PO {selectedSow ? (selectedSow.tenantSowId || selectedSow.sowId) : '---'}</h3>

            {/* CONDITION 1: Nothing selected yet */}
            {!selectedSowId ? (
              <div style={{ padding: '0px', textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: isMobileView ? '0.875rem' : '1rem', color: '#64748b' }}>
                  Please select a customer and sow/po first to view projects.
                </p>
              </div>
            ) :

              /* CONDITION 2: SOW is selected but no projects were returned (empty list) */
              projects.length === 0 ? (
                <div style={{ padding: '0px', textAlign: 'left' }}>
                  <p style={{ margin: 0, color: '#6c757d' }}>
                    No projects found for the selected sow/po.
                  </p>
                </div>
              ) : (
                /* CONDITION 3: SOW is selected AND projects exist (show the table) */
                <div
                  className="responsive-table-container"
                  style={{
                    maxHeight: isMobileView ? "calc(100vh - 250px)" : "calc(100vh - 300px)",
                    overflowY: "auto",
                    overflowX: "auto",
                    borderRadius: '12px',
                    backgroundColor: "white",
                  }}
                >
                  <table
                    style={{
                      // --- MOBILE: FORCE MINIMUM WIDTH TO ENABLE SCROLL ---
                      width: isMobileView ? '1200px' : "100%",
                      minWidth: '1200px', // Set minimum width for scroll on mobile
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                      marginTop: 0,
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', borderRadius: '12px 0 0 12px', fontWeight: 'normal' }}>Project id</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Project name</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Start date</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>End date</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Total effort (pd)</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Total cost</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Manager</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Reviewer</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Hr</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Finance</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Admin</th>
                        <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '16px', textAlign: 'center', borderRadius: '0 12px 12px 0', fontWeight: 'normal' }}>Edit</th>
                      </tr>
                    </thead>

                    <tbody>
                      {projects
                        .slice()
                        .sort((a, b) => b.projectId - a.projectId)
                        .map((project) => (
                          <tr key={project.projectId} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', textAlign: "center", backgroundColor: '#f0fdfd', fontWeight: 'bold', color: '#14b8a6' }}>
                              {`P${project.tenantProjectId || project.projectId}`}
                            </td>
                            <td style={{ padding: '16px', backgroundColor: '#f0fdfd', color: '#475569', textAlign: "center" }}>{project.projectName}</td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {formatDate(project.projectStartDate)}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {formatDate(project.projectEndDate)}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {project.totalEffort}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {project.totalCost}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {getDisplayEmployeeId(project.manager)}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {getDisplayEmployeeId(project.reviewer)}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {getDisplayEmployeeId(project.hr)}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {getDisplayEmployeeId(project.finance)}
                            </td>
                            <td style={{ padding: '16px', textAlign: "center", backgroundColor: '#f0fdfd', color: '#475569' }}>
                              {getDisplayEmployeeId(project.admin)}
                            </td>
                            <td style={{ padding: '16px', borderRadius: '0 12px 12px 0', textAlign: "center", backgroundColor: '#f0fdfd' }}>
                              <button
                                onClick={() => handleEditClick(project)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  background: "#00B3A4",
                                  color: "#fff",
                                  fontSize: "12px",
                                  fontWeight: "normal",
                                  border: "none",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Add New Project Modal/Form (responsive width class added) */}
          {showProjectForm && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
              onClick={handleCloseModal}
            >
              <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="project-modal-form"
                style={{
                  backgroundColor: "white",
                  padding: "30px",
                  borderRadius: '20px',
                  maxWidth: 600,
                  margin: "auto",
                  position: "relative",
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  border: '1px solid #99f6e4',
                }}
              >
                <button
                  type="button"
                  className="close-x-btn"
                  onClick={handleCloseModal}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    border: "none",
                    background: "transparent",
                    fontSize: 20,
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#333",
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label="Close form"
                >
                  ×
                </button>

                <h3 style={{ marginBottom: 20, color: '#1F2937', fontWeight: 'normal' }}>
                  {isEditMode ? `Edit project` : `Add new project`}
                </h3>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
                  <label style={{ flex: "1 1 100%", color: '#1F2937', fontWeight: 'normal' }}>
                    Project name <span style={{ color: "red" }}>*</span>
                    <input

                      name="projectName"
                      value={projectFormData.projectName}
                      onChange={handleInputChange}
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                  </label>


                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal' }}>
                    Start date <span style={{ color: "red" }}>*</span>
                    <div className="datePickerWrapper">
                      <SmartDatePicker

                        selected={projectFormData.projectStartDate ? new Date(projectFormData.projectStartDate) : null}
                        onChange={(date) => {
                          if (!date) return;
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          const formattedDate = `${year}-${month}-${day}`;
                          setProjectFormData(prev => ({ ...prev, projectStartDate: formattedDate }));
                        }}
                        minDate={sowStartDate ? new Date(sowStartDate) : null}
                        maxDate={sowEndDate ? new Date(sowEndDate) : null}
                        placeholderText="DD-MM-YYYY"
                      />
                    </div>
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal' }}>
                    End date <span style={{ color: "red" }}>*</span>
                    <div className="datePickerWrapper">
                      <SmartDatePicker

                        selected={projectFormData.projectEndDate ? new Date(projectFormData.projectEndDate) : null}
                        onChange={(date) => {
                          if (!date) return;
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          const formattedDate = `${year}-${month}-${day}`;
                          setProjectFormData(prev => ({ ...prev, projectEndDate: formattedDate }));
                        }}
                        minDate={sowStartDate ? new Date(sowStartDate) : null}
                        maxDate={sowEndDate ? new Date(sowEndDate) : null}
                        placeholderText="DD-MM-YYYY"
                      />
                    </div>
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal' }}>
                    Total cost <span style={{ color: "red" }}>*</span>
                    <input

                      name="totalCost"
                      value={projectFormData.totalCost}
                      onChange={handleInputChange}
                      type="number"
                      min={0}
                      step="0.01"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal' }}>
                    Total effort <span style={{ color: "red" }}>*</span>
                    <input

                      name="totalEffort"
                      value={projectFormData.totalEffort}
                      onChange={handleInputChange}
                      type="number"
                      min={0}
                      step="0.01"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal', position: 'relative' }}>
                    Manager id <span style={{ color: "red" }}>*</span>
                    <input
                      ref={searchRefs.manager}

                      name="manager"
                      value={getDisplayEmployeeId(projectFormData.manager)}
                      onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'manager')}
                      onFocus={() => handleInputFocus('manager')}
                      onKeyDown={handleKeyDown}
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                    <EmployeeSuggestion
                      suggestions={employeeSuggestions}
                      showSuggestions={showEmployeeSuggestions && activeSearchField === 'manager'}
                      suggestionsLoading={suggestionsLoading}
                      onSelect={handleSuggestionClick}
                      suggestionsRef={suggestionsRef}
                      fieldName="manager"
                      selectedSuggestionIndex={selectedSuggestionIndex}
                      setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                    />
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal', position: 'relative' }}>
                    Reviewer id <span style={{ color: "red" }}>*</span>
                    <input
                      ref={searchRefs.reviewer}

                      name="reviewer"
                      value={getDisplayEmployeeId(projectFormData.reviewer)}
                      onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'reviewer')}
                      onFocus={() => handleInputFocus('reviewer')}
                      onKeyDown={handleKeyDown}
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                    <EmployeeSuggestion
                      suggestions={employeeSuggestions}
                      showSuggestions={showEmployeeSuggestions && activeSearchField === 'reviewer'}
                      suggestionsLoading={suggestionsLoading}
                      onSelect={handleSuggestionClick}
                      suggestionsRef={suggestionsRef}
                      fieldName="reviewer"
                      selectedSuggestionIndex={selectedSuggestionIndex}
                      setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                    />
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal', position: 'relative' }}>
                    Hr id <span style={{ color: "red" }}>*</span>
                    <input
                      ref={searchRefs.hr}

                      name="hr"
                      value={getDisplayEmployeeId(projectFormData.hr)}
                      onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'hr')}
                      onFocus={() => handleInputFocus('hr')}
                      onKeyDown={handleKeyDown}
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                    <EmployeeSuggestion
                      suggestions={employeeSuggestions}
                      showSuggestions={showEmployeeSuggestions && activeSearchField === 'hr'}
                      suggestionsLoading={suggestionsLoading}
                      onSelect={handleSuggestionClick}
                      suggestionsRef={suggestionsRef}
                      fieldName="hr"
                      selectedSuggestionIndex={selectedSuggestionIndex}
                      setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                    />
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal', position: 'relative' }}>
                    Finance id <span style={{ color: "red" }}>*</span>
                    <input
                      ref={searchRefs.finance}

                      name="finance"
                      value={getDisplayEmployeeId(projectFormData.finance)}
                      onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'finance')}
                      onFocus={() => handleInputFocus('finance')}
                      onKeyDown={handleKeyDown}
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                    <EmployeeSuggestion
                      suggestions={employeeSuggestions}
                      showSuggestions={showEmployeeSuggestions && activeSearchField === 'finance'}
                      suggestionsLoading={suggestionsLoading}
                      onSelect={handleSuggestionClick}
                      suggestionsRef={suggestionsRef}
                      fieldName="finance"
                      selectedSuggestionIndex={selectedSuggestionIndex}
                      setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                    />
                  </label>

                  <label style={{ flex: isMobileView ? "1 1 100%" : "1 1 45%", color: '#1F2937', fontWeight: 'normal', position: 'relative' }}>
                    Admin id <span style={{ color: "red" }}>*</span>
                    <input
                      ref={searchRefs.admin}

                      name="admin"
                      value={getDisplayEmployeeId(projectFormData.admin)}
                      onChange={(e) => handleSearchChangeWithSuggestions(e.target.value, 'admin')}
                      onFocus={() => handleInputFocus('admin')}
                      onKeyDown={handleKeyDown}
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: 4,
                        boxSizing: 'border-box',
                        borderRadius: '12px',
                        border: '2px solid #99f6e4',
                        outline: 'none'
                      }}
                    />
                    <EmployeeSuggestion
                      suggestions={employeeSuggestions}
                      showSuggestions={showEmployeeSuggestions && activeSearchField === 'admin'}
                      suggestionsLoading={suggestionsLoading}
                      onSelect={handleSuggestionClick}
                      suggestionsRef={suggestionsRef}
                      fieldName="admin"
                      selectedSuggestionIndex={selectedSuggestionIndex}
                      setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                    />
                  </label>

                </div>

                <div style={{ textAlign: "right", marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      background: "#00B3A4",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: '12px',
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 'normal',
                      boxShadow: '0 4px 12px rgba(0, 179, 164, 0.4)',
                    }}
                  >
                    {isEditMode ? "Update" : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#64748b",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: '12px',
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 'normal',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <style>{`
.datePickerWrapper input {
width: 100%;
padding: 10px;
margin-top: 4px;
border-radius: 12px;
border: 2px solid #99f6e4;
outline: none;
box-sizing: border-box;
font-family: 'Inter', sans-serif;
font-size: 14px;
}
.datePickerWrapper input:focus {
border-color: #14b8a6;
}
.responsive-table-container::-webkit-scrollbar {
display: none;
}
`}</style>
    </Sidebar>
  );
}

export default ProjectPage;
