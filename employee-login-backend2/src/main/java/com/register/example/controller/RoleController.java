package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.service.EmployeeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/access")
public class RoleController {

        @Autowired
        private EmployeeService employeeService;

        @Autowired
        private com.register.example.repository.DelegationRepository delegationRepository;



        @GetMapping("/assigned-ids/{employeeId}")
        public ResponseEntity<Map<String, Boolean>> getAssignedRoles(@PathVariable String employeeId) {
                List<Employee> allEmployees = employeeService.getAllEmployees();

                Employee self = allEmployees.stream()
                                .filter(emp -> employeeId.equals(emp.getEmployeeId()))
                                .findFirst()
                                .orElse(null);

                java.util.Date now = new java.util.Date();
                List<com.register.example.entity.Delegation> delegations = delegationRepository.findByDelegateId(employeeId);
                List<String> delegators = getActiveDelegators(delegations, now);

                boolean isManager = checkEmployeeRole(allEmployees, self, employeeId, delegators, Employee::getAssignedManagerId);
                boolean isFinance = checkEmployeeRole(allEmployees, self, employeeId, delegators, Employee::getAssignedFinanceId);
                boolean isHr = checkEmployeeRole(allEmployees, self, employeeId, delegators, Employee::getAssignedHrId);
                boolean isReviewer = checkEmployeeRole(allEmployees, self, employeeId, delegators, Employee::getReviewerId);
                boolean isAdmin = checkEmployeeRole(allEmployees, self, employeeId, delegators, Employee::getAssignedAdminId);
                boolean isTravelAdmin = checkTravelAdminRole(allEmployees, self, employeeId, delegators);

                boolean canViewTasks = isManager || isFinance || isHr || isReviewer || isAdmin || isTravelAdmin;

                return ResponseEntity.ok(Map.of(
                                "manager", isManager,
                                "finance", isFinance,
                                "hr", isHr,
                                "reviewer", isReviewer,
                                "admin", isAdmin,
                                "travelAdmin", isTravelAdmin,

                                "canViewTasks", canViewTasks));
        }

        private List<String> getActiveDelegators(List<com.register.example.entity.Delegation> delegations, java.util.Date now) {
                java.util.List<String> activeDelegators = new java.util.ArrayList<>();
                for (com.register.example.entity.Delegation d : delegations) {
                        if (!"Active".equalsIgnoreCase(d.getStatus())) {
                                continue;
                        }
                        if (isWithinDateRange(d, now)) {
                                activeDelegators.add(d.getDelegatorId());
                        }
                }
                return activeDelegators;
        }

        private boolean isWithinDateRange(com.register.example.entity.Delegation d, java.util.Date now) {
                java.util.Calendar cal = java.util.Calendar.getInstance();

                cal.setTime(d.getBeginDate());
                cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                cal.set(java.util.Calendar.MINUTE, 0);
                cal.set(java.util.Calendar.SECOND, 0);
                cal.set(java.util.Calendar.MILLISECOND, 0);
                java.util.Date startDate = cal.getTime();

                cal.setTime(d.getEndDate());
                cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                cal.set(java.util.Calendar.MINUTE, 59);
                cal.set(java.util.Calendar.SECOND, 59);
                cal.set(java.util.Calendar.MILLISECOND, 999);
                java.util.Date endDate = cal.getTime();

                return !now.before(startDate) && !now.after(endDate);
        }

        private boolean checkEmployeeRole(List<Employee> allEmployees, Employee self, String employeeId, List<String> delegators, java.util.function.Function<Employee, String> extractor) {
                if (allEmployees.stream().anyMatch(emp -> employeeId.equals(extractor.apply(emp)))) {
                        return true;
                }
                if (self != null && employeeId.equals(extractor.apply(self))) {
                        return true;
                }
                for (String delId : delegators) {
                        if (allEmployees.stream().anyMatch(emp -> delId.equals(extractor.apply(emp)))) {
                                return true;
                        }
                }
                return false;
        }

        private boolean checkTravelAdminRole(List<Employee> allEmployees, Employee self, String employeeId, List<String> delegators) {
                if (allEmployees.stream().anyMatch(emp -> emp.getTravelAdmin() != null && emp.getTravelAdmin().contains(employeeId))) {
                        return true;
                }
                if (self != null && self.getTravelAdmin() != null && self.getTravelAdmin().contains(employeeId)) {
                        return true;
                }
                for (String delId : delegators) {
                        if (allEmployees.stream().anyMatch(emp -> emp.getTravelAdmin() != null && emp.getTravelAdmin().contains(delId))) {
                                return true;
                        }
                }
                return false;
        }
}
