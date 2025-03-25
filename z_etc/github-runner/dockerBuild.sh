# -----
# echo "docker build --platform=linux/amd64 -t sclee1115/github-runner-custom:v0.0.1 ."
# docker build --platform=linux/amd64 -t sclee1115/github-runner-custom:v0.0.1 .

# echo "push sclee1115/github-runner-custom:v0.0.1"
# docker push sclee1115/github-runner-custom:v0.0.1


# Docker Buildx 설치 및 설정
docker buildx rm mybuilder
docker buildx create --use --name mybuilder --driver docker-container --driver-opt image=moby/buildkit:buildx-stable-1

# QEMU 설치 (다중 아키텍처 빌드를 위해 필요)
docker run --rm --privileged tonistiigi/binfmt --install all

# 다중 아키텍처 이미지를 빌드하고 푸시
docker buildx build --builder mybuilder --platform linux/amd64,linux/arm64 -t sclee1115/github-runner-custom:v0.0.8 -f Dockerfile --push .