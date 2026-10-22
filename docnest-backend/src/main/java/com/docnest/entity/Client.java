package com.docnest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "mobile", nullable = false, length = 15)
    private String mobile;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "email", length = 150)
    private String email;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id")
    private Location location;

    /** TaxSlayer Pro sync: null (never sent), SYNCED, FAILED */
    @Column(name = "taxslayer_status", length = 20)
    private String taxslayerStatus;

    @Column(name = "taxslayer_reference", length = 100)
    private String taxslayerReference;

    @Column(name = "taxslayer_synced_at")
    private LocalDateTime taxslayerSyncedAt;

    @Column(name = "taxslayer_message", length = 500)
    private String taxslayerMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<FamilyMember> familyMembers = new ArrayList<>();
}
