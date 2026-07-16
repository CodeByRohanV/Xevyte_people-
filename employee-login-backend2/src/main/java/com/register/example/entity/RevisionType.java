package com.register.example.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "revision_types")
@Data
@EqualsAndHashCode(callSuper = true)
public class RevisionType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type_name", unique = true, nullable = false, length = 50)
private String typeName;
}
