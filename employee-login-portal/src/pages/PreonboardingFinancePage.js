import React, { useState, useEffect } from "react";
import ViewPreOnboarding from "./ViewPreOnboarding";
import { FiCheck, FiX, FiSearch, FiFileText } from "react-icons/fi";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_URL = `${API_BASE_URL}/v1/applicants`;
const PREONBOARDING_API = `${API_BASE_URL}/v1/applicants`;

const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

// --- Theme Colors ---
const COLORS = {
  primary: '#00B3A4',
  primaryLight: '#33c2b6',
  primaryDark: '#008f83',
  bgGradient: '#00B3A4',
  borderTeal: '#99f6e4',
  bgTealLight: '#f0fdfd',
  shadowTeal: 'rgba(94, 234, 212, 0.3)',
  text: '#1F2937',
};

export default function PreonboardingFinancePage({ searchTerm = "" }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreForm, setShowPreForm] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const filtered = data
        .map((a) => ({
          applicantId: a.applicantId,
          client: a.client ?? a.clientName ?? a.client_name ?? "-",
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email,
          position: a.position,
          status: a.status,
          fixedCtc: a.fixedCtc,
          approvedLocation: a.approvedLocation,
          approvedDoj: a.approvedDoj,
          variablePay: a.variablePay ?? a.variable_pay ?? "-",
        }))
        .filter((a) => a.status === "CTC Approval In Progress");
      setApplicants(filtered);
    } catch (err) {
      console.error(err);
      setError("Failed to load applicants.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRejectClick = async (applicantId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      alert("Reason is required to reject.");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${PREONBOARDING_API}/revision-pending/${applicantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason })
      });
      alert("Rejection request sent successfully.");
      fetchData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleFinanceApprove = async (applicantId) => {
    if (!window.confirm("Are you sure you want to approve this applicant?")) return;
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${PREONBOARDING_API}/approve-finance/${applicantId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert("Applicant approved by Finance");
      fetchData();
    } catch (err) {
      alert("Finance approval failed");
    }
  };

  const filteredApplicants = applicants.filter(a =>
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.applicantId.toString().includes(searchTerm)
  );

  return (
    <div style={{ padding: '0px', background: 'transparent', boxShadow: 'none' }}>

      {loading && <p style={{ color: COLORS.text, fontSize: '15px' }}>Loading applicants...</p>}
      {error && <p style={{ color: "red", fontSize: '15px' }}>{error}</p>}

      <div style={{ overflowX: 'auto' }}>
        <table className="preonboarding-table" style={{ width: "100%", borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>ID</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>CTC</th>
              <th style={thStyle}>Variable</th>
              <th style={thStyle}>Location</th>
              <th style={{ ...thStyle, borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "40px", color: COLORS.text, borderRadius: '8px' }}>No applicants found.</td></tr>
            ) : (
              filteredApplicants.map((a) => (
                <tr key={a.applicantId}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>{getDisplayEmployeeId(a.applicantId)}</td>
                  <td style={tdStyle}>{a.client}</td>
                  <td style={tdStyle}>{a.firstName} {a.lastName}</td>
                  <td style={tdStyle}>₹{a.fixedCtc}</td>
                  <td style={tdStyle}>₹{a.variablePay}</td>
                  <td style={tdStyle}>{a.approvedLocation}</td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: "center" }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => handleFinanceApprove(a.applicantId)} style={approveBtnStyle} title="Approve">
                        <FiCheck size={18} />
                      </button>
                      <button onClick={() => handleRejectClick(a.applicantId)} style={rejectBtnStyle} title="Reject">
                        <FiX size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rejection modal removed and replaced with window.prompt */}
    </div>
  );
}

const thStyle = { background: '#629AF1', color: '#fff', padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '15px', textTransform: 'capitalize', letterSpacing: '0.5px' };
const tdStyle = { padding: '16px', background: '#ffffff', color: COLORS.text, fontSize: '15px', fontWeight: '500' };
const searchStyle = { padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '15px', color: COLORS.text, backgroundColor: '#F5F7FA' };
const approveBtnStyle = { display: 'inline-flex', justifyContent: 'center', alignItems: 'center', background: COLORS.bgGradient, color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', boxShadow: 'none' };
const rejectBtnStyle = { display: 'inline-flex', justifyContent: 'center', alignItems: 'center', background: '#ef4444', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', boxShadow: 'none' };
