FROM node:20

WORKDIR /usr/src/app

# Install Flowise globally so all native sqlite3 and node-gyp bindings compile cleanly
RUN npm install -g flowise

# Copy workspace files (custom tools and API examples)
COPY custom-tools ./custom-tools
COPY api-examples ./api-examples

ENV PORT=3000
ENV FLOWISE_PATH=/root/.flowise

EXPOSE 3000

CMD ["npx", "flowise", "start"]
