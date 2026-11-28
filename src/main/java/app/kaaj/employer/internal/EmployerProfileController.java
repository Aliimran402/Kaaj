package app.kaaj.employer.internal;

import java.io.IOException;
import java.io.UncheckedIOException;

import app.kaaj.employer.EmployerKind;
import app.kaaj.employer.internal.EmployerViews.ProfileView;
import app.kaaj.identity.CurrentUser;
import app.kaaj.shared.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller: the employer's own business profile. Only EMPLOYER accounts reach /api/v1/employer/** (SecurityConfig),
 * and every call works on the signed-in user's own profile.
 */
@RestController
@RequestMapping("/api/v1/employer/profile")
class EmployerProfileController {

    /** Bangladeshi mobile numbers: 01XXXXXXXXX or +8801XXXXXXXXX, spaces and dashes allowed. */
    static final String BD_MOBILE = "^(\\+?880[-\\s]?|0)1[3-9](?:[-\\s]?\\d){8}$";

    record ProfileRequest(
            @NotBlank @Size(min = 2, max = 120) String name,
            @NotNull EmployerKind kind,
            @NotBlank @Size(max = 300) String address,
            @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @NotBlank @Size(max = 120) String contactPerson,
            @NotBlank @Pattern(regexp = BD_MOBILE) String contactPhone,
            @Email @Size(max = 200) String contactEmail) {

        Employer.Details toDetails() {
            return new Employer.Details(name, kind, address, latitude, longitude, contactPerson, contactPhone, contactEmail);
        }
    }

    private final EmployerProfileService profiles;
    private final CurrentUser currentUser;

    EmployerProfileController(EmployerProfileService profiles, CurrentUser currentUser) {
        this.profiles = profiles;
        this.currentUser = currentUser;
    }

    /** 404 employer.profile.missing until the employer saves the form the first time. */
    @GetMapping
    ProfileView get() {
        return profiles.findOwn(currentUser.id())
                .map(ProfileView::of)
                .orElseThrow(() -> ApiException.notFound("employer.profile.missing"));
    }

    /** Creates the profile the first time and updates it after that. */
    @PutMapping
    ProfileView save(@Valid @RequestBody ProfileRequest body) {
        return ProfileView.of(profiles.save(currentUser.id(), body.toDetails()));
    }

    /** A trade licence or NID (JPEG, PNG or PDF up to 3 MB); sends the profile for review. */
    @PostMapping(path = "/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ProfileView uploadDocument(@RequestParam("file") MultipartFile file,
                               @RequestParam(defaultValue = "TRADE_LICENCE") Employer.DocumentType documentType) {
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read the upload", e);
        }
        return ProfileView.of(profiles.uploadDocument(currentUser.id(), content, file.getOriginalFilename(), documentType));
    }

    /** Sends the profile for review again, for example after fixing what the admin asked for. */
    @PostMapping("/submit")
    ProfileView submit() {
        return ProfileView.of(profiles.submit(currentUser.id()));
    }
}
