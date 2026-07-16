package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "it_declaration_values")
public class ITDeclarationValue extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declaration_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ITDeclaration declaration;

    @Column(nullable = false)
    private String fieldId;

    @Column(columnDefinition = "TEXT")
    private String fieldValue;

    @Column(name = "entry_index")
    private Integer entryIndex = 0;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ITDeclaration getDeclaration() { return declaration; }
    public void setDeclaration(ITDeclaration declaration) { this.declaration = declaration; }

    public String getFieldId() { return fieldId; }
    public void setFieldId(String fieldId) { this.fieldId = fieldId; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }

    public Integer getEntryIndex() { return entryIndex; }
    public void setEntryIndex(Integer entryIndex) { this.entryIndex = entryIndex; }
}
