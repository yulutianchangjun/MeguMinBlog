package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.MessageView;
import xyz.cy666.blog.service.MessageService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/messages")
@RequiredArgsConstructor
public class AdminMessageController {

    private final MessageService messageService;

    @GetMapping
    public ApiResponse<List<MessageView>> list() {
        return ApiResponse.ok(messageService.listAll());
    }

    @PatchMapping("/{id}/pin")
    public ApiResponse<MessageView> pin(@PathVariable Long id, @RequestParam boolean value) {
        return ApiResponse.ok(messageService.pin(id, value));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<MessageView> status(@PathVariable Long id, @RequestParam String value) {
        return ApiResponse.ok(messageService.status(id, value));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        messageService.delete(id);
        return ApiResponse.ok();
    }
}
