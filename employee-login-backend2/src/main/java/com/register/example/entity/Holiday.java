package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "holidays")
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    @Column(name = "day", length = 100)
    private String day;

    @Column(name = "holiday", length = 100)
    private String holiday;
    
    @Column(name = "location", nullable = false, length = 100)
    private String location;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    public Holiday() {}

    public Holiday(LocalDate date, String day, String holiday, String location) {
        this.date = date;
        this.day = day;
        this.holiday = holiday;
        this.location = location;
    }

    public Holiday(LocalDate date, String day, String holiday, String location, String tenantId) {
        this.date = date;
        this.day = day;
        this.holiday = holiday;
        this.location = location;
        this.tenantId = tenantId;
    }

    // getters and setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getHoliday() { return holiday; }
    public void setHoliday(String holiday) { this.holiday = holiday; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
