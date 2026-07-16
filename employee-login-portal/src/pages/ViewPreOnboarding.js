import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiDownload, FiCheckCircle, FiMinusCircle, FiFileText, FiMapPin, FiDollarSign, FiMessageSquare, FiArrowRight, FiX, FiEye, FiClock } from 'react-icons/fi';
import './Preonboarding.css';

// --- Theme Colors ---
const COLORS = {
  primary: '#00B3A4',
  primaryLight: '#33c2b6',
  primaryDark: '#008f83',
  bgGradient: '#629AF1',
  borderTeal: '#cbd5e1',
  bgTealLight: '#f0fdfd',
  shadowTeal: 'none',
  text: '#1F2937',
};

// Status options for verification
const VERIFICATION_STATUSES = {
  VERIFIED: "Verified",
  NOT_CLEAR: "Not Clear",
};

const ALLOWED_STATUSES = [
  "Form Submitted",
  "Revision Pending by AM",
  "Declined"
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PREONBOARDING_API = `${API_BASE_URL}/v1/preonboarding`;

function getDocumentFieldPath(section, field) {
  return `${section}.${field}`;
}

/* ---------------------------------------------------------------
  ✅ VERIFICATION CONTROLS — Radio buttons for AM review
---------------------------------------------------------------- */
function VerificationControls({ documentKey, currentStatus, onStatusChange }) {
  const options = [
    { value: VERIFICATION_STATUSES.VERIFIED, color: "#10b981", icon: <FiCheckCircle /> },
    { value: VERIFICATION_STATUSES.NOT_CLEAR, color: "#f59e0b", icon: <FiMinusCircle /> },
  ];

  return (
    <div className="verification-controls-container">
      {options.map((opt) => {
        const isSelected = currentStatus === opt.value;
        const statusClass = opt.value === VERIFICATION_STATUSES.VERIFIED ? 'verified' : 'not-clear';

        return (
          <label
            key={opt.value}
            className={`verification-label ${statusClass} ${isSelected ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name={`verification_${documentKey}`}
              value={opt.value}
              checked={isSelected}
              onChange={() => onStatusChange(documentKey, opt.value)}
              style={{ display: "none" }}
            />
            {isSelected && opt.icon}
            {opt.value}
          </label>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------
  ✅ FILE BADGE — Preview and Download buttons
---------------------------------------------------------------- */
function FileBadge({ file }) {
  const [showPreview, setShowPreview] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  const { base64, fileName, fileType } = file || {};
  const ext = fileName ? (fileName.split(".").pop() || "").toLowerCase() : "";
  const type = fileType || "application/octet-stream";
  const downloadUrl = base64 ? `data:${type};base64,${base64}` : "";

  // Convert base64 to blob URL for iframe
  const getBlobUrl = useCallback(() => {
    if (blobUrl) return blobUrl;

    if (!base64) return downloadUrl;

    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return url;
    } catch (error) {
      console.error("Error creating blob URL:", error);
      return downloadUrl; // Fallback to data URL
    }
  }, [base64, type, blobUrl, downloadUrl]);

  // Clean up blob URL on component unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Early return after all hooks are declared
  if (!file || !file.base64 || !file.fileName) return "—";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.click();
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    // Clean up blob URL when preview is closed
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={handlePreview}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "8px",
            background: "#f0fdfa",
            color: "#0d9488",
            fontSize: "15px",
            fontWeight: "600",
            border: "1px solid #99f6e4",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ccfbf1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f0fdfa";
          }}
        >
          Preview
        </button>
        <button
          onClick={handleDownload}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "8px",
            background: "#00b3a4",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            boxShadow: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Download
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: "280px",
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10001,
            padding: "20px",
          }}
          onClick={closePreview}
        >
          <div
            style={{
              backgroundColor: "white",
              width: "100%",
              maxWidth: "1100px",
              height: "100%",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "none",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  color: "#1e293b",
                  fontWeight: "600",
                }}
              >
                Document Preview: {fileName}
              </h3>
              <button
                onClick={closePreview}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                title="Close Preview"
              >
                <FiX size={24} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflow: "hidden",
                padding: "0",
                backgroundColor: "#f1f5f9",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              {ext === "pdf" || type.includes("pdf") ? (
                <iframe
                  src={getBlobUrl()}
                  title="PDF Preview"
                  width="100%"
                  height="100%"
                  style={{ border: "none", backgroundColor: "white" }}
                />
              ) : (
                <div
                  style={{
                    padding: "24px",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "auto",
                  }}
                >
                  <img
                    src={downloadUrl}
                    alt="Document Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "8px",
                      boxShadow: "none",
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                padding: "12px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor: "white",
              }}
            >
              <button
                onClick={closePreview}
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#1e293b",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.95rem",
                  transition: "background-color 0.2s",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------
  ✅ TWO COLUMN FIELD ROW
---------------------------------------------------------------- */
function Field({ label, value, documentKey, currentStatus, onStatusChange }) {
  const isFileField = React.isValidElement(value) && value.props?.file && value.props.file.base64;

  return (
    <tr className="view-field-row">
      <td className="view-field-label">{label}</td>
      <td className="view-field-value-cell">
        <div className="view-field-value" style={{ color: COLORS.text }}>
          {(!value || value === "") ? "—" : value}
        </div>
        {documentKey && isFileField && (
          <div className="view-verification-controls-wrapper">
            <VerificationControls
              documentKey={documentKey}
              currentStatus={currentStatus}
              onStatusChange={onStatusChange}
            />
          </div>
        )}
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------------
  ✅ SECTION WRAPPER
---------------------------------------------------------------- */
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24, background: '#fff', borderRadius: '8px', border: `1px solid ${COLORS.borderTeal}`, overflow: 'hidden' }}>
      <h3 style={{
        padding: "12px 20px",
        background: COLORS.bgGradient,
        color: "#fff",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        {title}
      </h3>
      <div style={{ padding: '8px' }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
  ✅ SMART DATE PICKER — Premium Calendar like Onboarding
---------------------------------------------------------------- */
const SmartDatePicker = ({ value, onChange, disabled, minDate }) => {
  const [open, setOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const formatLocalDate = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  return (
    <DatePicker
      selected={value ? new Date(value + "T00:00:00") : null}
      disabled={disabled}
      minDate={minDate}
      onChange={(date) => {
        if (!date) {
          onChange("");
          setOpen(false);
          return;
        }
        onChange(formatLocalDate(date));
        setTimeout(() => setOpen(false), 20);
      }}
      onSelect={() => setOpen(false)}
      open={open}
      onInputClick={() => setOpen(true)}
      onClickOutside={() => setOpen(false)}
      dateFormat="dd-MM-yyyy"
      calendarClassName="no-gap-calendar"
      dayClassName={() => "no-gap-day"}
      wrapperClassName="full-width-picker"
      className="onboarding-input"
      placeholderText="Select Date"

      renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => {
        const months = [
          "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
          "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
        ];
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 100 }, (_, i) => currentYear + 10 - i);

        return (
          <div className="custom-calendar-header">
            <div className="calendar-header-banner">
              <button
                type="button"
                className="header-nav-btn prev"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
                  decreaseMonth();
                }}
              >
                ‹
              </button>

              <div className="header-main-content">

                <div className="header-text-group">
                  <span
                    className="clickable-header-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                  >
                    {months[date.getMonth()]}
                  </span>
                  <span
                    className="clickable-header-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
                    }}
                  >
                    {date.getFullYear()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="header-nav-btn next"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
                  increaseMonth();
                }}
              >
                ›
              </button>
            </div>

            {showMonthDropdown && (
              <div className="header-dropdown month-dropdown">
                <div className="dropdown-scroll-pane">
                  {months.map((m, idx) => (
                    <div
                      key={m}
                      className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                      onClick={() => {
                        changeMonth(idx);
                        setShowMonthDropdown(false);
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showYearDropdown && (
              <div className="header-dropdown year-dropdown">
                <div className="dropdown-scroll-pane">
                  {years.map((y) => (
                    <div
                      key={y}
                      className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                      onClick={() => {
                        changeYear(y);
                        setShowYearDropdown(false);
                      }}
                    >
                      {y}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

/* ---------------------------------------------------------------
  ✅ MAIN COMPONENT
---------------------------------------------------------------- */
export default function ViewPreOnboarding({ externalApplicantId = null, onClose }) {
  const [inputId, setInputId] = useState(externalApplicantId || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState({});
  const [financeIds, setFinanceIds] = useState([]);
  const [showDropReason, setShowDropReason] = useState(false);
  const [dropReason, setDropReason] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalData, setApprovalData] = useState({
    proposedCtc: "",
    workLocation: "",
    doj: "",
    notes: "",
    revisionReason: "",
    variablePay: "",
    noticePeriod: "",
  });

  const parseLocalDate = (str) => {
    if (!str) return null;
    const [y, m, d] = str.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const formatLocalDate = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const handleDropSubmit = async () => {
    if (!dropReason.trim()) return alert("Please enter a reason for dropping.");
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${API_BASE_URL}/v1/applicants/status/${data?.applicantId}?status=Dropped&reason=${encodeURIComponent(dropReason)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert("Applicant has been Dropped.");
      setShowDropReason(false);
      if (onClose) onClose();
    } catch (err) {
      alert("Error dropping applicant.");
    }
  };

  const handleStatusChange = useCallback((key, status) => {
    setVerificationStatus(prev => ({ ...prev, [key]: status }));
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString;
    const date = new Date(dateString);
    if (!isNaN(date)) {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}-${m}-${y}`;
    }
    return dateString;
  };

  const fetchData = async (overrideId) => {
    const idToFetch = overrideId || inputId;
    if (!idToFetch) return setError("Enter Applicant ID");
    setLoading(true);
    setError("");
    setData(null);
    try {
      const token = sessionStorage.getItem("token");
      const appRes = await fetch(`${API_BASE_URL}/v1/applicants/${idToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const applicant = await appRes.json();

      setApprovalData({
        proposedCtc: applicant.fixedCtc || "",
        workLocation: applicant.approvedLocation || "",
        doj: applicant.approvedDoj || "",
        notes: applicant.approvalNotes || "",
        revisionReason: applicant.revisionReason || "",
        variablePay: applicant.variablePay || "",
        noticePeriod: applicant.noticePeriod || "",
        approvalStatus: applicant.status || "",
      });

      if (applicant.status === "Initiated") {
        setError("The candidate has not yet submitted the data. Please try again later.");
        setLoading(false);
        return;
      }

      if (applicant.verificationStatus) {
        let parsed = applicant.verificationStatus;
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        setVerificationStatus(parsed);
      }

      const res = await fetch(`${PREONBOARDING_API}/${idToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const preonboardingData = await res.json();
      if (!preonboardingData || Object.keys(preonboardingData).length === 0) {
        setError("No pre-onboarding data found. The candidate might not have completed the form.");
      } else {
        const d = preonboardingData;

        // FIX: If PG details are missing in 'academic', try to find them in 'education' list
        // (This happens if backend saves PG in the generic education table)
        const hasPgInAcademic = d.academic && (d.academic.pgDegreeType || d.academic.pg_degree_type);

        if (!hasPgInAcademic && Array.isArray(d.education)) {
          // Regex to identify PG degrees: P.G, Post-Grad, Masters, MBA, M.Tech, etc.
          const pgRegex = /(?:^|\b)(p\.?g\.?|post[\s-]*grad(uate)?|master'?s?|mba|mca|m\.?\s*tech|m\.?\s*e|m\.?\s*sc|m\.?\s*com|ma|m\.?\s*phil|ph\.?\s*d|m\.?\s*s|m\.?\s*arch|m\.?\s*plan|llm|md|dip(loma)?)(?:\b|$)/i;

          const pgItem = d.education.find(e =>
            (e.degreeType && pgRegex.test(e.degreeType)) ||
            (e.courseMajor && pgRegex.test(e.courseMajor))
          );
          if (pgItem) {
            d.academic = {
              ...(d.academic || {}),
              pgDegreeType: pgItem.degreeType,
              pgCourse: pgItem.courseMajor,
              pgCollegeName: pgItem.collegeNameAddress,
              pgUniversity: pgItem.university,
              pgStudyType: pgItem.studyType,
              pgYearOfPassing: pgItem.yearOfPassing,
              pgRegistrationNumber: pgItem.registrationNumber,
              pgMarksheet: pgItem.marksheetFile,
              pgCertificate: pgItem.certificateFile,
              pgLocation: pgItem.location || "",

              // Internal flags for DocumentField to know real path
              _pgMarksheetCheck: `education[${d.education.indexOf(pgItem)}].marksheetFile`,
              _pgCertificateCheck: `education[${d.education.indexOf(pgItem)}].certificateFile`,
            };
          }
        }

        setData(d);
      }
    } catch (err) {
      setError("Error fetching details. Applicant may not exist or data is unavailable.");
    }
    setLoading(false);
  };

  useEffect(() => {
    async function loadFinanceIds() {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/v1/roles/FINANCE`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setFinanceIds(data || []);
      } catch (err) { }
    }
    loadFinanceIds();
  }, []);

  useEffect(() => {
    if (externalApplicantId) {
      setInputId(externalApplicantId);
      fetchData(externalApplicantId);
    }
  }, [externalApplicantId]);

  const DocumentField = ({ section, field, label, fileBlock, isWorkHistory = false, whIndex = null, check = null }) => {
    // If a manual check path is provided (for mapped PG fields), use it
    let docKey = check || getDocumentFieldPath(section, field);

    if (isWorkHistory) {
      docKey = getDocumentFieldPath(`workHistory[${whIndex}]`, field);
    }

    return (
      <Field
        label={label}
        value={fileBlock ? <FileBadge file={fileBlock} /> : "—"}
        documentKey={docKey}
        currentStatus={verificationStatus[docKey]}
        onStatusChange={handleStatusChange}
      />
    );
  };

  const totalDocuments = (() => {
    let count = 0;
    const addIfExists = (file) => { if (file && file.base64 && file.fileName) count++; };
    addIfExists(data?.personal?.passportPhoto);
    addIfExists(data?.address?.presentProofFile);
    addIfExists(data?.address?.permanentProofFile);
    const acad = data?.academic || {};
    addIfExists(acad.schoolMarksheet);
    addIfExists(acad.intermediateMarksheet);
    addIfExists(acad.ugMarksheet);
    addIfExists(acad.ugCertificate);
    addIfExists(acad.pgMarksheet);
    addIfExists(acad.pgCertificate);

    (data?.workHistory || []).forEach(wh => {
      addIfExists(wh.offerLetter);
      addIfExists(wh.relievingLetter);
      addIfExists(wh.payslips);
      addIfExists(wh.form16);
      addIfExists(wh.pfServiceHistoryFile);
    });

    const ids = data?.identity || {};
    addIfExists(ids.aadharFile);
    addIfExists(ids.panFile);
    addIfExists(ids.passportFile);
    addIfExists(ids.voterFile);
    addIfExists(ids.drivingFile);
    addIfExists(ids.utilityFile);

    addIfExists(data?.documents?.resumeFile);
    return count;
  })();

  const allVerified = Object.keys(verificationStatus).length === totalDocuments && Object.values(verificationStatus).every(s => s === VERIFICATION_STATUSES.VERIFIED);
  const hasNotClear = Object.values(verificationStatus).includes(VERIFICATION_STATUSES.NOT_CLEAR);
  const allDocumentsReviewed = Object.keys(verificationStatus).length === totalDocuments;
  const isStatusAllowed = ALLOWED_STATUSES.includes(approvalData.approvalStatus);
  const canSendReuploadMail = isStatusAllowed && allDocumentsReviewed && hasNotClear;
  const canApprove = isStatusAllowed && allDocumentsReviewed && allVerified;

  const sendReuploadMail = async () => {
    const notClearDocs = Object.entries(verificationStatus).filter(([k, v]) => v === VERIFICATION_STATUSES.NOT_CLEAR).map(([k]) => k);
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${API_BASE_URL}/v1/applicants/reject-documents/${data?.applicantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectedDocuments: notClearDocs })
      });

      await fetch(`${API_BASE_URL}/v1/emails/send-reupload-mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicantId: data?.applicantId,
          applicantName: `${data?.personal?.firstName} ${data?.personal?.lastName}`,
          email: data?.email,
          documents: notClearDocs,
        })
      });

      await fetch(`${API_BASE_URL}/v1/applicants/status/${data?.applicantId}?status=Re-Upload Needed`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      alert("Re-upload mail sent!");
    } catch (err) { alert("Error sending mail."); }
  };

  const handleSubmitApproval = async () => {
    const { proposedCtc, variablePay, workLocation, doj, noticePeriod } = approvalData;
    if (!proposedCtc?.toString().trim()) return alert("Fixed CTC is required.");
    if (!workLocation?.trim()) return alert("Work Location is required.");
    if (!doj?.trim()) return alert("Date of Joining is required.");
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${API_BASE_URL}/v1/applicants/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicantId: data?.applicantId,
          proposedCtc, workLocation, doj, notes: approvalData.notes, variablePay, verificationStatus,
          noticePeriod,
          financeId: financeIds[0] || "",
        })
      });
      alert("Approval submitted!");
      setShowApprovalForm(false);
      if (onClose) onClose();
    } catch (err) { alert("Error submitting approval."); }
  };

  return (
    <div style={{ padding: "0 10px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ padding: '0 0 20px 0' }}>
        {error && <div style={{ color: "red", padding: '10px', background: '#fee2e2', borderRadius: '10px', marginBottom: '15px' }}>{error}</div>}
        {loading && <div style={{ color: COLORS.primary, fontWeight: '700' }}>Loading applicant data...</div>}

        {data && (
          <div>
            <Section title="Personal Details">
              {/* Name */}
              <Field label="First Name" value={data.personal?.firstName} />
              <Field label="Last Name" value={data.personal?.lastName} />

              {/* Basic Info */}
              <Field label="Gender" value={data.personal?.gender} />
              <Field label="Date of Birth" value={formatDate(data.personal?.dateOfBirth)} />

              {/* Contact */}
              <Field label="Personal Email" value={data.personal?.personalEmail} />
              <Field label="Mobile Number" value={data.personal?.mobileNumber} />
              <Field label="Alternate Mobile Number" value={data.personal?.alternateMobileNumber} />

              {/* Family & Personal */}
              <Field label="Blood Group" value={data.personal?.bloodGroup} />
              <Field label="Father's Name" value={data.personal?.fatherName} />
              <Field label="Mother's Name" value={data.personal?.motherName} />
              <Field label="Marital Status" value={data.personal?.maritalStatus} />

              {/* Emergency */}
              <Field
                label="Emergency Contact Name"
                value={data.personal?.emergencyContactName}
              />
              <Field
                label="Emergency Contact Relationship"
                value={data.personal?.emergencyContactRelationship}
              />
              <Field
                label="Emergency Contact Number"
                value={data.personal?.emergencyContactNumber}
              />

              {/* Passport Photo */}
              <DocumentField
                section="personal"
                field="passportPhoto"
                label="Passport Size Photo"
                fileBlock={data.personal?.passportPhoto}
              />
            </Section>


            <Section title="Address Details">

              {/* ================= PRESENT ADDRESS ================= */}
              <Field label="Present Address Line" value={data.address?.present?.addressLine} />
              <Field label="Present City" value={data.address?.present?.city} />
              <Field label="Present State" value={data.address?.present?.state} />
              <Field label="Present Pincode" value={data.address?.present?.pincode} />
              <Field label="Present Landmark" value={data.address?.present?.landmark} />
              <Field label="Nearest Police Station" value={data.address?.present?.nearestPoliceStation} />

              <Field label="Contact Person Name" value={data.address?.present?.contactPersonName} />
              <Field label="Contact Person Relationship" value={data.address?.present?.contactPersonRelationship} />
              <Field label="Contact Person Mobile" value={data.address?.present?.contactPersonMobile} />

              <Field label="Duration of Stay" value={data.address?.present?.durationOfStay} />

              <DocumentField
                section="address"
                field="presentProofFile"
                label="Present Address Proof"
                fileBlock={data.address?.presentProofFile}
              />

              {/* ================= PERMANENT ADDRESS ================= */}
              <Field label="Permanent Address Line" value={data.address?.permanent?.addressLine} />
              <Field label="Permanent City" value={data.address?.permanent?.city} />
              <Field label="Permanent State" value={data.address?.permanent?.state} />
              <Field label="Permanent Pincode" value={data.address?.permanent?.pincode} />
              <Field label="Permanent Landmark" value={data.address?.permanent?.landmark} />
              <Field label="Nearest Police Station" value={data.address?.permanent?.nearestPoliceStation} />

              <Field label="Contact Person Name" value={data.address?.permanent?.contactPersonName} />
              <Field label="Contact Person Relationship" value={data.address?.permanent?.contactPersonRelationship} />
              <Field label="Contact Person Mobile" value={data.address?.permanent?.contactPersonMobile} />

              <Field label="Duration of Stay" value={data.address?.permanent?.durationOfStay} />

              <DocumentField
                section="address"
                field="permanentProofFile"
                label="Permanent Address Proof"
                fileBlock={data.address?.permanentProofFile}
              />

            </Section>


            <Section title="Academic Qualification">

              {/* ================= SCHOOL ================= */}
              <Field label="School Name" value={data.academic?.schoolName} />
              <Field label="School Board" value={data.academic?.schoolBoard} />
              <Field label="School Year of Passing" value={data.academic?.schoolYearOfPassing} />
              <Field label="School Percentage / CGPA" value={data.academic?.schoolCgpaPercentage} />
              <DocumentField
                section="academic"
                field="schoolMarksheet"
                label="School Marksheet"
                fileBlock={data.academic?.schoolMarksheet}
              />

              {/* ================= INTERMEDIATE ================= */}
              <Field label="Intermediate College Name" value={data.academic?.intermediateCollegeName} />
              <Field label="Intermediate Board" value={data.academic?.intermediateBoard} />
              <Field label="Intermediate Year of Passing" value={data.academic?.intermediateYearOfPassing} />
              <Field label="Intermediate Percentage / CGPA" value={data.academic?.intermediateCgpaPercentage} />
              <DocumentField
                section="academic"
                field="intermediateMarksheet"
                label="Intermediate Marksheet"
                fileBlock={data.academic?.intermediateMarksheet}
              />

              {/* ================= UNDERGRADUATE ================= */}
              <Field label="UG Degree Type" value={data.academic?.ugDegreeType} />
              <Field label="UG Course / Specialization" value={data.academic?.ugCourse} />
              <Field label="UG College Name" value={data.academic?.ugCollegeName} />
              <Field label="UG University" value={data.academic?.ugUniversity} />
              <Field label="UG Location" value={data.academic?.ugLocation} />
              <Field label="UG Study Type" value={data.academic?.ugStudyType} />
              <Field label="UG Year of Passing" value={data.academic?.ugYearOfPassing} />
              <Field label="UG Registration Number" value={data.academic?.ugRegistrationNumber} />

              <DocumentField
                section="academic"
                field="ugMarksheet"
                label="UG Marksheet"
                fileBlock={data.academic?.ugMarksheet}
              />
              <DocumentField
                section="academic"
                field="ugCertificate"
                label="UG Degree Certificate"
                fileBlock={data.academic?.ugCertificate}
              />

              {/* ================= POSTGRADUATE (OPTIONAL) ================= */}
              {(data.academic?.pgDegreeType || data.academic?.pgCourse || (data.academic?.pgMarksheet && data.academic?.pgMarksheet.base64)) && (
                <>
                  <Field label="PG Degree Type" value={data.academic?.pgDegreeType} />
                  <Field label="PG Course / Specialization" value={data.academic?.pgCourse} />
                  <Field label="PG College Name" value={data.academic?.pgCollegeName} />
                  <Field label="PG University" value={data.academic?.pgUniversity} />
                  <Field label="PG Location" value={data.academic?.pgLocation} />
                  <Field label="PG Study Type" value={data.academic?.pgStudyType} />
                  <Field label="PG Year of Passing" value={data.academic?.pgYearOfPassing} />
                  <Field label="PG Registration Number" value={data.academic?.pgRegistrationNumber} />

                  <DocumentField
                    section="academic"
                    field="pgMarksheet"
                    label="PG Marksheet"
                    fileBlock={data.academic?.pgMarksheet}
                    check={data.academic?._pgMarksheetCheck}
                  />
                  <DocumentField
                    section="academic"
                    field="pgCertificate"
                    label="PG Degree Certificate"
                    fileBlock={data.academic?.pgCertificate}
                    check={data.academic?._pgCertificateCheck}
                  />
                </>
              )}

              {/* ================= OTHER EDUCATION (REPEATABLE) ================= */}
              {(data?.education || []).map((edu, idx) => (
                <React.Fragment key={idx}>
                  <Field label="Degree Type" value={edu.degreeType} />
                  <Field label="Course / Major" value={edu.courseMajor} />
                  <Field label="College Name & Address" value={edu.collegeNameAddress} />
                  <Field label="University" value={edu.university} />
                  <Field label="Study Type" value={edu.studyType} />
                  <Field label="Year of Passing" value={edu.yearOfPassing} />
                  <Field label="Registration Number" value={edu.registrationNumber} />

                  <DocumentField
                    section={`education[${idx}]`}
                    field="marksheetFile"
                    label="Marksheet"
                    fileBlock={edu.marksheetFile}
                  />
                  <DocumentField
                    section={`education[${idx}]`}
                    field="certificateFile"
                    label="Certificate"
                    fileBlock={edu.certificateFile}
                  />
                </React.Fragment>
              ))}

            </Section>


            {(data?.workHistory || []).map((wh, i) => (
              <Section key={i} title={`Work History: ${wh.companyName}`}>
                <Field label="Designation" value={wh.designation} />
                <Field label="Location" value={wh.officeLocation} />
                <Field label="Employee ID" value={wh.employeeId} />
                <Field label="Salary Drawn" value={wh.salaryDrawn} />
                <Field label="Tenure" value={`${formatDate(wh.dateOfJoining)} to ${formatDate(wh.dateOfRelieving)}`} />
                <Field label="Leave Reason" value={wh.reasonForLeaving} />
                <Field label="Reporting Manager Name" value={wh.reportingManagerName} />
                <Field label="Reporting Manager Email" value={wh.reportingManagerEmail} />
                <Field label="Reporting Manager Phone" value={wh.reportingManagerPhone} />

                <Field label="HR Manager Name" value={wh.hrManagerName} />
                <Field label="HR Manager Email" value={wh.hrManagerEmail} />
                <Field label="HR Manager Phone" value={wh.hrManagerPhone} />

                <DocumentField isWorkHistory whIndex={i} field="offerLetter" label="Offer Letter" fileBlock={wh.offerLetter} />
                <DocumentField isWorkHistory whIndex={i} field="relievingLetter" label="Relieving Letter" fileBlock={wh.relievingLetter} />
                <DocumentField isWorkHistory whIndex={i} field="payslips" label="Last 3m Payslips" fileBlock={wh.payslips} />

                <DocumentField isWorkHistory whIndex={i} field="pfServiceHistoryFile" label="PF Service History" fileBlock={wh.pfServiceHistoryFile} />
                <DocumentField isWorkHistory whIndex={i} field="form16" label="Form 16" fileBlock={wh.form16} />
              </Section>
            ))}

            <Section title="Identity Verification">
              <Field label="Aadhar" value={data.identity?.aadharNumber} />
              <DocumentField section="identity" field="aadharFile" label="Aadhar File" fileBlock={data.identity?.aadharFile} />

              <Field label="PAN" value={data.identity?.panNumber} />
              <DocumentField section="identity" field="panFile" label="PAN File" fileBlock={data.identity?.panFile} />

              <Field label="Passport" value={data.identity?.passportNumber} />
              <DocumentField section="identity" field="passportFile" label="Passport File" fileBlock={data.identity?.passportFile} />

              <Field label="Voter ID" value={data.identity?.voterNumber} />
              <DocumentField section="identity" field="voterFile" label="Voter File" fileBlock={data.identity?.voterFile} />

              <Field label="Driving License" value={data.identity?.drivingNumber} />
              <DocumentField section="identity" field="drivingFile" label="Driving File" fileBlock={data.identity?.drivingFile} />

              <Field label="Utility Bill" value={data.identity?.utilityNumber} />
              <DocumentField section="identity" field="utilityFile" label="Utility File" fileBlock={data.identity?.utilityFile} />

              <DocumentField section="documents" field="resumeFile" label="Latest Resume" fileBlock={data.documents?.resumeFile} />
            </Section>

            {!showApprovalForm && (
              <div style={{ textAlign: "right", padding: "20px 0", display: "flex", gap: "15px", justifyContent: "flex-end" }}>
                <button onClick={sendReuploadMail} disabled={!canSendReuploadMail} style={actionButtonStyle(canSendReuploadMail, '#ef4444')}>
                  <FiX /> Send Re-upload Mail
                </button>
                <button onClick={() => setShowApprovalForm(true)} disabled={!canApprove} style={actionButtonStyle(canApprove, COLORS.primary)}>
                  Approve <FiArrowRight />
                </button>
              </div>
            )}

            {showApprovalForm && (
              <div style={{ marginTop: "30px", padding: "30px", background: "#fff", borderRadius: "8px", border: `2px solid ${COLORS.borderTeal}`, boxShadow: 'none' }}>
                <h3 style={{ margin: '0 0 25px 0', color: COLORS.primary, display: "flex", alignItems: "center", gap: "10px" }}>
                  <FiCheckCircle /> Approval Details
                </h3>
                {approvalData.revisionReason && <div style={revisionBox}>{approvalData.revisionReason}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                  <FormGroup label="Fixed CTC" icon={<span style={{ fontWeight: 'bold' }}>₹</span>} value={approvalData.proposedCtc} onChange={v => setApprovalData({ ...approvalData, proposedCtc: v })} isNumeric={true} />
                  <FormGroup label="Variable Pay" icon={<span style={{ fontWeight: 'bold' }}>₹</span>} value={approvalData.variablePay} onChange={v => setApprovalData({ ...approvalData, variablePay: v })} isNumeric={true} optional={true} />
                  <FormGroup label="Location" icon={<FiMapPin />} value={approvalData.workLocation} onChange={v => setApprovalData({ ...approvalData, workLocation: v })} />
                  <div style={{ marginBottom: "20px" }}>
                    <label style={labelStyle}> Date of Joining *</label>
                    <SmartDatePicker
                      value={approvalData.doj}
                      onChange={v => setApprovalData({ ...approvalData, doj: v })}
                      minDate={new Date()}
                    />
                  </div>
                  <FormGroup label="Notice Period" icon={<FiClock />} value={approvalData.noticePeriod} onChange={v => setApprovalData({ ...approvalData, noticePeriod: v })} />
                </div>
                <div style={{ marginTop: "20px" }}>
                  <label style={labelStyle}><FiMessageSquare /> Approval Notes</label>
                  <textarea value={approvalData.notes} onChange={e => setApprovalData({ ...approvalData, notes: e.target.value })} style={textareaStyle} placeholder="Enter any additional notes..." />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "30px" }}>
                  <button onClick={() => setShowApprovalForm(false)} style={ghostButtonStyle}>Cancel</button>
                  <button onClick={handleSubmitApproval} style={primaryButtonStyle}>Submit Approval</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showDropReason && (
        <div style={dropOverlayStyle}>
          <div style={dropBoxStyle}>
            <h3>Drop Applicant</h3>
            <textarea rows="4" placeholder="Enter reason for dropping..." value={dropReason} onChange={e => setDropReason(e.target.value)} style={textareaStyle} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowDropReason(false)} style={ghostButtonStyle}>Cancel</button>
              <button onClick={handleDropSubmit} style={{ ...primaryButtonStyle, background: '#ef4444' }}>Confirm Drop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FormGroup = ({ label, icon, value, onChange, isNumeric = false, type = "text", optional = false, ...props }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={labelStyle}>{icon} {label} {optional ? <span style={{ fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>(Optional)</span> : '*'}</label>
    <input
      type={type}
      value={value}
      onChange={e => {
        const newValue = e.target.value;
        if (isNumeric) {
          // Allow only numbers and optional decimal point
          if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
            onChange(newValue);
          }
        } else {
          onChange(newValue);
        }
      }}
      style={inputStyle}
      placeholder={type !== "date" ? `Enter ${label}` : ""}
      {...props}
    />
  </div>
);

// --- Styled Objects ---
const labelStyle = { color: COLORS.text, fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', textTransform: 'none' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${COLORS.borderTeal}`, fontSize: '15px', boxSizing: 'border-box' };
const textareaStyle = { ...inputStyle, height: '80px', resize: 'none' };
const primaryButtonStyle = { padding: '12px 24px', background: COLORS.bgGradient, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' };
const ghostButtonStyle = { padding: '12px 24px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '15px' };
const revisionBox = { marginBottom: "20px", padding: "12px", background: "#fff7ed", borderLeft: `5px solid #f97316`, borderRadius: "8px", fontSize: '15px', color: '#9a3412' };
const actionButtonStyle = (active, color) => ({
  display: 'flex', alignItems: 'center', gap: '8px', padding: "12px 24px",
  background: active ? color : '#e2e8f0', color: '#fff', borderRadius: '8px',
  border: "none", cursor: active ? "pointer" : "not-allowed", fontWeight: '700',
  boxShadow: 'none', opacity: active ? 1 : 0.6, fontSize: '15px'
});
const dropOverlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, backdropFilter: 'blur(4px)' };
const dropBoxStyle = { background: "#fff", padding: "30px", width: "450px", borderRadius: "8px", boxShadow: 'none' };

