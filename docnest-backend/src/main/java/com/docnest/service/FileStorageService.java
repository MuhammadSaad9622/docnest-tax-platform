package com.docnest.service;

import com.docnest.exception.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Stores a file organized by owner type and ID.
     * e.g. uploads/client_1/uuid.pdf or uploads/family_3/uuid.jpg
     */
    public String storeFile(MultipartFile file, String ownerType, Long ownerId) {
        try {
            String folderPrefix = ownerType.equalsIgnoreCase("FAMILY_MEMBER") 
                    ? "family_" + ownerId 
                    : "client_" + ownerId;
            Path ownerDir = Paths.get(uploadDir, folderPrefix).toAbsolutePath().normalize();
            Files.createDirectories(ownerDir);

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String uniqueName = UUID.randomUUID().toString() + extension;
            Path targetPath = ownerDir.resolve(uniqueName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return Paths.get(folderPrefix, uniqueName).toString().replace("\\", "/");
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + e.getMessage());
        }
    }

    /** Backward-compat overload for existing callers */
    public String storeFile(MultipartFile file, Long clientId) {
        return storeFile(file, "CLIENT", clientId);
    }

    public void deleteFile(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir, relativePath).toAbsolutePath().normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete file: " + e.getMessage());
        }
    }

    public Resource loadFileAsResource(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir, relativePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileStorageException("File not found or not readable: " + relativePath);
        } catch (MalformedURLException e) {
            throw new FileStorageException("File not found: " + relativePath);
        }
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
