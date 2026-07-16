package com.register.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "asset_audit_logs")
@Getter
@Setter
public class AssetAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", nullable = false, length = 50)
private String actionType;

@Column(name = "asset_tag", length = 50)
private String assetTag;


    private Long assetId;


@Column(name = "user_id", nullable = false, length = 50)
private String userId; // CREATE, UPDATE, ALLOCATE, RETURN, STATUS_CHANGE, SYNC

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String oldValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    private String ipAddress;


}
