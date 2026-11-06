package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.CheckinView;
import xyz.cy666.blog.service.CheckinService;

@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;

    @GetMapping
    public ApiResponse<CheckinView> summary() {
        return ApiResponse.ok(checkinService.summary());
    }
}
