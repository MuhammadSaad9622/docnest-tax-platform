package com.docnest.controller;

import com.docnest.dto.TaxSlayerConfigDTO;
import com.docnest.entity.TaxSlayerConfig;
import com.docnest.repository.TaxSlayerConfigRepository;
import com.docnest.service.TaxSlayerService;
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
    private final TaxSlayerService taxSlayerService;

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
        if (dto.getApiKey() != null && !dto.getApiKey().startsWith("••••")) config.setApiKey(dto.getApiKey());
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
        String[] result = taxSlayerService.testConnection(config);
        String status = result[0];
        config.setConnectionStatus(status);
        config.setLastCheckedAt(LocalDateTime.now().format(FMT));
        configRepo.save(config);
        return ResponseEntity.ok(Map.of(
                "status", status,
                "message", result[1]
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
                .apiKey(maskKey(c.getApiKey()))
                .apiBaseUrl(c.getApiBaseUrl())
                .firmId(c.getFirmId())
                .taxYear(c.getTaxYear())
                .connectionStatus(c.getConnectionStatus())
                .lastCheckedAt(c.getLastCheckedAt())
                .build();
    }

    /** Never send the stored key back to the browser in full. */
    private static String maskKey(String key) {
        if (key == null || key.isBlank()) return key;
        return "••••" + (key.length() > 4 ? key.substring(key.length() - 4) : "");
    }
}
