package com.register.example.repository;

import com.register.example.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByTenantId(String tenantId);
    Optional<Location> findByLocationNameAndTenantId(String locationName, String tenantId);
    Optional<Location> findByLocationName(String locationName);
}
