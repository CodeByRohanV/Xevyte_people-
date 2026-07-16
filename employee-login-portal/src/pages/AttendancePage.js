import React, { useState, useEffect } from 'react';
import { getPropperDate, parseISTDateStringToDatePickerValue } from '../utils/DateUtils';
import { useNavigate } from 'react-router-dom';
import DailyEntryForm from "./DailyEntryForm";
import Alerts from "./Alerts";
import './Dashboard.css';
import './AttendancePage.css'; // Ensure this is the updated CSS file
import Sidebar from './Sidebar.js';
import api from "../api";

// Import Attendance approval components
import Mngtimesheetds from './Mngtimesheetds'; // Attendance (Manager)
import Hrtimesheetds from './Hrtimesheetds'; // Attendance (HR)

function AttendancePage() {
  const employeeId = sessionStorage.getItem("employeeId");
  const navigate = useNavigate();

  const [canViewTasks, setCanViewTasks] = useState(false);
  // Initialize today using IST helper
  const todayIST = parseISTDateStringToDatePickerValue(getPropperDate());
  const [month, setMonth] = useState(todayIST.getMonth());
  const [year, setYear,] = useState(todayIST.getFullYear());
  // We keep 'today' as a Date object for comparisons later if needed, but based on IST.
  const today = todayIST;
  const [selectedDate, setSelectedDate] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [approvedLeaveDates, setApprovedLeaveDates] = useState({});
  const [submittedEntries, setSubmittedEntries] = useState({});
  const [frozenDates, setFrozenDates] = useState([]);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [viewOnlyDate, setViewOnlyDate] = useState(null);
  const token = sessionStorage.getItem("token"); // JWT token
  const [isEntriesLoaded, setIsEntriesLoaded] = useState(false);
  const [isHolidaysLoaded, setIsHolidaysLoaded] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('MyTimesheets');

  // Attendance Role State for My Tasks tab
  const [attendanceRole, setAttendanceRole] = useState(null);

  const handleMyTasksClick = () => {
    setActiveTab('MyTasks');
  };

  // Roles state is declared but not strictly needed for the links functionality, but kept for integrity
  const [roles, setRoles] = useState({
    manager: false, finance: false, hr: false, reviewer: false, admin: false, canViewTasks: false,
  });

  // --- Start of existing useEffect blocks (kept for integrity) ---

  // Fetch roles (used by manager/hr logic)
  useEffect(() => {
    if (employeeId && token) {
      api.get(`/access/assigned-ids/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          setRoles(res.data);
          // Set default attendance role for My Tasks tab
          if (res.data.manager) setAttendanceRole("manager");
          else if (res.data.hr) setAttendanceRole("hr");
        })
        .catch(err => console.error("Failed to fetch roles:", err));
    }
  }, [employeeId, token]);



  // Determine if tasks can be viewed (manager or hr)
  useEffect(() => {
    if (employeeId && token) {
      api.get(`/access/assigned-ids/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          const { manager, hr } = res.data;

          setCanViewTasks(manager || hr);
        })
        .catch(err => {
          console.error("Error fetching task visibility:", err);
          setCanViewTasks(false);
        });
    }
  }, [employeeId, token]);



  // Fetch frozen dates for the logged-in employee

  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchFrozenDates = async () => {
      try {

        const response = await api.get(`/daily-entry/frozen-dates/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFrozenDates(response.data);

      } catch (error) {
        console.error(error);
        setFrozenDates([]);
      }
    };

    fetchFrozenDates();
  }, [employeeId, token]);




  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchApprovedLeaves = async () => {
      try {

        const response = await api.get(`/leaves/approved-dates/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data || {};
        const normalizedDates = {};
        Object.entries(data).forEach(([date, type]) => {
          const d = new Date(date);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const isoDate = `${yyyy}-${mm}-${dd}`;
          normalizedDates[isoDate] = type; // Store leave type with date
        });
        setApprovedLeaveDates(normalizedDates);

      } catch (error) {
        console.error(error);
        setApprovedLeaveDates({});
      }
    };

    fetchApprovedLeaves();
  }, [employeeId, token]);



  const fetchSubmittedEntries = async () => {
    if (!employeeId || !token) return;

    try {

      const response = await api.get(`/daily-entry/employee/${employeeId}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const entriesMap = response.data.reduce((acc, entry) => {
        acc[entry.date] = entry;

        return acc;
      }, {});
      setSubmittedEntries(entriesMap);
      setIsEntriesLoaded(true);
    } catch (error) {
      console.error("Error fetching submitted timesheet entries:", error);
      setSubmittedEntries({});
      setIsEntriesLoaded(true);
    }
  };


  // Fetch submitted entries on initial load and when the month changes
  useEffect(() => {
    fetchSubmittedEntries();
  }, [employeeId, month, year]);

  // Auto-open today's attendance form (Login or Logout) on initial page load
  useEffect(() => {
    if (isEntriesLoaded && isHolidaysLoaded && !hasAutoOpened && activeTab === 'MyTimesheets') {
      const todayIso = fmt(today);
      const isApprovedLeave = approvedLeaveDates.hasOwnProperty(todayIso);
      const isFrozen = frozenDates.includes(todayIso);
      const dow = today.getDay();
      const isWeekendToday = dow === 0 || dow === 6;
      const isHolidayToday = holidays.includes(todayIso);

      if (!isApprovedLeave && !isFrozen && !isWeekendToday && !isHolidayToday) {
        const entryForToday = submittedEntries[todayIso] || null;
        const isFullySubmitted = entryForToday && (entryForToday.status === "SUBMITTED" || (!entryForToday.status && entryForToday.totalHours > 0));

        if (!isFullySubmitted) {
          setViewOnlyDate(null);
          setEntryToEdit(entryForToday);
          setSelectedDate(todayIso);
        }
      }
      setHasAutoOpened(true);
    }
  }, [isEntriesLoaded, isHolidaysLoaded, submittedEntries, approvedLeaveDates, frozenDates, activeTab, hasAutoOpened, today, holidays]);


  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchHolidaysByLocation = async () => {
      try {
        const response = await api.get(
          `/v1/holidays/employee/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // ✅ Filter out optional holidays - only include mandatory/public holidays
        const mandatoryHolidays = response.data.filter(h =>
          !h.holiday?.toLowerCase().includes("(optional)")
        );

        // Convert LocalDate to ISO (yyyy-MM-dd) format for calendar matching
        const holidayDates = mandatoryHolidays.map(h => {
          const d = new Date(h.date);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const da = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${da}`;
        });

        setHolidays(holidayDates);

      } catch (err) {
        console.error("Error fetching holidays by location:", err);
        setHolidays([]);
      } finally {
        setIsHolidaysLoaded(true);
      }
    };

    fetchHolidaysByLocation();
  }, [employeeId, token]);



  // --- End of existing useEffect blocks ---


  // --- End of existing useEffect blocks ---

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setMonth(now.getMonth());
    setYear(now.getFullYear());
  };

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const fmt = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handleCloseForm = () => {
    setSelectedDate(null);
    setEntryToEdit(null);
  };

  const handleSuccessfulSubmit = () => {
    setSelectedDate(null);
    setEntryToEdit(null);
    fetchSubmittedEntries();
  };

  const getStartDayOffset = (date) => {
    const dayOfWeek = date.getDay();
    return (dayOfWeek + 6) % 7; // Mon=0, Sun=6
  }
  const startDayOffset = getStartDayOffset(firstDay);

  // Stats calculation
  const totalDays = daysInMonth;
  const workedEntries = Object.values(submittedEntries).filter(e => {
    const d = new Date(e.date);
    // Include entries that are either submitted or active (auto-saved)
    return d.getMonth() === month && d.getFullYear() === year && (e.totalHours > 0 || e.loginTime);
  });
  const workedDaysCount = workedEntries.length;
  const submittedDaysCount = workedEntries.filter(e =>
    e.status === "SUBMITTED" || (!e.status && e.totalHours > 0)
  ).length;
  const leaveDaysCount = Object.keys(approvedLeaveDates).filter(dateStr => {
    const d = new Date(dateStr);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;
  const holidaysCount = holidays.filter(h => {
    const d = new Date(h);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  const renderMyTasksContent = () => {
    return (
      <div className="my-tasks-inner-container">
        <div className="role-switcher-container1" style={{ marginBottom: '20px' }}>
          <span className="role-switcher-label1">View As:</span>
          <div className="role-segment-group1">
            {roles.manager && (
              <label className={`role-segment ${attendanceRole === 'manager' ? 'active' : ''}`} onClick={() => setAttendanceRole('manager')}>
                <input type="radio" name="attendanceRole" checked={attendanceRole === 'manager'} readOnly />
                <span className="role-icon">M</span> Manager
              </label>
            )}
            {roles.hr && (
              <label className={`role-segment ${attendanceRole === 'hr' ? 'active' : ''}`} onClick={() => setAttendanceRole('hr')}>
                <input type="radio" name="attendanceRole" checked={attendanceRole === 'hr'} readOnly />
                <span className="role-icon">H</span> HR
              </label>
            )}
          </div>
        </div>
        {attendanceRole === 'manager' && <Mngtimesheetds />}
        {attendanceRole === 'hr' && <Hrtimesheetds />}
        {!attendanceRole && <p>You do not have administrative access for Attendance.</p>}
      </div>
    );
  };

  /* Icons */
  const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  const ListViewIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );

  return (
    <Sidebar>
      <div className="ts-page-wrapper">
        {/* Top Header Section */}
        <div className="ts-main-header">
          <div className="ts-title-section">
            <h1 className="ts-main-title">Attendance</h1>
            <p className="ts-subtitle">Track and manage your work hours</p>
          </div>
          <div className="ts-action-buttons">
            <button className="ts-btn-primary" onClick={() => navigate('/MyTimeSheets')} style={{ backgroundColor: '#00b3a4' }}>
              <CalendarIcon /> My Attendance
            </button>
            {canViewTasks && (
              <button className="ts-btn-primary" onClick={() => navigate('/MyTeam')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
                My Tasks
              </button>
            )}
          </div>
        </div>        {activeTab === 'MyTimesheets' ? (
          (!isEntriesLoaded || !isHolidaysLoaded) ? (
            <div className="ts-calendar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div className="ts-loading-spinner"></div>
                <span style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', fontFamily: "'Inter', sans-serif" }}>
                  Loading Attendance...
                </span>
              </div>
            </div>
          ) : (
            <div className="ts-calendar-container">
              {/* Navigation Controls */}
              <div className="ts-controls-bar">
                <div className="ts-month-picker-box">
                  <div className="ts-month-nav">
                    <button className="ts-nav-arrow" onClick={handlePrev}>&lsaquo;</button>
                    <span className="ts-current-month">
                      {new Date(year, month).toLocaleString("default", { month: "long" })} {year}
                    </span>
                    <button className="ts-nav-arrow" onClick={handleNext}>&rsaquo;</button>
                  </div>
                </div>

              </div>

              {/* Calendar Grid */}
              <div className="ts-grid-card">
                <div className="ts-grid-header">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
                    <div key={d} className="ts-header-cell">{d}</div>
                  ))}
                </div>
                <div className="ts-grid-body">
                  {Array(startDayOffset).fill(null).map((_, i) => (
                    <div key={`blank-${i}`} className="ts-day-cell empty" />
                  ))}
                  {days.map((date, i) => {
                    const iso = fmt(date);
                    const dow = date.getDay();
                    const isWeekend = dow === 0 || dow === 6;
                    const isHoliday = holidays.includes(iso);
                    const isApprovedLeave = approvedLeaveDates.hasOwnProperty(iso);
                    const entryForDate = submittedEntries[iso] || null;
                    const isSubmitted = entryForDate && (entryForDate.status === "SUBMITTED" || (!entryForDate.status && entryForDate.totalHours > 0));
                    const isBelowNineHours = isSubmitted && entryForDate && (entryForDate.totalHours < 9);
                    const hasEntry = !!entryForDate;
                    const isFuture = date > today;
                    const isToday = fmt(date) === fmt(today);
                    const isPast = !isToday && !isFuture;
                    const isFrozen = frozenDates.includes(iso);

                    const isBottomLeftCell = (startDayOffset + i) === (Math.ceil((startDayOffset + days.length) / 7) - 1) * 7;
                    const isBottomRightCell = i === days.length - 1 && date.getDay() === 0;

                    let statusLabel = "";
                    let statusClass = "workday";
                    let hoursText = "0:00";

                    if (isWeekend) {
                      statusLabel = "Weekend";
                      statusClass = "weekend";
                    } else if (isHoliday) {
                      statusLabel = "Holiday";
                      statusClass = "holiday";
                    } else if (isApprovedLeave) {
                      statusLabel = "Approved Leave";
                      statusClass = "leave";
                    } else if (isSubmitted) {
                      if (isBelowNineHours) {
                        statusLabel = "Submitted (< 9 hrs)";
                        statusClass = "below-nine";
                      } else {
                        statusLabel = "Submitted";
                        statusClass = "submitted";
                      }
                    } else if (isFrozen) {
                      statusLabel = "Frozen";
                      statusClass = "frozen";
                    }

                    if (hasEntry) {
                      const mins = Math.round((entryForDate.totalHours || 0) * 60);
                      hoursText = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
                    }

                    const onClickHandler = () => {
                       if (isWeekend || isHoliday) {
                         alert("Timesheet submission is not allowed on weekends or company holidays.");
                         return;
                       }
                      if (isApprovedLeave) {
                        alert("Leave has been approved for this day, so timesheet entry is not allowed.");
                      } else if (isFrozen) {
                        alert("Timesheet is frozen.");
                      } else if (isFuture) {
                        alert("Cannot fill timesheet for future dates.");
                      } else if (isPast) {
                        if (hasEntry) {
                          // Open in view-only mode for past submitted entries
                          setEntryToEdit(entryForDate);
                          setSelectedDate(iso);
                          setViewOnlyDate(iso);
                        } else {
                          alert("Timesheet can only be filled for today's date.");
                        }
                      } else {
                        // Today — editable
                        setViewOnlyDate(null);
                        setEntryToEdit(hasEntry ? entryForDate : null);
                        setSelectedDate(iso);
                      }
                    };

                    return (
                      <div
                        key={iso}
                        className={`ts-day-cell ${statusClass} ${isFuture ? 'future' : ''} ${isPast && !isSubmitted && !isWeekend && !isHoliday && !isApprovedLeave ? 'past-unfilled' : ''} ${isFrozen ? 'frozen-cell' : ''} ${isToday ? 'today-cell' : ''}`}
                        onClick={onClickHandler}
                        title={isFrozen ? "Timesheet Frozen" : isPast && !hasEntry && !isWeekend && !isHoliday && !isApprovedLeave ? "Past date — view only" : isToday ? "Today — click to fill" : ""}
                        style={{
                          ...(isFrozen ? { cursor: 'not-allowed' } : isPast && !hasEntry && !isWeekend && !isHoliday ? { cursor: 'not-allowed', opacity: 0.6 } : {}),
                          borderBottomLeftRadius: isBottomLeftCell ? '7px' : '0px',
                          borderBottomRightRadius: isBottomRightCell ? '7px' : '0px'
                        }}
                      >
                        <span className="ts-date-num">{date.getDate()}</span>
                        {isSubmitted && <div className="ts-hours-val">{hoursText}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Row: Legend on Left, Stats on Right */}
              <div className="ts-footer-row">
                <div className="ts-legend-card">
                  <div className="ts-legend-grid">
                    <div className="ts-legend-item"><span className="ts-dot weekend"></span> Weekends</div>
                    <div className="ts-legend-item"><span className="ts-dot holiday"></span> Holidays</div>
                    <div className="ts-legend-item"><span className="ts-dot leave"></span> Approved Leave</div>
                    <div className="ts-legend-item"><span className="ts-dot frozen"></span> Frozen</div>
                    <div className="ts-legend-item"><span className="ts-dot submitted"></span> Submitted</div>
                    <div className="ts-legend-item"><span className="ts-dot below-nine"></span> Submitted (&lt; 9 hrs)</div>
                  </div>
                </div>

                <div className="ts-stats-row">
                  <div className="ts-stat-card">
                    <div className="ts-stat-icon grey"><CalendarIcon /></div>
                    <div className="ts-stat-info">
                      <span className="ts-stat-label">Total Days</span>
                      <span className="ts-stat-value">{totalDays}</span>
                    </div>
                  </div>

                  <div className="ts-stat-card">
                    <div className="ts-stat-icon teal">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div className="ts-stat-info">
                      <span className="ts-stat-label">Present Days</span>
                      <span className="ts-stat-value">{submittedDaysCount}</span>
                    </div>
                  </div>
                  <div className="ts-stat-card">
                    <div className="ts-stat-icon purple">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>
                    </div>
                    <div className="ts-stat-info">
                      <span className="ts-stat-label">Leave Days</span>
                      <span className="ts-stat-value">{leaveDaysCount}</span>
                    </div>
                  </div>
                  <div className="ts-stat-card">
                    <div className="ts-stat-icon yellow">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    </div>
                    <div className="ts-stat-info">
                      <span className="ts-stat-label">Holidays</span>
                      <span className="ts-stat-value">{holidaysCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDate && (
                <DailyEntryForm
                  date={selectedDate}
                  initialData={entryToEdit}
                  readOnly={!!viewOnlyDate}
                  onAlert={(msg) => {
                    setAlerts((currentAlerts) => [...currentAlerts, msg]);
                    setTimeout(() => setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert !== msg)), 2000);
                  }}
                  onClose={() => { handleCloseForm(); setViewOnlyDate(null); }}
                  onSuccess={handleSuccessfulSubmit}
                />
              )}
              <Alerts alerts={alerts} />
            </div>
          )
        ) : (
          renderMyTasksContent()
        )}
      </div>
    </Sidebar>
  );
}

export default AttendancePage;