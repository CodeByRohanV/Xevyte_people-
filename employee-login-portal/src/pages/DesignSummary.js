import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClaimsChart from './ClaimsChart';
import axios from 'axios';
import api from "../api";

import './DesignSummary.css';

function DesignSummary() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalClaims: 0,
    approved: 0,
    rejected: 0,
    paidAmount: 0
  });
  const [canViewTasks, setCanViewTasks] = useState(false);
  const employeeId = sessionStorage.getItem("employeeId");
  const token = sessionStorage.getItem("token"); // JWT token stored after login

  useEffect(() => {
    if (!employeeId || !token) return;

    // Fetch task visibility with JWT auth
    api.get(`/claims/assigned-ids/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

      .then(response => {
        const data = response.data;
        setCanViewTasks(data.canViewTasks === true);
      })
      .catch(err => {
        console.error("Error fetching task visibility:", err);
        setCanViewTasks(false);
      });

  }, [employeeId, token]);

  useEffect(() => {
    if (!employeeId || !token) return;

    // Fetch claim summary with JWT auth
    api.get(`/claims/summary/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

      .then(response => {
        const data = response.data;
        setSummary({
          totalClaims: data.totalClaims || 0,
          approved: data.approved || 0,
          rejected: data.rejected || 0,
          paidAmount: data.paidAmount || 0
        });
      })
      .catch(err => console.error("Error fetching summary:", err));
  }, [employeeId, token]);


  return (
    <div className="design-summary-container">
      {/* Summary Header Card */}
      {/* REDUNDANT HEADER REMOVED FOR CONSISTENCY */}

      {/* Chart Container */}
      <div className="chart-card">
        <ClaimsChart
          approved={summary.approved}
          rejected={summary.rejected}
          totalClaims={summary.totalClaims}
          paidAmount={summary.paidAmount}
        />
      </div>
    </div>
  );
}

export default DesignSummary;
