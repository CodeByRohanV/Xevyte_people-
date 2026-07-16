package com.register.example.payload;

public class CategoryDTO {

    private Long id;
    private String categoryName;
    private String ticketType;
    private String teamName;

    public CategoryDTO() {}

    public CategoryDTO(Long id, String categoryName, String ticketType, String teamName) {
        this.id = id;
        this.categoryName = categoryName;
        this.ticketType = ticketType;
        this.teamName = teamName;
    }

    // ------- GETTERS -------
    public Long getId() {
        return id;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getTicketType() {
        return ticketType;
    }

    public String getTeamName() {
        return teamName;
    }

    // ------- SETTERS -------
    public void setId(Long id) {
        this.id = id;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public void setTicketType(String ticketType) {
        this.ticketType = ticketType;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }
}
