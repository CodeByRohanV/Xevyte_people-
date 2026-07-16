// src/main/java/com/register/example/dto/BulkOnboardResult.java

package com.register.example.payload;

import java.util.List;

public class BulkOnboardResult {
    private int totalRecords;
    private int successCount;
    private List<FailureDetail> failureDetails;

    // Default constructor needed for Jackson/JSON serialization
    public BulkOnboardResult() {
    }

    public BulkOnboardResult(int totalRecords, int successCount, List<FailureDetail> failureDetails) {
        this.totalRecords = totalRecords;
        this.successCount = successCount;
        this.failureDetails = failureDetails; 
    }

    // --- Inner Class for Failure Details ---
    public static class FailureDetail {
        private int rowNumber;
        private String employeeId;
        private String reason;

        // Default constructor needed for Jackson/JSON serialization
        public FailureDetail() {
        }
        
        public FailureDetail(int rowNumber, String employeeId, String reason) {
            this.rowNumber = rowNumber;
            this.employeeId = employeeId;
            this.reason = reason;
        }

        // Getters and Setters
        public int getRowNumber() {
            return rowNumber;
        }

        public void setRowNumber(int rowNumber) {
            this.rowNumber = rowNumber;
        }

        public String getEmployeeId() {
            return employeeId;
        }

        public void setEmployeeId(String employeeId) {
            this.employeeId = employeeId;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    // --- Getters and Setters for BulkOnboardResult ---

    public int getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(int totalRecords) {
        this.totalRecords = totalRecords;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public List<FailureDetail> getFailureDetails() {
        return failureDetails;
    }

    public void setFailureDetails(List<FailureDetail> failureDetails) {
        this.failureDetails = failureDetails;
    }
}