package com.docnest.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyMemberDTO {

    private Long id;
    private Long clientId;

    @NotBlank(message = "Member name is required")
    @Size(max = 150, message = "Name must be under 150 characters")
    private String memberName;

    @NotBlank(message = "Relation is required")
    private String relation;

    private LocalDate dob;

    private String gender;

    @Pattern(regexp = "^$|^[2-9]\\d{2}[2-9]\\d{6}$", message = "Enter a valid 10-digit US phone number")
    private String mobile;

    @Email(message = "Enter a valid email address")
    private String email;

    private long documentCount;
}
