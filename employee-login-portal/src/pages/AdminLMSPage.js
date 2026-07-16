import React, { useState, useEffect, useRef } from 'react';
import { FiBookOpen, FiPlus, FiPlayCircle, FiTrash2 } from 'react-icons/fi';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api";

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
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </div>
                ))
            )}
        </div>
    );
};

// SmartDatePicker component with proper month/year scrolling
const SmartDatePicker = ({ value, onChange, placeholder = "DD-MM-YYYY", className = "", minDate }) => {
    const [open, setOpen] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 110 }, (_, i) => (currentYear + 10) - i);

    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={(date) => { 
                onChange(date); 
                setTimeout(() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }, 20); 
            }}
            onSelect={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            open={open} 
            onInputClick={() => setOpen(true)}
            onClickOutside={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
            placeholderText={placeholder} 
            dateFormat="dd-MM-yyyy"
            className={className}
            calendarClassName="no-gap-calendar" 
            dayClassName={() => "no-gap-day"} 
            wrapperClassName="full-width-picker"
            minDate={minDate}
            renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => (
                <div className="custom-calendar-header">
                    <div className="calendar-header-banner">
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>&#8249;</button>
                        <div className="header-main-content">
                            <div className="header-text-group">
                                <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                                <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                            </div>
                        </div>
                        <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>&#8250;</button>
                    </div>
                    {showMonthDropdown && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{MONTHS.map((m, idx) => (<div key={m} className={"dropdown-item" + (idx === date.getMonth() ? " active" : "")} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>))}</div></div>)}
                    {showYearDropdown && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map(y => (<div key={y} className={"dropdown-item" + (y === date.getFullYear() ? " active" : "")} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>))}</div></div>)}
                </div>
            )}
        />
    );
};

