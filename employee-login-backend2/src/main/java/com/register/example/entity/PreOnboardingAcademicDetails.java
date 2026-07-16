package com.register.example.entity;
import jakarta.persistence.*;


@Entity
@Table(name = "preonboarding_academic_details")
public class PreOnboardingAcademicDetails {



    /* ---------------------- SCHOOL (10th) ---------------------- */
    @Column(length = 250)
    private String schoolName;

    @Column(length = 250)
    private String schoolBoard;

    @Column(length = 250)
    private String schoolYearOfPassing;

    @Column(length = 250)
    private String schoolCgpaPercentage;

    @Lob
    @Column(columnDefinition = "LONGBLOB", nullable = true
)
    private byte[] schoolMarksheet;

    @Column(length = 250, nullable = true
)
    private String schoolMarksheetName;

    @Column(length = 250, nullable = true)
    private String schoolMarksheetType;

  

    @Column(length = 250)
    private String intermediateCollegeName;

    @Column(length = 250)
    private String intermediateBoard;

    @Column(length = 250)
    private String intermediateYearOfPassing;

    @Column(length = 250)
    private String intermediateCgpaPercentage;

    @Lob
    @Column(columnDefinition = "LONGBLOB", nullable = true)
    private byte[] intermediateMarksheet;

    @Column(length = 250, nullable = true)
    private String intermediateMarksheetName;

    @Column(length = 250, nullable = true)
    private String intermediateMarksheetType;

    /* -------------------------- UG --------------------------- */
    @Column(length = 250)
    private String ugDegreeType;

    @Column(length = 250)
    private String ugCourse;

    @Column(length = 250)
    private String ugCollegeName;

    @Column(length = 250)
    private String ugUniversity;

    @Column(length = 250)
    private String ugLocation;

    @Column(length = 250)
    private String ugStudyType;

    @Column(length = 250)
    private String ugYearOfPassing;

    @Column(length = 250)
    private String ugRegistrationNumber;

    @Lob
    @Column(columnDefinition = "LONGBLOB", nullable =true)
    private byte[] ugMarksheet;


    @Column(length = 250, nullable = true)
    private String ugMarksheetName;

    @Column(length = 250, nullable = true)
    private String ugMarksheetType;

    @Lob
    @Column(columnDefinition = "LONGBLOB", nullable = true)
    private byte[] ugCertificate;

    @Column(length = 250, nullable = true)
    private String ugCertificateName;

    @Column(length = 250, nullable = true)
    private String ugCertificateType;

    /* -------------------------- PG (Optional) --------------------------- */
    @Column(length = 250)
    private String pgDegreeType;

    @Column(length = 250)
    private String pgCourse;

    @Column(length = 250)
    private String pgCollegeName;

    @Column(length = 250)
    private String pgUniversity;

    @Column(length = 250)
    private String pgLocation;

    @Column(length = 250)
    private String pgStudyType;

    @Column(length = 250)
    private String pgYearOfPassing;

    @Column(length = 250)
    private String pgRegistrationNumber;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pgMarksheet;


    @Column(length = 250)
    private String pgMarksheetName;

    @Column(length = 250)
    private String pgMarksheetType;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pgCertificate;

    @Column(length = 250)
    private String pgCertificateName;

    @Column(length = 250)
    private String pgCertificateType;
    
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


