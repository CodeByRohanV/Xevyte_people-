import React, { useState } from "react";
import api from "../api";
import Sidebar from "./Sidebar";
import { FiDollarSign, FiPlusCircle, FiCheckCircle } from "react-icons/fi";
import "./Payslips.css";

export default function GeneratePayslips() {
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!month) {
      setStatus("Please select a month (YYYY-MM)");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await api.post(
        `/payslips/generate?month=${encodeURIComponent(month)}`
      );
      setStatus(res.data);
    } catch (err) {
      setStatus(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar>
      <div className="payslips-main-container">
        <div className="payslips-content-wrapper">
          <div className="payslips-page-header">
            <div className="payslips-header-icon">
              <FiDollarSign />
            </div>
            <h1 className="payslips-header-title">Generate Payroll</h1>
          </div>

          <div className="payslip-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#115e59' }}>Batch Process Payslips</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Select a month to generate payslips for all active employees. This process will calculate earnings and deductions based on current policy rules.
            </p>

            <div className="payslip-form-group">
              <label className="payslip-form-label">Billing Month (YYYY-MM)</label>
              <input
                placeholder="e.g. 2025-11"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="payslip-input-field"
              />
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={generate}
                className="payslip-btn payslip-btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? "Processing..." : <><FiPlusCircle /> Generate All Payslips</>}
              </button>
            </div>

            {status && (
              <div
                className={`message-banner ${status.toLowerCase().includes('success') ? 'message-success' : ''}`}
                style={{ marginTop: '2rem', marginBottom: 0 }}
              >
                <FiCheckCircle /> {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
