import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import api from "../api";
import HRViewPreOnboardingDetails from "./HRViewPreOnboardingDetails.js";
import { FiFileText, FiUpload, FiSend, FiCheck, FiX, FiClock, FiDownload, FiSearch } from "react-icons/fi";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_URL = `${API_BASE_URL}/v1/applicants`;
const DOC_API = `${API_BASE_URL}/v1/documents/templates`;
const UPLOAD_API = `${API_BASE_URL}/v1/applicants/upload/`;

const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    console.error("Failed to decode token", e);
    return null;
  }
};

// --- Theme Colors ---
const COLORS = {
  primary: '#00B3A4',
  primaryLight: '#33c2b6',
  primaryDark: '#008f83',
  bgGradient: '#00B3A4',
  borderTeal: '#00B3A4',
  bgTealLight: '#f0fdfd',
  shadowTeal: 'rgba(94, 234, 212, 0.3)',
  text: '#1F2937',
};

export default function FinanceApprovedList({ searchTerm = "" }) {
  const [approvedList, setApprovedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPhase, setCurrentPhase] = useState("OFFER"); // "OFFER" or "APPOINTMENT"
  const [docTemplates, setDocTemplates] = useState([]);
  const [calculationTemplates, setCalculationTemplates] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [selectedCalcTemplate, setSelectedCalcTemplate] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState("");

  const token = sessionStorage.getItem("token");
  const claims = decodeToken(token);
  const assignedProducts = Array.isArray(claims?.apps)
    ? claims.apps
    : (claims?.apps ? [claims.apps] : []);
  const hasEsignAccess = assignedProducts.some(p => typeof p === 'string' && (p.toUpperCase() === "SIGN0001" || p.toUpperCase() === "ESIGN" || p.toUpperCase() === "ESIGN0001"));
  const [generatedLinks, setGeneratedLinks] = useState({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreForm, setShowPreForm] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadApplicantId, setUploadApplicantId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({ offerLetter: null, appointmentLetter: null, document3: null });
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(null); // null, 'email', or 'esign'

  const objectUrlsRef = useRef([]);

  const fetchApproved = async () => {
    try {
      setLoading(true);
      setError("");
      const token = sessionStorage.getItem("token");
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const filtered = data
        .filter(a => ["Offer Generation In Progress", "Offer Released", "Offer Accepted", "Appointment Released", "Accepted", "Declined"].includes(a.status))
        .map(a => ({
          ...a,
          client: a.client ?? a.client_name ?? "-",
          variablePay: a.variablePay ?? a.variable_pay ?? a.variable_Pay ?? "-",
        }));
      setApprovedList(filtered);
    } catch (err) { setError("Failed to load applicants."); }
    setLoading(false);
  };

  const fetchTemplates = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(DOC_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDocTemplates(data);
    } catch (err) { console.error("Error fetching templates:", err); }
  };

  const fetchCalculationTemplates = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/v1/calculations/structures?status=ACTIVE`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCalculationTemplates(data.content || []);
    } catch (err) { console.error("Error fetching calculation templates:", err); }
  };

  useEffect(() => {
    fetchApproved();
    fetchTemplates();
    fetchCalculationTemplates();
    return () => {
      objectUrlsRef.current.forEach((u) => { try { window.URL.revokeObjectURL(u); } catch (e) { } });
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const handleProceed = (applicantId, status) => {
    setGeneratedLinks({});   // Reset OLD FILES
    setSelectedApplicant(applicantId);
    setSelectedCalcTemplate(null);
    setSelectedOffer("");
    setSelectedAppointment("");
    setShowTemplateModal(true);
    setShowSendOptions(false);
    if (status === "Offer Accepted") {
      setCurrentPhase("APPOINTMENT");
    } else {
      setCurrentPhase("OFFER");
    }
  };

  const handleDeclineClick = async (applicantId) => {
    // 1. Safety Check: Always confirm before performing a destructive action
    if (!window.confirm("Are you sure you want to decline this offer? This action cannot be undone.")) {
      return;
    }

    try {
      // 2. API Call: Update status to 'Declined'
      // Ensure your backend @PutMapping handles the status string correctly
      const token = sessionStorage.getItem("token");
      await fetch(`${API_URL}/status/${applicantId}?status=Declined`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 3. Refresh the List: Fetch data again to update the UI
      await fetchApproved();

      // 4. Feedback: Notify the user
      alert("✅ Offer marked as Declined.");
    } catch (err) {
      console.error("Decline error:", err);
      alert("❌ Failed to decline offer: " + (err.response?.data?.message || err.message));
    }
  };
  const handleGenerateFiles = async () => {
    if (currentPhase === "OFFER" && !selectedCalcTemplate) return alert("Please select a CTC template.");
    if (currentPhase === "OFFER" && !selectedOffer) return alert("Please select Offer letter template.");
    if (currentPhase === "APPOINTMENT" && !selectedAppointment) return alert("Please select Appointment letter template.");
    try {
      setGenerating(true);
      const token = sessionStorage.getItem("token");

      let offerUrl = null;
      let appointUrl = null;

      if (currentPhase === "OFFER") {
        // Generate Offer Letter PDF with calculation template
        const offerApiUrl = selectedCalcTemplate
          ? `${API_BASE_URL}/v1/letters/offer/pdf/${selectedApplicant}/${encodeURIComponent(selectedOffer)}?calcTemplateId=${selectedCalcTemplate}`
          : `${API_BASE_URL}/v1/letters/offer/pdf/${selectedApplicant}/${encodeURIComponent(selectedOffer)}`;
        const offerRes = await fetch(offerApiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!offerRes.ok) {
          const errText = await offerRes.text();
          throw new Error(`Offer letter generation failed (${offerRes.status}): ${errText}`);
        }
        const offerBlob = await offerRes.blob();
        offerUrl = window.URL.createObjectURL(offerBlob);
        objectUrlsRef.current.push(offerUrl);
      } else {
        // Generate Appointment Letter PDF
        const appointApiUrl = selectedCalcTemplate
          ? `${API_BASE_URL}/v1/letters/appointment/pdf/${selectedApplicant}/${encodeURIComponent(selectedAppointment)}?calcTemplateId=${selectedCalcTemplate}`
          : `${API_BASE_URL}/v1/letters/appointment/pdf/${selectedApplicant}/${encodeURIComponent(selectedAppointment)}`;
        const appointRes = await fetch(appointApiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!appointRes.ok) {
          const errText = await appointRes.text();
          throw new Error(`Appointment letter generation failed (${appointRes.status}): ${errText}`);
        }
        const appointBlob = await appointRes.blob();
        appointUrl = window.URL.createObjectURL(appointBlob);
        objectUrlsRef.current.push(appointUrl);
      }

      setGeneratedLinks(prev => ({
        ...prev, [selectedApplicant]: {
          offer: offerUrl ? { url: offerUrl, name: `OfferLetter_${selectedApplicant}.pdf` } : null,
          appointment: appointUrl ? { url: appointUrl, name: `AppointmentLetter_${selectedApplicant}.pdf` } : null,
          offerTemplate: selectedOffer,
          appointmentTemplate: selectedAppointment,
        }
      }));
      alert("✅ File generated successfully!");
    } catch (err) {
      console.error("Generate letter error:", err);
      alert("❌ Failed to generate letter: " + (err.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (applicantId) => {
    const entry = generatedLinks[applicantId];
    if (!entry) return alert("Generate files first.");
    setSending('email');
    try {
      const token = sessionStorage.getItem("token");
      let sendUrl;
      if (currentPhase === "OFFER") {
        sendUrl = selectedCalcTemplate
          ? `${API_BASE_URL}/v1/letters/sendOffer/pdf/${applicantId}/${encodeURIComponent(entry.offerTemplate)}?calcTemplateId=${selectedCalcTemplate}`
          : `${API_BASE_URL}/v1/letters/sendOffer/pdf/${applicantId}/${encodeURIComponent(entry.offerTemplate)}`;
      } else {
        sendUrl = selectedCalcTemplate
          ? `${API_BASE_URL}/v1/letters/sendAppointment/pdf/${applicantId}/${encodeURIComponent(entry.appointmentTemplate)}?calcTemplateId=${selectedCalcTemplate}`
          : `${API_BASE_URL}/v1/letters/sendAppointment/pdf/${applicantId}/${encodeURIComponent(entry.appointmentTemplate)}`;
      }
      await fetch(sendUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchApproved();
      setShowTemplateModal(false);
      setSelectedApplicant(null);
      setShowSendOptions(false);
      alert("📨 Letter emailed successfully!");
    } catch (err) {
      alert("❌ Failed to send letter.");
    } finally {
      setSending(null);
    }
  };

  const handleSendEsign = async (applicantId) => {
    const entry = generatedLinks[applicantId];
    if (!entry) return alert("Generate files first.");
    setSending('esign');

    // Open a blank window/tab immediately to bypass browser popup blockers
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connecting to eSign...</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #f0fdfd 0%, #e0f2fe 100%);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1f2937;
            }
            .loader-container {
              text-align: center;
              background: rgba(255, 255, 255, 0.85);
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255, 255, 255, 0.5);
              max-width: 380px;
              width: 90%;
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 4px solid #e5e7eb;
              border-top: 4px solid #00B3A4;
              border-radius: 50%;
              animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
              margin: 0 auto 24px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h3 {
              margin: 0 0 10px 0;
              font-size: 20px;
              font-weight: 700;
              color: #111827;
            }
            p {
              margin: 0;
              font-size: 14px;
              color: #6b7280;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="loader-container">
            <div class="spinner"></div>
            <h3>Preparing eSign Document</h3>
            <p>Please wait while we merge your documents and configure the eSign portal...</p>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    }

    try {
      const token = sessionStorage.getItem("token");
      let esignUrl;
      if (currentPhase === "OFFER") {
        esignUrl = selectedCalcTemplate
          ? `${API_BASE_URL}/v1/letters/sendOffer/esign/${applicantId}/${encodeURIComponent(entry.offerTemplate)}?calcTemplateId=${selectedCalcTemplate}`
          : `${API_BASE_URL}/v1/letters/sendOffer/esign/${applicantId}/${encodeURIComponent(entry.offerTemplate)}`;
      } else {
        esignUrl = selectedCalcTemplate
          ? `${API_BASE_URL}/v1/letters/sendAppointment/esign/${applicantId}/${encodeURIComponent(entry.appointmentTemplate)}?calcTemplateId=${selectedCalcTemplate}`
          : `${API_BASE_URL}/v1/letters/sendAppointment/esign/${applicantId}/${encodeURIComponent(entry.appointmentTemplate)}`;
      }

      const res = await fetch(esignUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to initiate eSign request");
      }

      // Open E-Sign portal auto-login URL in new window/tab
      if (newWindow) {
        newWindow.location.href = data.redirectUrl;
      } else {
        // Fallback in case popup blocker completely blocked window.open
        window.location.href = data.redirectUrl;
      }

      await fetchApproved();
      setShowTemplateModal(false);
      setSelectedApplicant(null);
      setShowSendOptions(false);
      alert("📝 Document sent to eSign application! Redirecting to signature configuration...");
    } catch (err) {
      if (newWindow) {
        newWindow.close();
      }
      console.error("eSign initiation error:", err);
      alert("❌ Failed to send to eSign: " + err.message);
    } finally {
      setSending(null);
    }
  };

  const handleAcceptClick = (applicantId, status) => {
    setUploadApplicantId(applicantId);
    setUploadedFiles({ offerLetter: null, appointmentLetter: null, document3: null });
    setShowUploadModal(status); // Store the current status ('Offer Released' or 'Appointment Released')
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ Allowed types
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    const allowedExtensions = ["pdf", "docx"];
    const extension = file.name.split(".").pop().toLowerCase();

    // ❌ Invalid type
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(extension)) {
      alert("❌ Only PDF or DOCX files are allowed.");
      e.target.value = ""; // reset input
      return;
    }

    // ❌ Size check (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("❌ File size must be less than 2 MB.");
      e.target.value = ""; // reset input
      return;
    }

    // ✅ Valid file
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  };

  const forceDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (showUploadModal === 'Offer Released') {
      formData.append("offerLetter", uploadedFiles.offerLetter);
    } else {
      formData.append("appointmentLetter", uploadedFiles.appointmentLetter);
      formData.append("document3", uploadedFiles.document3);
    }
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${UPLOAD_API}${uploadApplicantId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      await fetchApproved();
      setShowUploadModal(false);
      alert("✅ Documents uploaded successfully!");
    } catch (err) { alert("❌ Failed to upload documents."); }
  };

  const filteredList = approvedList.filter(a =>
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.applicantId.toString().includes(searchTerm)
  );
  const resetTemplateModal = () => {
    setShowTemplateModal(false);
    setSelectedCalcTemplate(null);
    setSelectedOffer("");
    setSelectedAppointment("");
    setGeneratedLinks({});   // CLEAR GENERATED FILES
    setSelectedApplicant(null);
    setShowSendOptions(false);
  };


  return (
    <div className="confirmation-container" style={{ padding: '0px', background: 'transparent', boxShadow: 'none' }}>

      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table style={{ width: "100%", borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>CTC</th>
              <th style={thStyle}>DOJ</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Response</th>
              <th style={{ ...thStyle, borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: COLORS.text, borderRadius: '8px' }}>No applicants found.</td></tr>
            ) : (
              filteredList.map(a => (
                <tr key={a.applicantId}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>{getDisplayEmployeeId(a.applicantId)}</td>
                  <td style={tdStyle}>{a.firstName} {a.lastName}</td>
                  <td style={tdStyle}>{a.client}</td>
                  <td style={tdStyle}>₹{a.fixedCtc}</td>
                  <td style={tdStyle}>{formatDate(a.approvedDoj)}</td>
                  <td style={tdStyle}>
                    <button
                      disabled={a.status !== "Offer Generation In Progress" && a.status !== "Offer Accepted"}
                      onClick={() => handleProceed(a.applicantId, a.status)}
                      style={proceedBtnStyle(a.status === "Offer Generation In Progress" || a.status === "Offer Accepted")}
                    >
                      {a.status === "Offer Generation In Progress" || a.status === "Offer Accepted" ? "Proceed" : "Released"}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    {a.status === "Offer Released" || a.status === "Appointment Released" ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAcceptClick(a.applicantId, a.status)} style={acceptBtnStyle}>
                          <FiCheck /> Accept
                        </button>
                        {/* DECLINE BUTTON */}
                        <button onClick={() => handleDeclineClick(a.applicantId)} style={declineBtnStyle}>
                          <FiX /> Decline
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: '700', fontSize: '11px', color: COLORS.text }}>
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'center' }}>
                    <button onClick={() => setShowPreForm(a.applicantId)} style={detailsBtnStyle}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showTemplateModal && (
        <div style={modalOverlay}>
          <div className="review-modal-box generation-modal" style={{ ...modalBox, width: '500px', maxWidth: '90vw' }}>
            <div className="modal-title" style={{ color: COLORS.text, marginBottom: '20px', fontWeight: 'normal', fontSize: '15px' }}>Generate Letters</div>
            {currentPhase === "OFFER" && (
              <div className="modal-field" style={{ marginBottom: '15px' }}>
                <label className="modal-label" style={labelStyle}>CTC Template <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="modal-select" value={selectedCalcTemplate || ""} onChange={e => setSelectedCalcTemplate(e.target.value || null)} style={selectStyle}>
                  <option value="">Select CTC Template</option>
                  {calculationTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            {currentPhase === "OFFER" && (
              <div className="modal-field" style={{ marginBottom: '15px' }}>
                <label className="modal-label" style={labelStyle}>Offer Template</label>
                <select className="modal-select" value={selectedOffer} onChange={e => setSelectedOffer(e.target.value)} style={selectStyle}>
                  <option value="">Select Template</option>
                  {docTemplates.filter(t => t.offerLetterFileName).map(t => <option key={t.offerLetterFileName} value={t.offerLetterFileName}>{t.offerLetterFileName}</option>)}
                </select>
              </div>
            )}
            {currentPhase === "APPOINTMENT" && (
              <div className="modal-field" style={{ marginBottom: '25px' }}>
                <label className="modal-label" style={labelStyle}>Appointment Template</label>
                <select className="modal-select" value={selectedAppointment} onChange={e => setSelectedAppointment(e.target.value)} style={selectStyle}>
                  <option value="">Select Template</option>
                  {docTemplates.filter(t => t.appointmentLetterFileName).map(t => <option key={t.appointmentLetterFileName} value={t.appointmentLetterFileName}>{t.appointmentLetterFileName}</option>)}
                </select>
              </div>
            )}
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={resetTemplateModal} style={ghostStyle} disabled={generating}>
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleGenerateFiles}
                style={{ ...primaryBtnStyle, opacity: generating ? 0.7 : 1, cursor: generating ? 'not-allowed' : 'pointer' }}
                disabled={generating}
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
            {generatedLinks[selectedApplicant] && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#F5F7FA', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontWeight: '700', fontSize: '12px', marginBottom: '10px' }}>Files Ready:</p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  {currentPhase === "OFFER" && generatedLinks[selectedApplicant].offer && (
                    <button
                      type="button"
                      onClick={() =>
                        forceDownload(
                          generatedLinks[selectedApplicant].offer.url,
                          `Offer_Letter_${selectedApplicant}.pdf`
                        )
                      }
                      style={downloadStyle}
                    >
                      Offer Letter – {selectedApplicant}
                    </button>
                  )}

                  {currentPhase === "APPOINTMENT" && generatedLinks[selectedApplicant].appointment && (
                    <button
                      type="button"
                      onClick={() =>
                        forceDownload(
                          generatedLinks[selectedApplicant].appointment.url,
                          `Appointment_Letter_${selectedApplicant}.pdf`
                        )
                      }
                      style={downloadStyle}
                    >
                      Appointment Letter – {selectedApplicant}
                    </button>
                  )}
                </div>
                {!showSendOptions ? (
                  <button
                    onClick={() => setShowSendOptions(true)}
                    style={{ ...primaryBtnStyle, width: '100%' }}
                  >
                    Send to Candidate
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    <p style={{ fontSize: '15px', color: COLORS.text, margin: '5px 0', fontWeight: '500' }}>Select Delivery Method:</p>
                    <button
                      onClick={() => handleSendEmail(selectedApplicant)}
                      disabled={!!sending}
                      style={{
                        ...primaryBtnStyle,
                        width: '100%',
                        backgroundColor: COLORS.primary,
                        opacity: sending ? 0.7 : 1,
                        cursor: sending ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {sending === 'email' ? "Sending..." : <>
                        <FiSend /> Send via Email
                      </>}
                    </button>
                    <button
                      onClick={() => handleSendEsign(selectedApplicant)}
                      disabled={!hasEsignAccess || !!sending}
                      style={{
                        ...primaryBtnStyle,
                        width: '100%',
                        backgroundColor: !hasEsignAccess ? '#ccc' : COLORS.primary,
                        cursor: (!hasEsignAccess || !!sending) ? 'not-allowed' : 'pointer',
                        opacity: sending ? 0.7 : 1
                      }}
                      title={!hasEsignAccess ? "Your tenant does not have access to the eSign application." : ""}
                    >
                      {sending === 'esign' ? "Initiating..." : <>
                        <FiFileText /> Send through eSign
                      </>}
                    </button>
                    <button
                      onClick={() => setShowSendOptions(false)}
                      disabled={!!sending}
                      style={{
                        ...ghostStyle,
                        width: '100%',
                        padding: '10px 20px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: sending ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!sending) e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!sending) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showUploadModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, width: '500px', maxWidth: '90vw' }}>
            <h3 style={{ color: COLORS.text, marginBottom: '20px', fontSize: '15px', fontWeight: 'normal' }}>
              {showUploadModal === 'Offer Released' ? "Upload Signed Offer Letter" : "Upload Signed Appointment & Support Docs"}
            </h3>
            <form onSubmit={handleUploadSubmit}>
              {showUploadModal === 'Offer Released' ? (
                <UploadField label="Signed Offer (PDF/DOCX, max 2 MB)" onChange={e => handleFileChange(e, 'offerLetter')} />
              ) : (
                <>
                  <UploadField label="Signed Appointment (PDF/DOCX, max 2 MB)" onChange={e => handleFileChange(e, 'appointmentLetter')} />
                  <UploadField label="Support Doc (PDF/DOCX, max 2 MB)" onChange={e => handleFileChange(e, 'document3')} />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} style={ghostStyle}>Cancel</button>
                <button type="submit" style={primaryBtnStyle}><FiUpload /> Submit Docs</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreForm && (
        <div style={modalOverlay}>
          <div className="review-modal-box" style={{ ...modalBox, width: '100%', maxWidth: '1000px', maxHeight: '90vh', padding: 0 }}>
            <div className="review-applicant-header">
              <h3 className="review-applicant-title" style={{ color: COLORS.text, margin: 0 }}>Review Data</h3>
              <button onClick={() => setShowPreForm(null)} className="review-close-btn"><FiX size={24} /></button>
            </div>
            <div className="review-modal-content">
              <div className="review-applicant-content">
                <HRViewPreOnboardingDetails externalApplicantId={showPreForm} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const UploadField = ({ label, onChange }) => {
  const [fileName, setFileName] = useState("");
  const inputId = `file-input-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("");
    }
    onChange(e);
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={labelStyle}>{label}</label>
      <div style={{
        border: `2px solid ${COLORS.borderTeal}`,
        padding: '6px 12px',
        borderRadius: '8px',
        textAlign: 'left',
        backgroundColor: '#f9f9f9',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleChange}
          required
          style={{ display: 'none' }}
          id={inputId}
        />
        <label
          htmlFor={inputId}
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: COLORS.primary,
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'background-color 0.2s',
            border: 'none',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => e.target.style.background = COLORS.primaryDark}
          onMouseLeave={(e) => e.target.style.background = COLORS.primary}
        >
          Choose File
        </label>
        <div style={{ color: '#666', flex: 1, fontSize: '0.9rem' }}>
          {fileName || "No file chosen"}
        </div>
      </div>
    </div>
  );
};

