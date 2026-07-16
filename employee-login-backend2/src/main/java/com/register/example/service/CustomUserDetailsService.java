package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.Applicant;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ApplicantRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final EmployeeRepository employeeRepository;
    private final ApplicantRepository applicantRepository;

    public CustomUserDetailsService(EmployeeRepository employeeRepository, ApplicantRepository applicantRepository) {
        this.employeeRepository = employeeRepository;
        this.applicantRepository = applicantRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String id) throws UsernameNotFoundException {
        // 1. Check in Employees
        Optional<Employee> employee = employeeRepository.findByEmployeeId(id);
        if (employee.isPresent()) {
            Employee e = employee.get();
            return new org.springframework.security.core.userdetails.User(
                    e.getEmployeeId(),
                    e.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + e.getRole()))
            );
        }

        // 2. Check in Applicants
        Optional<Applicant> applicant = applicantRepository.findByApplicantId(id);
        if (applicant.isPresent()) {
            Applicant a = applicant.get();
            // Applicants don't have a password, we use a dummy value because the JWT filter bypasses password checks
            return new org.springframework.security.core.userdetails.User(
                    a.getApplicantId(),
                    "",
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_APPLICANT"))
            );
        }

        throw new UsernameNotFoundException("User '" + id + "' not found");
    }
}
