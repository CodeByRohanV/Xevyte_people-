import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import api from "../api";
import "./Grievance.css";
import { FiAlertCircle, FiShield, FiFileText, FiSearch } from "react-icons/fi";
import GrievanceFormPage from "./GrievanceFormPage";
import AdminDashboard from "./AdminDashboard";

const Grievance = () => {
  const [activeTab, setActiveTab] = useState("raise");
  const [isAdmin, setIsAdmin] = useState(false);
  const rawEmp = sessionStorage.getItem("employeeId");
  const employeeId = rawEmp ? rawEmp.trim().toUpperCase() : null;

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!employeeId) return;

      const token = sessionStorage.getItem("token");

      try {
        const resp = await api.get(
          `/v1/admin-access/check?roleName=ADMIN&employeeId=${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsAdmin(resp.data === true);
      } catch (err) {
        console.error("Error checking admin access:", err);
        setIsAdmin(false);
      }
    };

    checkAdminAccess();
  }, [employeeId]);

  const tabItems = [
    { id: "raise", label: "Raise Grievance" },
    ...(isAdmin ? [{ id: "admin", label: "Admin Dashboard" }] : [])
  ];

  return (
    <Sidebar>
      <div className="grievance-wrapper">
        <div className="grievance-content-wrapper">
          <div className="module-header">
            <h2>Grievance Hub</h2>
            <p>Secure & Anonymous Grievance Portal</p>
          </div>

          <div className="grievance-tabs-container">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`grievance-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grievance-tab-content">
            {activeTab === "raise" && <GrievanceFormPage />}
            {activeTab === "admin" && <AdminDashboard />}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default Grievance;

