package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "helpdesk_category", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_name", "ticket_type", "category_name", "tenant_id"})
})
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="category_name", nullable=false, length=50)
    private String categoryName;

    @Column(name="ticket_type", length=50) // No longer explicitly set to nullable=false
    private String ticketType;

    @Column(name="team_name", nullable=false, length=50)
    private String teamName;

    @Column(name="tenant_id", length=100)
    private String tenantId;

    @JsonIgnore
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubCategory> subCategories;

    public Category() {}

    public Category(String categoryName, String ticketType, String teamName) {
        this.categoryName = categoryName;
        this.ticketType = ticketType;
        this.teamName = teamName;
    }

    public Category(String categoryName, String ticketType, String teamName, String tenantId) {
        this.categoryName = categoryName;
        this.ticketType = ticketType;
        this.teamName = teamName;
        this.tenantId = tenantId;
    }

    // -------- GETTERS ----------
    public Long getId() {
        return id;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getTicketType() {
        return ticketType;
    }

    public String getTeamName() {
        return teamName;
    }

    public List<SubCategory> getSubCategories() {
        return subCategories;
    }

    // -------- SETTERS ----------
    public void setId(Long id) {
        this.id = id;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public void setTicketType(String ticketType) {
        this.ticketType = ticketType;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public void setSubCategories(List<SubCategory> subCategories) {
        this.subCategories = subCategories;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
