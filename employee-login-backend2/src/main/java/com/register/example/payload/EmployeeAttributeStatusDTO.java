package com.register.example.payload;

/**
 * Container class for Employee Attribute related DTOs.
 * Mirrors EmployeeGoalStatusDTO but for the independent performance_attributes table.
 */
public class EmployeeAttributeStatusDTO {

    private Long attributeId;

    private String employeeId;
    private String employeeFirstName;
    private String employeeLastName;

    private String attributeTitle;
    private String status;
    private String feedback;
    private String reviewerComments;

    private Integer rating;
    private String selfAssessment;
    private Integer managerRating;
    private String managerComments;
    private String metric;
    private String target;

    // No-arg constructor
    public EmployeeAttributeStatusDTO() {
    }

    public EmployeeAttributeStatusDTO(String employeeId, String employeeFirstName,
                                      String employeeLastName, String attributeTitle, String status) {
        this.employeeId = employeeId;
        this.employeeFirstName = employeeFirstName;
        this.employeeLastName = employeeLastName;
        this.attributeTitle = attributeTitle;
        this.status = status;
    }

    // ---------------- GETTERS & SETTERS ----------------

    public Long getAttributeId() {
        return attributeId;
    }
    public void setAttributeId(Long attributeId) {
        this.attributeId = attributeId;
    }

    public String getEmployeeId() {
        return employeeId;
    }
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeFirstName() {
        return employeeFirstName;
    }
    public void setEmployeeFirstName(String employeeFirstName) {
        this.employeeFirstName = employeeFirstName;
    }

    public String getEmployeeLastName() {
        return employeeLastName;
    }
    public void setEmployeeLastName(String employeeLastName) {
        this.employeeLastName = employeeLastName;
    }

    public String getAttributeTitle() {
        return attributeTitle;
    }
    public void setAttributeTitle(String attributeTitle) {
        this.attributeTitle = attributeTitle;
    }

    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

    public String getFeedback() {
        return feedback;
    }
    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getReviewerComments() {
        return reviewerComments;
    }
    public void setReviewerComments(String reviewerComments) {
        this.reviewerComments = reviewerComments;
    }

    public Integer getRating() {
        return rating;
    }
    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getSelfAssessment() {
        return selfAssessment;
    }
    public void setSelfAssessment(String selfAssessment) {
        this.selfAssessment = selfAssessment;
    }

    public Integer getManagerRating() {
        return managerRating;
    }
    public void setManagerRating(Integer managerRating) {
        this.managerRating = managerRating;
    }

    public String getManagerComments() {
        return managerComments;
    }
    public void setManagerComments(String managerComments) {
        this.managerComments = managerComments;
    }

    public String getMetric() {
        return metric;
    }
    public void setMetric(String metric) {
        this.metric = metric;
    }

    public String getTarget() {
        return target;
    }
    public void setTarget(String target) {
        this.target = target;
    }

    /**
     * Static inner class for updating attribute status and feedback.
     */
    public static class AttributeStatusUpdateDTO {

        private String status;
        private String selfAssessment;
        private Integer rating;
        private Integer managerRating;
        private String managerComments;

        public String getStatus() {
            return status;
        }
        public void setStatus(String status) {
            this.status = status;
        }

        public String getSelfAssessment() {
            return selfAssessment;
        }
        public void setSelfAssessment(String selfAssessment) {
            this.selfAssessment = selfAssessment;
        }

        public Integer getRating() {
            return rating;
        }
        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public Integer getManagerRating() {
            return managerRating;
        }
        public void setManagerRating(Integer managerRating) {
            this.managerRating = managerRating;
        }

        public String getManagerComments() {
            return managerComments;
        }
        public void setManagerComments(String managerComments) {
            this.managerComments = managerComments;
        }
    }
}
