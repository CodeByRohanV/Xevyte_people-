package com.register.example.payload;

import java.time.LocalDate;

/**
 * DTO for Employee data exposed to external applications
 * Includes all fields except highly sensitive data (password, PAN, Aadhar, bank
 * details)
 */
public class EmployeeExternalDto {

    private Long id;
    private String employeeId;
    private String assignedAdminId;
    private String travelAdmin;
    private String firstName;
    private String lastName;
    private String taxRegime;
    private String email;
    private LocalDate joiningDate;
    private Integer failedAttempts;
    private Boolean accountLocked;
    private Boolean mustChangePassword;
    private String role;
    private String assignedManagerId;
    private String assignedFinanceId;
    private String assignedHrId;
    private String reviewerId;
    private String active;
    private String employeeType;
    private String department;
    private String probationStatus;
    private String profilePic;

    // Personal Details
    private String address;
    private String presentAddress;
    private String contactNo;
    private String workLocation;
    private String personalMail;
    private String emergencyContactNumber;
    private String gender;
    private LocalDate dateOfBirth;
    private String bloodGroup;

    // Bank & Statutory Details
    private String accountHolderName;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String uanNumber;
    private String pfMemberId;
    private String esiNumber;
    private String esiDispensary;

    // Sensitive fields excluded for security:
    // - password
    // - aadharNo
    // - panNo

    // Constructors
    public EmployeeExternalDto() {
        // Empty constructor required for deserialization
    }

    // Getters and Setters
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

    public String getTaxRegime() {
        return taxRegime;
    }

    public void setTaxRegime(String taxRegime) {
        this.taxRegime = taxRegime;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public Integer getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(Integer failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public Boolean getAccountLocked() {
        return accountLocked;
    }

    public void setAccountLocked(Boolean accountLocked) {
        this.accountLocked = accountLocked;
    }

    public Boolean getMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(Boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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

    public String getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(String reviewerId) {
        this.reviewerId = reviewerId;
    }

    public String getActive() {
        return active;
    }

    public void setActive(String active) {
        this.active = active;
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

    public String getProfilePic() {
        return profilePic;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPresentAddress() {
        return presentAddress;
    }

    public void setPresentAddress(String presentAddress) {
        this.presentAddress = presentAddress;
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

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
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
}
