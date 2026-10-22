package com.docnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private Boolean enabled;
    private Long assignedOffice;
    private Long linkedClient;
    /** Office IDs this user supervises (MANAGER). null/empty = no supervision set. */
    private List<Long> supervisedOffices;
}
