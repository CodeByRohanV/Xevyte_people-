package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "helpdesk_team_access")
public class HelpDeskTeamAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // HR_TEAM, FINANCE_TEAM, ADMIN_TEAM, IT_ASSET_TEAM, OTHER_TEAM
    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;

    // Comma separated IDs: EMP101,EMP202,EMP303
    @Column(name = "team_ids", columnDefinition = "TEXT")
    private String teamIds;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    public HelpDeskTeamAccess() {}

    public HelpDeskTeamAccess(String roleName, String teamIds) {
        this.roleName = roleName;
        this.teamIds = teamIds;
    }

    public HelpDeskTeamAccess(String roleName, String teamIds, String tenantId) {
        this.roleName = roleName;
        this.teamIds = teamIds;
        this.tenantId = tenantId;
    }

    public Long getId() {
        return id;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getTeamIds() {
        return teamIds;
    }

    public void setTeamIds(String teamIds) {
        this.teamIds = teamIds;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
    
    
}
