import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';
import Sidebar from './Sidebar.js';
import api from "../api";

function HrGoals() {
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };

  // ===== Performance (Sidebar + Topbar) State =====
  const employeeId = sessionStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));

  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // ===== HrGoals State =====
  const [employees, setEmployees] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHR, setIsHR] = useState(false);
  const role = sessionStorage.getItem('role');


  useEffect(() => {
    if (!employeeId) {
      setErrorMessage('User ID not found. Please log in.');
      setIsHR(false);
      return;
    }

    setIsHR(true);

    const fetchEmployees = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in.");

        const response = await api.get(`/goals/by-role/hr/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setEmployees(response.data || []);
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching employees:', error.response?.data || error.message);
        setErrorMessage('Failed to fetch employees.');
        setEmployees([]);
      }
    };

    fetchEmployees();

  }, [employeeId]);




  const handleEmployeeClick = (empId) => {
    sessionStorage.setItem('selectedEmployeeId', empId);
    navigate("/HrGoalsPage", { state: { employeeId: empId } });

  };

  // Update your filter logic to this:
  const filteredEmployees = employees.filter(emp => {
    if (searchTerm === '') {
      return true; // No filter applied if search term is empty
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      emp.employeeId?.toLowerCase().includes(lowerCaseSearchTerm) ||
      emp.employeeName?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });
  return (


    <div style={{
      marginTop: '0',
      paddingTop: '0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      height: "70vh",
      marginLeft: "0" // make container fill screen height
    }}>

      {/* HrGoals Content */}
      <div className="emp-container">
        {!isHR ? (
          <>
            <p className="emp-error">{errorMessage}</p>
          </>
        ) : (
          <>
            {errorMessage && <p className="emp-error">{errorMessage}</p>}

            {employees.length > 0 && (
              <div
                className="tablea-wrapper"
                style={{
                  maxHeight: 'calc(100vh - 300px)', // 👈 limit height
                  overflowY: 'auto',                // 👈 vertical scroll
                  overflowX: 'auto',                // 👈 optional: scroll horizontally if needed
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <table className="emp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#629AF1', zIndex: 1, color: 'white' }}>
                    <tr>
                      <th style={{ background: 'transparent', color: 'white', padding: '10px 12px' }}>Employee ID</th>
                      <th style={{ background: 'transparent', color: 'white', padding: '10px 12px' }}>Employee Name</th>
                      <th style={{ background: 'transparent', color: 'white', padding: '10px 12px', minWidth: '80px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <tr
                          key={emp.employeeId}
                          style={{ transition: 'all 0.2s ease' }}
                        >
                          <td style={{ backgroundColor: 'transparent', padding: '12px 15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '600', color: '#0f172a' }}>{getDisplayEmployeeId(emp.employeeId)}</span>
                            </div>
                          </td>

                          <td style={{ backgroundColor: 'transparent', padding: '12px 15px', color: '#334155', fontWeight: '500' }}>
                            {emp.employeeName}
                          </td>

                          <td style={{ backgroundColor: 'transparent', padding: '12px 15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', flexWrap: 'nowrap', gap: '10px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: '#f0fdfd',
                                color: '#0d9488',
                                border: '1px solid #99f6e4'
                              }}>
                                {emp.overallStatus}
                              </span>

                              <button
                                type="button"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 14px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 6px rgba(20, 184, 166, 0.2)',
                                  width: 'auto',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(20, 184, 166, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(20, 184, 166, 0.2)';
                                }}
                                onClick={() => handleEmployeeClick(emp.employeeId)}
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                          No employees found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>



    </div>
  );
}

export default HrGoals;
