package com.register.example.service;

import com.register.example.entity.AssetAllocation;
import com.register.example.entity.AssetMaster;
import com.register.example.entity.Employee;
import com.register.example.repository.AssetAllocationRepository;
import com.register.example.repository.AssetMasterRepository;
import com.register.example.repository.EmployeeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class AssetAllocationService {

    @Autowired
    private AssetAllocationRepository allocationRepository;

    @Autowired
    private AssetMasterRepository assetMasterRepository;

    @Autowired
    private AssetAuditService auditService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Cacheable(value = "assetAllocations", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString() + '-' + (#search != null ? #search : '') + '-' + (#tenantId != null ? #tenantId : '')")
    public org.springframework.data.domain.Page<AssetAllocation> getAllocationsPaginated(
            org.springframework.data.domain.Pageable pageable, String search, String tenantId) {
        
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return org.springframework.data.domain.Page.empty(pageable);
        }

        if (search != null && !search.trim().isEmpty()) {
            return allocationRepository.searchAllocationsByTenantId(search.trim(), tenantId, pageable);
        }
        
        return allocationRepository.findAllWithDetailsPaginatedByTenantId(tenantId, pageable);
    }
    
    public java.util.List<AssetAllocation> getAllAllocations() {
        return allocationRepository.findAllWithDetails();
    }

    private static final String CONST_STATUS = "Status";
    private static final String CONST_ASSET_STATUS = "Asset Status";

    @CacheEvict(value = "assetAllocations", allEntries = true)
    @Transactional
    public AssetAllocation allocateAsset(AssetAllocation allocation, String issuedImageBase64, String userId, String tenantId) {
        AssetMaster asset = assetMasterRepository.findById(allocation.getAsset().getId())
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        String rawStatus = resolveRawStatus(asset);
        String currentStatus = rawStatus.toUpperCase().replace(" ", "_");
        
        // Allow if IN_STOCK, or if ALREADY_ALLOCATED to the same employee (to support idempotent register calls)
        boolean isAlreadyAllocatedToSame = currentStatus.equals(AssetMaster.Constants.ALLOCATED) && 
                                          asset.getAssignedToEmployee() != null && 
                                          asset.getAssignedToEmployee().getEmployeeId() != null &&
                                          allocation.getEmployee() != null &&
                                          asset.getAssignedToEmployee().getEmployeeId().equals(allocation.getEmployee().getEmployeeId());
                                          
        if (!currentStatus.equals(AssetMaster.Constants.IN_STOCK) && !isAlreadyAllocatedToSame) {
            throw new RuntimeException("Asset is not available for allocation. Current status: " + rawStatus);
        }

        if (!asset.isActive()) {
            throw new RuntimeException("Asset is inactive and cannot be allocated.");
        }

        // Update asset status and assignment
        asset.setStatus(AssetMaster.Constants.ALLOCATED);
        asset.setAssignedToEmployee(allocation.getEmployee());
        
        // Sync dynamic values for UI consistency (which prioritizes the map)
        if (asset.getDynamicValues() == null) {
            asset.setDynamicValues(new java.util.HashMap<>());
        }
        putDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_STATUS, AssetMaster.Constants.ALLOCATED);
        putDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_ASSET_STATUS, AssetMaster.Constants.ALLOCATED);
        
        assetMasterRepository.save(asset);

        // Fetch full employee details
        Employee employee = employeeRepository.findByEmployeeId(allocation.getEmployee().getEmployeeId())
                .orElseThrow(() -> new RuntimeException(
                        "Employee not found with ID: " + allocation.getEmployee().getEmployeeId()));

        // Set managed entities back to allocation to ensure proper JPA persistence
        allocation.setAsset(asset);
        allocation.setEmployee(employee);

        // Set allocation details
        allocation.setAllocationId(generateAllocationId());
        allocation.setAllocationDate(LocalDate.now());
        allocation.setApprovedBy(userId); // Set the allocator ID
        allocation.setActive(true);

        if (issuedImageBase64 != null && !issuedImageBase64.isEmpty()) {
            allocation.setIssuedImage(decodeBase64(issuedImageBase64));
        }

        AssetAllocation savedAllocation = allocationRepository.save(allocation);

        // Send Notification
        String categoryName = asset.getCategory() != null ? asset.getCategory().getName() : "Asset";
        String notificationMessage = String.format("A new asset (%s - %s) has been allocated to you. Allocation ID: %s",
                categoryName, asset.getAssetTag(), savedAllocation.getAllocationId());
        notificationService.sendWorkflowNotification(employee.getEmployeeId(), notificationMessage);

        // Send Email
        String emailSubject = "Asset Allocation Confirmation - " + savedAllocation.getAllocationId();
        String emailBody = String.format(
                "Dear %s %s,\n\n" +
                        "This is to inform you that an asset has been successfully allocated to you.\n\n" +
                        "Asset details:\n" +
                        "- Category: %s\n" +
                        "- Asset Tag: %s\n" +
                        "- Allocation Date: %s\n" +
                        "- Condition at Issue: %s\n\n" +
                        "Please acknowledge the receipt of this asset in your employee portal.\n\n" +
                        "Regards,\n" +
                        "IT Department",
                employee.getFirstName(), employee.getLastName(),
                categoryName, asset.getAssetTag(), savedAllocation.getAllocationDate(),
                savedAllocation.getConditionAtIssue());
        emailService.sendEmail(employee.getEmail(), emailSubject, emailBody);

        System.out.println("✅ Asset allocated and notification triggered for " + employee.getEmployeeId());

        auditService.log("ALLOCATE", asset.getId(), asset.getAssetTag(), userId, AssetMaster.Constants.IN_STOCK,
                "ALLOCATED to Employee: " + allocation.getEmployee().getEmployeeId());

        return savedAllocation;
    }

    private String resolveRawStatus(AssetMaster asset) {
        String rawStatus = asset.getStatus();
        if (rawStatus == null || rawStatus.trim().isEmpty()) {
            if (asset.getDynamicValues() != null) {
                rawStatus = getDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_STATUS);
                if (rawStatus == null) {
                    rawStatus = getDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_ASSET_STATUS);
                }
            }
        }
        if (rawStatus == null || rawStatus.trim().isEmpty()) {
            rawStatus = "IN_STOCK";
        }
        return rawStatus;
    }

    @CacheEvict(value = "assetAllocations", allEntries = true)
    @Transactional
    public AssetAllocation processReturn(Long allocationId, String conditionAtReturn, String returnImageBase64,
            String damageNotes,
            String verifiedBy, String userId) {
        AssetAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new RuntimeException("Allocation record not found"));

        if (!allocation.isActive()) {
            throw new RuntimeException("Allocation is already closed.");
        }

        AssetMaster asset = allocation.getAsset();

        // Update allocation record
        allocation.setActive(false);
        allocation.setReturnDate(LocalDate.now());
        allocation.setConditionAtReturn(conditionAtReturn);
        if (returnImageBase64 != null && !returnImageBase64.isEmpty()) {
            allocation.setReturnImage(decodeBase64(returnImageBase64));
        }
        allocation.setDamageNotes(damageNotes);
        allocation.setVerifiedBy(verifiedBy);

        // Update asset status based on return condition
        String newStatus;
        if (conditionAtReturn != null && conditionAtReturn.toUpperCase().contains("DAMAGED")) {
            newStatus = AssetMaster.Constants.DAMAGED;
        } else {
            newStatus = AssetMaster.Constants.IN_STOCK;
            asset.setAssignedToEmployee(null); // Clear assignment
        }
        
        asset.setStatus(newStatus);
        
        // Sync dynamic values for UI consistency
        if (asset.getDynamicValues() == null) {
            asset.setDynamicValues(new java.util.HashMap<>());
        }
        putDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_STATUS, newStatus);
        putDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_ASSET_STATUS, newStatus);
        
        assetMasterRepository.save(asset);

        AssetAllocation savedAllocation = allocationRepository.save(allocation);

        auditService.log("RETURN", asset.getId(), asset.getAssetTag(), userId, AssetMaster.Constants.ALLOCATED,
                "RETURNED. Condition: " + conditionAtReturn);

        return savedAllocation;
    }

    private byte[] decodeBase64(String base64Str) {
        try {
            if (base64Str.contains(",")) {
                base64Str = base64Str.split(",")[1];
            }
            return java.util.Base64.getDecoder().decode(base64Str);
        } catch (Exception e) {
            System.err.println("Error decoding base64 image: " + e.getMessage());
            return null;
        }
    }

    @CacheEvict(value = "assetAllocations", allEntries = true)
    @Transactional
    public void deleteAllocation(Long allocationId, String userId) {
        AssetAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new RuntimeException("Allocation record not found"));

        if (!allocation.isActive()) {
            throw new RuntimeException("Allocation is already inactive/closed.");
        }

        AssetMaster asset = allocation.getAsset();

        // Update allocation record
        allocation.setActive(false);
        allocation.setReturnDate(LocalDate.now());
        allocation.setConditionAtReturn("DELETED");
        allocation.setVerifiedBy(userId);

        // Update asset status back to IN_STOCK and clear assignment
        asset.setStatus(AssetMaster.Constants.IN_STOCK);
        asset.setAssignedToEmployee(null);
        
        // Sync dynamic values for UI consistency
        if (asset.getDynamicValues() == null) {
            asset.setDynamicValues(new java.util.HashMap<>());
        }
        putDynamicValueCaseInsensitive(asset.getDynamicValues(), CONST_STATUS, AssetMaster.Constants.IN_STOCK);
        
        assetMasterRepository.save(asset);

        allocationRepository.save(allocation);

        auditService.log("DELETE", asset.getId(), asset.getAssetTag(), userId, "ALLOCATED",
                "ALLOCATION DELETED - Asset returned to stock");
    }

    private String generateAllocationId() {
        String year = String.valueOf(LocalDate.now().getYear());
        String prefix = "ALOC-" + year + "-";

        // Fetch the absolute last allocation to ensure sequence continuity regardless of format
        Optional<AssetAllocation> lastAllocation = Optional.ofNullable(allocationRepository.findTopByOrderByIdDesc());

        int nextSequence = 1;
        if (lastAllocation.isPresent()) {
            String lastId = lastAllocation.get().getAllocationId();
            try {
                String sequenceStr = lastId.substring(lastId.lastIndexOf("-") + 1);
                nextSequence = Integer.parseInt(sequenceStr) + 1;
            } catch (Exception e) {
                // Fallback if parsing fails
                nextSequence = (int) (allocationRepository.count() + 1);
            }
        }

        return String.format("%s%03d", prefix, nextSequence);
    }

    private void putDynamicValueCaseInsensitive(java.util.Map<String, String> map, String key, String value) {
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

    private String getDynamicValueCaseInsensitive(java.util.Map<String, String> map, String key) {
        if (map == null || key == null) return null;
        return map.keySet().stream()
                .filter(k -> k.equalsIgnoreCase(key))
                .map(map::get)
                .findFirst()
                .orElse(null);
    }
}
