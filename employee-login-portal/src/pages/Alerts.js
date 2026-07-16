import React from "react";
import "./Alerts.css";   // 👈 add this

function Alerts({ alerts }) {
  return (
    <div className="alerts-container">
      {alerts.map((msg, index) => (
        <div key={index} className="alert-item">
          {msg}
        </div>
      ))}
    </div>
  );
}

export default Alerts;
