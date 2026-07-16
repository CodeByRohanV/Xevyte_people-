package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "locations")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String locationName;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    public Location() {}

    public Location(String locationName) {
        this.locationName = locationName;
    }

    public Location(String locationName, String tenantId) {
        this.locationName = locationName;
        this.tenantId = tenantId;
    }

    public Long getId() { return id; }
    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
