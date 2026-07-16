package com.register.example.dto;

public class ScalozAnalyticsHubDTO {

    private AttendanceMetricsDTO attendance;
    private LeaveMetricsDTO leave;
    private ExpenseMetricsDTO expense;
    private SalaryMetricsDTO salary;

    public ScalozAnalyticsHubDTO() {
    }

    public ScalozAnalyticsHubDTO(AttendanceMetricsDTO attendance, LeaveMetricsDTO leave,
                                 ExpenseMetricsDTO expense, SalaryMetricsDTO salary) {
        this.attendance = attendance;
        this.leave = leave;
        this.expense = expense;
        this.salary = salary;
    }

    public AttendanceMetricsDTO getAttendance() { return attendance; }
    public void setAttendance(AttendanceMetricsDTO attendance) { this.attendance = attendance; }

    public LeaveMetricsDTO getLeave() { return leave; }
    public void setLeave(LeaveMetricsDTO leave) { this.leave = leave; }

    public ExpenseMetricsDTO getExpense() { return expense; }
    public void setExpense(ExpenseMetricsDTO expense) { this.expense = expense; }

    public SalaryMetricsDTO getSalary() { return salary; }
    public void setSalary(SalaryMetricsDTO salary) { this.salary = salary; }
}
