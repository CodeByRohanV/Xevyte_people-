package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "it_declarations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ITDeclaration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", referencedColumnName = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "financial_year", nullable = false, length = 10)
    private String financialYear;

    @Column(name = "status", length = 20)
    private String status = "Draft"; // Draft, Submitted, Approved, Rejected

    @OneToMany(mappedBy = "declaration", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ITDeclarationValue> dynamicValues = new ArrayList<>();

    private LocalDateTime submissionDate;
    // private LocalDateTime consideredOn;

    @Column(name = "tax_regime", length = 20)
    private String taxRegime; // OLD_REGIME, NEW_REGIME

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public String getFinancialYear() { return financialYear; }
    public void setFinancialYear(String financialYear) { this.financialYear = financialYear; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<ITDeclarationValue> getDynamicValues() { return dynamicValues; }
    public void setDynamicValues(List<ITDeclarationValue> dynamicValues) { 
        this.dynamicValues = dynamicValues; 
    }

    public LocalDateTime getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(LocalDateTime submissionDate) { this.submissionDate = submissionDate; }

    /*
    public LocalDateTime getConsideredOn() { return consideredOn; }
    public void setConsideredOn(LocalDateTime consideredOn) { this.consideredOn = consideredOn; }
    */

    public String getTaxRegime() { return taxRegime; }
    public void setTaxRegime(String taxRegime) { this.taxRegime = taxRegime; }
}
