# Build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package && cp target/*.jar /app/app.jar

# Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S sangha && adduser -S sangha -G sangha
USER sangha
COPY --from=build /app/app.jar /app/app.jar
ENV SERVER_PORT=8080
EXPOSE 8080
ENTRYPOINT ["java","-XX:+UseContainerSupport","-XX:MaxRAMPercentage=75.0","-jar","/app/app.jar"]
