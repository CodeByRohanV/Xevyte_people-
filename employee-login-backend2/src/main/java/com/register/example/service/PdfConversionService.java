package com.register.example.service;

import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.*;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class PdfConversionService {

    public byte[] convertToPdf(byte[] docxContent) throws Exception {
        // Use a local working directory
        Path tempDir = Paths.get("temp_pdf_conversion_work_area");
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }

        // LibreOffice names the output using input's base name, so match them:
        String uniqueId = UUID.randomUUID().toString();
        Path inputPath = tempDir.resolve("input_" + uniqueId + ".docx").toAbsolutePath();
        Path outputPath = tempDir.resolve("input_" + uniqueId + ".pdf").toAbsolutePath();

        try {
            // Write input file
            Files.write(inputPath, docxContent);
            Files.deleteIfExists(outputPath);

            System.out.println("PdfConversionService: Attempting conversion of " + inputPath);
            convertWithLibreOffice(inputPath, outputPath, uniqueId);

            if (!Files.exists(outputPath)) {
                // Check if it created it in a slightly different name (e.g. input_<uuid>.pdf in current dir instead of outdir)
                // This shouldn't happen with --outdir but just in case.
                throw new RuntimeException(
                    "PDF output file was not found at " + outputPath +
                    ". Conversion may have failed or output to a different location. Ensure LibreOffice (soffice) is correctly installed.");
            }

            return Files.readAllBytes(outputPath);

        } catch (Exception e) {
            System.err.println("PdfConversionService: Error during conversion: " + e.getMessage());
            throw e;
        } finally {
            try { Files.deleteIfExists(inputPath); } catch (Exception ignored) {}
            try { Files.deleteIfExists(outputPath); } catch (Exception ignored) {}
        }
    }

    /**
     * Uses LibreOffice headless mode to convert DOCX → PDF.
     * Works on macOS, Windows, and Linux without MS Word.
     *
     * Install LibreOffice:
     *   - macOS:  brew install --cask libreoffice
     *   - Linux:  sudo apt-get install -y libreoffice
     *   - Windows: Download from https://www.libreoffice.org/download/
     */
    private void convertWithLibreOffice(Path inputPath, Path outputPath, String uniqueId) throws Exception {
        Path outputDir = outputPath.getParent();

        // Use a unique profile directory for this conversion to avoid profile locking issues
        // especially when multiple conversions happen or LibreOffice is open.
        Path profileDir = outputDir.resolve("profile_" + uniqueId);
        Files.createDirectories(profileDir);

        // Find soffice executable — check common locations
        String sofficeCmd = findSoffice();

        System.out.println("PdfConversionService: Executing " + sofficeCmd);

        try {
            runCommand(sofficeCmd, 
                       "--headless", 
                       "-env:UserInstallation=" + profileDir.toUri().toString(),
                       "--convert-to", "pdf",
                       "--outdir", outputDir.toString(), 
                       inputPath.toString());

            // LibreOffice names the output using the input's base name + .pdf extension
            String inputFileName = inputPath.getFileName().toString();
            String baseName = inputFileName.substring(0, inputFileName.lastIndexOf('.'));
            Path libreOfficeOutput = outputDir.resolve(baseName + ".pdf");

            // Move to the expected outputPath if LibreOffice generated a slightly different name
            if (Files.exists(libreOfficeOutput) && !libreOfficeOutput.equals(outputPath)) {
                Files.move(libreOfficeOutput, outputPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            // Cleanup profile directory
            deleteDirectoryRecursively(profileDir);
        }
    }

    private void deleteDirectoryRecursively(Path path) {
        try {
            if (Files.exists(path)) {
                try (java.util.stream.Stream<Path> walk = Files.walk(path)) {
                    walk.sorted((p1, p2) -> p2.toString().length() - p1.toString().length()) // delete children first
                         .forEach(p -> {
                             try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                         });
                }
            }
        } catch (Exception ignored) {}
    }

    /**
     * Locates the soffice (LibreOffice) executable on various platforms.
     */
    private String findSoffice() {
        String os = System.getProperty("os.name").toLowerCase();

        // Check common macOS install paths - prioritize the actual app path
        if (os.contains("mac")) {
            String[] macPaths = {
                "/Applications/LibreOffice.app/Contents/MacOS/soffice",
                "/opt/homebrew/bin/soffice",
                "/usr/local/bin/soffice"
            };
            for (String path : macPaths) {
                if (new File(path).exists()) {
                    System.out.println("Found LibreOffice at: " + path);
                    return path;
                }
            }
        }

        // Check common Windows install paths
        if (os.contains("win")) {
            String[] winPaths = {
                "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
                "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
            };
            for (String path : winPaths) {
                if (new File(path).exists()) {
                    return path;
                }
            }
        }

        // Default: assume soffice is on PATH (Linux or after PATH-based install)
        return "soffice";
    }

    private void runCommand(String... command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true); // merge stderr into stdout for better diagnostics
        Process process = pb.start();

        // Capture output for error reporting
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        boolean completed = process.waitFor(90, TimeUnit.SECONDS);
        if (!completed) {
            process.destroy();
            throw new RuntimeException("PDF conversion timed out after 90 seconds. Output: " + output);
        }

        if (process.exitValue() != 0) {
            throw new RuntimeException(
                "LibreOffice (soffice) conversion failed (exit code " + process.exitValue() + "). " +
                "Output: " + output.toString().trim());
        }
    }
}