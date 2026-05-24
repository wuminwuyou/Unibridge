package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.service.MediaUploadService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 本地多媒体上传接口（MD5 去重秒传版）。
 * <p>
 * 上传流程：multipart 接收 → MD5 指纹 → 查 {@code file_records} 秒传 / 落盘入库 → 返回 URL。
 * </p>
 *
 * <h3>秒传预检</h3>
 * <ul>
 *   <li>{@code GET /api/uploads/check-md5?md5=32位小写十六进制}</li>
 *   <li>命中返回 {@code {"exists":true,"filePath":"..."}}，前端可跳过实际上传</li>
 * </ul>
 *
 * <h3>Postman / Apifox 调试要点</h3>
 * <ul>
 *   <li>封面：{@code POST http://localhost:8081/api/uploads/note-cover}，form-data Key={@code file}</li>
 *   <li>视频：{@code POST http://localhost:8081/api/uploads/note-video}</li>
 *   <li>同一文件重复上传应秒传，日志含 {@code skippedDiskWrite=true}</li>
 * </ul>
 */
@RestController
@RequestMapping({"/api/v1/client/uploads", "/api/uploads"})
public class MediaUploadController {

    private final MediaUploadService mediaUploadService;

    public MediaUploadController(MediaUploadService mediaUploadService) {
        this.mediaUploadService = mediaUploadService;
    }

    /**
     * 秒传预检：大文件上传前先校验 MD5 是否已存在。
     * <p>
     * 示例：{@code GET /api/uploads/check-md5?md5=d41d8cd98f00b204e9800998ecf8427e}
     * </p>
     */
    @GetMapping("/check-md5")
    public Result checkMd5(@RequestParam("md5") String md5) {
        return Result.success(mediaUploadService.checkMd5(md5));
    }

    /**
     * 上传笔记封面图（含 MD5 去重秒传）。
     */
    @PostMapping("/note-cover")
    public Result uploadNoteCover(@RequestParam("file") MultipartFile file) {
        String publicUrl = mediaUploadService.uploadNoteCover(file);
        return Result.success(publicUrl);
    }

    /**
     * 上传笔记视频（含 MD5 去重秒传）。
     */
    @PostMapping("/note-video")
    public Result uploadNoteVideo(@RequestParam("file") MultipartFile file) {
        String publicUrl = mediaUploadService.uploadNoteVideo(file);
        return Result.success(publicUrl);
    }
}
