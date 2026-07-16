// PublicExitInterviewForm.js

import React, { useState, useEffect } from "react";
import axios from "axios";

// --- Configuration ---
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PUBLIC_API = `${API_BASE_URL}/external/exit-management`;

function PublicExitInterviewForm() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("pending");

  // Dynamic questions & answers
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const [formInfo, setFormInfo] = useState({ id: null, employeeId: "" });

  // Add custom scrollbar and focus styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .exit-interview-container::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
      }
      .exit-interview-container::-webkit-scrollbar-track {
        background: #f1f5f9 !important;
        border-radius: 4px !important;
      }
      .exit-interview-container::-webkit-scrollbar-thumb {
        background: #cbd5e1 !important;
        border-radius: 4px !important;
        border: 1px solid #f1f5f9 !important;
      }
      .exit-interview-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8 !important;
      }
      .exit-interview-container::-webkit-scrollbar-corner {
        background: #f1f5f9 !important;
      }
      .exit-interview-container input:focus,
      .exit-interview-container textarea:focus,
      .exit-interview-container select:focus {
        outline: none !important;
        box-shadow: none !important;
        border-color: #cbd5e1 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load token then form (questions come back with the form, scoped to the employee's tenant)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (!urlToken) {
      setErrorMessage("Missing or invalid token.");
      setSubmissionStatus("error");
      setLoading(false);
      return;
    }

    setToken(urlToken);
    fetchForm(urlToken);
  }, []);

  // Load the main form — response now includes { data, questions } scoped to the employee's tenant
  const fetchForm = async (urlToken) => {
    try {
      const res = await axios.get(`${PUBLIC_API}/feedback/${urlToken}`);
      const data = res.data?.data;
      const qs = res.data?.questions || [];

      if (!data?.id) {
        setErrorMessage("Invalid feedback link.");
        setSubmissionStatus("error");
      } else if (data.exitInterviewStatus === "COMPLETED") {
        setErrorMessage("This feedback has already been submitted. The link is now expired.");
        setSubmissionStatus("expired");
      } else {
        setFormInfo({ id: data.id, employeeId: data.employeeId });

        // Normalize type to uppercase so comparisons always work regardless of how admin saved it
        const normalizedQs = qs.map((q) => ({ ...q, type: (q.type || "TEXT").toUpperCase() }));
        setQuestions(normalizedQs);
        const initial = {};
        normalizedQs.forEach((q) => { initial[q.id] = ""; });
        setAnswers(initial);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message;
      if (errorMsg === "FEEDBACK_ALREADY_SUBMITTED") {
        setErrorMessage("This feedback has already been submitted. The link is now expired.");
        setSubmissionStatus("expired");
      } else {
        setErrorMessage("Unable to load form.");
        setSubmissionStatus("error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await axios.post(
        `${PUBLIC_API}/${formInfo.id}/submit-feedback`,
        {
          token: token,
          answers: answers,
        }
      );

      setSubmissionStatus("success");
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message;
      if (errorMsg === "FEEDBACK_ALREADY_SUBMITTED") {
        setErrorMessage("This feedback has already been submitted.");
        setSubmissionStatus("expired");
      } else {
        setErrorMessage("Error submitting feedback.");
        setSubmissionStatus("error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="exit-interview-container" style={{ ...containerStyle, fontSize: "15px" }}>Loading...</div>;

  if (submissionStatus === "expired")
    return (
      <div className="exit-interview-container" style={containerStyle}>
        <h2 style={{ color: "#d97706", fontSize: "30px", fontWeight: "800", marginBottom: "16px" }}>Link Expired</h2>
        <p style={{ fontSize: "15px" }}>{errorMessage}</p>
      </div>
    );

  if (submissionStatus === "error")
    return (
      <div className="exit-interview-container" style={containerStyle}>
        <h2 style={{ color: "red", fontSize: "30px", fontWeight: "800", marginBottom: "16px" }}>Error</h2>
        <p style={{ fontSize: "15px" }}>{errorMessage}</p>
      </div>
    );
  if (submissionStatus === "success")
    return (
      <div className="exit-interview-container" style={containerStyle}>
        <h2 style={{ color: "green", fontSize: "30px", fontWeight: "800", marginBottom: "16px" }}>Thank You!</h2>
        <p style={{ fontSize: "15px" }}>Your feedback was submitted successfully.</p>
      </div>
    );



  return (
    <div className="exit-interview-container" style={containerStyle}>
      <h2 style={titleStyle}>Exit Interview Feedback</h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        {questions.map((q) => (
          <div key={q.id} style={questionGroupStyle}>
            <label style={labelStyle}>{q.label}</label>

            {q.type === "TEXT" && (
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  maxLength={200}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  style={inputStyle}
                />
                <div style={{
                  textAlign: "right",
                  fontSize: "15px",
                  color: "#6b7280",
                  marginTop: "4px"
                }}>
                  {(answers[q.id] || "").length}/200
                </div>
              </div>
            )}

            {q.type === "TEXTAREA" && (
              <div style={{ position: "relative" }}>
                <textarea
                  maxLength={500}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  style={textAreaStyle}
                />
                <div style={{
                  textAlign: "right",
                  fontSize: "15px",
                  color: "#6b7280",
                  marginTop: "4px"
                }}>
                  {(answers[q.id] || "").length}/500
                </div>
              </div>
            )}

            {q.type === "RATING" && (
              <select
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
                style={selectStyle}
              >
                <option value="">-- Select --</option>
                <option value="1">1 - Very Poor</option>
                <option value="2">2 - Poor</option>
                <option value="3">3 - Average</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            )}

            {/* Fallback: if type is not one of the known types, render a text input */}
            {!["TEXT", "TEXTAREA", "RATING", "YESNO"].includes(q.type) && (
              <input
                type="text"
                maxLength={200}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                style={inputStyle}
              />
            )}

            {q.type === "YESNO" && (
              <select
                value={answers[q.id] ?? ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
                style={selectStyle}
                required
              >
                <option value="">-- Select --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            )}

          </div>
        ))}


        <button type="submit" style={submitBtnStyle}>
          Submit Feedback
        </button>
      </form>
    </div>
  );
}

// Styles
const containerStyle = {
  maxWidth: "750px",
  margin: "60px auto",
  padding: "40px",
  backgroundColor: "transparent",
  borderRadius: "0",
  boxShadow: "none",
  overflowY: "auto",
  overflowX: "hidden",
  maxHeight: "calc(100vh - 120px)",
  scrollbarWidth: "thin",
  msOverflowStyle: "thin",
};

const titleStyle = {
  fontSize: "30px",
  fontWeight: "800",
  color: "#1f2937",
  marginBottom: "32px",
  textAlign: "left",
  borderBottom: "2px solid #f3f4f6",
  paddingBottom: "16px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const questionGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  fontWeight: "600",
  fontSize: "15px",
  color: "#334155",
  marginBottom: "4px",
};

const commonInputStyle = {
  width: "100%",
  padding: "14px 20px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
  backgroundColor: "#f8fafc",
  color: "#1e293b",
  transition: "all 0.2s ease-in-out",
};

const inputStyle = {
  ...commonInputStyle,
};

const selectStyle = {
  ...commonInputStyle,
  height: "54px",
  padding: "0 45px 0 20px",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  backgroundSize: "20px",
};

const textAreaStyle = {
  ...commonInputStyle,
  minHeight: "140px",
  resize: "vertical",
  lineHeight: "1.5",
};

const submitBtnStyle = {
  marginTop: "20px",
  padding: "14px",
  background: "#1f6feb",
  color: "#fff",
  borderRadius: "8px",
  border: "none",
  fontWeight: "600",
  fontSize: "15px",
  cursor: "pointer",
  transition: "background 0.2s",
};

export default PublicExitInterviewForm;
