import React, { useState, useEffect } from "react";
import api from "../api";
import "./DailyEntryForm.css";

/* ─── helpers ─────────────────────────────────────────────── */
const getNow12h = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
};

const to24 = (timeStr) => {
  if (!timeStr) return null;
  const [time, period] = timeStr.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

const calcHours = (login, logout) => {
  const s = to24(login);
  const e = to24(logout);
  if (s === null || e === null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return parseFloat((diff / 60).toFixed(2));
};

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

/* ─── work-location options ────────────────────────────────── */
const WORK_LOCATIONS = ["WFH", "IN OFFICE", "CLIENT SITE"];

const WL_COLORS = {
  WFH: { bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", shadow: "rgba(99,102,241,0.35)" },
  "IN OFFICE": { bg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", shadow: "rgba(14,165,233,0.35)" },
  "CLIENT SITE": { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", shadow: "rgba(16,185,129,0.35)" },
};

/* ─── component ────────────────────────────────────────────── */
function DailyEntryForm({ date, initialData, onAlert, onClose, onSuccess, readOnly }) {
  const [entryId, setEntryId] = useState(initialData?.id || null);
  const [client, setClient] = useState(initialData?.clientId || "");
  const [project, setProject] = useState(initialData?.projectId || "");
  const [allocatedCustomers, setAllocatedCustomers] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loginTime, setLoginTime] = useState(initialData?.loginTime || "");
  const [logoutTime, setLogoutTime] = useState(initialData?.logoutTime || "");
  const [loginWorkLocation, setLoginWorkLocation] = useState(initialData?.loginWorkLocation || initialData?.workLocation || "");
  const [logoutWorkLocation, setLogoutWorkLocation] = useState(initialData?.logoutWorkLocation || "");

  const [totalHours, setTotalHours] = useState(initialData?.totalHours || 0);
  const [remarks, setRemarks] = useState(initialData?.remarks || "");
  const [errors, setErrors] = useState({});
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    if (shouldShake) {
      const timer = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShake]);

  const employeeId = sessionStorage.getItem("employeeId");

  const isLogoutFlow = !readOnly && initialData?.status === "LOGIN_SUBMITTED";
  const isFullySubmitted = readOnly || initialData?.status === "SUBMITTED";

  /* derived */
  const selectedClient = clients.find((c) => c.customerId === parseInt(client));
  const selectedProject = projects.find((p) => p.projectId === parseInt(project));

  /* ── recalc total hours whenever times change ── */
  useEffect(() => {
    if (loginTime && logoutTime) {
      setTotalHours(calcHours(loginTime, logoutTime));
    } else {
      setTotalHours(0);
    }
  }, [loginTime, logoutTime]);

  /* ── fetch clients & projects ── */
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token || !date) return;

    if (!initialData) {
      setClient("");
      setProject("");
    }

    api
      .get(`/allocations/employee/${employeeId}/date/${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data || [];
        const uniqueClients = [
          ...new Map(
            data.map((i) => [i.customerId, { customerId: i.customerId, customerName: i.customerName }])
          ).values(),
        ];
        setClients(uniqueClients);
        setAllocatedCustomers(uniqueClients);
        setProjects(
          [
            ...new Map(
              data.map((p) => [p.projectId, { projectId: p.projectId, projectName: p.projectName, customerId: p.customerId }])
            ).values(),
          ]
        );
      })
      .catch((err) => {
        console.error("Allocation fetch failed:", err);
        setClients([]);
        setAllocatedCustomers([]);
        setProjects([]);
      });
  }, [date, initialData]);

  /* ── repopulate on edit ── */
  useEffect(() => {
    if (initialData) {
      setEntryId(initialData.id || null);
      setClient(initialData.clientId || initialData.client || "");
      setProject(initialData.projectId || initialData.project || "");
      setRemarks(initialData.remarks || "");
      setLoginTime(initialData.loginTime || "");
      setLogoutTime(initialData.logoutTime || "");
      setTotalHours(initialData.totalHours || 0);
      setLoginWorkLocation(initialData.loginWorkLocation || initialData.workLocation || "");
      setLogoutWorkLocation(initialData.logoutWorkLocation || "");
    } else {
      setEntryId(null);
      setClient("");
      setProject("");
      setLoginTime("");
      setLogoutTime("");
      setTotalHours(0);
      setRemarks("");
      setLoginWorkLocation("");
      setLogoutWorkLocation("");
      setErrors({});
    }
  }, [initialData]);

  /* ── capture handlers ── */
  const captureLogin = () => {
    const t = getNow12h();
    setLoginTime(t);
    setErrors((prev) => ({ ...prev, loginTime: "" }));
  };

  const captureLogout = () => {
    const t = getNow12h();
    const totalHrs = calcHours(loginTime, t);
    if (totalHrs < 9) {
      const proceed = window.confirm("You are submitting the timesheet without completing the 9 hours. Do you want to proceed?");
      if (!proceed) return;
    }
    setLogoutTime(t);
    setErrors((prev) => ({ ...prev, logoutTime: "" }));
  };

  /* ── submit handler ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (isFullySubmitted) {
      onClose();
      return;
    }

    if (isLogoutFlow) {
      // STEP 2: LOGOUT SUBMISSION
      if (!logoutTime) newErrors.logoutTime = "Please capture Logout Time.";
      if (!logoutWorkLocation) newErrors.logoutWorkLocation = "Select Logout Work Location.";

      const loginMins = to24(loginTime);
      const logoutMins = to24(logoutTime);

      if (loginMins !== null && logoutMins !== null) {
        if (logoutMins < loginMins) {
          newErrors.logoutTime = "Logout Time must be greater than Login Time.";
        }
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      try {
        const payload = {
          date: String(date),
          clientId: client,
          clientName: selectedClient?.customerName || initialData?.clientName || "",
          projectId: project,
          projectName: selectedProject?.projectName || initialData?.projectName || "",
          loginTime,
          logoutTime,
          totalHours: calcHours(loginTime, logoutTime),
          remarks,
          workLocation: loginWorkLocation, // Map original field to login location
          loginWorkLocation,
          logoutWorkLocation,
          status: "SUBMITTED",
        };

        await api.put(`/daily-entry/update/${entryId}`, payload, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        });

        alert("Attendance submission complete!");
        onSuccess(date);
        onClose();
      } catch (err) {
        console.error(err);
        onAlert(
          <div style={{ color: "#721c24", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", padding: "10px", borderRadius: "5px" }}>
            ⚠️ Error submitting logout details. {err.response?.data || "Please try again."}
          </div>
        );
      }
    } else {
      // STEP 1: LOGIN SUBMISSION
      if (!loginWorkLocation) newErrors.loginWorkLocation = "Select Login Work Location.";
      if (!client) newErrors.client = "Please select a client.";
      if (!project) newErrors.project = "Please select a project.";
      if (!loginTime) newErrors.loginTime = "Please capture Login Time.";

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      try {
        const isValidId = entryId && !isNaN(entryId) && !entryId.toString().startsWith("empty");
        const url = isValidId ? `/daily-entry/update/${entryId}` : `/daily-entry/submit/${employeeId}`;
        const method = isValidId ? "put" : "post";

        const payload = {
          date: String(date),
          clientId: client,
          clientName: selectedClient?.customerName || "",
          projectId: project,
          projectName: selectedProject?.projectName || "",
          loginTime,
          logoutTime: "",
          totalHours: 0.0,
          remarks,
          workLocation: loginWorkLocation,
          loginWorkLocation,
          logoutWorkLocation: "",
          status: "LOGIN_SUBMITTED",
        };

        await api[method](url, payload, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        });

        alert("Login submitted successfully!");
        onSuccess(date);
        onClose();
      } catch (err) {
        console.error(err);
        onAlert(
          <div style={{ color: "#721c24", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", padding: "10px", borderRadius: "5px" }}>
            ⚠️ Error submitting login details. {err.response?.data || "Please try again."}
          </div>
        );
      }
    }
  };

  /* ── icons ── */
  const CaptureIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
    </svg>
  );

  /* ── styles ── */
  const timeBoxStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    background: "#f8fafc",
    height: "42px",
    transition: "border-color 0.2s ease",
  };

  const captureBtnStyle = {
    background: "#00B3A4",
    color: "white",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,179,164,0.3)",
    transition: "transform 0.2s ease",
  };

  /* ── render readonly field helper ── */
  const renderReadonlyField = (label, value) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <label className="daily-form-label" style={{ color: "#64748b" }}>{label}</label>
      <div style={{
        padding: "8px 12px",
        background: "#f1f5f9",
        color: "#334155",
        fontWeight: "700",
        fontSize: "13px",
        border: "1.5px solid #cbd5e1",
        borderRadius: "8px",
        height: "42px",
        display: "flex",
        alignItems: "center"
      }}>
        {value}
      </div>
    </div>
  );

  /* ── modal header title ── */
  let headerTitle = `Check In - ${formatDateForDisplay(date)}`;
  if (readOnly) {
    headerTitle = `View Entry - ${formatDateForDisplay(date)}`;
  } else if (isLogoutFlow) {
    headerTitle = `Check Out - ${formatDateForDisplay(date)}`;
  } else if (isFullySubmitted) {
    headerTitle = `Submitted Entry - ${formatDateForDisplay(date)}`;
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShouldShake(true);
    }
  };

  return (
    <div className="daily-modal-overlay" onClick={handleOverlayClick}>
      <div className={`daily-modal-content ${shouldShake ? "shake" : ""}`} style={{ maxWidth: "440px" }}>
        <button onClick={onClose} className="daily-modal-close">
          &times;
        </button>

        <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700", color: "#1e293b", textAlign: "center" }}>
          {headerTitle}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* ────────────────── 1. FULLY SUBMITTED STATE ────────────────── */}
          {isFullySubmitted && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {renderReadonlyField("Client", initialData?.clientName || "—")}
                {renderReadonlyField("Project", initialData?.projectName || "—")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {renderReadonlyField("Login Time", loginTime)}
                {renderReadonlyField("Login Location", loginWorkLocation)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {renderReadonlyField("Logout Time", logoutTime)}
                {renderReadonlyField("Logout Location", logoutWorkLocation)}
              </div>
              {renderReadonlyField("Total Hours Worked", `${totalHours} hrs`)}
              {remarks && renderReadonlyField("Remarks", remarks)}

              <button type="button" onClick={onClose} className="daily-cancel-btn" style={{ borderRadius: "8px", height: "44px", fontWeight: "700", width: "100%", marginTop: "6px" }}>
                Close
              </button>
            </>
          )}

          {/* ────────────────── 2. LOGOUT FLOW STATE ────────────────── */}
          {isLogoutFlow && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {renderReadonlyField("Client", initialData?.clientName || "—")}
                {renderReadonlyField("Project", initialData?.projectName || "—")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {renderReadonlyField("Login Time", loginTime)}
                {renderReadonlyField("Login Location", loginWorkLocation)}
              </div>

              {/* Logout Location Selection */}
              <div>
                <label className="daily-form-label">Logout Location <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  {WORK_LOCATIONS.map((loc) => {
                    const active = logoutWorkLocation === loc;
                    const col = WL_COLORS[loc];
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setLogoutWorkLocation(loc);
                          setErrors((prev) => ({ ...prev, logoutWorkLocation: "" }));
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: active ? "none" : "1.5px solid #e2e8f0",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "10.5px",
                          background: active ? col.bg : "white",
                          color: active ? "white" : "#64748b",
                          boxShadow: active ? `0 4px 10px ${col.shadow}` : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
                {errors.logoutWorkLocation && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>{errors.logoutWorkLocation}</div>}
              </div>

              {/* Logout Time Capture */}
              <div>
                <label className="daily-form-label">Logout Time <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={timeBoxStyle}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: logoutTime ? "#0d9488" : "#94a3b8" }}>
                    {logoutTime || "--:--"}
                  </span>
                  {!logoutTime && (
                    <button type="button" onClick={captureLogout} style={captureBtnStyle} title="Logout Time">
                      <CaptureIcon />
                    </button>
                  )}
                </div>
                {errors.logoutTime && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>{errors.logoutTime}</div>}
              </div>

              {/* Remarks */}
              <div>
                <label className="daily-form-label">Remarks</label>
                <input
                  type="text"
                  placeholder="Additional work notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="daily-form-input"
                  style={{ padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: logoutTime ? "1fr 1fr" : "1fr", gap: "12px", marginTop: "6px" }}>
                <button type="button" onClick={onClose} className="daily-cancel-btn" style={{ borderRadius: "8px", height: "44px", fontWeight: "700" }}>
                  Cancel
                </button>
                {logoutTime && (
                  <button type="submit" className="daily-submit-btn" style={{ borderRadius: "8px", height: "44px", fontWeight: "700" }}>
                    Submit
                  </button>
                )}
              </div>
            </>
          )}

          {/* ────────────────── 3. LOGIN FLOW STATE ────────────────── */}
          {!isLogoutFlow && !isFullySubmitted && (
            <>
              {/* Login Location Selection */}
              <div>
                <label className="daily-form-label">Login Location <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  {WORK_LOCATIONS.map((loc) => {
                    const active = loginWorkLocation === loc;
                    const col = WL_COLORS[loc];
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setLoginWorkLocation(loc);
                          setErrors((prev) => ({ ...prev, loginWorkLocation: "" }));
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: active ? "none" : "1.5px solid #e2e8f0",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "10.5px",
                          background: active ? col.bg : "white",
                          color: active ? "white" : "#64748b",
                          boxShadow: active ? `0 4px 10px ${col.shadow}` : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
                {errors.loginWorkLocation && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>{errors.loginWorkLocation}</div>}
              </div>

              {/* Client & Project Selects */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="daily-form-label">Client <span style={{ color: "#ef4444" }}>*</span></label>
                  <select
                    value={client}
                    onChange={(e) => { setClient(e.target.value); setProject(""); setErrors((prev) => ({ ...prev, client: "" })); }}
                    className="daily-form-select"
                    style={{ fontSize: "13px", padding: "8px" }}
                  >
                    <option value="">Select Client</option>
                    {allocatedCustomers.map((c) => <option key={c.customerId} value={c.customerId}>{c.customerName}</option>)}
                  </select>
                  {errors.client && <div style={{ color: "#ef4444", fontSize: "11px" }}>{errors.client}</div>}
                </div>
                <div>
                  <label className="daily-form-label">Project <span style={{ color: "#ef4444" }}>*</span></label>
                  <select
                    value={project}
                    onChange={(e) => { setProject(e.target.value); setErrors((prev) => ({ ...prev, project: "" })); }}
                    className="daily-form-select"
                    style={{ fontSize: "13px", padding: "8px" }}
                    disabled={!client}
                  >
                    <option value="">Select Project</option>
                    {projects.filter((p) => p.customerId === parseInt(client)).map((p) => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)}
                  </select>
                  {errors.project && <div style={{ color: "#ef4444", fontSize: "11px" }}>{errors.project}</div>}
                </div>
              </div>

              {/* Login Time Capture */}
              <div>
                <label className="daily-form-label">Login Time <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={timeBoxStyle}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: loginTime ? "#0d9488" : "#94a3b8" }}>
                    {loginTime || "--:--"}
                  </span>
                  {!loginTime && (
                    <button type="button" onClick={captureLogin} style={captureBtnStyle} title="Login Time">
                      <CaptureIcon />
                    </button>
                  )}
                </div>
                {errors.loginTime && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>{errors.loginTime}</div>}
              </div>

              {/* Remarks */}
              <div>
                <label className="daily-form-label">Remarks</label>
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="daily-form-input"
                  style={{ padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: loginTime ? "1fr 1fr" : "1fr", gap: "12px", marginTop: "6px" }}>
                <button type="button" onClick={onClose} className="daily-cancel-btn" style={{ borderRadius: "8px", height: "44px", fontWeight: "700" }}>
                  Cancel
                </button>
                {loginTime && (
                  <button type="submit" className="daily-submit-btn" style={{ borderRadius: "8px", height: "44px", fontWeight: "700" }}>
                    Submit
                  </button>
                )}
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  );
}

export default DailyEntryForm;
