package com.example.baseline_matcher.dto;

public class TicketRequest {
    private String description;
    private String department;

    public TicketRequest() {}

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
