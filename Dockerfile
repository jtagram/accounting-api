FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# El "mes pasado" se calcula con la hora del proceso: en UTC cambiaría de mes unas horas antes que en Argentina.
ENV TZ=America/Argentina/Buenos_Aires
# Solo se usa Chromium oculto, así que se instala únicamente el headless shell (con sus
# librerías del sistema). Va en una ruta fija y legible por el usuario `node`.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npx playwright install --with-deps chromium-headless-shell \
    && rm -rf /var/lib/apt/lists/* \
    && chmod -R a+rX /ms-playwright
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]
