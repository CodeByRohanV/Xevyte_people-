import React, { useEffect, useState } from "react";
import api from "../api";
import { FiAlertCircle, FiDownload, FiChevronDown } from "react-icons/fi";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from "../assets/Xevyte.png";
import "./DocumentHub.css";

const YTDReport = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [selectedFY, setSelectedFY] = useState("2026-27");
    const fyOptions = ["2025-26", "2026-27", "2027-28"];

    const getMonthsForFY = (fy) => {
        const [startYear] = fy.split("-").map(Number);
        const fullStartYear = 2000 + (startYear % 100); // Handle 20XX
        return [
            { key: "4", label: "APR", year: fullStartYear },
            { key: "5", label: "MAY", year: fullStartYear },
            { key: "6", label: "JUN", year: fullStartYear },
            { key: "7", label: "JUL", year: fullStartYear },
            { key: "8", label: "AUG", year: fullStartYear },
            { key: "9", label: "SEP", year: fullStartYear },
            { key: "10", label: "OCT", year: fullStartYear },
            { key: "11", label: "NOV", year: fullStartYear },
            { key: "12", label: "DEC", year: fullStartYear },
            { key: "1", label: "JAN", year: fullStartYear + 1 },
            { key: "2", label: "FEB", year: fullStartYear + 1 },
            { key: "3", label: "MAR", year: fullStartYear + 1 }
        ];
    };

    const monthsList = getMonthsForFY(selectedFY);

    const fetchYTDReports = async () => {
        try {
            setLoading(true);
            const response = await api.get("/compensation/ytd-report");
            const result = response.data;
            const currentEmployeeCode = sessionStorage.getItem("employeeId") || "";

            if (result && result.status === "success") {
                let data = result.data || [];
                if (Array.isArray(data) && currentEmployeeCode) {
                    data = data.filter(item => 
                        String(item.employee?.code).toLowerCase() === currentEmployeeCode.toLowerCase() ||
                        String(item.employee?.id).toLowerCase() === currentEmployeeCode.toLowerCase()
                    );
                }
                setReports(data);
                if (data.length > 0) {
                    const selected = data[0];
                    setSelectedEmployee(selected);
                    
                    // Fetch additional profile details using the same ID pattern as ProfileSettingsPage
                    const profileId = currentEmployeeCode || selected.employee?.id || selected.employee?.code;
                    if (profileId) {
                        try {
                            const profileRes = await api.get(`/employees/${profileId}`);
                            // Many APIs wrap the object in a 'data' property if status is present, 
                            // otherwise the body itself is the object.
                            const pData = profileRes.data?.data || profileRes.data;
                            
                            if (pData) {
                                setProfileData({
                                    bank_name: pData.bank_name || pData.bankName || 'N/A',
                                    bank_account_number: pData["Bank Account No: "] || pData.bank_account_number || pData.bankAccountNumber || 'N/A',
                                    date_of_joining: pData.joining_date || pData.joiningDate || pData.date_of_joining || null,
                                    pf_number: pData.pf_member_id || pData.pf_number || pData.pfMemberId || 'N/A'
                                });
                            }
                        } catch (profileErr) {
                            console.error("Error fetching employee profile:", profileErr);
                        }
                    }
                } 
            } else {
                setError(result?.message || "Failed to fetch reports.");
            }
        } catch (err) {
            console.error("Error fetching YTD Reports:", err);
            setError("Failed to fetch YTD Reports. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYTDReports();
    }, []);

    const exportToPDF = () => {
        if (!selectedEmployee) return;

        const { employee, earnings = [], deductions = [], totalGross, totalDeductions, totalNetPay } = selectedEmployee;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // ── Company Header ────────────────────────────────────────────────
        try {
            doc.addImage(logo, 'PNG', 10, 10, 35, 15);
        } catch (e) {
            console.error("Could not add logo to PDF", e);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('XEVYTE TECHNOLOGIES PRIVATE LIMITED', pageWidth / 2 + 20, 15, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('XEVYTE TECHNOLOGIES PRIVATE LIMITED,', pageWidth / 2 + 20, 20, { align: 'center' });
        doc.text('B NO 270, 3RD CROSS ROAD, COFFEE BOARD LAYOUT,', pageWidth / 2 + 20, 24, { align: 'center' });
        doc.text('KEMPAPURA, BENGALURU, KARNATAKA - 560024', pageWidth / 2 + 20, 28, { align: 'center' });
        doc.text('PH: 080-41284021 | WWW.XEVYTE.COM', pageWidth / 2 + 20, 32, { align: 'center' });

        // ── Title ─────────────────────────────────────────────────────────
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const [fyStart, fyEnd] = selectedFY.split('-');
        const fullStart = Number('20' + fyStart.slice(-2));
        const fullEnd = Number('20' + fyEnd);
        doc.text(`YTD Summary for the year ${fullStart} - ${fullEnd}`, pageWidth / 2, 40, { align: 'center' });

        // ── Employee Info Table ───────────────────────────────────────────
        const empRows = [
            [
                { content: 'Employee No:', styles: { fontStyle: 'bold' } }, employee?.code || '',
                { content: 'Name:', styles: { fontStyle: 'bold' } }, employee?.name || ''
            ],
            [
                { content: 'Bank:', styles: { fontStyle: 'bold' } }, profileData?.bank_name || 'N/A',
                { content: 'Bank Account No:', styles: { fontStyle: 'bold' } }, profileData?.bank_account_number || 'N/A'
            ],
            [
                { content: 'Date of Joining:', styles: { fontStyle: 'bold' } }, 
                profileData?.date_of_joining ? new Date(profileData.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
                { content: 'PF Number:', styles: { fontStyle: 'bold' } }, profileData?.pf_number || 'N/A'
            ],
        ];
        autoTable(doc, {
            startY: 44,
            body: empRows,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
            margin: { left: 10, right: 10 }
        });

        // ── Main Data Table ───────────────────────────────────────────────
        const head = [[
            'ITEM',
            ...monthsList.map(m => `${m.label} ${m.year}`),
            'GRAND TOTAL'
        ]];

        const getMonthTotal = (items, key) =>
            items.reduce((s, it) => s + (it.months?.[key] || 0), 0);

        const fmt = (v) => v ? v.toLocaleString() : '';

        const earningRows = earnings.map(item => [
            String(item.name).toUpperCase(),
            ...monthsList.map(m => fmt(item.months?.[m.key])),
            fmt(item.total)
        ]);
        const totalEarningRow = [
            { content: 'TOTAL EARNING', styles: { fontStyle: 'bold' } },
            ...monthsList.map(m => ({ content: fmt(getMonthTotal(earnings, m.key)), styles: { fontStyle: 'bold' } })),
            { content: fmt(totalGross), styles: { fontStyle: 'bold' } }
        ];
        const deductionRows = deductions.map(item => [
            String(item.name).toUpperCase(),
            ...monthsList.map(m => fmt(item.months?.[m.key])),
            fmt(item.total)
        ]);
        const totalDeductionRow = [
            { content: 'TOTAL DEDUCTION', styles: { fontStyle: 'bold' } },
            ...monthsList.map(m => ({ content: fmt(getMonthTotal(deductions, m.key)), styles: { fontStyle: 'bold' } })),
            { content: fmt(totalDeductions), styles: { fontStyle: 'bold' } }
        ];
        const netPayRow = [
            { content: 'NET PAY', styles: { fontStyle: 'bold', textColor: [5, 150, 105] } },
            ...monthsList.map(m => ({
                content: fmt(getMonthTotal(earnings, m.key) - getMonthTotal(deductions, m.key)),
                styles: { fontStyle: 'bold', textColor: [5, 150, 105] }
            })),
            { content: fmt(totalNetPay), styles: { fontStyle: 'bold', textColor: [5, 150, 105] } }
        ];

        const workdaysRow = [
            { content: 'EMP EFFECTIVE WORKDAYS', styles: { fontStyle: 'bold' } },
            ...monthsList.map(() => ''),
            ''
        ];
        const daysInMonthRow = [
            { content: 'DAYS IN MONTH', styles: { fontStyle: 'bold' } },
            ...monthsList.map(() => ''),
            ''
        ];

        const body = [...earningRows, totalEarningRow, ...deductionRows, totalDeductionRow, netPayRow, workdaysRow, daysInMonthRow];
        const boldRowIndexes = new Set([
            earningRows.length, 
            earningRows.length + deductionRows.length + 1, 
            earningRows.length + deductionRows.length + 2,
            earningRows.length + deductionRows.length + 3,
            earningRows.length + deductionRows.length + 4
        ]);

        const startY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 4 : 66;
        autoTable(doc, {
            startY,
            head,
            body,
            theme: 'grid',
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7, halign: 'center', valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.25 },
            bodyStyles: { fontSize: 7, halign: 'right', lineColor: [0, 0, 0], lineWidth: 0.1 },
            columnStyles: { 
                0: { halign: 'left', cellWidth: 36 },
                ...Object.fromEntries(monthsList.map((_, i) => [i + 1, { halign: 'center' }])),
                [monthsList.length + 1]: { halign: 'center' }
            },
            margin: { left: 10, right: 10 },
            didParseCell: (data) => {
                if (data.section === 'body' && boldRowIndexes.has(data.row.index)) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [245, 245, 245];
                }
            }
        });

        // ── Footer ────────────────────────────────────────────────────────
        const now = new Date();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Print Date: ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
            10, pageHeight - 5
        );

        doc.save(`YTD_Summary_${employee?.code || 'Report'}_${selectedFY}.pdf`);
    };


    const renderGridView = () => {
        if (!selectedEmployee) return <div className="message-banner">No YTD data found.</div>;

        const { earnings = [], deductions = [], totalGross, totalDeductions, totalNetPay } = selectedEmployee;

        const getMonthlyTotal = (items, monthKey) => {
            return items.reduce((sum, item) => sum + (item.months?.[monthKey] || 0), 0);
        };

        return (
            <div className="ytd-grid-container">
                <header className="ytd-grid-header">
                    <h2>YTD Summary</h2>
                    <div className="ytd-grid-actions">
                        <div className="fy-selector-wrapper">
                            <select 
                                value={selectedFY} 
                                onChange={(e) => setSelectedFY(e.target.value)}
                                className="fy-dropdown"
                            >
                                {fyOptions.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                            </select>
                        </div>
                        <button className="document-hub-btn" onClick={exportToPDF}><FiDownload /> Download PDF</button>
                    </div>
                </header>

                <div className="ytd-grid-wrapper">
                    <table className="ytd-spreadsheet-table">
                        <thead>
                            <tr>
                                <th className="sticky-col">Item</th>
                                <th className="total-col">Total In ₹</th>
                                {monthsList.map(m => <th key={m.key}>{m.label} {m.year}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="group-header"><td colSpan={monthsList.length + 2}><FiChevronDown /> Income</td></tr>
                            {earnings.map((item, idx) => (
                                <tr key={`earning-${idx}`} className="data-row">
                                    <td className="sticky-col indent">{item.name}</td>
                                    <td className="total-col">₹{item.total.toLocaleString()}</td>
                                    {monthsList.map(m => <td key={m.key}>₹{(item.months?.[m.key] || 0).toLocaleString()}</td>)}
                                </tr>
                            ))}
                            <tr className="subtotal-row">
                                <td className="sticky-col indent">Gross</td>
                                <td className="total-col">₹{totalGross.toLocaleString()}</td>
                                {monthsList.map(m => <td key={m.key}>₹{getMonthlyTotal(earnings, m.key).toLocaleString()}</td>)}
                            </tr>

                            <tr className="group-header"><td colSpan={monthsList.length + 2}><FiChevronDown /> Deduction</td></tr>
                            {deductions.map((item, idx) => (
                                <tr key={`deduction-${idx}`} className="data-row">
                                    <td className="sticky-col indent">{item.name}</td>
                                    <td className="total-col">₹{item.total.toLocaleString()}</td>
                                    {monthsList.map(m => <td key={m.key}>₹{(item.months?.[m.key] || 0).toLocaleString()}</td>)}
                                </tr>
                            ))}
                            <tr className="subtotal-row">
                                <td className="sticky-col indent">Total Deductions</td>
                                <td className="total-col">₹{totalDeductions.toLocaleString()}</td>
                                {monthsList.map(m => <td key={m.key}>₹{getMonthlyTotal(deductions, m.key).toLocaleString()}</td>)}
                            </tr>

                            <tr className="summary-group-row">
                                <td className="sticky-col">Net Pay</td>
                                <td className="total-col">₹{totalNetPay.toLocaleString()}</td>
                                {monthsList.map(m => (
                                    <td key={m.key} className="net-pay-cell">
                                        ₹{(getMonthlyTotal(earnings, m.key) - getMonthlyTotal(deductions, m.key)).toLocaleString()}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="employment-docs-container">
            {loading ? (
                <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <p style={{ marginTop: '1rem', color: '#0d9488', fontWeight: 'bold' }}>Loading analytical data...</p>
                </div>
            ) : error ? (
                <div className="message-banner" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid currentColor' }}>
                    <FiAlertCircle /> {error}
                </div>
            ) : (
                renderGridView()
            )}
        </div>
    );
};

export default YTDReport;
