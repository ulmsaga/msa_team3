#!/bin/bash
set -e

RUNNER_ALLOW_RUNASROOT="1"
RUNNER_WORKDIR=${RUNNER_WORKDIR:-"/_work"}

cd /actions-runner

echo "Runner setup starting..."
echo "Repository URL: ${RUNNER_REPOSITORY_URL}"
echo "Runner name: ${RUNNER_NAME}"
echo "Runner token: ${RUNNER_TOKEN:0:4}..."

cleanup() {
    if [ -e ".runner" ]; then
        echo "Removing runner..."
        ./config.sh remove --token "${RUNNER_TOKEN}"
    fi
}

trap cleanup EXIT
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM

# Configure the runner
./config.sh \
    --url "${RUNNER_REPOSITORY_URL}" \
    --token "${RUNNER_TOKEN}" \
    --name "${RUNNER_NAME}" \
    --work "${RUNNER_WORKDIR}" \
    --unattended \
    --replace

# Start the runner
exec ./run.sh