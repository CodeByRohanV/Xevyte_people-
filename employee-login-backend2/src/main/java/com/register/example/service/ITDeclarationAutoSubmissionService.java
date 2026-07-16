package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.ITDeclaration;
import com.register.example.entity.ITDeclarationConfig;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ITDeclarationConfigRepository;
import com.register.example.repository.ITDeclarationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ITDeclarationAutoSubmissionService {

    @Autowired
    private ITDeclarationRepository itDeclarationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ITDeclarationConfigRepository configRepository;

    /**
     * Runs every day at midnight to check if the submission deadline has passed.
     * If the deadline has passed, any non-submitted declarations will be
     * automatically submitted under the "NEW_REGIME".
     */
    @Scheduled(cron = "0 0 0 * * ?") // Every day at 12:00 AM
    @Transactional
    public void runAutoSubmission() {
        System.out.println("🔄 [IT DECLARATION AUTO-SUBMISSION] Checking if deadline has passed...");

        // Calculate current financial year
        LocalDate now = LocalDate.now();
        int startYear = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        String currentFY = startYear + "-" + String.format("%02d", (startYear + 1) % 100);

        Optional<ITDeclarationConfig> configOpt = configRepository.findByFinancialYear(currentFY);
        if (configOpt.isEmpty()) {
            System.out.println("⚠️ [IT DECLARATION AUTO-SUBMISSION] No configuration found for " + currentFY + ". Skipping.");
            return;
        }

        ITDeclarationConfig config = configOpt.get();
        LocalDate deadline = config.getToDate();

        if (deadline == null || LocalDate.now().isBefore(deadline) || LocalDate.now().isEqual(deadline)) {
            System.out.println("⏳ [IT DECLARATION AUTO-SUBMISSION] Deadline (" + deadline + ") not yet passed for " + currentFY + ". Current: " + LocalDate.now());
            return;
        }

        System.out.println("🚨 [IT DECLARATION AUTO-SUBMISSION] Deadline has passed (" + deadline + "). Processing auto-submissions for " + currentFY + "...");

        List<Employee> allEmployees = employeeRepository.findByActive("yes");
        int totalProcessed = 0;
        int totalAutoSubmitted = 0;

        for (Employee employee : allEmployees) {
            Optional<ITDeclaration> declarationOpt = itDeclarationRepository.findByEmployeeAndFinancialYear(employee, currentFY);

            if (declarationOpt.isPresent()) {
                ITDeclaration declaration = declarationOpt.get();
                if ("Draft".equalsIgnoreCase(declaration.getStatus())) {
                    autoSubmit(declaration);
                    totalAutoSubmitted++;
                }
            } else {
                ITDeclaration newDeclaration = new ITDeclaration();
                newDeclaration.setEmployee(employee);
                newDeclaration.setFinancialYear(currentFY);
                autoSubmit(newDeclaration);
                totalAutoSubmitted++;
            }
            totalProcessed++;
        }

        System.out.println("✅ [IT DECLARATION AUTO-SUBMISSION] Completed for " + currentFY + ". Total Employees: " + totalProcessed + ", Auto-Submitted: " + totalAutoSubmitted);
    }

    private void autoSubmit(ITDeclaration declaration) {
        declaration.setStatus("Submitted");
        declaration.setTaxRegime("NEW_REGIME");
        declaration.setSubmissionDate(LocalDateTime.now());
        itDeclarationRepository.save(declaration);
        System.out.println("✓ Auto-submitted IT Declaration for " + declaration.getEmployee().getEmployeeId() + " (NEW_REGIME)");
    }
}
