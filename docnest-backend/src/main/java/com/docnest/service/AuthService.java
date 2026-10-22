package com.docnest.service;

import com.docnest.dto.*;
import com.docnest.entity.Client;
import com.docnest.entity.Location;
import com.docnest.entity.User;
import com.docnest.exception.ResourceNotFoundException;
import com.docnest.repository.ClientRepository;
import com.docnest.repository.LocationRepository;
import com.docnest.repository.UserRepository;
import com.docnest.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private LocationRepository locationRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        if (request.getConfirmPassword() != null
                && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        boolean isClient = "CLIENT".equalsIgnoreCase(request.getRole());

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        if (isClient) {
            // Client self-service: create the role + an auto-linked client record
            user.setRole(User.Role.CLIENT);
            user.setLinkedClient(buildClientFromIntake(request, user));
        } else {
            // Staff self-registration → always EMPLOYEE. Roles are granted by ADMIN.
            user.setRole(User.Role.EMPLOYEE);
        }

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getAssignedOffice());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .assignedOffice(user.getAssignedOffice())
                .expiresIn(jwtUtil.getExpiration())
                .build();
    }

    /**
     * Builds the auto-linked Client record from a CLIENT's sign-up intake.
     * Falls back to the first seeded location if the supplied locationName doesn't match.
     */
    private Client buildClientFromIntake(RegisterRequest request, User user) {
        String fullName = defaultString(user.getFullName(), "Client");
        String firstName = notBlank(request.getFirstName(), fullName.split(" ")[0]);
        String lastName  = notBlank(request.getLastName(), fullName.length() > 1 ? fullName.substring(fullName.indexOf(' ') + 1) : "");

        Location location = request.getLocationName() != null && !request.getLocationName().isBlank()
                ? locationRepository.findByLocationNameIgnoreCase(request.getLocationName())
                    .orElseGet(() -> locationRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("No locations seeded")))
                : locationRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("No locations seeded"));

        Client client = Client.builder()
                .firstName(firstName)
                .lastName(lastName)
                .mobile(notBlank(request.getMobile(), user.getEmail().split("@")[0]))
                .dob(request.getDob())
                .gender(request.getGender())
                .address(request.getAddress())
                .email(user.getEmail())
                .location(location)
                .build();
        return clientRepository.save(client);
    }

    private static String notBlank(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private static String defaultString(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail(), user.getAssignedOffice());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .assignedOffice(user.getAssignedOffice())
                .expiresIn(jwtUtil.getExpiration())
                .build();
    }

    public UserDTO getCurrentUser(String bearerToken) {
        try {
            String token = bearerToken.replace("Bearer ", "");
            String email = jwtUtil.extractEmail(token);

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            return UserDTO.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .enabled(user.isEnabled())
                    .assignedOffice(user.getAssignedOffice())
                    .linkedClient(user.getLinkedClient() != null ? user.getLinkedClient().getId() : null)
                    .build();
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new SecurityException("Invalid or expired token");
        }
    }
}
