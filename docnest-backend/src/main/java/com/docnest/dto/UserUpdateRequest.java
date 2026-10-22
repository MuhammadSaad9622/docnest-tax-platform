package com.docnest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UserUpdateRequest {
    @NotNull
    private String role;
    private Boolean enabled;
    private Long assignedOffice;
    private Long linkedClient;
    /** Office IDs a MANAGER supervises. Replaces the existing set. */
    private List<Long> supervisedOffices;
}
