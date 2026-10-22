package com.docnest.controller;

import com.docnest.dto.DocumentDTO;
import com.docnest.entity.TaxIntake;
import com.docnest.entity.User;
import com.docnest.repository.UserRepository;
import com.docnest.service.ClientService;
import com.docnest.service.DocumentService;
import com.docnest.service.TaxIntakeService;
import org.springframework.core.io.Resource;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Client-facing portal endpoints.
 * Only accessible by users with the CLIENT role.
 * Each client can only operate on their own linked client record.
 */
@RestController
@RequestMapping("/api/portal")
@RequiredArgsConstructor
public class ClientPortalController {

    private final UserRepository userRepository;
    private final DocumentService documentService;
    private final ClientService clientService;
    private final TaxIntakeService taxIntakeService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Map<String, Object>> myProfile(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long clientId = user.getLinkedClient() != null ? user.getLinkedClient().getId() : null;
        if (clientId == null) {
            return ResponseEntity.ok(Map.of("clientId", -1, "profile", Map.of()));
        }
        var dto = clientService.getClientById(clientId);
        return ResponseEntity.ok(Map.of(
                "clientId", clientId,
                "profile", dto
        ));
    }

    @GetMapping("/documents")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<DocumentDTO>> myDocuments(Authentication auth) {
        Long clientId = resolveClientId(auth.getName());
        if (clientId == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(documentService.getDocumentsForOwner("CLIENT", clientId));
    }

    @GetMapping("/documents/completion")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Map<String, Object>> completionStats(Authentication auth) {
        Long clientId = resolveClientId(auth.getName());
        if (clientId == null) return ResponseEntity.ok(Map.of("uploaded", 0, "total", 0, "percentage", 0));
        return ResponseEntity.ok(documentService.getCompletionStats("CLIENT", clientId));
    }

    @PostMapping("/documents/upload")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<DocumentDTO> uploadDocument(
            Authentication auth,
            @RequestParam(required = false) String documentType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "ocrText", required = false) String ocrText,
            @RequestParam(value = "confidence", required = false) Integer confidence) {
        Long clientId = resolveClientId(auth.getName());
        if (clientId == null) {
            return ResponseEntity.badRequest().build();
        }
        DocumentDTO result = documentService.uploadDocument("CLIENT", clientId, documentType, file, ocrText, confidence);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Void> deleteMyDocument(Authentication auth, @PathVariable Long id) {
        Long clientId = resolveClientId(auth.getName());
        if (clientId == null) return ResponseEntity.badRequest().build();
        // Only allow deletion of documents belonging to this client
        var doc = documentService.getDocumentById(id);
        if (!"CLIENT".equals(doc.getOwnerType()) || !doc.getOwnerId().equals(clientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/documents/{id}/replace")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<DocumentDTO> replaceMyDocument(
            Authentication auth,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "ocrText", required = false) String ocrText,
            @RequestParam(value = "confidence", required = false) Integer confidence) {
        if (!ownsDocument(auth, id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(documentService.replaceDocument(id, file, ocrText, confidence));
    }

    @GetMapping("/documents/{id}/preview")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Resource> previewMyDocument(Authentication auth, @PathVariable Long id) {
        if (!ownsDocument(auth, id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return DocumentController.fileResponse(documentService.getDocumentById(id), documentService.loadDocumentAsResource(id));
    }

    @GetMapping("/intake")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<TaxIntake> myIntake(Authentication auth, @RequestParam(required = false) Integer taxYear) {
        Long clientId = resolveClientId(auth.getName());
        if (clientId == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(taxIntakeService.get(clientId, taxYear));
    }

    @PutMapping("/intake")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<TaxIntake> saveIntake(Authentication auth,
                                                @RequestBody TaxIntake intake,
                                                @RequestParam(defaultValue = "false") boolean submit) {
        Long clientId = resolveClientId(auth.getName());
        if (clientId == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(taxIntakeService.save(clientId, intake, submit));
    }

    private boolean ownsDocument(Authentication auth, Long documentId) {
        Long clientId = resolveClientId(auth.getName());
        if (clientId == null) return false;
        var doc = documentService.getDocumentById(documentId);
        return "CLIENT".equals(doc.getOwnerType()) && doc.getOwnerId().equals(clientId);
    }

    private Long resolveClientId(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getLinkedClient() == null) return null;
        return user.getLinkedClient().getId();
    }
}
