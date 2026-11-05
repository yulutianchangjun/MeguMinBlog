package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.MessageRequest;
import xyz.cy666.blog.dto.MessageView;
import xyz.cy666.blog.entity.BlogMessage;
import xyz.cy666.blog.mapper.BlogMessageMapper;
import xyz.cy666.blog.security.RateLimiter;
import xyz.cy666.blog.security.TurnstileService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final Set<String> WALLS = Set.of("top", "left", "right");
    private static final Set<String> TEXTURES = Set.of("none", "paper", "grid", "stars");
    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private static final String DEFAULT_BG = "#F4EBDD";
    private static final String DEFAULT_FONT = "#3A2027";

    private final BlogMessageMapper messageMapper;
    private final RateLimiter rateLimiter;
    private final TurnstileService turnstileService;

    public List<MessageView> listApproved() {
        return messageMapper.selectList(new QueryWrapper<BlogMessage>()
                        .eq("status", "approved")
                        .orderByDesc("pinned").orderByDesc("created_at")
                        .last("LIMIT 300"))
                .stream().map(this::toView).toList();
    }

    public List<MessageView> listAll() {
        return messageMapper.selectList(new QueryWrapper<BlogMessage>()
                        .orderByDesc("pinned").orderByDesc("created_at")
                        .last("LIMIT 500"))
                .stream().map(this::toView).toList();
    }

    public MessageView create(MessageRequest request, String ip) {
        rateLimiter.checkMessage(ip);
        turnstileService.verify(request.turnstileToken(), ip);

        String author = sanitize(request.author());
        String content = sanitize(request.content());
        if (author.length() < 2 || content.length() < 5) {
            throw new BizException("留言内容过于简单");
        }

        BlogMessage message = new BlogMessage();
        message.setAuthor(author);
        message.setContent(content);
        message.setWall(WALLS.contains(request.wall()) ? request.wall() : "top");
        message.setBgColor(normalizeColor(request.bgColor(), DEFAULT_BG));
        message.setFontColor(normalizeColor(request.fontColor(), DEFAULT_FONT));
        message.setTexture(TEXTURES.contains(request.texture()) ? request.texture() : "paper");
        message.setRotation(Math.round((Math.random() * 5 - 2.5) * 100) / 100.0);
        message.setPinned(false);
        message.setStatus("approved");
        message.setIp(ip);
        message.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(message);
        return toView(message);
    }

    public MessageView pin(Long id, boolean pinned) {
        BlogMessage message = messageMapper.selectById(id);
        if (message == null) {
            throw BizException.notFound("这张便签不存在");
        }
        message.setPinned(pinned);
        messageMapper.updateById(message);
        return toView(message);
    }

    public MessageView status(Long id, String status) {
        if (!"approved".equals(status) && !"hidden".equals(status)) {
            throw new BizException("状态只能是 approved 或 hidden");
        }
        BlogMessage message = messageMapper.selectById(id);
        if (message == null) {
            throw BizException.notFound("这张便签不存在");
        }
        message.setStatus(status);
        messageMapper.updateById(message);
        return toView(message);
    }

    public void delete(Long id) {
        if (messageMapper.deleteById(id) == 0) {
            throw BizException.notFound("这张便签不存在");
        }
    }

    private MessageView toView(BlogMessage message) {
        return new MessageView(
                message.getId(),
                message.getAuthor(),
                message.getContent(),
                message.getWall(),
                message.getBgColor(),
                message.getFontColor(),
                message.getTexture(),
                message.getRotation(),
                Boolean.TRUE.equals(message.getPinned()),
                message.getStatus(),
                message.getCreatedAt());
    }

    /** 去除所有 HTML 标签并转义特殊字符，防 Stored XSS */
    private String sanitize(String input) {
        if (!StringUtils.hasText(input)) {
            return "";
        }
        return Jsoup.clean(input, Safelist.none()).trim();
    }

    private String normalizeColor(String value, String fallback) {
        if (value != null && HEX_COLOR.matcher(value).matches()) {
            return value;
        }
        return fallback;
    }
}
