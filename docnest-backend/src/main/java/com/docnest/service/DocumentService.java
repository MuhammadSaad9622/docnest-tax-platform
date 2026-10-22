package com.docnest.service;

import com.docnest.dto.DocumentDTO;
import com.docnest.entity.Client;
import com.docnest.entity.Document;
import com.docnest.entity.FamilyMember;
import com.docnest.exception.ResourceNotFoundException;
import com.docnest.repository.ClientRepository;
import com.docnest.repository.DocumentRepository;
import com.docnest.repository.FamilyMemberRepository;
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

    private static final List<String> REQUIRED_DOC_TYPES =
            Arrays.asList(
                    "AADHAR", "PAN", "DRIVING_LICENSE", "ELECTRICITY_BILL",
                    "W2", "FORM_1099NEC", "FORM_1099_MISC", "SSN_CARD", "US_PASSPORT"
            );

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

        Document saved = documentRepository.save(doc);
        activityService.log("DOCUMENT_UPLOADED",
                documentType + " uploaded for " + ownerName,
                "DOCUMENT", saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public DocumentDTO replaceDocument(Long documentId, MultipartFile file) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        if (doc.getFilePath() != null) {
            fileStorageService.deleteFile(doc.getFilePath());
        }

        String relativePath = fileStorageService.storeFile(file, doc.getOwnerType(), doc.getOwnerId());
        doc.setFileName(file.getOriginalFilename());
        doc.setFilePath(relativePath);

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
        int total = REQUIRED_DOC_TYPES.size();
        int count = (int) REQUIRED_DOC_TYPES.stream().filter(uploaded::contains).count();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("uploaded", count);
        stats.put("total", total);
        stats.put("percentage", total > 0 ? Math.round((count * 100.0) / total) : 0);
        stats.put("uploadedTypes", uploaded);
        return stats;
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
                .build();
    }
}
