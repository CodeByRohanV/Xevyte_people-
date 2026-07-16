import React, { useState, useEffect } from "react";
import api from "../api";
import { FiCheckCircle, FiFileText, FiAward, FiArrowRight, FiX } from "react-icons/fi";
import "./AcknowledgePoliciesOverlay.css";

function AcknowledgePoliciesOverlay({ policies, token, onComplete, onCancel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pages, setPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const [acknowledgedIds, setAcknowledgedIds] = useState([]);

  const currentPolicy = policies[currentIndex];
  const isLast = currentIndex === policies.length - 1;

  // Reset scroll and checkbox state on document changes
  useEffect(() => {
    setScrolledToBottom(false);
    setAgreed(false);
  }, [currentIndex]);

  // Load PDF pages converted to images dynamically
  useEffect(() => {
    if (!currentPolicy) return;

    setPdfLoading(true);
    setError("");
    setPages([]);

    api.get(`/handbook/pages/${currentPolicy.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.data && Array.isArray(res.data)) {
        setPages(res.data);
      } else {
        setError("Invalid document page content format returned.");
      }
    })
    .catch(err => {
      console.error("Failed to load PDF pages as images", err);
      setError("Failed to load document content. Please try again.");
    })
    .finally(() => {
      setPdfLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentPolicy]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if scrolled to within 25px of the bottom of the container
    if (scrollHeight - scrollTop - clientHeight < 25) {
      setScrolledToBottom(true);
    }
  };

  const handleNextOrSubmit = () => {
    if (!scrolledToBottom || (isLast && !agreed)) return;

    if (isLast) {
      setSubmitting(true);
      const allIds = [...acknowledgedIds, currentPolicy.id];

      // Submit all policy acknowledgments concurrently to backend on final complete
      Promise.all(
        allIds.map(id =>
          api.post(`/policies/acknowledge/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      )
      .then(() => {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 2200);
      })
      .catch(err => {
        console.error("Failed to acknowledge policy", err);
        alert("Failed to submit acknowledgment. Please try again.");
      })
      .finally(() => {
        setSubmitting(false);
      });
    } else {
      // Just record acknowledgment locally in-memory and proceed to next policy
      setAcknowledgedIds(prev => [...prev, currentPolicy.id]);
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (showSuccess) {
    return (
      <div className="ack-overlay-wrapper">
        <div className="ack-overlay-success-card">
          <div className="ack-success-icon-container">
            <FiAward className="ack-award-icon" />
          </div>
          <h2>Acknowledge Complete!</h2>
          <p>Thank you for reviewing the company policies. Accessing portal...</p>
          <div className="ack-loader-dots">
            <div className="ack-dot"></div>
            <div className="ack-dot"></div>
            <div className="ack-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / policies.length) * 100;

  return (
    <div className="ack-overlay-wrapper">
      <div className="ack-overlay-card">
        {/* Progress Bar */}
        <div className="ack-overlay-progress-track">
          <div className="ack-overlay-progress-bar" style={{ width: `${progressPercent}%` }}></div>
        </div>

        {/* Header */}
        <div className="ack-overlay-header">
          <div className="header-text">
            <h3>{currentPolicy ? currentPolicy.originalFileName : "Mandatory Policy Review"}</h3>
            <p>Document {currentIndex + 1} of {policies.length}</p>
          </div>
          {onCancel && (
            <button className="ack-overlay-close-btn" onClick={onCancel} title="Close / Review Later">
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="ack-overlay-body">
          {error && <div className="ack-overlay-error-bar">{error}</div>}

          {/* Scrollable Container with Converted PDF Pages */}
          <div className="ack-overlay-pdf-frame-container" onScroll={handleScroll}>
            {pdfLoading ? (
              <div className="ack-overlay-pdf-loader">
                <div className="spinner"></div>
                <p>Loading document pages...</p>
              </div>
            ) : pages.length > 0 ? (
              <div className="ack-pages-list">
                {pages.map((pageSrc, idx) => (
                  <img
                    key={idx}
                    src={pageSrc}
                    alt={`Page ${idx + 1}`}
                    className="ack-pdf-page-image"
                  />
                ))}
              </div>
            ) : (
              <div className="ack-overlay-pdf-error">
                <FiFileText className="error-icon" />
                <p>Unable to display preview. You can still read the title and acknowledge to proceed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ack-overlay-footer" style={{ minHeight: "80px", justifyContent: "space-between" }}>
          {scrolledToBottom && (
            <>
              {isLast ? (
                <div className="ack-agree-checkbox-container">
                  <label className="ack-checkbox-label" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="ack-checkbox-input"
                    />
                    <span className="ack-checkbox-custom"></span>
                    I have read and agree to all terms and conditions
                  </label>
                </div>
              ) : (
                <div className="ack-spacer"></div>
              )}

              <button
                onClick={handleNextOrSubmit}
                disabled={submitting || pdfLoading || (isLast && !agreed)}
                className="ack-overlay-next-btn"
              >
                {submitting ? (
                  <>
                    <div className="btn-spinner"></div> Submitting...
                  </>
                ) : isLast ? (
                  <>
                    Acknowledge & Complete <FiCheckCircle />
                  </>
                ) : (
                  <>
                    Next Document ({currentIndex + 2}/{policies.length}) <FiArrowRight />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AcknowledgePoliciesOverlay;
