import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import './Dashboard.css';
import Sidebar from './Sidebar.js';
import api from "../api";
import bannerIllustration from '../assets/banner_illustration.png';

function Dashboard() {
  const navigate = useNavigate();

  // States
  const [greeting, setGreeting] = useState("Good Afternoon");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  const employeeId = sessionStorage.getItem("employeeId");
  const token = sessionStorage.getItem("token");
  const employeeName = sessionStorage.getItem("employeeName") || "Siva Kumar";

  const [totalHoursThisWeek, setTotalHoursThisWeek] = useState(0);
  const [targetPercentage, setTargetPercentage] = useState(0);
  const [upcomingHolidaysCount, setUpcomingHolidaysCount] = useState(0);
  const [nextHolidayStr, setNextHolidayStr] = useState("No upcoming holidays");
  const [upcomingHolidaysList, setUpcomingHolidaysList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  const [weeklyHoursData, setWeeklyHoursData] = useState([
    { name: 'Mon', hours: 0, isLogged: false },
    { name: 'Tue', hours: 0, isLogged: false },
    { name: 'Wed', hours: 0, isLogged: false },
    { name: 'Thu', hours: 0, isLogged: false },
    { name: 'Fri', hours: 0, isLogged: false },
    { name: 'Sat', hours: 0, isLogged: false },
    { name: 'Sun', hours: 0, isLogged: false },
  ]);

  // Determine greeting and date string in IST (Asia/Kolkata) timezone
  useEffect(() => {
    try {
      const hrsStr = new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' });
      const cleanHrsStr = hrsStr.replace(/[^0-9]/g, '');
      const hrs = parseInt(cleanHrsStr, 10);

      const determineGreeting = (h) => {
        if (h >= 5 && h < 12) return "Good Morning";       // 5:00 AM - 11:59 AM
        if (h >= 12 && h < 16) return "Good Afternoon";    // 12:00 PM - 3:59 PM
        if (h >= 16 && h < 21) return "Good Evening";      // 4:00 PM - 8:59 PM
        return "Welcome Back";                             // 9:00 PM - 4:59 AM
      };

      if (isNaN(hrs)) {
        setGreeting(determineGreeting(new Date().getHours()));
      } else {
        setGreeting(determineGreeting(hrs));
      }
    } catch (e) {
      console.error("Error setting greeting:", e);
      const determineGreeting = (h) => {
        if (h >= 5 && h < 12) return "Good Morning";       // 5:00 AM - 11:59 AM
        if (h >= 12 && h < 16) return "Good Afternoon";    // 12:00 PM - 3:59 PM
        if (h >= 16 && h < 21) return "Good Evening";      // 4:00 PM - 8:59 PM
        return "Welcome Back";                             // 9:00 PM - 4:59 AM
      };
      setGreeting(determineGreeting(new Date().getHours()));
    }

    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };
      setCurrentDateStr(new Date().toLocaleDateString('en-US', options));
    } catch (e) {
      console.error("Error setting date string:", e);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDateStr(new Date().toLocaleDateString('en-US', options));
    }

    const updateTime = () => {
      setCurrentTimeStr(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper to format fractional hours as human-friendly string (e.g. 1m, 8h 30m, 32h, 0h)
  const formatWeeklyHours = (hours) => {
    if (!hours || hours <= 0) return "0h";
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    if (mins > 0) return `${mins}m`;
    return "0h";
  };

  // Helper to extract date parts for Upcoming Holidays list widget (e.g. month: "JUN", day: "07", weekday: "Sun")
  const getHolidayDateParts = (dateStr) => {
    if (!dateStr) return { month: "", day: "", weekday: "" };
    const parts = dateStr.split("-");
    if (parts.length !== 3) return { month: "", day: "", weekday: "" };
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return {
      month: monthNames[date.getMonth()],
      day: String(date.getDate()).padStart(2, "0"),
      weekday: weekdayNames[date.getDay()]
    };
  };

  // Helper to cycle through background styling classes and icons for upcoming holidays list
  const getHolidayIconClass = (index) => {
    const cycle = [
      { color: "green", icon: "bi bi-calendar-event" },
      { color: "orange", icon: "bi bi-people" },
      { color: "purple", icon: "bi bi-mortarboard" },
      { color: "blue", icon: "bi bi-easel2" }
    ];
    return cycle[index % cycle.length];
  };

  // Helper to determine the holiday type display text
  const getHolidayType = (name) => {
    if (!name) return "Company Holiday";
    if (name.toLowerCase().includes("(optional)")) {
      return "Optional Holiday";
    }
    return "Company Holiday";
  };

  // Helper to format Date objects as dd-mm-yyyy
  const formatActivityDate = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return "";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper to get date parts in IST
  const getISTParts = () => {
    try {
      const now = new Date();
      const parts = {};
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
      }).formatToParts(now).forEach(({ type, value }) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        if (cleanValue) {
          parts[type] = parseInt(cleanValue, 10);
        }
      });
      if (parts.year && parts.month && parts.day) {
        return new Date(
          parts.year,
          parts.month - 1,
          parts.day,
          parts.hour || 0,
          parts.minute || 0,
          parts.second || 0
        );
      }
    } catch (err) {
      console.error("Error formatting/parsing IST date parts:", err);
    }
    return new Date();
  };

  const getISTWeekDates = () => {
    const today = getISTParts();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;

      dates.push({
        dateStr,
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        isFuture: d > today && d.toDateString() !== today.toDateString()
      });
    }
    return dates;
  };

  // Fetch submitted attendance entries and update weekly hours dynamically
  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchAttendanceData = async () => {
      try {
        const response = await api.get(`/daily-entry/employee/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const entries = response.data || [];
        const entriesMap = {};
        entries.forEach(entry => {
          entriesMap[entry.date] = entry;
        });

        const weekInfo = getISTWeekDates();
        let total = 0;

        const updatedWeeklyHours = weekInfo.map(day => {
          const entry = entriesMap[day.dateStr];
          const hours = entry ? entry.totalHours || 0 : 0;
          const isLogged = !!entry && (entry.totalHours > 0 || !!entry.loginTime);

          if (isLogged) {
            total += hours;
          }

          return {
            name: day.dayName,
            hours: hours,
            isLogged: isLogged
          };
        });

        setWeeklyHoursData(updatedWeeklyHours);

        const preciseTotal = Math.round(total * 1000) / 1000;
        setTotalHoursThisWeek(preciseTotal);

        const pct = Math.round((total / 40) * 100);
        setTargetPercentage(pct);

      } catch (err) {
        console.error("Failed to fetch daily entries for dashboard:", err);
      }
    };

    fetchAttendanceData();
  }, [employeeId, token]);

  // Fetch upcoming holidays dynamically
  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchHolidays = async () => {
      try {
        const res = await api.get(`/v1/holidays/employee/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = res.data || [];

        const cleanHolidayName = (name) => {
          if (!name) return "";
          let cleaned = name.replace(/\s*\(optional\)/gi, "").trim();
          cleaned = cleaned.replace(/\uFFFD/g, "'");
          return cleaned;
        };

        const todayIST = getISTParts();
        const currentYear = todayIST.getFullYear();
        const currentMonth = todayIST.getMonth(); // 0-indexed

        const y = todayIST.getFullYear();
        const m = String(todayIST.getMonth() + 1).padStart(2, "0");
        const day = String(todayIST.getDate()).padStart(2, "0");
        const todayStr = `${y}-${m}-${day}`;

        // Filter holidays in the current IST month that are >= today's date
        const currentMonthHolidays = list.filter(h => {
          if (!h.date) return false;
          const parts = h.date.split("-");
          if (parts.length !== 3) return false;
          const hYear = parseInt(parts[0], 10);
          const hMonth = parseInt(parts[1], 10) - 1; // 0-indexed

          const isSameMonth = hYear === currentYear && hMonth === currentMonth;
          const isUpcomingOrToday = h.date >= todayStr;

          return isSameMonth && isUpcomingOrToday;
        });

        setUpcomingHolidaysCount(currentMonthHolidays.length);

        // Find the next upcoming holiday overall (date >= todayStr)
        const upcomingOverall = list
          .filter(h => h.date && h.date >= todayStr)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (upcomingOverall.length > 0) {
          const nextH = upcomingOverall[0];
          setNextHolidayStr(`Next: ${cleanHolidayName(nextH.holiday)}`);
        } else {
          setNextHolidayStr("No upcoming holidays");
        }

        // Set the next 4 upcoming holidays overall in state
        setUpcomingHolidaysList(upcomingOverall.slice(0, 4));

      } catch (err) {
        console.error("Failed to fetch holidays for dashboard:", err);
      }
    };

    fetchHolidays();
  }, [employeeId, token]);

  // Fetch all recent activities dynamically
  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchAllActivities = async () => {
      const headers = { Authorization: `Bearer ${token}` };

      const endpoints = [
        api.get(`/claims/history/${employeeId}`, { headers }),
        api.get(`/goals/employee/${employeeId}`, { headers }),
        Promise.resolve({ data: [] }), // api.get(`/lms/employee/${employeeId}`, { headers }),
        api.get(`/leaves/employee/${employeeId}`, { headers }),
        api.get(`/daily-entry/employee/${employeeId}`, { headers }),
        api.get(`/tickets/my-tickets/${employeeId}`, { headers }),
        api.get(`/travel/employee/all/${employeeId}`, { headers })
      ];

      try {
        const results = await Promise.allSettled(endpoints);
        let aggregated = [];

        // Helper to format/clean names
        const cleanName = (name) => {
          if (!name) return "";
          return name.replace(/\s*\(optional\)/gi, "").trim().replace(/\uFFFD/g, "'");
        };

        // 1. Claims (Reimbursements)
        if (results[0].status === "fulfilled" && results[0].value.data) {
          const claims = results[0].value.data;
          claims.forEach((claim, idx) => {
            const dateVal = new Date(claim.submittedDate || claim.expenseDate || Date.now());
            aggregated.push({
              id: `claim-${claim.id || idx}`,
              activity: `Claim ${claim.status ? claim.status.toLowerCase() : "submitted"}`,
              category: "Reimbursement",
              by: employeeName,
              date: formatActivityDate(dateVal),
              details: `Expense for ${claim.category || "reimbursement"} - Rs.${claim.amount}`,
              rawDate: dateVal
            });
          });
        }

        // 2. Performance Goals
        if (results[1].status === "fulfilled" && results[1].value.data) {
          const goals = results[1].value.data;
          goals.forEach((goal, idx) => {
            const dateVal = new Date(goal.createdAt || goal.startDate || Date.now());
            aggregated.push({
              id: `goal-${goal.id || idx}`,
              activity: `Goal ${goal.status ? goal.status.toLowerCase() : "assigned"}`,
              category: "Performance",
              by: employeeName,
              date: formatActivityDate(dateVal),
              details: `${cleanName(goal.goalTitle)}`,
              rawDate: dateVal
            });
          });
        }

        // 3. LMS (Trainings)
        if (results[2].status === "fulfilled" && results[2].value.data) {
          const trainings = results[2].value.data;
          trainings.forEach((t, idx) => {
            const dateVal = new Date(t.createdAt || t.startDate || Date.now());
            aggregated.push({
              id: `lms-${t.id || idx}`,
              activity: `Training ${t.status ? t.status.toLowerCase() : "assigned"}`,
              category: "Training",
              by: t.assignedBy || "HR Admin",
              date: formatActivityDate(dateVal),
              details: `${cleanName(t.trainingName)}`,
              rawDate: dateVal
            });
          });
        }

        // 4. Leaves
        if (results[3].status === "fulfilled" && results[3].value.data) {
          const leaves = results[3].value.data;
          leaves.forEach((leave, idx) => {
            const dateVal = new Date(leave.createdDate || leave.createdAt || leave.startDate || Date.now());
            aggregated.push({
              id: `leave-${leave.id || idx}`,
              activity: `Leave ${leave.status ? leave.status.toLowerCase() : "applied"}`,
              category: "Leave",
              by: employeeName,
              date: formatActivityDate(dateVal),
              details: `${leave.type} leave for ${leave.totalDays} day(s)`,
              rawDate: dateVal
            });
          });
        }

        // 5. Timesheet (Daily Entries)
        if (results[4].status === "fulfilled" && results[4].value.data) {
          const entries = results[4].value.data;
          entries.forEach((entry, idx) => {
            if (entry.totalHours > 0 || entry.loginTime) {
              const dateVal = new Date(entry.createdAt || entry.date + "T00:00:00");
              const dateParts = entry.date ? entry.date.split("-") : [];
              const formattedEntryDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : entry.date;
              aggregated.push({
                id: `entry-${entry.id || idx}`,
                activity: "Timesheet Logged",
                category: "Time & Attendance",
                by: employeeName,
                date: formatActivityDate(dateVal),
                details: `Logged ${formatWeeklyHours(entry.totalHours)} on ${formattedEntryDate}`,
                rawDate: dateVal
              });
            }
          });
        }

        // 6. Helpdesk Tickets
        if (results[5].status === "fulfilled" && results[5].value.data) {
          const tickets = results[5].value.data;
          tickets.forEach((t, idx) => {
            const dateVal = new Date(t.createdAt || Date.now());
            aggregated.push({
              id: `ticket-${t.id || idx}`,
              activity: `Ticket ${t.status ? t.status.toLowerCase() : "created"}`,
              category: "Helpdesk",
              by: employeeName,
              date: formatActivityDate(dateVal),
              details: `[${t.category}] ${cleanName(t.issueSummary)}`,
              rawDate: dateVal
            });
          });
        }

        // 7. Travel Requests
        if (results[6].status === "fulfilled" && results[6].value.data) {
          const travels = results[6].value.data;
          travels.forEach((travel, idx) => {
            const dateVal = new Date(travel.createdAt || travel.departureDate || Date.now());
            aggregated.push({
              id: `travel-${travel.id || idx}`,
              activity: `Travel ${travel.status ? travel.status.toLowerCase() : "requested"}`,
              category: "Travel",
              by: employeeName,
              date: formatActivityDate(dateVal),
              details: `Trip from ${travel.fromLocation} to ${travel.toLocation}`,
              rawDate: dateVal
            });
          });
        }

        // Sort by rawDate (newest first)
        aggregated.sort((a, b) => b.rawDate - a.rawDate);

        // Take top 5
        setActivitiesList(aggregated.slice(0, 5));

      } catch (err) {
        console.error("Failed to load aggregated activities:", err);
      }
    };

    fetchAllActivities();
  }, []); // Empty dependency array for mount-only fetch

  // Fetch pending task counts dynamically
  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchPendingTasks = async () => {
      try {
        const res = await api.get(`/task-counts/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && typeof res.data.total !== "undefined") {
          setPendingTasksCount(res.data.total);
        }
      } catch (err) {
        console.error("Failed to fetch pending task counts for dashboard:", err);
      }
    };

    fetchPendingTasks();
  }, []); // Empty dependency array for mount-only fetch


  const eventsData = [
    { id: 1, title: "Bakrid", type: "Company Holiday", month: "JUN", day: "07", weekday: "Sun", iconClass: "green bi bi-calendar-event" },
    { id: 2, title: "Independence Day", type: "National Holiday", month: "AUG", day: "15", weekday: "Sat", iconClass: "orange bi bi-people" },
    { id: 3, title: "Gandhi Jayanthi", type: "Company Holiday", month: "OCT", day: "02", weekday: "Thu", iconClass: "purple bi bi-mortarboard" },
    { id: 4, title: "Compliance Training", type: "Mandatory Session", month: "JUN", day: "05", weekday: "Fri", time: "Thu, 10:00 AM", iconClass: "blue bi bi-easel2" }
  ];

  const getCategoryClass = (category) => {
    switch (category) {
      case "Time & Attendance": return "time-attendance";
      case "Leave": return "leave";
      case "Performance": return "performance";
      case "Training": return "training";
      case "Reimbursement": return "time-attendance";
      case "Helpdesk": return "performance";
      case "Travel": return "training";
      default: return "profile";
    }
  };

  return (
    <Sidebar>
      <div className="db-new-container">

        {/* Greeting Banner */}
        <section className="db-new-greeting-banner">
          <div className="db-new-greeting-content">
            <h1 className="db-new-greeting-title">
              {greeting}, {employeeName.split(' ')[0]}! <span role="img" aria-label="wave">👋</span>
            </h1>
            <p className="db-new-greeting-subtitle">Have a great day ahead and stay productive.</p>
            <div className="db-new-time-date-inline">
              <div className="db-new-time-date-item">
                <i className="bi bi-calendar4"></i>
                <span>{currentDateStr.includes(',') ? currentDateStr.split(',')[1].trim() + (currentDateStr.split(',')[2] ? ',' + currentDateStr.split(',')[2] : '') : currentDateStr}</span>
              </div>
              <div className="db-new-time-date-item">
                <i className="bi bi-clock"></i>
                <span>{currentTimeStr}</span>
              </div>
            </div>
          </div>

          <div className="db-new-greeting-image">
            <img src={bannerIllustration} alt="Welcome Illustration" />
          </div>
        </section>


        {/* Widgets Grid */}
        <section className="db-new-widgets-grid">

          {/* Widget 1:  */}
          <div className="db-new-widget-card">
            <div className="db-new-widget-header">
              <span className="db-new-widget-title">Weekly Hours Overview</span>
              <Link to="/TimeSheet" className="db-new-widget-link">View</Link>
            </div>
            <div className="db-new-weekly-info">
              <span className="db-new-weekly-total">{formatWeeklyHours(totalHoursThisWeek)} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ 40h</span></span>
              <div className="db-new-weekly-sub">{targetPercentage}% of weekly target</div>
            </div>
            <div className="db-new-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyHoursData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[0, 15]}
                    ticks={[0, 5, 10, 15]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                      fontSize: '0.75rem',
                      fontFamily: "'Wix Madefor Display', sans-serif"
                    }}
                    labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                    formatter={(value) => [formatWeeklyHours(value), "Logged Hours"]}
                  />
                  <ReferenceLine
                    y={8}
                    stroke="#2563eb"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target (40h)',
                      position: 'top',
                      fill: '#2563eb',
                      fontSize: 9,
                      fontWeight: 800
                    }}
                  />
                  <Bar dataKey="hours" radius={[5, 5, 0, 0]} barSize={16}>
                    {weeklyHoursData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isLogged ? '#10b981' : '#cbd5e1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="db-new-chart-legend">
              <div className="db-new-legend-item">
                <div className="db-new-legend-color logged"></div>
                <span>Logged Hours</span>
              </div>
              <div className="db-new-legend-item">
                <div className="db-new-legend-color target"></div>
                <span>Target Hours (40h)</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Quick Access */}
          <div className="db-new-widget-card">
            <div className="db-new-widget-header">
              <span className="db-new-widget-title">Quick Access</span>
            </div>
            <div className="db-new-quick-access-list">
              <Link to="/TimeSheet" className="db-new-quick-item">
                <div className="db-new-quick-left">
                  <div className="db-new-quick-icon blue">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <div className="db-new-quick-details">
                    <span className="db-new-quick-name">Attendance</span>
                    <span className="db-new-quick-desc">Clock in, track time & timesheets</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right db-new-quick-arrow"></i>
              </Link>
              <Link to="/Leaves" className="db-new-quick-item">
                <div className="db-new-quick-left">
                  <div className="db-new-quick-icon green">
                    <i className="bi bi-calendar2-check"></i>
                  </div>
                  <div className="db-new-quick-details">
                    <span className="db-new-quick-name">Leaves</span>
                    <span className="db-new-quick-desc">Apply for leave, check balances</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right db-new-quick-arrow"></i>
              </Link>
              <Link to="/PerformanceManagement" className="db-new-quick-item">
                <div className="db-new-quick-left">
                  <div className="db-new-quick-icon purple">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                  <div className="db-new-quick-details">
                    <span className="db-new-quick-name">Performance</span>
                    <span className="db-new-quick-desc">Track KRAs, self assessment & reviews</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right db-new-quick-arrow"></i>
              </Link>
              {/* <Link to="/LMS" className="db-new-quick-item">
                <div className="db-new-quick-left">
                  <div className="db-new-quick-icon orange">
                    <i className="bi bi-mortarboard"></i>
                  </div>
                  <div className="db-new-quick-details">
                    <span className="db-new-quick-name">LMS</span>
                    <span className="db-new-quick-desc">Access training, learning courses</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right db-new-quick-arrow"></i>
              </Link> */}
            </div>
          </div>

          {/* Widget 3: Upcoming Holidays */}
          <div className="db-new-widget-card">
            <div className="db-new-widget-header">
              <span className="db-new-widget-title">Upcoming Holidays</span>
              <Link to="/HolidayCalender" className="db-new-widget-link">View All</Link>
            </div>
            <div className="db-new-events-list">
              {upcomingHolidaysList.length > 0 ? (
                upcomingHolidaysList.map((h, index) => {
                  const { month, day, weekday } = getHolidayDateParts(h.date);
                  const iconInfo = getHolidayIconClass(index);
                  const cleanName = h.holiday ? h.holiday.replace(/\s*\(optional\)/gi, "").trim().replace(/\uFFFD/g, "'") : "";
                  return (
                    <div className="db-new-event-item" key={h.id || index}>
                      <div className="db-new-event-left">
                        <div className={`db-new-event-icon-circle ${iconInfo.color}`}>
                          <i className={iconInfo.icon}></i>
                        </div>
                        <div className="db-new-event-details">
                          <span className="db-new-event-name">{cleanName}</span>
                          <span className="db-new-event-type">{getHolidayType(h.holiday)}</span>
                        </div>
                      </div>
                      <div className="db-new-event-date-block">
                        <span className={`db-new-event-month ${month ? month.toLowerCase() : ""}`}>{month}</span>
                        <span className="db-new-event-day">{day}</span>
                        <span className="db-new-event-weekday">{weekday}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.875rem', padding: '40px 0' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize: '2rem', marginBottom: '8px', color: '#cbd5e1' }}></i>
                  <span>No upcoming holidays found</span>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* Bottom Section: Recent Activities */}
        <section className="db-new-full-card">
          <div className="db-new-widget-header" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
            <span className="db-new-widget-title">Recent Activities</span>
          </div>
          <div className="db-new-table-wrapper">
            <table className="db-new-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '8px' }}>Activity</th>
                  <th>Category</th>
                  <th>By</th>
                  <th>Date</th>
                  <th style={{ paddingRight: '8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {activitiesList.length > 0 ? (
                  activitiesList.map(act => (
                    <tr key={act.id}>
                      <td style={{ color: '#1e293b', paddingLeft: '8px', textTransform: 'capitalize' }}>{act.activity}</td>
                      <td>
                        <span className={`db-new-category-pill ${getCategoryClass(act.category)}`}>
                          {act.category}
                        </span>
                      </td>
                      <td style={{ color: '#1e293b' }}>{act.by}</td>
                      <td style={{ color: '#64748b', fontSize: '0.775rem' }}>{act.date}</td>
                      <td style={{ color: '#64748b', fontWeight: 500, paddingRight: '8px' }}>{act.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>
                      No recent activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </Sidebar>
  );
}

export default Dashboard;