const thStyle = { background: '#629AF1', color: '#fff', padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '15px', textTransform: 'capitalize', letterSpacing: '0.5px' };
const tdStyle = { padding: '16px', background: '#ffffff', color: COLORS.text, fontSize: '15px', fontWeight: '500' };
const proceedBtnStyle = (active) => ({ background: active ? COLORS.bgGradient : '#e2e8f0', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: active ? 'pointer' : 'default', boxShadow: 'none' });
const acceptBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', background: COLORS.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' };
const declineBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' };
const detailsBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', background: COLORS.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' };
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: '280px',
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10001,
  backdropFilter: 'blur(4px)',
  padding: '20px',
};
const modalBox = { background: "#fff", padding: "24px", width: "100%", maxWidth: "1000px", borderRadius: "8px", boxShadow: 'none' };
const labelStyle = { color: COLORS.text, fontWeight: 'normal', display: 'block', marginBottom: '8px', fontSize: '15px', textTransform: 'none' };
const selectStyle = { width: '100%', height: '48px', padding: '0 16px', borderRadius: '8px', border: `2px solid ${COLORS.borderTeal}`, outline: 'none', background: '#fff', fontSize: '15px', color: COLORS.text };
const searchStyle = { padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '15px', color: COLORS.text, backgroundColor: '#F5F7FA' };
const primaryBtnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: COLORS.bgGradient, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' };
const ghostStyle = { background: 'transparent', border: 'none', color: '#666', fontWeight: '700', cursor: 'pointer', padding: '10px 20px', fontSize: '15px' };
const downloadStyle = { display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.text, textDecoration: 'none', fontWeight: 'normal', fontSize: '15px', border: 'none', background: 'none', padding: 0, cursor: 'pointer' };
const fileInputStyle = { width: '100%', padding: '8px', borderRadius: '8px', border: `1px dashed ${COLORS.borderTeal}` };
