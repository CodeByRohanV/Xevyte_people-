package com.register.example.dto;

import java.time.LocalDate;

public class AssetAllocationDTO {
    private Long id;
    private String allocationId;
    private LocalDate allocationDate;
    private LocalDate expectedReturnDate;
    private LocalDate returnDate;
    private String conditionAtIssue;
    private String conditionAtReturn;
    private String accessoriesIssued;
    private String damageNotes;
    private String verifiedBy;
    private boolean active;
    
    // Nested DTOs for asset and employee (excluding images for performance)
    private AssetSummaryDTO asset;
    private EmployeeSummaryDTO employee;

    public static class AssetSummaryDTO {
        private Long id;
        private String assetTag;
        private String status;
        
        // Getters and setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getAssetTag() { return assetTag; }
        public void setAssetTag(String assetTag) { this.assetTag = assetTag; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class EmployeeSummaryDTO {
        private String employeeId;
        private String firstName;
        private String lastName;
        
        // Getters and setters
        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
    }

    // Getters and setters for main class
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getAllocationId() { return allocationId; }
    public void setAllocationId(String allocationId) { this.allocationId = allocationId; }
    
    public LocalDate getAllocationDate() { return allocationDate; }
    public void setAllocationDate(LocalDate allocationDate) { this.allocationDate = allocationDate; }
    
    public LocalDate getExpectedReturnDate() { return expectedReturnDate; }
    public void setExpectedReturnDate(LocalDate expectedReturnDate) { this.expectedReturnDate = expectedReturnDate; }
    
    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }
    
    public String getConditionAtIssue() { return conditionAtIssue; }
    public void setConditionAtIssue(String conditionAtIssue) { this.conditionAtIssue = conditionAtIssue; }
    
    public String getConditionAtReturn() { return conditionAtReturn; }
    public void setConditionAtReturn(String conditionAtReturn) { this.conditionAtReturn = conditionAtReturn; }
    
    public String getAccessoriesIssued() { return accessoriesIssued; }
    public void setAccessoriesIssued(String accessoriesIssued) { this.accessoriesIssued = accessoriesIssued; }
    
    public String getDamageNotes() { return damageNotes; }
    public void setDamageNotes(String damageNotes) { this.damageNotes = damageNotes; }
    
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    
    public AssetSummaryDTO getAsset() { return asset; }
    public void setAsset(AssetSummaryDTO asset) { this.asset = asset; }
    
    public EmployeeSummaryDTO getEmployee() { return employee; }
    public void setEmployee(EmployeeSummaryDTO employee) { this.employee = employee; }
}
