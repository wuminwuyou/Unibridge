package com.example.demo.media;

import com.example.demo.common.Result;
import com.example.demo.media.service.MediaUploadService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 本地多媒体上传 API（安全检测 + MD5 秒传）。
 */
@RestController
@RequestMapping({"/api/v1/client/uploads", "/api/uploads"})
public class MediaUploadController {

    private final MediaUploadService mediaUploadService;

    public MediaUploadController(MediaUploadService mediaUploadService) {
        this.mediaUploadService = mediaUploadService;
    }

    @GetMapping("/check-md5")
    public Result checkMd5(@RequestParam("md5") String md5) {
        return Result.success(mediaUploadService.checkMd5(md5));
    }

    @PostMapping("/note-cover")
    public Result uploadNoteCover(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        return Result.success(mediaUploadService.uploadNoteCover(file, request));
    }

    @PostMapping("/note-video")
    public Result uploadNoteVideo(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        return Result.success(mediaUploadService.uploadNoteVideo(file, request));
    }
}
