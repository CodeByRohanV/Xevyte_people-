package com.register.example.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;

// @Service
public class FileEncryptionService {

    private final SecureRandom secureRandom = new SecureRandom();

    private final String encryptionKeyString;
    private final String storageDirString;

    private SecretKey secretKey;
    private Path storageDir;

    public FileEncryptionService(
            @Value("${grievances.file.encryption-key}") String encryptionKeyString,
            @Value("${grievances.file.storage-dir}") String storageDirString
    ) {
        this.encryptionKeyString = encryptionKeyString;
        this.storageDirString = storageDirString;
    }

    @PostConstruct
    void init() throws IOException {
        if (encryptionKeyString == null || encryptionKeyString.length() != 32) {
            throw new IllegalStateException("Encryption key must be 32 characters long");
        }
        this.secretKey =
                new SecretKeySpec(encryptionKeyString.getBytes(StandardCharsets.UTF_8), "AES");

        this.storageDir = Paths.get(storageDirString).toAbsolutePath().normalize();
        Files.createDirectories(this.storageDir);
    }

    public String encryptAndStore(String grievanceId, MultipartFile file)
            throws IOException, GeneralSecurityException {

        byte[] iv = new byte[12];
        secureRandom.nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(128, iv));

        byte[] plaintext = file.getBytes();
        byte[] cipherBytes = cipher.doFinal(plaintext);

        String extension = determineExtension(file.getContentType());
        String filename = grievanceId + "_" + System.currentTimeMillis() + extension + ".enc";

        Path target = storageDir.resolve(filename);

        byte[] combined = new byte[iv.length + cipherBytes.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(cipherBytes, 0, combined, iv.length, cipherBytes.length);

        Files.write(target, combined);
        return target.toString();
    }

    public InputStream decryptToStream(String path)
            throws IOException, GeneralSecurityException {

        Path filePath = Paths.get(path);
        byte[] combined = Files.readAllBytes(filePath);

        byte[] iv = Arrays.copyOfRange(combined, 0, 12);
        byte[] cipherBytes = Arrays.copyOfRange(combined, 12, combined.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(128, iv));

        byte[] plaintext = cipher.doFinal(cipherBytes);
        return new ByteArrayInputStream(plaintext);
    }

    public String determineContentTypeFromPath(String path) {
        if (path.contains(".pdf.enc")) return "application/pdf";
        if (path.contains(".jpg.enc") || path.contains(".jpeg.enc")) return "image/jpeg";
        if (path.contains(".png.enc")) return "image/png";
        return "application/octet-stream";
    }

    public String determineDownloadFilename(String grievanceId, String path) {
        if (path.contains(".pdf.enc")) return grievanceId + ".pdf";
        if (path.contains(".jpg.enc")) return grievanceId + ".jpg";
        if (path.contains(".jpeg.enc")) return grievanceId + ".jpeg";
        if (path.contains(".png.enc")) return grievanceId + ".png";
        return grievanceId + "-attachment";
    }

    private String determineExtension(String contentType) {
        if (contentType == null) return "";
        if (contentType.equalsIgnoreCase("application/pdf")) return ".pdf";
        if (contentType.equalsIgnoreCase("image/jpeg")) return ".jpg";
        if (contentType.equalsIgnoreCase("image/png")) return ".png";
        return "";
    }
}
