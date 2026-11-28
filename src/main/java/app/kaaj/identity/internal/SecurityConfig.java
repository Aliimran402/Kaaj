package app.kaaj.identity.internal;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;

@Configuration
class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, GoogleLoginSuccessHandler googleSuccess) throws Exception {
        http
            .csrf(csrf -> csrf.spa())   // XSRF-TOKEN cookie -> X-XSRF-TOKEN header
            // The admin verification page shows an uploaded PDF in a frame from this same site (never another one).
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/employer/**").hasRole("EMPLOYER")
                .requestMatchers(HttpMethod.GET, "/api/v1/jobs/**", "/api/v1/taxonomy/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll())   // web app, Swagger UI, OAuth2 endpoints
            .oauth2Login(oauth -> oauth
                .loginPage("/login")
                .successHandler(googleSuccess))
            .logout(logout -> logout
                .logoutUrl("/api/v1/auth/logout")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
            .exceptionHandling(e -> e
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));  // 401, not a redirect
        return http.build();
    }
}