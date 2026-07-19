# Akin

Aplicación web móvil para cuidar rachas, construida con Next.js, React, CSS Modules y Convex.

## Modos de datos

- Sin cuenta: las funciones básicas de rachas y check-ins siguen funcionando en `localStorage`.
- Con cuenta: Convex guarda perfiles, rachas, check-ins y monedas. La primera sesión importa una sola vez los datos locales existentes, sin conceder monedas retroactivas.
- Las monedas son exclusivas de las cuentas. Cada check-in válido entrega una; en una revisión de más de tres días se entregan como máximo tres por racha.
- Como máximo diez rachas pueden generar monedas a la vez. Se eligen desde el panel de la cuenta.

## Desarrollo

Instala dependencias:

```bash
pnpm install
```

Arranca la aplicación completa:

```bash
pnpm dev
```

Este comando inicia Convex y Next.js juntos. La primera ejecución permite iniciar sesión en Convex o crear un deployment local anónimo. La web estará en [http://localhost:3000](http://localhost:3000) y Convex escribirá automáticamente sus tres variables públicas en `.env.local`.

Para depurar cada proceso por separado existen:

```bash
pnpm dev:backend
pnpm dev:web
```

No lances `dev:backend` si ya has usado `pnpm dev`, porque ambos intentarían controlar el mismo deployment local.

Si un proceso se detiene con `Ctrl+Z`, queda suspendido y puede conservar los puertos de Convex. Recupera cada trabajo mostrado por `jobs` con `fg %N` y ciérralo con `Ctrl+C`. El comando `pnpm dev` detecta esta situación y muestra el diagnóstico en lugar de quedarse esperando indefinidamente.

Para Better Auth y el acceso con GitHub hacen falta estas variables **en el deployment de Convex**, no en el proceso de Next.js:

```bash
pnpm exec convex env set BETTER_AUTH_SECRET
pnpm exec convex env set SITE_URL http://localhost:3000
pnpm exec convex env set GITHUB_CLIENT_ID
pnpm exec convex env set GITHUB_CLIENT_SECRET
```

`BETTER_AUTH_SECRET` debe ser un valor aleatorio largo. La OAuth App local de GitHub usa `http://localhost:3000/api/auth/callback/github` como callback. En producción, `SITE_URL` y la callback deben usar la URL HTTPS pública exacta de Akin, con credenciales OAuth distintas.

## Comprobaciones

```bash
pnpm lint
pnpm test
pnpm build
```

## Convex en producción

1. Ejecuta `pnpm dev` y enlaza este repositorio con el proyecto del equipo correcto.
2. Configura `BETTER_AUTH_SECRET` y `SITE_URL` en el deployment de producción.
3. Publica funciones y esquema con `pnpm convex:deploy`.
4. Copia `NEXT_PUBLIC_CONVEX_URL` y `NEXT_PUBLIC_CONVEX_SITE_URL` al entorno de build de la web.

El identificador del usuario nunca llega desde el cliente: las mutaciones lo obtienen de la sesión firmada. Los check-ins y el libro mayor de monedas se validan en el servidor y las fechas de revisión deben ser reales, consecutivas y coherentes con la zona horaria de la cuenta.

## Web en el VPS de Cubepath

Convex puede seguir alojando el backend y Cubepath servir la aplicación Next.js, cumpliendo el requisito de la hackathon. En el VPS:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Configura las variables de `.env.example` antes de la build y coloca un proxy HTTPS (por ejemplo, Caddy o Nginx) delante del puerto 3000. El sistema concreto de despliegue puede decidirse más adelante sin cambiar el modelo de datos.

La configuración anterior de OpenNext/Cloudflare permanece disponible de momento, pero no forma parte del camino principal de despliegue.
