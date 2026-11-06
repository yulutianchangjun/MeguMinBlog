package xyz.cy666.blog.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** 上传文件落盘目录 */
    private String uploadDir = "./uploads";

    /** 上传文件对外的 URL 前缀（Nginx 挂载 /uploads/） */
    private String uploadUrlPrefix = "/uploads";

    private Jwt jwt = new Jwt();
    private Turnstile turnstile = new Turnstile();
    private Cors cors = new Cors();

    @Data
    public static class Jwt {
        /** HS256 密钥，至少 32 字节 */
        private String secret = "dev-only-secret-change-me-0123456789abcdef";
        private int ttlDays = 7;
    }

    @Data
    public static class Turnstile {
        /** 留空则跳过人机校验（本地开发） */
        private String secret = "";
        private String verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
        private boolean enabled = true;
    }

    @Data
    public static class Cors {
        private String allowedOrigins = "http://localhost:5173,http://localhost:5178";
    }
}
