package app.kaaj.shared;

import org.springframework.http.HttpStatus;

/** An API error; code is a key in messages.properties. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final transient Object[] args;

    public ApiException(HttpStatus status, String code, Object... args) {
        super(code);
        this.status = status;
        this.code = code;
        this.args = args;
    }

    public static ApiException badRequest(String code, Object... args) { return new ApiException(HttpStatus.BAD_REQUEST, code, args); }
    public static ApiException unauthorized(String code) { return new ApiException(HttpStatus.UNAUTHORIZED, code); }
    public static ApiException forbidden(String code) { return new ApiException(HttpStatus.FORBIDDEN, code); }
    public static ApiException tooMany(String code, Object... args) { return new ApiException(HttpStatus.TOO_MANY_REQUESTS, code, args); }

    public HttpStatus status() { return status; }
    public String code() { return code; }
    public Object[] args() { return args; }
}