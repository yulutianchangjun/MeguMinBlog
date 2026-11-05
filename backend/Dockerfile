# 多阶段构建：Maven 编译 → JRE 运行
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S blog && adduser -S blog -G blog \
    && mkdir -p /app/uploads && chown -R blog:blog /app

COPY --from=builder /build/target/app.jar /app/app.jar
RUN chown blog:blog /app/app.jar

USER blog
EXPOSE 8080
ENV TZ=Asia/Shanghai JAVA_OPTS="-XX:MaxRAMPercentage=70 -Duser.timezone=Asia/Shanghai"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
