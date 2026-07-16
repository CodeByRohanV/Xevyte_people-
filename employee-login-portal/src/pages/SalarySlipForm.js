import React, { useEffect, useState, useRef } from "react";
import { getPropperDate, getISTAsDateObject } from '../utils/DateUtils';
import { useParams } from "react-router-dom";
import api from "../api";
import Xevyte from "../assets/Xevyte.png"; // Adjust path if SalarySlipForm is in a different folder
import html2canvas from "html2canvas";



/**
 * Unified Salary Slip Form
 * - Contains all unique fields from the 4 provided screenshots (no duplicates)
 * - Recommended order chosen by user
 * - Totals calculated and displayed (monthly, yearly, deductions)
 * - Income Tax field supports free text (e.g. "As", "-42,185") while numeric parts contribute to totals if parseable
 *
 * Paste this file as SalarySlipForm.jsx (or replace your existing file).
 */

/* ---------- Helpers ---------- */
function fmt(n) {
  if (n === "" || n === null || isNaN(n)) return "";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toNum(v) {
  if (v === "" || v === null) return 0;
  // allow commas and parentheses/negatives and strings like "-42,185"
  const cleaned = String(v).replace(/,/g, "").replace(/\((.*)\)/, "-$1").trim();
  const num = parseFloat(cleaned);

  // Salary components should not be negative - return zero for negative values
  if (isNaN(num) || num < 0) return 0;
  return num;
}

/* ---------- Main Component ---------- */
export default function SalarySlipForm({ downloadData, payslipId }) {

  const { employeeId } = useParams();
  const [loading, setLoading] = useState(true);
  const currentMonth = getISTAsDateObject(getPropperDate()).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const slipRef = useRef();


  // unified form state (only raw inputs here)
  const [form, setForm] = useState({
    // Employee Meta
    employeeId: "",
    employeeName: "",
    pan: "",
    pfNo: "",
    bankAccountNo: "",
    bankName: "",
    presentDays: "30",
    payDays: "30",
    dateOfJoining: "",
    designation: "",

    // Allowances (monthly)
    basicDA: "",
    hra: "",
    conveyance: "",
    foodAllowance: "",
    childrenEdu: "",
    driverAllowance: "",
    advanceBonus: "",
    telephoneBroadband: "",
    shiftAllowance: "",
    leaveTravel: "",
    statutoryBonus: "",
    variablePay: "",
    specialAllowance: "",
    epfEarning: "",
    nsa: "",
    incentives: "",
    joiningBonus: "",
    otherEarnings: "",
    leaveEncashments: "",

    // Deductions (can be numeric or text for incomeTax)
    pf: "",
    pt: "",
    incomeTax: "",
    medicalInsurance: "",
    lwf: "",
    esi: "",
    loans: "",
  });

  useEffect(() => {
    if (downloadData) {
      setForm({
        employeeId: downloadData.employeeId,
        employeeName: downloadData.employeeName,
        pan: downloadData.pan,
        pfNo: downloadData.pfNo,
        bankAccountNo: downloadData.bankAccount,
        bankName: downloadData.bankName,
        presentDays: downloadData.presentDays,
        payDays: downloadData.payDays,
        dateOfJoining: downloadData.dateOfJoining,
        designation: downloadData.designation,
        location: downloadData.location,
        taxRegime: downloadData.taxRegime,
        pfUan: downloadData.pfUan,
        esiNumber: downloadData.esiNumber,
        lopDays: downloadData.lopDays,
        lopDeduction: downloadData.lopDeduction,


        basicDA: downloadData.basicSalary,
        hra: downloadData.houseRentAllowance,
        conveyance: downloadData.conveyanceAllowance,
        foodAllowance: downloadData.foodAllowance,
        childrenEdu: downloadData.childrenEdu,
        driverAllowance: downloadData.driverAllowance,
        advanceBonus: downloadData.advanceBonus,
        telephoneBroadband: downloadData.telephoneAllowance,
        shiftAllowance: downloadData.shiftAllowance,
        leaveTravel: downloadData.leaveTravel,
        statutoryBonus: downloadData.statutoryBonus,
        variablePay: downloadData.variablePay,
        specialAllowance: downloadData.specialAllowance,
        epfEarning: downloadData.epfEarning,
        nsa: downloadData.nsa,
        incentives: downloadData.incentives,
        joiningBonus: downloadData.joiningBonus,
        otherEarnings: downloadData.otherEarnings,
        leaveEncashments: downloadData.leaveEncashments,

        pf: downloadData.providentFund,
        pt: downloadData.professionalTax,
        incomeTax: downloadData.incomeTax,
        medicalInsurance: downloadData.medicalInsurance,
        lwf: downloadData.lwf,
        esi: downloadData.esi,
        loans: downloadData.loans,
        lopDeduction: toNum(downloadData.lopDeduction),

      });
    }
  }, [downloadData]);


  // computed totals kept in separate state to avoid effect loops
  const [totals, setTotals] = useState({
    totalEarningsMonthly: 0,
    totalEarningsYearly: 0,
    totalDeductions: 0,
  });

  // load employee meta if employeeId provided
  useEffect(() => {
    const token = sessionStorage.getItem("token")?.replace(/^"|"$/g, "");

    if (!employeeId) {
      console.warn("No employeeId in URL param");
      setLoading(false);
      return;
    }

    api.get(`/api/employees/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        const emp = res.data || {};

        setForm((prev) => ({
          ...prev,
          employeeId: emp.employeeId || "",
          employeeName: emp.name || "",
          pan: emp.panNo || "",
          pfNo: emp.pfMemberId || "",
          bankAccountNo: emp.bankAccountNumber || "",
          bankName: emp.bankName || "",
          dateOfJoining: emp.joiningDate || "",
          designation: emp.role || "",
          presentDays: "30",
          payDays: "30",

          address: emp.address || "",
          contactNo: emp.contactNo || "",
          aadharNo: emp.aadharNo || "",
          gender: emp.gender || "",
          dob: emp.dateOfBirth || "",
          emergencyContact: emp.emergencyContactNumber || "",
          ifsc: emp.bankIfscCode || "",
          uan: emp.uanNumber || "",
          esiNumber: emp.esiNumber || "",
          esiDispensary: emp.esiDispensary || "",
          insurerName: emp.insurerName || "",
          insurerRelationship: emp.insurerRelationship || "",
          insurerDOB: emp.insurerDateOfBirth || "",
          bloodGroup: emp.bloodGroup || ""
        }));
      })
      .catch((err) => {
        console.error("Error loading employee:", err);
      })
      .finally(() => setLoading(false));
  }, [employeeId]);


  useEffect(() => {
    if (totals.totalEarningsMonthly == null) return;


    const monthlyGross = totals.totalEarningsMonthly;
    const professionTax = toNum(form.pt);

    const stdDeductionMonthly = 4166.67;
    const totalVIA = 0;
    const incomeAfterSection10 = monthlyGross;

    const taxableIncome =
      incomeAfterSection10 - stdDeductionMonthly - totalVIA;

    const totalTaxMonthly = toNum(form.incomeTax);

    const cessMonthly = totalTaxMonthly * 0.04;
    const taxPrevEmployer = 0;
    const taxTillDate = 0;
    const taxToBeDeducted = totalTaxMonthly;
    const monthlyProjectedTax = totalTaxMonthly;

    setTax({
      incomeAfterSection10,
      professionTax,
      standardDeduction: stdDeductionMonthly,
      totalVIA,
      taxableIncome,
      totalTax: totalTaxMonthly,
      cess: cessMonthly,
      taxPrevEmployer,
      taxTillDate,
      taxToBeDeducted,
      monthlyProjectedTax,
    });

    setForm((prev) => ({
      ...prev,
      incomeAfterSection10,
      professionTax,
      standardDeduction: stdDeductionMonthly,

      totalVIA,
      taxableIncome,
      totalTax: totalTaxMonthly,
      cess: cessMonthly,
      taxPrevEmployer,
      taxTillDate,
      taxToBeDeducted,
      monthlyProjectedTax,
    }));

  }, [
    totals.totalEarningsMonthly,
    form.pt,
    form.incomeTax,
  ]);


  const [tax, setTax] = useState({
    incomeAfterSection10: 0,
    professionTax: 0,
    standardDeduction: 0,
    totalVIA: 0,
    taxableIncome: 0,
    totalTax: 0,
    cess: 0,
    taxPrevEmployer: 0,
    taxTillDate: 0,
    taxToBeDeducted: 0,
    monthlyProjectedTax: 0,
  });


  // Recalculate totals whenever any relevant input changes
  useEffect(() => {
    const monthlySum =
      toNum(form.basicDA) +
      toNum(form.hra) +
      toNum(form.conveyance) +
      toNum(form.foodAllowance) +
      toNum(form.childrenEdu) +
      toNum(form.driverAllowance) +
      toNum(form.advanceBonus) +
      toNum(form.telephoneBroadband) +
      toNum(form.shiftAllowance) +
      toNum(form.leaveTravel) +
      toNum(form.statutoryBonus) +
      toNum(form.variablePay) +
      toNum(form.specialAllowance) +
      toNum(form.epfEarning) +
      toNum(form.nsa) +
      toNum(form.incentives) +
      toNum(form.joiningBonus) +
      toNum(form.otherEarnings) +
      toNum(form.leaveEncashments);


    const yearlySum = monthlySum * 12;

    // incomeTax may be text; only include numeric portion in totals
    const incomeTaxNumeric = toNum(form.incomeTax);

    const deductionsTotal =
      toNum(form.pf) + toNum(form.pt) + toNum(form.medicalInsurance) + incomeTaxNumeric + toNum(form.lwf) +
      toNum(form.esi) +
      toNum(form.loans) + toNum(form.lopDeduction);;


    setTotals({
      totalEarningsMonthly: monthlySum,
      totalEarningsYearly: yearlySum,
      totalDeductions: deductionsTotal,
    });
  }, [
    form.basicDA,
    form.hra,
    form.conveyance,
    form.foodAllowance,
    form.childrenEdu,
    form.driverAllowance,
    form.advanceBonus,
    form.telephoneBroadband,
    form.shiftAllowance,
    form.leaveTravel,
    form.statutoryBonus,
    form.variablePay,
    form.specialAllowance,
    form.epfEarning,
    form.nsa,
    form.pf,
    form.pt,
    form.medicalInsurance,
    form.incomeTax,
    form.incentives,
    form.joiningBonus,
    form.otherEarnings,
    form.leaveEncashments,
    form.lwf,
    form.esi,
    form.loans,
    form.lopDeduction
  ]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // example save: post to backend. For now just log
    console.log("SAVE FORM", { ...form, totals });
    // TODO: call API to store the salary slip if needed
  };

  const handlePrint = () => {
    // primitive print: open new window with formatted html (or implement print stylesheet)
    window.print();
  };

  // const handleDownload = async () => {
  //   if (!slipRef.current) return;

  //   const canvas = await html2canvas(slipRef.current, {
  //     scale: 2,
  //     useCORS: true
  //   });

  //   const dataUrl = canvas.toDataURL("image/png");

  //   // Extract month & year separately
  //   const dateObj = new Date();
  //   const monthName = dateObj.toLocaleString("en-US", { month: "long" });
  //   const yearVal = dateObj.getFullYear();

  //   // Clean employee name
  //   const employeeNameClean = (form.employeeName || "").replace(/\s+/g, "");

  //   // FINAL filename
  //   const fileName = `Payslip_${form.employeeId}_${employeeNameClean}_${monthName}_${yearVal}.png`;

  //   const link = document.createElement("a");
  //   link.href = dataUrl;
  //   link.download = fileName;
  //   link.click();
  // };


  const handleDownload = async () => {

    const response = await api.get(`/api/payroll/payslip/${payslipId}/pdf`, {
      responseType: "blob",
    });

    const fileName =
      response.headers["content-disposition"]
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || "payslip.pdf";

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };



  if (loading) return <p>Loading employee data...</p>;

  const SCREEN_HEIGHT = window.innerHeight;
  const FORM_HEIGHT = 1200; // adjust based on your form height
  document.documentElement.style.setProperty(
    "--scale",
    Math.min(1, SCREEN_HEIGHT / FORM_HEIGHT)
  );

  return (

    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f4f4f4",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >





      <div
        ref={slipRef}
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          background: "white",
          padding: "4px",
          border: "1px solid #000",
          boxSizing: "border-box",
        }}
      >




        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ width: 280 }}>

            <img src={Xevyte} alt="Company Logo" style={{ width: 100, objectFit: "contain" }} />


            <div>
              <div style={{ fontWeight: "bold", marginTop: 6, whiteSpace: "nowrap" }}>
                Company Name : Xevyte Technologies
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            #180, 1st and 2nd Floor, 3rd Cross Road,
            <br />
            Coffee Board Layout, Hebbal,
            <br />
            Bengaluru,Karnataka,560024
            <br />
            Ph:080-41284021 | www.xevyte.com
          </div>
        </div>

        <h3 style={{
          textAlign: "center",
          margin: "4px 0",
          textDecoration: "underline",
          fontSize: "14px"
        }}>
          Salary Slip for the Month of {currentMonth}
        </h3>


        {/* Employee details */}
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tdLabel}>Employee ID</td>
              <td style={styles.tdInput}>
                <input name="employeeId" value={form.employeeId} onChange={handleChange} style={styles.input} />
              </td>

              <td style={styles.tdLabel}>Employee Name</td>
              <td style={styles.tdInput}>
                <input name="employeeName" value={form.employeeName} onChange={handleChange} style={styles.input} />
              </td>
            </tr>

            <tr>
              <td style={styles.tdLabel}>PAN</td>
              <td style={styles.tdInput}>
                <input name="pan" value={form.pan} onChange={handleChange} style={styles.input} />
              </td>

              <td style={styles.tdLabel}>Bank Account No</td>
              <td style={styles.tdInput}>
                <input name="bankAccountNo" value={form.bankAccountNo} onChange={handleChange} style={styles.input} />
              </td>
            </tr>

            <tr>
              <td style={styles.tdLabel}>PF No.</td>
              <td style={styles.tdInput}>
                <input name="pfNo" value={form.pfNo} onChange={handleChange} style={styles.input} />
              </td>

              <td style={styles.tdLabel}>Bank Name</td>
              <td style={styles.tdInput}>
                <input name="bankName" value={form.bankName} onChange={handleChange} style={styles.input} />
              </td>
            </tr>

            <tr>
              <td style={styles.tdLabel}>Present Days</td>
              <td style={styles.tdInput}>
                <input name="presentDays" value={form.presentDays} onChange={handleChange} style={styles.input} />
              </td>

              <td style={styles.tdLabel}>Pay Days</td>
              <td style={styles.tdInput}>
                <input name="payDays" value={form.payDays} onChange={handleChange} style={styles.input} />
              </td>
            </tr>


            <tr>
              <td style={styles.tdLabel}>LOP Days</td>
              <td style={styles.tdInput}>
                <input name="lopDays" value={form.lopDays} readOnly style={styles.input} />
              </td>

              <td style={styles.tdLabel}>LOP Deduction</td>
              <td style={styles.tdInput}>
                <input name="lopDeduction" value={fmt(form.lopDeduction)} readOnly style={styles.input} />
              </td>
            </tr>

            <tr>
              <td style={styles.tdLabel}>Location</td>
              <td style={styles.tdInput}>
                <input value={form.location} readOnly style={styles.input} />
              </td>

              <td style={styles.tdLabel}>Tax Regime</td>
              <td style={styles.tdInput}>
                <input value={form.taxRegime} readOnly style={styles.input} />
              </td>
            </tr>

            <tr>
              <td style={styles.tdLabel}>PF UAN</td>
              <td style={styles.tdInput}>
                <input value={form.pfUan} readOnly style={styles.input} />
              </td>

              <td style={styles.tdLabel}>ESI Number</td>
              <td style={styles.tdInput}>
                <input value={form.esiNumber} readOnly style={styles.input} />
              </td>
            </tr>


            <tr>
              <td style={styles.tdLabel}>Date Of Joining</td>
              <td style={styles.tdInput}>
                <input name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} style={styles.input} />
              </td>

              <td style={styles.tdLabel}>Designation</td>
              <td style={styles.tdInput}>
                <input name="designation" value={form.designation} onChange={handleChange} style={styles.input} />
              </td>


            </tr>
          </tbody>
        </table>

        {/* Pay & Allowances / Deductions table */}
        <table style={{ ...styles.table, marginTop: 10 }}>

          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>


          <thead>
            <tr>
              <th style={styles.thLeft}>Pay & Allowances</th>
              <th style={styles.th}>Monthly</th>
              <th style={styles.th}>Yearly</th>
              <th style={styles.th}>Deductions</th>
              <th style={styles.th}>Amounts(INR)</th>
            </tr>
          </thead>

          <tbody>
            {/* recommended order as requested */}
            <AllowanceRow
              label="Basic & Dearness Allowance"
              name="basicDA"
              value={form.basicDA}
              onChange={handleChange}
              yearly={toNum(form.basicDA) * 12}
              deductionLabel="PF"
              deductionName="pf"
              deductionValue={form.pf}
              onDedChange={handleChange}
              deductionIsText={false}
            />

            <AllowanceRow
              label="House Rent Allowance"
              name="hra"
              value={form.hra}
              onChange={handleChange}
              yearly={toNum(form.hra) * 12}
              deductionLabel="PT"
              deductionName="pt"
              deductionValue={form.pt}
              onDedChange={handleChange}
              deductionIsText={false}
            />

            <SimpleAllowance label="Conveyance Allowance" name="conveyance" value={form.conveyance} onChange={handleChange} yearly={toNum(form.conveyance) * 12} />

            <SimpleAllowance label="Food Allowance" name="foodAllowance" value={form.foodAllowance} onChange={handleChange} yearly={toNum(form.foodAllowance) * 12} />

            <AllowanceRow
              label="Children Education (School)"
              name="childrenEdu"
              value={form.childrenEdu}
              onChange={handleChange}
              yearly={toNum(form.childrenEdu) * 12}
              deductionLabel="Income Tax"
              deductionName="incomeTax"
              deductionValue={form.incomeTax}
              onDedChange={handleChange}
              deductionIsText={true}
            />

            <SimpleAllowance label="Driver Allowance" name="driverAllowance" value={form.driverAllowance} onChange={handleChange} yearly={toNum(form.driverAllowance) * 12} />

            <AllowanceRow
              label="Advance Bonus / Exgratia"
              name="advanceBonus"
              value={form.advanceBonus}
              onChange={handleChange}
              yearly={toNum(form.advanceBonus) * 12}
              deductionLabel="Medical Insurance"
              deductionName="medicalInsurance"
              deductionValue={form.medicalInsurance}
              onDedChange={handleChange}
              deductionIsText={false}
            />

            <SimpleAllowance label="Telephone & Broadband Allowance" name="telephoneBroadband" value={form.telephoneBroadband} onChange={handleChange} yearly={toNum(form.telephoneBroadband) * 12} />

            <SimpleAllowance label="Shift Allowance" name="shiftAllowance" value={form.shiftAllowance} onChange={handleChange} yearly={toNum(form.shiftAllowance) * 12} />

            <SimpleAllowance label="Leave Travel Concession" name="leaveTravel" value={form.leaveTravel} onChange={handleChange} yearly={toNum(form.leaveTravel) * 12} />

            <SimpleAllowance label="Statutory Bonus" name="statutoryBonus" value={form.statutoryBonus} onChange={handleChange} yearly={toNum(form.statutoryBonus) * 12} />

            <SimpleAllowance label="Variable Pay" name="variablePay" value={form.variablePay} onChange={handleChange} yearly={toNum(form.variablePay) * 12} />

            <SimpleAllowance label="Spl. Allowance" name="specialAllowance" value={form.specialAllowance} onChange={handleChange} yearly={toNum(form.specialAllowance) * 12} />

            <SimpleAllowance label="EPF (Earnings)" name="epfEarning" value={form.epfEarning} onChange={handleChange} yearly={toNum(form.epfEarning) * 12} />

            <SimpleAllowance label="NSA" name="nsa" value={form.nsa} onChange={handleChange} yearly={toNum(form.nsa) * 12} />

            <SimpleAllowance
              label="Incentives"
              name="incentives"
              value={form.incentives}
              onChange={handleChange}
              yearly={toNum(form.incentives) * 12}
            />

            <SimpleAllowance
              label="Joining Bonus"
              name="joiningBonus"
              value={form.joiningBonus}
              onChange={handleChange}
              yearly={toNum(form.joiningBonus) * 12}
            />

            <SimpleAllowance
              label="Other earnings (Reimbursements)"
              name="otherEarnings"
              value={form.otherEarnings}
              onChange={handleChange}
              yearly={toNum(form.otherEarnings) * 12}
            />

            <SimpleAllowance
              label="Leave encashments"
              name="leaveEncashments"
              value={form.leaveEncashments}
              onChange={handleChange}
              yearly={toNum(form.leaveEncashments) * 12}
            />

            <AllowanceRow
              label=""
              yearly=""
              deductionLabel="LWF"
              deductionName="lwf"
              deductionValue={form.lwf}
              onDedChange={handleChange}
            />

            <AllowanceRow
              label=""
              yearly=""
              deductionLabel="ESI"
              deductionName="esi"
              deductionValue={form.esi}
              onDedChange={handleChange}
            />

            <AllowanceRow
              label=""
              yearly=""
              deductionLabel="Loans"
              deductionName="loans"
              deductionValue={form.loans}
              onDedChange={handleChange}
            />



            {/* Totals / Part A row */}
            <tr>
              <td style={{ ...styles.tdLeft, fontWeight: "bold" }}>Part A - Earnings</td>
              <td style={{ ...styles.td, fontWeight: "bold" }}>{fmt(totals.totalEarningsMonthly)}</td>
              <td style={{ ...styles.td, fontWeight: "bold" }}>{fmt(totals.totalEarningsYearly)}</td>
              <td style={styles.td}></td>
              <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}>Total Deductions</td>
            </tr>

            {/* show Total Deductions on the far right */}
            <tr>
              <td style={styles.td} colSpan={4}></td>
              <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}>{fmt(totals.totalDeductions)}</td>
            </tr>

            <tr>
              <td style={styles.tdLeft}><b>Net Salary (A – Deductions)</b></td>
              <td style={styles.td}></td>
              <td style={styles.td}></td>
              <td style={styles.td}></td>
              <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}>
                {fmt(totals.totalEarningsMonthly - totals.totalDeductions)}
              </td>

            </tr>




          </tbody>
        </table>
        {/* Income Tax Deduction Grid */}
        <table style={{ ...styles.table, marginTop: 15 }}>
          <thead>
            <tr>
              <th style={styles.thLeft}>Income Tax Deduction</th>
              <th style={styles.th}>Amount (Monthly)</th>
            </tr>
          </thead>
          <tbody>
            <TaxRow label="Income after Section 10 Exemption" value={tax.incomeAfterSection10} />
            <TaxRow label="Profession Tax" value={tax.professionTax} />
            <TaxRow label="Standard Deduction" value={tax.standardDeduction} />
            <TaxRow label="Total VI A Deduction" value={tax.totalVIA} />
            <TaxRow label="Taxable Income" value={tax.taxableIncome} />
            <TaxRow label="Total Tax" value={tax.totalTax} />
            <TaxRow label="Education Cess" value={tax.cess} />
            <TaxRow label="Tax Deducted (Previous Employer)" value={tax.taxPrevEmployer} />
            <TaxRow label="Tax Deducted Till Date" value={tax.taxTillDate} />
            <TaxRow label="Tax to be Deducted" value={tax.taxToBeDeducted} />
            <TaxRow label="Monthly Projected Tax" value={tax.monthlyProjectedTax} />
          </tbody>
        </table>

      </div>
    </div>

  );
}


/* ---------- Small subcomponents ---------- */
function AllowanceRow({
  label,
  name,
  value,
  onChange,
  yearly,
  deductionLabel,
  deductionName,
  deductionValue,
  onDedChange,
  deductionIsText,
}) {
  return (
    <tr>
      <td style={styles.tdLeft}>{label}</td>
      <td style={styles.td}>
        <input name={name} value={value} onChange={onChange} style={styles.inputNumber} />
      </td>
      <td style={styles.td}>{fmt(yearly)}</td>

      <td style={styles.td}>{deductionLabel || ""}</td>
      <td style={{ ...styles.td, textAlign: "right" }}>
        {deductionName ? (
          deductionIsText ? (
            <input name={deductionName} value={deductionValue} onChange={onDedChange} style={styles.input} />
          ) : (
            <input name={deductionName} value={deductionValue} onChange={onDedChange} style={styles.inputNumber} />
          )
        ) : (
          ""
        )}
      </td>

    </tr>
  );
}

function TaxRow({ label, value }) {
  return (
    <tr>
      <td style={styles.tdLeft}>{label}</td>
      <td style={{ ...styles.td, textAlign: "right" }}>{fmt(value)}</td>
    </tr>
  );
}


function SimpleAllowance({ label, name, value, onChange, yearly }) {
  return (
    <tr>
      <td style={styles.tdLeft}>{label}</td>
      <td style={styles.td}>
        <input name={name} value={value} onChange={onChange} style={styles.inputNumber} />
      </td>
      <td style={styles.td}>{fmt(yearly)}</td>
      <td style={styles.td}></td>
      <td style={{ ...styles.td }}></td>
    </tr>
  );
}

/* ---------- Styles ---------- */
const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",   // ★ THIS FIXES YOUR WIDE COLUMNS
    fontSize: "12px",
    lineHeight: "1",
    color: "black",
  },
  th: {
    border: "1px solid #000",
    padding: "1px 3px",

    textAlign: "center",
    background: "#f2f2f2",
    fontWeight: "600",
    color: "black"
  },
  thLeft: {
    border: "1px solid #000",
    padding: "1px 3px",

    textAlign: "left",
    background: "#f2f2f2",
    fontWeight: "600",
    color: "black"
  },
  td: {
    border: "1px dotted #666",
    padding: "1px 3px",

    verticalAlign: "middle",
  },
  tdLeft: {
    border: "1px dotted #666",
    padding: "1px 3px",

    verticalAlign: "middle",
    textAlign: "left",
  },
  tdLabel: {
    border: "1px dotted #666",
    padding: "1px 3px",

    fontWeight: "600",
    width: "10%",
  },
  tdInput: {
    border: "1px dotted #666",
    padding: "1px 3px",

    width: "32%",
  },
  input: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "12px",
    padding: 0,
    margin: 0,
    background: "transparent",
  },
  inputNumber: {
    width: "95%",

    border: "none",
    outline: "none",
    textAlign: "right",
    fontSize: "12px",
    padding: 0,
    margin: 0,
    background: "transparent",
  },
  buttonPrimary: {
    padding: "4px 8px",
    background: "#0b79d0",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  button: {
    padding: "4px 8px",
    background: "#eee",
    border: "1px solid #999",
    cursor: "pointer",
    color: "black",
  },


};

