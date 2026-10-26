# Plantilla de arranque — Backend NestJS + Prisma + pnpm

## 1. Stack y versiones de referencia

| Pieza | Versión / paquete | Notas |
|---|---|---|
| Node.js | **22 LTS** (`node:22-alpine` en Docker) | fijar con `.nvmrc` o `engines.node` |
| Gestor de paquetes | **pnpm** (vía Corepack) | único gestor permitido, ver §3 |
| Framework | **NestJS 11** (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`) | |
| Lenguaje | **TypeScript 5.7+** | `strict: true` |
| ORM | **Prisma 7** con **driver adapters** (sin motor Rust clásico, query-compiler WASM) | ver §2 y §4 |
| Base de datos | **PostgreSQL** (local: contenedor Docker; adapter: `@prisma/adapter-pg` + `pg`) | cambiar de motor es solo cambiar el adapter y la imagen de Docker |
| Config/env | `@nestjs/config` + `class-validator`/`class-transformer` para validar el `.env` al boot | |
| Auth | `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` | ver §6 |
| Docs API | `@nestjs/swagger` | expuesto en `/api/docs` |
| Tests | `Jest` (unit) + `jest-e2e` (e2e) | |
| Lint/format | `eslint` (`typescript-eslint`) + `prettier` | |

Fija siempre versiones exactas del stack al iniciar el proyecto (`pnpm add pkg@x.y.z`),
no rangos abiertos copiados de un tutorial viejo. Confirma en npm/pnpm cuál es la
última estable de cada paquete el día que arranques.

---

## 2. Arquitectura de carpetas

Arquitectura por capas (hexagonal/clean) **dentro de cada módulo de negocio**,
más una carpeta transversal para lo compartido:

```
src/
  main.ts                     # bootstrap: ValidationPipe, CORS, Swagger, body limits
  app.module.ts

  context/
    config/
      app.config.ts           # clase EnvironmentVariables + validateConfig() (class-validator)
    database/
      prisma.module.ts        # provee PrismaClient (con el driver adapter) como provider global

  common/                     # todo lo transversal, sin lógica de negocio
    decorators/                # @Public(), @CurrentUser(), @Roles(), etc.
    guards/                     # JwtAuthGuard global + RolesGuard opcional
    interceptors/
    filters/                    # exception filters globales
    interfaces/
    dtos/
    utils/

  modules/
    <feature>/
      api/
        controllers/           # rutas HTTP, solo orquestan
        dtos/                  # request/response DTOs con class-validator
      application/
        use-cases/             # un caso de uso = una clase con .execute()
        services/              # servicios de aplicación reusados por varios use-cases
      domain/
        interfaces/            # "ports": contratos que infraestructura implementa
        types/
      infrastructure/
        adapters/               # implementaciones concretas (bcrypt, jwt strategy, etc.)
        repositories/           # implementan los ports del dominio usando Prisma
      <feature>.module.ts       # registra providers, mapea ports -> adapters
```

**Regla clave:** `application/` y `domain/` no importan Prisma ni Express
directamente — dependen de interfaces (`domain/interfaces/*.port.ts`) que
`infrastructure/` implementa e inyecta por token (`@Inject(X_PORT)`). Esto
permite testear casos de uso con mocks sin levantar base de datos.

No crear una "arquitectura de referencia" más compleja que esta a menos que el
proyecto lo justifique — no añadir capas ni patrones (CQRS, event sourcing,
etc.) que el proyecto no necesita todavía.

---

## 3. Gestión de paquetes: pnpm exclusivo

En `package.json`:

```json
{
  "packageManager": "pnpm@<version-estable-actual>",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

- Habilitar Corepack para que la versión de pnpm sea la del `packageManager`
  declarado, no la que tenga instalada cada máquina: `corepack enable && corepack prepare pnpm@<version> --activate`.
- Bloquear `npm`/`yarn` con un script `preinstall`:
  ```json
  "scripts": { "preinstall": "npx only-allow pnpm" }
  ```
- Nunca commitear `package-lock.json` ni `yarn.lock`. Solo `pnpm-lock.yaml`.
- Si el proyecto es un monorepo, usar `pnpm-workspace.yaml`; si no, omitirlo.

---

## 4. Inicialización paso a paso

```bash
# 1. Proyecto Nest
pnpm dlx @nestjs/cli new <nombre-proyecto> --package-manager pnpm --skip-git
cd <nombre-proyecto>

# 2. Corepack + pin de pnpm
corepack enable
corepack prepare pnpm@<version-estable-actual> --activate

# 3. Dependencias de runtime
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger \
  passport passport-jwt bcrypt class-validator class-transformer

# 4. Dependencias de desarrollo
pnpm add -D @types/bcrypt @types/passport-jwt

# 5. Prisma con driver adapter (Postgres)
pnpm add -D prisma
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm dlx prisma init --datasource-provider postgresql

# 6. Generar el cliente (usa prisma.config.ts + DATABASE_URL del .env)
pnpm exec prisma generate
```

En `prisma.config.ts` (patrón validado en este repo, sin `url` dentro de
`schema.prisma` — la URL vive solo en el entorno):

```ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
```

Instanciar el cliente con el adapter (no con engine clásico):

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

---

## 5. `.gitignore`

```gitignore
# Dependencias
node_modules/
.pnpm-store/

# Build
dist/
build/
*.tsbuildinfo

# Variables de entorno (NUNCA subir al repo)
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Docker - datos locales de la base de datos
data/
tmp/

# Sistema operativo
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln

# Tests
coverage/

# Cache
.cache/
/generated/prisma
```

---

## 6. `.env.example`

```dotenv
# --- Base de datos (Postgres local vía docker-compose, ver seccion 8) ---
DATABASE_URL="postgresql://app_user:app_pass@localhost:5432/app_db"

# --- JWT ---
JWT_SECRET=cambia_este_valor_por_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# --- Servidor ---
PORT=3000
NODE_ENV=development

# --- CORS / frontend ---
FRONTEND_URL=http://localhost:5173

# --- Cookie httpOnly del refresh token ---
# lax sirve cuando front y API comparten sitio (proxy de Vite en dev, mismo dominio en prod).
# Si el front vive en otro dominio, usar 'none' (obliga a HTTPS).
COOKIE_SAMESITE=lax
# Se activa solo en producción si se omite.
# COOKIE_SECURE=true
COOKIE_PATH=/
# false (default): cookie de sesión, se borra al cerrar el navegador.
# true: persiste en disco hasta agotar JWT_REFRESH_EXPIRES_IN (estilo "recordarme").
COOKIE_PERSISTENT=false
```

`.env` real nunca se commitea (ver `.gitignore`); `.env.example` sí, siempre
sincronizado con las variables que `app.config.ts` valida.

---

## 7. Seguridad: bcrypt + JWT + refresh token

Patrón validado en este repo — replicarlo tal cual en cualquier proyecto nuevo:

### Contraseñas (bcrypt detrás de un port/adapter)

```ts
// domain/interfaces/hasher.port.ts
export interface HasherPort {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

// infrastructure/adapters/bcrypt.adapter.ts
import * as bcrypt from 'bcrypt';

export class BcryptAdapter implements HasherPort {
  private readonly SALT_ROUNDS = 10;
  hash(plain: string) { return bcrypt.hash(plain, this.SALT_ROUNDS); }
  compare(plain: string, hash: string) { return bcrypt.compare(plain, hash); }
}
```

Nunca comparar contraseñas con `===`; nunca loguear el hash ni el plaintext.

### Access token + refresh token (rotación sin tabla de tokens)

- **Un solo secreto JWT** (`JWT_SECRET`) firma ambos tokens; se distinguen por
  un claim `typ: 'access' | 'refresh'` dentro del payload — así un access
  token robado no puede usarse para refrescar, ni viceversa.
- **Access token**: corto (`JWT_EXPIRES_IN`, por defecto `8h`), va en el
  **body** de la respuesta JSON, el front lo guarda en memoria (nunca
  `localStorage`).
- **Refresh token**: largo (`JWT_REFRESH_EXPIRES_IN`, por defecto `7d`), va **solo**
  en una **cookie `httpOnly` + `secure` + `sameSite`** — el JavaScript del
  front nunca puede leerlo, así un XSS no puede robar la sesión larga.
- **Rotación**: cada llamada a `POST /auth/refresh` reemite *ambos* tokens
  (nuevo access + nuevo refresh) y vuelve a poner la cookie.
- **Revocación**: en cada refresh se vuelve a leer el usuario en base de
  datos y se valida que siga activo — así bloquear/desactivar un usuario
  corta su sesión sin esperar a que expire el token. Esto evita mantener una
  tabla de refresh tokens en base de datos. Si el proyecto necesita poder
  invalidar una sesión específica al instante (no solo "todo el usuario"),
  agregar ahí una tabla de tokens con revocación — no antes.
- **`POST /auth/logout`**: solo borra la cookie (`clearCookie`) y registra el
  evento; no requiere tabla de tokens para funcionar en el caso simple.
- **Defensa CSRF adicional en `/auth/refresh`**: aunque la cookie ya es
  `SameSite`, ese endpoint es público (no requiere Bearer) y renueva la
  sesión — se valida el header `Origin` contra `FRONTEND_URL` (mismo host de
  la request, o alguno de los orígenes permitidos) antes de aceptar la
  petición.

```ts
// application/services/token-issuer.service.ts
issue(subject: TokenSubject): IssuedTokens {
  const refreshExpiresIn = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
  return {
    accessToken: this.jwt.sign({ ...subject, typ: 'access' }),
    refreshToken: this.jwt.sign({ ...subject, typ: 'refresh' }, { expiresIn: refreshExpiresIn }),
    refreshMaxAgeMs: durationToMs(refreshExpiresIn),
  };
}
```

```ts
// infrastructure/adapters/jwt.strategy.ts (passport-jwt, valida el access token del header Authorization)
validate(payload: AuthPayload): AuthPayload {
  if (payload.typ === 'refresh') throw new UnauthorizedException('Token inválido');
  return payload;
}
```

### Guard global + rutas públicas

- `JwtAuthGuard` se registra como `APP_GUARD` global (todas las rutas
  requieren Bearer token por defecto).
- Un decorator `@Public()` + metadata marca las excepciones (`/auth/login`,
  `/auth/refresh`, health checks).

### Bootstrap (`main.ts`)

```ts
app.enableCors({ origin: allowedOriginsFromEnv, credentials: true });
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
app.enableShutdownHooks(); // cierre limpio de Prisma/Nest ante SIGTERM
```

---

## 8. Docker

### 8.1 `docker-compose.yml` — Postgres local de desarrollo/pruebas

Se conecta con la **misma** `DATABASE_URL` que declara `.env.example` (mismo
usuario, password, puerto y nombre de base):

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: <nombre-proyecto>-db
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: app_pass
    ports:
      - "5432:5432"
    volumes:
      - app_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user -d app_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  app_db_data:
```

```bash
docker compose up -d       # levanta la base local
pnpm exec prisma migrate dev   # aplica el schema contra esa base
```

### 8.2 `Dockerfile` — backend dockerizado (multi-stage)

```dockerfile
# Etapa 1: build
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@<version-estable-actual> --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# prisma generate (postinstall) no requiere una DB real durante el build
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

# Etapa 2: runtime
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts

USER node
EXPOSE 3000
CMD ["node", "dist/main"]
```

> Con Prisma 7 + driver adapters no hace falta el motor Rust clásico en el
> contenedor: si `pnpm prune --prod` deja paquetes pesados del CLI de Prisma
> (Studio, engines, etc.) que solo se usan en dev, se pueden borrar
> explícitamente tras el prune — documentar por qué cada uno se borra, para
> no romper el build en el próximo `pnpm add`.

---

## 9. README inicial del proyecto (comandos esenciales)

Copiar como `README.md` en la raíz de cada proyecto nuevo:

```markdown
# <Nombre del proyecto> — Backend

## Requisitos
- Node.js 22 LTS
- pnpm (vía Corepack: `corepack enable`)
- Docker (para la base de datos local)

## Setup inicial
\`\`\`bash
cp .env.example .env          # y completa los valores reales
pnpm install
docker compose up -d          # levanta Postgres local
pnpm exec prisma migrate dev  # crea el schema en la DB local
\`\`\`

## Desarrollo
\`\`\`bash
pnpm start:dev        # servidor con watch
pnpm exec prisma studio   # explorar la DB
\`\`\`

## Build y producción
\`\`\`bash
pnpm build
pnpm start:prod
\`\`\`

## Docker (imagen completa del backend)
\`\`\`bash
docker build -t <nombre-proyecto>-api .
docker run --env-file .env -p 3000:3000 <nombre-proyecto>-api
\`\`\`

## Calidad
\`\`\`bash
pnpm lint
pnpm test
pnpm test:e2e
\`\`\`

## Documentación de la API
Swagger disponible en `http://localhost:3000/api/docs` una vez levantado el servidor.
```

---

## 10. Checklist al arrancar un proyecto nuevo con esta plantilla

- [ ] `packageManager` fijado + `preinstall: only-allow pnpm`
- [ ] `.env.example` completo y sincronizado con `app.config.ts` (validación con class-validator)
- [ ] `.gitignore` copiado de §5 (nunca commitear `.env` real)
- [ ] `docker-compose.yml` con la DB local usando la misma URL que `.env.example`
- [ ] `Dockerfile` multi-stage probado con `docker build` antes del primer deploy
- [ ] Guard JWT global + `@Public()` en rutas de auth
- [ ] Refresh token en cookie `httpOnly`, nunca en el body ni en `localStorage`
- [ ] `ValidationPipe` global con `whitelist` + `forbidNonWhitelisted`
- [ ] Estructura de módulo por capas (§2) desde el primer módulo de negocio, no retrofit después