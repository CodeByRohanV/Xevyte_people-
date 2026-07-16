import React, { useState, useEffect, useCallback } from "react";
import {
  FiUser, FiPhone, FiMail, FiMapPin, FiBriefcase,
  FiFileText, FiDownload, FiDollarSign, FiMessageSquare, FiX
} from "react-icons/fi";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PREONBOARDING_API = `${API_BASE_URL}/v1/preonboarding`;

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



function FileBadge({ file }) {
  const [showPreview, setShowPreview] = useState(false);

  if (!file || !file.base64 || !file.fileName) return <span style={{ color: '#94a3b8' }}>No file uploaded</span>;

  const downloadFile = (e) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = `data:${file.fileType || 'application/octet-stream'};base64,${file.base64}`;
    a.download = file.fileName;
    a.click();
  };

  const closePreview = () => setShowPreview(false);

  return (
    <>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={() => setShowPreview(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
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
          onClick={downloadFile}
          style={{
            display: "inline-flex",
            alignItems: "center",
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
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.shadowTeal}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 2px 6px ${COLORS.shadowTeal}`;
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
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
          }}
          onClick={closePreview}
        >
          <div
            style={{
              backgroundColor: "white",
              width: "100%",
              height: "100%",
              maxWidth: "100%",
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
                Document Preview: {file.fileName}
              </h3>
              <button
                onClick={closePreview}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "50%",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <FiX size={24} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: "#f1f5f9",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {(file.fileName.toLowerCase().endsWith(".pdf") ||
                file.fileType === "application/pdf") ? (
                <iframe
                  src={`data:${file.fileType || 'application/pdf'};base64,${file.base64}`}
                  title="PDF Preview"
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "20px",
                    overflow: "auto",
                  }}
                >
                  <img
                    src={`data:${file.fileType || "image/jpeg"};base64,${file.base64}`}
                    alt="Document Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
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
                backgroundColor: "#f8fafc",
              }}
            >
              <button
                onClick={closePreview}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  background: COLORS.bgGradient,
                  color: "white",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "none",
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value }) {
  return (
    <div style={fieldRowStyle}>
      <div style={{ flex: 1 }}>
        <label style={fieldLabelStyle}>{label}</label>
        <div style={fieldValueStyle}>{value || "—"}</div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={sectionStyle}>
      <h3 style={{ ...sectionTitleStyle, color: '#fff' }}>{title}</h3>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

export default function HRViewPreOnboardingDetails({ externalApplicantId, onClose, readOnly = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${PREONBOARDING_API}/${id}`);
      const data = await res.json();
      setData(data);
    } catch (err) { setError("Failed to fetch details."); }
    setLoading(false);
  };

  useEffect(() => { if (externalApplicantId) fetchData(externalApplicantId); }, [externalApplicantId]);



  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return isNaN(d) ? dateString : `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };





  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: COLORS.text }}>Loading Details...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error || "No data found."}</div>;

  return (
    <div style={{ background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Section title="Personal Information" icon={<FiUser />}>

          <Field label="First Name" value={data.personal?.firstName} />
          <Field label="Last Name" value={data.personal?.lastName} />
          <Field label="Gender" value={data.personal?.gender} />
          <Field label="Date of Birth" value={formatDate(data.personal?.dateOfBirth)} />
          <Field label="Personal Email" value={data.personal?.personalEmail} />
          <Field label="Mobile Number" value={data.personal?.mobileNumber} />
          <Field label="Alternate Mobile" value={data.personal?.alternateMobileNumber} />
          <Field label="Blood Group" value={data.personal?.bloodGroup} />
          <Field label="Father Name" value={data.personal?.fatherName} />
          <Field label="Mother Name" value={data.personal?.motherName} />
          <Field label="Marital Status" value={data.personal?.maritalStatus} />
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

          <Field label="Passport Photo" value={<FileBadge file={data.personal?.passportPhoto} />} />
        </Section>


        <div>
          <Section title="Present Address" icon={<FiMapPin />}>
            <Field label="Address Line"
              value={data.address?.present?.addressLine}
            />
            <Field label="City"
              value={data.address?.present?.city}
            />
            <Field label="State"
              value={data.address?.present?.state}
            />
            <Field label="Pincode"
              value={data.address?.present?.pincode}
            />
            <Field label="Landmark"
              value={data.address?.present?.landmark}
            />
            <Field label="Nearest Police Station"
              value={data.address?.present?.nearestPoliceStation}
            />
            <Field label="Contact Person Name"
              value={data.address?.present?.contactPersonName}
            />
            <Field label="Contact Person Relationship"
              value={data.address?.present?.contactPersonRelationship}
            />
            <Field label="Contact Person Mobile"
              value={data.address?.present?.contactPersonMobile}
            />
            <Field label="Duration of Stay"
              value={data.address?.present?.durationOfStay}
            />
            <Field
              label="Present Address Proof"
              value={<FileBadge file={data.address?.presentProofFile} />}
            />
          </Section>

          <Section title="Permanent Address" icon={<FiMapPin />}>
            <Field label="Address Line"
              value={data.address?.permanent?.addressLine}
            />
            <Field label="City"
              value={data.address?.permanent?.city}
            />
            <Field label="State"
              value={data.address?.permanent?.state}
            />
            <Field label="Pincode"
              value={data.address?.permanent?.pincode}
            />
            <Field label="Landmark"
              value={data.address?.permanent?.landmark}
            />
            <Field label="Nearest Police Station"
              value={data.address?.permanent?.nearestPoliceStation}
            />
            <Field label="Contact Person Name"
              value={data.address?.permanent?.contactPersonName}
            />
            <Field label="Contact Person Relationship"
              value={data.address?.permanent?.contactPersonRelationship}
            />
            <Field label="Contact Person Mobile"
              value={data.address?.permanent?.contactPersonMobile}
            />
            <Field label="Duration of Stay"
              value={data.address?.permanent?.durationOfStay}
            />
            <Field
              label="Permanent Address Proof"
              value={<FileBadge file={data.address?.permanentProofFile} />}
            />
          </Section>

        </div>
      </div>

      <Section title="Academic Records" icon={<FiBriefcase />}>

        {/* ================= SCHOOL ================= */}
        <h4 style={subHeaderStyle}>School (10th)</h4>
        <Field label="School Name" value={data.academic?.schoolName} />
        <Field label="Board" value={data.academic?.schoolBoard} />
        <Field label="Year of Passing" value={data.academic?.schoolYearOfPassing} />
        <Field label="Percentage / CGPA" value={data.academic?.schoolCgpaPercentage} />
        <Field label="School Marksheet" value={<FileBadge file={data.academic?.schoolMarksheet} />} />

        {/* ================= INTERMEDIATE ================= */}
        <h4 style={subHeaderStyle}>Intermediate / 12th</h4>

        <Field label="College Name" value={data.academic?.intermediateCollegeName} />
        <Field label="Board / Council" value={data.academic?.intermediateBoard} />
        <Field label="Year of Passing" value={data.academic?.intermediateYearOfPassing} />
        <Field label="Percentage / CGPA" value={data.academic?.intermediateCgpaPercentage} />
        <Field label="Intermediate Marksheet" value={<FileBadge file={data.academic?.intermediateMarksheet} />} />

        {/* ================= UG ================= */}
        <h4 style={subHeaderStyle}>Undergraduate (UG)</h4>
        <Field label="Degree Type" value={data.academic?.ugDegreeType} />
        <Field label="Course / Specialization" value={data.academic?.ugCourse} />
        <Field label="College Name" value={data.academic?.ugCollegeName} />
        <Field label="University" value={data.academic?.ugUniversity} />
        <Field label="Location" value={data.academic?.ugLocation} />
        <Field label="Study Type" value={data.academic?.ugStudyType} />
        <Field label="Year of Passing" value={data.academic?.ugYearOfPassing} />
        <Field label="Registration Number" value={data.academic?.ugRegistrationNumber} />
        <Field label="UG Marksheet" value={<FileBadge file={data.academic?.ugMarksheet} />} />
        <Field label="UG Degree Certificate" value={<FileBadge file={data.academic?.ugCertificate} />} />

        {/* ================= PG (OPTIONAL) ================= */}
        {(data.academic?.pgDegreeType ||
          data.academic?.pgCourse ||
          data.academic?.pgCollegeName) && (
            <>
              <h4 style={subHeaderStyle}>Postgraduate (PG)</h4>
              <Field label="Degree Type" value={data.academic?.pgDegreeType} />
              <Field label="Course / Specialization" value={data.academic?.pgCourse} />
              <Field label="College Name" value={data.academic?.pgCollegeName} />
              <Field label="University" value={data.academic?.pgUniversity} />
              <Field label="Location" value={data.academic?.pgLocation} />
              <Field label="Study Type" value={data.academic?.pgStudyType} />
              <Field label="Year of Passing" value={data.academic?.pgYearOfPassing} />
              <Field label="Registration Number" value={data.academic?.pgRegistrationNumber} />
              <Field label="PG Marksheet" value={<FileBadge file={data.academic?.pgMarksheet} />} />
              <Field label="PG Degree Certificate" value={<FileBadge file={data.academic?.pgCertificate} />} />
            </>
          )}
      </Section>

      {(data.workHistory && data.workHistory.length > 0) && (
        <Section title="Work History" icon={<FiBriefcase />}>
          {data.workHistory.map((wh, index) => (
            <div key={index} style={{ marginBottom: '24px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '16px' }}>

              <h4 style={{ color: COLORS.text, marginBottom: '12px' }}>
                Company {index + 1}: {wh.companyName}
              </h4>

              <Field label="Company Name" value={wh.companyName} />
              <Field label="Designation" value={wh.designation} />
              <Field label="Office Location" value={wh.officeLocation} />
              <Field label="Employee ID" value={wh.employeeId} />
              <Field label="Salary Drawn" value={wh.salaryDrawn} />
              <Field
                label="Tenure"
                value={`${formatDate(wh.dateOfJoining)} to ${formatDate(wh.dateOfRelieving)}`}
              />
              <Field label="Reason for Leaving" value={wh.reasonForLeaving} />



              <Field label="Reporting Manager Name" value={wh.reportingManagerName} />
              <Field label="Reporting Manager Email" value={wh.reportingManagerEmail} />
              <Field label="Reporting Manager Phone" value={wh.reportingManagerPhone} />



              <Field label="HR Manager Name" value={wh.hrManagerName} />
              <Field label="HR Manager Email" value={wh.hrManagerEmail} />
              <Field label="HR Manager Phone" value={wh.hrManagerPhone} />

              <Field label="Offer Letter" value={<FileBadge file={wh.offerLetter} />} />
              <Field label="Relieving Letter" value={<FileBadge file={wh.relievingLetter} />} />
              <Field label="Last 3m Payslips" value={<FileBadge file={wh.payslips} />} />
              <Field label="PF Service History" value={<FileBadge file={wh.pfServiceHistoryFile} />} />
              <Field label="Form 16" value={<FileBadge file={wh.form16} />} />


            </div>
          ))}
        </Section>
      )}

      <Section title="Identity & Documents" icon={<FiFileText />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <Field label="Aadhar" value={data.identity?.aadharNumber} />
            <Field label="Aadhar File" value={<FileBadge file={data.identity?.aadharFile} />} />
          </div>
          <div>
            <Field label="PAN" value={data.identity?.panNumber} />
            <Field label="PAN File" value={<FileBadge file={data.identity?.panFile} />} />
          </div>
          <div>
            <Field label="Passport" value={data.identity?.passportNumber} />
            <Field label="Passport File" value={<FileBadge file={data.identity?.passportFile} />} />
          </div>
          <div>
            <Field label="Voter ID" value={data.identity?.voterNumber} />
            <Field label="Voter File" value={<FileBadge file={data.identity?.voterFile} />} />
          </div>
          <div>
            <Field label="Driving License" value={data.identity?.drivingNumber} />
            <Field label="Driving File" value={<FileBadge file={data.identity?.drivingFile} />} />
          </div>
          <div>
            <Field label="Utility Bill" value={data.identity?.utilityNumber} />
            <Field label="Utility File" value={<FileBadge file={data.identity?.utilityFile} />} />
          </div>
          <div>
            <Field label="Resume" value={<FileBadge file={data.documents?.resumeFile} />} />
          </div>
        </div>
      </Section>
    </div>
  );
}

const InputField = ({ label, icon, value, onChange, type = "text" }) => (
  <div>
    <label style={labelStyle}>{icon} {label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
  </div>
);

const sectionStyle = { marginBottom: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: 'none' };
const sectionTitleStyle = { padding: '16px 20px', margin: 0, background: '#629AF1', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' };
const fieldRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' };
const fieldLabelStyle = { color: COLORS.text, fontWeight: 'normal', fontSize: '15px', textTransform: 'capitalize', marginBottom: '4px', display: 'block' };
const fieldValueStyle = { color: COLORS.text, fontWeight: 500, fontSize: '15px' };
const subHeaderStyle = { color: COLORS.text, margin: '15px 0 10px 0', fontSize: '15px', fontWeight: 'normal', borderLeft: '4px solid #629AF1', paddingLeft: '10px' };
const fileBadgeStyle = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: COLORS.bgTealLight, color: COLORS.primary, border: `1px solid ${COLORS.borderTeal}`, borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000, backdropFilter: 'blur(4px)' };
const modalBox = { background: "#fff", padding: "30px", width: "550px", borderRadius: "8px", boxShadow: 'none' };
const labelStyle = { color: COLORS.text, fontWeight: 'normal', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', textTransform: 'none' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${COLORS.borderTeal}`, outline: 'none', fontSize: '15px', color: COLORS.text };
const textareaStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${COLORS.borderTeal}`, outline: 'none', fontSize: '15px', resize: 'none', color: COLORS.text };
const primaryBtnStyle = { background: COLORS.bgGradient, color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' };