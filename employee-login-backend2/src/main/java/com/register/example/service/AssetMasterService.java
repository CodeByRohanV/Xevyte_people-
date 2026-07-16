package com.register.example.service;

import com.register.example.entity.AssetAllocation;
import com.register.example.entity.AssetMaster;
import com.register.example.repository.AssetAllocationRepository;
import com.register.example.repository.AssetMasterRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;
import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;

@Service
public class AssetMasterService {

    private static final String CONST_ASSET_TAG = "Asset Tag";
    private static final String CONST_SERIAL_NUMBER = "Serial Number";
    private static final String CONST_STATUS = "Status";
    private static final String TYPE_STATUS = "STATUS";
    private static final String CONST_CONDITION = "Condition";
    private static final String TYPE_CONDITION = "CONDITION";

    @Autowired
    private AssetMasterRepository assetMasterRepository;

    @Autowired
    private AssetAllocationRepository allocationRepository;

    @Autowired
    private AssetAuditService auditService;

    @Autowired
    private AssetDropdownOptionService dropdownOptionService;

    @Autowired
    private com.register.example.repository.AssetCategoryRepository categoryRepository;

    @Autowired
    private com.register.example.repository.AssetFieldConfigRepository fieldConfigRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AssetAllocationService allocationService;

    @Transactional(readOnly = true)
    public List<AssetMaster> getAllAssets(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        return assetMasterRepository.findByActiveTrueAndTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public AssetMaster getAssetById(Long id) {
        return assetMasterRepository.findById(id).orElse(null);
    }

    @Transactional
    @CacheEvict(value = "assetAllocations", allEntries = true)
    public AssetMaster createAsset(AssetMaster asset, String userId, String tenantId) {
        System.out.println("=== CREATE ASSET DEBUG ===");
        
        normalizeDynamicValues(asset);

        System.out.println("Service: Creating asset with dynamic values: " + asset.getDynamicValues());
        System.out.println("Asset object: " + asset);
        System.out.println("Category: " + asset.getCategory());
        System.out.println("Sub-category: " + asset.getSubCategory());

        Map<String, String> dynamicValues = asset.getDynamicValues();
        resolveAndEnsureAssetTag(asset, dynamicValues);
        dynamicValues = asset.getDynamicValues();

        // Sync fixed entity columns from dynamicValues
        autoSyncFixedFields(asset, dynamicValues);
        
        // Status is only explicitly set if an employee is provided during creation
        if (asset.getStatus() == null || asset.getStatus().trim().isEmpty()) {
            if (asset.getAssignedToEmployee() != null) {
                asset.setStatus(AssetMaster.Constants.ALLOCATED);
            }
        }

        checkUniqueAssetTagAndSerial(asset, dynamicValues, tenantId);

        ensureCreatedByAndAssetId(asset, userId, tenantId);
        asset.setActive(true);

        System.out.println("Service: Saving dropdown options for dynamic values...");
        saveDropdownOptionsFromDynamicValues(dynamicValues);

        System.out.println("Service: Persisting asset to repository...");
        validateUniqueFields(asset, null);

        System.out.println("Service: Saved Asset Tag: " + (asset.getAssetTag() != null ? asset.getAssetTag() : "FAILED"));

        AssetMaster savedAsset = assetMasterRepository.save(asset);

        handleInitialAllocation(savedAsset, userId, tenantId);

        System.out.println("Service: Logging audit for " + savedAsset.getAssetTag());
        auditService.log("CREATE", savedAsset.getId(), savedAsset.getAssetTag(), userId, null, "Asset Created");
        return savedAsset;
    }

    private void normalizeDynamicValues(AssetMaster asset) {
        if (asset.getDynamicValues() != null) {
            Map<String, String> normalized = new HashMap<>();
            asset.getDynamicValues().forEach((k, v) -> {
                String existingKey = normalized.keySet().stream()
                    .filter(nk -> nk.equalsIgnoreCase(k))
                    .findFirst()
                    .orElse(k);
                normalized.put(existingKey, v);
            });
            asset.setDynamicValues(normalized);
        }
    }

    private void resolveAndEnsureAssetTag(AssetMaster asset, Map<String, String> dynamicValues) {
        String assetTag = (dynamicValues != null) ? getDynamicValueCaseInsensitive(dynamicValues, CONST_ASSET_TAG) : null;
        
        if (assetTag == null || assetTag.trim().isEmpty()) {
            assetTag = asset.getAssetTag();
        }
        
        if (assetTag == null || assetTag.trim().isEmpty()) {
            assetTag = "AST-" + System.currentTimeMillis();
            if (dynamicValues == null) {
                dynamicValues = new HashMap<>();
            }
            putDynamicValueCaseInsensitive(dynamicValues, CONST_ASSET_TAG, assetTag);
            asset.setDynamicValues(dynamicValues);
        } else {
            if (dynamicValues == null) {
                dynamicValues = new HashMap<>();
                asset.setDynamicValues(dynamicValues);
            }
            if (dynamicValues.keySet().stream().noneMatch(k -> k.equalsIgnoreCase(CONST_ASSET_TAG))) {
                putDynamicValueCaseInsensitive(dynamicValues, CONST_ASSET_TAG, assetTag);
            }
        }
    }

    private void checkUniqueAssetTagAndSerial(AssetMaster asset, Map<String, String> dynamicValues, String tenantId) {
        String assetTag = asset.getAssetTag();
        if (assetTag != null && !assetTag.trim().isEmpty()) {
            boolean exists = (tenantId != null && !tenantId.isEmpty()) ?
                assetMasterRepository.existsByAssetTagAndTenantId(assetTag, tenantId) :
                assetMasterRepository.existsByAssetTagAndActiveTrue(assetTag);
            if (exists) {
                throw new RuntimeException("Asset Tag '" + assetTag + "' already exists in the system.");
            }
        }
        
        String serialNumber = asset.getSerialNumber();
        if (serialNumber == null && dynamicValues != null) {
            serialNumber = getDynamicValueCaseInsensitive(dynamicValues, CONST_SERIAL_NUMBER);
        }
        
        if (serialNumber != null && !serialNumber.trim().isEmpty()) {
            boolean exists = (tenantId != null && !tenantId.isEmpty()) ?
                assetMasterRepository.existsBySerialNumberAndTenantId(serialNumber, tenantId) :
                assetMasterRepository.existsBySerialNumberAndActiveTrue(serialNumber);
            if (exists) {
                throw new RuntimeException("Serial Number '" + serialNumber + "' already exists in the system.");
            }
        }
    }

    private void ensureCreatedByAndAssetId(AssetMaster asset, String userId, String tenantId) {
        if (asset.getAssetId() == null || asset.getAssetId().isEmpty()) {
            asset.setAssetId(generateNextAssetId());
        }

        if (tenantId != null && !tenantId.trim().isEmpty() && !userId.startsWith(tenantId + "_")) {
            asset.setCreatedBy(tenantId + "_" + userId);
        } else {
            asset.setCreatedBy(userId);
        }
    }

    private void saveDropdownOptionsFromDynamicValues(Map<String, String> dynamicValues) {
        if (dynamicValues != null) {
            String status = dynamicValues.keySet().stream()
                .filter(k -> k.equalsIgnoreCase(CONST_STATUS))
                .map(dynamicValues::get)
                .findFirst()
                .orElse(null);
            if (status != null) {
                String normalizedStatus = status.toUpperCase().replace(" ", "_");
                putDynamicValueCaseInsensitive(dynamicValues, CONST_STATUS, normalizedStatus);
                dropdownOptionService.addOption(TYPE_STATUS, normalizedStatus);
            }
            
            String condition = dynamicValues.keySet().stream()
                .filter(k -> k.equalsIgnoreCase(CONST_CONDITION))
                .map(dynamicValues::get)
                .findFirst()
                .orElse(null);
            if (condition != null) {
                dropdownOptionService.addOption(TYPE_CONDITION, condition);
            }
        }
    }

    private void handleInitialAllocation(AssetMaster savedAsset, String userId, String tenantId) {
        Employee assignedEmployee = savedAsset.getAssignedToEmployee();
        
        System.out.println("Service: Assignment Check - Employee Provided: " + (assignedEmployee != null));
        if (assignedEmployee != null) {
            System.out.println("Service: Assignment Check - Employee ID: " + assignedEmployee.getEmployeeId());
        }

        if (assignedEmployee != null && assignedEmployee.getEmployeeId() != null) {
            String empId = assignedEmployee.getEmployeeId();
            System.out.println("Service: Attempting to find employee for allocation: " + empId);
            Employee refetchedEmployee = employeeRepository.findByEmployeeId(empId)
                    .orElse(null);
            
            if (refetchedEmployee == null) {
                System.out.println("Service ERROR: Could not find employee " + empId + " for initial allocation");
            } else {
                System.out.println("Service: Found employee " + refetchedEmployee.getFirstName() + " for initial allocation");
                savedAsset.setAssignedToEmployee(refetchedEmployee);
            
                if (savedAsset.getStatus() == null || savedAsset.getStatus().trim().isEmpty() || savedAsset.getStatus().equals("IN_STOCK")) {
                    savedAsset.setStatus(AssetMaster.Constants.ALLOCATED);
                    
                    if (savedAsset.getDynamicValues() == null) savedAsset.setDynamicValues(new HashMap<>());
                    putDynamicValueCaseInsensitive(savedAsset.getDynamicValues(), CONST_STATUS, AssetMaster.Constants.ALLOCATED);
                    putDynamicValueCaseInsensitive(savedAsset.getDynamicValues(), "Asset Status", AssetMaster.Constants.ALLOCATED);
                }
                
                savedAsset = assetMasterRepository.saveAndFlush(savedAsset);

                AssetAllocation allocation = new AssetAllocation();
                allocation.setAsset(savedAsset);
                allocation.setEmployee(refetchedEmployee);
                allocation.setConditionAtIssue(savedAsset.getConditionAtStock() != null ? savedAsset.getConditionAtStock() : "New");
                
                System.out.println("Service: Calling allocationService.allocateAsset for " + savedAsset.getAssetTag());
                allocationService.allocateAsset(allocation, null, userId, tenantId);

                System.out.println("Service: Allocated asset " + (savedAsset.getAssetTag() != null ? savedAsset.getAssetTag() : "null") + " to " + empId + " during creation via centralized service");
            }
        }
    }

    @Transactional
    @CacheEvict(value = "assetAllocations", allEntries = true)
    public AssetMaster updateAsset(Long id, AssetMaster updatedAsset, String userId) {
        try {
            System.out.println("=== UPDATE ASSET DEBUG ===");
            System.out.println("Service: Updating asset with ID: " + id + " for user: " + userId);
            System.out.println("Service: Updated asset dynamic values: " + updatedAsset.getDynamicValues());
            System.out.println("Service: Updated asset category: " + updatedAsset.getCategory());
            System.out.println("Service: Updated asset sub-category: " + updatedAsset.getSubCategory());

            AssetMaster existingAsset = assetMasterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Asset not found"));

            System.out.println("Service: Found existing asset with ID: " + id);
            
            // Capture CURRENT assignment BEFORE dynamic value sync overrides it
            Employee oldEmployee = existingAsset.getAssignedToEmployee();
            
            System.out.println("Service: Existing asset dynamic values before update: " + existingAsset.getDynamicValues());

            // Get dynamic values from updated asset
            Map<String, String> updatedDynamicValues = updatedAsset.getDynamicValues();
            
            if (updatedDynamicValues != null) {
                // Uniqueness checks BEFORE updating
                // 1. Asset Tag uniqueness check
                String updatedAssetTag = getDynamicValueCaseInsensitive(updatedDynamicValues, CONST_ASSET_TAG);
                Map<String, String> existingDynamicValues = existingAsset.getDynamicValues();
                String existingAssetTag = existingDynamicValues != null ? getDynamicValueCaseInsensitive(existingDynamicValues, CONST_ASSET_TAG) : null;
                
                if (updatedAssetTag != null && !updatedAssetTag.equals(existingAssetTag)) {
                    if (assetMasterRepository.existsByAssetTagAndActiveTrue(updatedAssetTag)) {
                        throw new RuntimeException("Asset Tag already exists: " + updatedAssetTag);
                    }
                }

                // 2. Serial number uniqueness check
                String updatedSerialNumber = getDynamicValueCaseInsensitive(updatedDynamicValues, CONST_SERIAL_NUMBER);
                String existingSerialNumber = existingDynamicValues != null ? getDynamicValueCaseInsensitive(existingDynamicValues, CONST_SERIAL_NUMBER) : null;
                if (updatedSerialNumber != null && !updatedSerialNumber.equals(existingSerialNumber)) {
                    if (!updatedSerialNumber.isEmpty()) {
                        // Check if any other asset has this serial number in dynamic values
                        List<AssetMaster> otherAssets = assetMasterRepository.findByActiveTrue();
                        for (AssetMaster other : otherAssets) {
                            if (!other.getId().equals(id)) { // Skip current asset
                                Map<String, String> otherDynamic = other.getDynamicValues();
                                if (otherDynamic != null && updatedSerialNumber.equals(getDynamicValueCaseInsensitive(otherDynamic, CONST_SERIAL_NUMBER))) {
                                    throw new RuntimeException("Serial Number already exists: " + updatedSerialNumber);
                                }
                            }
                        }
                    }
                }
                
                // Perform surgical update of dynamic values to avoid duplicate key errors
                Map<String, String> existingMap = existingAsset.getDynamicValues();
                
                Map<String, String> normalizedUpdates = new HashMap<>();
                updatedDynamicValues.forEach((key, val) -> {
                    String finalKey = key;
                    // Look for existing case-insensitive match
                    for (String existingKey : existingMap.keySet()) {
                        if (existingKey.equalsIgnoreCase(key)) {
                            finalKey = existingKey;
                            break;
                        }
                    }
                    normalizedUpdates.put(finalKey, val);
                });

                // Update existingMap surgically
                // Remove keys no longer present
                existingMap.keySet().removeIf(k -> {
                    return normalizedUpdates.keySet().stream().noneMatch(nk -> nk.equalsIgnoreCase(k));
                });
                
                // Update and add remaining
                existingMap.putAll(normalizedUpdates);
                
                // SYNC: Copy dynamic values to fixed entity columns for consistency
                autoSyncFixedFields(existingAsset, existingMap);
            }

            // Category assignment
            if (updatedAsset.getCategory() != null && updatedAsset.getCategory().getId() != null) {
                com.register.example.entity.AssetCategory cat = categoryRepository
                        .findById(updatedAsset.getCategory().getId())
                        .orElseThrow(() -> new RuntimeException("Category not found"));
                existingAsset.setCategory(cat);
            }

            // Sub-category assignment
            if (updatedAsset.getSubCategory() != null && updatedAsset.getSubCategory().getId() != null) {
                com.register.example.entity.AssetCategory subCat = categoryRepository
                        .findById(updatedAsset.getSubCategory().getId())
                        .orElseThrow(() -> new RuntimeException("Sub-category not found"));
                existingAsset.setSubCategory(subCat);
            } else {
                existingAsset.setSubCategory(null);
            }

            // Update notes if provided
            if (updatedAsset.getNotes() != null) {
                existingAsset.setNotes(updatedAsset.getNotes());
            }

            // Ensure status and condition are saved as options from dynamic values
            Map<String, String> dv = existingAsset.getDynamicValues();
            if (dv != null) {
                String status = getDynamicValueCaseInsensitive(dv, CONST_STATUS);
                if (status != null) {
                    String normalizedStatus = status.toUpperCase().replace(" ", "_");
                    putDynamicValueCaseInsensitive(dv, CONST_STATUS, normalizedStatus);
                    dropdownOptionService.addOption(TYPE_STATUS, normalizedStatus);
                }
                
                String condition = getDynamicValueCaseInsensitive(dv, CONST_CONDITION);
                if (condition != null) {
                    dropdownOptionService.addOption(TYPE_CONDITION, condition);
                }
            }

            // Validate unique dynamic fields before saving (exclude current asset)
            validateUniqueFields(existingAsset, existingAsset.getId());

            // Handle Employee Assignment Sync using the pre-captured oldEmployee
            Employee newEmployee = updatedAsset.getAssignedToEmployee();
            
            System.out.println("Service: Update Check - Old Employee: " + (oldEmployee != null ? oldEmployee.getEmployeeId() : "NONE"));
            System.out.println("Service: Update Check - New Employee: " + (newEmployee != null ? newEmployee.getEmployeeId() : "NONE (json)"));

            if (newEmployee == null) {
                newEmployee = existingAsset.getAssignedToEmployee();
                System.out.println("Service: Update Check - Synced New Employee from Map: " + (newEmployee != null ? newEmployee.getEmployeeId() : "NONE"));
            }

            if (newEmployee != null && newEmployee.getEmployeeId() != null) {
                String newEmpId = newEmployee.getEmployeeId();
                if (oldEmployee == null || !newEmpId.equals(oldEmployee.getEmployeeId())) {
                    System.out.println("Service: Detected employee change from " + (oldEmployee != null ? oldEmployee.getEmployeeId() : "null") + " to " + newEmpId);
                    
                    // New assignment
                    Employee employee = employeeRepository.findByEmployeeId(newEmpId)
                            .orElseThrow(() -> new RuntimeException("New employee not found: " + newEmpId));
                    
                    // Return old if exists (re-assigning)
                    if (oldEmployee != null) {
                         System.out.println("Service: Processing return for " + oldEmployee.getEmployeeId() + " before re-assigning");
                         Optional<AssetAllocation> activeAlc = allocationRepository.findByAssetAndActiveTrue(existingAsset);
                         if (activeAlc.isPresent()) {
                              allocationService.processReturn(activeAlc.get().getId(), 
                                  existingAsset.getConditionAtStock() != null ? existingAsset.getConditionAtStock() : "N/A", 
                                  null, "Re-assigned during edit", userId, userId);
                         }
                    }

                    // Perform new allocation via Service
                    AssetAllocation allocation = new AssetAllocation();
                    allocation.setAsset(existingAsset);
                    allocation.setEmployee(employee);
                    allocation.setConditionAtIssue(existingAsset.getConditionAtStock() != null ? existingAsset.getConditionAtStock() : "N/A");
                    
                    System.out.println("Service: Calling allocationService.allocateAsset for " + existingAsset.getAssetTag());
                    String assetTenantId = null;
                    if (existingAsset.getCreatedBy() != null && existingAsset.getCreatedBy().contains("_")) {
                        assetTenantId = existingAsset.getCreatedBy().split("_")[0];
                    }
                    allocationService.allocateAsset(allocation, null, userId, assetTenantId);
                    
                    // Double check status synchronization in Map for UI display
                    putDynamicValueCaseInsensitive(existingAsset.getDynamicValues(), CONST_STATUS, "ALLOCATED");
                    putDynamicValueCaseInsensitive(existingAsset.getDynamicValues(), "Asset Status", "ALLOCATED");
                }
            } else if (oldEmployee != null) {
                // Removed assignment explicitly
                Optional<AssetAllocation> activeAlc = allocationRepository.findByAssetAndActiveTrue(existingAsset);
                if (activeAlc.isPresent()) {
                    allocationService.processReturn(activeAlc.get().getId(), 
                        existingAsset.getConditionAtStock() != null ? existingAsset.getConditionAtStock() : "N/A", 
                        null, "Unassigned during edit", userId, userId);
                }
                existingAsset.setAssignedToEmployee(null);
                existingAsset.setStatus("IN_STOCK");
                putDynamicValueCaseInsensitive(existingAsset.getDynamicValues(), CONST_STATUS, "IN_STOCK");
                putDynamicValueCaseInsensitive(existingAsset.getDynamicValues(), "Asset Status", "IN_STOCK");
            }

            // Deriving final tag safely for audit
            String finalTag = existingAsset.getDynamicValues() != null 
                ? getDynamicValueCaseInsensitive(existingAsset.getDynamicValues(), CONST_ASSET_TAG) 
                : existingAsset.getAssetTag();

            System.out.println("Service: About to save updated asset...");
            AssetMaster savedAsset = assetMasterRepository.saveAndFlush(existingAsset);
            System.out.println("Service: Asset saved successfully with ID: " + savedAsset.getId());
            System.out.println("Service: Final dynamic values after save: " + savedAsset.getDynamicValues());
            
            auditService.log("UPDATE", savedAsset.getId(), finalTag, userId, "Asset Updated",
                    "Updated details and sync allocations");
            return savedAsset;
        } catch (Exception e) {
            System.err.println("updateAsset: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public void updateStatus(Long id, String status, String userId) {
        AssetMaster asset = assetMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        String oldStatus = asset.getStatus();
        asset.setStatus(status);
        
        // Sync dynamic values for UI consistency
        if (asset.getDynamicValues() == null) {
            asset.setDynamicValues(new HashMap<>());
        }
        putDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_STATUS, status);
        
        dropdownOptionService.addOption(TYPE_STATUS, status);
        assetMasterRepository.save(asset);

        auditService.log("STATUS_CHANGE", asset.getId(), asset.getAssetTag(), userId, oldStatus, status);
    }

    public Map<String, Long> getSummary(String tenantId) {
        Map<String, Long> summary = new HashMap<>();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            summary.put("total", 0L);
            summary.put("allocated", 0L);
            summary.put("inStock", 0L);
            return summary;
        }

        List<AssetMaster> assets = assetMasterRepository.findByActiveTrueAndTenantId(tenantId);

        long allocated = 0L;
        long inStock = 0L;
        for (AssetMaster asset : assets) {
            String effective = getEffectiveStatus(asset);
            if (AssetMaster.Constants.ALLOCATED.equalsIgnoreCase(effective)) {
                allocated++;
            } else if (AssetMaster.Constants.IN_STOCK.equalsIgnoreCase(effective)
                    || "INSTOCK".equalsIgnoreCase(effective)) {
                inStock++;
            }
        }

        summary.put("total", (long) assets.size());
        summary.put("allocated", allocated);
        summary.put("inStock", inStock);

        return summary;
    }

    private String getEffectiveStatus(AssetMaster asset) {
        String status = asset.getStatus();
        if (status != null && !status.trim().isEmpty()) {
            return status.trim().toUpperCase().replace(" ", "_");
        }
        if (asset.getDynamicValues() != null) {
            String fromMap = getDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_STATUS);
            if (fromMap == null) {
                fromMap = getDynamicValueCaseInsensitive(asset.getDynamicValues(), "Asset Status");
            }
            if (fromMap != null && !fromMap.trim().isEmpty()) {
                return fromMap.trim().toUpperCase().replace(" ", "_");
            }
        }
        return null;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardData(String tenantId) {
        Map<String, Object> data = new HashMap<>();
        
        // 1. Summary
        data.put("summary", getSummary(tenantId));
        
        // 2. Assets (all active)
        data.put("assets", getAllAssets(tenantId));
        
        // 3. Categories
        data.put("categories", categoryRepository.findAll());
        
        // 4. Employees (active)
        data.put("employees", employeeRepository.findByActive("yes"));
        
        // 5. Options (STATUS, CONDITION, TEMPLATE_COLUMN)
        Map<String, List<String>> options = new HashMap<>();
        options.put(TYPE_STATUS, dropdownOptionService.getOptionsByType(TYPE_STATUS).stream().map(opt -> opt.getValue()).collect(Collectors.toList()));
        options.put(TYPE_CONDITION, dropdownOptionService.getOptionsByType(TYPE_CONDITION).stream().map(opt -> opt.getValue()).collect(Collectors.toList()));
        
        // Columns with metadata (sorting, mandatory)
        data.put("templateColumns", dropdownOptionService.getOptionsByType("TEMPLATE_COLUMN"));
        data.put("options", options);
        
        // 6. Allocations
        List<AssetAllocation> allocations;
        if (tenantId == null || tenantId.trim().isEmpty()) {
            allocations = new java.util.ArrayList<>();
        } else {
            allocations = allocationRepository.findAllWithDetailsByTenantId(tenantId);
        }
        List<Map<String, Object>> mappedAllocations = allocations.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("allocationId", a.getAllocationId());
            map.put("allocationDate", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            if (a.getAllocationDate() != null) map.put("allocationDate", a.getAllocationDate().toString());
            map.put("expectedReturnDate", a.getExpectedReturnDate() != null ? a.getExpectedReturnDate().toString() : null);
            map.put("conditionAtIssue", a.getConditionAtIssue());
            map.put("accessoriesIssued", a.getAccessoriesIssued());
            map.put("active", a.isActive());
            map.put("returnDate", a.getReturnDate() != null ? a.getReturnDate().toString() : null);
            map.put("conditionAtReturn", a.getConditionAtReturn());
            map.put("damageNotes", a.getDamageNotes());
            map.put("verifiedBy", a.getVerifiedBy());
            
            if (a.getAsset() != null) {
                Map<String, Object> assetMap = new HashMap<>();
                assetMap.put("id", a.getAsset().getId());
                assetMap.put("assetTag", a.getAsset().getAssetTag());
                assetMap.put("status", a.getAsset().getStatus());
                map.put("asset", assetMap);
            }
            
            if (a.getEmployee() != null) {
                Map<String, Object> employeeMap = new HashMap<>();
                employeeMap.put("employeeId", a.getEmployee().getEmployeeId());
                employeeMap.put("firstName", a.getEmployee().getFirstName());
                employeeMap.put("lastName", a.getEmployee().getLastName());
                map.put("employee", employeeMap);
            }
            return map;
        }).collect(Collectors.toList());
        data.put("allocations", mappedAllocations);
        
        return data;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableAssets(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        List<AssetMaster> assets = assetMasterRepository.findByActiveTrueAndTenantId(tenantId);
        
        return assets.stream()
            .filter(a -> {
                String s = (a.getDynamicValues() != null) 
                           ? getDynamicValueCaseInsensitive(a.getDynamicValues(), CONST_STATUS) : a.getStatus();
                return s != null && s.toUpperCase().replaceAll("[^A-Z]", "").equals("INSTOCK");
            })
            .map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("assetTag", a.getAssetTag());
                if (a.getDynamicValues() != null) {
                    map.put("modelName", getDynamicValueCaseInsensitive(a.getDynamicValues(), "Asset Model Name"));
                }
                return map;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAuditLogs(int limit) {
        return auditService.getRecentLogs(limit);
    }

    @Transactional
    @CacheEvict(value = "assetAllocations", allEntries = true)
    public void deleteAsset(Long id, String userId) {
        AssetMaster asset = assetMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        if (!asset.isActive()) {
            throw new RuntimeException("Asset is already inactive.");
        }

        AssetAllocation activeAllocation = allocationRepository.findByAssetAndActiveTrue(asset)
                .orElse(null);

        if (activeAllocation != null) {
            throw new RuntimeException("Cannot delete asset. It is currently allocated to employee: " +
                    activeAllocation.getEmployee().getEmployeeId());
        }

        asset.setActive(false);
        assetMasterRepository.save(asset);

        String effectiveStatus = asset.getStatus();
        if (effectiveStatus == null && asset.getDynamicValues() != null) {
            effectiveStatus = getDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_STATUS);
            if (effectiveStatus == null) {
                effectiveStatus = getDynamicValueCaseInsensitive(asset.getDynamicValues(), "Asset Status");
            }
        }
        if (effectiveStatus == null) {
            effectiveStatus = "UNKNOWN";
        }

        auditService.log("DELETE", asset.getId(), asset.getAssetTag(), userId,
                effectiveStatus, "Asset deleted (soft delete)");
    }

    private String generateNextAssetId() {
        List<String> assetIds = assetMasterRepository.findAllAssetIdsStartingWithAST();
        int maxNum = 0;
        for (String id : assetIds) {
            if (id != null && id.startsWith("AST-")) {
                try {
                    String numStr = id.substring(4);
                    int num = Integer.parseInt(numStr);
                    if (num > maxNum) {
                        maxNum = num;
                    }
                } catch (Exception e) {
                    // Ignore non-numeric suffixes
                }
            }
        }
        return String.format("AST-%04d", maxNum + 1);
    }

    private void validateUniqueFields(AssetMaster asset, Long excludeId) {
        if (asset.getCategory() == null || asset.getDynamicValues() == null || asset.getDynamicValues().isEmpty()) {
            return;
        }

        List<com.register.example.entity.AssetFieldConfig> uniqueFields = fieldConfigRepository
                .findByCategoryAndActiveTrueOrderByDisplayOrderAsc(asset.getCategory())
                .stream()
                .filter(com.register.example.entity.AssetFieldConfig::isUniqueField)
                .collect(Collectors.toList());

        for (com.register.example.entity.AssetFieldConfig field : uniqueFields) {
            String fieldName = field.getFieldName();
            String fieldValue = getDynamicValueCaseInsensitive(asset.getDynamicValues(), fieldName);

            if (fieldValue == null || fieldValue.trim().isEmpty()) {
                continue;
            }

            List<AssetMaster> conflicting = assetMasterRepository.findByCategoryAndDynamicFieldValue(
                    asset.getCategory().getId(), fieldName, fieldValue);

            boolean hasConflict = conflicting.stream()
                    .anyMatch(a -> !a.getId().equals(excludeId));

            if (hasConflict) {
                throw new RuntimeException(
                        "Duplicate value for unique field '" + fieldName + "': '" + fieldValue +
                                "' already exists in another asset of this category.");
            }
        }
    }

    private void autoSyncFixedFields(AssetMaster asset, Map<String, String> dv) {
        if (dv == null) return;
        
        java.util.function.BiConsumer<String, java.util.function.Consumer<String>> sync = (key, setter) -> {
            String match = dv.keySet().stream()
                .filter(k -> k.equalsIgnoreCase(key))
                .map(dv::get)
                .findFirst()
                .orElse(null);
            if (match != null && !match.trim().isEmpty()) {
                String val = match.trim();
                if (key.toLowerCase().contains("status")) {
                    val = val.toUpperCase().replace(" ", "_");
                    if (val.equals("INSTOCK")) val = "IN_STOCK";
                }
                setter.accept(val);
            }
        };

        sync.accept(CONST_ASSET_TAG, asset::setAssetTag);
        sync.accept(CONST_SERIAL_NUMBER, asset::setSerialNumber);
        sync.accept(CONST_STATUS, asset::setStatus);
        sync.accept("Asset Status", asset::setStatus);
        sync.accept(CONST_CONDITION, asset::setConditionAtStock);
        sync.accept("Condition At Stock", asset::setConditionAtStock);
        sync.accept("Location", asset::setLocation);

        String empVal = dv.keySet().stream()
            .filter(k -> k.equalsIgnoreCase("Assign to Employee") || k.equalsIgnoreCase("Assigned to"))
            .map(dv::get)
            .findFirst()
            .orElse(null);
            
        if (empVal != null && !empVal.trim().isEmpty()) {
            String rawId = empVal.trim();
            String searchId = rawId;
            if (rawId.contains("(") && rawId.contains(")")) {
                searchId = rawId.substring(rawId.indexOf("(") + 1, rawId.indexOf(")")).trim();
            } else if (rawId.contains(" ")) {
                searchId = rawId.substring(rawId.lastIndexOf(" ") + 1).trim();
            }
            
            final String finalId = searchId;
            employeeRepository.findByEmployeeId(finalId).ifPresent(asset::setAssignedToEmployee);
            
            if (asset.getAssignedToEmployee() == null) {
                employeeRepository.findAll().stream()
                    .filter(e -> {
                        String fullName = (e.getFirstName() + " " + e.getLastName()).toLowerCase();
                        return e.getEmployeeId().equalsIgnoreCase(finalId) || 
                                fullName.equalsIgnoreCase(rawId) ||
                                fullName.contains(rawId.toLowerCase());
                    })
                    .findFirst()
                    .ifPresent(asset::setAssignedToEmployee);
            }
        }
        
        String priceStr = dv.keySet().stream()
            .filter(k -> k.equalsIgnoreCase("Price"))
            .map(dv::get)
            .findFirst()
            .orElse(null);
            
        if (priceStr != null && !priceStr.trim().isEmpty()) {
            try {
                asset.setPrice(Double.parseDouble(priceStr));
            } catch (Exception e) {
                System.err.println("DEBUG: Failed to parse price from dynamic values: " + priceStr);
            }
        }
    }

    private void putDynamicValueCaseInsensitive(Map<String, String> map, String key, String value) {
        if (map == null) return;
        String finalKey = key;
        for (String existingKey : new java.util.ArrayList<>(map.keySet())) {
            if (existingKey.equalsIgnoreCase(key)) {
                finalKey = existingKey;
                break;
            }
        }
        map.put(finalKey, value);
    }

    private String getDynamicValueCaseInsensitive(Map<String, String> map, String key) {
        if (map == null || key == null) return null;
        return map.keySet().stream()
                .filter(k -> k.equalsIgnoreCase(key))
                .map(map::get)
                .findFirst()
                .orElse(null);
    }
}
