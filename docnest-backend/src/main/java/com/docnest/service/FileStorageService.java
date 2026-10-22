package com.docnest.service;

import com.docnest.exception.FileStorageException;
import com.docnest.entity.StoredFile;
import com.docnest.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    /** Paths of files kept in the database are prefixed with this marker. */
    private static final String DB_PREFIX = "db:";

    private final StoredFileRepository storedFileRepository;

    /**
     * Stores the file bytes in Postgres and returns a "db:&lt;uuid&gt;" reference
     * that is saved on the Document row.
     */
    public String storeFile(MultipartFile file, String ownerType, Long ownerId) {
        try {
            String id = UUID.randomUUID().toString();
            storedFileRepository.save(StoredFile.builder()
                    .id(id)
                    .contentType(file.getContentType())
                    .sizeBytes(file.getSize())
                    .data(file.getBytes())
                    .build());
            return DB_PREFIX + id;
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + e.getMessage());
        }
    }

    /** Backward-compat overload for existing callers */
    public String storeFile(MultipartFile file, Long clientId) {
        return storeFile(file, "CLIENT", clientId);
    }

    public void deleteFile(String relativePath) {
        if (relativePath != null && relativePath.startsWith(DB_PREFIX)) {
            storedFileRepository.deleteById(relativePath.substring(DB_PREFIX.length()));
        }
    }

    public Resource loadFileAsResource(String relativePath) {
        if (relativePath == null || !relativePath.startsWith(DB_PREFIX)) {
            throw new FileStorageException("File not found: " + relativePath);
        }
        return storedFileRepository.findById(relativePath.substring(DB_PREFIX.length()))
                .map(f -> (Resource) new ByteArrayResource(f.getData()))
                .orElseThrow(() -> new FileStorageException("File not found: " + relativePath));
    }

    public String detectDocumentType(String filename) {
        if (filename == null) return null;
        String lower = filename.toLowerCase();
        if (lower.contains("aadhar") || lower.contains("aadhaar"))   return "AADHAR";
        if (lower.contains("pan"))                                     return "PAN";
        if (lower.contains("driving") || lower.contains("license") || lower.contains("licence")) return "DRIVING_LICENSE";
        if (lower.contains("electricity") || lower.contains("bill") || lower.contains("elec"))     return "ELECTRICITY_BILL";
        if (lower.contains("w2") || lower.contains("w-2") || lower.contains("wage"))               return "W2";
        if (lower.contains("1099nec") || lower.contains("1099-nec") || lower.contains("nec"))      return "FORM_1099NEC";
        if (lower.contains("1099misc") || lower.contains("1099-misc") || lower.contains("misc"))   return "FORM_1099_MISC";
        if (lower.contains("ssn") || lower.contains("social") || lower.contains("security"))       return "SSN_CARD";
        if (lower.contains("passport"))                                                                 return "US_PASSPORT";
        return null;
    }
}
