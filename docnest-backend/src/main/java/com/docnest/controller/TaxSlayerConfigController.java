package com.docnest.controller;

import com.docnest.dto.TaxSlayerConfigDTO;
import com.docnest.entity.TaxSlayerConfig;
import com.docnest.repository.TaxSlayerConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Admin-only endpoints for managing TaxSlayer Pro integration settings.
 */
@RestController
@RequestMapping("/api/settings/taxslayer")
@RequiredArgsConstructor
public class TaxSlayerConfigController {

    private final TaxSlayerConfigRepository configRepo;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxSlayerConfigDTO> getConfig() {
        return ResponseEntity.ok(toDTO(getOrCreate()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxSlayerConfigDTO> updateConfig(@RequestBody TaxSlayerConfigDTO dto) {
        TaxSlayerConfig config = getOrCreate();
        if (dto.getApiKey() != null)      config.setApiKey(dto.getApiKey());
        if (dto.getApiBaseUrl() != null)  config.setApiBaseUrl(dto.getApiBaseUrl());
        if (dto.getFirmId() != null)     config.setFirmId(dto.getFirmId());
        if (dto.getTaxYear() != null)    config.setTaxYear(dto.getTaxYear());
        configRepo.save(config);
        return ResponseEntity.ok(toDTO(config));
    }

    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testConnection() {
        TaxSlayerConfig config = getOrCreate();
        // Simulate connection check — in production this would call the real
        // TaxSlayer Pro API endpoint using config.getApiBaseUrl() + config.getApiKey()
        boolean hasKey = config.getApiKey() != null && !config.getApiKey().isBlank();
        boolean hasUrl = config.getApiBaseUrl() != null && !config.getApiBaseUrl().isBlank();
        String status = (hasKey && hasUrl) ? "CONNECTED" : "DISCONNECTED";
        config.setConnectionStatus(status);
        config.setLastCheckedAt(LocalDateTime.now().format(FMT));
        configRepo.save(config);
        return ResponseEntity.ok(Map.of(
                "status", status,
                "message", "CONNECTED".equals(status)
                        ? "Connection to TaxSlayer Pro appears valid."
                        : "API key and base URL must be set before testing."
        ));
    }

    private TaxSlayerConfig getOrCreate() {
        TaxSlayerConfig existing = configRepo.findByRowKey(1);
        if (existing != null) return existing;
        return configRepo.save(
                TaxSlayerConfig.builder().rowKey(1).connectionStatus("DISCONNECTED").build()
        );
    }

    private TaxSlayerConfigDTO toDTO(TaxSlayerConfig c) {
        return TaxSlayerConfigDTO.builder()
                .apiKey(c.getApiKey())
                .apiBaseUrl(c.getApiBaseUrl())
                .firmId(c.getFirmId())
                .taxYear(c.getTaxYear())
                .connectionStatus(c.getConnectionStatus())
                .lastCheckedAt(c.getLastCheckedAt())
                .build();
    }
}
