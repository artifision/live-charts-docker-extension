FROM --platform=$BUILDPLATFORM node:18.12-alpine3.16 AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build

FROM alpine
LABEL org.opencontainers.image.title="Live Charts" \
    org.opencontainers.image.description="Live Charts is a Docker extension that provides real-time graph visualization of CPU, Memory, Disk, and Network usage, enabling users to easily monitor and optimize their containerized environment." \
    org.opencontainers.image.vendor="Artifision Co." \
    com.docker.desktop.extension.api.version="0.3.4" \
    com.docker.extension.screenshots='[{"alt":"Overview Chart", "url":"https://raw.githubusercontent.com/artifision/live-charts-docker-extension/main/ui/public/screenshot_1.png"}, {"alt":"Combined Chart", "url":"https://raw.githubusercontent.com/artifision/live-charts-docker-extension/main/ui/public/screenshot_2.png"}, {"alt":"Split Chart", "url":"https://raw.githubusercontent.com/artifision/live-charts-docker-extension/main/ui/public/screenshot_3.png"}]' \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/artifision/live-charts-docker-extension/main/ui/public/logo.png" \
    com.docker.extension.detailed-description="Live Charts provides real-time visualization of critical system metrics. With Live Charts, you can effortlessly monitor and track the current usage of CPU, Memory, Disk, and Network resources within your Docker containers. The extension offers intuitive and interactive charts that dynamically update to reflect the most recent data, enabling you to make informed decisions and optimize your containerized environment. Stay on top of your system's performance with Live Charts and gain valuable insights into resource utilization, empowering you to efficiently manage your Docker infrastructure." \
    com.docker.extension.publisher-url="https://artifision.com" \
    com.docker.extension.additional-urls='[{"title":"GitHub","url":"https://github.com/artifision/live-charts-docker-extension"}, {"title":"Docker Hub","url":"https://hub.docker.com/r/artifision/live-charts-docker-extension"}]' \
    com.docker.extension.categories="tools,utility-tools" \
    com.docker.extension.changelog="This is the first release of the extension."

COPY metadata.json .
COPY docker.svg .
COPY --from=client-builder /ui/build ui
