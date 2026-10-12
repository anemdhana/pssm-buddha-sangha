package com.pssm.sangha.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<?> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(ApiResponses.error(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        FieldError field = ex.getBindingResult().getFieldError();
        String message = field != null ? field.getDefaultMessage() : "Validation failed.";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponses.error("VALIDATION", message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleOther(Exception ex) {
        log.error("Unhandled server error", ex);
        String detail = ex.getClass().getSimpleName();
        if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
            detail = detail + ": " + ex.getMessage();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponses.error("SERVER_ERROR", detail));
    }
}
