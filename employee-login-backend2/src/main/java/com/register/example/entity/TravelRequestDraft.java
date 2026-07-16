package com.register.example.entity;
 
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Date;
import com.register.example.entity.BaseEntity;
 
@Entity
@Table(name = "travel_request_drafts")
public class TravelRequestDraft extends BaseEntity {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
   @Column(name = "employee_id", length = 50)
private String employeeId;

@Column(name = "name", length = 50)
private String name;

@Column(name = "from_location", length = 50)
private String fromLocation;

@Column(name = "to_location", length = 50)
private String toLocation;
 
    @Column(name = "mode_of_travel", length = 50)
private String modeOfTravel;
 
@Column(name = "category", length = 50)
private String category;
 
    private LocalDate departureDate;
 
    private LocalDate returnDate;
 


@Column(name = "accommodation_required", length = 50)
private String accommodationRequired;

@Column(name = "advance_required", length = 50)
private String advanceRequired;
 
    @Column(length = 2000)
    private String remarks;
 
    public TravelRequestDraft() {
        // Empty constructor required for JPA
    }
 
    public Long getId() {
        return id;
    }
 
    public void setId(Long id) {
        this.id = id;
    }
 
    public String getEmployeeId() {
        return employeeId;
    }
 
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }
 
    public String getName() {
        return name;
    }
 
    public void setName(String name) {
        this.name = name;
    }
 
    public String getFromLocation() {
        return fromLocation;
    }
 
    public void setFromLocation(String fromLocation) {
        this.fromLocation = fromLocation;
    }
 
    public String getToLocation() {
        return toLocation;
    }
 
    public void setToLocation(String toLocation) {
        this.toLocation = toLocation;
    }
 
    public String getModeOfTravel() {
        return modeOfTravel;
    }
 
    public void setModeOfTravel(String modeOfTravel) {
        this.modeOfTravel = modeOfTravel;
    }
 
    public String getCategory() {
        return category;
    }
 
    public void setCategory(String category) {
        this.category = category;
    }
 
    public LocalDate getDepartureDate() {
        return departureDate;
    }
 
    public void setDepartureDate(LocalDate departureDate) {
        this.departureDate = departureDate;
    }
 
    public LocalDate getReturnDate() {
        return returnDate;
    }
 
    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }
 
    public String getAccommodationRequired() {
        return accommodationRequired;
    }
 
    public void setAccommodationRequired(String accommodationRequired) {
        this.accommodationRequired = accommodationRequired;
    }
 
    public String getAdvanceRequired() {
        return advanceRequired;
    }
 
    public void setAdvanceRequired(String advanceRequired) {
        this.advanceRequired = advanceRequired;
    }
 
    public String getRemarks() {
        return remarks;
    }
 
    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}