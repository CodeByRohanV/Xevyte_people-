package com.register.example.service;

import com.register.example.entity.GlobalSettings;
import com.register.example.repository.GlobalSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GlobalSettingsService {

    @Autowired
    private GlobalSettingsRepository globalSettingsRepository;

    public GlobalSettings saveOrUpdate(String key, byte[] mediaData, String content) {
        GlobalSettings settings = globalSettingsRepository.findBySettingKey(key)
                .orElse(new GlobalSettings());
        
        settings.setSettingKey(key);
        settings.setMediaData(mediaData);
        settings.setContent(content);
        
        return globalSettingsRepository.save(settings);
    }

    public GlobalSettings createNew(String key, byte[] mediaData, String content) {
        GlobalSettings settings = new GlobalSettings();
        settings.setSettingKey(key);
        settings.setMediaData(mediaData);
        settings.setContent(content);
        return globalSettingsRepository.save(settings);
    }

    public List<GlobalSettings> getAllSettingsByKey(String key) {
        return globalSettingsRepository.findAllBySettingKey(key);
    }

    public Optional<GlobalSettings> getSettings(String key) {
        return globalSettingsRepository.findBySettingKey(key);
    }

    public void deleteSetting(Long id) {
        globalSettingsRepository.deleteById(id);
    }
}
