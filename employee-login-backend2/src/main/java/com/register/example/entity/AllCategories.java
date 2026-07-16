package com.register.example.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grievance_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllCategories {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   @Column(name = "grievance_category", length = 50)
private String grievanceCategory;

@Column(name = "grievance_type", length = 50)
private String grievanceType;

@Column(name = "tenant_id", length = 100)
private String tenantId;

    // Explicit getters and setters for compatibility
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getGrievanceCategory() {
        return grievanceCategory;
    }

    public void setGrievanceCategory(String grievanceCategory) {
        this.grievanceCategory = grievanceCategory;
    }

    public String getGrievanceType() {
        return grievanceType;
    }

    public void setGrievanceType(String grievanceType) {
        this.grievanceType = grievanceType;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
