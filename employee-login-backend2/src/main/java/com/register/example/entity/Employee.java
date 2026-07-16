package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "employee_portal")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Employee extends BaseEntity {

    // Removed @Id and @GeneratedValue
    @Column(name = "id", unique = true) // Make the existing 'id' field unique
    private Long id;

    @Id // Set employeeId as the Primary Key
    @Column(name = "employee_id", nullable = false) // Removed unique=true since it's the PK now (which is inherently
                                                    // unique)
    private String employeeId;

    @Column(name = "applicant_id", length = 50)
    private String applicantId;

    @Column(name = "assigned_admin_id", length = 50)
    private String assignedAdminId;

    @Column(name = "travel_admin")
    private String travelAdmin;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false)
    private String password;

    @Column(name = "tax_regime", length = 30) // e.g. "OLD", "NEW"
    private String taxRegime;

    @Column(nullable = false)
    private String email;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    private Integer failedAttempts = 0;

    private Boolean accountLocked = false;
    private Boolean mustChangePassword = true;

    private String role;

@Column(name = "assigned_finance_id", length = 50)
private String assignedFinanceId;

@Column(name = "assigned_hr_id", length = 50)
private String assignedHrId;

@Column(name = "assigned_manager_id", length = 50)
private String assignedManagerId;
    private String reviewerId;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    @Column(nullable = false)
    private String active = "yes"; // "yes" = active, "no" = inactive

   
@Column(name = "employee_type", length = 50)
private String employeeType;
// Full-time, Part-time, Contract

@Column(name = "department", length = 50)
private String department;

