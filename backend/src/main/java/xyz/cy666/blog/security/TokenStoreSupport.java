package xyz.cy666.blog.security;

import jakarta.servlet.http.HttpServletRequest;

public final class TokenStoreSupport {

    private TokenStoreSupport() {
    }

    public static String bearer(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || header.isBlank()) {
            return null;
        }
        String value = header.trim();
        if (value.regionMatches(true, 0, "Bearer ", 0, 7)) {
            value = value.substring(7).trim();
        }
        return value.isEmpty() ? null : value;
    }
}
