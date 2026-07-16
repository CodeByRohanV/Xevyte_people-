package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "compensation_templates")
public class CompensationTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length=50)
    private String templateName;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] content;
@Column(name = "category", length = 50)
private String category; // e.g., HIKE_LETTER, PROMOTION_LETTER

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public byte[] getContent() {
        return content;
    }

    public void setContent(byte[] content) {
        this.content = content;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
