package com.register.example.repository;

import com.register.example.entity.GlobalSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GlobalSettingsRepository extends JpaRepository<GlobalSettings, Long> {
    Optional<GlobalSettings> findBySettingKey(String settingKey);
    List<GlobalSettings> findAllBySettingKey(String settingKey);
}
