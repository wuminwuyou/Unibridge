package com.example.demo.media.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** GET /uploads/check-md5 秒传预检响应。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMd5CheckResponse {
    private Boolean exists;
    private String filePath;
}
