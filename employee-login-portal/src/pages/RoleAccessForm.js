import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/v1/roles/save";

export default function RoleAccessForm() {
  const [roleName, setRoleName] = useState("HR");
  const [employeeIds, setEmployeeIds] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeIds.trim()) {
      setStatus("Please enter at least one employee ID.");
      return;
    }

    // Convert comma-separated string → array
    const idsArray = employeeIds.split(",").map((id) => id.trim());

    try {
      await axios.post(
        API_URL,
        {},
        {
          params: {
            roleName: roleName,
            employeeIds: idsArray,
          },
        }
      );

      setStatus("Role access saved successfully.");
      setEmployeeIds("");
    } catch (error) {
      setStatus("Error: " + error.message);
    }
  };

  return (
    <div style={{ width: "430px", margin: "20px auto" }}>
      <h3>Assign Employee IDs to Roles</h3>

      <form onSubmit={handleSubmit}>
        {/* ROLE DROPDOWN */}
        <label>Choose Role:</label>
        <select
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
        >
          <option value="HR">HR</option>
          <option value="MANAGER">MANAGER</option>
          <option value="FINANCE">FINANCE</option>
          <option value="ADMIN">ADMIN</option>
          <option value="REVIEWER">REVIEWER</option>
          <option value="AM">AM</option>
        </select>

        {/* EMPLOYEE ID INPUT */}
        <label>Enter Employee IDs (comma separated):</label>
        <input
          type="text"
          placeholder="Ex: H100118,H100116,H100120"
          value={employeeIds}
          onChange={(e) => setEmployeeIds(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
        />

        <button type="submit">Save</button>
      </form>

      {status && <p style={{ marginTop: "10px" }}>{status}</p>}
    </div>
  );
}
