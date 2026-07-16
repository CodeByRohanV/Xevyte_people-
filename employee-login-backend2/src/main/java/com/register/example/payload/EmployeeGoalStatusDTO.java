package com.register.example.payload;

/**
 * Container class for Employee Goal related DTOs.
 */
public class EmployeeGoalStatusDTO {

    private Long goalId;

    private String employeeId;
    private String employeeFirstName;
    private String employeeLastName;

    private String goalTitle;
    private String status;
    private String feedback;
    private String reviewerComments;

    private Integer rating;
    private String achievedTarget;
    private String selfAssessment;
    private String additionalNotes;
    private Integer managerRating;
    private String managerComments;
    private String metric;
    private String target;

    private String assignedAdminId;

    // ✅ No-arg constructor
    public EmployeeGoalStatusDTO() {
    }

    // ✅ Correct constructor (NO employeeName anymore)
    public EmployeeGoalStatusDTO(String employeeId, String employeeFirstName,
                                 String employeeLastName, String goalTitle, String status) {
        this.employeeId = employeeId;
        this.employeeFirstName = employeeFirstName;
        this.employeeLastName = employeeLastName;
        this.goalTitle = goalTitle;
        this.status = status;
    }

    // ---------------- GETTERS & SETTERS ----------------

    public Long getGoalId() {
        return goalId;
    }
    public void setGoalId(Long goalId) {
        this.goalId = goalId;
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

    public String getGoalTitle() {
        return goalTitle;
    }
    public void setGoalTitle(String goalTitle) {
        this.goalTitle = goalTitle;
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

    public String getAchievedTarget() {
        return achievedTarget;
    }
    public void setAchievedTarget(String achievedTarget) {
        this.achievedTarget = achievedTarget;
    }

    public String getSelfAssessment() {
        return selfAssessment;
    }
    public void setSelfAssessment(String selfAssessment) {
        this.selfAssessment = selfAssessment;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }
    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
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

    public String getAssignedAdminId() {
        return assignedAdminId;
    }
    public void setAssignedAdminId(String assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    /**
     * Static inner class for updating goal status and feedback.
     */
    public static class GoalStatusUpdateDTO {

        private String status;
        private String selfAssessment;
        private Integer rating;
        private String achievedTarget;
        private String additionalNotes;
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

        public String getAchievedTarget() {
            return achievedTarget;
        }
        public void setAchievedTarget(String achievedTarget) {
            this.achievedTarget = achievedTarget;
        }

        public String getAdditionalNotes() {
            return additionalNotes;
        }
        public void setAdditionalNotes(String additionalNotes) {
            this.additionalNotes = additionalNotes;
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
