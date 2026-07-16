import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';
import Sidebar from './Sidebar.js';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


import api from "../api";

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

const SmartDatePicker = ({ value, onChange, placeholder, required, maxDate, minDate, inputStyle }) => {
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  return (
    <DatePicker
      selected={value ? new Date(value) : null}
      onChange={onChange}
      dateFormat="dd-MM-yyyy"
      placeholderText={placeholder}
      className="date-picker-input"
      wrapperClassName="date-picker-wrapper"
      customInput={<input style={inputStyle} required={required} />}
      maxDate={maxDate}
      minDate={minDate}
      portalId="root"
      popperPlacement="bottom-start"

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
        const years = Array.from({ length: 120 }, (_, i) => currentYear + 10 - i);

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
  );
};

function Managertimesheetds() {
  const [subordinates, setSubordinates] = useState([]);
  const [filteredSubordinates, setFilteredSubordinates] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInputs, setShowSearchInputs] = useState(false);
  const [freezeSuccessMessage, setFreezeSuccessMessage] = useState("");
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [freezeInfo, setFreezeInfo] = useState({ isFrozen: false, frozenUntil: null });



  const modalRef = useRef(null);
  const navigate = useNavigate();
  const employeeId = sessionStorage.getItem('employeeId');

  const storedEmpName = sessionStorage.getItem("selectedEmployeeName");

  const [selectedEmployee, setSelectedEmployee] = useState({
    name: '',
    employeeId: ''
  });

  // Load selected employee from sessionStorage
  useEffect(() => {
    const storedEmpId = sessionStorage.getItem("selectedEmployeeId");
    const storedEmpName = sessionStorage.getItem("selectedEmployeeName");

    if (storedEmpId && storedEmpName) {
      setSelectedEmployee({
        employeeId: storedEmpId,
        name: storedEmpName
      });
    }
  }, []);

  useEffect(() => {
    if (!employeeId) {
      setErrorMessage("User ID not found. Please log in.");

      setSubordinates([]);
      return;
    }


    const fetchSubordinates = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const response = await api.get(`/goals/manager/${employeeId}/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSubordinates(response.data);
        setErrorMessage("");
      } catch (error) {
        console.error("Error fetching subordinates:", error.response?.data || error.message);
        setErrorMessage("Failed to fetch subordinates.");
        setSubordinates([]);
      }
    };

    fetchSubordinates();
  }, [employeeId]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    if (subordinates.length > 0) {
      const tempFiltered = subordinates.filter(sub => {
        const id = sub.employeeId ? String(sub.employeeId).toLowerCase() : '';
        const fullName = `${sub.firstName || ""} ${sub.lastName || ""}`.toLowerCase();

        const email = sub.email ? sub.email.toLowerCase() : '';
        return (
          id.includes(lowercasedSearchTerm) ||
          fullName.includes(lowercasedSearchTerm) ||
          email.includes(lowercasedSearchTerm)
        );
      });
      setFilteredSubordinates(tempFiltered);
    } else {
      setFilteredSubordinates([]);
    }
  }, [searchTerm, subordinates]);

  const fetchTeamFreezeStatus = async () => {
    if (!subordinates || subordinates.length === 0) return;
    const token = sessionStorage.getItem("token");
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const formatDateForQuery = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      const empIdsStr = subordinates.map(s => s.employeeId).join(',');

      // Use fetch-reports with status=Frozen to precisely find frozen entries for the team
      const response = await api.get('/daily-entry/fetch-reports', {
        params: {
          employeeId: empIdsStr,
          status: 'Frozen',
          startDate: formatDateForQuery(startOfMonth),
          endDate: formatDateForQuery(endOfMonth)
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const frozenEntries = response.data;

      const parseEntryDate = (dateVal) => {
        if (!dateVal) return null;
        if (Array.isArray(dateVal)) return new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
        if (typeof dateVal === 'string') {
          const parts = dateVal.split(/[-/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
          return new Date(dateVal);
        }
        return null;
      };

      if (frozenEntries && frozenEntries.length > 0) {
        const latestEntry = frozenEntries.reduce((max, entry) => {
          const current = parseEntryDate(entry.date);
          const maxDate = parseEntryDate(max.date);
          return (current && maxDate && current > maxDate) ? entry : max;
        }, frozenEntries[0]);

        setFreezeInfo({ isFrozen: true, frozenUntil: latestEntry.date });
      } else {
        setFreezeInfo({ isFrozen: false, frozenUntil: null });
      }
    } catch (err) {
      console.error("Failed to fetch team freeze status:", err);
    }
  };

  useEffect(() => {
    if (subordinates.length > 0) {
      fetchTeamFreezeStatus();
    }
  }, [subordinates]);


  const handleEmployeeClick = (emp) => {
    sessionStorage.setItem("selectedEmployeeId", emp.employeeId);
    const fullName = `${emp.firstName} ${emp.lastName}`;

    sessionStorage.setItem("selectedEmployeeName", fullName);

    setSelectedEmployee({
      name: fullName,
      employeeId: emp.employeeId
    });

    navigate("/mngreq", {
      state: { employeeId: emp.employeeId, employeeName: fullName }
    });

  };

  const handleFreezeAllTimesheets = () => {
    setFreezeSuccessMessage("");

    if (filteredSubordinates.length === 0) {
      setFreezeSuccessMessage("No employees to freeze timesheets for.");
      setTimeout(() => setFreezeSuccessMessage(""), 4000);
      return;
    }

    setIsFreezeModalOpen(true);
  };

  const confirmFreeze = async () => {

    if (!startDate || !endDate) {
      setFreezeSuccessMessage("Please select both a start and end date.");
      return;
    }

    if (startDate > endDate) {
      setFreezeSuccessMessage("Start date cannot be after end date.");
      return;
    }



    setIsFreezeModalOpen(false);
    setFreezeSuccessMessage("Freezing timesheets... Please wait.");

    const token = sessionStorage.getItem("token");

    let allSuccess = true;

    for (const emp of filteredSubordinates) {
      try {
        const formatDate = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };

        const payload = {
          managerId: employeeId,
          employeeId: emp.employeeId,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
        };



        await api.put("/daily-entry/freeze", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      } catch (error) {
        console.error(error.response?.data || error.message);
        allSuccess = false;
        setFreezeSuccessMessage(
          `❌ Failed to freeze timesheets for  ${emp.firstName} ${emp.lastName}: ${error.response?.data || error.message}`
        );

        break;
      }
    }

    if (allSuccess) {

      setFreezeSuccessMessage(
        "✅ All subordinate timesheets have been frozen successfully."
      );
      fetchTeamFreezeStatus();
    }

    setTimeout(() => setFreezeSuccessMessage(""), 4000);
  };

  return (


    <div
      className="managertimesheet-container"
      style={{
        marginTop: '0',
        paddingTop: '0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        height: '70vh',
      }}
    >
      {freezeSuccessMessage && (
        <div
          style={{
            color: freezeSuccessMessage.startsWith('❌') ? 'red' : 'green',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '10px',
          }}
        >
          {freezeSuccessMessage}
        </div>
      )}

      <div className="emp-container">
        {/* News Feed / Status Bar for Freeze Info */}
        {/* <div style={{
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(94, 234, 212, 0.1) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.2)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(20, 184, 166, 0.1)'
        }}>

          <div style={{ flexGrow: 1 }}>

            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
              {freezeInfo.isFrozen
                ? <>Team timesheets are currently <strong>Frozen</strong> until <strong>{(() => {
                  const d = freezeInfo.frozenUntil;
                  if (!d) return '';
                  if (Array.isArray(d)) return `${String(d[2]).padStart(2, '0')}/${String(d[1]).padStart(2, '0')}/${d[0]}`;
                  if (typeof d === 'string') {
                    const parts = d.split(/[-/]/);
                    if (parts.length === 3) {
                      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      return d;
                    }
                  }
                  return new Date(d).toLocaleDateString('en-GB');
                })()}</strong>.</>
                : 'Team timesheets are active. No freeze periods detected for the current month.'}
            </p>
          </div>

        </div> */}

        {errorMessage ? (
          <>
            <h2 className="emp-title">Error</h2>
            <p className="emp-error">{errorMessage}</p>
          </>
        ) : subordinates.length === 0 ? (
          <p className="emp-empty">No subordinates found.</p>
        ) : (
          <>
            {/* ===== Top Bar with My Team and Freeze Button ===== */}
            <div className="responsive-header">
              <h2 className="emp-title" style={{ margin: 0 }}>
                My Team
              </h2>
              {subordinates.length > 0 && (
                <button
                  onClick={handleFreezeAllTimesheets}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#00B3A4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(94, 234, 212, 0.4)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2dd4bf'; // Darker teal on hover
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(94, 234, 212, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#5eead4';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(94, 234, 212, 0.4)';
                  }}
                >
                  Freeze All
                </button>
              )}
            </div>

            <div className="table-wrapper table-responsive-container">
              <table className="emp-table" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px' }}>
                        <span>Employee ID</span>
                        <button
                          onClick={() => setShowSearchInputs(!showSearchInputs)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '0px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Toggle search"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                          </svg>
                        </button>
                      </div>
                      {showSearchInputs && (
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            marginTop: '2px',
                            padding: '2px 4px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            width: '100%',
                            maxWidth: '100%',
                            fontSize: '10px',
                            color: '#333',
                            background: 'rgba(255, 255, 255, 1)',
                            outline: 'none',
                            height: '20px',
                            boxSizing: 'border-box'
                          }}
                        />
                      )}
                    </th>
                    <th>Employee Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubordinates.length > 0 ? (
                    filteredSubordinates.map((emp) => (
                      <tr key={emp.id || emp.employeeId}>
                        <td data-label="Employee ID">
                          <button
                            type="button"
                            style={{
                              color: '#1f2937',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              font: 'inherit',
                              fontWeight: 'normal',
                              textDecoration: 'underline',
                            }}
                            onClick={() => handleEmployeeClick(emp)}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                          >
                            {getDisplayEmployeeId(emp.employeeId)}
                          </button>
                        </td>
                        <td data-label="Name">{emp.firstName} {emp.lastName}</td>
                        <td data-label="Email">{emp.email}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center' }}>No subordinates found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div></>
        )}
      </div>

      {/* ===== Freeze Modal ===== */}
      {isFreezeModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
        >
          <div
            ref={modalRef}
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h3 className="modal-title">Select Date Range to Freeze</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ fontWeight: '600', color: '#64748b' }}>Start Date:</label>
              <SmartDatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Select start date"
                inputStyle={{
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  width: "100%",
                  fontSize: "0.95rem"
                }}
              />

              <label style={{ marginTop: "10px", fontWeight: '600', color: '#64748b' }}>End Date:</label>
              <SmartDatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="Select end date"
                inputStyle={{
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  width: "100%",
                  fontSize: "0.95rem"
                }}
              />
            </div>
            {freezeSuccessMessage && (
              <p
                style={{
                  color: freezeSuccessMessage.startsWith('❌') ? 'red' : 'green',
                  marginTop: '15px',
                }}
              >
                {freezeSuccessMessage}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={() => setIsFreezeModalOpen(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmFreeze}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#00B3A4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0, 179, 164, 0.2)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#008f83';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 179, 164, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00B3A4';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 179, 164, 0.2)';
                }}
              >
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>




  );
}

export default Managertimesheetds;