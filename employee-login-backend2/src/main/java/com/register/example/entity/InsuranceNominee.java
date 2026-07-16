package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "insurance_nominee")
public class InsuranceNominee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "nominee_name", length = 100, nullable = false)
    private String nomineeName;

    @Column(name = "relationship", length = 50, nullable = false)
    private String relationship;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    public InsuranceNominee() {}

    public InsuranceNominee(Employee employee, String nomineeName, String relationship, LocalDate dateOfBirth) {
        this.employee = employee;
        this.nomineeName = nomineeName;
        this.relationship = relationship;
        this.dateOfBirth = dateOfBirth;
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; } 

    public String getNomineeName() { return nomineeName; }
    public void setNomineeName(String nomineeName) { this.nomineeName = nomineeName; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
}
