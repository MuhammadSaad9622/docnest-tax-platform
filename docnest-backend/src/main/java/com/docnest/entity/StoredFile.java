package com.docnest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Binary content of an uploaded document, kept in Postgres (Neon) so the
 * backend stays stateless on serverless containers and files never get a public URL.
 */
@Entity
@Table(name = "stored_file")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoredFile {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "data", nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
