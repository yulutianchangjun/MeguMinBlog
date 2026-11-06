package xyz.cy666.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageRequest(
        @NotBlank(message = "请留下你的昵称")
        @Size(min = 2, max = 20, message = "昵称需要 2~20 个字符")
        String author,

        @NotBlank(message = "留言内容不能为空")
        @Size(min = 5, max = 500, message = "留言需要 5~500 个字符")
        String content,

        String wall,
        String bgColor,
        String fontColor,
        String texture,
        String turnstileToken) {
}
