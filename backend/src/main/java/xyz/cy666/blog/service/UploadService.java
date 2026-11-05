package xyz.cy666.blog.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.config.AppProperties;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif", "image/avif");
    private static final Set<String> AUDIO_TYPES = Set.of("audio/mpeg", "audio/mp3", "audio/flac", "audio/wav", "audio/x-wav",
            "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac");
    private static final long MAX_IMAGE = 8L * 1024 * 1024;
    private static final long MAX_AUDIO = 30L * 1024 * 1024;

    private final AppProperties props;

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException("请选择要上传的图片");
        }
        if (file.getSize() > MAX_IMAGE) {
            throw new BizException("图片不能超过 8MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!IMAGE_TYPES.contains(contentType)) {
            throw new BizException("只支持 JPG / PNG / WebP / GIF / AVIF 图片");
        }
        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "image/avif" -> ".avif";
            default -> ".jpg";
        };
        String name = UUID.randomUUID().toString().replace("-", "") + ext;
        Path dir = Paths.get(props.getUploadDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(name));
        } catch (IOException ex) {
            throw new BizException(500, "图片保存失败，请稍后重试");
        }
        String prefix = props.getUploadUrlPrefix().endsWith("/")
                ? props.getUploadUrlPrefix() : props.getUploadUrlPrefix() + "/";
        return prefix + name;
    }

    public String storeAudio(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException("请选择音频文件");
        }
        if (file.getSize() > MAX_AUDIO) {
            throw new BizException("音频不能超过 30MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!AUDIO_TYPES.contains(contentType) && !name.matches(".*\\.(mp3|flac|wav|ogg|m4a|aac)$")) {
            throw new BizException("只支持 MP3 / FLAC / WAV / M4A 音频");
        }
        String ext = switch (contentType) {
            case "audio/flac" -> ".flac";
            case "audio/wav", "audio/x-wav" -> ".wav";
            case "audio/ogg" -> ".ogg";
            case "audio/mp4", "audio/x-m4a" -> ".m4a";
            default -> ".mp3";
        };
        String stored = UUID.randomUUID().toString().replace("-", "") + ext;
        Path dir = Paths.get(props.getUploadDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(stored));
        } catch (IOException ex) {
            throw new BizException(500, "音频保存失败，请稍后重试");
        }
        String prefix = props.getUploadUrlPrefix().endsWith("/")
                ? props.getUploadUrlPrefix() : props.getUploadUrlPrefix() + "/";
        return prefix + stored;
    }
}
