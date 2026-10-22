package com.docnest.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank
    private String fullName;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 6)
    private String password;

    private String confirmPassword;
    private String role;

    // ── Client self-service intake (used only when role = CLIENT) ──
    private String firstName;
    private String lastName;
    private String mobile;
    private LocalDate dob;
    private String gender;
    private String address;
    /** Matched against location_master.locationName; first admin-assigned office fallback */
    private String locationName;
}
