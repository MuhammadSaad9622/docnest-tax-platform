package com.docnest.controller;

import com.docnest.dto.DocumentDTO;
import com.docnest.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<DocumentDTO> upload(
            @RequestParam(defaultValue = "CLIENT") String ownerType,
            @RequestParam Long ownerId,
            @RequestParam(required = false) String documentType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "ocrText", required = false) String ocrText,
            @RequestParam(value = "confidence", required = false) Integer confidence) {
        return ResponseEntity.ok(documentService.uploadDocument(ownerType, ownerId, documentType, file, ocrText, confidence));
    }

    @PutMapping("/replace/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<DocumentDTO> replace(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.replaceDocument(id, file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    /** Get documents by owner (CLIENT or FAMILY_MEMBER) */
    @GetMapping("/owner/{ownerType}/{ownerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<List<DocumentDTO>> getByOwner(
            @PathVariable String ownerType,
            @PathVariable Long ownerId) {
        return ResponseEntity.ok(documentService.getDocumentsForOwner(ownerType, ownerId));
    }

    /** Backward-compat: get by client ID */
    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<List<DocumentDTO>> getByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(documentService.getDocumentsForClient(clientId));
    }

    /** Document completion stats for an owner */
    @GetMapping("/completion/{ownerType}/{ownerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<Map<String, Object>> getCompletion(
            @PathVariable String ownerType,
            @PathVariable Long ownerId) {
        return ResponseEntity.ok(documentService.getCompletionStats(ownerType, ownerId));
    }

    @GetMapping("/preview/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<Resource> preview(@PathVariable Long id) {
        DocumentDTO dto = documentService.getDocumentById(id);
        Resource resource = documentService.loadDocumentAsResource(id);

        String contentType = "application/octet-stream";
        String fileName = dto.getFileName() != null ? dto.getFileName().toLowerCase() : "";
        if (fileName.endsWith(".pdf"))  contentType = "application/pdf";
        else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (fileName.endsWith(".png")) contentType = "image/png";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + dto.getFileName() + "\"")
                .body(resource);
    }
}
