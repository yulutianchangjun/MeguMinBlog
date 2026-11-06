package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.MusicRequest;
import xyz.cy666.blog.dto.MusicView;
import xyz.cy666.blog.entity.BlogMusic;
import xyz.cy666.blog.mapper.BlogMusicMapper;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MusicService {

    private final BlogMusicMapper musicMapper;

    public List<MusicView> list() {
        return musicMapper.selectList(new QueryWrapper<BlogMusic>()
                        .orderByAsc("sort").orderByDesc("id"))
                .stream().map(this::toView).toList();
    }

    public MusicView create(MusicRequest request) {
        if (!StringUtils.hasText(request.getTitle())) {
            throw new BizException("曲名不能为空");
        }
        if (!StringUtils.hasText(request.getUrl())) {
            throw new BizException("音频地址不能为空");
        }
        BlogMusic music = new BlogMusic();
        music.setTitle(request.getTitle().trim());
        music.setArtist(StringUtils.hasText(request.getArtist()) ? request.getArtist().trim() : "未知艺术家");
        music.setCover(StringUtils.hasText(request.getCover()) ? request.getCover().trim() : "");
        music.setUrl(request.getUrl().trim());
        music.setKind(StringUtils.hasText(request.getKind()) ? request.getKind() : "url");
        music.setSize(request.getSize() == null ? 0L : request.getSize());
        music.setSort(request.getSort() == null ? 99 : request.getSort());
        music.setCreatedAt(LocalDateTime.now());
        musicMapper.insert(music);
        return toView(music);
    }

    public void delete(Long id) {
        if (musicMapper.deleteById(id) == 0) {
            throw BizException.notFound("曲目不存在");
        }
    }

    private MusicView toView(BlogMusic music) {
        return new MusicView(music.getId(), music.getTitle(), music.getArtist(), music.getCover(),
                music.getUrl(), music.getKind(), music.getSize(), music.getSort(), music.getCreatedAt());
    }
}
