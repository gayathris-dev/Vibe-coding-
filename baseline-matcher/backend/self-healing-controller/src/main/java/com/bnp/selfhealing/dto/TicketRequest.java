package com.bnp.selfhealing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class TicketRequest {

    @NotBlank
    private String department;

    @NotBlank
    private String description;

    @NotBlank
    @JsonProperty("requestor_id")
    private String requestorId;

    public TicketRequest() {
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequestorId() {
        return requestorId;
    }

    public void setRequestorId(String requestorId) {
        this.requestorId = requestorId;
    }
}
