package com.register.example.config;

import com.register.example.entity.DepartmentMetricsSummary;
import com.register.example.entity.Employee;
import com.register.example.entity.LeaveRequest;
import com.register.example.repository.DepartmentMetricsSummaryRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.LeaveRequestRepository;
import com.register.example.scheduler.AnalyticsAggregationScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
@Slf4j
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final DepartmentMetricsSummaryRepository summaryRepository;
    private final AnalyticsAggregationScheduler analyticsAggregationScheduler;

    @Override
    public void run(String... args) {
        log.info("Checking if database seeding is required...");

        // Check if database is already populated for employees and leaves
        if (employeeRepository.count() == 0) {
            log.info("Seeding employees and leaves...");
            seedEmployees();
            seedLeaveRequests();
        } else {
            log.info("Employees already populated. Skipping employee seeder.");
        }

        log.info("Clearing dummy analytics data and generating live enterprise metrics...");
        summaryRepository.deleteAll();
        analyticsAggregationScheduler.aggregateMetrics();

        log.info("Database seeding completed successfully!");
    }

    private void seedEmployees() {
        String[] departments = { "Engineering", "HR", "Sales" };
        String[] roles = { "Employee", "Manager", "HR", "Admin" };

        for (int i = 1; i <= 15; i++) {
            Employee emp = new Employee();
            emp.setEmployeeId("EMP" + (1000 + i));
            emp.setFirstName("MockUser" + i);
            emp.setLastName("Test");
            emp.setEmail("mockuser" + i + "@example.com");
            emp.setPassword("password123");
            emp.setDepartment(departments[i % departments.length]);

            // Assign roles
            if (i == 1)
                emp.setRole("Admin");
            else if (i == 2)
                emp.setRole("HR");
            else if (i % 5 == 0)
                emp.setRole("Manager");
            else
                emp.setRole("Employee");

            emp.setActive("yes");
            emp.setJoiningDate(LocalDate.now().minusYears(1).plusDays(i));

            employeeRepository.save(emp);
        }
    }

    private void seedLeaveRequests() {
        List<Employee> employees = employeeRepository.findAll();
        if (employees.isEmpty())
            return;

        Random random = new Random();
        String[] leaveTypes = { "Sick", "Casual", "Earned" };
        String[] statuses = { "APPROVED", "Pending", "Rejected" };

        // Create 20 mock leave requests
        for (int i = 0; i < 20; i++) {
            Employee emp = employees.get(random.nextInt(employees.size()));
            LeaveRequest lr = new LeaveRequest();
            lr.setEmployeeId(emp.getEmployeeId());
            lr.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
            lr.setType(leaveTypes[random.nextInt(leaveTypes.length)]);

            // Make 3 leaves active 'today'
            if (i < 3) {
                lr.setStartDate(LocalDate.now().minusDays(1));
                lr.setEndDate(LocalDate.now().plusDays(2));
                lr.setStatus("APPROVED");
            } else {
                lr.setStartDate(LocalDate.now().minusDays(random.nextInt(30) + 5));
                lr.setEndDate(lr.getStartDate().plusDays(random.nextInt(3) + 1));
                lr.setStatus(statuses[random.nextInt(statuses.length)]);
            }

            lr.setTotalDays((double) (lr.getEndDate().toEpochDay() - lr.getStartDate().toEpochDay() + 1));
            lr.setReason("Mock reason " + i);

            leaveRequestRepository.save(lr);
        }
    }
}
