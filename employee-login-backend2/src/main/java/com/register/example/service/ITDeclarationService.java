package com.register.example.service;

import com.register.example.entity.ITDeclaration;
import com.register.example.entity.Employee;
import com.register.example.entity.ITDeclarationValue;
import com.register.example.repository.ITDeclarationRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ITDeclarationService {

    @Autowired
    private ITDeclarationRepository itDeclarationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private com.register.example.repository.ITDeclarationConfigRepository configRepository;

    public ITDeclaration saveOrUpdateITDeclaration(String employeeId, ITDeclaration declaration) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        if (declaration.getFinancialYear() == null || declaration.getFinancialYear().trim().isEmpty()) {
            throw new RuntimeException("Financial Year is required and cannot be null");
        }

        // Validate financial year - Use current date and config to check if submission is allowed
        java.time.LocalDate today = java.time.LocalDate.now();
        Optional<com.register.example.entity.ITDeclarationConfig> configOpt = configRepository.findByFinancialYear(declaration.getFinancialYear());
        
        if (configOpt.isPresent()) {
            com.register.example.entity.ITDeclarationConfig config = configOpt.get();
            if (config.getFromDate() != null && today.isBefore(config.getFromDate())) {
                throw new RuntimeException("IT Declaration submission window has not started yet for " + declaration.getFinancialYear());
            }
            if (config.getToDate() != null && today.isAfter(config.getToDate())) {
                throw new RuntimeException("IT Declaration submission window has expired for " + declaration.getFinancialYear());
            }
        }
        // If no config exists, we allow it (management might be setting it up) or we can restrict it.
        // Given the requirement for multi-year management, we'll allow it if config is missing or let the admin configure it.

        // Validate regime only on submission
        if ("Submitted".equalsIgnoreCase(declaration.getStatus())) {
            if (declaration.getTaxRegime() == null || declaration.getTaxRegime().isEmpty()) {
                throw new RuntimeException("Please select a tax regime before submitting the declaration");
            }
        }

        Optional<ITDeclaration> existing = itDeclarationRepository.findByEmployeeAndFinancialYear(
                employee, declaration.getFinancialYear());

        if (existing.isPresent()) {
            ITDeclaration dbDoc = existing.get();
            // Update fields
            updateFields(dbDoc, declaration);
            return itDeclarationRepository.save(dbDoc);
        } else {
            declaration.setEmployee(employee);
            if (declaration.getStatus() == null) {
                declaration.setStatus("Draft");
            }
            if ("Submitted".equalsIgnoreCase(declaration.getStatus())) {
                declaration.setSubmissionDate(LocalDateTime.now());
            } else {
                declaration.setSubmissionDate(null); // Clear if not submitted
            }
            // Link dynamic values to parent
            if (declaration.getDynamicValues() != null) {
                for (ITDeclarationValue value : declaration.getDynamicValues()) {
                    value.setDeclaration(declaration);
                }
            }
            return itDeclarationRepository.save(declaration);
        }
    }

    private void updateFields(ITDeclaration dbDoc, ITDeclaration newDoc) {
        // Update dynamic values
        if (newDoc.getDynamicValues() != null) {
            dbDoc.getDynamicValues().clear();
            for (ITDeclarationValue value : newDoc.getDynamicValues()) {
                value.setDeclaration(dbDoc);
                dbDoc.getDynamicValues().add(value);
            }
        }

        if ("Submitted".equalsIgnoreCase(newDoc.getStatus())) {
            if (!"Submitted".equalsIgnoreCase(dbDoc.getStatus())) {
                dbDoc.setSubmissionDate(LocalDateTime.now());
            }
        } else {
            dbDoc.setSubmissionDate(null); // Explicitly clear date if status is not Submitted
        }
        dbDoc.setStatus(newDoc.getStatus() != null ? newDoc.getStatus() : "Draft");
        dbDoc.setTaxRegime(newDoc.getTaxRegime()); // Always update regime
    }

    public List<ITDeclaration> getDeclarationsByEmployee(String employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
        return itDeclarationRepository.findByEmployee(employee);
    }

    public ITDeclaration getDeclarationByEmployeeAndYear(String employeeId, String financialYear, String requesterId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        ensureAutoSubmission(employee, financialYear);

        Optional<ITDeclaration> declOpt = itDeclarationRepository.findByEmployeeAndFinancialYear(employee, financialYear);
        if (declOpt.isEmpty()) return null;

        ITDeclaration itDecl = declOpt.get();
        String currentStatus = itDecl.getStatus();

        // PRIVACY RULE: Drafts are private to the employee
        if ("Draft".equalsIgnoreCase(currentStatus) && !employeeId.equalsIgnoreCase(requesterId)) {
            return null; // Return null if someone else (like finance) tries to see a draft
        }

        return itDecl;
    }

    private void ensureAutoSubmission(Employee employee, String financialYear) {
        Optional<com.register.example.entity.ITDeclarationConfig> configOpt = configRepository.findByFinancialYear(financialYear);
        if (configOpt.isPresent()) {
            java.time.LocalDate deadline = configOpt.get().getToDate();
            if (deadline != null && java.time.LocalDate.now().isAfter(deadline)) {
                Optional<ITDeclaration> existing = itDeclarationRepository.findByEmployeeAndFinancialYear(employee, financialYear);
                if (existing.isEmpty() || "Draft".equalsIgnoreCase(existing.get().getStatus())) {
                    ITDeclaration decl = existing.orElse(new ITDeclaration());
                    if (decl.getId() == null) {
                        decl.setEmployee(employee);
                        decl.setFinancialYear(financialYear);
                    }
                    decl.setStatus("Submitted");
                    decl.setTaxRegime("NEW_REGIME");
                    decl.setSubmissionDate(LocalDateTime.now());
                    itDeclarationRepository.save(decl);
                }
            }
        }
    }

    /**
     * SECURE FINANCE VIEW: Fetches a declaration for finance review.
     * Guaranteed to return null if the status is "Draft".
     */
    public ITDeclaration getDeclarationForFinance(String employeeId, String financialYear) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
        
        Optional<ITDeclaration> declOpt = itDeclarationRepository.findByEmployeeAndFinancialYear(employee, financialYear);
        if (declOpt.isEmpty()) return null;
        
        ITDeclaration itDecl = declOpt.get();
        if ("Draft".equalsIgnoreCase(itDecl.getStatus())) {
            System.err.println("[FINANCE SECURE VIEW] Denied access to draft for employee: " + employeeId);
            return null;
        }
        return itDecl;
    }

    public List<ITDeclaration> getAllDeclarations() {
        return itDeclarationRepository.findAll();
    }

    public List<ITDeclaration> getDeclarationsByStatus(String status) {
        return itDeclarationRepository.findByStatus(status);
    }

    public List<ITDeclaration> getDeclarationsByFinanceId(String financeId) {
        List<Employee> assignedEmployees = employeeRepository.findByAssignedFinanceId(financeId);

        // Determine Current FY
        java.time.LocalDate now = java.time.LocalDate.now();
        int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        String currentFY = year + "-" + String.format("%02d", (year + 1) % 100);

        // STEP 1: Process auto-submissions on the fly for all assigned employees
        for (Employee emp : assignedEmployees) {
            ensureAutoSubmission(emp, currentFY);
        }

        // STEP 2: Fetch ALL declarations for assigned employees
        List<ITDeclaration> declarations = new java.util.ArrayList<>(itDeclarationRepository.findByEmployeeIn(assignedEmployees));

        // STEP 3: Ensure EVERY assigned employee appears in the list, even if they haven't started.
        // After ensureAutoSubmission, most should have a "Submitted" entry if after deadline.
        for (Employee emp : assignedEmployees) {
            boolean hasEntry = declarations.stream().anyMatch(d -> 
                d.getEmployee().getEmployeeId().equals(emp.getEmployeeId()) && 
                currentFY.equals(d.getFinancialYear())
            );
            
            if (!hasEntry) {
                ITDeclaration virtual = new ITDeclaration();
                virtual.setEmployee(emp);
                virtual.setStatus("Not Started");
                virtual.setFinancialYear(currentFY);
                declarations.add(virtual);
            }
        }
        
        return declarations;
    }

    public boolean isFinancePerson(String employeeId) {
        return !employeeRepository.findByAssignedFinanceId(employeeId).isEmpty();
    }

    public ITDeclaration updateStatus(Long id, String status) {
        ITDeclaration declaration = itDeclarationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Declaration not found with ID: " + id));
        declaration.setStatus(status);
        return itDeclarationRepository.save(declaration);
    }
}
