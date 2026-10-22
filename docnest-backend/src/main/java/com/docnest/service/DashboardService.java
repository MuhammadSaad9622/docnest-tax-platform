package com.docnest.service;

import com.docnest.dto.DashboardStatsDTO;
import com.docnest.dto.ClientDTO;
import com.docnest.entity.Location;
import com.docnest.repository.ClientRepository;
import com.docnest.repository.DocumentRepository;
import com.docnest.repository.FamilyMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClientRepository clientRepository;
    private final DocumentRepository documentRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final ActivityService activityService;
    private final ClientService clientService;

    /** Backward-compatible: unrestricted stats */
    public DashboardStatsDTO getStats() {
        return getStats(null);
    }

    /**
     * officeIds = null → unrestricted (ADMIN).
     * officeIds = non-empty → only counts from those offices.
     */
    public DashboardStatsDTO getStats(List<Long> officeIds) {
        boolean scoped = officeIds != null && !officeIds.isEmpty();

        long totalClients   = scoped ? clientRepository.countByLocationIdIn(officeIds) : clientRepository.count();
        long totalDocuments = documentRepository.count();
        long totalFamilyMembers = familyMemberRepository.count();
        long missingDocs    = scoped ? clientRepository.countScopedClientsWithMissingDocuments(officeIds)
                                     : clientRepository.countClientsWithMissingDocuments();
        long recentClients  = scoped
                ? clientRepository.countByCreatedAtAfterAndLocationIdIn(
                        LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0), officeIds)
                : clientRepository.countByCreatedAtAfter(
                        LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0));

        long totalFamilies = totalFamilyMembers > 0 ? totalClients : 0;

        Map<String, Long> docsByType = new LinkedHashMap<>();
        for (Object[] row : documentRepository.countByDocumentType()) {
            docsByType.put(row[0].toString(), (Long) row[1]);
        }

        List<ClientDTO> recentClientList = clientService.getRecentClients(officeIds);

        return DashboardStatsDTO.builder()
                .totalClients(totalClients)
                .totalFamilies(totalFamilies)
                .totalDocuments(totalDocuments)
                .totalFamilyMembers(totalFamilyMembers)
                .missingDocumentClients(missingDocs)
                .recentClientsThisMonth(recentClients)
                .documentsByType(docsByType)
                .recentActivities(activityService.getRecentActivitiesAsDTO())
                .recentClients(recentClientList)
                .build();
    }
}
