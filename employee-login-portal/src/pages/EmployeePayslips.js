import React, { useState } from "react";
import { getPropperDate } from '../utils/DateUtils';
import api from "../api";
import Sidebar from "./Sidebar";
import { FiDollarSign, FiSearch, FiFileText } from "react-icons/fi";
import "./Payslips.css";

export default function EmployeePayslips() {
  const [month, setMonth] = useState(getPropperDate().slice(0, 7)); // YYYY-MM
  const [search, setSearch] = useState("");
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPayslips = async () => {
    if (!month) {
      setPayslips([]);
      return;
    }

    setLoading(true);

    try {
      const url = `/payslips?month=${encodeURIComponent(month)}${search ? `&searchName=${encodeURIComponent(search)}` : ""
        }`;

      const res = await api.get(url);
      setPayslips(res.data || []);
    } catch (err) {
      console.error(err);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar>
      <div className="payslips-main-container">
        <div className="payslips-content-wrapper">
          <div className="payslips-page-header">
            <div className="payslips-header-icon">
              <FiDollarSign />
            </div>
            <h1 className="payslips-header-title">Employee Payslip Records</h1>
          </div>

          <div className="payslip-card">
            <div className="month-year-controls" style={{ justifyContent: 'flex-start' }}>
              <div className="payslip-form-group" style={{ marginBottom: 0 }}>
                <input
                  placeholder="YYYY-MM (e.g. 2025-11)"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="payslip-input-field"
                  style={{ width: '220px' }}
                />
              </div>
              <div className="payslip-form-group" style={{ marginBottom: 0 }}>
                <input
                  placeholder="Search employee name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="payslip-input-field"
                  style={{ width: '250px' }}
                />
              </div>
              <button
                onClick={fetchPayslips}
                className="payslip-btn payslip-btn-primary"
              >
                <FiSearch /> Search
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : payslips.length > 0 ? (
              <div className="payslip-table-wrapper">
                <table className="payslip-main-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Month</th>
                      <th style={{ textAlign: 'right' }}>Basic (₹)</th>
                      <th style={{ textAlign: 'right' }}>Net Pay (₹)</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payslips.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '600' }}>{p.employeeId}</td>
                        <td style={{ fontWeight: '600', color: '#115e59' }}>{p.employeeName}</td>
                        <td>{p.monthYear}</td>
                        <td style={{ textAlign: 'right' }}>{p.basicSalary?.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#0d9488' }}>₹ {p.netPay?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <FiFileText style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }} />
                <p>No records found for the selected month.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
