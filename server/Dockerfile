# Status API — needs docker.sock for docker ps, /proc for system metrics
FROM node:22-alpine
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY status-api.cjs ./
EXPOSE 3001
CMD ["node", "status-api.cjs"]
