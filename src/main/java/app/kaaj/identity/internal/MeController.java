package app.kaaj.identity.internal;

import app.kaaj.identity.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class MeController {
    private final CurrentUser currentUser;
    private final AuthService auth;

    MeController(CurrentUser currentUser, AuthService auth) {
        this.currentUser = currentUser;
        this.auth = auth;
    }

    @GetMapping("/api/v1/me")
    AuthController.MeResponse me() {
        return AuthController.MeResponse.of(auth.account(currentUser.id()));
    }
}
