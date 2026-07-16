package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "clearance_checklist")
public class ClearanceChecklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String department;   // HR / ADMIN / IT

    @Column(nullable = false)
    private String keyName;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private boolean required;

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getKeyName() { return keyName; }
    public void setKeyName(String keyName) { this.keyName = keyName; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
}
