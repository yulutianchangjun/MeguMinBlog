package blog.demo.framework.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import blog.demo.common.dto.CaptchaView;
import blog.demo.common.exception.BizException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;

/**
 * 登录算术验证码：生成一道 10 以内加减法，答案存 Redis（2 分钟有效、校验一次即销毁）。
 *
 * 存储键用「IP 的 SHA-256 摘要」而不是随机 UUID：同一 IP 反复刷新只会覆盖同一条记录，
 * Redis 里每个 IP 最多一条，不会被刷验证码撑爆内存；也避免把明文 IP 直接写进键名。
 */
@Service
@RequiredArgsConstructor
public class CaptchaService {

    private static final Duration TTL = Duration.ofMinutes(2);
    private static final String KEY_PREFIX = "captcha:login:";
    private static final String FALLBACK_IP = "unknown";

    private final StringRedisTemplate redis;
    private final SecureRandom random = new SecureRandom();

    public CaptchaView create(String ip) {
        int a = 1 + random.nextInt(9);
        int b = 1 + random.nextInt(9);
        boolean plus = random.nextBoolean();
        if (!plus && a < b) {
            // 减法保证结果非负，避免出现 -3 这种答案
            int tmp = a;
            a = b;
            b = tmp;
        }
        int answer = plus ? a + b : a - b;
        // 覆盖写：同一 IP 只保留最新一题，旧题答案自然失效
        redis.opsForValue().set(KEY_PREFIX + ipKey(ip), String.valueOf(answer), TTL);
        String question = plus ? a + " + " + b + " = ?" : a + " - " + b + " = ?";
        return new CaptchaView(question);
    }

    /** 校验并销毁验证码；答案错误或过期都抛业务异常 */
    public void verify(String ip, String answer) {
        if (!StringUtils.hasText(answer)) {
            throw new BizException("请填写验证码");
        }
        String expected = redis.opsForValue().getAndDelete(KEY_PREFIX + ipKey(ip));
        if (expected == null) {
            throw new BizException("验证码已过期，请刷新后重试");
        }
        if (!expected.equals(answer.trim())) {
            throw new BizException("验证码答案不正确");
        }
    }

    /** 把 IP 转成固定长度摘要后缀；IP 缺失时用 unknown，保证同机仍能校验 */
    private String ipKey(String ip) {
        String raw = StringUtils.hasText(ip) ? ip.trim() : FALLBACK_IP;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(32);
            for (int i = 0; i < 16; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            // SHA-256 是 JDK 必备算法，这里只做兜底：仍可用，只是键里带原文
            return raw.replaceAll("[^0-9a-zA-Z.:_-]", "_");
        }
    }
}
