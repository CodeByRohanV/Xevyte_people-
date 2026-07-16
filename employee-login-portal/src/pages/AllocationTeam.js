import React, { useEffect, useState } from "react";
import api from "../api";
import "./Allocation.css";
import { FiCheckCircle, FiClock, FiBriefcase, FiFilter } from 'react-icons/fi';

const AllocationTeam = () => {
  const managerId = sessionStorage.getItem("employeeId");
  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [clientList, setClientList] = useState([]);
  const [filter, setFilter] = useState("CURRENT");

  useEffect(() => {
    fetchTeamAllocations();
  }, []);


  const fetchTeamAllocations = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await api.get(`/allocations/manager/${managerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamAllocations(res.data);

      // ✅ Build unique client dropdown list
      const uniqueClients = [
        "ALL",
        ...new Set(res.data.map(item => item.clientName).filter(Boolean))
      ];
      setClientList(uniqueClients);

    } catch (error) {
      console.error("Error fetching team allocations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAllocations = teamAllocations
    .filter((a) => {
      if (filter === "ALL") return true;
      return a.allocationStatus === filter;
    })
    .filter((a) => selectedClient === "ALL" || a.clientName === selectedClient)
    .sort((a, b) => (filter === "CURRENT" ? new Date(a.endDate) - new Date(b.endDate) : 0));

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  if (loading) return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p style={{ marginTop: '1rem', color: '#1F6FEB', fontWeight: 'bold' }}>Loading team allocations...</p>
    </div>
  );

  return (
    <div className="allocation-team-container">
      <div className="allocation-filter-container" style={{ gap: '1rem', justifyContent: 'flex-start', alignItems: 'center' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          <FiFilter style={{ color: '#1F6FEB' }} />
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="allocation-input"
          >
            {clientList.map((client, index) => (
              <option key={index} value={client}>{client}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredAllocations.length === 0 ? (
        <div className="message-banner" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
          No team allocations found for selected filters.
        </div>
      ) : (
        <div className="allocation-table-wrapper scrollbar-hidden">
          <table className="allocation-main-table">
            <thead>
              <tr>
                <th>Employee Id</th>
                <th>Employee Name</th>
                <th>Client</th>
                <th>Project</th>
                <th>Start Date</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '600' }}>{getDisplayEmployeeId(a.employeeId)}</td>
                  <td style={{ fontWeight: '700' }}>{a.employeeFirstName ? `${a.employeeFirstName} ${a.employeeLastName}` : "-"}</td>
                  <td>{a.clientName || "-"}</td>
                  <td>{a.projectName || "-"}</td>
                  <td style={{ fontWeight: '600' }}>{formatDate(a.startDate)}</td>
                  <td style={{ fontWeight: '600' }}>{formatDate(a.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllocationTeam;
