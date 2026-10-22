package com.docnest.controller;

import com.docnest.dto.UserDTO;
import com.docnest.dto.UserUpdateRequest;
import com.docnest.entity.Client;
import com.docnest.entity.Location;
import com.docnest.entity.User;
import com.docnest.repository.ClientRepository;
import com.docnest.repository.LocationRepository;
import com.docnest.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final LocationRepository locationRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> listUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id,
                                              @Valid @RequestBody UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        if (request.getRole() != null) {
            user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        if (request.getAssignedOffice() != null) {
            user.setAssignedOffice(request.getAssignedOffice());
        }
        if (request.getLinkedClient() != null) {
            user.setLinkedClient(
                    clientRepository.findById(request.getLinkedClient())
                            .orElse(null)
            );
        }
        if (request.getSupervisedOffices() != null) {
            List<Location> offices = new ArrayList<>();
            for (Long officeId : request.getSupervisedOffices()) {
                offices.add(locationRepository.findById(officeId).orElse(null));
            }
            user.setSupervisedOffices(offices);
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(toDTO(saved));
    }

    private UserDTO toDTO(User u) {
        List<Long> supervisedIds = u.getSupervisedOffices() == null
                ? new ArrayList<>()
                : u.getSupervisedOffices().stream().map(Location::getId).collect(Collectors.toList());
        return UserDTO.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .role(u.getRole().name())
                .enabled(u.isEnabled())
                .assignedOffice(u.getAssignedOffice())
                .linkedClient(u.getLinkedClient() != null ? u.getLinkedClient().getId() : null)
                .supervisedOffices(supervisedIds)
                .build();
    }
}
