package com.docnest.controller;

import com.docnest.dto.DashboardStatsDTO;
import com.docnest.entity.User;
import com.docnest.repository.UserRepository;
import com.docnest.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor

public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<DashboardStatsDTO> getStats(Authentication auth) {
        List<Long> officeIds = resolveVisibleOffices(auth);
        return ResponseEntity.ok(dashboardService.getStats(officeIds));
    }

    private List<Long> resolveVisibleOffices(Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return null; // ADMIN: unrestricted
        }
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) return null;
        if (user.getRole() == User.Role.MANAGER) {
            List<Long> offices = new ArrayList<>();
            if (user.getAssignedOffice() != null) offices.add(user.getAssignedOffice());
            if (user.getSupervisedOffices() != null) user.getSupervisedOffices().forEach(loc -> offices.add(loc.getId()));
            return offices.isEmpty() ? null : offices;
        }
        if (user.getRole() == User.Role.EMPLOYEE) {
            return user.getAssignedOffice() != null ? List.of(user.getAssignedOffice()) : null;
        }
        return null;
    }
}
