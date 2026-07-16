import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar.js';
import api from "../api";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import enGB from 'date-fns/locale/en-GB';
import "./Allocation.css";
import './Leave.css';
import './ContractManagement.css';

import { FiPlusCircle, FiUsers, FiBriefcase, FiArrowRight, FiCheckCircle, FiAlertCircle, FiSearch, FiEdit } from 'react-icons/fi';

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
        border: '1px solid #e2e8f0',
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
            onClick={() => onSelect(employee)}
          >
            {employee.firstName} {employee.lastName} ({getDisplayEmployeeId(employee.employeeId)})
          </div>
        ))
      )}
    </div>
  );
};

registerLocale('en-GB', enGB);

const AllocationPage = () => {

  // Mobile responsive detection
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [allocations, setAllocations] = useState([]);
  const [formData, setFormData] = useState({
    employeeIds: "",
    startDate: null,
    endDate: null,
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  // Employee suggestion states
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs for dropdown management
  const employeeIdsRef = useRef(null);
  const suggestionsRef = useRef(null);

  const selectedCustomer = customers.find((cust) => cust.customerId?.toString() === selectedCustomerId?.toString());
  const selectedProject = projects.find(p => p.projectId?.toString() === selectedProjectId?.toString());

  const projectStartDate = selectedProject?.projectStartDate ? new Date(selectedProject.projectStartDate) : null;
  const projectEndDate = selectedProject?.projectEndDate ? new Date(selectedProject.projectEndDate) : null;


  const toLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Remove time (00:00:00) to avoid timezone issues
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Format for alerts: DD-MM-YYYY
  const formatDateDMY = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };


  useEffect(() => {
    setLoadingCustomers(true);

    const token = sessionStorage.getItem("token");

    api.get("/customers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => setCustomers(res.data))
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers.");
      })
      .finally(() => setLoadingCustomers(false));
  }, []);

  useEffect(() => {
    setProjects([]);
    setSelectedProjectId("");
    setAllocations([]);
    setError(null);

    if (!selectedCustomerId) return;

    setLoadingProjects(true);

    const fetchSowsAndProjects = async () => {
      const token = sessionStorage.getItem("token");

      try {
        // 🔐 Fetch SOWs for customer
        const sowRes = await api.get(
          `/sows/customer/${selectedCustomerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const customerSows = sowRes.data || [];
        const sowIds = customerSows.map((sow) => sow.sowId);

        if (sowIds.length === 0) {
          setProjects([]);
          return;
        }

        const allProjects = [];

        // 🔐 Fetch projects for each SOW
        for (const sowId of sowIds) {
          try {
            const projectRes = await api.get(
              `/projects/sow/${sowId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            allProjects.push(...projectRes.data);
          } catch (err) {
            if (err.response?.status !== 404) throw err;
          }
        }

        const uniqueProjects = Array.from(
          new Map(allProjects.map((p) => [p.projectId, p])).values()
        );

        // Filter out expired projects
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeProjects = uniqueProjects.filter(p => {
          if (!p.projectEndDate) return true;
          const pEnd = new Date(p.projectEndDate);
          pEnd.setHours(0, 0, 0, 0);
          return pEnd >= today;
        });

        setProjects(activeProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchSowsAndProjects();
  }, [selectedCustomerId]);

  useEffect(() => {
    setAllocations([]);
    setError(null);

    if (!selectedProjectId) return;

    setLoadingAllocations(true);

    const token = sessionStorage.getItem("token");

    api.get(
      `/allocations/project/${selectedProjectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => setAllocations(res.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          console.error("Error fetching allocations:", err);
          setError("Failed to load allocations.");
        }
      })
      .finally(() => setLoadingAllocations(false));
  }, [selectedProjectId]);

  const activeAllocations = allocations.filter(a => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!a.endDate) return true;
    const aEnd = new Date(a.endDate);
    aEnd.setHours(0, 0, 0, 0);
    return aEnd >= today;
  });

  const handleNewAllocationClick = () => {
    // Check for project expiry
    if (projectEndDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pEnd = normalizeDate(projectEndDate);

      if (pEnd < today) {
        alert(`Cannot allocate to an expired project.\nProject ended on ${formatDateDMY(projectEndDate)}`);
        return;
      }
    }

    setIsEditMode(false);
    setSelectedAllocation(null);
    setFormData({
      employeeIds: "",
      startDate: null,
      endDate: null,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (alloc) => {
    setIsEditMode(true);
    setSelectedAllocation(alloc);
    setFormData({
      employeeIds: getDisplayEmployeeId(alloc.employeeId) || "",
      startDate: alloc.startDate ? new Date(alloc.startDate) : null,
      endDate: alloc.endDate ? new Date(alloc.endDate) : null,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const handleAddAllocation = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage("");

    // ✅ Get JWT token from sessionStorage
    const token = sessionStorage.getItem("token");

    if (!token) {
      setError("Session expired. Please login again.");
      return;
    }

    if (isEditMode && selectedAllocation) {
      const payload = {
        projectId: Number(selectedProjectId),
        employeeId: getFullEmployeeId(formData.employeeIds.trim()),
        startDate: toLocalDateString(formData.startDate),
        endDate: toLocalDateString(formData.endDate),
      };

      try {
        await api.put(
          `/allocations/${selectedAllocation.id || selectedAllocation.allocationId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // ✅ FIX: refetch from backend
        const refreshed = await api.get(
          `/allocations/project/${selectedProjectId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setAllocations(refreshed.data);

        alert("Allocation updated successfully!");
        setSuccessMessage("Allocation updated successfully!");
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedAllocation(null);

        setTimeout(() => setSuccessMessage(""), 3000);

      } catch (err) {
        console.error("Update allocation error:", err);
        setError(err.response?.data?.message || "Failed to update allocation.");
      }
    }
    else {
      // ✅ Bulk allocation logic (Existing)
      const employeeIdList = formData.employeeIds
        .split(",")
        .map(id => id.trim())
        .filter(id => id)
        .map(id => getFullEmployeeId(id));

      if (employeeIdList.length === 0) {
        alert("Please enter at least one valid Employee ID");
        return;
      }

      const uniqueEmployeeIds = new Set(employeeIdList);
      if (uniqueEmployeeIds.size !== employeeIdList.length) {
        const seen = new Set();
        const duplicatesInInput = [];
        for (const id of employeeIdList) {
          if (seen.has(id)) {
            if (!duplicatesInInput.includes(id)) {
              duplicatesInInput.push(id);
            }
          } else {
            seen.add(id);
          }
        }
        alert(`Duplicate Employee ID${duplicatesInInput.length > 1 ? 's' : ''} ${duplicatesInInput.map(getDisplayEmployeeId).join(", ")} entered in input.`);
        return;
      }

      if (!formData.startDate) {
        alert("Please select start date.");
        return;
      }

      if (!formData.endDate) {
        alert("Please select end date.");
        return;
      }

      if (projectStartDate && projectEndDate) {
        const projStart = normalizeDate(projectStartDate);
        const projEnd = normalizeDate(projectEndDate);
        const allocStart = normalizeDate(formData.startDate);
        const allocEnd = normalizeDate(formData.endDate);

        // ✅ Allow SAME dates
        if (allocStart < projStart) {
          setError(
            `Allocation Start Date cannot be before Project Start Date (${formatDateDMY(projectStartDate)})`
          );
          return;
        }

        if (allocEnd > projEnd) {
          setError(
            `Allocation End Date cannot be after Project End Date (${formatDateDMY(projectEndDate)})`
          );
          return;
        }
      }


      // --- Restriction 1: Check for duplicates in current project ---
      const existingEmployeeIds = allocations.map(a => a.employeeId);
      const duplicates = employeeIdList.filter(id => existingEmployeeIds.includes(id));
      if (duplicates.length > 0) {
        setError(`Employee ID${duplicates.length > 1 ? 's' : ''} ${duplicates.map(getDisplayEmployeeId).join(", ")} already assigned to this project.`);
        return;
      }

      // --- Restriction 2: Check if employee IDs exist in database ---
      try {
        setLoadingAllocations(true); // Reuse loading state for validation
        for (const empId of employeeIdList) {
          try {
            await api.get(`/employees/${empId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            if (err.response?.status === 404) {
              setError(`Employee ID ${getDisplayEmployeeId(empId)} is not existing in Database. Try to add a valid ID.`);
              setLoadingAllocations(false);
              return;
            }
            throw err;
          }
        }
      } catch (err) {
        console.error("Validation error:", err);
        setError("Error validating employee IDs. Please try again.");
        setLoadingAllocations(false);
        return;
      } finally {
        setLoadingAllocations(false);
      }

      const payload = {
        projectId: Number(selectedProjectId),
        employeeIds: employeeIdList,
        startDate: toLocalDateString(formData.startDate),
        endDate: toLocalDateString(formData.endDate),

      };

      try {
        const res = await api.post(
          "/allocations/bulk",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const { successfulAllocations, failedEmployeeIds } = res.data;

        if (failedEmployeeIds && failedEmployeeIds.length > 0) {
          setError(`Allocation failed for: ${failedEmployeeIds.map(getDisplayEmployeeId).join(", ")}`);
        }

        if (successfulAllocations && successfulAllocations.length > 0) {
          setAllocations(prev => [...prev, ...successfulAllocations]);

          setFormData({
            employeeIds: "",
            startDate: null,
            endDate: null,
          });

          alert("Employees allocated successfully!");
          setSuccessMessage(""); // Clear UI message since we show alert
          setIsModalOpen(false);
        }

      } catch (err) {
        console.error("Bulk allocation error:", err);
        if (err.response?.status === 401) {
          setError("Unauthorized. Please login again.");
          sessionStorage.clear();
        } else {
          setError(err.response?.data?.message || "Something went wrong.");
        }
      }
    }
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
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error('Authentication token not found');
        setEmployeeSuggestions([]);
        setShowEmployeeSuggestions(false);
        return;
      }

      const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  // Handle textarea input change for comma-separated employee IDs
  const handleEmployeeIdsChange = (value) => {
    const cleanValue = value.replace(/\p{Extended_Pictographic}/gu, '');
    setFormData(prev => ({ ...prev, employeeIds: cleanValue }));
    setSelectedSuggestionIndex(-1); // Reset selection when typing

    // Extract the last typed ID (after the last comma or space)
    const ids = cleanValue.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
    const lastId = ids[ids.length - 1] || "";

    if (lastId.length >= 1) {
      debouncedFetchSuggestions(lastId);
    } else {
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
    }
  };

  // Handle suggestion click for comma-separated employee IDs
  const handleSuggestionClick = (employee) => {
    const currentIds = formData.employeeIds.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
    const cleanDisplayId = getDisplayEmployeeId(employee.employeeId);

    // Replace the last ID with the selected employee
    if (currentIds.length > 0) {
      currentIds[currentIds.length - 1] = cleanDisplayId;
    } else {
      currentIds.push(cleanDisplayId);
    }

    const newEmployeeIds = currentIds.join(", ");
    setFormData(prev => ({ ...prev, employeeIds: newEmployeeIds }));
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
          handleSuggestionClick(employeeSuggestions[selectedSuggestionIndex]);
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        employeeIdsRef.current && !employeeIdsRef.current.contains(event.target)) {
        setShowEmployeeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Sidebar>
      <div className="contract-management-page">
        <div className="allocation-wrapper">
          <div className="allocation-content-wrapper">
            <header className="allocation-page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginBottom: '24px' }}>
              <h1 className="allocation-header-title contract-management-title" style={{ fontSize: '30px', fontWeight: 'normal', color: '#1F2937', margin: 0 }}>Resource allocation</h1>
              <p style={{ margin: 0, color: '#00B3A4', fontSize: isMobileView ? '0.75rem' : '0.9rem', fontWeight: 'normal' }}>
                Allocate team members to active client projects
              </p>
            </header>

            <div className="allocation-card" style={{ padding: isMobileView ? '1rem 0' : '1.5rem 0' }}>
              <div className="allocation-filter-container" style={{
                marginBottom: 0,
                flexDirection: isMobileView ? 'column' : 'row',
                alignItems: isMobileView ? 'stretch' : 'flex-end',
                gap: isMobileView ? '1rem' : '1.5rem'
              }}>
                <div style={{ flex: isMobileView ? 'unset' : 1, minWidth: isMobileView ? 'unset' : '250px', width: isMobileView ? '100%' : 'auto' }}>
                  <label className="allocation-form-label">Client / customer</label>
                  <select
                    className="allocation-input"
                    style={{
                      width: '100%',
                      padding: isMobileView ? '14px 16px' : '0.6rem 0.875rem',
                      fontSize: isMobileView ? '16px' : '0.875rem',
                      minHeight: isMobileView ? '50px' : 'auto',
                      border: isMobileView ? '1.5px solid #cbd5e1' : '1.5px solid #eef2f6',
                      borderRadius: isMobileView ? '16px' : '10px',
                      backgroundColor: isMobileView ? '#ffffff' : '#fbfcfd',
                      color: '#1e293b',
                      fontWeight: isMobileView ? '500' : '400',
                      boxSizing: 'border-box',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='%2314b8a6' d='M7 10L2 5h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px center',
                      backgroundSize: '14px',
                      lineHeight: '1.5',
                    }}
                    value={selectedCustomerId || ""}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    disabled={loadingCustomers}
                  >
                    <option value="" style={{ color: '#64748b' }}>{loadingCustomers ? 'Loading...' : 'Select customer'}</option>
                    {customers.map((c) => <option key={c.customerId} value={c.customerId} style={{ color: '#1e293b' }}>{c.customerName}</option>)}
                  </select>
                </div>
                <div style={{ flex: isMobileView ? 'unset' : 1, minWidth: isMobileView ? 'unset' : '250px', width: isMobileView ? '100%' : 'auto' }}>
                  <label className="allocation-form-label">Project</label>
                  <select
                    className="allocation-input"
                    style={{
                      width: '100%',
                      padding: isMobileView ? '14px 16px' : '0.6rem 0.875rem',
                      fontSize: isMobileView ? '16px' : '0.875rem',
                      minHeight: isMobileView ? '50px' : 'auto',
                      border: isMobileView ? '1.5px solid #cbd5e1' : '1.5px solid #eef2f6',
                      borderRadius: isMobileView ? '16px' : '10px',
                      backgroundColor: isMobileView ? '#ffffff' : '#fbfcfd',
                      color: '#1e293b',
                      fontWeight: isMobileView ? '500' : '400',
                      boxSizing: 'border-box',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='%2314b8a6' d='M7 10L2 5h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px center',
                      backgroundSize: '14px',
                      lineHeight: '1.5',
                      opacity: (!selectedCustomerId || loadingProjects) ? 0.6 : 1,
                    }}
                    value={selectedProjectId || ""}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={!selectedCustomerId || loadingProjects}
                  >
                    <option value="" style={{ color: '#64748b' }}>{loadingProjects ? 'Loading...' : 'Select project'}</option>
                    {projects.map((p) => <option key={p.projectId} value={p.projectId} style={{ color: '#1e293b' }}>{p.projectName}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: isMobileView ? 'stretch' : 'flex-end', width: isMobileView ? '100%' : 'auto' }}>
                  <button
                    className="allocation-btn allocation-btn-primary"
                    style={{ height: isMobileView ? '50px' : '3.125rem', width: isMobileView ? '100%' : 'auto' }}
                    disabled={!selectedProjectId}
                    onClick={handleNewAllocationClick}
                  >
                    New allocation
                  </button>
                </div>
              </div>
            </div>

            {selectedProjectId && (
              <div className="allocation-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#115e59', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedProject?.projectName}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
                    <span>Allocated: <strong>{activeAllocations.length} items</strong></span>
                  </div>
                </div>

                {loadingAllocations ? (
                  <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
                ) : activeAllocations.length === 0 ? (
                  <div className="message-banner" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                    No active resources allocated to this project.
                  </div>
                ) : (
                  <div className="allocation-table-wrapper">
                    <table className="allocation-main-table">
                      <thead>
                        <tr>
                          <th style={{ backgroundColor: "#629AF1", color: "white", padding: '12px 16px', borderRadius: '12px 0 0 12px', textAlign: 'center', fontWeight: 'normal' }}>Employee id</th>
                          <th style={{ backgroundColor: "#629AF1", color: "white", padding: '12px 16px', textAlign: 'center', fontWeight: 'normal' }}>Employee name</th>
                          <th style={{ backgroundColor: "#629AF1", color: "white", padding: '12px 16px', textAlign: 'center', fontWeight: 'normal' }}>Start date</th>
                          <th style={{ backgroundColor: "#629AF1", color: "white", padding: '12px 16px', textAlign: 'center', fontWeight: 'normal' }}>End date</th>
                          <th style={{ backgroundColor: "#629AF1", color: "white", padding: '12px 16px', borderRadius: '0 12px 12px 0', textAlign: 'center', fontWeight: 'normal' }}>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAllocations.map((alloc) => (
                          <tr key={alloc.id || alloc.allocationId}>
                            <td style={{ fontWeight: '700', color: '#14b8a6', textAlign: 'center' }}>
                              {getDisplayEmployeeId(alloc.employeeId)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {alloc.employeeName || '-'}
                            </td>

                            <td style={{ fontWeight: '500', textAlign: 'center' }}>
                              {formatDate(alloc.startDate)}
                            </td>

                            <td style={{ fontWeight: '500', textAlign: 'center' }}>
                              {formatDate(alloc.endDate)}
                            </td>

                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => handleEditClick(alloc)}
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
            )}
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              width: "100%",
              maxWidth: "500px",
              margin: "1rem",
              boxSizing: "border-box"
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ color: '#1F2937', margin: 0, fontWeight: 'normal' }}>
                  {isEditMode ? "Edit allocation" : "Project assignment"}
                </h2>
                <button className="close-x-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              <form onSubmit={handleAddAllocation} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <label className="allocation-form-label">
                    {isEditMode ? "Employee id" : "Employee ids (comma separated)"} <span style={{ color: "red" }}>*</span>
                  </label>
                  <textarea
                    ref={employeeIdsRef}
                    className="allocation-input"
                    style={{ width: '100%', minHeight: isEditMode ? '50px' : '100px', resize: 'vertical' }}
                    value={formData.employeeIds}
                    onChange={(e) => handleEmployeeIdsChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isEditMode ? "e.g. EMP001" : "e.g. EMP001, EMP002"}
                    
                    disabled={isEditMode}
                  />
                  {!isEditMode && (
                    <EmployeeSuggestion
                      suggestions={employeeSuggestions}
                      showSuggestions={showEmployeeSuggestions}
                      suggestionsLoading={suggestionsLoading}
                      onSelect={handleSuggestionClick}
                      suggestionsRef={suggestionsRef}
                      selectedSuggestionIndex={selectedSuggestionIndex}
                      setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="allocation-form-label">Start date <span style={{ color: "red" }}>*</span></label>
                    <SmartDatePicker
                      selected={formData.startDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                      minDate={projectStartDate}
                      maxDate={projectEndDate}
                      placeholderText="DD-MM-YYYY"
                      selectsStart
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="allocation-form-label">End date <span style={{ color: "red" }}>*</span></label>
                    <SmartDatePicker
                      selected={formData.endDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      minDate={formData.startDate || projectStartDate}
                      maxDate={projectEndDate}
                      placeholderText="DD-MM-YYYY"
                      selectsEnd
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      
                    />
                  </div>
                </div>

                {error && (
                  <div className="message-banner" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid currentColor', padding: '0.75rem' }}>
                    <FiAlertCircle /> {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="allocation-btn allocation-btn-primary" style={{ flex: 1 }}>
                    {isEditMode ? "Update" : "Submit"}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="allocation-btn allocation-btn-outline" style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="message-banner" style={{
            position: 'fixed', top: '2rem', right: '2rem', zIndex: 1100,
            backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid currentColor',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }}>
            <FiCheckCircle /> {successMessage}
          </div>
        )}
      </div>
    </Sidebar>
  );

};

export default AllocationPage;
