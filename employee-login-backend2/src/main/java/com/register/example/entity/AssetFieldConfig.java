package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "asset_field_configs")
@Getter
@Setter
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class AssetFieldConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private AssetCategory category;

   @Column(name = "field_name", nullable = false, length = 50)
private String fieldName;

@Column(name = "field_type", nullable = false, length = 50)
private String fieldType;

    @Column(nullable = false)
    private boolean mandatory = false;

    @Column(nullable = false)
    private boolean uniqueField = false;

    private Integer displayOrder;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "tenant_id", length = 50)
    private String tenantId;
}
