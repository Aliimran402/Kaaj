package app.kaaj.identity.internal;

import app.kaaj.identity.CurrentUser;
import app.kaaj.shared.ApiException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class MeController {
    private final CurrentUser currentUser;
    private final AppUserRepository users;

    MeController(CurrentUser currentUser, AppUserRepository users) {
        this.currentUser = currentUser;
        this.users = users;
    }

    @GetMapping("/api/v1/me")
    AuthController.MeResponse me() {
        return users.findById(currentUser.id())
                .map(AuthController.MeResponse::of)
                .orElseThrow(() -> ApiException.unauthorized("auth.required"));
    }
}