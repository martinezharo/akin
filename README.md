# Akin

Aplicación web progresiva construida con Next.js, React, CSS Modules y Cloudflare Workers.

## Estructura

```text
src/
├── app/                  # Rutas y configuración de Next.js
├── features/
│   └── streaks/
│       ├── app/          # Composición, hidratación y estado de la feature
│       ├── components/   # UI agrupada con sus estilos y tests
│       ├── model/        # Entidades y reglas de negocio puras
│       └── persistence/  # Lectura, validación y escritura de datos
├── i18n/                 # Idioma y locale de la aplicación
└── shared/
    ├── hooks/            # Comportamientos reutilizables
    └── ui/               # Primitivas visuales compartidas
```

Los tests y CSS Modules viven junto al código que verifican o estilizan. Los imports
son directos para que las dependencias entre módulos sean fáciles de seguir.

## Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Comprobaciones

```bash
pnpm lint
pnpm test
pnpm build
```

## Cloudflare Workers

Genera los tipos de los bindings después de modificar `wrangler.jsonc`:

```bash
pnpm run cf-typegen
```

Prueba la aplicación en el runtime local de Cloudflare:

```bash
pnpm run preview
```

Cuando quieras publicarla:

```bash
pnpm run deploy
```
