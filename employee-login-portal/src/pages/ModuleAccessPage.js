import React, { useState, useEffect, useRef } from "react";
import { BsGrid1X2 } from "react-icons/bs";
import api from "../api";

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
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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

export default function ModuleAccessPage() {

  // const MODULES = [
  //   "HOME","MY PROFILE","CLAIMS","TIMESHEET","EMPLOYEE HANDBOOK",
  //   "EMPLOYEE DIRECTORY","EXIT MANAGEMENT","HOLIDAY CALENDAR","HELPDESK",
  //   "LEAVES","PAYSLIPS","PERFORMANCE MANAGEMENT","ALLOCATIONS",
  //   "MYDOCUMENTS","TRAVEL","GRIEVANCE","ADMIN",
  //   "PRE_ONBOARDING","ONBOARDING","CONTRACT MANAGEMENT"
  // ];
  const MODULES = [
    "EMPLOYEE DIRECTORY",
    "PAYSLIPS", 
    // "ADMIN",
    "PRE_ONBOARDING", "ONBOARDING", "CONTRACT MANAGEMENT", "REPORTS", "COMPENSATION", "ASSET MANAGEMENT", "KNOWLEDGE HUB"
  ];

  const [moduleKey, setModuleKey] = useState("");
  const [existingIds, setExistingIds] = useState([]);
  const [employeeIds, setEmployeeIds] = useState("");
  const [loading, setLoading] = useState(false);

  // Employee suggestion states
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs for dropdown management
  const employeeIdsRef = useRef(null);
  const suggestionsRef = useRef(null);

  // ✅ Fetch existing IDs when module selected (WITH JWT)
  const fetchExistingIds = async (module) => {
    if (!module) return;

    const token = sessionStorage.getItem("token");

    try {
      const res = await api.get(
        `/v1/module-access/module/${module}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExistingIds(res.data);
    } catch (err) {
      console.error("Failed to fetch existing IDs", err);
      setExistingIds([]);
    }
  };


  // ✅ Save (merge + remove)
  const saveAccess = async () => {
    if (!moduleKey) {
      alert("Select module");
      return;
    }

    const token = sessionStorage.getItem("token");

    let finalIds = [];

    if (employeeIds.trim().toUpperCase() === "ALL") {
      finalIds = ["ALL"];
    } else {
      finalIds = employeeIds
        .split(",")
        .map(e => e.trim())
        .filter(Boolean);
    }


    setLoading(true);
    try {
      await api.post(
        "/v1/module-access/save",
        { moduleKey, employeeIds: finalIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Module access updated");
      setEmployeeIds("");
      fetchExistingIds(moduleKey);
    } catch (err) {
      alert("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id) => {
    if (!moduleKey) return;

    const token = sessionStorage.getItem("token");
    if (!window.confirm(`Remove ${getDisplayEmployeeId(id)} permanently?`)) return;

    try {
      await api.delete(
        `/v1/module-access/module/${encodeURIComponent(moduleKey)}/employee/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );


      // ✅ Always sync with DB
      fetchExistingIds(moduleKey);

    } catch (err) {
      console.error("Failed to delete employee", err);
      alert("Failed to remove employee");
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
  const handleEmployeeIdsChange = (value) => {
    console.log('handleEmployeeIdsChange called with:', value);
    setEmployeeIds(value);

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
    console.log('handleSuggestionClick called');

    const currentIds = employeeIds.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");

    // Replace the last ID with the selected employee
    if (currentIds.length > 0) {
      currentIds[currentIds.length - 1] = getDisplayEmployeeId(employee.employeeId);
    } else {
      currentIds.push(getDisplayEmployeeId(employee.employeeId));
    }

    const newValue = currentIds.join(", ");
    setEmployeeIds(newValue);
    setShowEmployeeSuggestions(false);
    setEmployeeSuggestions([]);
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
        employeeIdsRef.current && !employeeIdsRef.current.contains(event.target)) {
        setShowEmployeeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="admin-scroll-section" style={{ textAlign: "left" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          color: "#1F2937",
          fontSize: "1.75rem",
          fontWeight: "normal",
          margin: 0,
          textAlign: "left"
        }}>
          Module access management
        </h2>
        <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
          Human resource information system - Configure module availability and employee permissions
        </div>
      </div>

      <div className="admin-preonboarding-card" style={{ borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Module</label>
          <select
            value={moduleKey}
            onChange={(e) => {
              setModuleKey(e.target.value);
              fetchExistingIds(e.target.value);
            }}
            className="admin-input-field"
            style={{ marginBottom: "12px", borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
          >
            <option value="">Select Module</option>
            {MODULES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* Existing IDs */}
        {existingIds.filter(id => id && id.trim()).length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Existing employee ids</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px", justifyContent: "flex-start" }}>
              {existingIds
                .filter(id => id && id.trim())
                .map((id, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#f8fafc",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #e2e8f0",
                      color: "#1F2937",
                      fontWeight: "normal",
                      fontSize: "0.85rem"
                    }}
                  >
                    {getDisplayEmployeeId(id)}
                    <button
                      onClick={() => deleteEmployee(id)}
                      style={{
                        marginLeft: "8px",
                        border: "none",
                        background: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontWeight: "normal",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: "20px", position: 'relative' }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Add employee ids (comma separated) or all</label>
          <input
            ref={employeeIdsRef}
            value={employeeIds}
            onChange={e => handleEmployeeIdsChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Emp001, Emp002 or all"
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#00B3A4";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
            }}
          />
          <EmployeeSuggestion
            suggestions={employeeSuggestions}
            showSuggestions={showEmployeeSuggestions}
            suggestionsLoading={suggestionsLoading}
            onSelect={handleSuggestionClick}
            suggestionsRef={suggestionsRef}
            selectedSuggestionIndex={selectedSuggestionIndex}
            setSelectedSuggestionIndex={setSelectedSuggestionIndex}
          />
        </div>

        <button
          onClick={saveAccess}
          disabled={loading}
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
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}