import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const formatDate = (date) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset*60*1000));
  return adjustedDate.toISOString().split('T')[0];
};

const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return formatDate(new Date(d.setDate(diff)));
};

const getEndOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6;
  return formatDate(new Date(d.setDate(diff)));
};

const STATUS_COLORS = {
  ON_TIME: '#28a745',
  LATE: '#fd7e14',
  WFH: '#007bff',
  ABSENT: '#dc3545',
  LEAVE: '#6c757d',
};

const AttendanceAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [startDate, setStartDate] = useState(getStartOfWeek());
  const [endDate, setEndDate] = useState(getEndOfWeek());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem('scaloz_token');
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082/api';
      const response = await axios.get(
        `${baseUrl}/v1/analytics/me?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching attendance analytics:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatHoursAndMinutes = (decimalHours) => {
    if (decimalHours === null || decimalHours === undefined) return '0 hrs 0 mins';
    const hrs = Math.floor(decimalHours);
    const mins = Math.round((decimalHours - hrs) * 60);
    return `${hrs} hrs ${mins} mins`;
  };

  const getBarColor = (status) => {
    return STATUS_COLORS[status] || '#17a2b8';
  };

  // Compute pie chart data from dailyLogs
  const statusDistribution = useMemo(() => {
    if (!analyticsData?.dailyLogs || analyticsData.dailyLogs.length === 0) return [];
    const counts = {};
    analyticsData.dailyLogs.forEach(log => {
      const s = log.status || 'UNKNOWN';
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = analyticsData.dailyLogs.length;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / total) * 100).toFixed(1),
      fill: STATUS_COLORS[name] || '#17a2b8'
    }));
  }, [analyticsData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip p-2 bg-white border rounded shadow-sm" style={{ fontSize: '0.85rem' }}>
          <p className="mb-1 fw-bold">{label}</p>
          <p className="mb-1" style={{ color: '#007bff' }}>
            Effective: {data.effectiveHours != null ? data.effectiveHours.toFixed(2) : '0'} hrs
          </p>
          <p className="mb-1" style={{ color: '#6f42c1' }}>
            Gross: {data.grossHours != null ? data.grossHours.toFixed(2) : '0'} hrs
          </p>
          <p className="mb-0">
            Status: <span style={{ color: getBarColor(data.status), fontWeight: 600 }}>{data.status}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (parseFloat(percentage) < 10) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {percentage}%
      </text>
    );
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Attendance Analytics</h2>
      
      {/* Date Range Selection */}
      <div className="row mb-3 align-items-end">
        <div className="col-md-3">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Burnout Warning Alert */}
      {analyticsData?.isBurnoutRisk && (
        <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          <div>
            <strong>Burnout Warning:</strong> Your gross hours are trending unusually high over the past 14 days. Please ensure you are taking adequate breaks.
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Main Content Dashboard */}
      {!loading && !error && analyticsData && (
        <>
          {/* Top Section: Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100" style={{ background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%)' }}>
                <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                  <h6 className="card-title text-muted mb-2">Average Effective Hours</h6>
                  <h3 className="card-text fw-bold text-primary mb-0">
                    {formatHoursAndMinutes(analyticsData.averageHoursPerDay)}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-4 mt-3 mt-md-0">
              <div className="card shadow-sm border-0 h-100" style={{ background: 'linear-gradient(135deg, #e8fde8 0%, #f0fff0 100%)' }}>
                <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                  <h6 className="card-title text-muted mb-2">On-Time Percentage</h6>
                  <h3 className="card-text fw-bold text-success mb-0">
                    {analyticsData.onTimePercentage != null 
                      ? `${analyticsData.onTimePercentage.toFixed(1)}%` 
                      : '0%'}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-4 mt-3 mt-md-0">
              <div className="card shadow-sm border-0 h-100" style={{ background: 'linear-gradient(135deg, #fdf2e8 0%, #fff9f0 100%)' }}>
                <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                  <h6 className="card-title text-muted mb-2">Leave Utilization</h6>
                  <h3 className="card-text fw-bold mb-0" style={{ color: '#fd7e14' }}>
                    {analyticsData.approvedLeaveDays != null 
                      ? `${analyticsData.approvedLeaveDays} Day${analyticsData.approvedLeaveDays !== 1 ? 's' : ''} Taken`
                      : '0 Days Taken'}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: ComposedChart */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h5 className="card-title mb-4">Daily Attendance Trends</h5>
              {analyticsData.dailyLogs && analyticsData.dailyLogs.length > 0 ? (
                <div style={{ height: 380, width: '100%' }}>
                  <ResponsiveContainer>
                    <ComposedChart
                      data={analyticsData.dailyLogs}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="effectiveHours" name="Effective Hours" radius={[4, 4, 0, 0]} minPointSize={5}>
                        {analyticsData.dailyLogs.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                        ))}
                      </Bar>
                      <Line
                        type="monotone"
                        dataKey="grossHours"
                        name="Gross Hours"
                        stroke="#6f42c1"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#6f42c1' }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  No daily logs available for the selected date range.
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown: PieChart + Table side by side */}
          <div className="row mb-5">
            {/* Donut Chart */}
            <div className="col-md-5">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5 className="card-title mb-3">Status Breakdown</h5>
                  {statusDistribution.length > 0 ? (
                    <div style={{ height: 280, width: '100%' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            label={PieLabel}
                            labelLine={false}
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`pie-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value} day(s)`, name]}
                          />
                          <Legend
                            iconType="circle"
                            formatter={(value, entry) => {
                              const item = statusDistribution.find(d => d.name === value);
                              return `${value} (${item ? item.percentage : 0}%)`;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">No data for breakdown.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Log Summary Table */}
            <div className="col-md-7 mt-3 mt-md-0">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5 className="card-title mb-3">Log Summary</h5>
                  <div className="table-responsive" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Effective</th>
                          <th scope="col">Gross</th>
                          <th scope="col">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.dailyLogs && analyticsData.dailyLogs.length > 0 ? (
                          analyticsData.dailyLogs.map((log, index) => (
                            <tr key={index}>
                              <td>{log.date}</td>
                              <td>{formatHoursAndMinutes(log.effectiveHours)}</td>
                              <td>{formatHoursAndMinutes(log.grossHours)}</td>
                              <td>
                                <span 
                                  className="badge rounded-pill"
                                  style={{ 
                                    backgroundColor: getBarColor(log.status), 
                                    fontSize: '0.8rem' 
                                  }}
                                >
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-3 text-muted">
                              No records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceAnalyticsDashboard;
