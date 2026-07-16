package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "helpdesk_sub_category")
public class SubCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sub_category_name", nullable = false, length=50)
    private String subCategoryName;

    @JsonIgnore  // Prevent circular JSON recursion
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // ----------- Constructors -------------
    public SubCategory() {}

    public SubCategory(String subCategoryName, Category category) {
        this.subCategoryName = subCategoryName;
        this.category = category;
    }

    // ----------- GETTERS -------------
    public Long getId() {
        return id;
    }

    public String getSubCategoryName() {
        return subCategoryName;
    }

    public Category getCategory() {
        return category;
    }

    // ----------- SETTERS -------------
    public void setId(Long id) {
        this.id = id;
    }

    public void setSubCategoryName(String subCategoryName) {
        this.subCategoryName = subCategoryName;
    }

    public void setCategory(Category category) {
        this.category = category;
    }
}
