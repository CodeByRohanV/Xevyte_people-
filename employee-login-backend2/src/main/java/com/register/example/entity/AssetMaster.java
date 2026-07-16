package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Entity
@Table(name = "asset_master")
@Getter
@Setter
public class AssetMaster extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
private String assetId; // Auto-generated ID

   @Column(length = 50)
private String assetTag;// Made nullable - now stored in dynamicValues

@Column(length = 50)
private String serialNumber; // Made nullable - now stored in dynamicValues

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private AssetCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_category_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private AssetCategory subCategory;

    @Column(name = "status", length = 50)
private String status; // Made nullable - now stored in dynamicValues

    @Column(name = "condition_at_stock", length = 50)
private String conditionAtStock; // Made nullable - now stored in dynamicValues

    private Double price;

 @Column(name = "location", length = 50)
private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_employee_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Employee assignedToEmployee;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private boolean active = true;



    @Column(name = "created_by", length = 50)
private String createdBy;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CreationMode creationMode = CreationMode.MANUAL;

@Column(name = "source_system", length = 50)
private String sourceSystem;

   @Column(name = "external_asset_id", length = 50)
private String externalAssetId;

    @ElementCollection
    @CollectionTable(name = "asset_dynamic_values", joinColumns = @JoinColumn(name = "asset_id"))
    @MapKeyColumn(name = "field_name", length = 250)
    @Lob
    @Column(name = "field_value", columnDefinition = "LONGTEXT")
    @org.hibernate.annotations.BatchSize(size = 25)
    private Map<String, String> dynamicValues = new java.util.HashMap<>();

    public Map<String, String> getDynamicValues() {
        return dynamicValues;
    }

    public void setDynamicValues(Map<String, String> dynamicValues) {
        this.dynamicValues = dynamicValues;
    }

    public static class Constants {
        public static final String IN_STOCK = "IN_STOCK";
        public static final String ALLOCATED = "ALLOCATED";
        public static final String DAMAGED = "DAMAGED";
        public static final String LOST = "LOST";
        public static final String UNDER_REPAIR = "UNDER_REPAIR";
    }

    public enum CreationMode {
        MANUAL, EXTERNAL
    }
}
