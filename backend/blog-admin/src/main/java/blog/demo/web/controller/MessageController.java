package blog.demo.web.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.MessageRequest;
import blog.demo.common.dto.MessageView;
import blog.demo.common.utils.ClientIp;
import blog.demo.system.service.MessageService;

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
