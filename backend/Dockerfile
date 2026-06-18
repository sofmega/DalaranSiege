FROM eclipse-temurin:21-jdk AS build

WORKDIR /workspace
COPY . .
RUN chmod +x mvnw && ./mvnw -B package

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN useradd --system --uid 10001 appuser
COPY --from=build /workspace/target/dalarans-*.jar /app/app.jar

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
