import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../api';
import './OrgChart.css';

// Recursive Org Tree Node Component
const OrgTreeNode = ({
  node,
  getInitials,
  getAvatarGradient,
  getDisplayEmployeeId,
  loggedInEmployeeId,
  onCardClick
}) => {
  const hasChildren = node.subordinates && node.subordinates.length > 0;
  const isLoggedInUser = node.employeeId === loggedInEmployeeId;

  return (
    <div className="org-tree-node">
      <div className={`org-card-wrapper ${hasChildren ? 'has-line-down' : 'leaf'}`}>
        <div className={`org-card ${isLoggedInUser ? 'is-logged-in' : ''}`} onClick={() => onCardClick(node)}>
          {isLoggedInUser && (
            <span className="logged-in-badge">You</span>
          )}
          <div className="avatar-container" style={{ background: node.profilePic ? 'none' : getAvatarGradient(node.name) }}>
            {node.profilePic ? (
              <img src={node.profilePic} alt={node.name} className="avatar-img" />
            ) : (
              <span className="avatar-initials">{getInitials(node.name)}</span>
            )}
          </div>
          <div className="card-info">
            <h4 className="node-name" title={node.name}>{node.name}</h4>
            <span className="node-designation" title={node.designation}>{node.designation}</span>
          </div>
        </div>

        {/* ONE chevron per parent, placed right below its card — not on each child */}
        {hasChildren && (
          <div className="line-connector-arrow parent-chevron">
            <i className="bi bi-chevron-up"></i>
          </div>
        )}
      </div>

      {hasChildren && (
        <div className="org-children-container">
          {node.subordinates.map(sub => (
            <OrgTreeNode
              key={sub.employeeId}
              node={sub}
              getInitials={getInitials}
              getAvatarGradient={getAvatarGradient}
              getDisplayEmployeeId={getDisplayEmployeeId}
              loggedInEmployeeId={loggedInEmployeeId}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Org Chart Page
function OrgChart() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [allowedColumns, setAllowedColumns] = useState([]);

  const navigate = useNavigate();
  const loggedInEmployeeId = sessionStorage.getItem("employeeId");

  useEffect(() => {
    if (loggedInEmployeeId) {
      loadConfigAndOrgChart();
    } else {
      setError('Logged-in employee session not found. Please re-login.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInEmployeeId]);

  const loadConfigAndOrgChart = async () => {
    setLoading(true);
    try {
      // 1. Fetch allowed columns
      const configRes = await api.get("/org-chart-config/columns");
      setAllowedColumns(configRes.data || []);

      // 2. Fetch org chart tree
      const treeRes = await api.get(`/organization-overview/${loggedInEmployeeId}`);
      setTreeData(treeRes.data);
      setError('');
    } catch (err) {
      console.error('Error fetching org chart configuration or hierarchy:', err);
      setError('Failed to fetch the organization chart hierarchy.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgChart = () => {
    loadConfigAndOrgChart();
  };

  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name.trim().charAt(0).toUpperCase();
  };

  const getAvatarGradient = (name) => {
    const hash = [...(name || "")].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
      "linear-gradient(135deg, #4E65FF 0%, #92EFFD 100%)",
      "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
      "linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)",
      "linear-gradient(135deg, #F9D423 0%, #FF4E50 100%)"
    ];
    return gradients[hash % gradients.length];
  };

  const handleCardClick = (employeeNode) => {
    setSelectedEmployee(employeeNode);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleFitView = () => setZoom(100);
  const handleZoomReset = (e) => setZoom(parseInt(e.target.value) || 100);
  const handlePrint = () => window.print();

  // Helper to count active nodes in the tree
  const countNodes = (rootNode) => {
    if (!rootNode) return 0;
    let count = 0;
    const traverse = (node) => {
      count++;
      if (node.subordinates) {
        node.subordinates.forEach(sub => traverse(sub));
      }
    };
    traverse(rootNode);
    return count;
  };

  // Helper to calculate total levels (depth) of the tree
  const getTreeDepth = (rootNode) => {
    if (!rootNode) return 0;
    if (!rootNode.subordinates || rootNode.subordinates.length === 0) return 1;
    return 1 + Math.max(...rootNode.subordinates.map(getTreeDepth));
  };

  // Helper to recursively locate logged in user node in the tree structure
  const findNodeById = (node, id) => {
    if (!node) return null;
    if (node.employeeId === id) return node;
    if (node.subordinates) {
      for (let sub of node.subordinates) {
        const found = findNodeById(sub, id);
        if (found) return found;
      }
    }
    return null;
  };

  const isThreeColumns = allowedColumns.length > 10;

  const containerStyle = {
    padding: '24px',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Inter, sans-serif'
  };

  // Profile modal rendering items based on allowedColumns config
  const renderDetailField = (colKey, label, iconClass, value, isEmail = false) => {
    if (!allowedColumns.includes(colKey)) return null;
    return (
      <div className="detail-field" key={colKey}>
        <div className="field-icon"><i className={`bi ${iconClass}`}></i></div>
        <div className="field-content">
          <label>{label}</label>
          {isEmail ? (
            <span className="email-link">{value || 'N/A'}</span>
          ) : (
            <span>{value || 'N/A'}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Sidebar>
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'normal', color: '#1f2937', margin: 0, fontFamily: "'Inter', sans-serif", textAlign: 'left' }}>
            Organization Chart
          </h1>
          <p style={{ margin: 0, color: '#00B3A4', fontSize: '15px', fontWeight: 'normal', fontFamily: "'Inter', sans-serif" }}>
            View company hierarchy and reporting relationships
          </p>
        </div>



        {/* Loading / Error states */}
        {loading ? (
          <div className="org-status-box">
            <div className="spinner"></div>
            <p>Loading organisation structure...</p>
          </div>
        ) : error ? (
          <div className="org-status-box error">
            <i className="bi bi-exclamation-triangle-fill error-icon"></i>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchOrgChart}>Retry</button>
          </div>
        ) : !treeData ? (
          <div className="org-status-box empty">
            <i className="bi bi-people-fill empty-icon"></i>
            <p>No reporting hierarchy found for your employee ID.</p>
          </div>
        ) : (
          <div className="org-chart-main-layout">
            <div className="org-chart-tree-area full-width-tree">
              <div className="org-chart-scrollable">
                <div
                  className="org-tree-root-container zoom-transition"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                  <OrgTreeNode
                    node={treeData}
                    getInitials={getInitials}
                    getAvatarGradient={getAvatarGradient}
                    getDisplayEmployeeId={getDisplayEmployeeId}
                    loggedInEmployeeId={loggedInEmployeeId}
                    onCardClick={handleCardClick}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Modal for Employee Details */}
        {selectedEmployee && (
          <div className="org-modal-overlay" onClick={() => setSelectedEmployee(null)}>
            <div className={`org-modal-content ${isThreeColumns ? 'layout-3col' : 'layout-2col'}`} onClick={(e) => e.stopPropagation()}>

              {/* Gradient header band with avatar */}
              <div className="org-modal-header">
                <button className="org-modal-close" onClick={() => setSelectedEmployee(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
                <div className="modal-avatar" style={{ background: selectedEmployee.profilePic ? 'none' : getAvatarGradient(selectedEmployee.name) }}>
                  {selectedEmployee.profilePic ? (
                    <img src={selectedEmployee.profilePic} alt={selectedEmployee.name} className="modal-avatar-img" />
                  ) : (
                    <span>{getInitials(selectedEmployee.name)}</span>
                  )}
                </div>
                <h3 className="modal-name">{selectedEmployee.name}</h3>
                <span className="modal-role-badge">{selectedEmployee.designation}</span>
              </div>

              {/* Fields grid - Render only dynamically configured columns */}
              <div className="org-modal-body">
                {renderDetailField("employeeId", "Employee ID", "bi-person-badge", getDisplayEmployeeId(selectedEmployee.employeeId))}
                {renderDetailField("designation", "Designation", "bi-briefcase", selectedEmployee.designation)}
                {renderDetailField("joiningDate", "Joining Date", "bi-calendar-check", selectedEmployee.joiningDate)}

                {renderDetailField("personalMail", "Personal Email", "bi-envelope-at", selectedEmployee.personalMail)}
                {renderDetailField("email", "Work Email", "bi-envelope", selectedEmployee.email, true)}
                {renderDetailField("contactNo", "Contact Number", "bi-telephone", selectedEmployee.contactNo)}
                {renderDetailField("emergencyContactNumber", "Emergency Contact No", "bi-telephone-fill", selectedEmployee.emergencyContactNumber)}
                {renderDetailField("workLocation", "Work Location", "bi-geo-alt", selectedEmployee.workLocation)}

                {renderDetailField("aadharNo", "Aadhar Number", "bi-file-person", selectedEmployee.aadharNo)}
                {renderDetailField("panNo", "PAN Number", "bi-credit-card-2-front", selectedEmployee.panNo)}
                {renderDetailField("address", "Permanent Address", "bi-house", selectedEmployee.address)}
                {renderDetailField("presentAddress", "Present Address", "bi-house-door", selectedEmployee.presentAddress)}

                {renderDetailField("gender", "Gender", "bi-gender-ambiguous", selectedEmployee.gender)}
                {renderDetailField("dateOfBirth", "Date of Birth", "bi-calendar-event", selectedEmployee.dateOfBirth)}
                {renderDetailField("bloodGroup", "Blood Group", "bi-droplet", selectedEmployee.bloodGroup)}
                {renderDetailField("noticePeriod", "Notice Period", "bi-hourglass-split", selectedEmployee.noticePeriod)}

                {/* Statutory */}
                {renderDetailField("uanNumber", "UAN Number", "bi-hash", selectedEmployee.uanNumber)}
                {renderDetailField("pfMemberId", "PF Member ID", "bi-hash", selectedEmployee.pfMemberId)}
                {renderDetailField("esiNumber", "ESI Number", "bi-hash", selectedEmployee.esiNumber)}
                {renderDetailField("esiDispensary", "ESI Dispensary", "bi-hospital", selectedEmployee.esiDispensary)}
              </div>


            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default OrgChart;
