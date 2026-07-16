import React, { useEffect, useState } from "react";
import api from "../api";
import "./Allocation.css";
import { FiCheckCircle, FiClock, FiBriefcase, FiFilter } from 'react-icons/fi';

const AllocationMy = () => {
  const employeeId = sessionStorage.getItem("employeeId");
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("CURRENT");

// Helper function defined inside or imported
  const getToken = () => sessionStorage.getItem("token"); 

  useEffect(() => {
    const fetchData = async () => {
      // 1. Check if employeeId exists
      if (!employeeId) {
        setError("Employee ID not found in session.");
        setLoading(false);
        return;
      }

      try {
        const token = getToken();
        if (!token) {
          setError("Authentication token missing.");
          setLoading(false);
          return;
        }

        const res = await api.get(`/allocations/employee/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` }, // Standard practice to add 'Bearer '
        });

        setAllocations(res.data);
      } catch (err) {
        console.error("Error fetching allocations:", err);
        setError(`Failed to load allocations. (${err.response?.statusText || err.message})`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  const filteredAllocations = allocations.filter((a) => {
    if (filter === "ALL") return true;
    return a.allocationStatus === filter;
  });

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  return (
    <div className="allocation-my-container">
      <div className="allocation-filter-container" style={{ justifyContent: 'flex-start' }}>
        <div className="allocation-status-filters" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingBottom: 0 }}>
          {/* Current Toggle */}
          <div 
            className={`allocation-toggle-item ${filter === "CURRENT" ? "active" : ""}`}
            onClick={() => setFilter("CURRENT")}
          >
            <div className="allocation-toggle-switch"></div>
            <span className="allocation-toggle-label">
              <FiBriefcase style={{ color: filter === "CURRENT" ? "#1F6FEB" : "#64748b" }} /> Current
            </span>
          </div>

          {/* Future Toggle */}
          <div 
            className={`allocation-toggle-item ${filter === "NEXT" ? "active" : ""}`}
            onClick={() => setFilter("NEXT")}
          >
            <div className="allocation-toggle-switch"></div>
            <span className="allocation-toggle-label">
              <FiClock style={{ color: filter === "NEXT" ? "#1F6FEB" : "#64748b" }} /> Future
            </span>
          </div>

          {/* Past Toggle */}
          <div 
            className={`allocation-toggle-item ${filter === "PAST" ? "active" : ""}`}
            onClick={() => setFilter("PAST")}
          >
            <div className="allocation-toggle-switch"></div>
            <span className="allocation-toggle-label">
              <FiCheckCircle style={{ color: filter === "PAST" ? "#1F6FEB" : "#64748b" }} /> Past
            </span>
          </div>
        </div>
      </div>

      {loading && <div className="loading-spinner-container"><div className="loading-spinner"></div><p style={{ marginTop: '1rem', color: '#1F6FEB', fontWeight: 'bold' }}>Loading allocations...</p></div>}

      {error && <div className="message-banner" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid currentColor' }}>{error}</div>}

      {!loading && !error && filteredAllocations.length === 0 && (
        <div className="message-banner" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
          No allocations match the selected filters.
        </div>
      )}

      {!loading && !error && filteredAllocations.length > 0 && (
        <div className="allocation-table-wrapper scrollbar-hidden">
          <table className="allocation-main-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Project</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Manager</th>
                <th>Manager Name</th>
                <th>HR</th>
                <th>HR Name</th>
                <th>Reviewer</th>
                <th>Reviewer Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((a, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '700' }}>{a.customerName || "-"}</td>
                  <td>{a.projectName || "-"}</td>
                  <td style={{ fontWeight: '600' }}>{formatDate(a.startDate)}</td>
                  <td style={{ fontWeight: '600' }}>{formatDate(a.endDate)}</td>
                  <td>{getDisplayEmployeeId(a.managerId) || "-"}</td>
                  <td style={{ fontWeight: '500' }}>{a.managerFirstName ? `${a.managerFirstName} ${a.managerLastName}` : "-"}</td>
                  <td>{getDisplayEmployeeId(a.hrId) || "-"}</td>
                  <td style={{ fontWeight: '500' }}>{a.hrFirstName ? `${a.hrFirstName} ${a.hrLastName}` : "-"}</td>
                  <td>{getDisplayEmployeeId(a.reviewerId) || "-"}</td>
                  <td style={{ fontWeight: '500' }}>{a.reviewerFirstName ? `${a.reviewerFirstName} ${a.reviewerLastName}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllocationMy;