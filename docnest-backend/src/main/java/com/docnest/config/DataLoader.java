package com.docnest.config;

import com.docnest.entity.*;
import com.docnest.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final LocationRepository locationRepository;
    private final FormFieldConfigRepository formFieldRepo;
    private final DocumentTypeConfigRepository docTypeRepo;
    private final AdminProfileRepository profileRepo;
    private final SystemPreferenceRepository prefRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    private static final List<String> DEFAULT_LOCATIONS = List.of(
            "Thane", "Navi Mumbai", "Mumbai",
            "Pune", "Nashik", "Aurangabad",
            "Nagpur", "Kolhapur", "Solapur"
    );

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedLocations();
        seedFormFields();
        seedDocumentTypes();
        seedAdminProfile();
        seedPreferences();
        log.info("DocNest started successfully. All seeds applied.");
    }

    private void seedAdminUser() {
        if (!userRepo.existsByEmail("admin@docnest.com")) {
            User admin = new User();
            admin.setFullName("DocNest Admin");
            admin.setEmail("admin@docnest.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(User.Role.ADMIN);
            admin.setEnabled(true);
            userRepo.save(admin);
            log.info("Seeded default ADMIN user: admin@docnest.com / admin123");
        }
        if (!userRepo.existsByEmail("manager@docnest.com")) {
            User manager = new User();
            manager.setFullName("Team Manager");
            manager.setEmail("manager@docnest.com");
            manager.setPassword(passwordEncoder.encode("manager123"));
            manager.setRole(User.Role.MANAGER);
            manager.setEnabled(true);
            userRepo.save(manager);
            log.info("Seeded default MANAGER user: manager@docnest.com / manager123");
        }
        if (!userRepo.existsByEmail("employee@docnest.com")) {
            User employee = new User();
            employee.setFullName("Staff Employee");
            employee.setEmail("employee@docnest.com");
            employee.setPassword(passwordEncoder.encode("employee123"));
            employee.setRole(User.Role.EMPLOYEE);
            employee.setEnabled(true);
            userRepo.save(employee);
            log.info("Seeded default EMPLOYEE user: employee@docnest.com / employee123");
        }
    }

    private void seedLocations() {
        for (String name : DEFAULT_LOCATIONS) {
            if (!locationRepository.existsByLocationNameIgnoreCase(name)) {
                locationRepository.save(Location.builder().locationName(name).build());
            }
        }
    }

    private void seedFormFields() {
        if (formFieldRepo.count() > 0) return;
        List<FormFieldConfig> fields = List.of(
            FormFieldConfig.builder().fieldName("firstName").label("First Name").description("Client's first name").fieldType("TEXT").isVisible(true).isRequired(true).displayOrder(1).build(),
            FormFieldConfig.builder().fieldName("lastName").label("Last Name").description("Client's last name").fieldType("TEXT").isVisible(true).isRequired(true).displayOrder(2).build(),
            FormFieldConfig.builder().fieldName("mobile").label("Mobile Number").description("10-digit contact number").fieldType("TEXT").isVisible(true).isRequired(true).displayOrder(3).build(),
            FormFieldConfig.builder().fieldName("dob").label("Date of Birth").description("Client's date of birth").fieldType("DATE").isVisible(true).isRequired(false).displayOrder(4).build(),
            FormFieldConfig.builder().fieldName("gender").label("Gender").description("Client's gender identity").fieldType("SELECT").isVisible(true).isRequired(false).displayOrder(5).build(),
            FormFieldConfig.builder().fieldName("locationId").label("Primary Location").description("Office location assignment").fieldType("SELECT").isVisible(true).isRequired(true).displayOrder(6).build(),
            FormFieldConfig.builder().fieldName("email").label("Email Address").description("Client's email for communication").fieldType("TEXT").isVisible(true).isRequired(false).displayOrder(7).build(),
            FormFieldConfig.builder().fieldName("address").label("Full Address").description("Residential address").fieldType("TEXTAREA").isVisible(true).isRequired(false).displayOrder(8).build()
        );
        formFieldRepo.saveAll(fields);
        log.info("Seeded {} form field configs", fields.size());
    }

    private void seedDocumentTypes() {
        if (docTypeRepo.count() == 0) {
            List<DocumentTypeConfig> base = List.of(
                DocumentTypeConfig.builder().typeName("AADHAR").displayName("Aadhar Card").description("Aadhaar identity document").isRequired(true).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("PAN").displayName("PAN Card").description("Permanent Account Number card").isRequired(true).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("DRIVING_LICENSE").displayName("Driving License").description("Government driving permit").isRequired(true).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("ELECTRICITY_BILL").displayName("Electricity Bill").description("Address proof utility bill").isRequired(true).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("W2").displayName("W-2 Form").description("Wage and Tax Statement (US)").isRequired(false).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("FORM_1099NEC").displayName("1099-NEC").description("Nonemployee Compensation (US)").isRequired(false).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("FORM_1099_MISC").displayName("1099-MISC").description("Miscellaneous Income (US)").isRequired(false).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("SSN_CARD").displayName("SSN Card").description("Social Security Card (US)").isRequired(false).isActive(true).build(),
                DocumentTypeConfig.builder().typeName("US_PASSPORT").displayName("US Passport").description("United States Passport (US)").isRequired(false).isActive(true).build()
            );
            docTypeRepo.saveAll(base);
            log.info("Seeded {} document type configs", base.size());
        }
    }

    private void seedAdminProfile() {
        if (profileRepo.count() > 0) return;
        profileRepo.save(AdminProfile.builder()
                .fullName("Om Raj")
                .email("admin@docnest.com")
                .mobile("9876543210")
                .build());
        log.info("Seeded admin profile");
    }

    private void seedPreferences() {
        if (prefRepo.count() > 0) return;
        List<SystemPreference> prefs = List.of(
            SystemPreference.builder().prefKey("enable_doc_preview").prefValue("true").description("Enable inline document preview").build(),
            SystemPreference.builder().prefKey("enable_activity_logs").prefValue("true").description("Record all user activities").build(),
            SystemPreference.builder().prefKey("enable_notifications").prefValue("true").description("Show system notifications").build(),
            SystemPreference.builder().prefKey("default_page_size").prefValue("10").description("Default rows per page").build(),
            SystemPreference.builder().prefKey("enable_upload_compression").prefValue("false").description("Compress uploaded images").build()
        );
        prefRepo.saveAll(prefs);
        log.info("Seeded {} system preferences", prefs.size());
    }
}
