import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../api";
import './Managergoals.css';
import Sidebar from './Sidebar.js';

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

function Hrtimesheetds() {
  // ===== Performance (Sidebar + Topbar) State =====
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));


  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInputs, setShowSearchInputs] = useState(false);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  useEffect(() => {

    if (!employeeId) return;

    const token = sessionStorage.getItem("token"); // JWT token

    const fetchEmployees = async () => {
      try {
        const response = await api.get(`/goals/hr/${employeeId}/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error.response?.data || error.message);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, [employeeId]);


  const handleEmployeeClick = (emp) => {
    sessionStorage.setItem('selectedEmployeeId', emp.employeeId);
    const fullName = `${emp.firstName} ${emp.lastName}`;

    sessionStorage.setItem('selectedEmployeeName', fullName);

    navigate('/timesheets', {
      state: { employeeId: emp.employeeId, employeeName: fullName }
    });






  };

  // New filtering logic
  const filteredEmployees = employees.filter(emp => {
    if (searchTerm === '') return true;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();

    return (
      emp.employeeId?.toLowerCase().includes(lowerCaseSearchTerm) ||
      fullName.includes(lowerCaseSearchTerm) ||
      emp.email?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });


  return (



    <div
      className="hrtimesheet-container"
      style={{
        marginTop: '0',
        paddingTop: '0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        height: "70vh",
      }}
    >

      {/* HrGoals Content */}
      <div className="emp-container" style={{ padding: '0px', marginBottom: '6px' }}>

        <h2 className="emp-title">My Team</h2>
        {employees.length === 0 ? (
          <p className="emp-empty">No employees found.</p>
        ) : (
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
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
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
                    <td colSpan="3" style={{ textAlign: 'center' }}>No employees found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>


  );
}

export default Hrtimesheetds;
