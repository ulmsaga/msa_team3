FROM --platform=$TARGETPLATFORM ubuntu:20.04

# 환경 변수 설정
ENV DEBIAN_FRONTEND=noninteractive

# 시스템 업데이트 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    sudo \
    jq \
    && rm -rf /var/lib/apt/lists/*

# 아키텍처 감지 및 환경 변수 설정
ARG TARGETARCH
ENV RUNNER_ARCH=""
RUN case "${TARGETARCH}" in \
    amd64)  RUNNER_ARCH="x64" ;; \
    arm64)  RUNNER_ARCH="arm64" ;; \
    *) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac \
    && echo "RUNNER_ARCH=${RUNNER_ARCH}" >> /etc/environment

# 비루트 사용자 생성
RUN useradd -m github-runner \
    && usermod -aG sudo github-runner \
    && echo "github-runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 필요한 저장소 추가
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

# 애플리케이션 의존성 설치
RUN apt-get update && apt-get install -y \
    openjdk-21-jdk \
    maven \
    docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# nodejs와 npm 설치
RUN apt-get update && apt-get install -y nodejs \
    && curl -L https://www.npmjs.com/install.sh | sh

# kubectl 설치
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/$(dpkg --print-architecture)/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && rm kubectl

# Helm 설치
RUN curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

# ArgoCD CLI 설치
RUN curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-$(dpkg --print-architecture) \
    && install -m 555 argocd-linux-amd64 /usr/local/bin/argocd \
    && rm argocd-linux-amd64

# GitHub Actions Runner 설정
WORKDIR /actions-runner

ENV RUNNER_VERSION="2.311.0"
ENV RUNNER_ARCH_ENV=""

# 아키텍처에 따른 Runner 다운로드 및 설치
RUN if [ "$TARGETARCH" = "amd64" ]; then \
      export RUNNER_ARCH_ENV="x64"; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
      export RUNNER_ARCH_ENV="arm64"; \
    else \
      echo "Unsupported architecture: $TARGETARCH" && exit 1; \
    fi && \
    echo "Architecture: $RUNNER_ARCH_ENV" && \
    echo "Version: $RUNNER_VERSION" && \
    DOWNLOAD_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH_ENV}-${RUNNER_VERSION}.tar.gz" && \
    echo "Downloading from: $DOWNLOAD_URL" && \
    curl -L -o runner.tar.gz $DOWNLOAD_URL && \
    tar xzf ./runner.tar.gz && \
    rm runner.tar.gz

# ...existing code...



# 권한 설정
RUN chown -R github-runner:github-runner /actions-runner

# Entrypoint 스크립트 복사 및 실행 권한 설정
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && chown github-runner:github-runner /entrypoint.sh

# 비루트 사용자로 전환
USER github-runner

ENTRYPOINT ["/entrypoint.sh"]