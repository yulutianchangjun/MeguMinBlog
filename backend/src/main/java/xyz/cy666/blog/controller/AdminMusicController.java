package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.MusicRequest;
import xyz.cy666.blog.dto.MusicView;
import xyz.cy666.blog.service.MusicService;

@RestController
@RequestMapping("/api/admin/music")
@RequiredArgsConstructor
public class AdminMusicController {

    private final MusicService musicService;

    @PostMapping
    public ApiResponse<MusicView> create(@RequestBody MusicRequest request) {
        return ApiResponse.ok(musicService.create(request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        musicService.delete(id);
        return ApiResponse.ok();
    }
}
