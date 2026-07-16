import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import api from "../api";
import "./Allocation.css";
import { FiLayers, FiUser, FiUsers } from 'react-icons/fi';
 
import AllocationMy from "./AllocationMy";
import AllocationTeam from "./AllocationTeam";
 
const Allocation = () => {
  const [activeTab, setActiveTab] = useState("myAllocations");
  const [isManager, setIsManager] = useState(false);
  const employeeId = sessionStorage.getItem("employeeId");
 useEffect(() => {
    const fetchManagerAccess = async () => {
      if (!employeeId) return;

      try {
        let rawToken = sessionStorage.getItem("token");
        if (!rawToken) return;

        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;

        const response = await api.get(`/access/assigned-ids/${employeeId}`, {
          headers: { Authorization: token },
        });

        setIsManager(response.data.manager === true);
      } catch (err) {
        console.error("Error checking manager access:", err);
        setIsManager(false);
      }
    };

    fetchManagerAccess();
  }, [employeeId]);

 
  const tabItems = [
    { id: "myAllocations", label: "My Allocations" },
    ...(isManager ? [{ id: "teamAllocations", label: "Team Allocations" }] : []),
  ];
 
  return (
    <Sidebar>
      <div className="allocation-wrapper">
        <div className="allocation-content-wrapper">
          <header className="allocation-page-header">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h1 className="allocation-header-title" style={{ margin: 0, padding: 0, marginLeft: '-1px' }}>Project Allocations</h1>
              <p style={{ color: '#00b3a4', fontSize: '15px', margin: '5px 0 0 0', padding: 0 }}>
                View and manage your project assignments
              </p>
            </div>
          </header>
 
          <div className="allocation-tabs-container">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                className={`allocation-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
 
          <div className="allocation-card">
            {activeTab === "myAllocations" && <AllocationMy />}
            {activeTab === "teamAllocations" && isManager && <AllocationTeam />}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};
 
export default Allocation;
 
 