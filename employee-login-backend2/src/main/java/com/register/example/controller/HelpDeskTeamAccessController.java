package com.register.example.controller;

import com.register.example.entity.HelpDeskTeamAccess;
import com.register.example.service.HelpDeskTeamAccessService;
import com.register.example.service.TicketService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/helpdesk-teams")
@CrossOrigin(origins = "*")
public class HelpDeskTeamAccessController {

    private final HelpDeskTeamAccessService service;
    private final TicketService ticketService;

    public HelpDeskTeamAccessController(HelpDeskTeamAccessService service, TicketService ticketService) {
        this.service = service;
        this.ticketService = ticketService;
    }

    @PostMapping("/save")
    public Map<String, Object> saveTeamAccess(@RequestBody Map<String, Object> request) {

        String teamName = (String) request.get("teamName");
        List<String> employeeIds = (List<String>) request.get("employeeIds");

        // Get list of removed employee IDs before saving
        List<String> removedIds = service.getRemovedEmployeeIds(teamName, employeeIds);

        // Save the new team access
        HelpDeskTeamAccess saved = service.saveTeamAccess(teamName, employeeIds);

        // Reassign tickets from removed team members
        int totalReassigned = 0;
        for (String removedId : removedIds) {
            int count = ticketService.reassignTicketsFromRemovedTeamMember(removedId, teamName);
            totalReassigned += count;
        }

        // Return response with reassignment info
        Map<String, Object> response = new HashMap<>();
        response.put("teamAccess", saved);
        response.put("removedEmployeeIds", removedIds);
        response.put("ticketsReassigned", totalReassigned);

        return response;
    }

    @PostMapping("/create")
    public HelpDeskTeamAccess createTeam(@RequestBody Map<String, String> request) {
        String teamName = request.get("teamName");

        // Create new team with empty employee IDs
        return service.saveTeamAccess(teamName, List.of());
    }

    @GetMapping("/all")
    public List<String> getAllTeams() {
        return service.getAllTeamNames();
    }

    @GetMapping("/team-exact/{employeeId}")
    public Map<String, Object> getExactTeamAccess(@PathVariable String employeeId) {
        boolean hasAccess = service.hasExactTeamAccess(employeeId);

        return Map.of(
                "employeeId", employeeId,
                "hasAccess", hasAccess);
    }

    @GetMapping("/team/{teamName}")
    public HelpDeskTeamAccess getTeam(@PathVariable String teamName) {
        return service.getTeamAccessByRoleName(teamName);
    }

}
