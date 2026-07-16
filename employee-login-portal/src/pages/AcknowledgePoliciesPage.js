import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { FiCheckCircle, FiClock, FiFileText, FiAward, FiArrowRight } from "react-icons/fi";
import scalozLogo from "../assets/Scaloz.png";
import "./AcknowledgePoliciesPage.css";

function AcknowledgePoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const tenantName = sessionStorage.getItem("tenantName") || "Scaloz";

  // Fetch pending policies on load
  const fetchPendingPolicies = () => {
    setLoading(true);
    api.get("/policies/pending", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.data && Array.isArray(res.data)) {
        setPolicies(res.data);
        if (res.data.length > 0) {
          setSelectedPolicy(res.data[0]);
        } else {
          // If no pending policies, mark as completed and redirect
          sessionStorage.setItem("policies_acknowledged", "true");
          setShowSuccess(true);
          setTimeout(() => {
            navigate("/Home");
          }, 2000);
        }
      }
    })
    .catch(err => {
      console.error("Failed to load pending policies", err);
      setError("Unable to load policy documents. Please try again later.");
    })
    .finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchPendingPolicies();
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, []);

  // Fetch and convert PDF data to Blob URL whenever selected policy changes
  useEffect(() => {
    if (!selectedPolicy) {
      setPdfUrl(null);
      return;
    }

    setPdfLoading(true);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    api.get(`/handbook/file/${selectedPolicy.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob"
    })
    .then(res => {
      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      setPdfUrl(fileURL);
    })
    .catch(err => {
      console.error("Failed to fetch PDF document data", err);
      setError("Failed to render the document. You can still acknowledge or retry.");
    })
    .finally(() => {
      setPdfLoading(false);
    });
  }, [selectedPolicy]);

  const handleAcknowledge = (policyId) => {
    if (!policyId) return;
    setAcknowledging(true);

    api.post(`/policies/acknowledge/${policyId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      // Remove the acknowledged policy from local state
      const updatedPolicies = policies.filter(p => p.id !== policyId);
      setPolicies(updatedPolicies);

      if (updatedPolicies.length > 0) {
        // Automatically select the next policy in the list
        setSelectedPolicy(updatedPolicies[0]);
      } else {
        // All policies acknowledged
        sessionStorage.setItem("policies_acknowledged", "true");
        setShowSuccess(true);
        setSelectedPolicy(null);
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        setTimeout(() => {
          navigate("/Home");
        }, 2200);
      }
    })
    .catch(err => {
      console.error("Error acknowledging policy", err);
      alert("Acknowledgment submission failed. Please try again.");
    })
    .finally(() => {
      setAcknowledging(false);
    });
  };

  if (loading) {
    return (
      <div className="policies-page-loading">
        <div className="spinner"></div>
        <p>Loading mandatory policies...</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="success-overlay">
        <div className="success-card">
          <div className="success-icon-wrapper">
            <FiAward className="success-award-icon" />
          </div>
          <h2>Verification Complete!</h2>
          <p>All company policies have been acknowledged. Redirecting you to the portal...</p>
          <div className="dots-container">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ack-policies-container">
      {/* Sidebar List Panel */}
      <div className="ack-sidebar">
        <div className="ack-sidebar-header">
          <img src={scalozLogo} alt="Scaloz Logo" className="ack-logo" />
          <h2>Mandatory Policy Review</h2>
          <p>Before proceeding, please review and acknowledge the policies for <strong>{tenantName}</strong>.</p>
        </div>

        {error && <div className="ack-error-banner">{error}</div>}

        <div className="ack-policies-list">
          <h4 className="list-title">Pending Documents ({policies.length})</h4>
          {policies.map(p => {
            const isSelected = selectedPolicy && selectedPolicy.id === p.id;
            return (
              <div
                key={p.id}
                className={`ack-policy-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPolicy(p)}
              >
                <div className="card-icon-container">
                  <FiFileText className="doc-icon" />
                </div>
                <div className="card-details">
                  <h5>{p.originalFileName}</h5>
                  <div className="card-meta">
                    <span className="meta-badge">{p.category || "General"}</span>
                    <span className="meta-time"><FiClock /> {new Date(p.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedPolicy && (
          <div className="ack-action-panel">
            <p className="panel-instruction">
              By clicking acknowledge, you confirm that you have read, understood, and agreed to the terms outlined in this document.
            </p>
            <button
              onClick={() => handleAcknowledge(selectedPolicy.id)}
              disabled={acknowledging || pdfLoading}
              className="ack-confirm-btn"
            >
              {acknowledging ? (
                <>
                  <div className="btn-spinner"></div> Recording...
                </>
              ) : (
                <>
                  Acknowledge & Complete <FiArrowRight />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main View/Preview Panel */}
      <div className="ack-main-view">
        {selectedPolicy ? (
          <div className="pdf-viewer-wrapper">
            <div className="pdf-viewer-header">
              <div className="header-info">
                <h3>{selectedPolicy.originalFileName}</h3>
                <span className="policy-badge">{selectedPolicy.category || "General"}</span>
              </div>
            </div>
            <div className="pdf-iframe-container">
              {pdfLoading ? (
                <div className="pdf-loading-state">
                  <div className="spinner"></div>
                  <p>Streaming policy content securely...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  title="Policy Document PDF"
                  className="pdf-iframe"
                />
              ) : (
                <div className="pdf-error-state">
                  <FiCheckCircle className="error-icon" />
                  <p>Document content unavailable. You can still complete acknowledgment via the sidebar.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-selection-state">
            <FiCheckCircle className="welcome-check" />
            <h3>All Caught Up!</h3>
            <p>Select a document on the left sidebar to start reviewing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AcknowledgePoliciesPage;
