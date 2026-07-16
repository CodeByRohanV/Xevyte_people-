package com.register.example.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@Service
public class FileStorageService {

    private final Path root = Paths.get("uploads").toAbsolutePath().normalize();

    public FileStorageService() {
        try {
            Files.createDirectories(root.resolve("clearance/hr"));
            Files.createDirectories(root.resolve("clearance/admin"));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload directories", e);
        }
    }

    public String storeHrFile(MultipartFile file, Long resignationId) {
        return storeFile(file, "clearance/hr", resignationId);
    }

    public String storeAdminFile(MultipartFile file, Long resignationId) {
        return storeFile(file, "clearance/admin", resignationId);
    }

    private String storeFile(MultipartFile file, String subfolder, Long resignationId) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String original = StringUtils.cleanPath(file.getOriginalFilename());
        String filename = System.currentTimeMillis() + "_" + resignationId + "_" + original;
        try {
            Path destinationDir = root.resolve(subfolder);
            if (!Files.exists(destinationDir)) Files.createDirectories(destinationDir);
            Path target = destinationDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + original + ". Please try again.", ex);
        }
    }
}
