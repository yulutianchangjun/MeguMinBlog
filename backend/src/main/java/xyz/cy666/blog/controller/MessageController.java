package xyz.cy666.blog.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.MessageRequest;
import xyz.cy666.blog.dto.MessageView;
import xyz.cy666.blog.security.ClientIp;
import xyz.cy666.blog.service.MessageService;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ApiResponse<List<MessageView>> list() {
        return ApiResponse.ok(messageService.listApproved());
    }

    @PostMapping
    public ApiResponse<MessageView> create(@Valid @RequestBody MessageRequest request,
                                           HttpServletRequest servletRequest) {
        return ApiResponse.ok(messageService.create(request, ClientIp.of(servletRequest)));
    }
}
