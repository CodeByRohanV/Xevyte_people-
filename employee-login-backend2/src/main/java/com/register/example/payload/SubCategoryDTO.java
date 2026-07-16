package com.register.example.payload;

public class SubCategoryDTO {

    private Long id;
    private String subCategoryName;

    public SubCategoryDTO() {
    }

    public SubCategoryDTO(Long id, String subCategoryName) {
        this.id = id;
        this.subCategoryName = subCategoryName;
    }

    // -------- GETTERS ----------
    public Long getId() {
        return id;
    }

    public String getSubCategoryName() {
        return subCategoryName;
    }

    // -------- SETTERS ----------
    public void setId(Long id) {
        this.id = id;
    }

    public void setSubCategoryName(String subCategoryName) {
        this.subCategoryName = subCategoryName;
    }
}
