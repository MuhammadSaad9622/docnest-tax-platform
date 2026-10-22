package com.docnest.controller;

import com.docnest.entity.*;
import com.docnest.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final FormFieldConfigRepository formFieldRepo;
    private final DocumentTypeConfigRepository docTypeRepo;
    private final AdminProfileRepository profileRepo;
    private final SystemPreferenceRepository prefRepo;

    // ── Form Fields ──────────────────────────────────────

    @GetMapping("/form-fields")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FormFieldConfig>> getFormFields() {
        return ResponseEntity.ok(formFieldRepo.findAllByOrderByDisplayOrderAsc());
    }

    @PutMapping("/form-fields")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FormFieldConfig>> updateFormFields(@RequestBody List<FormFieldConfig> fields) {
        List<FormFieldConfig> saved = fields.stream().map(f -> {
            FormFieldConfig existing = formFieldRepo.findById(f.getId())
                    .orElseThrow(() -> new RuntimeException("Field not found: " + f.getId()));
            existing.setIsVisible(f.getIsVisible());
            existing.setIsRequired(f.getIsRequired());
            existing.setDisplayOrder(f.getDisplayOrder());
            return formFieldRepo.save(existing);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(saved);
    }

    // ── Document Types ───────────────────────────────────

    @GetMapping("/document-types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DocumentTypeConfig>> getDocTypes() {
        return ResponseEntity.ok(docTypeRepo.findAllByOrderByIdAsc());
    }

    @GetMapping("/document-types/active")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<List<DocumentTypeConfig>> getActiveDocTypes() {
        return ResponseEntity.ok(docTypeRepo.findByIsActiveTrue());
    }

    @PostMapping("/document-types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DocumentTypeConfig> addDocType(@RequestBody DocumentTypeConfig dt) {
        if (docTypeRepo.existsByTypeName(dt.getTypeName())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(docTypeRepo.save(dt));
    }

    @PutMapping("/document-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DocumentTypeConfig> updateDocType(@PathVariable Long id, @RequestBody DocumentTypeConfig dt) {
        DocumentTypeConfig existing = docTypeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Doc type not found: " + id));
        existing.setDisplayName(dt.getDisplayName());
        existing.setDescription(dt.getDescription());
        existing.setIsRequired(dt.getIsRequired());
        existing.setIsActive(dt.getIsActive());
        existing.setAllowedExtensions(dt.getAllowedExtensions());
        existing.setMaxSizeMb(dt.getMaxSizeMb());
        return ResponseEntity.ok(docTypeRepo.save(existing));
    }

    @DeleteMapping("/document-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDocType(@PathVariable Long id) {
        docTypeRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Admin Profile ────────────────────────────────────

    @GetMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminProfile> getProfile() {
        AdminProfile profile = profileRepo.findById(1L)
                .orElse(AdminProfile.builder().id(1L).fullName("Admin").email("admin@docnest.com").build());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminProfile> updateProfile(@RequestBody AdminProfile profile) {
        AdminProfile existing = profileRepo.findById(1L)
                .orElse(AdminProfile.builder().id(1L).build());
        existing.setFullName(profile.getFullName());
        existing.setEmail(profile.getEmail());
        existing.setMobile(profile.getMobile());
        return ResponseEntity.ok(profileRepo.save(existing));
    }

    @PostMapping("/profile/avatar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        Path dir = Paths.get("uploads", "admin");
        Files.createDirectories(dir);
        String filename = "avatar_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path target = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        AdminProfile profile = profileRepo.findById(1L)
                .orElse(AdminProfile.builder().id(1L).build());
        profile.setProfileImage("/api/settings/profile/avatar/view");
        profileRepo.save(profile);

        return ResponseEntity.ok(Map.of("url", profile.getProfileImage(), "filename", filename));
    }

    @GetMapping("/profile/avatar/view")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<byte[]> viewAvatar() throws IOException {
        AdminProfile profile = profileRepo.findById(1L).orElse(null);
        if (profile == null || profile.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }
        Path dir = Paths.get("uploads", "admin");
        if (!Files.exists(dir)) return ResponseEntity.notFound().build();
        // Find latest avatar file
        var latest = Files.list(dir)
                .filter(p -> p.getFileName().toString().startsWith("avatar_"))
                .sorted((a, b) -> b.getFileName().toString().compareTo(a.getFileName().toString()))
                .findFirst();
        if (latest.isEmpty()) return ResponseEntity.notFound().build();
        byte[] bytes = Files.readAllBytes(latest.get());
        String ct = latest.get().toString().endsWith(".png") ? "image/png" : "image/jpeg";
        return ResponseEntity.ok().header("Content-Type", ct).body(bytes);
    }

    // ── System Preferences ───────────────────────────────

    @GetMapping("/preferences")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemPreference>> getPreferences() {
        return ResponseEntity.ok(prefRepo.findAll());
    }

    @PutMapping("/preferences")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemPreference>> updatePreferences(@RequestBody List<SystemPreference> prefs) {
        List<SystemPreference> saved = prefs.stream().map(p -> {
            SystemPreference existing = prefRepo.findById(p.getId())
                    .orElseThrow(() -> new RuntimeException("Pref not found: " + p.getId()));
            existing.setPrefValue(p.getPrefValue());
            return prefRepo.save(existing);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(saved);
    }
}
