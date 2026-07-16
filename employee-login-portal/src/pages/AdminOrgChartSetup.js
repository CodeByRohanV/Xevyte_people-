import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminOrgChartSetup() {
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const dbColumns = [
    { key: "employeeId", label: "Employee ID" },
    { key: "designation", label: "Designation" },
    { key: "aadharNo", label: "Aadhar Number" },
    { key: "panNo", label: "PAN Number" },
    { key: "address", label: "Permanent Address" },
    { key: "presentAddress", label: "Present Address" },
    { key: "contactNo", label: "Contact Number" },
    { key: "workLocation", label: "Work Location" },
    {key: "personalMail", label: "Personal Email"},
    {key: "email", label: "Work Email"},
    {key: "emergencyContactNumber", label: "Emergency Contact No"},
    { key: "gender", label: "Gender" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "joiningDate", label: "Joining Date" },
    { key: "bloodGroup", label: "Blood Group" },
    { key: "noticePeriod", label: "Notice Period" },
    { key: "uanNumber", label: "UAN Number" },
    { key: "pfMemberId", label: "PF Member ID" },
    { key: "esiNumber", label: "ESI Number" },
    { key: "esiDispensary", label: "ESI Dispensary" }
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/org-chart-config/columns");
      setSelectedColumns(res.data || []);
    } catch (err) {
      console.error("Failed to load org chart config columns", err);
      setError("Failed to fetch current column configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleColumn = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(dbColumns.map((c) => c.key));
  };

  const handleClearAll = () => {
    setSelectedColumns([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.post("/org-chart-config/columns", selectedColumns);
      setMessage("Configuration saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Failed to save configuration", err);
      setError("Failed to save column configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Organization Chart Profile Config</h2>
      <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "24px" }}>
        Select the columns you want to expose on the Org Chart Profile details modal. By default, no columns are selected. Only checked fields will show up for users.
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading config...</div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <button onClick={handleSelectAll} style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.875rem", color: "#334155", cursor: "pointer" }}>Select All</button>
            <button onClick={handleClearAll} style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.875rem", color: "#334155", cursor: "pointer" }}>Clear All</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {dbColumns.map((col) => {
              const isChecked = selectedColumns.includes(col.key);
              return (
                <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid", borderColor: isChecked ? "#0bc5b0" : "#e2e8f0", background: isChecked ? "#f0fdfa" : "#fff", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s" }}>
                  <input type="checkbox" checked={isChecked} onChange={() => handleToggleColumn(col.key)} style={{ width: "16px", height: "16px", accentColor: "#0bc5b0" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: "500", color: isChecked ? "#0f766e" : "#334155" }}>{col.label}</span>
                </label>
              );
            })}
          </div>

          {error && <div style={{ color: "#ef4444", marginBottom: "16px", fontSize: "0.875rem" }}>{error}</div>}
          {message && <div style={{ color: "#10b981", marginBottom: "16px", fontSize: "0.875rem" }}>{message}</div>}

          <button onClick={handleSave} disabled={saving} style={{ padding: "12px 28px", background: "linear-gradient(135deg, #0bc5b0 0%, #0891b2 100%)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 12px rgba(11, 197, 176, 0.2)", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      )}
    </div>
  );
}
