package com.register.example.controller;

import com.register.example.entity.Customer;
import com.register.example.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Comparator;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private com.register.example.repository.EmployeeRepository employeeRepository;

    @Autowired
    private HttpServletRequest request;

    @Autowired
    private com.register.example.repository.SowRepository sowRepository;

    @Autowired
    private com.register.example.repository.ProjectRepository projectRepository;

    @PostConstruct
    public void migrateTenantIds() {
        try {
            migrateCustomersTenantIds();
            migrateSowsTenantIds();
            migrateProjectsTenantIds();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void migrateCustomersTenantIds() {
        List<Customer> customers = customerRepository.findAll();
        Map<String, List<Customer>> customersByTenant = new HashMap<>();
        for (Customer c : customers) {
            if (c.getTenantCustomerId() == null) {
                String tenant = c.getTenantId() == null ? "" : c.getTenantId();
                customersByTenant.computeIfAbsent(tenant, k -> new ArrayList<>()).add(c);
            }
        }
        for (Map.Entry<String, List<Customer>> entry : customersByTenant.entrySet()) {
            String tenant = entry.getKey();
            Long max = 0L;
            if (!tenant.isEmpty()) {
                max = customerRepository.findMaxTenantCustomerIdByTenantId(tenant);
            } else {
                max = customerRepository.findMaxTenantCustomerIdWithoutTenant();
            }
            if (max == null) max = 0L;
            
            List<Customer> toMigrate = entry.getValue();
            toMigrate.sort(Comparator.comparing(Customer::getCustomerId));
            for (Customer c : toMigrate) {
                max++;
                c.setTenantCustomerId(max);
                customerRepository.save(c);
            }
        }
    }

    private void migrateSowsTenantIds() {
        List<com.register.example.entity.Sow> sows = sowRepository.findAll();
        Map<String, List<com.register.example.entity.Sow>> sowsByTenant = new HashMap<>();
        for (com.register.example.entity.Sow s : sows) {
            if (s.getTenantSowId() == null) {
                String tenant = s.getTenantId() == null ? "" : s.getTenantId();
                sowsByTenant.computeIfAbsent(tenant, k -> new ArrayList<>()).add(s);
            }
        }
        for (Map.Entry<String, List<com.register.example.entity.Sow>> entry : sowsByTenant.entrySet()) {
            String tenant = entry.getKey();
            Long max = 0L;
            if (!tenant.isEmpty()) {
                max = sowRepository.findMaxTenantSowIdByTenantId(tenant);
            } else {
                max = sowRepository.findMaxTenantSowIdWithoutTenant();
            }
            if (max == null) max = 0L;
            
            List<com.register.example.entity.Sow> toMigrate = entry.getValue();
            toMigrate.sort(Comparator.comparing(com.register.example.entity.Sow::getSowId));
            for (com.register.example.entity.Sow s : toMigrate) {
                max++;
                s.setTenantSowId(max);
                sowRepository.save(s);
            }
        }
    }

    private void migrateProjectsTenantIds() {
        List<com.register.example.entity.Project> projects = projectRepository.findAll();
        Map<String, List<com.register.example.entity.Project>> projectsByTenant = new HashMap<>();
        for (com.register.example.entity.Project p : projects) {
            if (p.getTenantProjectId() == null) {
                String tenant = p.getTenantId() == null ? "" : p.getTenantId();
                projectsByTenant.computeIfAbsent(tenant, k -> new ArrayList<>()).add(p);
            }
        }
        for (Map.Entry<String, List<com.register.example.entity.Project>> entry : projectsByTenant.entrySet()) {
            String tenant = entry.getKey();
            Long max = 0L;
            if (!tenant.isEmpty()) {
                max = projectRepository.findMaxTenantProjectIdByTenantId(tenant);
            } else {
                max = projectRepository.findMaxTenantProjectIdWithoutTenant();
            }
            if (max == null) max = 0L;
            
            List<com.register.example.entity.Project> toMigrate = entry.getValue();
            toMigrate.sort(Comparator.comparing(com.register.example.entity.Project::getProjectId));
            for (com.register.example.entity.Project p : toMigrate) {
                max++;
                p.setTenantProjectId(max);
                projectRepository.save(p);
            }
        }
    }

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    // Get all customers
    @GetMapping
    public List<Customer> getAllCustomers() {
        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return customerRepository.findByTenantId(tenantId);
        }
        return customerRepository.findAll();
    }

    private boolean existsCustomer(String customerName, String tenantId) {
        if (tenantId != null && !tenantId.isEmpty()) {
            return customerRepository.existsByCustomerNameAndTenantId(customerName, tenantId);
        } else {
            return customerRepository.existsByCustomerName(customerName);
        }
    }

    private Long getNextTenantCustomerId(String tenantId) {
        Long nextSeq = 1L;
        if (tenantId != null && !tenantId.isEmpty()) {
            Long maxVal = customerRepository.findMaxTenantCustomerIdByTenantId(tenantId);
            if (maxVal != null) {
                nextSeq = maxVal + 1;
            }
        } else {
            Long maxVal = customerRepository.findMaxTenantCustomerIdWithoutTenant();
            if (maxVal != null) {
                nextSeq = maxVal + 1;
            }
        }
        return nextSeq;
    }

    // Create a new customer with file upload (stored in DB)
    @PostMapping
    public ResponseEntity<Object> createCustomer(
            @RequestParam("customerName") String customerName,
            @RequestParam("msaDoc") MultipartFile msaDoc,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {

        try {
            String contentType = msaDoc.getContentType();
            if (!List.of("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
                return ResponseEntity.badRequest().body("Invalid file type. Only PDF, JPEG, and PNG are allowed.");
            }

            String tenantId = getCurrentUserTenantId();
            if (existsCustomer(customerName, tenantId)) {
                return ResponseEntity.badRequest()
                        .body("Customer with name '" + customerName + "' already exists.");
            }

            String originalFilename = msaDoc.getOriginalFilename();

            Customer customer = new Customer();
            customer.setCustomerName(customerName);
            customer.setMsaDocName(originalFilename);
            customer.setMsaDocBlob(msaDoc.getBytes()); // BLOB here
            customer.setStartDate(LocalDate.parse(startDate));
            customer.setEndDate(LocalDate.parse(endDate));
            customer.setTenantId(tenantId);

            Long nextSeq = getNextTenantCustomerId(tenantId);
            customer.setTenantCustomerId(nextSeq);

            Customer savedCustomer = customerRepository.save(customer);

            return ResponseEntity.ok(savedCustomer);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Download MSA document from DB
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadMSA(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(customer.getTenantId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        if (customer.getMsaDocBlob() == null || customer.getMsaDocBlob().length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Resource resource = new ByteArrayResource(customer.getMsaDocBlob());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + customer.getMsaDocName() + "\"")
                .body(resource);
    }

    // Get customer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        String tenantId = getCurrentUserTenantId();
        return customerRepository.findById(id)
                .map(customer -> {
                    if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(customer.getTenantId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).<Customer>build();
                    }
                    return ResponseEntity.ok(customer);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/employee/{employeeId}")
    public List<Customer> getCustomersForEmployee(@PathVariable String employeeId) {
        String tenantId = getCurrentUserTenantId();
        List<Customer> list = customerRepository.findCustomersByEmployeeId(employeeId);
        if (tenantId != null && !tenantId.isEmpty()) {
            return list.stream().filter(c -> tenantId.equals(c.getTenantId())).toList();
        }
        return list;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateCustomer(
            @PathVariable Long id,
            @RequestParam("customerName") String customerName,
            @RequestParam(value = "msaDoc", required = false) MultipartFile msaDoc,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {

        try {
            Customer customer = customerRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            String tenantId = getCurrentUserTenantId();
            if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(customer.getTenantId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            // Update basic fields
            customer.setCustomerName(customerName);
            customer.setStartDate(LocalDate.parse(startDate));
            customer.setEndDate(LocalDate.parse(endDate));

            // If new file uploaded → overwrite old one
            if (msaDoc != null && !msaDoc.isEmpty()) {

                String contentType = msaDoc.getContentType();
                if (!List.of("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
                    return ResponseEntity.badRequest()
                            .body("Invalid file type. Only PDF, JPEG, and PNG are allowed.");
                }

                customer.setMsaDocName(msaDoc.getOriginalFilename());
                customer.setMsaDocBlob(msaDoc.getBytes());
            }
            // else → keep existing file (DO NOTHING)

            Customer updated = customerRepository.save(customer);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating customer");
        }
    }

}