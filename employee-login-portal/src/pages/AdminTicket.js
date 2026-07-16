import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { FiLock } from 'react-icons/fi';

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

const TRAVEL_ADMIN_SAVE_URL = "/v1/admin-access/travel-admin/save";
const EMPLOYEES_URL = "/employees";

function AdminTicket() {
    const [travelAdminIds, setTravelAdminIds] = useState("");
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    // Refs for dropdown management
    const travelAdminIdsRef = useRef(null);
    const suggestionsRef = useRef(null);

    useEffect(() => {
        const fetchCurrentAdmins = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const response = await api.get(EMPLOYEES_URL, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && response.data.length > 0) {
                    const firstEmpWithAdmin = response.data.find(emp => emp.travelAdmin);
                    if (firstEmpWithAdmin && firstEmpWithAdmin.travelAdmin) {
                        const cleanIds = firstEmpWithAdmin.travelAdmin.split(",")
                            .map(id => getDisplayEmployeeId(id.trim()))
                            .join(", ");
                        setTravelAdminIds(cleanIds);
                    }
                }
            } catch (err) {
                console.error("Error fetching travel admins:", err);
            }
        };
        fetchCurrentAdmins();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!travelAdminIds.trim()) {
            setStatus("Please enter at least one Travel Admin ID.");
            return;
        }

        setIsLoading(true);
        setStatus("");

        const idList = travelAdminIds.split(",").map(id => id.trim()).filter(id => id !== "");

        try {
            const token = sessionStorage.getItem("token");
            await api.post(TRAVEL_ADMIN_SAVE_URL, {
                employeeIds: idList
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Travel Admin access saved successfully and pending requests moved.");
            setStatus(""); // Clear UI message since we show alert
        } catch (err) {
            setStatus("Error: " + (err.response?.data?.message || err.response?.data || err.message));
        } finally {
            setIsLoading(false);
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

    // Handle travel admin IDs input change (comma-separated support)
    const handleTravelAdminIdsChange = (value) => {
        console.log('handleTravelAdminIdsChange called with:', value);
        setTravelAdminIds(value);
        
        // Extract the last typed ID (after the last comma or space)
        const ids = value.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
        const lastId = ids[ids.length - 1] || "";
        
        console.log('Last ID for suggestions:', lastId);
        
        if (lastId.length >= 1) {
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
        
        const currentIds = travelAdminIds.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
        const cleanEmpId = getDisplayEmployeeId(employee.employeeId);
        
        // Replace the last ID with the selected employee
        if (currentIds.length > 0) {
            currentIds[currentIds.length - 1] = cleanEmpId;
        } else {
            currentIds.push(cleanEmpId);
        }
        
        const newValue = currentIds.join(", ");
        setTravelAdminIds(newValue);
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
                travelAdminIdsRef.current && !travelAdminIdsRef.current.contains(event.target)) {
                setShowEmployeeSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", textAlign: "left" }}>
            <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                maxWidth: "600px",
                margin: "0",
                textAlign: "left"
            }}>
                <div style={{
                    color: "#1F2937",
                    marginBottom: "20px",
                    fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
                    fontWeight: "normal",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textAlign: "left"
                }}>
                    Travel ticket admin access
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px", position: 'relative', textAlign: "left" }}>
                        <label style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "normal",
                            color: "#1F2937",
                            textAlign: "left"
                        }}>
                            Admin employee ids (comma-separated)
                        </label>
                        <input
                            ref={travelAdminIdsRef}
                            type="text"
                            placeholder="e.g. EMP001, EMP002"
                            value={travelAdminIds}
                            onChange={(e) => handleTravelAdminIdsChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px solid #e2e8f0",
                                borderRadius: "8px",
                                fontSize: "14px",
                                transition: "border-color 0.2s",
                                outline: "none",
                                background: "#fff",
                                color: "#1F2937",
                                boxSizing: "border-box"
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
                        <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "#64748b", textAlign: "left" }}>
                            The first ID will be treated as the primary admin for automatic request reassignment.
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            background: "#00B3A4",
                            color: "white",
                            border: "none",
                            padding: "clamp(10px, 2vw, 12px)",
                            borderRadius: "8px",
                            fontWeight: "normal",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            fontSize: "clamp(0.95rem, 2.5vw, 1rem)",
                            minHeight: "46px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        {isLoading ? "Submitting..." : "Submit"}
                    </button>
                </form>
                {status && (
                    <p style={{
                        marginTop: "12px",
                        color: status.startsWith("Error") ? "#ef4444" : "#0d9488",
                        fontWeight: "normal",
                        fontSize: "0.95rem",
                        textAlign: "left"
                    }}>
                        {status}
                    </p>
                )}
            </div>
        </div>
    );
}

export default AdminTicket;
