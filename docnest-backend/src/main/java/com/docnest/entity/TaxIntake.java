package com.docnest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * The taxpayer's remote intake questionnaire — one per client per tax year.
 * Filled in from the client portal so nobody has to visit the office.
 */
@Entity
@Table(name = "tax_intake", uniqueConstraints = @UniqueConstraint(columnNames = {"client_id", "tax_year"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxIntake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "tax_year", nullable = false)
    private Integer taxYear;

    /** SINGLE, MARRIED_JOINT, MARRIED_SEPARATE, HEAD_OF_HOUSEHOLD, QUALIFYING_SURVIVOR */
    @Column(name = "filing_status", length = 30)
    private String filingStatus;

    @Column(name = "occupation", length = 100)
    private String occupation;

    @Column(name = "spouse_first_name", length = 100)
    private String spouseFirstName;

    @Column(name = "spouse_last_name", length = 100)
    private String spouseLastName;

    @Column(name = "spouse_occupation", length = 100)
    private String spouseOccupation;

    @Column(name = "dependents_count")
    private Integer dependentsCount;

    /** Comma-separated: W2, 1099_NEC, 1099_MISC, SELF_EMPLOYMENT, RENTAL, UNEMPLOYMENT, SOCIAL_SECURITY, INVESTMENTS */
    @Column(name = "income_sources", length = 255)
    private String incomeSources;

    @Column(name = "has_health_insurance")
    private Boolean hasHealthInsurance;

    @Column(name = "has_education_expenses")
    private Boolean hasEducationExpenses;

    @Column(name = "has_childcare_expenses")
    private Boolean hasChildcareExpenses;

    /** DIRECT_DEPOSIT, CHECK, REFUND_TRANSFER */
    @Column(name = "refund_method", length = 30)
    private String refundMethod;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /** DRAFT while the client edits, SUBMITTED when handed to the preparer. */
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "DRAFT";

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
