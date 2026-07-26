# Akin

Akin es una app de rachas para móvil hecha con tecnologías web. Marcas el día, la
racha crece, tu mascota se pone contenta y tus amigos lo ven. Nada de tablas
grises ni de checkboxes tristes: la idea es que abrir Akin apetezca.

## Qué hace

- **Rachas.** Objetivos con nombre e icono, check-in diario y una ventana de
  revisión para ponerte al día sin falsear fechas.
- **Deshacer.** Cualquier check-in o borrado se revierte desde el toast, con las
  monedas que hubiera repartido.
- **Monedas.** Una por check-in válido, máximo tres por racha al revisar, y sólo
  diez rachas a la vez pueden generarlas.
- **Mascota.** Se acaricia, reacciona y se viste con pieles y peinados que
  compras con las monedas.
- **Amigos.** Solicitudes por nombre de usuario y un muro de actividad.
- **Instalable.** En el móvil se comporta como una app, no como una pestaña.

Rutas: `/` landing · `/streaks` la app · `/pet` mascota y tienda · `/friends`
amigos · `/me` cuenta · `/demo` recorrido sin cuenta.

## Datos

Sin cuenta, las rachas viven en `localStorage` y todo lo básico funciona. Con
cuenta, Convex guarda perfil, rachas, check-ins, monedas y amistades en tiempo
real, e importa una sola vez lo que tuvieras en local sin pagar monedas
retroactivas.

El identificador del usuario nunca llega desde el cliente: sale de la sesión
firmada. Los check-ins y el libro mayor de monedas se validan en el servidor, con
fechas reales y coherentes con la zona horaria de la cuenta.

## Stack

Next.js 16 · React 19 · CSS Modules · Convex · Better Auth · TypeScript · Vitest
· pnpm. Sin librería de componentes: menús, diálogos y toasts son propios, porque
el aspecto es parte del producto.

## Desarrollo

```bash
pnpm install
pnpm dev          # Convex + Next.js juntos, en http://localhost:3000
```

La primera ejecución te deja iniciar sesión en Convex o crear un deployment local
anónimo, y escribe las variables públicas en `.env.local`. Para depurar por
separado hay `pnpm dev:backend` y `pnpm dev:web`, pero no lances `dev:backend` si
ya estás usando `pnpm dev`: pelearían por el mismo deployment.

Better Auth y el acceso con GitHub necesitan estas variables **en el deployment
de Convex**, no en Next.js:

```bash
pnpm exec convex env set BETTER_AUTH_SECRET   # aleatorio y largo
pnpm exec convex env set SITE_URL http://localhost:3000
pnpm exec convex env set GITHUB_CLIENT_ID
pnpm exec convex env set GITHUB_CLIENT_SECRET
```

La OAuth App local usa `http://localhost:3000/api/auth/callback/github` como
callback. En producción, `SITE_URL` y la callback apuntan a la URL pública real,
con credenciales distintas.

Antes de dar algo por bueno: `pnpm lint`, `pnpm test` y `pnpm build`.

## Despliegue

Akin se aloja en un VPS de [Cubepath](https://cubepath.com/), gestionado con
[Coolify](https://coolify.io/). Coolify se encarga del build desde el repositorio,
del certificado HTTPS y del proxy hacia el contenedor, así que desplegar es un
push a `main`.

En Coolify, la aplicación se define así:

- **Origen:** este repositorio, rama `main`, build con Nixpacks o Dockerfile.
- **Comandos:** `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm start`.
- **Puerto:** `3000`.
- **Dominio:** el público de Akin, con HTTPS automático desde Coolify.
- **Variables:** `NEXT_PUBLIC_CONVEX_URL` y `NEXT_PUBLIC_CONVEX_SITE_URL`, que
  hacen falta **en tiempo de build**, no sólo en ejecución.

El backend sigue en Convex y se publica aparte con `pnpm convex:deploy`. En el
deployment de producción hay que configurar `BETTER_AUTH_SECRET` y `SITE_URL` con
el dominio público real, y registrar la callback de GitHub contra ese mismo
dominio.

La configuración de OpenNext/Cloudflare (`pnpm deploy`, `pnpm preview`) sigue en
el repo, pero Cubepath + Coolify es el camino oficial.
