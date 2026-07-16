package com.register.example.payload;

import java.time.LocalDate;

public class SubmittedDateDTO {
    private LocalDate date;
    private double totalHours;

    public SubmittedDateDTO() {}

    public SubmittedDateDTO(LocalDate date, double totalHours) {
        this.date = date;
        this.totalHours = totalHours;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public double getTotalHours() { return totalHours; }
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }
}
