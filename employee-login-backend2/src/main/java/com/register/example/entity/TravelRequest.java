package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "travel_requests")
public class TravelRequest extends BaseEntity {
    @Column(name = "rejected_reason")
    private String rejectedReason;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;
    @Column(name = "from_location", length = 50)
    private String fromLocation;

    @Column(name = "to_location", length = 50)
    private String toLocation;

    @Column(name = "mode_of_travel", length = 50)
    private String modeOfTravel; // Bus, Train, Flight

    @Column(name = "category", length = 50)
    private String category; // Domestic, International

    @Column(name = "departure_date")
    private LocalDate departureDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "accommodation_required", length = 50)
    private String accommodationRequired;

    @Column(name = "advance_required", length = 50)
    private String advanceRequired;

    @Column(name = "status", length = 50) // Pending, Approved, Rejected, Active, Cancelled
    private String status;

    @Column(name = "assigned_manager_id", length = 50)
    private String assignedManagerId;

    private String remarks;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "manager_reminder_sent_at")
    private Date managerReminderSentAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "admin_reminder_sent_at")
    private Date adminReminderSentAt;

    // === Removed Redundant PDF Fields ===
    // @Column(name = "pdf_file_name")
    // private String pdfFileName;
    // @Column(name = "pdf_content_type")
    // private String pdfContentType;
    // @Lob
    // @Column(name = "pdf_data", columnDefinition = "LONGBLOB")
    // private byte[] pdfData;
    // =====================================

    public TravelRequest() {
        this.status = "Pending";
    }

    @ManyToOne
    @JoinColumn(name = "employee_id", referencedColumnName = "employee_id", insertable = false, updatable = false)
    private Employee employee;

    @Transient
    private String employeeName;

    @OneToMany(mappedBy = "travelRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TravelDocument> documents = new ArrayList<>();

    // === Getters & Setters ===

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Transient
    private String managerName;

    @Transient
    private String adminName;

    // Delegation attribution — persisted so status flow is accurate after approval
    @Column(name = "manager_actor_name", length = 50)
    private String managerActorName; // actual person who approved (delegate or manager)

    @Column(name = "manager_delegator_id", length = 50)
    private String managerDelegatorId; // original manager if delegated

    @Column(name = "manager_delegator_name", length = 50)
    private String managerDelegatorName;

    @Column(name = "admin_actor_name", length = 50)
    private String adminActorName; // actual person who booked (delegate or admin)

    @Column(name = "admin_delegator_id", length = 50)
    private String adminDelegatorId; // original admin if delegated

    @Column(name = "admin_delegator_name", length = 50)
    private String adminDelegatorName;

    // === Getters & Setters ===

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    public String getManagerActorName() { return managerActorName; }
    public void setManagerActorName(String managerActorName) { this.managerActorName = managerActorName; }

    public String getManagerDelegatorId() { return managerDelegatorId; }
    public void setManagerDelegatorId(String managerDelegatorId) { this.managerDelegatorId = managerDelegatorId; }

    public String getManagerDelegatorName() { return managerDelegatorName; }
    public void setManagerDelegatorName(String managerDelegatorName) { this.managerDelegatorName = managerDelegatorName; }

    public String getAdminActorName() { return adminActorName; }
    public void setAdminActorName(String adminActorName) { this.adminActorName = adminActorName; }

    public String getAdminDelegatorId() { return adminDelegatorId; }
    public void setAdminDelegatorId(String adminDelegatorId) { this.adminDelegatorId = adminDelegatorId; }

    public String getAdminDelegatorName() { return adminDelegatorName; }
    public void setAdminDelegatorName(String adminDelegatorName) { this.adminDelegatorName = adminDelegatorName; }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Column(name = "travel_admin")
    private String travelAdmin;

    public String getTravelAdmin() {
        return travelAdmin;
    }

    public void setTravelAdmin(String travelAdmin) {
        this.travelAdmin = travelAdmin;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
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

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAssignedManagerId() {
        return assignedManagerId;
    }

    public void setAssignedManagerId(String assignedManagerId) {
        this.assignedManagerId = assignedManagerId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public List<TravelDocument> getDocuments() {
        return documents;
    }

    public void setDocuments(List<TravelDocument> documents) {
        this.documents = documents;
    }

    public Date getManagerReminderSentAt() {
        return managerReminderSentAt;
    }

    public void setManagerReminderSentAt(Date managerReminderSentAt) {
        this.managerReminderSentAt = managerReminderSentAt;
    }

    public Date getAdminReminderSentAt() {
        return adminReminderSentAt;
    }

    public void setAdminReminderSentAt(Date adminReminderSentAt) {
        this.adminReminderSentAt = adminReminderSentAt;
    }

}