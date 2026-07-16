import React, { useState, useEffect, useCallback } from "react";
import "./Dashboard.css";
import "./ManagerDashboard.css";
import Sidebar from "./Sidebar.js";
import ManagerDashBoard from "./ManagerDashBoard";
import FinanceDashboard from "./FinanceDashboard";
import api from "../api";

function MyTasks({ isApprovalPage }) {
    const employeeId = sessionStorage.getItem("employeeId");
    const [employeeName] = useState(sessionStorage.getItem("employeeName")); // Keep this if used, otherwise consider removing
    const [assignedRoles, setAssignedRoles] = useState({
        manager: false,
        finance: false,
        hr: false,
    });

    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        if (!employeeId) return;

        const fetchAssignedRoles = async () => {
            try {
                const token = sessionStorage.getItem("token");

                if (!token) {
                    setFetchError("Authentication token not found. Please log in again.");
                    return;
                }


                const response = await api.get(`/claims/assigned-ids/${employeeId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = response.data;

                setAssignedRoles({
                    manager: data.manager || false,
                    finance: data.finance || false,
                    hr: data.hr || false,
                });

            } catch (err) {
                console.error("Failed to fetch assigned roles:", err.response?.data || err.message);
                setFetchError(err.response?.data || err.message);
            }
        };

        fetchAssignedRoles();
    }, [employeeId]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [counts, setCounts] = useState({});

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleManagerData = useCallback((count) => {
        setCounts(prev => prev.manager === count ? prev : { ...prev, manager: count });
    }, []);

    const handleFinanceData = useCallback((count) => {
        setCounts(prev => prev.finance === count ? prev : { ...prev, finance: count });
    }, []);



    const rolesWithData = Object.keys(counts).length;
    const activeRolesCount = (assignedRoles.manager ? 1 : 0) +
        (assignedRoles.finance ? 1 : 0);

    const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

    const isDataReady = activeRolesCount > 0 && rolesWithData >= activeRolesCount;

    return (

        <div className={`mytasks-container ${isApprovalPage ? 'mytasks-approval' : ''}`} style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginTop: "0px"
        }}>

            {fetchError && <p style={{ color: "red", fontWeight: "bold" }}>{fetchError}</p>}

            <div className="table-wrapper" style={{ maxHeight: "calc(100vh - 150px)", overflowY: "auto", overflowX: "auto", marginTop: "-2px", borderRadius: "8px" }}>
                <table className="status-table transparent-table" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr>
                            <th style={{ background: '#629af1', color: 'white', textAlign: 'center', padding: '0.8rem 1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '0px', fontSize: '15px' }}>Employee ID</th>
                            <th style={{ background: '#629af1', color: 'white', textAlign: 'center', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '15px' }}>Employee Name</th>
                            <th style={{ background: '#629af1', color: 'white', textAlign: 'center', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '15px' }}>Claims</th>
                            <th style={{ background: '#629af1', color: 'white', textAlign: 'center', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '15px' }}>Total Amount</th>
                            <th style={{ background: '#629af1', color: 'white', textAlign: 'center', padding: '0.8rem 1rem', borderRadius: '0', fontSize: '15px' }}>Submitted Date</th>
                            <th style={{ background: '#629af1', color: 'white', textAlign: 'center', padding: '0.8rem 1rem', borderTopRightRadius: '8px', borderBottomRightRadius: '0px', fontSize: '15px' }}>Action</th>
                        </tr>
                    </thead>

                    <tbody style={{ backgroundColor: '#f7f9fa', color: '#334155' }}>
                        {assignedRoles.manager && (
                            <ManagerDashBoard
                                embedded={true}
                                employeeId={employeeId}
                                statusFilter="All"
                                refreshTrigger={refreshTrigger}
                                onActionComplete={handleRefresh}
                                onDataLoaded={handleManagerData}
                            />
                        )}
                        {assignedRoles.finance && (
                            <FinanceDashboard
                                embedded={true}
                                employeeId={employeeId}
                                statusFilter="All"
                                refreshTrigger={refreshTrigger}
                                onActionComplete={handleRefresh}
                                onDataLoaded={handleFinanceData}
                            />
                        )}
                        {isDataReady && totalCount === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                                    No pending requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {!assignedRoles.manager && !assignedRoles.finance && (
                    <p style={{ padding: '20px', textAlign: 'center' }}>No claims tasks assigned.</p>
                )}
            </div>
        </div>
    );

}

export default MyTasks;
