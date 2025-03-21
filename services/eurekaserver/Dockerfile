# FROM openjdk:21-jdk-slim
# FROM openjdk:21-jdk-alpine

FROM openjdk:21-jdk-slim
ARG JAR_FILE=target/*.jar
COPY target/eurekaserver.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]