package blog.demo.framework.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import blog.demo.common.dto.CaptchaView;
import blog.demo.common.exception.BizException;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;

/**
 * 登录算术验证码：生成一道 10 以内加减法，答案存 Redis（2 分钟有效、校验一次即销毁）。
 * 目的是拦住脚本暴力撞库，不追求强人机识别。
 */
@Service
@RequiredArgsConstructor
public class CaptchaService {

    private static final Duration TTL = Duration.ofMinutes(2);
    private static final String KEY_PREFIX = "captcha:login:";

    private final StringRedisTemplate redis;
    private final SecureRandom random = new SecureRandom();

    public CaptchaView create() {
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
        String id = UUID.randomUUID().toString().replace("-", "");
        redis.opsForValue().set(KEY_PREFIX + id, String.valueOf(answer), TTL);
        String question = plus ? a + " + " + b + " = ?" : a + " - " + b + " = ?";
        return new CaptchaView(id, question);
    }

    /** 校验并销毁验证码；答案错误或过期都抛业务异常 */
    public void verify(String captchaId, String answer) {
        if (!StringUtils.hasText(captchaId) || !StringUtils.hasText(answer)) {
            throw new BizException("请填写验证码");
        }
        String expected = redis.opsForValue().getAndDelete(KEY_PREFIX + captchaId.trim());
        if (expected == null) {
            throw new BizException("验证码已过期，请刷新后重试");
        }
        if (!expected.equals(answer.trim())) {
            throw new BizException("验证码答案不正确");
        }
    }
}
