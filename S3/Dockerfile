# S3 Service Dockerfile
FROM rust:slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Copy upload.html
COPY upload.html ./

# Copy source code
COPY src ./src

# Build release
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (wget for healthcheck)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/S3 /app/S3

# Copy upload.html
COPY upload.html ./

# Create data directories
RUN mkdir -p /app/data/code /app/data/test

# Expose port
EXPOSE 3001

# Run the service
CMD ["./S3"]

