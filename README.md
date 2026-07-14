# Akin

Aplicación web progresiva construida con Next.js, Tailwind CSS y Cloudflare Workers.

## Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Comprobaciones

```bash
pnpm lint
pnpm exec tsc --noEmit
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
