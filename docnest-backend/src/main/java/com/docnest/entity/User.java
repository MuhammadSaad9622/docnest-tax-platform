package com.docnest.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.EMPLOYEE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean enabled = true;

    /**
     * Lightweight office scoping. Null = no office restriction (ADMIN sees all).
     * Non-null = user is restricted to this office's clients.
     */
    @Column(name = "assigned_office")
    private Long assignedOffice;

    /**
     * For MANAGER role: the set of offices this manager supervises.
     * A manager sees clients across all their supervised offices.
     * Emps see only their assigned office; admins see everything.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_supervised_offices",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "office_id")
    )
    private List<Location> supervisedOffices = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_client_id")
    private Client linkedClient;

    public enum Role {
        ADMIN, MANAGER, EMPLOYEE, CLIENT
    }
}
