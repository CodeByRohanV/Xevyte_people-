package com.register.example.payload;

import java.util.List;

public class PreOnboardingRequest {

    private String applicantId;
    private Personal personal;
    private Address address;
    private Identity identity;
    private List<EducationEntry> education;
    private Academic academic;
    private List<WorkEntry> workHistory;
    private Documents documents;
    
    private Boolean sameAsPresent; 

    // ---------------------------------------------------------------------
    // UNIVERSAL FileData Object
    // ---------------------------------------------------------------------
    public static class FileData {
        private String fileName;
        private String fileType;
        private String base64;

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }

        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }

        public String getBase64() { return base64; }
        public void setBase64(String base64) { this.base64 = base64; }
    }

    // ---------------------------------------------------------------------
    // PERSONAL DETAILS
    // ---------------------------------------------------------------------
    public static class Personal {

        private String firstName;
        private String lastName;
        private String gender;
        private String dateOfBirth;
        private String personalEmail;
        private String mobileNumber;
        private String alternateMobileNumber;
        private String bloodGroup;
        private String fatherName;
        private String motherName;
        private String maritalStatus;

        private String emergencyContactName;
        private String emergencyContactRelationship;
        private String emergencyContactNumber;

        private FileData passportPhoto;
        
        
        
        private String workEmail;

        public String getWorkEmail() {
            return workEmail;
        }

        public void setWorkEmail(String workEmail) {
            this.workEmail = workEmail;
        }


        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }

        public String getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

        public String getPersonalEmail() { return personalEmail; }
        public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public String getAlternateMobileNumber() { return alternateMobileNumber; }
        public void setAlternateMobileNumber(String alternateMobileNumber) { this.alternateMobileNumber = alternateMobileNumber; }

        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

        public String getFatherName() { return fatherName; }
        public void setFatherName(String fatherName) { this.fatherName = fatherName; }

        public String getMotherName() { return motherName; }
        public void setMotherName(String motherName) { this.motherName = motherName; }

        public String getMaritalStatus() { return maritalStatus; }
        public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

        public String getEmergencyContactName() { return emergencyContactName; }
        public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

        public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
        public void setEmergencyContactRelationship(String emergencyContactRelationship) { this.emergencyContactRelationship = emergencyContactRelationship; }

        public String getEmergencyContactNumber() { return emergencyContactNumber; }
        public void setEmergencyContactNumber(String emergencyContactNumber) { this.emergencyContactNumber = emergencyContactNumber; }

        public FileData getPassportPhoto() { return passportPhoto; }
        public void setPassportPhoto(FileData passportPhoto) { this.passportPhoto = passportPhoto; }
    }

    // ---------------------------------------------------------------------
    // ADDRESS DETAILS
    // ---------------------------------------------------------------------
    public static class Address {

        public static class Block {

            private String addressLine;
            private String city;
            private String state;
            private String pincode;
            private String landmark;
            private String nearestPoliceStation;
            private String contactPersonName;
            private String contactPersonRelationship;
            private String contactPersonMobile;
            private String durationOfStay;

            public String getAddressLine() { return addressLine; }
            public void setAddressLine(String addressLine) { this.addressLine = addressLine; }

            public String getCity() { return city; }
            public void setCity(String city) { this.city = city; }

            public String getState() { return state; }
            public void setState(String state) { this.state = state; }

            public String getPincode() { return pincode; }
            public void setPincode(String pincode) { this.pincode = pincode; }

            public String getLandmark() { return landmark; }
            public void setLandmark(String landmark) { this.landmark = landmark; }

            public String getNearestPoliceStation() { return nearestPoliceStation; }
            public void setNearestPoliceStation(String nearestPoliceStation) {
                this.nearestPoliceStation = nearestPoliceStation;
            }

            public String getContactPersonName() { return contactPersonName; }
            public void setContactPersonName(String contactPersonName) {
                this.contactPersonName = contactPersonName;
            }

            public String getContactPersonRelationship() { return contactPersonRelationship; }
            public void setContactPersonRelationship(String contactPersonRelationship) {
                this.contactPersonRelationship = contactPersonRelationship;
            }

            public String getContactPersonMobile() { return contactPersonMobile; }
            public void setContactPersonMobile(String contactPersonMobile) {
                this.contactPersonMobile = contactPersonMobile;
            }

            public String getDurationOfStay() { return durationOfStay; }
            public void setDurationOfStay(String durationOfStay) {
                this.durationOfStay = durationOfStay;
            }
        }

        private Block present;
        private Block permanent;

        // ✅ NEW: Present Address Proof
        private FileData presentProofFile;

        // ✅ NEW: Permanent Address Proof
        private FileData permanentProofFile;

        public Block getPresent() { return present; }
        public void setPresent(Block present) { this.present = present; }

        public Block getPermanent() { return permanent; }
        public void setPermanent(Block permanent) { this.permanent = permanent; }

        public FileData getPresentProofFile() { return presentProofFile; }
        public void setPresentProofFile(FileData presentProofFile) {
            this.presentProofFile = presentProofFile;
        }

        public FileData getPermanentProofFile() { return permanentProofFile; }
        public void setPermanentProofFile(FileData permanentProofFile) {
            this.permanentProofFile = permanentProofFile;
        }
    }

    // ---------------------------------------------------------------------
    // IDENTITY DOCUMENTS
    // ---------------------------------------------------------------------
    public static class Identity {

        private String aadharNumber;
        private String panNumber;
        private String passportNumber;
        private String voterNumber;
        private String drivingNumber;
        private String utilityNumber;

        private FileData aadharFile;
        private FileData panFile;
        private FileData passportFile;
        private FileData voterFile;
        private FileData drivingFile;
        private FileData utilityFile;

        public String getAadharNumber() { return aadharNumber; }
        public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }

        public String getPanNumber() { return panNumber; }
        public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

        public String getPassportNumber() { return passportNumber; }
        public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }

        public String getVoterNumber() { return voterNumber; }
        public void setVoterNumber(String voterNumber) { this.voterNumber = voterNumber; }

        public String getDrivingNumber() { return drivingNumber; }
        public void setDrivingNumber(String drivingNumber) { this.drivingNumber = drivingNumber; }

        public String getUtilityNumber() { return utilityNumber; }
        public void setUtilityNumber(String utilityNumber) { this.utilityNumber = utilityNumber; }

        public FileData getAadharFile() { return aadharFile; }
        public void setAadharFile(FileData aadharFile) { this.aadharFile = aadharFile; }

        public FileData getPanFile() { return panFile; }
        public void setPanFile(FileData panFile) { this.panFile = panFile; }

        public FileData getPassportFile() { return passportFile; }
        public void setPassportFile(FileData passportFile) { this.passportFile = passportFile; }

        public FileData getVoterFile() { return voterFile; }
        public void setVoterFile(FileData voterFile) { this.voterFile = voterFile; }

        public FileData getDrivingFile() { return drivingFile; }
        public void setDrivingFile(FileData drivingFile) { this.drivingFile = drivingFile; }

        public FileData getUtilityFile() { return utilityFile; }
        public void setUtilityFile(FileData utilityFile) { this.utilityFile = utilityFile; }
    }

    // ---------------------------------------------------------------------
    // EDUCATION BLOCK
    // ---------------------------------------------------------------------
    public static class EducationEntry {

        private String degreeType;
        private String courseMajor;
        private String collegeNameAddress;
        private String university;
        private String studyType;
        private String yearOfPassing;
        private String registrationNumber;

        private FileData marksheetFile;
        private FileData certificateFile;

        public String getDegreeType() { return degreeType; }
        public void setDegreeType(String degreeType) { this.degreeType = degreeType; }

        public String getCourseMajor() { return courseMajor; }
        public void setCourseMajor(String courseMajor) { this.courseMajor = courseMajor; }

        public String getCollegeNameAddress() { return collegeNameAddress; }
        public void setCollegeNameAddress(String collegeNameAddress) {
            this.collegeNameAddress = collegeNameAddress;
        }

        public String getUniversity() { return university; }
        public void setUniversity(String university) { this.university = university; }

        public String getStudyType() { return studyType; }
        public void setStudyType(String studyType) { this.studyType = studyType; }

        public String getYearOfPassing() { return yearOfPassing; }
        public void setYearOfPassing(String yearOfPassing) {
            this.yearOfPassing = yearOfPassing;
        }

        public String getRegistrationNumber() { return registrationNumber; }
        public void setRegistrationNumber(String registrationNumber) {
            this.registrationNumber = registrationNumber;
        }

        public FileData getMarksheetFile() { return marksheetFile; }
        public void setMarksheetFile(FileData marksheetFile) {
            this.marksheetFile = marksheetFile;
        }

        public FileData getCertificateFile() { return certificateFile; }
        public void setCertificateFile(FileData certificateFile) {
            this.certificateFile = certificateFile;
        }
    }

    // ---------------------------------------------------------------------
    // ACADEMIC DETAILS
    // ---------------------------------------------------------------------
    public static class Academic {

        private String schoolName;
        private String schoolBoard;
        private String schoolYearOfPassing;
        private String schoolCgpaPercentage;
        private FileData schoolMarksheet;

        private String intermediateCollegeType;
        private String intermediateCollegeName;
        private String intermediateBoard;
        private String intermediateYearOfPassing;
        private String intermediateCgpaPercentage;
        private FileData intermediateMarksheet;

        private String ugDegreeType;
        private String ugCourse;
        private String ugCollegeName;
        private String ugUniversity;
        private String ugLocation;
        private String ugStudyType;
        private String ugYearOfPassing;
        private String ugRegistrationNumber;
        private FileData ugMarksheet;
        private FileData ugCertificate;

        private String pgDegreeType;
        private String pgCourse;
        private String pgCollegeName;
        private String pgUniversity;
        private String pgLocation;
        private String pgStudyType;
        private String pgYearOfPassing;
        private String pgRegistrationNumber;
        private FileData pgMarksheet;
        private FileData pgCertificate;

        // All getters/setters
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

        public String getSchoolBoard() { return schoolBoard; }
        public void setSchoolBoard(String schoolBoard) { this.schoolBoard = schoolBoard; }

        public String getSchoolYearOfPassing() { return schoolYearOfPassing; }
        public void setSchoolYearOfPassing(String schoolYearOfPassing) {
            this.schoolYearOfPassing = schoolYearOfPassing;
        }

        public String getSchoolCgpaPercentage() { return schoolCgpaPercentage; }
        public void setSchoolCgpaPercentage(String schoolCgpaPercentage) {
            this.schoolCgpaPercentage = schoolCgpaPercentage;
        }

        public FileData getSchoolMarksheet() { return schoolMarksheet; }
        public void setSchoolMarksheet(FileData schoolMarksheet) {
            this.schoolMarksheet = schoolMarksheet;
        }

        public String getIntermediateCollegeType() { return intermediateCollegeType; }
        public void setIntermediateCollegeType(String intermediateCollegeType) {
            this.intermediateCollegeType = intermediateCollegeType;
        }

        public String getIntermediateCollegeName() { return intermediateCollegeName; }
        public void setIntermediateCollegeName(String intermediateCollegeName) {
            this.intermediateCollegeName = intermediateCollegeName;
        }

        public String getIntermediateBoard() { return intermediateBoard; }
        public void setIntermediateBoard(String intermediateBoard) {
            this.intermediateBoard = intermediateBoard;
        }

        public String getIntermediateYearOfPassing() { return intermediateYearOfPassing; }
        public void setIntermediateYearOfPassing(String intermediateYearOfPassing) {
            this.intermediateYearOfPassing = intermediateYearOfPassing;
        }

        public String getIntermediateCgpaPercentage() { return intermediateCgpaPercentage; }
        public void setIntermediateCgpaPercentage(String intermediateCgpaPercentage) {
            this.intermediateCgpaPercentage = intermediateCgpaPercentage;
        }

        public FileData getIntermediateMarksheet() { return intermediateMarksheet; }
        public void setIntermediateMarksheet(FileData intermediateMarksheet) {
            this.intermediateMarksheet = intermediateMarksheet;
        }

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
        public void setUgYearOfPassing(String ugYearOfPassing) {
            this.ugYearOfPassing = ugYearOfPassing;
        }

        public String getUgRegistrationNumber() { return ugRegistrationNumber; }
        public void setUgRegistrationNumber(String ugRegistrationNumber) {
            this.ugRegistrationNumber = ugRegistrationNumber;
        }

        public FileData getUgMarksheet() { return ugMarksheet; }
        public void setUgMarksheet(FileData ugMarksheet) { this.ugMarksheet = ugMarksheet; }

        public FileData getUgCertificate() { return ugCertificate; }
        public void setUgCertificate(FileData ugCertificate) { this.ugCertificate = ugCertificate; }

        public String getPgDegreeType() { return pgDegreeType; }
        public void setPgDegreeType(String pgDegreeType) { this.pgDegreeType = pgDegreeType; }

        public String getPgCourse() { return pgCourse; }
        public void setPgCourse(String pgCourse) { this.pgCourse = pgCourse; }

        public String getPgCollegeName() { return pgCollegeName; }
        public void setPgCollegeName(String pgCollegeName) {
            this.pgCollegeName = pgCollegeName;
        }

        public String getPgUniversity() { return pgUniversity; }
        public void setPgUniversity(String pgUniversity) { this.pgUniversity = pgUniversity; }

        public String getPgLocation() { return pgLocation; }
        public void setPgLocation(String pgLocation) { this.pgLocation = pgLocation; }

        public String getPgStudyType() { return pgStudyType; }
        public void setPgStudyType(String pgStudyType) { this.pgStudyType = pgStudyType; }

        public String getPgYearOfPassing() { return pgYearOfPassing; }
        public void setPgYearOfPassing(String pgYearOfPassing) {
            this.pgYearOfPassing = pgYearOfPassing;
        }

        public String getPgRegistrationNumber() { return pgRegistrationNumber; }
        public void setPgRegistrationNumber(String pgRegistrationNumber) {
            this.pgRegistrationNumber = pgRegistrationNumber;
        }

        public FileData getPgMarksheet() { return pgMarksheet; }
        public void setPgMarksheet(FileData pgMarksheet) { this.pgMarksheet = pgMarksheet; }

        public FileData getPgCertificate() { return pgCertificate; }
        public void setPgCertificate(FileData pgCertificate) { this.pgCertificate = pgCertificate; }
    }

    // ---------------------------------------------------------------------
    // WORK HISTORY
    // ---------------------------------------------------------------------
    public static class WorkEntry {

        private String companyName;
        private String officeLocation;
        private String designation;
        private String employeeId;
        private String salaryDrawn;
        private String reportingManagerName;
        private String reportingManagerEmail;
        private String reportingManagerPhone;
        private String hrManagerName;
        private String hrManagerEmail;
        private String hrManagerPhone;
        private String reasonForLeaving;

        private String dateOfJoining;
        private String dateOfRelieving;

        private FileData offerLetter;
        private FileData relievingLetter;
        private FileData payslips;
        private FileData form16;
        private FileData pfServiceHistoryFile;
        
        

        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }

        public String getOfficeLocation() { return officeLocation; }
        public void setOfficeLocation(String officeLocation) { this.officeLocation = officeLocation; }

        public String getDesignation() { return designation; }
        public void setDesignation(String designation) { this.designation = designation; }

        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

        public String getSalaryDrawn() { return salaryDrawn; }
        public void setSalaryDrawn(String salaryDrawn) { this.salaryDrawn = salaryDrawn; }

        public String getReportingManagerName() { return reportingManagerName; }
        public void setReportingManagerName(String reportingManagerName) {
            this.reportingManagerName = reportingManagerName;
        }

        public String getReportingManagerEmail() { return reportingManagerEmail; }
        public void setReportingManagerEmail(String reportingManagerEmail) {
            this.reportingManagerEmail = reportingManagerEmail;
        }

        public String getReportingManagerPhone() { return reportingManagerPhone; }
        public void setReportingManagerPhone(String reportingManagerPhone) {
            this.reportingManagerPhone = reportingManagerPhone;
        }

        public String getHrManagerName() { return hrManagerName; }
        public void setHrManagerName(String hrManagerName) { this.hrManagerName = hrManagerName; }

        public String getHrManagerEmail() { return hrManagerEmail; }
        public void setHrManagerEmail(String hrManagerEmail) { this.hrManagerEmail = hrManagerEmail; }

        public String getHrManagerPhone() { return hrManagerPhone; }
        public void setHrManagerPhone(String hrManagerPhone) { this.hrManagerPhone = hrManagerPhone; }

        public String getReasonForLeaving() { return reasonForLeaving; }
        public void setReasonForLeaving(String reasonForLeaving) {
            this.reasonForLeaving = reasonForLeaving;
        }

        public String getDateOfJoining() { return dateOfJoining; }
        public void setDateOfJoining(String dateOfJoining) { this.dateOfJoining = dateOfJoining; }

        public String getDateOfRelieving() { return dateOfRelieving; }
        public void setDateOfRelieving(String dateOfRelieving) {
            this.dateOfRelieving = dateOfRelieving;
        }

        public FileData getOfferLetter() { return offerLetter; }
        public void setOfferLetter(FileData offerLetter) { this.offerLetter = offerLetter; }

        public FileData getRelievingLetter() { return relievingLetter; }
        public void setRelievingLetter(FileData relievingLetter) {
            this.relievingLetter = relievingLetter;
        }

        public FileData getPayslips() { return payslips; }
        public void setPayslips(FileData payslips) { this.payslips = payslips; }

        public FileData getForm16() { return form16; }
        public void setForm16(FileData form16) { this.form16 = form16; }

        public FileData getPfServiceHistoryFile() { return pfServiceHistoryFile; }
        public void setPfServiceHistoryFile(FileData pfServiceHistoryFile) {
            this.pfServiceHistoryFile = pfServiceHistoryFile;
        }
    }

    // ---------------------------------------------------------------------
    // DOCUMENTS
    // ---------------------------------------------------------------------
    public static class Documents {

        private FileData resumeFile;
        private List<FileData> others;

        public FileData getResumeFile() { return resumeFile; }
        public void setResumeFile(FileData resumeFile) { this.resumeFile = resumeFile; }

        public List<FileData> getOthers() { return others; }
        public void setOthers(List<FileData> others) { this.others = others; }
    }

    // ---------------------------------------------------------------------
    // ROOT Getters / Setters
    // ---------------------------------------------------------------------
    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public Personal getPersonal() { return personal; }
    public void setPersonal(Personal personal) { this.personal = personal; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public Identity getIdentity() { return identity; }
    public void setIdentity(Identity identity) { this.identity = identity; }

    public List<EducationEntry> getEducation() { return education; }
    public void setEducation(List<EducationEntry> education) { this.education = education; }

    public Academic getAcademic() { return academic; }
    public void setAcademic(Academic academic) { this.academic = academic; }

    public List<WorkEntry> getWorkHistory() { return workHistory; }
    public void setWorkHistory(List<WorkEntry> workHistory) { this.workHistory = workHistory; }

    public Documents getDocuments() { return documents; }
    public void setDocuments(Documents documents) { this.documents = documents; }
    
    public Boolean getSameAsPresent() {
        return sameAsPresent;
    }

    public void setSameAsPresent(Boolean sameAsPresent) {
        this.sameAsPresent = sameAsPresent;
    }

}
