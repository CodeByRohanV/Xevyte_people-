import React, { useEffect, useState } from "react";
import { formatDateToIST } from '../utils/DateUtils';
import api from '../api';
import Sidebar from "./Sidebar.js";
import { FiMapPin, FiInfo, FiCheckCircle, FiStar } from 'react-icons/fi';
import './Holiday.css';

export default function HolidayList() {
  const [holidays, setHolidays] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  const currentYear = new Date().getFullYear();

  // ✅ Load default holidays based on EMPLOYEE WORK LOCATION
  useEffect(() => {
    loadEmployeeHolidays();
    loadAllLocations();
  }, []);

  // ✅ Load holidays for logged-in employee location
  const loadEmployeeHolidays = async () => {
    try {
      const employeeId = sessionStorage.getItem("employeeId");

      const res = await api.get(
        `/v1/holidays/employee/${employeeId}`
      );

      setHolidays(res.data || []);

      // ✅ Auto-set default dropdown to employee work location
      if (res.data.length > 0) {
        setSelectedLocation(res.data[0].location);
      }

    } catch (error) {
      console.error("Error loading holidays:", error);
    }
  };

  // ✅ Load all available locations for dropdown
  const loadAllLocations = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await api.get(
        "/v1/locations/all",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLocations(res.data || []);
    } catch (err) {
      console.error("Error loading locations:", err);
    }
  };


  // ✅ When user selects another location → load its holidays
  const handleLocationChange = async (location) => {
    setSelectedLocation(location);

    try {
      const res = await api.get(
        `/v1/holidays/by-location?location=${location}`
      );
      setHolidays(res.data || []);
    } catch (err) {
      console.error("Error loading selected location holidays:", err);
    }
  };

  // ✅ Helper to extract day and month for the DateBox
  const getDateParts = (dateStr) => {
    if (!dateStr) return { day: "", month: "" };
    const d = new Date(dateStr);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return {
      day: String(d.getDate()).padStart(2, "0"),
      month: monthNames[d.getMonth()]
    };
  };

  const formatDate = (dateStr) => {
    return formatDateToIST(dateStr);
  };

  // ✅ Remove "(Optional)" and fix encoding issues
  const cleanHolidayName = (name) => {
    if (!name) return "";
    let cleaned = name.replace(/\s*\(optional\)/gi, "").trim();
    // Fix encoding: Replace Replacement Character (\uFFFD) with normal apostrophe
    cleaned = cleaned.replace(/\uFFFD/g, "'");
    return cleaned;
  };

  // Filter holidays
  const mandatoryHolidays = holidays.filter(h => !h.holiday?.toLowerCase().includes("(optional)"));
  const optionalHolidays = holidays.filter(h => h.holiday?.toLowerCase().includes("(optional)"));

  return (
    <Sidebar>
      <div className="holiday-container">
        <div className="holiday-content-wrapper">

          {/* ✅ HEADER */}
          <div className="holiday-page-header">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h1 style={{ margin: 0, padding: 0, fontWeight: 'normal', fontSize: '30px', color: '#1F2937', fontFamily: "'Inter', sans-serif" }}>
                Holidays {currentYear}
              </h1>
              <p style={{ color: '#00b3a4', fontSize: '15px', margin: '5px 0 0 0', padding: 0, fontFamily: "'Inter', sans-serif" }}>
                View and track your mandatory and optional holidays
              </p>
            </div>

            {/* ✅ LOCATION SELECTOR */}
            <div className="location-wrapper">
              <select
                className="location-selector"
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.locationName}>
                    {loc.locationName}
                  </option>
                ))}
              </select>
              <FiMapPin className="location-icon" />
            </div>
          </div>

          <div className="holiday-grid">

            {/* ✅ MANDATORY HOLIDAYS CARD */}
            <div className="holiday-card">
              <div className="card-header">
                <h2 className="card-title">Mandatory Holidays</h2>
                <span className="badge badge-mandatory">{mandatoryHolidays.length} Days</span>
              </div>

              <ul className="holiday-list">
                {mandatoryHolidays.length > 0 ? (
                  mandatoryHolidays.map((h, index) => {
                    const { day, month } = getDateParts(h.date);
                    return (
                      <li className="holiday-item" key={`mandatory-${index}`}>
                        <div className="date-box">
                          <span className="date-month">{month}</span>
                          <span className="date-day-number">{day}</span>
                        </div>
                        <div className="holiday-info">
                          <h3 className="holiday-name">{cleanHolidayName(h.holiday)}</h3>
                          <div className="holiday-day">{h.day}</div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <div className="empty-state">No mandatory holidays found.</div>
                )}
              </ul>
            </div>

            {/* ✅ OPTIONAL HOLIDAYS CARD */}
            <div className="holiday-card">
              <div className="card-header">
                <h2 className="card-title">Optional Holidays</h2>
                <span className="badge badge-optional">{optionalHolidays.length} Days</span>
              </div>

              <ul className="holiday-list">
                {optionalHolidays.length > 0 ? (
                  optionalHolidays.map((h, index) => {
                    const { day, month } = getDateParts(h.date);
                    return (
                      <li className="holiday-item" key={`optional-${index}`}>
                        <div className="date-box">
                          <span className="date-month">{month}</span>
                          <span className="date-day-number">{day}</span>
                        </div>
                        <div className="holiday-info">
                          <h3 className="holiday-name">{cleanHolidayName(h.holiday)}</h3>
                          <div className="holiday-day">{h.day} • {formatDate(h.date)}</div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <div className="empty-state">No optional holidays found.</div>
                )}
              </ul>
            </div>

          </div>

          {/* ✅ FOOTER NOTE */}
          {optionalHolidays.length > 0 && (
            <div className="footer-note">
              <FiInfo className="info-icon" style={{ color: '#00B3A4' }} />
              <p style={{ margin: 0, color: '#00B3A4' }}>
                Employees may choose and avail any <strong>two</strong> holidays from the optional list.
              </p>
            </div>
          )}

        </div>
      </div>
    </Sidebar>
  );
}
