package com.register.example.entity;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "role_access")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Example: "HR", "MANAGER", "FINANCE"
    @Column(name = "role_name", nullable = false, unique = true, length = 50)
private String roleName;

    // Example: "H100118,H100116,H100122"
    @Column(columnDefinition = "TEXT")
    private String employeeIds;
}
