package com.docnest.service;

import com.docnest.entity.Client;
import com.docnest.entity.Document;
import com.docnest.entity.TaxIntake;
import com.docnest.entity.TaxSlayerConfig;
import com.docnest.exception.ResourceNotFoundException;
import com.docnest.repository.ClientRepository;
import com.docnest.repository.DocumentRepository;
import com.docnest.repository.TaxSlayerConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Bridge between DocNest and TaxSlayer Pro.
 *
 * Two routes, so offices are never blocked on API access:
 *  1. CSV export in a flat one-row-per-taxpayer layout that preparers import
 *     into TaxSlayer Pro (works today, no credentials needed).
 *  2. Direct push of a JSON return package to the TaxSlayer Pro partner endpoint
 *     configured in Settings, using the service bureau's developer API key.
 */
@Service
@RequiredArgsConstructor
public class TaxSlayerService {

    private final ClientRepository clientRepository;
    private final DocumentRepository documentRepository;
    private final TaxSlayerConfigRepository configRepository;
    private final DocumentService documentService;
    private final TaxIntakeService taxIntakeService;
    private final ActivityService activityService;

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    static final List<String> CSV_COLUMNS = List.of(
            "ClientId", "TaxYear", "FirstName", "LastName", "SSN", "DOB", "Email", "Phone", "Address",
            "FilingStatus", "SpouseFirstName", "SpouseLastName", "Dependents", "RefundMethod",
            "W2Count", "W2Wages", "W2FederalWithheld", "W2StateWages", "W2StateWithheld",
            "NECCount", "NECCompensation", "MISCRents", "MISCRoyalties", "MISCOtherIncome", "Form1099FederalWithheld",
            "EmployerEINs", "IntakeStatus", "UnverifiedDocuments");

