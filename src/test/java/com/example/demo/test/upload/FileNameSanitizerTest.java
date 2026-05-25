package com.example.demo.test.upload;

import com.unibridge.backend.infrastructure.security.upload.FileNameSanitizer;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FileNameSanitizerTest {

    @Test
    void removesPathTraversalAndSpecialChars() {
        assertEquals("evil_script_.jpg", FileNameSanitizer.sanitize("../../evil<script>.jpg"));
        assertEquals("upload.bin", FileNameSanitizer.sanitize("../"));
    }

    @Test
    void extractExtension() {
        assertEquals("png", FileNameSanitizer.extractExtension("photo.png"));
        assertEquals("", FileNameSanitizer.extractExtension("noext"));
    }
}
