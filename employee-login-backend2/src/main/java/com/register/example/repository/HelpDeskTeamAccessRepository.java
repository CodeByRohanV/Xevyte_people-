package com.register.example.repository;

import com.register.example.entity.HelpDeskTeamAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface HelpDeskTeamAccessRepository extends JpaRepository<HelpDeskTeamAccess, Long> {

    Optional<HelpDeskTeamAccess> findByRoleNameAndTenantId(String roleName, String tenantId);
    List<HelpDeskTeamAccess> findByTenantId(String tenantId);
}
