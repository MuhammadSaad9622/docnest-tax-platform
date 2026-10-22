package com.docnest.controller;

import com.docnest.service.ImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")

public class ImportController {

    private final ImportService importService;

    @PostMapping("/excel")
    public ResponseEntity<Map<String, Object>> importExcel(
            @RequestParam("file") MultipartFile file) throws IOException {
        ImportService.ImportResult result = importService.importFromExcel(file);
        return ResponseEntity.ok(Map.of(
                "totalRows", result.totalRows,
                "imported",  result.imported,
                "failed",    result.failed,
                "successRows", result.successRows,
                "errorRows",   result.errorRows
        ));
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        byte[] template = importService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"client_import_template.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }
}
