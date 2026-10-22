package com.docnest.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDTO {

    private Long id;

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must be under 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must be under 100 characters")
    private String lastName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid Indian mobile number (starts with 6-9, 10 digits)")
    private String mobile;

    @Past(message = "Date of birth cannot be a future date")
    private LocalDate dob;

    @Size(max = 10, message = "Gender must be under 10 characters")
    private String gender;

    private String address;

    @Email(message = "Enter a valid email address")
    private String email;

    @NotNull(message = "Location is required")
    private Long locationId;

    private String locationName;
    private LocalDateTime createdAt;

    // Computed / summary fields
    private long familyMemberCount;
    private long documentCount;
    private int totalDocTypes;
    private boolean hasMissingDocuments;
}
