package app.kaaj.shared.internal;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import app.kaaj.shared.ApiException;
import app.kaaj.shared.FileKind;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    private final MessageSource messages;

    ApiExceptionHandler(MessageSource messages) { this.messages = messages; }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ProblemDetail> handle(ApiException ex, Locale locale) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(ex.status(),
                messages.getMessage(ex.code(), ex.args(), ex.code(), locale));
        problem.setProperty("code", ex.code());
        return ResponseEntity.status(ex.status()).body(problem);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.putIfAbsent(e.getField(), messages.getMessage(e, locale)));
        ProblemDetail problem = ex.getBody();
        problem.setProperty("code", "error.validation");
        problem.setProperty("errors", errors);
        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    /** An upload bigger than spring.servlet.multipart.max-file-size: the same message as FileStore's own check. */
    @Override
    protected ResponseEntity<Object> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        Object[] args = { FileKind.DOCUMENT.maxMegabytes() };
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status,
                messages.getMessage("file.too-large", args, "file.too-large", locale));
        problem.setProperty("code", "file.too-large");
        return handleExceptionInternal(ex, problem, headers, status, request);
    }
}