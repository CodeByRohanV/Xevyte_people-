package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "preonboarding_personal_details")
public class PreOnboardingPersonalDetails {
	@Id
	@Column(name = "applicant_id", nullable = false, length = 50)
	private String applicantId;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(
	        name = "applicant_id",
	        referencedColumnName = "applicant_id",
	        insertable = false,
	        updatable = false
	)
	private Applicant applicant;


 
    @Column(name = "first_name", nullable = true)
    private String firstName;

    @Column(name = "last_name", nullable = true)
    private String lastName;

    @Column(name = "gender", nullable = true)
    private String gender;

    @Column(name = "date_of_birth", nullable = true)
    private LocalDate dateOfBirth;

    @Column(name = "personal_email", nullable = true)
    private String personalEmail;

    @Column(name = "mobile_number", nullable = true)
    private String mobileNumber;

    @Column(name = "alternate_mobile_number")
    private String alternateMobileNumber;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "father_name")
    private String fatherName;

    @Column(name = "mother_name")
    private String motherName;

    @Column(name = "marital_status")
    private String maritalStatus;
    
 
    @Lob
    @Column(name = "passport_photo", columnDefinition = "LONGBLOB")
    private byte[] passportPhoto;

    
    @Column(name = "passport_photo_name", length = 150)
    private String passportPhotoName;


    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_relationship")
    private String emergencyContactRelationship;

    @Column(name = "emergency_contact_number")
    private String emergencyContactNumber;
    
    @Column(name = "work_email", unique = true, length = 100)
    private String workEmail;


    // Getters and Setters
    
    public String getWorkEmail() { return workEmail; }
    public void setWorkEmail(String workEmail) { this.workEmail = workEmail; }
    
    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    
    public Applicant getApplicant() { return applicant; }
    public void setApplicant(Applicant applicant) { this.applicant = applicant; }

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

    public String getPersonalEmail() {
        return personalEmail;
    }

    public void setPersonalEmail(String personalEmail) {
        this.personalEmail = personalEmail;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getAlternateMobileNumber() {
        return alternateMobileNumber;
    }

    public void setAlternateMobileNumber(String alternateMobileNumber) {
        this.alternateMobileNumber = alternateMobileNumber;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getFatherName() {
        return fatherName;
    }

    public void setFatherName(String fatherName) {
        this.fatherName = fatherName;
    }

    public String getMotherName() {
        return motherName;
    }

    public void setMotherName(String motherName) {
        this.motherName = motherName;
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus;
    }

    public String getPassportPhotoName() {
        return passportPhotoName;
    }

    public void setPassportPhotoName(String passportPhotoName) {
        this.passportPhotoName = passportPhotoName;
    }

    public byte[] getPassportPhoto() {
        return passportPhoto;
    }

    public void setPassportPhoto(byte[] passportPhoto) {
        this.passportPhoto = passportPhoto;
    }


    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public void setEmergencyContactName(String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }

    
    public String getEmergencyContactRelationship() {
        return emergencyContactRelationship;
    }

    public void setEmergencyContactRelationship(String emergencyContactRelationship) {
        this.emergencyContactRelationship = emergencyContactRelationship;
    }

    public String getEmergencyContactNumber() {
        return emergencyContactNumber;
    }

    public void setEmergencyContactNumber(String emergencyContactNumber) {
        this.emergencyContactNumber = emergencyContactNumber;
    }
}
