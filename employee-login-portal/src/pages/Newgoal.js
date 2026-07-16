import React, { useRef, useState, useEffect } from 'react';
import './Dashboard.css';
import './Newgoal.css';

import api from "../api";

// Move getCurrentQuarter function here, before it is used
const getCurrentQuarter = () => {
    const allMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonth = allMonths[new Date().getMonth()];
    const currentYear = String(new Date().getFullYear());
    
    const savedPeriodsStr = localStorage.getItem('performance_time_periods');
    if (savedPeriodsStr) {
        try {
            const periods = JSON.parse(savedPeriodsStr);
            const match = periods.find(p => 
                p.frequency === 'Quarterly' && 
                p.year === currentYear && 
                p.month && 
                p.month.split(', ').map(m => m.split(' ')[0]).includes(currentMonth)
            );
            if (match && match.quarter) {
                return match.quarter;
            }
        } catch (e) {
            console.error("Error parsing performance_time_periods in getCurrentQuarter", e);
        }
    }
    
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
};

const Newgoal = ({ selectedEmployeeId, reviewerId, initialGoalData, onGoalAdded }) => {
    const tbodyRef = useRef(null);

    const [goals, setGoals] = useState(() => {
        if (initialGoalData) {
            return [{
                goalId: '',
                employeeId: selectedEmployeeId,
                employeeName: '',
                quarter: initialGoalData.quarter,
                goalTitle: initialGoalData.goalTitle,
                goalDescription: initialGoalData.goalDescription,
                target: initialGoalData.target,
                metric: initialGoalData.metric,
                previousGoalId: initialGoalData.previousGoalId,
            }];
        }
        return [{
            goalId: '',
            employeeId: selectedEmployeeId,
            employeeName: '',
            quarter: getCurrentQuarter(), // Now this is safe to call
            goalTitle: '',
            goalDescription: '',
            target: '',
            metric: '',
            previousGoalId: null,
        }];
    });

    useEffect(() => {
        if (initialGoalData) {
            setGoals([{
                goalId: '',
                employeeId: selectedEmployeeId,
                employeeName: '',
                quarter: initialGoalData.quarter,
                goalTitle: initialGoalData.goalTitle,
                goalDescription: initialGoalData.goalDescription,
                target: initialGoalData.target,
                metric: initialGoalData.metric,
                previousGoalId: initialGoalData.previousGoalId,
            }]);
        }
    }, [initialGoalData, selectedEmployeeId]);

    const handleChange = (index, field, value) => {
        const trimmedValue = value.slice(0, 255);
        const updatedGoals = [...goals];
        updatedGoals[index][field] = trimmedValue;
        setGoals(updatedGoals);
    };

    const addGoal = () => {
        setGoals(prevGoals => [
            ...prevGoals,
            {
                goalId: '',
                employeeId: selectedEmployeeId,
                employeeName: '',
                quarter: getCurrentQuarter(),
                goalTitle: '',
                goalDescription: '',
                target: '',
                metric: '',
                acknowledgedBy: '',
                acknowledgedAt: '',
                previousGoalId: null,
            },
        ]);
        setTimeout(() => {
            if (tbodyRef.current) {
                tbodyRef.current.scrollTop = tbodyRef.current.scrollHeight;
            }
        }, 100);
    };

    const removeGoal = (index) => {
        const updatedGoals = goals.filter((_, i) => i !== index);
        setGoals(updatedGoals);
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!selectedEmployeeId) {
            alert('Selected Employee ID is missing. Cannot submit goals.');
            return;
        }

        // Validate that the total sum of goal weightages is exactly 100%
        const sum = goals.reduce((acc, goal) => acc + (parseFloat(goal.metric) || 0), 0);
        if (sum !== 100) {
            alert(`The total sum of goal weightages must be exactly 100%. Currently, the total sum is ${sum}%. Please adjust the weightages before submitting.`);
            return;
        }

        try {

            const rawToken = sessionStorage.getItem("token");
            if (!rawToken) throw new Error("No token found in sessionStorage. Please login.");
            const token = rawToken.startsWith('"') && rawToken.endsWith('"')
                ? rawToken.slice(1, -1)
                : rawToken;


            const authHeader = { Authorization: `Bearer ${token}` };
            const previousGoalId = goals[0]?.previousGoalId;

            // Assign goals
            for (const goal of goals) {
                goal.employeeId = selectedEmployeeId;
                if (reviewerId) goal.reviewerId = reviewerId;

                await api.post('/goals/assign', goal, { headers: { ...authHeader } });
            }

            // Delete previous goal if exists
            if (previousGoalId) {
                await api.delete(`/goals/delete/${previousGoalId}`, { headers: { ...authHeader } });
            }

            alert('Goals submitted successfully!');
            if (onGoalAdded) onGoalAdded();

            // Reset goals form

            setGoals([{
                goalId: '',
                employeeId: selectedEmployeeId,
                employeeName: '',
                quarter: getCurrentQuarter(),
                goalTitle: '',
                goalDescription: '',
                target: '',
                metric: '',
                previousGoalId: null,
            }]);

        } catch (error) {
            alert('Error submitting goals: ' + error.message);
            console.error('Detailed error:', error);
        }
    };



    const totalWeightage = goals.reduce((acc, goal) => acc + (parseFloat(goal.metric) || 0), 0);
    const isWeightageCorrect = totalWeightage === 100;

    return (
        <div>
            <h2>Set Quarterly Goals</h2>
            <form onSubmit={handleSubmit}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    marginBottom: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Total weightage across all goals
                    </span>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '700',
                        fontFamily: "'Inter', sans-serif",
                        backgroundColor: isWeightageCorrect ? '#e6f4ea' : '#fce8e6',
                        color: isWeightageCorrect ? '#137333' : '#c5221f',
                        minWidth: '70px',
                        textAlign: 'center',
                    }}>
                        {totalWeightage} / 100
                    </div>
                </div>
                <div
                    ref={tbodyRef}
                    style={{
                        maxHeight: "calc(100vh - 350px)",
                        overflowY: "auto",
                        display: "block",
                    }}
                    className="table-wrapper"
                >
                    <table className="goals-table1 goals-style" style={{ width: "100%", tableLayout: "fixed" }}>
                        <thead>
                            <tr>
                                <th style={{ width: '300px', textAlign: 'center' }}>Title</th>
                                <th style={{ textAlign: 'center' }}>Description</th>
                                <th style={{ width: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Weightage (%)</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {goals.map((goal, index) => (
                                <tr key={index}>
                                    <td>
                                        <textarea
                                            value={goal.goalTitle}
                                            onChange={(e) => handleChange(index, 'goalTitle', e.target.value)}
                                            maxLength={255}
                                            rows={4}
                                            wrap="soft"
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                resize: "none",
                                                padding: "8px 10px",
                                                fontSize: "14px",
                                                lineHeight: "1.5",
                                                boxSizing: "border-box",
                                                overflowY: "scroll",
                                                scrollbarWidth: "none",
                                                msOverflowStyle: "none"
                                            }}
                                            required
                                        />
                                    </td>
                                    <td>
                                        <textarea
                                            rows={4}
                                            value={goal.goalDescription}
                                            onChange={(e) => handleChange(index, 'goalDescription', e.target.value)}
                                            maxLength={255}
                                            wrap="soft"
                                            required
                                            style={{
                                                width: "100%",
                                                fontSize: "14px",
                                                lineHeight: "1.5",
                                                padding: "8px 10px",
                                                resize: "none",
                                                boxSizing: "border-box",
                                                fontFamily: "inherit"
                                            }}
                                        />
                                    </td>
                                    <td style={{ position: "relative" }}>
                                        <input
                                            type="text"
                                            value={goal.metric}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || (/^\d{1,3}$/.test(val) && parseInt(val) <= 100)) {
                                                    handleChange(index, 'metric', val);
                                                }
                                            }}
                                            required
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                boxSizing: "border-box",
                                                padding: "8px 24px 8px 10px",
                                                fontSize: "14px",
                                                fontFamily: "inherit",
                                                resize: "none"
                                            }}
                                        />
                                        <span style={{
                                            position: "absolute",
                                            right: "8px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none",
                                            color: "#555"
                                        }}>%</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
                                            <input
                                                type="text"
                                                maxLength={1}
                                                value={goal.target || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^[0-9]$/.test(val)) {
                                                        handleChange(index, "target", val);
                                                    }
                                                }}
                                                required
                                                style={{
                                                    width: "100%",
                                                    height: "auto",
                                                    boxSizing: "border-box",
                                                    padding: "8px 10px",
                                                    fontSize: "14px",
                                                    fontFamily: "inherit",
                                                    marginBottom: "3px"
                                                }}
                                            />
                                            {goals.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeGoal(index)}
                                                    style={{
                                                        background: "transparent",
                                                        border: "none",
                                                        color: "black",
                                                        fontSize: "18px",
                                                        cursor: "pointer",
                                                        padding: 0,
                                                        margin: 0,
                                                        lineHeight: 1
                                                    }}
                                                >
                                                    &minus;
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="goal-actions">
                    <button type="button" onClick={addGoal} className="add-btn">+ Add Another Goal</button>
                    <button type="submit" className="save-btn">Submit</button>
                </div>
            </form>
        </div>
    );
};

export default Newgoal;
