package com.docnest.service;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns raw OCR text from US tax documents into structured, box-level fields
 * (W-2 Box 1 wages, 1099-NEC Box 1 compensation, TINs, ...).
 *
 * OCR output of IRS forms is noisy, so every extraction is a best guess that a
 * preparer confirms in the review screen before it is sent to TaxSlayer Pro.
 */
@Component
public class TaxFieldExtractor {

    private static final Pattern SSN = Pattern.compile("\\b(\\d{3})[- ](\\d{2})[- ](\\d{4})\\b");
    private static final Pattern EIN = Pattern.compile("\\b(\\d{2})[- ](\\d{7})\\b");
    private static final Pattern AMOUNT = Pattern.compile("\\$?\\s?(\\d{1,3}(?:,\\d{3})+(?:\\.\\d{2})?|\\d+\\.\\d{2})");
    private static final Pattern PASSPORT_NO = Pattern.compile("(?i)passport\\s*(?:no\\.?|number|#)?\\s*[:\\-]?\\s*([A-Z0-9]{9})\\b");
    private static final Pattern DATE = Pattern.compile("\\b(\\d{1,2}\\s?[A-Za-z]{3}\\s?\\d{4}|\\d{2}/\\d{2}/\\d{4})\\b");
    private static final Pattern TAX_YEAR = Pattern.compile("\\b(20[1-3]\\d)\\b");

    /** How far after a box label we look for its dollar amount. */
    private static final int AMOUNT_WINDOW = 120;

    public Map<String, String> extract(String documentType, String ocrText) {
        Map<String, String> f = new LinkedHashMap<>();
        if (documentType == null || ocrText == null || ocrText.isBlank()) return f;
        String text = ocrText.replace('\r', ' ');

        switch (documentType.toUpperCase()) {
            case "W2", "W2_FORM" -> {
                putFirst(f, "employeeSsn", SSN, text);
                putFirst(f, "employerEin", EIN, text);
                putYear(f, text);
                putAmount(f, "box1Wages", text, "wages, tips, other comp", "wages tips other comp", "wages, tips");
                putAmount(f, "box2FederalWithheld", text, "federal income tax withheld", "federal income tax");
                putAmount(f, "box3SocialSecurityWages", text, "social security wages");
                putAmount(f, "box4SocialSecurityTax", text, "social security tax withheld");
                putAmount(f, "box5MedicareWages", text, "medicare wages and tips", "medicare wages");
                putAmount(f, "box6MedicareTax", text, "medicare tax withheld");
                putAmount(f, "box16StateWages", text, "state wages, tips", "state wages");
                putAmount(f, "box17StateTax", text, "state income tax");
            }
            case "FORM_1099NEC" -> {
                putFirst(f, "payerTin", EIN, text);
                putFirst(f, "recipientTin", SSN, text);
                putYear(f, text);
                putAmount(f, "box1NonemployeeComp", text, "nonemployee compensation");
                putAmount(f, "box4FederalWithheld", text, "federal income tax withheld");
            }
            case "FORM_1099_MISC" -> {
                putFirst(f, "payerTin", EIN, text);
                putFirst(f, "recipientTin", SSN, text);
                putYear(f, text);
                putAmount(f, "box1Rents", text, "rents");
                putAmount(f, "box2Royalties", text, "royalties");
                putAmount(f, "box3OtherIncome", text, "other income");
                putAmount(f, "box4FederalWithheld", text, "federal income tax withheld");
            }
            case "SSN_CARD" -> putFirst(f, "ssn", SSN, text);
            case "US_PASSPORT" -> {
                Matcher m = PASSPORT_NO.matcher(text);
                if (m.find()) f.put("passportNumber", m.group(1));
                Matcher d = DATE.matcher(text);
                String last = null;
                while (d.find()) last = d.group(1);
                if (last != null) f.put("expirationDate", last);
            }
            default -> { }
        }
        return f;
    }

    /** Masks SSNs/TINs for display: 123-45-6789 → ***-**-6789. */
    public static String mask(String key, String value) {
        if (value == null) return null;
        String k = key.toLowerCase();
        if ((k.contains("ssn") || k.equals("recipienttin")) && value.length() >= 4) {
            return "***-**-" + value.substring(value.length() - 4);
        }
        return value;
    }

    private void putFirst(Map<String, String> f, String key, Pattern p, String text) {
        Matcher m = p.matcher(text);
        if (m.find()) f.put(key, String.join("-", groups(m)));
    }

    private void putYear(Map<String, String> f, String text) {
        Matcher m = TAX_YEAR.matcher(text);
        if (m.find()) f.put("taxYear", m.group(1));
    }

    private void putAmount(Map<String, String> f, String key, String text, String... labels) {
        String lower = text.toLowerCase();
        for (String label : labels) {
            int idx = lower.indexOf(label);
            if (idx < 0) continue;
            int from = idx + label.length();
            String window = text.substring(from, Math.min(text.length(), from + AMOUNT_WINDOW));
            Matcher m = AMOUNT.matcher(window);
            if (m.find()) {
                f.put(key, m.group(1).replace(",", ""));
                return;
            }
        }
    }

    private String[] groups(Matcher m) {
        String[] g = new String[m.groupCount()];
        for (int i = 0; i < g.length; i++) g[i] = m.group(i + 1);
        return g;
    }
}