const AdminLMSPage = () => {
    const [lmsTrainingName, setLmsTrainingName] = useState("");
    const [lmsEmployeeIds, setLmsEmployeeIds] = useState("");
    const [lmsDeadline, setLmsDeadline] = useState("");
    const [lmsStartDate, setLmsStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [lmsCategory, setLmsCategory] = useState("");
    const [lmsDescription, setLmsDescription] = useState("");
    const [lmsStatus, setLmsStatus] = useState("");
    const [assignedTrainings, setAssignedTrainings] = useState([]);
    const [lmsAssignToAll, setLmsAssignToAll] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lmsFilterCategory, setLmsFilterCategory] = useState("");

    // Employee suggestion states
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    // Refs for dropdown management
    const lmsEmployeeIdsRef = useRef(null);
    const suggestionsRef = useRef(null);

    const token = sessionStorage.getItem("token");
    const adminId = sessionStorage.getItem("employeeId");

    const fetchTrainings = async () => {
        try {
            const res = await api.get("/lms/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignedTrainings(res.data || []);
        } catch (err) {
            console.error("Failed to fetch trainings", err);
        }
    };

    useEffect(() => {
        fetchTrainings();
    }, []);

    const handleLmsSubmit = async (e) => {
        e.preventDefault();
        if (!lmsTrainingName || (!lmsAssignToAll && !lmsEmployeeIds) || !lmsDeadline || !lmsCategory) {
            setLmsStatus("Please fill all mandatory fields.");
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        if (lmsDeadline < todayStr) {
            setLmsStatus("Error: Deadline cannot be in the past.");
            return;
        }
        if (lmsStartDate && lmsDeadline < lmsStartDate) {
            setLmsStatus("Error: Deadline cannot be before Start Date.");
            return;
        }

        setIsLoading(true);
        setLmsStatus("Assigning trainings...");

        try {
            if (lmsAssignToAll) {
                const payload = {
                    trainingName: lmsTrainingName,
                    deadline: lmsDeadline,
                    startDate: lmsStartDate,
                    description: lmsDescription,
                    category: lmsCategory,
                    assignedBy: adminId,
                    status: "Pending",
                    progress: 0
                };
                await api.post("/lms/assign-all", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                const employeeIdList = lmsEmployeeIds.split(',').map(id => id.trim()).filter(id => id !== "");
                for (const empId of employeeIdList) {
                    const payload = {
                        trainingName: lmsTrainingName,
                        employeeId: empId,
                        deadline: lmsDeadline,
                        startDate: lmsStartDate,
                        description: lmsDescription,
                        category: lmsCategory,
                        assignedBy: adminId,
                        status: "Pending",
                        progress: 0
                    };
                    await api.post("/lms/assign", payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            alert("Training assigned successfully!");
            setLmsStatus(""); // Clear UI message since we show alert
            setLmsTrainingName("");
            setLmsEmployeeIds("");
            setLmsAssignToAll(false);
            setLmsDeadline("");
            setLmsDescription("");
            fetchTrainings();
        } catch (err) {
            console.error("Failed to assign training", err);
            setLmsStatus("Error: Failed to assign training. Please try again.");
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
    const handleLmsEmployeeIdsChange = (value) => {
        console.log('handleLmsEmployeeIdsChange called with:', value);
        setLmsEmployeeIds(value);
        
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
        
        const currentIds = lmsEmployeeIds.split(/[,\s]+/).map(id => id.trim()).filter(id => id !== "");
        
        // Replace the last ID with the selected employee
        if (currentIds.length > 0) {
            currentIds[currentIds.length - 1] = employee.employeeId;
        } else {
            currentIds.push(employee.employeeId);
        }
        
        const newValue = currentIds.join(", ");
        setLmsEmployeeIds(newValue);
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
                lmsEmployeeIdsRef.current && !lmsEmployeeIdsRef.current.contains(event.target)) {
                setShowEmployeeSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this assignment?")) return;
        try {
            await api.delete(`/lms/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignedTrainings(assignedTrainings.filter(t => t.id !== id));
        } catch (err) {
            console.error("Failed to delete training", err);
            alert("Failed to delete training assignment.");
        }
    };

    return (
        <div className="admin-scroll-section" style={{ width: "95%", margin: "20px auto", textAlign: "left" }}>
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{
                    color: "#1F2937",
                    fontSize: "1.75rem",
                    fontWeight: "normal",
                    margin: 0,
                    textAlign: "left"
                }}>
                    Lms management
                </h2>
                <div style={{ color: "#00B3A4", fontSize: "1rem", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                    Human resource information system - Manage course enrollments, progress tracking, and training material distribution
                </div>
            </div>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", textAlign: "left" }}>
                <div className="admin-preonboarding-card" style={{ flex: "1 1 450px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <h3 style={{ color: "#1F2937", marginBottom: "20px", fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                        Assign new training
                    </h3>
                    <form onSubmit={handleLmsSubmit}>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Training name *</label>
                            <input
                                type="text"
                                className="admin-input-field"
                                placeholder="e.g. Code of conduct"
                                value={lmsTrainingName}
                                onChange={(e) => setLmsTrainingName(e.target.value)}
                                disabled={isLoading}
                                style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                            />
                        </div>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Category *</label>
                            <select
                                className="admin-input-field"
                                value={lmsCategory}
                                onChange={(e) => setLmsCategory(e.target.value)}
                                disabled={isLoading}
                                style={{ borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                            >
                                <option value="">Select Category</option>
                                <option value="Mandatory">Mandatory</option>
                                <option value="Optional">Optional</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Start date *</label>
                            <SmartDatePicker
                                value={lmsStartDate}
                                onChange={(date) => setLmsStartDate(date ? date.toISOString().split('T')[0] : '')}
                                placeholder="Select start date"
                                className="admin-input-field"
                                minDate={new Date()}
                            />
                        </div>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Deadline *</label>
                            <SmartDatePicker
                                value={lmsDeadline}
                                onChange={(date) => setLmsDeadline(date ? date.toISOString().split('T')[0] : '')}
                                placeholder="Select deadline"
                                className="admin-input-field"
                                minDate={lmsStartDate ? new Date(lmsStartDate) : new Date()}
                            />
                        </div>
                        <div style={{ marginBottom: "20px", position: 'relative' }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <label style={{ display: "block", marginBottom: 0, color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Assign to employee ids *</label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "#1F2937", cursor: "pointer", fontWeight: "normal" }}>
                                    <input
                                        type="checkbox"
                                        checked={lmsAssignToAll}
                                        onChange={(e) => {
                                            setLmsAssignToAll(e.target.checked);
                                            if (e.target.checked) setLmsEmployeeIds("");
                                        }}
                                        disabled={isLoading}
                                        style={{ accentColor: "#00B3A4", width: "16px", height: "16px" }}
                                    />
                                    Assign to All
                                </label>
                            </div>
                            <input
                                ref={lmsEmployeeIdsRef}
                                type="text"
                                className="admin-input-field"
                                placeholder={lmsAssignToAll ? "All employees selected" : "e.g. H100XYZ (comma separated)"}
                                value={lmsEmployeeIds}
                                onChange={(e) => handleLmsEmployeeIdsChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading || lmsAssignToAll}
                                style={{
                                    borderRadius: "8px",
                                    border: "2px solid #e2e8f0",
                                    backgroundColor: lmsAssignToAll ? "#f1f5f9" : "white",
                                    color: "#1F2937",
                                    cursor: lmsAssignToAll ? "not-allowed" : "text"
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
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", color: "#1F2937", fontWeight: "normal", fontSize: "0.95rem", textAlign: "left" }}>Description</label>
                            <textarea
                                className="admin-input-field"
                                style={{ height: "80px", resize: "none", borderRadius: "8px", border: "2px solid #e2e8f0", background: "#fff", color: "#1F2937" }}
                                placeholder="Enter training details..."
                                value={lmsDescription}
                                onChange={(e) => setLmsDescription(e.target.value)}
                                disabled={isLoading}
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
                                transition: "background-color 0.2s",
                                opacity: isLoading ? 0.7 : 1
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit"}
                        </button>
                    </form>
                    {lmsStatus && (
                        <div style={{
                            marginTop: "16px",
                            padding: "12px",
                            borderRadius: "8px",
                            backgroundColor: lmsStatus.includes("Error") ? "#fee2e2" : "#dcfce7",
                            color: lmsStatus.includes("Error") ? "#991b1b" : "#166534",
                            fontSize: "0.875rem",
                            fontWeight: "normal",
                            textAlign: "left"
                        }}>
                            {lmsStatus}
                        </div>
                    )}
                </div>

                <div className="admin-preonboarding-card" style={{ flex: "1 1 450px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ color: "#1F2937", margin: 0, fontSize: "1.25rem", fontWeight: "normal", display: "flex", alignItems: "center", gap: "8px" }}>
                            Recently assigned
                        </h3>
                        <select
                            style={{
                                padding: '6px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: '#1F2937',
                                fontWeight: 'normal',
                                outline: 'none',
                                cursor: 'pointer',
                                background: "#fff"
                            }}
                            onChange={(e) => setLmsFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="Mandatory">Mandatory</option>
                            <option value="Optional">Optional</option>
                        </select>
                    </div>
                    <div style={{ maxHeight: "450px", overflowY: "auto", textAlign: "left" }}>
                        {assignedTrainings.filter(t => !lmsFilterCategory || t.category === lmsFilterCategory).length === 0 ? (
                            <p style={{ color: "#64748b", textAlign: "left", padding: "20px" }}>No trainings found in this category.</p>
                        ) : (
                            assignedTrainings
                                .filter(t => !lmsFilterCategory || t.category === lmsFilterCategory)
                                .map(t => (
                                <div key={t.id} style={{
                                    padding: "16px",
                                    borderBottom: "1px solid #e2e8f0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    textAlign: "left"
                                }}>
                                    <div style={{ textAlign: "left" }}>
                                        <strong style={{ color: "#1e293b", display: "block", fontSize: "0.9rem", textAlign: "left", fontWeight: "normal" }}>{t.trainingName}</strong>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", textAlign: "left" }}>
                                            <span style={{ fontWeight: "normal", color: "#0f766e" }}>{t.category}</span> | Emp ID: {t.employeeId}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px", textAlign: "left" }}>
                                            Start: {t.startDate} | Deadline: {t.deadline}
                                        </div>
                                        {t.description && (
                                            <div 
                                                className="admin-description-scroll"
                                                style={{ 
                                                    fontSize: "0.75rem", 
                                                    color: "#64748b", 
                                                    marginTop: "8px",
                                                    padding: "8px",
                                                    backgroundColor: "#f8fafc",
                                                    borderRadius: "8px",
                                                    borderLeft: "3px solid #cbd5e1",
                                                    maxHeight: "80px",
                                                    overflowY: "auto",
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                    lineHeight: "1.5",
                                                    scrollbarWidth: 'none',
                                                    msOverflowStyle: 'none',
                                                    textAlign: "left"
                                                }}>
                                                <style>{`.admin-description-scroll::-webkit-scrollbar { display: none; }`}</style>
                                                {t.description}
                                            </div>
                                        )}
                                        <div style={{ fontSize: "0.75rem", color: t.status === 'Completed' ? '#10b981' : '#f59e0b', fontWeight: 'normal', marginTop: '4px', textAlign: "left" }}>
                                            Status: {t.status} ({t.progress}%)
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#ef4444",
                                            cursor: "pointer",
                                            padding: "8px",
                                            fontWeight: "normal",
                                            fontSize: "0.875rem"
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        ).reverse()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLMSPage;
