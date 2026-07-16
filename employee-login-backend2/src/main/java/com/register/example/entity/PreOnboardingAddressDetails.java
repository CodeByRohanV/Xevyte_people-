package com.register.example.entity;

import jakarta.persistence.*;


@Entity
@Table(name = "preonboarding_address_details")
public class PreOnboardingAddressDetails {

    // PRESENT ADDRESS
    @Column(length = 250)
    private String presentAddressLine;

    @Column(length = 250)
    private String presentCity;

    @Column(length = 250)
    private String presentState;

    @Column(length = 250)
    private String presentPincode;

    @Column(length = 250)
    private String presentLandmark;

    @Column(length = 250)
    private String presentNearestPoliceStation;

    @Column(length = 250)
    private String presentContactPersonName;

    @Column(length = 250)
    private String presentContactPersonRelationship;

    @Column(length = 250)
    private String presentContactPersonMobile;

    @Column(length = 250)
    private String presentDurationOfStay;
    
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] presentAddressProof;

    @Column(length = 250)
    private String presentAddressProofName;

    @Column(length = 250)
    private String presentAddressProofType;

    // PERMANENT ADDRESS
    @Column(length = 250)
    private String permanentAddressLine;

    @Column(length = 250)
    private String permanentCity;

    @Column(length = 250)
    private String permanentState;

    @Column(length = 250)
    private String permanentPincode;

    @Column(length = 250)
    private String permanentLandmark;

    @Column(length = 250)
    private String permanentNearestPoliceStation;

    @Column(length = 250)
    private String permanentContactPersonName;

    @Column(length = 250)
    private String permanentContactPersonRelationship;

    @Column(length = 250)
    private String permanentContactPersonMobile;

    @Column(length = 250)
    private String permanentDurationOfStay;
    

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] permanentAddressProof;

    @Column(length = 250)
    private String permanentAddressProofName;

    @Column(length = 250)
    private String permanentAddressProofType;
    
    @Id
    @Column(name = "applicant_id", nullable = false, length = 50)
    private String applicantId;
    
    @Column(name = "same_as_present")
    private Boolean sameAsPresent;


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

    public String getPresentAddressLine() {
        return presentAddressLine;
    }

    public void setPresentAddressLine(String presentAddressLine) {
        this.presentAddressLine = presentAddressLine;
    }

    public String getPresentCity() {
        return presentCity;
    }

    public void setPresentCity(String presentCity) {
        this.presentCity = presentCity;
    }

    public String getPresentState() {
        return presentState;
    }

    public void setPresentState(String presentState) {
        this.presentState = presentState;
    }

    public String getPresentPincode() {
        return presentPincode;
    }

    public void setPresentPincode(String presentPincode) {
        this.presentPincode = presentPincode;
    }

    public String getPresentLandmark() {
        return presentLandmark;
    }

    public void setPresentLandmark(String presentLandmark) {
        this.presentLandmark = presentLandmark;
    }

    public String getPresentNearestPoliceStation() {
        return presentNearestPoliceStation;
    }

    public void setPresentNearestPoliceStation(String presentNearestPoliceStation) {
        this.presentNearestPoliceStation = presentNearestPoliceStation;
    }

    public String getPresentContactPersonName() {
        return presentContactPersonName;
    }

    public void setPresentContactPersonName(String presentContactPersonName) {
        this.presentContactPersonName = presentContactPersonName;
    }

    public String getPresentContactPersonRelationship() {
        return presentContactPersonRelationship;
    }

    public void setPresentContactPersonRelationship(String presentContactPersonRelationship) {
        this.presentContactPersonRelationship = presentContactPersonRelationship;
    }

    public String getPresentContactPersonMobile() {
        return presentContactPersonMobile;
    }

    public void setPresentContactPersonMobile(String presentContactPersonMobile) {
        this.presentContactPersonMobile = presentContactPersonMobile;
    }

    public String getPresentDurationOfStay() {
        return presentDurationOfStay;
    }

    public void setPresentDurationOfStay(String presentDurationOfStay) {
        this.presentDurationOfStay = presentDurationOfStay;
    }

    public String getPermanentAddressLine() {
        return permanentAddressLine;
    }

    public void setPermanentAddressLine(String permanentAddressLine) {
        this.permanentAddressLine = permanentAddressLine;
    }

    public String getPermanentCity() {
        return permanentCity;
    }

    public void setPermanentCity(String permanentCity) {
        this.permanentCity = permanentCity;
    }

    public String getPermanentState() {
        return permanentState;
    }

    public void setPermanentState(String permanentState) {
        this.permanentState = permanentState;
    }

    public String getPermanentPincode() {
        return permanentPincode;
    }

    public void setPermanentPincode(String permanentPincode) {
        this.permanentPincode = permanentPincode;
    }

    public String getPermanentLandmark() {
        return permanentLandmark;
    }

    public void setPermanentLandmark(String permanentLandmark) {
        this.permanentLandmark = permanentLandmark;
    }

    public String getPermanentNearestPoliceStation() {
        return permanentNearestPoliceStation;
    }

    public void setPermanentNearestPoliceStation(String permanentNearestPoliceStation) {
        this.permanentNearestPoliceStation = permanentNearestPoliceStation;
    }

    public String getPermanentContactPersonName() {
        return permanentContactPersonName;
    }

    public void setPermanentContactPersonName(String permanentContactPersonName) {
        this.permanentContactPersonName = permanentContactPersonName;
    }

    public String getPermanentContactPersonRelationship() {
        return permanentContactPersonRelationship;
    }

    public void setPermanentContactPersonRelationship(String permanentContactPersonRelationship) {
        this.permanentContactPersonRelationship = permanentContactPersonRelationship;
    }

    public String getPermanentContactPersonMobile() {
        return permanentContactPersonMobile;
    }

    public void setPermanentContactPersonMobile(String permanentContactPersonMobile) {
        this.permanentContactPersonMobile = permanentContactPersonMobile;
    }

    public String getPermanentDurationOfStay() {
        return permanentDurationOfStay;
    }

    public void setPermanentDurationOfStay(String permanentDurationOfStay) {
        this.permanentDurationOfStay = permanentDurationOfStay;
    }

    public byte[] getPresentAddressProof() { return presentAddressProof; }
    public void setPresentAddressProof(byte[] presentAddressProof) { this.presentAddressProof = presentAddressProof; }

    public String getPresentAddressProofName() { return presentAddressProofName; }
    public void setPresentAddressProofName(String presentAddressProofName) { this.presentAddressProofName = presentAddressProofName; }

    public String getPresentAddressProofType() { return presentAddressProofType; }
    public void setPresentAddressProofType(String presentAddressProofType) { this.presentAddressProofType = presentAddressProofType; }

    public byte[] getPermanentAddressProof() { return permanentAddressProof; }
    public void setPermanentAddressProof(byte[] permanentAddressProof) { this.permanentAddressProof = permanentAddressProof; }

    public String getPermanentAddressProofName() { return permanentAddressProofName; }
    public void setPermanentAddressProofName(String permanentAddressProofName) { this.permanentAddressProofName = permanentAddressProofName; }

    public String getPermanentAddressProofType() { return permanentAddressProofType; }
    public void setPermanentAddressProofType(String permanentAddressProofType) { this.permanentAddressProofType = permanentAddressProofType; }
    
    public Boolean getSameAsPresent() {
        return sameAsPresent;
    }

    public void setSameAsPresent(Boolean sameAsPresent) {
        this.sameAsPresent = sameAsPresent;
    }

}
