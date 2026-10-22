package com.docnest.service;

import com.docnest.dto.DocumentDTO;
import com.docnest.entity.Client;
import com.docnest.entity.Document;
import com.docnest.entity.FamilyMember;
import com.docnest.exception.ResourceNotFoundException;
import com.docnest.repository.ClientRepository;
import com.docnest.repository.DocumentTypeConfigRepository;
import com.docnest.repository.DocumentRepository;
import com.docnest.repository.FamilyMemberRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ClientRepository clientRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FileStorageService fileStorageService;
    private final ActivityService activityService;
    private final TaxFieldExtractor taxFieldExtractor;
    private final DocumentTypeConfigRepository documentTypeConfigRepository;

    private static final ObjectMapper JSON = new ObjectMapper();

    /** Used only when no document type is flagged as required in Settings. */
    private static final List<String> DEFAULT_REQUIRED_DOC_TYPES = List.of("W2", "SSN_CARD", "US_PASSPORT");

    @Transactional
    public DocumentDTO uploadDocument(String ownerType, Long ownerId, String documentType, MultipartFile file, String ocrText, Integer confidence) {
        String ownerName = resolveOwnerName(ownerType, ownerId);

        if (documentType == null || documentType.isBlank()) {
            documentType = fileStorageService.detectDocumentType(file.getOriginalFilename());
        }

        String relativePath = fileStorageService.storeFile(file, ownerType, ownerId);

        Document doc = Document.builder()
                .ownerType(ownerType.toUpperCase())
                .ownerId(ownerId)
                .documentType(documentType.toUpperCase())
                .fileName(file.getOriginalFilename())
                .filePath(relativePath)
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .ocrExtractedText(ocrText)
                .ocrConfidence(confidence)
                .build();
        applyExtraction(doc, ocrText);

        Document saved = documentRepository.save(doc);
        activityService.log("DOCUMENT_UPLOADED",
                documentType + " uploaded for " + ownerName,
                "DOCUMENT", saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public DocumentDTO replaceDocument(Long documentId, MultipartFile file, String ocrText, Integer confidence) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        if (doc.getFilePath() != null) {
            fileStorageService.deleteFile(doc.getFilePath());
        }

        String relativePath = fileStorageService.storeFile(file, doc.getOwnerType(), doc.getOwnerId());
        doc.setFileName(file.getOriginalFilename());
        doc.setFilePath(relativePath);
        doc.setMimeType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setOcrExtractedText(ocrText);
        doc.setOcrConfidence(confidence);
        applyExtraction(doc, ocrText);

        Document saved = documentRepository.save(doc);
        String ownerName = resolveOwnerName(doc.getOwnerType(), doc.getOwnerId());
        activityService.log("DOCUMENT_REPLACED",
                doc.getDocumentType() + " replaced for " + ownerName,
                "DOCUMENT", saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
        if (doc.getFilePath() != null) fileStorageService.deleteFile(doc.getFilePath());
        String ownerName = resolveOwnerName(doc.getOwnerType(), doc.getOwnerId());
        String desc = doc.getDocumentType() + " deleted for " + ownerName;
        documentRepository.delete(doc);
        activityService.log("DOCUMENT_DELETED", desc, "DOCUMENT", documentId);
    }

    public List<DocumentDTO> getDocumentsForOwner(String ownerType, Long ownerId) {
        return documentRepository.findByOwnerTypeAndOwnerId(ownerType.toUpperCase(), ownerId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Backward-compat: get docs for a client */
    public List<DocumentDTO> getDocumentsForClient(Long clientId) {
        return getDocumentsForOwner("CLIENT", clientId);
    }

    public Resource loadDocumentAsResource(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
        return fileStorageService.loadFileAsResource(doc.getFilePath());
    }

    public DocumentDTO getDocumentById(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        return toDTO(doc);
    }

    /**
     * Returns completion stats: { uploaded, total, percentage }
     */
    public Map<String, Object> getCompletionStats(String ownerType, Long ownerId) {
        Set<String> uploaded = documentRepository
                .findByOwnerTypeAndOwnerId(ownerType.toUpperCase(), ownerId)
                .stream().map(Document::getDocumentType).collect(Collectors.toSet());
        List<String> required = requiredDocTypes();
        int total = required.size();
        int count = (int) required.stream().filter(uploaded::contains).count();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("uploaded", count);
        stats.put("total", total);
        stats.put("percentage", total > 0 ? Math.round((count * 100.0) / total) : 0);
        stats.put("uploadedTypes", uploaded);
        return stats;
    }

    /** Preparer edits/confirms extracted values; marks the document VERIFIED. */
    @Transactional
    public DocumentDTO updateExtractedFields(Long documentId, Map<String, String> fields) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
        Map<String, String> merged = new LinkedHashMap<>(readFields(doc));
        fields.forEach((k, v) -> {
            // Masked values coming back from the UI must not overwrite the real SSN
            if (v == null || v.isBlank()) merged.remove(k);
            else if (!v.startsWith("***")) merged.put(k, v.trim());
        });
        doc.setExtractedFields(writeFields(merged));
        doc.setReviewStatus("VERIFIED");
        Document saved = documentRepository.save(doc);
        activityService.log("DOCUMENT_VERIFIED",
                doc.getDocumentType() + " fields verified for " + resolveOwnerName(doc.getOwnerType(), doc.getOwnerId()),
                "DOCUMENT", saved.getId());
        return toDTO(saved);
    }

    /** Unmasked extracted values, for the TaxSlayer export only. */
    public Map<String, String> readFields(Document d) {
        if (d.getExtractedFields() == null || d.getExtractedFields().isBlank()) return Map.of();
        try {
            return JSON.readValue(d.getExtractedFields(), new TypeReference<LinkedHashMap<String, String>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    public List<String> requiredDocTypes() {
        List<String> configured = documentTypeConfigRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()) && Boolean.TRUE.equals(c.getIsRequired()))
                .map(c -> c.getTypeName())
                .collect(Collectors.toList());
        return configured.isEmpty() ? DEFAULT_REQUIRED_DOC_TYPES : configured;
    }

    private void applyExtraction(Document doc, String ocrText) {
        Map<String, String> fields = taxFieldExtractor.extract(doc.getDocumentType(), ocrText);
        doc.setExtractedFields(fields.isEmpty() ? null : writeFields(fields));
        doc.setReviewStatus(fields.isEmpty() ? null : "NEEDS_REVIEW");
    }

    private Map<String, String> maskedFields(Document d) {
        Map<String, String> masked = new LinkedHashMap<>();
        readFields(d).forEach((k, v) -> masked.put(k, TaxFieldExtractor.mask(k, v)));
        return masked;
    }

    private String writeFields(Map<String, String> fields) {
        try {
            return JSON.writeValueAsString(fields);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not serialise extracted fields");
        }
    }

    private String resolveOwnerName(String ownerType, Long ownerId) {
        if ("CLIENT".equalsIgnoreCase(ownerType)) {
            return clientRepository.findById(ownerId)
                    .map(c -> c.getFirstName() + " " + c.getLastName())
                    .orElse("Client #" + ownerId);
        } else {
            return familyMemberRepository.findById(ownerId)
                    .map(m -> m.getMemberName())
                    .orElse("Member #" + ownerId);
        }
    }

    private DocumentDTO toDTO(Document d) {
        return DocumentDTO.builder()
                .id(d.getId())
                .ownerType(d.getOwnerType())
                .ownerId(d.getOwnerId())
                .ownerName(resolveOwnerName(d.getOwnerType(), d.getOwnerId()))
                .documentType(d.getDocumentType())
                .fileName(d.getFileName())
                .filePath(d.getFilePath())
                .mimeType(d.getMimeType())
                .fileSize(d.getFileSize())
                .ocrConfidence(d.getOcrConfidence())
                .uploadDate(d.getUploadDate())
                .previewUrl("/api/documents/preview/" + d.getId())
                .extractedFields(maskedFields(d))
                .reviewStatus(d.getReviewStatus())
                .build();
    }
}
