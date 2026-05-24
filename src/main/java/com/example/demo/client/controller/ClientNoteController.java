package com.example.demo.client.controller;

import com.example.demo.client.dto.PublishNoteRequest;
import com.example.demo.client.service.ClientNoteService;
import com.example.demo.common.Result;
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
public class ClientNoteController {

    private final ClientNoteService clientNoteService;

    public ClientNoteController(ClientNoteService clientNoteService) {
        this.clientNoteService = clientNoteService;
    }

    @PostMapping
    public Result createNote(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @RequestBody PublishNoteRequest request) {
        return Result.success(clientNoteService.createNote(authorization, request));
    }

    @PutMapping("/{noteId}")
    public Result updateNote(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @PathVariable Long noteId,
                             @RequestBody PublishNoteRequest request) {
        return Result.success(clientNoteService.updateNote(authorization, noteId, request));
    }

    @GetMapping("/{noteId}")
    public Result getNoteDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @PathVariable Long noteId) {
        return Result.success(clientNoteService.getNoteDetail(authorization, noteId));
    }

    @GetMapping("/{noteId}/draft")
    public Result getNoteDraft(@RequestHeader(value = "Authorization", required = false) String authorization,
                               @PathVariable Long noteId) {
        return Result.success(clientNoteService.getNoteDraft(authorization, noteId));
    }
}
