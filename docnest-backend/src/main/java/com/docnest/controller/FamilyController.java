package com.docnest.controller;

import com.docnest.dto.FamilyMemberDTO;
import com.docnest.dto.FamilyTreeNodeDTO;
import com.docnest.service.FamilyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor

public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<FamilyMemberDTO> addMember(@Valid @RequestBody FamilyMemberDTO dto) {
        return ResponseEntity.ok(familyService.addFamilyMember(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<FamilyMemberDTO> updateMember(@PathVariable Long id,
                                                         @Valid @RequestBody FamilyMemberDTO dto) {
        return ResponseEntity.ok(familyService.updateFamilyMember(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id) {
        familyService.deleteFamilyMember(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<List<FamilyMemberDTO>> getMembers(@PathVariable Long clientId) {
        return ResponseEntity.ok(familyService.getFamilyMembers(clientId));
    }

    @GetMapping("/tree/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<FamilyTreeNodeDTO> getTree(@PathVariable Long clientId) {
        return ResponseEntity.ok(familyService.getFamilyTree(clientId));
    }
}
