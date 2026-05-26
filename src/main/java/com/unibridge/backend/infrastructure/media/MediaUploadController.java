package com.unibridge.backend.infrastructure.media;

import com.unibridge.backend.infrastructure.common.Result;
import com.unibridge.backend.infrastructure.media.service.MediaUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Client - 媒体上传", description = "笔记封面/视频上传与 MD5 秒传检测")
@RestController
@RequestMapping({"/api/v1/client/uploads", "/api/uploads"})
public class MediaUploadController {

    private final MediaUploadService mediaUploadService;

    public MediaUploadController(MediaUploadService mediaUploadService) {
        this.mediaUploadService = mediaUploadService;
    }

    @Operation(summary = "MD5 秒传检测", description = "上传前检查文件是否已存在")
    @GetMapping("/check-md5")
    public Result checkMd5(
            @Parameter(description = "文件 MD5 哈希", required = true)
            @RequestParam("md5") String md5) {
        return Result.success(mediaUploadService.checkMd5(md5));
    }

    @Operation(summary = "上传笔记封面")
    @PostMapping("/note-cover")
    public Result uploadNoteCover(
            @Parameter(description = "图片文件", required = true)
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        return Result.success(mediaUploadService.uploadNoteCover(file, request));
    }

    @Operation(summary = "上传笔记视频")
    @PostMapping("/note-video")
    public Result uploadNoteVideo(
            @Parameter(description = "视频文件", required = true)
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        return Result.success(mediaUploadService.uploadNoteVideo(file, request));
    }
}
