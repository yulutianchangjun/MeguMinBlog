package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.MusicView;
import xyz.cy666.blog.service.MusicService;

import java.util.List;

@RestController
@RequestMapping("/api/music")
@RequiredArgsConstructor
public class MusicController {

    private final MusicService musicService;

    @GetMapping
    public ApiResponse<List<MusicView>> list() {
        return ApiResponse.ok(musicService.list());
    }
}
