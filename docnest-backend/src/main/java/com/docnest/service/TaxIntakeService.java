package com.docnest.service;

import com.docnest.entity.TaxIntake;
import com.docnest.repository.TaxIntakeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TaxIntakeService {

    private final TaxIntakeRepository intakeRepository;
    private final ActivityService activityService;

    /** Returns are filed for the previous calendar year. */
    public static int currentTaxYear() {
        return LocalDate.now().getYear() - 1;
    }

    /** Returns the intake for the year, or an unsaved blank DRAFT. */
    public TaxIntake get(Long clientId, Integer taxYear) {
        int year = taxYear != null ? taxYear : currentTaxYear();
        return intakeRepository.findByClientIdAndTaxYear(clientId, year)
                .orElseGet(() -> TaxIntake.builder().clientId(clientId).taxYear(year).build());
    }

    @Transactional
    public TaxIntake save(Long clientId, TaxIntake input, boolean submit) {
        TaxIntake intake = get(clientId, input.getTaxYear());
        intake.setFilingStatus(input.getFilingStatus());
        intake.setOccupation(input.getOccupation());
        intake.setSpouseFirstName(input.getSpouseFirstName());
        intake.setSpouseLastName(input.getSpouseLastName());
        intake.setSpouseOccupation(input.getSpouseOccupation());
        intake.setDependentsCount(input.getDependentsCount());
        intake.setIncomeSources(input.getIncomeSources());
        intake.setHasHealthInsurance(input.getHasHealthInsurance());
        intake.setHasEducationExpenses(input.getHasEducationExpenses());
        intake.setHasChildcareExpenses(input.getHasChildcareExpenses());
        intake.setRefundMethod(input.getRefundMethod());
        intake.setNotes(input.getNotes());
        if (submit) {
            if (intake.getFilingStatus() == null || intake.getFilingStatus().isBlank()) {
                throw new IllegalArgumentException("Filing status is required before submitting");
            }
            intake.setStatus("SUBMITTED");
            intake.setSubmittedAt(LocalDateTime.now());
        }
        TaxIntake saved = intakeRepository.save(intake);
        if (submit) {
            activityService.log("INTAKE_SUBMITTED",
                    "Tax intake " + saved.getTaxYear() + " submitted for client #" + clientId,
                    "CLIENT", clientId);
        }
        return saved;
    }
}
