package com.unibridge.backend.domain.note;

import com.unibridge.backend.domain.note.dto.PublishNoteRequest;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Client - 笔记", description = "笔记发布、编辑与详情/草稿读取")
@RestController
@RequestMapping("/api/v1/client/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @Operation(summary = "创建笔记", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping
    public Result createNote(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody PublishNoteRequest request) {
        return Result.success(noteService.createNote(authorization, request));
    }

    @Operation(summary = "更新笔记", security = @SecurityRequirement(name = BEARER_AUTH))
    @PutMapping("/{uid}")
    public Result updateNote(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "笔记 UID（TX/VD+11）")
            @PathVariable String uid,
            @RequestBody PublishNoteRequest request) {
        return Result.success(noteService.updateNote(authorization, uid, request));
    }

    @Operation(summary = "笔记详情", description = "已发布笔记公开详情，含浏览计数")
    @GetMapping("/{uid}")
    public Result getNoteDetail(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String uid,
            HttpServletRequest request) {
        return Result.success(noteService.getNoteDetail(authorization, uid, request));
    }

    @Operation(summary = "笔记草稿", description = "仅作者可读", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/{uid}/draft")
    public Result getNoteDraft(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String uid) {
        return Result.success(noteService.getNoteDraft(authorization, uid));
    }
}
