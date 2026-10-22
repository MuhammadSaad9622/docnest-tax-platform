package com.docnest.controller;

import com.docnest.entity.Location;
import com.docnest.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationRepository locationRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<List<Location>> getAll() {
        return ResponseEntity.ok(locationRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Location> add(@RequestBody Location location) {
        if (locationRepository.existsByLocationNameIgnoreCase(location.getLocationName())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(locationRepository.save(location));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Location> update(@PathVariable Long id, @RequestBody Location location) {
        Location existing = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found: " + id));
        existing.setLocationName(location.getLocationName());
        return ResponseEntity.ok(locationRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        locationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
