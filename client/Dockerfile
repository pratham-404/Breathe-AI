FROM nginxinc/nginx-unprivileged:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/

USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]
