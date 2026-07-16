
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import api from "../api";
import { useNavigate } from 'react-router-dom';

function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce function for search suggestions
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Fetch suggestions from API
  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const rawToken = sessionStorage.getItem('token');
      const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;

      if (!token) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const response = await api.get(`/employeesdetails/suggestions?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuggestions(response.data);
      setShowSuggestions(response.data.length > 0);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Debounced version of fetchSuggestions
  const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedSuggestionIndex(-1); // Reset selection when typing
    
    if (value.trim().length >= 1) {
      debouncedFetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (employee) => {
    setSearchTerm(employee.employeeId);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Don't navigate directly - let the user click the record
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
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
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
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
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchTerm.trim().length >= 1 && suggestions.length > 0) {
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    const rawToken = sessionStorage.getItem('token');
    const token = rawToken ? rawToken.replace(/^"|"$/g, "") : null;

    if (!token) {
      console.error("Authentication token not found. User is likely not logged in.");
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    api.get('/employeesdetails/summary', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setEmployees(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("API Fetch Error:", err);
        let errorMsg = 'Failed to fetch employee data';
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          errorMsg = 'Access Denied: Please log in again.';
        } else if (err.code === 'ERR_NETWORK') {
          errorMsg = 'Network Error: Cannot connect to the backend server.';
        }
        setError(errorMsg);
        setLoading(false);
      });
  }, []);

  const handleEmployeeClick = (employeeId) => {
    navigate(`/employee/${employeeId}`);
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => {
    if (!emp) return false;
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    const firstName = (emp.firstName || '').toString().toLowerCase();
    const lastName = (emp.lastName || '').toString().toLowerCase();
    const fullName = `${firstName} ${lastName}`; // Already lowercase parts
    const employeeId = (emp.employeeId !== null && emp.employeeId !== undefined) ? emp.employeeId.toString().toLowerCase() : '';
    const email = (emp.email || '').toString().toLowerCase();
    
    // Handle the new format "Name (EmployeeID)" by extracting parts
    const searchWithoutParentheses = searchLower.replace(/[()]/g, '').trim();
    const searchParts = searchWithoutParentheses.split(/\s+/);
    
    // Check if search matches employee ID, full name, or any part of the new format
    return (
      employeeId.includes(searchLower) ||
      fullName.includes(searchLower) ||
      fullName.includes(searchWithoutParentheses) ||
      searchParts.some(part => 
        part.length > 0 && (firstName.includes(part) || lastName.includes(part) || employeeId.includes(part))
      )
    );
  });

  const containerStyle = { padding: isMobile ? '10px' : '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8' };
  const tableWrapperStyle = { 
    height: 'calc(100vh - 280px)', 
    overflowY: 'auto', 
    overflowX: 'hidden',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  };
  const tableStyle = { borderCollapse: 'collapse', backgroundColor: '#fff', height: 'initial', width: '100%', tableLayout: 'fixed' };
  const thStyle = {
    borderBottom: '2px solid #0B3D91',
    textAlign: 'left',
    padding: isMobile ? '8px 5px' : '10px',
    background: '#0B3D91',
    color: 'white',
    width: isMobile ? '18%' : 'auto',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '15px',
  };
  const thStyleRight = {
    ...thStyle,
    width: isMobile ? '82%' : 'auto',
    borderLeft: isMobile ? '1px solid #ddd' : 'none',
  };

  const tdStyle = {
    borderBottom: '1px solid #ccc',
    padding: isMobile ? '8px 4px' : '10px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '15px',
  };
  const tdStyleRight = {
    ...tdStyle,
    borderLeft: isMobile ? '1px solid #ddd' : 'none',
  };
  const clickableRowStyle = { cursor: 'pointer', transition: 'background-color 0.2s' };

  // Suggestions dropdown styles
  const suggestionsContainerStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    width: '100%',
    boxSizing: 'border-box'
  };

  const suggestionItemStyle = {
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
    transition: 'background-color 0.2s',
  };

  const suggestionItemHoverStyle = {
    ...suggestionItemStyle,
    backgroundColor: '#f8fafc',
  };

  const suggestionHighlightStyle = {
    color: '#0B3D91',
    fontWeight: '500',
  };


  const searchBarContainerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'flex-start',
    alignItems: isMobile ? 'stretch' : 'center',
    marginBottom: '20px',
    gap: isMobile ? '10px' : '0',
  };

  const searchInputStyle = {
    width: '100px',
    padding: '3px 5px',
    fontSize: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    marginLeft: 'auto',
  };

  return (
    <Sidebar>
      <div style={containerStyle}>
        {loading ? (
          <p>Loading employees...</p>
        ) : error ? (
          <p style={{ color: 'red', padding: '20px' }}>{error}</p>
        ) : (
          <>
            {/* Header with Search Bar */}
            <div style={searchBarContainerStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h2 style={{ margin: 0, padding: 0, fontWeight: 'normal', fontSize: '30px', color: '#1F2937' }}>Employee Directory</h2>
                <p style={{ color: '#00b3a4', fontSize: '15px', margin: '5px 0 0 0', padding: 0 }}>Browse and search across all employees in your organisation</p>
              </div>
              <div style={{ position: 'relative', marginLeft: isMobile ? '0' : 'auto', width: isMobile ? '100%' : '250px' }}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search by ID or name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    marginLeft: isMobile ? '0' : 'auto',
                  }}
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div 
                    ref={suggestionsRef}
                    style={suggestionsContainerStyle}
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
                            ...suggestionItemStyle,
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
                          onClick={() => handleSuggestionClick(employee)}
                        >
                          <div>
                            {employee.firstName} {employee.lastName} ({getDisplayEmployeeId(employee.employeeId)})
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Results Count */}
            {searchTerm && (
              <p style={{
                textAlign: 'right',
                fontSize: '14px',
                color: '#64748b',
                marginTop: '-12px',
                marginBottom: '12px'
              }}>
                Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Employee Table */}
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Employee ID</th>
                    <th style={thStyleRight}>Employee Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees found'}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => (
                      <tr
                        key={emp.employeeId}
                        onClick={() => handleEmployeeClick(emp.employeeId)}
                        style={clickableRowStyle}
                      >
                        <td style={tdStyle}>{getDisplayEmployeeId(emp.employeeId)}</td>
                        <td style={tdStyleRight}>
                          {emp.firstName} {emp.lastName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Sidebar >
  );
}

export default EmployeeDirectory;

