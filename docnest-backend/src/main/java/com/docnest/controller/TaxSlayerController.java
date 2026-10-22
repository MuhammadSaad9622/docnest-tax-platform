package com.docnest.controller;

import com.docnest.entity.Client;
import com.docnest.repository.ClientRepository;
import com.docnest.security.AccessGuard;
import com.docnest.service.TaxSlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * TaxSlayer Pro hand-off: preview a return package, export CSV for import,
 * or push directly to the configured TaxSlayer Pro endpoint.
 */
@RestController
@RequestMapping("/api/taxslayer")
@RequiredArgsConstructor
public class TaxSlayerController {

    private final TaxSlayerService taxSlayerService;
    private final ClientRepository clientRepository;
    private final AccessGuard accessGuard;

    @GetMapping("/returns/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<Map<String, Object>> preview(@PathVariable Long clientId, Authentication auth) {
        accessGuard.checkClient(auth, clientId);
        return ResponseEntity.ok(taxSlayerService.buildReturn(clientId));
    }

    /** CSV for TaxSlayer Pro import. No clientIds = every client the caller can see. */
    @GetMapping(value = "/export.csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<String> exportCsv(@RequestParam(required = false) List<Long> clientIds, Authentication auth) {
        List<Long> ids;
        if (clientIds != null && !clientIds.isEmpty()) {
            clientIds.forEach(id -> accessGuard.checkClient(auth, id));
            ids = clientIds;
        } else {
            List<Long> offices = accessGuard.resolveVisibleOffices(auth);
            ids = clientRepository.findAll().stream()
                    .filter(c -> offices == null || offices.isEmpty()
                            || (c.getLocation() != null && offices.contains(c.getLocation().getId())))
                    .map(Client::getId)
                    .toList();
        }
        String file = "taxslayer-import-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file + "\"")
                .body(taxSlayerService.exportCsv(ids));
    }

    @PostMapping("/push/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, Object>> push(@PathVariable Long clientId, Authentication auth) {
        accessGuard.checkClient(auth, clientId);
        return ResponseEntity.ok(taxSlayerService.push(clientId));
    }
}
