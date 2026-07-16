package com.register.example.service;

import com.register.example.entity.AssetDropdownOption;
import com.register.example.repository.AssetDropdownOptionRepository;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AssetDropdownOptionService {

    private static final String TEMPLATE_COLUMN = "TEMPLATE_COLUMN";

    @Autowired
    private AssetDropdownOptionRepository repository;

    @PostConstruct
    public void initDefaults() {
        // Initialization logic is now minimal to respect dynamic Admin configuration.
        // However, we ensure 'Assign to Employee' exists as a template column 
        // to support its transition from a hardcoded field to a dynamic one.
        
        if (!repository.existsByTypeAndValue(TEMPLATE_COLUMN, "Assign to Employee")) {
            AssetDropdownOption opt = new AssetDropdownOption(TEMPLATE_COLUMN, "Assign to Employee", false);
            opt.setSortOrder(100);
            repository.save(opt);
            System.out.println("DEBUG: Seeded 'Assign to Employee' as a default template column.");
        }
        
        System.out.println("DEBUG: AssetDropdownOptionService initialization - verified default columns.");
    }

    public List<AssetDropdownOption> getOptionsByType(String type) {
        if (TEMPLATE_COLUMN.equals(type)) {
            return repository.findByTypeOrderBySortOrderAsc(type);
        }
        return repository.findByType(type);
    }

    public List<AssetDropdownOption> getOptionsByType(String type, String tenantId) {
        if (TEMPLATE_COLUMN.equals(type)) {
            return repository.findByTypeAndTenantIdOrderBySortOrderAsc(type, tenantId);
        }
        return repository.findByTypeAndTenantId(type, tenantId);
    }

    public AssetDropdownOption addOption(String type, String value) {
        return addOption(type, value, (String) null);
    }

    public AssetDropdownOption addOption(String type, String value, String tenantId) {
        return repository.findByTypeAndValueAndTenantId(type, value, tenantId)
                .orElseGet(() -> {
                    AssetDropdownOption opt = new AssetDropdownOption(type, value);
                    opt.setTenantId(tenantId);
                    return repository.save(opt);
                });
    }
    
    public AssetDropdownOption addOption(String type, String value, Boolean mandatory) {
        return addOption(type, value, mandatory, null);
    }

    public AssetDropdownOption addOption(String type, String value, Boolean mandatory, String tenantId) {
        return repository.findByTypeAndValueAndTenantId(type, value, tenantId)
                .orElseGet(() -> {
                    AssetDropdownOption opt = new AssetDropdownOption(type, value, mandatory);
                    opt.setTenantId(tenantId);
                    return repository.save(opt);
                });
    }

    public void deleteOption(Long id, String tenantId) {
        repository.findByIdAndTenantId(id, tenantId).ifPresent(repository::delete);
    }

    public AssetDropdownOption updateOption(Long id, AssetDropdownOption option, String tenantId) {
        System.out.println("DEBUG: Updating option ID " + id + " with sortOrder: " + option.getSortOrder());
        AssetDropdownOption existing = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Option not found with id: " + id));
        
        System.out.println("DEBUG: Before update - Existing sortOrder: " + existing.getSortOrder());
        
        // Check for duplicates if value is changing
        if (!existing.getValue().equals(option.getValue()) && 
            repository.existsByTypeAndValueAndTenantId(existing.getType(), option.getValue(), tenantId)) {
            throw new RuntimeException("Option already exists");
        }

        existing.setValue(option.getValue());
        existing.setSortOrder(option.getSortOrder());
        existing.setMandatory(option.getMandatory() != null ? option.getMandatory() : existing.getMandatory()); // Save mandatory
        
        // Save show_in_inventory if provided, otherwise keep existing
        if (option.getShowInInventory() != null) {
            existing.setShowInInventory(option.getShowInInventory());
        }
        
        System.out.println("DEBUG: After update - New sortOrder: " + existing.getSortOrder());
        
        AssetDropdownOption saved = repository.save(existing);
        System.out.println("DEBUG: After save - Saved sortOrder: " + saved.getSortOrder());
        return saved;
    }
}
