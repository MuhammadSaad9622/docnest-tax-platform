package com.docnest.security;

import com.docnest.entity.Client;
import com.docnest.entity.User;
import com.docnest.exception.ResourceNotFoundException;
import com.docnest.repository.ClientRepository;
import com.docnest.repository.FamilyMemberRepository;
import com.docnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

/**
 * Tenant isolation for the service bureau: staff may only touch clients that
 * belong to an office they can see, and portal clients only their own record.
 */
@Component
@RequiredArgsConstructor
public class AccessGuard {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final FamilyMemberRepository familyMemberRepository;

    public boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * Resolves which offices the current user can see.
     *  - ADMIN → empty list = no restriction
     *  - MANAGER → own office (if assigned) + all supervised offices
     *  - EMPLOYEE → own assigned office only
     *  - If no offices resolve, return null = unrestricted (graceful fallback)
     */
    public List<Long> resolveVisibleOffices(Authentication auth) {
        if (auth == null || isAdmin(auth)) return new ArrayList<>();
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) return null;

        if (user.getRole() == User.Role.MANAGER) {
            List<Long> offices = new ArrayList<>();
            if (user.getAssignedOffice() != null) offices.add(user.getAssignedOffice());
            if (user.getSupervisedOffices() != null) {
                user.getSupervisedOffices().forEach(loc -> offices.add(loc.getId()));
            }
            return offices.isEmpty() ? null : offices;
        }

        if (user.getRole() == User.Role.EMPLOYEE) {
            return user.getAssignedOffice() != null
                    ? List.of(user.getAssignedOffice())
                    : null;
        }

        return null;
    }

    /** Throws 403 unless the caller may access this client. */
    public void checkClient(Authentication auth, Long clientId) {
        if (isAdmin(auth)) return;
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (user.getRole() == User.Role.CLIENT) {
            if (user.getLinkedClient() == null || !user.getLinkedClient().getId().equals(clientId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your record");
            }
            return;
        }

        List<Long> offices = resolveVisibleOffices(auth);
        if (offices == null || offices.isEmpty()) return;
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId));
        Long officeId = client.getLocation() != null ? client.getLocation().getId() : null;
        if (officeId == null || !offices.contains(officeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Client belongs to another office");
        }
    }

    /** Throws 403 unless the caller may access documents of this owner. */
    public void checkOwner(Authentication auth, String ownerType, Long ownerId) {
        if ("FAMILY_MEMBER".equalsIgnoreCase(ownerType)) {
            Long clientId = familyMemberRepository.findById(ownerId)
                    .map(m -> m.getClient().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Family member not found: " + ownerId));
            checkClient(auth, clientId);
        } else {
            checkClient(auth, ownerId);
        }
    }
}
