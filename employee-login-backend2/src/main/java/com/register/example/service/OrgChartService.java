package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrgChartService {

    private final EmployeeRepository employeeRepository;

    public OrgChartService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public static class OrgNode {
        public String employeeId;
        public String name;
        public String designation;
        public String department;
        public String profilePic;
        public String status;
        public String assignedManagerId;
        public String email;
        public String contactNo;
        public String workLocation;
        
        // Additional columns
        public String aadharNo;
        public String panNo;
        public String address;
        public String presentAddress;
        public String personalMail;
        public String emergencyContactNumber;
        public String gender;
        public String dateOfBirth;
        public String bloodGroup;
        public String employeeType;
        public String probationStatus;
        public String uanNumber;
        public String pfMemberId;
        public String esiNumber;
        public String esiDispensary;
        public String accountHolderName;
        public String bankName;
        public String bankAccountNumber;
        public String bankIfscCode;
        public String joiningDate;

        public List<OrgNode> subordinates = new ArrayList<>();

        public OrgNode(Employee emp) {
            this.employeeId = emp.getEmployeeId();
            this.name = emp.getFirstName() + " " + emp.getLastName();
            this.designation = emp.getRole() != null ? emp.getRole() : "Employee";
            this.department = emp.getDepartment() != null ? emp.getDepartment() : "N/A";
            this.profilePic = emp.getProfilePic();
            this.status = "yes".equalsIgnoreCase(emp.getActive()) ? "Active" : "Inactive";
            this.assignedManagerId = emp.getAssignedManagerId();
            this.email = emp.getEmail();
            this.contactNo = emp.getContactNo();
            this.workLocation = emp.getWorkLocation();
            
            // Map additional columns
            this.aadharNo = emp.getAadharNo();
            this.panNo = emp.getPanNo();
            this.address = emp.getAddress();
            this.presentAddress = emp.getPresentAddress();
            this.personalMail = emp.getPersonalMail();
            this.emergencyContactNumber = emp.getEmergencyContactNumber();
            this.gender = emp.getGender();
            this.dateOfBirth = emp.getDateOfBirth() != null ? emp.getDateOfBirth().toString() : null;
            this.bloodGroup = emp.getBloodGroup();
            this.employeeType = emp.getEmployeeType();
            this.probationStatus = emp.getProbationStatus();
            this.uanNumber = emp.getUanNumber();
            this.pfMemberId = emp.getPfMemberId();
            this.esiNumber = emp.getEsiNumber();
            this.esiDispensary = emp.getEsiDispensary();
            this.accountHolderName = emp.getAccountHolderName();
            this.bankName = emp.getBankName();
            this.bankAccountNumber = emp.getBankAccountNumber();
            this.bankIfscCode = emp.getBankIfscCode();
            this.joiningDate = emp.getJoiningDate() != null ? emp.getJoiningDate().toString() : null;
        }
    }

    /**
     * Builds a user-scoped organization overview chart.
     * Starting from the logged-in employee:
     * - Fetches the upward manager path to the top CEO (each node on the upward path has exactly one child, the next manager).
     * - Fetches all direct/indirect reports below the logged-in employee recursively.
     */
    public OrgNode buildOrganizationOverview(String employeeId, String tenantId) {
        // Fetch current employee
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
        if (empOpt.isEmpty()) {
            return null;
        }
        Employee targetEmp = empOpt.get();

        // Scope active employees to tenant
        List<Employee> employees;
        if (tenantId != null && !tenantId.isEmpty()) {
            employees = employeeRepository.findByTenantId(tenantId);
        } else {
            employees = employeeRepository.findAll();
        }

        List<Employee> activeEmployees = employees.stream()
                .filter(e -> "yes".equalsIgnoreCase(e.getActive()))
                .collect(Collectors.toList());

        Map<String, OrgNode> nodeMap = new HashMap<>();
        for (Employee emp : activeEmployees) {
            nodeMap.put(emp.getEmployeeId(), new OrgNode(emp));
        }

        // Safeguard: Ensure target node is in the map
        if (!nodeMap.containsKey(targetEmp.getEmployeeId())) {
            nodeMap.put(targetEmp.getEmployeeId(), new OrgNode(targetEmp));
        }

        // 1. Build upward manager path from logged-in user to the top root
        List<OrgNode> upwardChain = new ArrayList<>();
        OrgNode current = nodeMap.get(targetEmp.getEmployeeId());
        Set<String> visited = new HashSet<>(); // cycle guard
        while (current != null && !visited.contains(current.employeeId)) {
            upwardChain.add(current);
            visited.add(current.employeeId);
            String managerId = current.assignedManagerId;
            if (managerId == null || managerId.trim().isEmpty() || !nodeMap.containsKey(managerId)) {
                break;
            }
            current = nodeMap.get(managerId);
        }

        // Reverse upwardChain so it starts with the top-most manager: [CEO, Manager 2, Manager 1, Logged-In Employee]
        Collections.reverse(upwardChain);

        // 2. Build map of manager to reports for downward recursive lookups
        Map<String, List<OrgNode>> managerToReportsMap = new HashMap<>();
        for (OrgNode node : nodeMap.values()) {
            String mngId = node.assignedManagerId;
            if (mngId != null && !mngId.trim().isEmpty()) {
                managerToReportsMap.computeIfAbsent(mngId, k -> new ArrayList<>()).add(node);
            }
        }

        // 3. Build downward hierarchy from the logged-in employee node recursively
        OrgNode targetNode = nodeMap.get(targetEmp.getEmployeeId());
        buildDownwardHierarchy(targetNode, managerToReportsMap, new HashSet<>());

        // 4. Connect upward chain: each manager in the chain points strictly to the next subordinate in the path
        OrgNode finalRoot = targetNode;
        for (int i = upwardChain.size() - 2; i >= 0; i--) {
            OrgNode manager = upwardChain.get(i);
            OrgNode pathChild = upwardChain.get(i + 1);

            if (i == upwardChain.size() - 2) {
                // For the immediate manager of the logged-in employee, include all of their direct reports (peers)
                List<OrgNode> peers = managerToReportsMap.get(manager.employeeId);
                manager.subordinates.clear();
                if (peers != null) {
                    for (OrgNode peer : peers) {
                        manager.subordinates.add(peer);
                    }
                }
            } else {
                manager.subordinates.clear();
                manager.subordinates.add(pathChild);
            }

            if (i == 0) {
                finalRoot = manager;
            }
        }

        // 5. Clean up any cyclic subordinates in the combined tree
        pruneCycles(finalRoot, new HashSet<>());

        // 6. Sort subordinates alphabetically starting from the final root
        sortDownwardSubordinates(finalRoot);

        return finalRoot;
    }

    private void buildDownwardHierarchy(OrgNode parentNode, Map<String, List<OrgNode>> managerToReportsMap, Set<String> visited) {
        if (visited.contains(parentNode.employeeId)) {
            return;
        }
        visited.add(parentNode.employeeId);

        List<OrgNode> reports = managerToReportsMap.get(parentNode.employeeId);
        if (reports != null) {
            for (OrgNode child : reports) {
                // Ensure we don't introduce circular parent links
                if (!child.employeeId.equalsIgnoreCase(parentNode.employeeId)) {
                    parentNode.subordinates.add(child);
                    buildDownwardHierarchy(child, managerToReportsMap, visited);
                }
            }
        }
    }

    private void pruneCycles(OrgNode node, Set<String> ancestors) {
        ancestors.add(node.employeeId);

        Iterator<OrgNode> iterator = node.subordinates.iterator();
        while (iterator.hasNext()) {
            OrgNode child = iterator.next();
            if (ancestors.contains(child.employeeId)) {
                iterator.remove(); // Prune cycle
            } else {
                pruneCycles(child, ancestors);
            }
        }

        ancestors.remove(node.employeeId);
    }

    private void sortDownwardSubordinates(OrgNode node) {
        if (node.subordinates != null && !node.subordinates.isEmpty()) {
            node.subordinates.sort(Comparator.comparing(n -> n.name));
            for (OrgNode sub : node.subordinates) {
                sortDownwardSubordinates(sub);
            }
        }
    }

    /**
     * Legacy build method for full organization tree.
     */
    public List<OrgNode> buildOrgChartTree(String tenantId) {
        List<Employee> employees;
        if (tenantId != null && !tenantId.isEmpty()) {
            employees = employeeRepository.findByTenantId(tenantId);
        } else {
            employees = employeeRepository.findAll();
        }

        List<Employee> activeEmployees = employees.stream()
                .filter(e -> "yes".equalsIgnoreCase(e.getActive()))
                .collect(Collectors.toList());

        Map<String, OrgNode> nodeMap = new HashMap<>();
        for (Employee emp : activeEmployees) {
            nodeMap.put(emp.getEmployeeId(), new OrgNode(emp));
        }

        List<OrgNode> roots = new ArrayList<>();

        for (OrgNode node : nodeMap.values()) {
            String parentId = node.assignedManagerId;
            if (parentId == null || parentId.trim().isEmpty() || !nodeMap.containsKey(parentId)) {
                roots.add(node);
            } else {
                OrgNode parentNode = nodeMap.get(parentId);
                if (!node.employeeId.equalsIgnoreCase(parentId)) {
                    parentNode.subordinates.add(node);
                } else {
                    roots.add(node);
                }
            }
        }

        for (OrgNode node : nodeMap.values()) {
            node.subordinates.sort(Comparator.comparing(n -> n.name));
        }
        roots.sort(Comparator.comparing(n -> n.name));

        return roots;
    }
}
