package xyz.cy666.blog.security;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.config.AppProperties;

import java.util.Map;

/**
 * Cloudflare Turnstile 服务端校验。
 * 未配置 secret 时跳过（本地开发）；生产必须在环境变量里配置。
 */
@Service
@RequiredArgsConstructor
public class TurnstileService {

    private static final Logger log = LoggerFactory.getLogger(TurnstileService.class);

    private final AppProperties props;
    private final RestTemplate restTemplate;

    public boolean enabled() {
        return props.getTurnstile().isEnabled()
                && props.getTurnstile().getSecret() != null
                && !props.getTurnstile().getSecret().isBlank();
    }

    @SuppressWarnings("unchecked")
    public void verify(String token, String ip) {
        if (!enabled()) {
            return;
        }
        if (token == null || token.isBlank()) {
            throw new BizException(400, "请先完成人机校验");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", props.getTurnstile().getSecret());
        form.add("response", token);
        if (ip != null && !ip.isBlank()) {
            form.add("remoteip", ip);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        try {
            Map<String, Object> body = restTemplate.postForObject(
                    props.getTurnstile().getVerifyUrl(),
                    new HttpEntity<>(form, headers),
                    Map.class);
            boolean success = body != null && Boolean.TRUE.equals(body.get("success"));
            if (!success) {
                Object codes = body == null ? null : body.get("error-codes");
                log.warn("Turnstile 校验失败 ip={} codes={}", ip, codes);
                throw new BizException(400, "人机校验未通过，请刷新后重试");
            }
        } catch (RestClientException ex) {
            log.error("Turnstile 服务不可用", ex);
            throw new BizException(503, "人机校验服务暂时不可用，请稍后再试");
        }
    }
}
