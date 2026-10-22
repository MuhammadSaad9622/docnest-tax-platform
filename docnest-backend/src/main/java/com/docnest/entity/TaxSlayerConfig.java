package com.docnest.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Stores TaxSlayer Pro integration configuration.
 * Single row (id=1) is updated via Settings UI.
 */
@Entity
@Table(name = "taxslayer_config", uniqueConstraints = @UniqueConstraint(columnNames = "row_key"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxSlayerConfig {

    @Id
    @Column(name = "row_key")
    private Integer rowKey = 1;

    /** API key or client identifier from TaxSlayer Pro developer portal */
    @Column(name = "api_key", length = 512)
    private String apiKey;

    /** TaxSlayer Pro API base URL */
    @Column(name = "api_base_url", length = 512)
    private String apiBaseUrl;

    /** Office/firm identifier in TaxSlayer Pro service bureau system */
    @Column(name = "firm_id", length = 100)
    private String firmId;

    /** Tax year the integration targets (e.g. 2026) */
    @Column(name = "tax_year")
    private Integer taxYear;

    /** Connection status: DISCONNECTED, CONNECTED, ERROR */
    @Column(name = "connection_status", length = 20)
    @Builder.Default
    private String connectionStatus = "DISCONNECTED";

    /** Timestamp of last successful/failed connection check */
    @Column(name = "last_checked_at")
    private String lastCheckedAt;
}