@Column(name = "probation_status", length = 50)
private String probationStatus;
   // private String probationStatus; // On Probation, Confirmed

    @Lob
    @Column(length = 1000000)
    private String profilePic;

    // === NEW FIELDS ===
    @Column(name = "aadhar_no", unique = true, length = 12)
    private String aadharNo;

    @Column(name = "pan_no", unique = true, length = 10)
    private String panNo;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "present_address", length = 500)
    private String presentAddress;

    @Column(name = "contact_no", length = 15)
    private String contactNo;

    // === ADDITIONAL NEW FIELDS ===
    @Column(name = "work_location", length = 100)
    private String workLocation;

    @Column(name = "personal_mail", length = 100)
    private String personalMail;

    @Column(name = "emergency_contact_number", length = 15)
    private String emergencyContactNumber;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    // === BANK & STATUTORY DETAILS FIELDS ===
    @Column(name = "account_holder_name", length = 100)
    private String accountHolderName;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_number", length = 30) // Use appropriate length
    private String bankAccountNumber;

    @Column(name = "bank_ifsc_code", length = 11)
    private String bankIfscCode;

    @Column(name = "uan_number", length = 12)
    private String uanNumber;

    @Column(name = "pf_member_id", length = 50)
    private String pfMemberId;

    @Column(name = "esi_number", length = 30)
    private String esiNumber;

    @Column(name = "esi_dispensary", length = 100)
    private String esiDispensary;

    @Column(name = "blood_group", length = 15) // <<< ADDED BLOOD GROUP FIELD
    private String bloodGroup;

    @Column(name = "notice_period", length = 100)
    private String noticePeriod;

    // === Constructors ===
    public Employee() {
    }

    public Employee(String employeeId, String password, String email) {
        this.employeeId = employeeId;
        this.password = password;
        this.email = email;
    }

    // === Getters & Setters ===

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

    public String getActive() {
        return active;
    }

    public void setActive(String active) {
        this.active = active;
    }

    public String getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(String assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    public String getTravelAdmin() {
        return travelAdmin;
    }

    public void setTravelAdmin(String travelAdmin) {
        this.travelAdmin = travelAdmin;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getFailedAttempts() {
        return failedAttempts != null ? failedAttempts : 0;
    }

    public void setFailedAttempts(Integer failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public void incrementFailedAttempts() {
        if (this.failedAttempts == null)
            this.failedAttempts = 0;
        this.failedAttempts++;
        if (this.failedAttempts >= 3)
            this.accountLocked = true;
    }

    public Boolean isAccountLocked() {
        return accountLocked != null && accountLocked;
    }

    public void setAccountLocked(Boolean accountLocked) {
        this.accountLocked = accountLocked;
    }

    public Boolean getMustChangePassword() {
        return mustChangePassword != null ? mustChangePassword : true;
    }

    public void setMustChangePassword(Boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAssignedManagerId() {
        return assignedManagerId;
    }

    public void setAssignedManagerId(String assignedManagerId) {
        this.assignedManagerId = assignedManagerId;
    }

    public String getAssignedFinanceId() {
        return assignedFinanceId;
    }

    public void setAssignedFinanceId(String assignedFinanceId) {
        this.assignedFinanceId = assignedFinanceId;
    }

    public String getAssignedHrId() {
        return assignedHrId;
    }

    public void setAssignedHrId(String assignedHrId) {
        this.assignedHrId = assignedHrId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getProfilePic() {
        return profilePic;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }

    public String getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(String reviewerId) {
        this.reviewerId = reviewerId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    // === NEW GETTERS & SETTERS ===
    public String getAadharNo() {
        return aadharNo;
    }

    public void setAadharNo(String aadharNo) {
        this.aadharNo = aadharNo;
    }

    public String getPanNo() {
        return panNo;
    }

    public void setPanNo(String panNo) {
        this.panNo = panNo;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContactNo() {
        return contactNo;
    }

    public void setContactNo(String contactNo) {
        this.contactNo = contactNo;
    }

    public String getWorkLocation() {
        return workLocation;
    }

    public void setWorkLocation(String workLocation) {
        this.workLocation = workLocation;
    }

    public String getPersonalMail() {
        return personalMail;
    }

    public void setPersonalMail(String personalMail) {
        this.personalMail = personalMail;
    }

    public String getEmergencyContactNumber() {
        return emergencyContactNumber;
    }

    public void setEmergencyContactNumber(String emergencyContactNumber) {
        this.emergencyContactNumber = emergencyContactNumber;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getBankIfscCode() {
        return bankIfscCode;
    }

    public void setBankIfscCode(String bankIfscCode) {
        this.bankIfscCode = bankIfscCode;
    }

    public String getUanNumber() {
        return uanNumber;
    }

    public void setUanNumber(String uanNumber) {
        this.uanNumber = uanNumber;
    }

    public String getPfMemberId() {
        return pfMemberId;
    }

    public void setPfMemberId(String pfMemberId) {
        this.pfMemberId = pfMemberId;
    }

    public String getEsiNumber() {
        return esiNumber;
    }

    public void setEsiNumber(String esiNumber) {
        this.esiNumber = esiNumber;
    }

    public String getEsiDispensary() {
        return esiDispensary;
    }

    public void setEsiDispensary(String esiDispensary) {
        this.esiDispensary = esiDispensary;
    }

    // <<< ADDED BLOOD GROUP GETTER AND SETTER
    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getNoticePeriod() {
        return noticePeriod;
    }

    public void setNoticePeriod(String noticePeriod) {
        this.noticePeriod = noticePeriod;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPresentAddress() {
        return presentAddress;
    }

    public void setPresentAddress(String presentAddress) {
        this.presentAddress = presentAddress;
    }

    // getters/setters
    public String getTaxRegime() {
        return taxRegime;
    }

    public void setTaxRegime(String taxRegime) {
        this.taxRegime = taxRegime;
    }

    public String getEmployeeType() {
        return employeeType;
    }

    public void setEmployeeType(String employeeType) {
        this.employeeType = employeeType;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getProbationStatus() {
        return probationStatus;
    }

    public void setProbationStatus(String probationStatus) {
        this.probationStatus = probationStatus;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }
}
