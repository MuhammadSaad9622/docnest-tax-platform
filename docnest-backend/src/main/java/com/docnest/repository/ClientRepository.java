package com.docnest.repository;

import com.docnest.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByMobile(String mobile);

    boolean existsByMobileAndIdNot(String mobile, Long id);

    @Query("SELECT c FROM Client c WHERE " +
            "(:query IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "c.mobile LIKE CONCAT('%', :query, '%')) AND " +
            "(:locationId IS NULL OR c.location.id = :locationId) AND " +
            "(:officeIds IS NULL OR c.location.id IN :officeIds)")
    Page<Client> searchClients(@Param("query") String query,
                                @Param("locationId") Long locationId,
                                @Param("officeIds") Collection<Long> officeIds,
                                Pageable pageable);

    List<Client> findTop5ByOrderByCreatedAtDesc();

    List<Client> findTop5ByLocationIdInOrderByCreatedAtDesc(Collection<Long> officeIds);

    long countByCreatedAtAfter(LocalDateTime date);

    long countByLocationIdIn(Collection<Long> officeIds);

    long countByCreatedAtAfterAndLocationIdIn(LocalDateTime date, Collection<Long> officeIds);

    @Query("SELECT COUNT(DISTINCT c) FROM Client c WHERE " +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'AADHAR') OR " +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'PAN') OR " +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'DRIVING_LICENSE') OR " +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'ELECTRICITY_BILL')")
    long countClientsWithMissingDocuments();

    @Query("SELECT COUNT(DISTINCT c) FROM Client c WHERE " +
            "c.location.id IN :officeIds AND (" +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'AADHAR') OR " +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'PAN') OR " +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'DRIVING_LICENSE') OR " +
            "NOT EXISTS (SELECT d FROM Document d WHERE d.ownerType = 'CLIENT' AND d.ownerId = c.id AND d.documentType = 'ELECTRICITY_BILL'))")
    long countScopedClientsWithMissingDocuments(@Param("officeIds") Collection<Long> officeIds);
}
