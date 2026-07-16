# -------- Build Stage --------
FROM maven:3.9.4-eclipse-temurin-21 AS build

WORKDIR /app

# # Copy Maven config and dependencies first to leverage Docker cache
# COPY pom.xml ./
# COPY src ./src

# RUN mvn clean package -DskipTests

# Copy only pom.xml and download dependencies first
COPY pom.xml ./
RUN mvn dependency:go-offline

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# -------- Runtime Stage --------
FROM eclipse-temurin:21

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
