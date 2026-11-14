package blog.demo.web.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.MusicRequest;
import blog.demo.common.dto.MusicView;
import blog.demo.system.service.MusicService;

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
