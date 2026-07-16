package com.register.example.service;

import com.register.example.entity.AssetCategory;
import com.register.example.entity.AssetMaster;
import com.register.example.repository.AssetCategoryRepository;
import com.register.example.repository.AssetMasterRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AssetCategoryService {

    @Autowired
    private AssetCategoryRepository categoryRepository;

    @Autowired
    private AssetMasterRepository assetMasterRepository;

    @Autowired
    private AssetAuditService auditService;

    public List<AssetCategory> getAllCategories(String tenantId) {
        return categoryRepository.findByTenantId(tenantId);
    }

    public List<AssetCategory> getParentCategories(String tenantId) {
        return categoryRepository.findByParentCategoryIsNullAndTenantId(tenantId);
    }

    public AssetCategory createCategory(AssetCategory category, String tenantId) {
        if (categoryRepository.existsByNameAndTenantId(category.getName(), tenantId)) {
            throw new RuntimeException("Category already exists");
        }
        category.setTenantId(tenantId);

        // Set back-references for field configs and normalize fieldType to uppercase
        if (category.getFieldConfigs() != null) {
            category.getFieldConfigs().forEach(config -> {
                config.setCategory(category);
                config.setTenantId(tenantId);
                if (config.getFieldType() != null) {
                    config.setFieldType(config.getFieldType().toUpperCase());
                }
            });
        }

        return categoryRepository.save(category);
    }

    public List<AssetCategory> createCategories(List<AssetCategory> categories, String tenantId) {
        for (AssetCategory category : categories) {
            category.setTenantId(tenantId);
            if (category.getFieldConfigs() != null) {
                category.getFieldConfigs().forEach(config -> {
                    config.setCategory(category);
                    config.setTenantId(tenantId);
                });
            }
        }
        return categoryRepository.saveAll(categories);
    }

    public AssetCategory updateCategory(Long id, AssetCategory updatedCategory, String tenantId) {
        AssetCategory category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getName().equalsIgnoreCase(updatedCategory.getName()) && 
            categoryRepository.existsByNameAndTenantId(updatedCategory.getName(), tenantId)) {
            throw new RuntimeException("Category already exists");
        }

        category.setName(updatedCategory.getName());
        category.setActive(updatedCategory.isActive());

        // Update Parent
        if (updatedCategory.getParentCategory() != null && updatedCategory.getParentCategory().getId() != null) {
            category.setParentCategory(
                    categoryRepository.findById(updatedCategory.getParentCategory().getId()).orElse(null));
        } else {
            category.setParentCategory(null);
        }

        // Update Field Configs and normalize fieldType to uppercase
        category.getFieldConfigs().clear();
        if (updatedCategory.getFieldConfigs() != null) {
            updatedCategory.getFieldConfigs().forEach(config -> {
                config.setCategory(category);
                config.setTenantId(tenantId);
                if (config.getFieldType() != null) {
                    config.setFieldType(config.getFieldType().toUpperCase());
                }
                category.getFieldConfigs().add(config);
            });
        }

        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id, String userId, String tenantId) {
        AssetCategory category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        // Find and delete all assets in this category (both as main and sub-category)
        List<AssetMaster> assetsToDelete = assetMasterRepository.findByCategory(category.getId());
        assetsToDelete.addAll(assetMasterRepository.findBySubCategory(category.getId()));

        // Remove duplicates (assets that have both category and subCategory pointing to
        // this category)
        List<AssetMaster> uniqueAssets = assetsToDelete.stream()
                .distinct()
                .toList();

        // Check if any assets are allocated
        List<AssetMaster> allocatedAssets = uniqueAssets.stream()
                .filter(asset -> AssetMaster.Constants.ALLOCATED.equals(asset.getStatus()))
                .toList();

        if (!allocatedAssets.isEmpty()) {
            throw new RuntimeException("Cannot delete category. " + allocatedAssets.size() +
                    " assets are currently allocated. Please return them first: " +
                    allocatedAssets.stream().map(AssetMaster::getAssetTag).reduce((a, b) -> a + ", " + b).orElse(""));
        }

        // Delete all associated assets (hard delete)
        for (AssetMaster asset : uniqueAssets) {
            // Store original category info for audit
            String originalCategory = (asset.getCategory() != null) ? asset.getCategory().getName() : null;
            String originalSubCategory = (asset.getSubCategory() != null) ? asset.getSubCategory().getName() : null;

            // Hard delete the asset to avoid foreign key constraint
            assetMasterRepository.delete(asset);

            auditService.log("DELETE", asset.getId(), asset.getAssetTag(), userId,
                    "Asset deleted due to category deletion",
                    "Category: " + originalCategory + ", SubCategory: " + originalSubCategory);
        }

        // Log category deletion
        auditService.log("DELETE_CATEGORY", category.getId(), category.getName(), userId,
                "ACTIVE", "Category deleted with " + uniqueAssets.size() + " assets");

        // Delete the category
        categoryRepository.delete(category);
    }
}
