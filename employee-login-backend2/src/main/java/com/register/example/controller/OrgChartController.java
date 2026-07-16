package com.register.example.controller;

import com.register.example.service.OrgChartService;
import com.register.example.service.OrgChartService.OrgNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class OrgChartController {

    private final OrgChartService orgChartService;

    public OrgChartController(OrgChartService orgChartService) {
        this.orgChartService = orgChartService;
    }

    @GetMapping("/api/org-chart")
    public ResponseEntity<List<OrgNode>> getOrgChartTree(HttpServletRequest request) {
        String tenantId = (String) request.getAttribute("X-Tenant-ID");
        if (tenantId == null) {
            tenantId = (String) request.getAttribute("X-Tenant-ID-Num");
        }
        List<OrgNode> tree = orgChartService.buildOrgChartTree(tenantId);
        return ResponseEntity.ok(tree);
    }

    @GetMapping("/api/organization-overview/{employeeId}")
    public ResponseEntity<OrgNode> getOrganizationOverview(
            @PathVariable String employeeId,
            HttpServletRequest request) {

        String tenantId = (String) request.getAttribute("X-Tenant-ID");
        if (tenantId == null) {
            tenantId = (String) request.getAttribute("X-Tenant-ID-Num");
        }

        OrgNode tree = orgChartService.buildOrganizationOverview(employeeId, tenantId);
        if (tree == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tree);
    }
}
