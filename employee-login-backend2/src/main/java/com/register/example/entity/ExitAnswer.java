package com.register.example.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exit_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExitAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long formId;  // Links to ExitForm

    @Column(nullable = false)
    private Long questionId;  // Links to ExitQuestion

    @Column(nullable = false, length=50)
    private String employeeId;

    @Column(columnDefinition = "TEXT")
    private String answer; // text or rating stored as string
}
