package com.register.example.payload;

import org.springframework.web.multipart.MultipartFile;

public class WorkflowUploadRequest {

    private String employeeIds;
    private String category;
    private Integer year;          // ⭐ Selected year from frontend
    private MultipartFile file;

    public String getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(String employeeIds) {
        this.employeeIds = employeeIds;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
    }
}
