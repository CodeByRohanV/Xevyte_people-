import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import Sidebar from './Sidebar';
import api from '../api'; // Assuming standard api.js export

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const RADAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981'];

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const role = sessionStorage.getItem("role") || "Employee";
  const department = sessionStorage.getItem("department") || "";

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/summary', {
        params: { role, department: role.toUpperCase() === 'MANAGER' ? department : 'All' }
      });
      if (response.data) {
        setMetrics(response.data.data || []);
        setKpis(response.data.kpis || null);
      }
    } catch (error) {
      console.error('Error fetching analytics metrics', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    setInsights(''); // clear previous insights
    try {
      const response = await api.get('/analytics/insights', {
        params: { role }
      });
      if (response.data && response.data.insights) {
        setInsights(response.data.insights);
      }
    } catch (error) {
      console.error('Error fetching AI insights', error);
      setInsights('Failed to generate insights. Ensure the AI service is configured.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const renderKPICards = () => {
    if (!kpis) return null;

    const standardCards = [
      { title: role.toUpperCase() === 'MANAGER' ? 'Team Headcount' : 'Total Headcount', value: kpis.totalEmployees ?? 0, icon: 'bi-people', bg: 'bg-primary', color: 'text-white' },
      { title: 'Active Leaves', value: kpis.activeLeaves ?? 0, icon: 'bi-calendar2-minus', bg: 'bg-warning', color: 'text-dark' },
      { title: 'Pending Approvals', value: kpis.pendingApprovals ?? 0, icon: 'bi-clock-history', bg: 'bg-info', color: 'text-white' }
    ];

    if (role.toUpperCase() === 'HR' || role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'SUB_ADMIN' || role.toUpperCase() === 'SUB ADMIN') {
      standardCards.push({ title: 'Attrition (Cleared)', value: kpis.attritionCount ?? 0, icon: 'bi-person-x', bg: 'bg-danger', color: 'text-white' });
    }

    // Predictive/Enterprise KPIs
    const predictiveCards = [
      { title: 'Avg Flight Risk', value: `${kpis.avgFlightRisk ?? 0}/100`, icon: 'bi-airplane', bg: (kpis.avgFlightRisk ?? 0) > 50 ? 'bg-danger' : 'bg-success', color: 'text-white' },
      { title: 'Avg Burnout Risk', value: `${kpis.avgBurnoutRisk ?? 0}/100`, icon: 'bi-battery-half', bg: (kpis.avgBurnoutRisk ?? 0) > 60 ? 'bg-danger' : 'bg-success', color: 'text-white' },
      { title: 'Dept Health Score', value: `${kpis.avgDeptHealth ?? 0}/100`, icon: 'bi-heart-pulse', bg: (kpis.avgDeptHealth ?? 0) < 50 ? 'bg-warning' : 'bg-success', color: (kpis.avgDeptHealth ?? 0) < 50 ? 'text-dark' : 'text-white' },
      { title: 'Leave Forecast (30d)', value: kpis.totalLeaveForecast ?? 0, icon: 'bi-graph-up', bg: 'bg-secondary', color: 'text-white' }
    ];

    const renderCardRow = (cards, rowTitle) => (
      <div className="mb-4">
        <h5 className="mb-3 fw-bold text-secondary">{rowTitle}</h5>
        <div className="row">
          {cards.map((card, idx) => (
            <div key={idx} className="col-md-3 col-sm-6 mb-3">
              <div className={`card ${card.bg} ${card.color} h-100 shadow border-0 rounded-4`} style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div className="card-body d-flex flex-column justify-content-between p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title mb-0 fw-semibold opacity-75">{card.title}</h6>
                    <i className={`bi ${card.icon} fs-4 opacity-75`}></i>
                  </div>
                  <h2 className="display-6 mb-0 fw-bold">{card.value}</h2>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <>
        {renderCardRow(standardCards, "Operational Metrics")}
        {renderCardRow(predictiveCards, "Predictive & Health Analytics (Enterprise)")}
      </>
    );
  };

  const renderAlertBanner = () => {
    if (!kpis) return null;
    let alerts = [];

    if (kpis.pendingApprovals > 5) {
      alerts.push({ msg: `You have ${kpis.pendingApprovals} pending approvals requiring attention.`, type: 'warning' });
    }
    if (kpis.totalEmployees > 0 && kpis.activeLeaves > (kpis.totalEmployees * 0.2)) {
      alerts.push({ msg: `High leave volume detected (>${Math.round((kpis.activeLeaves/kpis.totalEmployees)*100)}% of workforce). Expect reduced capacity.`, type: 'danger' });
    }
    if (kpis.avgFlightRisk > 50) {
      alerts.push({ msg: `High organizational flight risk detected (Score: ${kpis.avgFlightRisk}/100). Review retention strategies.`, type: 'danger' });
    }

    if (alerts.length === 0) return null;

    return (
      <div className="mb-4">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`alert alert-${alert.type} shadow-sm d-flex align-items-center rounded-3 border-0`} role="alert">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0 me-3 fs-5"></i>
            <div className="fw-medium">{alert.msg}</div>
          </div>
        ))}
      </div>
    );
  };

  // Prepare data for Leave Distribution Pie Chart
  const getLeaveDistributionData = () => {
    if (!metrics || metrics.length === 0) return [];
    // Aggregate latest metrics
    const latestDate = metrics.reduce((max, m) => m.recordDate > max ? m.recordDate : max, metrics[0].recordDate);
    const latestMetrics = metrics.filter(m => m.recordDate === latestDate);
    
    let sick = 0, casual = 0, earned = 0;
    latestMetrics.forEach(m => {
      sick += m.sickLeaves || 0;
      casual += m.casualLeaves || 0;
      earned += m.earnedLeaves || 0;
    });
    
    return [
      { name: 'Sick', value: sick },
      { name: 'Casual', value: casual },
      { name: 'Earned', value: earned }
    ].filter(d => d.value > 0);
  };

  const getLatestMetrics = () => {
    if (!metrics || metrics.length === 0) return [];
    const latestDate = metrics.reduce((max, m) => m.recordDate > max ? m.recordDate : max, metrics[0].recordDate);
    return metrics.filter(m => m.recordDate === latestDate);
  };

  return (
    <Sidebar>
      <div className="container mt-4" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Analytics Dashboard <span className="badge bg-secondary fs-6">{role} View</span></h2>
          <button className="btn btn-outline-primary" onClick={fetchMetrics} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
        
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {renderAlertBanner()}
            {renderKPICards()}

            <div className="row">
              <div className="col-lg-6 mb-4">
                <div className="card shadow border-0 rounded-4 h-100">
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h5 className="card-title fw-bold text-dark">
                      {role.toUpperCase() === 'MANAGER' ? 'Team Headcount & Activity' : 'Department Headcount & Activity'}
                    </h5>
                    <p className="text-muted small">Headcount vs Active Leaves</p>
                  </div>
                  <div className="card-body">
                    <div style={{ width: '100%', height: 350 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={getLatestMetrics()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                          <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                          <Bar dataKey="totalEmployees" name="Total Employees" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="activeLeaves" name="Active Leaves" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 mb-4">
                <div className="card shadow border-0 rounded-4 h-100">
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h5 className="card-title fw-bold text-dark">Enterprise Risk Radar</h5>
                    <p className="text-muted small">Multi-dimensional health indicators across departments</p>
                  </div>
                  <div className="card-body d-flex justify-content-center align-items-center">
                    {getLatestMetrics().length > 0 ? (
                    <div style={{ width: '100%', height: 350 }}>
                      <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getLatestMetrics()}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="department" tick={{fill: '#4b5563', fontSize: 12}} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Flight Risk" dataKey="flightRiskScore" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                          <Radar name="Burnout Risk" dataKey="burnoutRiskScore" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                          <Radar name="Health Score" dataKey="departmentHealthScore" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Legend iconType="circle" />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    ) : (
                      <p className="text-muted text-center">No department health data available yet. Data will populate after the next analytics cycle.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-4 mb-4">
                <div className="card shadow-sm h-100 border-0 rounded-3">
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h5 className="card-title fw-bold text-dark">Leave Distribution</h5>
                  </div>
                  <div className="card-body d-flex justify-content-center align-items-center">
                    {getLeaveDistributionData().length > 0 ? (
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={getLeaveDistributionData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {getLeaveDistributionData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-muted text-center">No active leaves to display.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 mb-4">
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                  <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-sm-center py-4 px-4 border-0 bg-transparent">
                    <div>
                      <h4 className="mb-1 fw-bold text-white"><i className="bi bi-robot text-primary me-2"></i>Executive AI Insights</h4>
                      <p className="text-secondary mb-0 small">Powered by Groq AI - Actionable recommendations based on real-time organizational health</p>
                    </div>
                    <button 
                      className="btn btn-primary fw-bold px-4 py-2 mt-3 mt-sm-0 rounded-pill shadow-sm"
                      style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)', border: 'none' }}
                      onClick={handleGenerateInsights}
                      disabled={insightsLoading}
                    >
                      {insightsLoading ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Analyzing Enterprise Data...</>
                      ) : (
                        <><i className="bi bi-stars me-2"></i>Generate Prescriptive Insights</>
                      )}
                    </button>
                  </div>
                  <div className="card-body p-4 bg-white m-1 rounded-3 mb-1 mx-1" style={{ minHeight: '200px' }}>
                    {insights ? (
                      <div className="ai-insight-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.05rem', color: '#334155' }}>
                        {insights}
                      </div>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-5">
                        {insightsLoading ? (
                           <div className="text-center">
                             <div className="spinner-grow text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
                               <span className="visually-hidden">Loading...</span>
                             </div>
                             <p className="fs-5 text-dark fw-medium">Synthesizing predictive analytics...</p>
                             <p className="text-secondary small">Evaluating flight risk, burnout, and manager effectiveness</p>
                           </div>
                        ) : (
                           <div className="text-center opacity-50">
                             <i className="bi bi-bar-chart-steps display-1 mb-3 text-secondary"></i>
                             <h5 className="fw-medium text-dark">No Insights Generated Yet</h5>
                             <p>Click the button above to synthesize your workforce data.</p>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
};

export default AnalyticsDashboard;
