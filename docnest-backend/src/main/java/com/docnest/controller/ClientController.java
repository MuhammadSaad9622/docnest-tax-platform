package com.docnest.controller;

import com.docnest.dto.ClientDTO;
import com.docnest.entity.TaxIntake;
import com.docnest.entity.User;
import com.docnest.repository.UserRepository;
import com.docnest.service.ClientService;
import com.docnest.service.TaxIntakeService;
import com.docnest.security.AccessGuard;
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
    private final AccessGuard accessGuard;
    private final TaxIntakeService taxIntakeService;

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
    public ResponseEntity<ClientDTO> getClient(@PathVariable Long id, Authentication auth) {
        accessGuard.checkClient(auth, id);
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable Long id, @Valid @RequestBody ClientDTO dto, Authentication auth) {
        accessGuard.checkClient(auth, id);
        return ResponseEntity.ok(clientService.updateClient(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id, Authentication auth) {
        accessGuard.checkClient(auth, id);
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    /** Staff view of the client's portal intake questionnaire. */
    @GetMapping("/{id}/intake")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<TaxIntake> getIntake(@PathVariable Long id,
                                               @RequestParam(required = false) Integer taxYear,
                                               Authentication auth) {
        accessGuard.checkClient(auth, id);
        return ResponseEntity.ok(taxIntakeService.get(id, taxYear));
    }

    private boolean isAdmin(Authentication auth) {
        return accessGuard.isAdmin(auth);
    }

    private List<Long> resolveVisibleOffices(Authentication auth) {
        return accessGuard.resolveVisibleOffices(auth);
    }
}
