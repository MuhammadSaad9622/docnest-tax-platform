package com.docnest.controller;

import com.docnest.dto.ClientDTO;
import com.docnest.entity.User;
import com.docnest.repository.UserRepository;
import com.docnest.service.ClientService;
import com.docnest.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor

public class ClientController {

    private final ClientService clientService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<ClientDTO> addClient(@Valid @RequestBody ClientDTO dto, Authentication auth) {
        ClientDTO result = clientService.addClient(dto);
        // For non-ADMIN users, force the client to their office location
        if (auth != null && !isAdmin(auth)) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null && user.getAssignedOffice() != null) {
                result.setLocationId(user.getAssignedOffice());
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<Page<ClientDTO>> getClients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long locationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        // ADMIN: no restriction. MANAGER: sees supervised offices + own. EMPLOYEE: own office only.
        List<Long> officeIds = resolveVisibleOffices(auth);
        return ResponseEntity.ok(clientService.searchClientsForUser(query, locationId, officeIds, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<ClientDTO> getClient(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable Long id, @Valid @RequestBody ClientDTO dto) {
        return ResponseEntity.ok(clientService.updateClient(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * Resolves which offices the current user can see.
     *  - ADMIN → empty list = no restriction
     *  - MANAGER → own office (if assigned) + all supervised offices
     *  - EMPLOYEE → own assigned office only
     *  - If no offices resolve, return null = unrestricted (graceful fallback)
     */
    private List<Long> resolveVisibleOffices(Authentication auth) {
        if (auth == null || isAdmin(auth)) return new ArrayList<>();
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) return null;

        if (user.getRole() == User.Role.MANAGER) {
            List<Long> offices = new ArrayList<>();
            if (user.getAssignedOffice() != null) offices.add(user.getAssignedOffice());
            if (user.getSupervisedOffices() != null) {
                user.getSupervisedOffices().forEach(loc -> offices.add(loc.getId()));
            }
            return offices.isEmpty() ? null : offices;
        }

        if (user.getRole() == User.Role.EMPLOYEE) {
            return user.getAssignedOffice() != null
                    ? List.of(user.getAssignedOffice())
                    : null;
        }

        return null;
    }
}
