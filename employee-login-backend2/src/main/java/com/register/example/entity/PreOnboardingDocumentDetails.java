package com.register.example.entity;

import jakarta.persistence.*;


@Entity
@Table(name = "preonboarding_identity_details")
public class PreOnboardingDocumentDetails {

    // AADHAR (Mandatory)
    @Column(name = "aadhar_number", length = 20, nullable = true)
    private String aadharNumber;

    @Lob
    @Column(name = "aadhar_file", columnDefinition = "LONGBLOB", nullable = true)
    private byte[] aadharFile;

    @Column(name = "aadhar_file_name", length = 100)
    private String aadharFileName;

    @Column(name = "aadhar_file_type", length = 50)
    private String aadharFileType;

    // PAN CARD (Mandatory)
    @Column(name = "pan_number", length = 20, nullable = true)
    private String panNumber;

    @Lob
    @Column(name = "pan_file", columnDefinition = "LONGBLOB", nullable = true)
    private byte[] panFile;

    @Column(name = "pan_file_name", length = 100)
    private String panFileName;

    @Column(name = "pan_file_type", length = 50)
    private String panFileType;

    // PASSPORT (Optional)
    @Column(name = "passport_number", length = 20)
    private String passportNumber;

    @Lob
    @Column(name = "passport_file", columnDefinition = "LONGBLOB")
    private byte[] passportFile;

    @Column(name = "passport_file_name", length = 100)
    private String passportFileName;

    @Column(name = "passport_file_type", length = 50)
    private String passportFileType;

    // VOTER ID (Optional)
    @Column(name = "voter_number", length = 20)
    private String voterNumber;

    @Lob
    @Column(name = "voter_file", columnDefinition = "LONGBLOB")
    private byte[] voterFile;

    @Column(name = "voter_file_name", length = 100)
    private String voterFileName;

    @Column(name = "voter_file_type", length = 50)
    private String voterFileType;

    // DRIVING LICENSE (Optional)
    @Column(name = "driving_number", length = 20)
    private String drivingNumber;

    @Lob
    @Column(name = "driving_file", columnDefinition = "LONGBLOB")
    private byte[] drivingFile;

    @Column(name = "driving_file_name", length = 100)
    private String drivingFileName;

    @Column(name = "driving_file_type", length = 50)
    private String drivingFileType;

    // UTILITY BILLS (Optional)
    @Column(name = "utility_number", length = 20)
    private String utilityNumber;

    @Lob
    @Column(name = "utility_file", columnDefinition = "LONGBLOB")
    private byte[] utilityFile;

    @Column(name = "utility_file_name", length = 100)
    private String utilityFileName;

    @Column(name = "utility_file_type", length = 50)
    private String utilityFileType;
    
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


    // Getters and Setters

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    
    public Applicant getApplicant() { return applicant; }
    public void setApplicant(Applicant applicant) { this.applicant = applicant; }

    public String getAadharNumber() {
        return aadharNumber;
    }

    public void setAadharNumber(String aadharNumber) {
        this.aadharNumber = aadharNumber;
    }

    public byte[] getAadharFile() {
        return aadharFile;
    }

    public void setAadharFile(byte[] aadharFile) {
        this.aadharFile = aadharFile;
    }

    public String getAadharFileName() {
        return aadharFileName;
    }

    public void setAadharFileName(String aadharFileName) {
        this.aadharFileName = aadharFileName;
    }

    public String getAadharFileType() {
        return aadharFileType;
    }

    public void setAadharFileType(String aadharFileType) {
        this.aadharFileType = aadharFileType;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public byte[] getPanFile() {
        return panFile;
    }

    public void setPanFile(byte[] panFile) {
        this.panFile = panFile;
    }

    public String getPanFileName() {
        return panFileName;
    }

    public void setPanFileName(String panFileName) {
        this.panFileName = panFileName;
    }

    public String getPanFileType() {
        return panFileType;
    }

    public void setPanFileType(String panFileType) {
        this.panFileType = panFileType;
    }

    public String getPassportNumber() {
        return passportNumber;
    }

    public void setPassportNumber(String passportNumber) {
        this.passportNumber = passportNumber;
    }

    public byte[] getPassportFile() {
        return passportFile;
    }

    public void setPassportFile(byte[] passportFile) {
        this.passportFile = passportFile;
    }

    public String getPassportFileName() {
        return passportFileName;
    }

    public void setPassportFileName(String passportFileName) {
        this.passportFileName = passportFileName;
    }

    public String getPassportFileType() {
        return passportFileType;
    }

    public void setPassportFileType(String passportFileType) {
        this.passportFileType = passportFileType;
    }

    public String getVoterNumber() {
        return voterNumber;
    }

    public void setVoterNumber(String voterNumber) {
        this.voterNumber = voterNumber;
    }

    public byte[] getVoterFile() {
        return voterFile;
    }

    public void setVoterFile(byte[] voterFile) {
        this.voterFile = voterFile;
    }

    public String getVoterFileName() {
        return voterFileName;
    }

    public void setVoterFileName(String voterFileName) {
        this.voterFileName = voterFileName;
    }

    public String getVoterFileType() {
        return voterFileType;
    }

    public void setVoterFileType(String voterFileType) {
        this.voterFileType = voterFileType;
    }

    public String getDrivingNumber() {
        return drivingNumber;
    }

    public void setDrivingNumber(String drivingNumber) {
        this.drivingNumber = drivingNumber;
    }

    public byte[] getDrivingFile() {
        return drivingFile;
    }

    public void setDrivingFile(byte[] drivingFile) {
        this.drivingFile = drivingFile;
    }

    public String getDrivingFileName() {
        return drivingFileName;
    }

    public void setDrivingFileName(String drivingFileName) {
        this.drivingFileName = drivingFileName;
    }

    public String getDrivingFileType() {
        return drivingFileType;
    }

    public void setDrivingFileType(String drivingFileType) {
        this.drivingFileType = drivingFileType;
    }

    public String getUtilityNumber() {
        return utilityNumber;
    }

    public void setUtilityNumber(String utilityNumber) {
        this.utilityNumber = utilityNumber;
    }

    public byte[] getUtilityFile() {
        return utilityFile;
    }

    public void setUtilityFile(byte[] utilityFile) {
        this.utilityFile = utilityFile;
    }

    public String getUtilityFileName() {
        return utilityFileName;
    }

    public void setUtilityFileName(String utilityFileName) {
        this.utilityFileName = utilityFileName;
    }

    public String getUtilityFileType() {
        return utilityFileType;
    }

    public void setUtilityFileType(String utilityFileType) {
        this.utilityFileType = utilityFileType;
    }
}
