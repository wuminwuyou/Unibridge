package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GET /uploads/check-md5 秒传预检响应。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMd5CheckResponse {
    /** 该 MD5 是否已在资产库中 */
    private Boolean exists;
    /** 已存在时返回可直链访问的 URL；不存在时为 {@code null} */
    private String filePath;
}
