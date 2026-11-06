package xyz.cy666.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordRequest(
        @NotBlank(message = "请输入当前密码") String oldPassword,
        @NotBlank(message = "请输入新密码")
        @Size(min = 8, max = 64, message = "新密码至少 8 位") String newPassword) {
}
