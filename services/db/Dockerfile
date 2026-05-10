FROM postgres:15-alpine

# Bake the schema directly into the image for Docker Swarm compatibility.
# Swarm does not support relative bind mounts, so we cannot mount init.sql from the runner workspace.
COPY db/init.sql /docker-entrypoint-initdb.d/init.sql
