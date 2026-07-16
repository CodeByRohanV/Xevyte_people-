package com.register.example.service;

import com.register.example.entity.ITDeclarationConfig;
import com.register.example.repository.ITDeclarationConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ITDeclarationConfigService {

    @Autowired
    private ITDeclarationConfigRepository configRepository;

    public ITDeclarationConfig getConfig(String financialYear) {
        if (financialYear != null) {
            return configRepository.findByFinancialYear(financialYear).orElse(new ITDeclarationConfig());
        }
        return configRepository.findFirstByOrderByIdDesc().orElse(new ITDeclarationConfig());
    }

    public ITDeclarationConfig saveConfig(ITDeclarationConfig config) {
        ITDeclarationConfig existing = null;
        if (config.getFinancialYear() != null) {
            existing = configRepository.findByFinancialYear(config.getFinancialYear()).orElse(null);
        } else {
            existing = configRepository.findFirstByOrderByIdDesc().orElse(null);
        }

        if (existing != null) {
            existing.setFromDate(config.getFromDate());
            existing.setToDate(config.getToDate());
            existing.setFinancialYear(config.getFinancialYear());
            return configRepository.save(existing);
        }
        return configRepository.save(config);
    }
}
