/**
 * Employer module · feature M1-3: employer profile and verification.
 * <p>
 * Employers create a business profile (name, type, address, contact person) and upload a trade licence or national
 * ID. Admins approve or reject it; approved employers get a "Verified" badge on all their job posts.
 * <p>
 * Other modules use only this package: {@link app.kaaj.employer.EmployerDirectory} to look employers up (the job
 * module puts {@link app.kaaj.employer.EmployerSummary#verified()} on every job post as the badge), and the
 * {@link app.kaaj.employer.EmployerVerified} / {@link app.kaaj.employer.EmployerRejected} events.
 * Everything in {@code internal} is private to this module.
 * <p>
 * MVC inside {@code internal}: Model = {@code Employer}, {@code EmployerRepository}, the two services;
 * View = the JSON records in {@code EmployerViews}; Controller = {@code EmployerProfileController},
 * {@code AdminEmployerController}.
 */
package app.kaaj.employer;
