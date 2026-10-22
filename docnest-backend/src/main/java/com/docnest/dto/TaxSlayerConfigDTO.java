package com.docnest.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxSlayerConfigDTO {
    private String apiKey;
    private String apiBaseUrl;
    private String firmId;
    private Integer taxYear;
    private String connectionStatus;
    private String lastCheckedAt;
}
