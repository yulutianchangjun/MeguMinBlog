package blog.demo.web.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.MusicView;
import blog.demo.system.service.MusicService;

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
