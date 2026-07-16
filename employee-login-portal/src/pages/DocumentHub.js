import React, { useState } from 'react';
import Sidebar from './Sidebar';
import EmploymentDocs from './EmploymentDocs';

import './DocumentHub.css';
import { FiFolder, FiFileText, FiBriefcase } from 'react-icons/fi';

function DocumentHub() {
  const [activeTab, setActiveTab] = useState("Payslips");

  const tabItems = [
    { id: "Payslips", label: "Payslips" },
    { id: "Documents", label: "Employment Documents" }
  ];

  return (
    <Sidebar>
      <div className="document-hub-wrapper">
        <div className="document-hub-content-wrapper">
          <header className="document-hub-page-header">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h1 className="document-hub-header-title" style={{ margin: 0, padding: 0, marginLeft: '-1px' }}>Document Hub</h1>
              <p style={{ color: '#00b3a4', fontSize: '15px', margin: '5px 0 0 0', padding: 0 }}>
                Access and manage your payslips and employment documents
              </p>
            </div>
          </header>

          <div className="document-hub-tabs-container">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`document-hub-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="document-hub-card">
            {activeTab === "Payslips" && <EmploymentDocs viewType="Payslips" />}
            {activeTab === "Documents" && <EmploymentDocs viewType="Documents" />}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default DocumentHub;