    /** Full return package for one taxpayer, with unmasked identifiers. */
    public Map<String, Object> buildReturn(Long clientId) {
        Client c = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId));
        TaxSlayerConfig cfg = config();
        int taxYear = cfg.getTaxYear() != null ? cfg.getTaxYear() : TaxIntakeService.currentTaxYear();
        TaxIntake intake = taxIntakeService.get(clientId, taxYear);
        List<Document> docs = documentRepository.findByOwnerTypeAndOwnerId("CLIENT", clientId);

        List<Map<String, String>> w2s = new ArrayList<>();
        List<Map<String, String>> necs = new ArrayList<>();
        List<Map<String, String>> miscs = new ArrayList<>();
        String ssn = null;
        int unverified = 0;
        for (Document d : docs) {
            Map<String, String> f = documentService.readFields(d);
            if ("NEEDS_REVIEW".equals(d.getReviewStatus())) unverified++;
            switch (d.getDocumentType()) {
                case "W2", "W2_FORM" -> { w2s.add(f); if (ssn == null) ssn = f.get("employeeSsn"); }
                case "FORM_1099NEC" -> { necs.add(f); if (ssn == null) ssn = f.get("recipientTin"); }
                case "FORM_1099_MISC" -> { miscs.add(f); if (ssn == null) ssn = f.get("recipientTin"); }
                case "SSN_CARD" -> { if (f.get("ssn") != null) ssn = f.get("ssn"); }
                default -> { }
            }
        }

        Map<String, Object> taxpayer = new LinkedHashMap<>();
        taxpayer.put("firstName", c.getFirstName());
        taxpayer.put("lastName", c.getLastName());
        taxpayer.put("ssn", ssn);
        taxpayer.put("dateOfBirth", c.getDob() != null ? c.getDob().toString() : null);
        taxpayer.put("email", c.getEmail());
        taxpayer.put("phone", c.getMobile());
        taxpayer.put("address", c.getAddress());
        taxpayer.put("occupation", intake.getOccupation());

        Map<String, Object> spouse = new LinkedHashMap<>();
        spouse.put("firstName", intake.getSpouseFirstName());
        spouse.put("lastName", intake.getSpouseLastName());
        spouse.put("occupation", intake.getSpouseOccupation());

        Map<String, Object> ret = new LinkedHashMap<>();
        ret.put("source", "DocNest");
        ret.put("firmId", cfg.getFirmId());
        ret.put("office", c.getLocation() != null ? c.getLocation().getLocationName() : null);
        ret.put("externalClientId", c.getId());
        ret.put("taxYear", taxYear);
        ret.put("filingStatus", intake.getFilingStatus());
        ret.put("taxpayer", taxpayer);
        ret.put("spouse", spouse);
        ret.put("dependentsCount", intake.getDependentsCount());
        ret.put("refundMethod", intake.getRefundMethod());
        ret.put("incomeSources", intake.getIncomeSources());
        ret.put("w2", w2s);
        ret.put("form1099Nec", necs);
        ret.put("form1099Misc", miscs);

        Map<String, Object> readiness = new LinkedHashMap<>();
        readiness.put("intakeStatus", intake.getId() == null ? "NOT_STARTED" : intake.getStatus());
        readiness.put("documents", docs.size());
        readiness.put("unverifiedDocuments", unverified);
        readiness.put("ssnFound", ssn != null);
        readiness.put("ready", "SUBMITTED".equals(intake.getStatus()) && unverified == 0 && ssn != null);
        ret.put("readiness", readiness);

        Map<String, Object> sync = new LinkedHashMap<>();
        sync.put("status", c.getTaxslayerStatus());
        sync.put("reference", c.getTaxslayerReference());
        sync.put("syncedAt", c.getTaxslayerSyncedAt() != null ? c.getTaxslayerSyncedAt().toString() : null);
        sync.put("message", c.getTaxslayerMessage());
        ret.put("sync", sync);
        return ret;
    }

    /** One CSV row per client, ready for TaxSlayer Pro import. */
    @SuppressWarnings("unchecked")
    public String exportCsv(Collection<Long> clientIds) {
        StringBuilder sb = new StringBuilder(String.join(",", CSV_COLUMNS)).append("\n");
        for (Long id : clientIds) {
            Map<String, Object> r = buildReturn(id);
            Map<String, Object> tp = (Map<String, Object>) r.get("taxpayer");
            Map<String, Object> sp = (Map<String, Object>) r.get("spouse");
            Map<String, Object> rd = (Map<String, Object>) r.get("readiness");
            List<Map<String, String>> w2 = (List<Map<String, String>>) r.get("w2");
            List<Map<String, String>> nec = (List<Map<String, String>>) r.get("form1099Nec");
            List<Map<String, String>> misc = (List<Map<String, String>>) r.get("form1099Misc");

            List<Object> row = List.of(
                    id, r.get("taxYear"), tp.get("firstName"), tp.get("lastName"), nz(tp.get("ssn")),
                    nz(tp.get("dateOfBirth")), nz(tp.get("email")), nz(tp.get("phone")), nz(tp.get("address")),
                    nz(r.get("filingStatus")), nz(sp.get("firstName")), nz(sp.get("lastName")),
                    nz(r.get("dependentsCount")), nz(r.get("refundMethod")),
                    w2.size(), sum(w2, "box1Wages"), sum(w2, "box2FederalWithheld"),
                    sum(w2, "box16StateWages"), sum(w2, "box17StateTax"),
                    nec.size(), sum(nec, "box1NonemployeeComp"),
                    sum(misc, "box1Rents"), sum(misc, "box2Royalties"), sum(misc, "box3OtherIncome"),
                    sum(nec, "box4FederalWithheld").add(sum(misc, "box4FederalWithheld")),
                    String.join(" ", w2.stream().map(m -> m.getOrDefault("employerEin", "")).filter(s -> !s.isBlank()).toList()),
                    rd.get("intakeStatus"), rd.get("unverifiedDocuments"));
            sb.append(String.join(",", row.stream().map(TaxSlayerService::csv).toList())).append("\n");
        }
        return sb.toString();
    }

    /** POSTs the return package to the configured TaxSlayer Pro endpoint and records the outcome. */
    @Transactional
    public Map<String, Object> push(Long clientId) {
        TaxSlayerConfig cfg = config();
        if (isBlank(cfg.getApiBaseUrl()) || isBlank(cfg.getApiKey())) {
            throw new IllegalArgumentException("TaxSlayer Pro API URL and key are not configured. Use CSV export, or set them in Settings → TaxSlayer Pro.");
        }
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId));
        Map<String, Object> payload = buildReturn(clientId);
        payload.remove("sync");

        String status;
        String message;
        String reference = null;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(trimSlash(cfg.getApiBaseUrl()) + "/returns"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + cfg.getApiKey())
                    .header("Content-Type", "application/json")
                    .header("X-Firm-Id", cfg.getFirmId() == null ? "" : cfg.getFirmId())
                    .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 == 2) {
                status = "SYNCED";
                reference = parseReference(res.body());
                message = "Accepted by TaxSlayer Pro (HTTP " + res.statusCode() + ")";
            } else {
                status = "FAILED";
                message = "TaxSlayer Pro returned HTTP " + res.statusCode() + ": " + truncate(res.body(), 300);
            }
        } catch (Exception e) {
            status = "FAILED";
            message = "Could not reach TaxSlayer Pro: " + e.getMessage();
        }

        client.setTaxslayerStatus(status);
        client.setTaxslayerMessage(truncate(message, 500));
        client.setTaxslayerSyncedAt(LocalDateTime.now());
        if (reference != null) client.setTaxslayerReference(reference);
        clientRepository.save(client);
        activityService.log("TAXSLAYER_" + status,
                "TaxSlayer Pro push for " + client.getFirstName() + " " + client.getLastName() + ": " + message,
                "CLIENT", clientId);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", status);
        out.put("message", message);
        out.put("reference", client.getTaxslayerReference());
        return out;
    }

    /** Real reachability + credential check against the configured endpoint. */
    public String[] testConnection(TaxSlayerConfig cfg) {
        if (isBlank(cfg.getApiBaseUrl()) || isBlank(cfg.getApiKey())) {
            return new String[]{"DISCONNECTED", "API key and base URL must be set before testing."};
        }
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(cfg.getApiBaseUrl()))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + cfg.getApiKey())
                    .GET().build();
            int code = HTTP.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
            if (code == 401 || code == 403) return new String[]{"ERROR", "Endpoint reachable but the API key was rejected (HTTP " + code + ")."};
            if (code >= 500) return new String[]{"ERROR", "TaxSlayer Pro endpoint error (HTTP " + code + ")."};
            return new String[]{"CONNECTED", "TaxSlayer Pro endpoint reachable (HTTP " + code + ")."};
        } catch (Exception e) {
            return new String[]{"ERROR", "Could not reach endpoint: " + e.getMessage()};
        }
    }

    private TaxSlayerConfig config() {
        TaxSlayerConfig c = configRepository.findByRowKey(1);
        return c != null ? c : TaxSlayerConfig.builder().rowKey(1).build();
    }

    private static String parseReference(String body) {
        try {
            JsonNode n = JSON.readTree(body);
            for (String k : List.of("returnId", "id", "reference", "clientId")) {
                if (n.hasNonNull(k)) return n.get(k).asText();
            }
        } catch (Exception ignored) { }
        return null;
    }

    private static java.math.BigDecimal sum(List<Map<String, String>> forms, String key) {
        java.math.BigDecimal total = java.math.BigDecimal.ZERO;
        for (Map<String, String> f : forms) {
            String v = f.get(key);
            if (v == null) continue;
            try { total = total.add(new java.math.BigDecimal(v.replace(",", ""))); } catch (NumberFormatException ignored) { }
        }
        return total;
    }

    private static String csv(Object v) {
        String s = v == null ? "" : v.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) s = "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }

    private static Object nz(Object o) { return o == null ? "" : o; }
    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    private static String trimSlash(String s) { return s.endsWith("/") ? s.substring(0, s.length() - 1) : s; }
    private static String truncate(String s, int n) { return s == null ? "" : (s.length() > n ? s.substring(0, n) : s); }
}
