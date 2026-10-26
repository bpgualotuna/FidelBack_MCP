# FidelBack_MCP — Backend Comercial & MCP Server (Clear Minds)

## Requisitos
- Node.js 22 LTS
- pnpm (vía Corepack: `corepack enable`)
- Docker (para la base de datos local)

## Setup inicial
```bash
cp .env.example .env          # y completa los valores reales
pnpm install
docker compose up -d          # levanta Postgres local
pnpm exec prisma migrate dev  # crea el schema en la DB local
```

## Desarrollo
```bash
pnpm start:dev        # servidor con watch
pnpm exec prisma studio   # explorar la DB
```

## Build y producción
```bash
pnpm build
pnpm start:prod
```

## Docker (imagen completa del backend)
```bash
docker build -t fidel-mcp-api .
docker run --env-file .env -p 3000:3000 fidel-mcp-api
```

## Calidad
```bash
pnpm lint
pnpm test
pnpm test:e2e
```

## Documentación de la API
Swagger disponible en `http://localhost:3000/api/docs` una vez levantado el servidor.
