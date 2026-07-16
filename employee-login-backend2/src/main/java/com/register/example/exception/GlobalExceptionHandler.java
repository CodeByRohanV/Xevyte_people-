package com.register.example.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.context.request.WebRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final String CONST_TIMESTAMP = "timestamp";
    private static final String CONST_STATUS = "status";
    private static final String CONST_ERROR = "error";
    private static final String CONST_MESSAGE = "message";
    private static final String CONST_PATH = "path";

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(CONST_TIMESTAMP, LocalDateTime.now());
        body.put(CONST_STATUS, HttpStatus.NOT_FOUND.value());
        body.put(CONST_ERROR, "Not Found");
        body.put(CONST_MESSAGE, ex.getMessage());
        body.put(CONST_PATH, request.getDescription(false).replace("uri=", ""));
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(CONST_TIMESTAMP, LocalDateTime.now());
        body.put(CONST_STATUS, HttpStatus.BAD_REQUEST.value());
        body.put(CONST_ERROR, "Bad Request");
        body.put(CONST_MESSAGE, ex.getMessage());
        body.put(CONST_PATH, request.getDescription(false).replace("uri=", ""));
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(CONST_TIMESTAMP, LocalDateTime.now());
        body.put(CONST_STATUS, HttpStatus.BAD_REQUEST.value());
        body.put(CONST_ERROR, "Validation Failed");
        body.put(CONST_MESSAGE, ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", ")));
        body.put(CONST_PATH, request.getDescription(false).replace("uri=", ""));
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Object> handleResponseStatusException(ResponseStatusException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(CONST_TIMESTAMP, LocalDateTime.now());
        body.put(CONST_STATUS, ex.getStatusCode().value());
        body.put(CONST_ERROR, ex.getStatusCode().toString());
        body.put(CONST_MESSAGE, ex.getReason());
        body.put(CONST_PATH, request.getDescription(false).replace("uri=", ""));
        return new ResponseEntity<>(body, ex.getStatusCode());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex, WebRequest request) {
        ex.printStackTrace(); // Log constraint violation to console/logs for debugging
        Map<String, Object> body = new HashMap<>();
        body.put(CONST_TIMESTAMP, LocalDateTime.now());
        body.put(CONST_STATUS, HttpStatus.CONFLICT.value());
        body.put(CONST_ERROR, "Conflict");
        
        String message = "A data integrity constraint was violated. Please ensure your input is valid.";
        Throwable cause = ex.getMostSpecificCause();
        if (cause != null && cause.getMessage() != null) {
            String causeMessage = cause.getMessage();
            if (causeMessage.contains("Duplicate entry")) {
                message = "A duplicate record already exists. Please check your data and try again.";
            } else if (causeMessage.contains("Cannot delete or update a parent row") || 
                       (causeMessage.contains("a foreign key constraint fails") && (causeMessage.toLowerCase().contains("delete") || causeMessage.toLowerCase().contains("parent")))) {
                message = "Cannot delete or modify this record because it is currently in use by other records in the system.";
            } else if (causeMessage.contains("Cannot add or update a child row") || causeMessage.contains("a foreign key constraint fails")) {
                message = "Cannot save or update because a referenced record (such as Category, Sub-Category, or Employee) does not exist.";
            } else if (causeMessage.toLowerCase().contains("cannot be null")) {
                String columnName = extractColumnName(causeMessage);
                if (columnName != null && !columnName.isEmpty()) {
                    message = "Required field '" + formatColumnName(columnName) + "' cannot be empty. Please ensure all mandatory fields are filled out.";
                } else {
                    message = "A required field is missing. Please ensure all mandatory fields are filled out.";
                }
            } else if (causeMessage.toLowerCase().contains("data too long")) {
                String columnName = extractColumnName(causeMessage);
                if (columnName != null && !columnName.isEmpty()) {
                    message = "The input value for '" + formatColumnName(columnName) + "' exceeds the allowed character limit. Please shorten the text and try again.";
                } else {
                    message = "One of the input fields exceeds the allowed character limit. Please check your data and try again.";
                }
            }
        }
        
        body.put(CONST_MESSAGE, message);
        body.put(CONST_PATH, request.getDescription(false).replace("uri=", ""));
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(CONST_TIMESTAMP, LocalDateTime.now());
        body.put(CONST_STATUS, HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put(CONST_ERROR, "Internal Server Error");
        body.put(CONST_MESSAGE, ex.getMessage());
        body.put(CONST_PATH, request.getDescription(false).replace("uri=", ""));
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String extractColumnName(String message) {
        if (message == null) return null;
        int firstQuote = message.indexOf("'");
        if (firstQuote != -1) {
            int secondQuote = message.indexOf("'", firstQuote + 1);
            if (secondQuote != -1) {
                return message.substring(firstQuote + 1, secondQuote);
            }
        }
        return null;
    }

    private String formatColumnName(String columnName) {
        if (columnName == null || columnName.isEmpty()) return "";
        String[] parts = columnName.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                sb.append(Character.toUpperCase(part.charAt(0)))
                  .append(part.substring(1))
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }
}

