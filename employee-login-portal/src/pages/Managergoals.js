import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';
import Sidebar from './Sidebar.js';

import api from "../api";

function ManagerGoals() {
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };

  const [subordinates, setSubordinates] = useState([]);
  const [filteredSubordinates, setFilteredSubordinates] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [employeeName, setEmployeeName] = useState(sessionStorage.getItem("employeeName"));
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const employeeId = sessionStorage.getItem('employeeId'); // Logged-in user's ID



  useEffect(() => {
    if (!employeeId) {
      setErrorMessage('User ID not found. Please log in.');
      setIsManager(false);
      return;
    }

    const fetchSubordinates = async () => {
      try {
        const token = sessionStorage.getItem("token"); // JWT token

        const res = await api.get(`/goals/by-role/manager/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data;


        if (data.length > 0) {
          setSubordinates(data);
          setErrorMessage('');
          setIsManager(true);
        } else {
          setErrorMessage('No subordinates assigned to you.');
          setIsManager(false);
        }

      } catch (error) {

        console.error('Error fetching subordinates:', error);
        setErrorMessage('Failed to fetch subordinates.');
        setIsManager(false);
        setSubordinates([]);

      }
    };

    fetchSubordinates();
  }, [employeeId]);

  // Updated filtering logic to use 'employeeName' and 'overallStatus'
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();


    if (subordinates.length > 0) {
      const tempFiltered = subordinates.filter(sub => {
        const id = sub.employeeId ? String(sub.employeeId).toLowerCase() : '';
        const name = sub.employeeName ? sub.employeeName.toLowerCase() : ''; // ⭐ Use 'employeeName'
        const status = sub.overallStatus ? sub.overallStatus.toLowerCase() : ''; // ⭐ Use 'overallStatus'


        return (
          id.includes(lowercasedSearchTerm) ||
          name.includes(lowercasedSearchTerm) ||
          status.includes(lowercasedSearchTerm)
        );
      });
      setFilteredSubordinates(tempFiltered);
    } else {
      setFilteredSubordinates([]);
    }
  }, [searchTerm, subordinates]);

  // 1. UPDATED: Function now accepts both employeeId and employeeName
  const handleEmployeeClick = (empId, empName) => {
    sessionStorage.setItem('selectedEmployeeId', empId);
    // 2. UPDATED: Pass employeeName in the navigation state
    navigate('/GoalsPage', { state: { employeeId: empId, employeeName: empName } });
  };

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

      {!isManager ? (
        <div className="emp-container">
          <p className="emp-error">{errorMessage}</p>
        </div>
      ) : (
        <div className="emp-container">
          {errorMessage && <p className="emp-error">{errorMessage}</p>}
          <div
            className="tablesdc-wrapper"
            style={{
              maxHeight: 'calc(100vh - 300px)',
              overflowY: 'auto',
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <table className="emp-table" style={{ width: '100% !important' }} >
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>

                  <th style={{ minWidth: "80px" }}>Status</th>

                </tr>
              </thead>
              <tbody>
                {filteredSubordinates.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                      No employee details found for your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSubordinates.map((emp) => (
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
                            onClick={() => handleEmployeeClick(emp.employeeId, emp.employeeName)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerGoals;


