import React, { useState, useMemo } from 'react';
import './AttendanceAnalyticsDeep.css';

export default function AttendanceRiskOverview({ data }) {
  const [selectedIssue, setSelectedIssue] = useState(null);

  // 1. Process Data
  const issues = useMemo(() => {
    if (!data) return [];
    const logs = data.dailyLogs || data.teamLogs || [];
    const anomalies = data.anomalies || data.teamAnomalies || [];

    // Missed Logouts
    const missedLogouts = logs.filter(l => l.loginTime && !l.logoutTime && l.status !== 'ABSENT' && l.status !== 'LEAVE');
    
    // Zero Hours
    const zeroHours = anomalies.filter(a => a.type === 'ZERO_HOURS');
    
    // Late Arrivals
    const lateArrivals = logs.filter(l => l.status === 'LATE');
    
    // Work Deficit
    const workDeficit = logs.filter(l => l.status !== 'LEAVE' && l.status !== 'ABSENT' && l.effectiveHours > 0 && l.effectiveHours < 8.0);

    const getBucket = (count) => {
      if (count === 0) return null;
      if (count <= 2) return 'Rare';
      if (count <= 5) return 'Occasional';
      return 'Frequent';
    };

    const processIssue = (id, name, items, severity, impact, recommendation, mapEmployee) => {
      if (items.length === 0) return null;
      
      // Get unique employees
      const uniqueEmployees = new Set();
      const records = [];
      
      items.forEach(item => {
        const mapped = mapEmployee(item);
        if (mapped) {
          uniqueEmployees.add(mapped.empId);
          records.push(mapped);
        }
      });

      return {
        id,
        name,
        count: items.length,
        employees: uniqueEmployees.size,
        severity, // 'High', 'Medium', 'Low'
        frequency: getBucket(items.length),
        impact,
        recommendation,
        records
      };
    };

    const results = [
      processIssue(
        'missed_logout', 'Missed Logouts', missedLogouts, 'High',
        'Critical Payroll Impact. Unable to verify worked hours.',
        'Notify affected employees and managers to complete logout before payroll processing.',
        (l) => ({ empId: l.employeeId, name: l.employeeName || l.employeeId, date: l.date, details: `In: ${l.loginTime} - No Logout` })
      ),
      processIssue(
        'zero_hours', 'Zero Hours', zeroHours, 'High',
        'Critical Operational Risk. Employee logged in but generated zero productive time.',
        'Investigate immediately. Ensure timesheet systems are syncing or check for proxy attendance.',
        (a) => ({ empId: a.employeeId, name: a.employeeName || a.employeeId, date: a.date, details: a.message })
      ),
      processIssue(
        'late_arrivals', 'Late Arrivals', lateArrivals, 'Medium',
        'Repeated delays reduce productivity, disrupt standups, and violate attendance policy.',
        'Review recurring late employees and enforce punctuality policies.',
        (l) => ({ empId: l.employeeId, name: l.employeeName || l.employeeId, date: l.date, details: `Arrived at ${l.loginTime}` })
      ),
      processIssue(
        'work_deficit', 'Work Deficit', workDeficit, 'Low',
        'Lost productivity and potential contract hour violations.',
        'Identify root cause of early departures or excessive breaks.',
        (l) => ({ empId: l.employeeId, name: l.employeeName || l.employeeId, date: l.date, details: `Worked ${l.effectiveHours}h (${(8 - l.effectiveHours).toFixed(1)}h deficit)` })
      )
    ];

    return results.filter(r => r !== null);
  }, [data]);

  const severityLevels = ['High', 'Medium', 'Low'];
  const frequencyLevels = ['Rare', 'Occasional', 'Frequent'];

  const getBadgeClass = (severity) => {
    if (severity === 'High') return 'critical';
    if (severity === 'Medium') return 'warning';
    return 'minor';
  };

  const highestPriorityIssue = useMemo(() => {
    if (issues.length === 0) return null;
    const severityScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return [...issues].sort((a, b) => {
      if (severityScore[a.severity] !== severityScore[b.severity]) {
        return severityScore[b.severity] - severityScore[a.severity];
      }
      return b.count - a.count;
    })[0];
  }, [issues]);

  return (
    <div className="aad-risk-overview">
      <div className="aad-risk-header">
        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Attendance Risk Overview</h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
          Shows which attendance issues happen most often and which have the highest business impact, helping managers prioritize corrective actions.
        </p>
      </div>

      <div className="aad-risk-legend">
        <div className="aad-risk-legend-item">
          <div className="aad-risk-dot critical"></div>
          <span>Critical Impact</span>
        </div>
        <div className="aad-risk-legend-item">
          <div className="aad-risk-dot warning"></div>
          <span>Warning</span>
        </div>
        <div className="aad-risk-legend-item">
          <div className="aad-risk-dot minor"></div>
          <span>Minor Issue</span>
        </div>
      </div>

      <div className="aad-risk-grid">
        {/* Empty top-left cell */}
        <div className="aad-risk-axis-label y-axis" style={{ gridRow: '1 / 4', gridColumn: '1' }}>
          OPERATIONAL IMPACT
        </div>

        {/* Grid Cells */}
        {severityLevels.map((sev, rIdx) => (
          frequencyLevels.map((freq, cIdx) => {
            const cellIssues = issues.filter(i => i.severity === sev && i.frequency === freq);
            
            return (
              <div key={`${sev}-${freq}`} className="aad-risk-cell">
                {cellIssues.map(issue => (
                  <div key={issue.id} className="aad-risk-card" onClick={() => setSelectedIssue(issue)}>
                    <div className={`aad-risk-badge ${getBadgeClass(sev)}`}>
                      {issue.count} Occurrences
                    </div>
                    <span>{issue.name}</span>
                    
                    {/* Tooltip */}
                    <div className="aad-tooltip">
                      <h6>{issue.name} ({issue.count} occurrences)</h6>
                      <p><strong>Affected:</strong> {issue.employees} Employee(s)</p>
                      <p><strong>Impact:</strong> {issue.impact}</p>
                      <p><strong>Action:</strong> {issue.recommendation}</p>
                      <p style={{marginTop: '8px', fontSize: '0.75rem', fontStyle: 'italic', color: '#cbd5e1'}}>Click to view affected employees</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        ))}

        {/* X Axis */}
        <div style={{ gridRow: '4', gridColumn: '2 / 5', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
          <span>Rare (1-2)</span>
          <span>Occasional (3-5)</span>
          <span>Frequent (6+)</span>
        </div>
      </div>

      {highestPriorityIssue && (
        <div className="aad-risk-recommendation">
          <i className="bi bi-lightbulb-fill"></i>
          <div className="aad-risk-recommendation-content">
            <h5>Priority Action: {highestPriorityIssue.name}</h5>
            <p>{highestPriorityIssue.recommendation}</p>
          </div>
        </div>
      )}

      {/* Drill Down Modal */}
      {selectedIssue && (
        <div className="aad-modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="aad-modal-content" onClick={e => e.stopPropagation()}>
            <div className="aad-modal-header">
              <h4>{selectedIssue.name} Details</h4>
              <button className="aad-modal-close" onClick={() => setSelectedIssue(null)}>&times;</button>
            </div>
            <div className="aad-modal-body">
              <div className="aad-modal-list">
                {selectedIssue.records.map((rec, i) => (
                  <div key={i} className="aad-modal-item">
                    <div className="aad-modal-avatar">
                      {rec.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="aad-modal-info">
                      <h4 className="aad-modal-name">{rec.name}</h4>
                      <p className="aad-modal-meta">{rec.date} &bull; {rec.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
