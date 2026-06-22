# ── Stage 1: Build ──
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

# Copy Maven wrapper and pom.xml first for dependency caching
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B -q || true

# Copy source code and build
COPY src ./src
RUN ./mvnw package -DskipTests -B -q

# ── Stage 2: Runtime ──
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Runtime defaults can be overridden by docker-compose.yml or `docker run -e`.
ENV TZ=Asia/Shanghai \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

# Create uploads directory and non-root user.
RUN apk add --no-cache tzdata \
    && mkdir -p /app/uploads \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser

# Copy the built jar
COPY --from=build /build/target/*.jar /app/app.jar

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
