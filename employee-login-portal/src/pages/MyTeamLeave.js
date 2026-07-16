import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar.js";
import ManagerTasks from "./ManagerTasks";
import HrTasks from "./HrTasks";
import api from "../api";
import { FiUser, FiShield, FiFilter, FiChevronDown } from 'react-icons/fi';
import './Leave.css';

function MyTasks() {
  const employeeId = useMemo(() => sessionStorage.getItem("employeeId"), []);
  const [assignedRoles, setAssignedRoles] = useState({
    manager: false,
    hr: false,
  });

  const [fetchError, setFetchError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!employeeId) return;

    const fetchRoles = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          setFetchError("Authentication token not found. Please log in again.");
          return;
        }

        const response = await api.get(`/access/assigned-ids/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rolesData = response.data || {};
        const roles = {
          manager: !!rolesData.manager,
          hr: !!rolesData.hr,
        };

        setAssignedRoles(roles);
      } catch (err) {
        console.error("Failed to fetch assigned roles:", err.response?.data || err.message);
        setFetchError(err.response?.data || err.message);
      }
    };

    fetchRoles();
  }, [employeeId]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [counts, setCounts] = useState({});

  const handleRefresh = React.useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleManagerData = React.useCallback((count) => {
    setCounts(prev => prev.manager === count ? prev : { ...prev, manager: count });
  }, []);

  const handleHrData = React.useCallback((count) => {
    setCounts(prev => prev.hr === count ? prev : { ...prev, hr: count });
  }, []);

  const rolesWithData = Object.keys(counts).length;
  const activeRolesCount = (assignedRoles.manager ? 1 : 0) + (assignedRoles.hr ? 1 : 0);
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const isDataReady = activeRolesCount > 0 && rolesWithData >= activeRolesCount;

  return (
    <div className="" style={{ padding: "0px 5px 5px 5px", display: "flex", flexDirection: "column", gap: "0px", marginTop: "0px" }}>

      {fetchError && <p style={{ color: "red", fontWeight: "bold" }}>{fetchError}</p>}

      <div className="table-wrapper" style={{ maxHeight: "calc(100vh - 150px)", overflowY: "auto", overflowX: "auto", marginTop: "0px", borderRadius: "0" }}>
        <table className="status-table transparent-table">
          <thead>
            <tr>
              {/* <th style={{ background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: 'white' }}>Leave ID</th> */}
              <th style={{ background: '#629af1', color: 'white', borderRadius: '0' }}>Employee ID</th>
              <th style={{ background: '#629af1', color: 'white', borderRadius: '0' }}>Employee Name</th>
              <th style={{ background: '#629af1', color: 'white', borderRadius: '0' }}>Leave Type</th>
              <th style={{ background: '#629af1', color: 'white', cursor: 'pointer', userSelect: 'none', borderRadius: '0' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPos({ top: rect.bottom, left: rect.left });
                  setShowFilterDropdown(!showFilterDropdown);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                  Status <FiChevronDown />
                </div>
                {showFilterDropdown && (
                  <>
                    <div
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilterDropdown(false);
                      }}
                    />
                    <div style={{
                      position: 'fixed',
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      borderRadius: '8px',
                      padding: '4px',
                      zIndex: 50,
                      minWidth: '120px',
                      marginTop: '4px',
                      border: '1px solid #e2e8f0'
                    }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['All', 'Pending', 'Approved'].map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setStatusFilter(option);
                            setShowFilterDropdown(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            color: statusFilter === option ? '#10b981' : '#334155',
                            fontWeight: statusFilter === option ? '600' : '400',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            backgroundColor: statusFilter === option ? '#ecfdf5' : 'transparent',
                            textAlign: 'left'
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </th>
              <th style={{ background: '#629af1', color: 'white', textAlign: 'center', borderRadius: '0' }}>Action</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: '#f7f9fa' }}>
            {assignedRoles.manager && (
              <ManagerTasks
                embedded={true}
                searchTerm=""
                statusFilter={statusFilter}
                refreshTrigger={refreshTrigger}
                onActionComplete={handleRefresh}
                onDataLoaded={handleManagerData}
              />
            )}
            {assignedRoles.hr && (
              <HrTasks
                embedded={true}
                searchTerm=""
                statusFilter={statusFilter}
                refreshTrigger={refreshTrigger}
                onActionComplete={handleRefresh}
                onDataLoaded={handleHrData}
              />
            )}
            {isDataReady && totalCount === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!assignedRoles.manager && !assignedRoles.hr && (
          <p style={{ padding: '20px', textAlign: 'center' }}>No leave tasks assigned.</p>
        )}
      </div>
    </div>
  );
}

export default MyTasks;