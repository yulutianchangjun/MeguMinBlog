package blog.demo.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "请输入账号") String username,
        @NotBlank(message = "请输入密码") String password,
        @NotBlank(message = "请填写验证码") String captchaId,
        @NotBlank(message = "请填写验证码") @Size(max = 8, message = "验证码格式不正确") String captchaAnswer) {
}
