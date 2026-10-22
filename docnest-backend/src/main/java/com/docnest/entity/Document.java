package com.docnest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_type", nullable = false, length = 20)
    private String ownerType; // CLIENT or FAMILY_MEMBER

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "mime_type", length = 50)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "ocr_confidence")
    private Integer ocrConfidence;

    @Column(name = "ocr_extracted_text", columnDefinition = "TEXT")
    private String ocrExtractedText;

    /** Structured box-level values parsed from the OCR text, stored as JSON. */
    @Column(name = "extracted_fields", columnDefinition = "TEXT")
    private String extractedFields;

    /** NEEDS_REVIEW after automatic extraction, VERIFIED once a preparer confirms it. */
    @Column(name = "review_status", length = 20)
    private String reviewStatus;

    @CreationTimestamp
    @Column(name = "upload_date", updatable = false)
    private LocalDateTime uploadDate;
}
