package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "module_access")
public class ModuleAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String moduleKey;

    @Column(length = 4000, nullable = false)
    private String employeeIds; // comma separated OR "ALL"

    public Long getId() {
        return id;
    }

    public String getModuleKey() {
        return moduleKey;
    }

    public void setModuleKey(String moduleKey) {
        this.moduleKey = moduleKey;
    }

    public String getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(String employeeIds) {
        this.employeeIds = employeeIds;
    }
}