    /* ---------------------- GETTERS AND SETTERS ---------------------- */

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    
    public Applicant getApplicant() { return applicant; }
    public void setApplicant(Applicant applicant) { this.applicant = applicant; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getSchoolBoard() { return schoolBoard; }
    public void setSchoolBoard(String schoolBoard) { this.schoolBoard = schoolBoard; }

    public String getSchoolYearOfPassing() { return schoolYearOfPassing; }
    public void setSchoolYearOfPassing(String schoolYearOfPassing) { this.schoolYearOfPassing = schoolYearOfPassing; }

    public String getSchoolCgpaPercentage() { return schoolCgpaPercentage; }
    public void setSchoolCgpaPercentage(String schoolCgpaPercentage) { this.schoolCgpaPercentage = schoolCgpaPercentage; }

    public byte[] getSchoolMarksheet() { return schoolMarksheet; }
    public void setSchoolMarksheet(byte[] schoolMarksheet) { this.schoolMarksheet = schoolMarksheet; }

    public String getSchoolMarksheetName() { return schoolMarksheetName; }
    public void setSchoolMarksheetName(String schoolMarksheetName) { this.schoolMarksheetName = schoolMarksheetName; }

    public String getSchoolMarksheetType() { return schoolMarksheetType; }
    public void setSchoolMarksheetType(String schoolMarksheetType) { this.schoolMarksheetType = schoolMarksheetType; }


    public String getIntermediateCollegeName() { return intermediateCollegeName; }
    public void setIntermediateCollegeName(String intermediateCollegeName) { this.intermediateCollegeName = intermediateCollegeName; }

    public String getIntermediateBoard() { return intermediateBoard; }
    public void setIntermediateBoard(String intermediateBoard) { this.intermediateBoard = intermediateBoard; }

    public String getIntermediateYearOfPassing() { return intermediateYearOfPassing; }
    public void setIntermediateYearOfPassing(String intermediateYearOfPassing) { this.intermediateYearOfPassing = intermediateYearOfPassing; }

    public String getIntermediateCgpaPercentage() { return intermediateCgpaPercentage; }
    public void setIntermediateCgpaPercentage(String intermediateCgpaPercentage) { this.intermediateCgpaPercentage = intermediateCgpaPercentage; }

    public byte[] getIntermediateMarksheet() { return intermediateMarksheet; }
    public void setIntermediateMarksheet(byte[] intermediateMarksheet) { this.intermediateMarksheet = intermediateMarksheet; }

    public String getIntermediateMarksheetName() { return intermediateMarksheetName; }
    public void setIntermediateMarksheetName(String intermediateMarksheetName) { this.intermediateMarksheetName = intermediateMarksheetName; }

    public String getIntermediateMarksheetType() { return intermediateMarksheetType; }
    public void setIntermediateMarksheetType(String intermediateMarksheetType) { this.intermediateMarksheetType = intermediateMarksheetType; }

    public String getUgDegreeType() { return ugDegreeType; }
    public void setUgDegreeType(String ugDegreeType) { this.ugDegreeType = ugDegreeType; }

    public String getUgCourse() { return ugCourse; }
    public void setUgCourse(String ugCourse) { this.ugCourse = ugCourse; }

    public String getUgCollegeName() { return ugCollegeName; }
    public void setUgCollegeName(String ugCollegeName) { this.ugCollegeName = ugCollegeName; }

    public String getUgUniversity() { return ugUniversity; }
    public void setUgUniversity(String ugUniversity) { this.ugUniversity = ugUniversity; }

    public String getUgLocation() { return ugLocation; }
    public void setUgLocation(String ugLocation) { this.ugLocation = ugLocation; }

    public String getUgStudyType() { return ugStudyType; }
    public void setUgStudyType(String ugStudyType) { this.ugStudyType = ugStudyType; }

    public String getUgYearOfPassing() { return ugYearOfPassing; }
    public void setUgYearOfPassing(String ugYearOfPassing) { this.ugYearOfPassing = ugYearOfPassing; }

    public String getUgRegistrationNumber() { return ugRegistrationNumber; }
    public void setUgRegistrationNumber(String ugRegistrationNumber) { this.ugRegistrationNumber = ugRegistrationNumber; }

    public byte[] getUgMarksheet() { return ugMarksheet; }
    public void setUgMarksheet(byte[] ugMarksheet) { this.ugMarksheet = ugMarksheet; }
    
    public String getPgDegreeType() {
        return pgDegreeType;
    }

    public void setPgDegreeType(String pgDegreeType) {
        this.pgDegreeType = pgDegreeType;
    }

    public String getPgCourse() {
        return pgCourse;
    }

    public void setPgCourse(String pgCourse) {
        this.pgCourse = pgCourse;
    }

    public String getPgCollegeName() {
        return pgCollegeName;
    }

    public void setPgCollegeName(String pgCollegeName) {
        this.pgCollegeName = pgCollegeName;
    }

    public String getPgUniversity() {
        return pgUniversity;
    }

    public void setPgUniversity(String pgUniversity) {
        this.pgUniversity = pgUniversity;
    }

    public String getPgLocation() {
        return pgLocation;
    }

    public void setPgLocation(String pgLocation) {
        this.pgLocation = pgLocation;
    }

    public String getPgStudyType() {
        return pgStudyType;
    }

    public void setPgStudyType(String pgStudyType) {
        this.pgStudyType = pgStudyType;
    }

    public String getPgYearOfPassing() {
        return pgYearOfPassing;
    }

    public void setPgYearOfPassing(String pgYearOfPassing) {
        this.pgYearOfPassing = pgYearOfPassing;
    }

    public String getPgRegistrationNumber() {
        return pgRegistrationNumber;
    }

    public void setPgRegistrationNumber(String pgRegistrationNumber) {
        this.pgRegistrationNumber = pgRegistrationNumber;
    }

    public byte[] getPgMarksheet() {
        return pgMarksheet;
    }

    public void setPgMarksheet(byte[] pgMarksheet) {
        this.pgMarksheet = pgMarksheet;
    }

    public String getPgMarksheetName() {
        return pgMarksheetName;
    }

    public void setPgMarksheetName(String pgMarksheetName) {
        this.pgMarksheetName = pgMarksheetName;
    }

    public String getPgMarksheetType() {
        return pgMarksheetType;
    }

    public void setPgMarksheetType(String pgMarksheetType) {
        this.pgMarksheetType = pgMarksheetType;
    }

    public byte[] getPgCertificate() {
        return pgCertificate;
    }

    public void setPgCertificate(byte[] pgCertificate) {
        this.pgCertificate = pgCertificate;
    }

    public String getPgCertificateName() {
        return pgCertificateName;
    }

    public void setPgCertificateName(String pgCertificateName) {
        this.pgCertificateName = pgCertificateName;
    }

    public String getPgCertificateType() {
        return pgCertificateType;
    }

    public void setPgCertificateType(String pgCertificateType) {
        this.pgCertificateType = pgCertificateType;
    }
    
    public String getUgMarksheetName() {
        return ugMarksheetName;
    }

    public void setUgMarksheetName(String ugMarksheetName) {
        this.ugMarksheetName = ugMarksheetName;
    }

    public String getUgMarksheetType() {
        return ugMarksheetType;
    }

    public void setUgMarksheetType(String ugMarksheetType) {
        this.ugMarksheetType = ugMarksheetType;
    }

    public byte[] getUgCertificate() {
        return ugCertificate;
    }

    public void setUgCertificate(byte[] ugCertificate) {
        this.ugCertificate = ugCertificate;
    }

    public String getUgCertificateName() {
        return ugCertificateName;
    }

    public void setUgCertificateName(String ugCertificateName) {
        this.ugCertificateName = ugCertificateName;
    }

    public String getUgCertificateType() {
        return ugCertificateType;
    }

    public void setUgCertificateType(String ugCertificateType) {
        this.ugCertificateType = ugCertificateType;
    }


}

