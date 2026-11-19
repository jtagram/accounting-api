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
# portalcf.cloud.afip.gob.ar envía solo su certificado, sin el intermedio de Sectigo. Chromium lo
# completa solo, pero las llamadas de `context.request` usan el TLS de Node y fallan con
# "unable to verify the first certificate". Node agrega este CA a los de confianza, sin desactivar
# la validación. Vence en 2036-03-21.
COPY certs/sectigo-public-server-authentication-ca-ov-r36.pem /usr/local/share/ca-certificates-extra/sectigo-ov-r36.pem
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates-extra/sectigo-ov-r36.pem
USER node
CMD ["node", "dist/main.js"]
