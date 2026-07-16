package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "asset_categories", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"name", "tenant_id"})
})
@Getter
@Setter
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class AssetCategory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_category_id")
    @JsonIgnoreProperties({ "subCategories", "fieldConfigs", "parentCategory", "hibernateLazyInitializer", "handler" })
    private AssetCategory parentCategory;

    @OneToMany(mappedBy = "parentCategory", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({ "parentCategory", "hibernateLazyInitializer", "handler" })
    private List<AssetCategory> subCategories;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<AssetFieldConfig> fieldConfigs;

    @Column(name = "tenant_id", length = 50)
    private String tenantId;
}
