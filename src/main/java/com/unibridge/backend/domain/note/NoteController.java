package com.unibridge.backend.domain.note;

import com.unibridge.backend.domain.note.dto.PublishNoteRequest;
import com.unibridge.backend.domain.note.NoteService;
import com.unibridge.backend.infrastructure.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping
    public Result createNote(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @RequestBody PublishNoteRequest request) {
        return Result.success(noteService.createNote(authorization, request));
    }

    @PutMapping("/{uid}")
    public Result updateNote(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @PathVariable String uid,
                             @RequestBody PublishNoteRequest request) {
        return Result.success(noteService.updateNote(authorization, uid, request));
    }

    @GetMapping("/{uid}")
    public Result getNoteDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @PathVariable String uid,
                                HttpServletRequest request) {
        return Result.success(noteService.getNoteDetail(authorization, uid, request));
    }

    @GetMapping("/{uid}/draft")
    public Result getNoteDraft(@RequestHeader(value = "Authorization", required = false) String authorization,
                               @PathVariable String uid) {
        return Result.success(noteService.getNoteDraft(authorization, uid));
    }
}
