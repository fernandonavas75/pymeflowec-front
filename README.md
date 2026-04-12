# Pymeflowec Frontend

Frontend Angular listo para desplegar en **GitHub Pages** y consumir un backend ya publicado en **AWS**.

## 1) Configurar la URL real de tu backend AWS

Edita este archivo:

- `src/environments/environment.prod.ts`

Y cambia `apiUrl` por tu endpoint real (API Gateway, ALB o dominio propio):

```ts
apiUrl: 'https://TU-ENDPOINT-AWS/api'
```

> Importante: usa `https://` para evitar bloqueos de contenido mixto cuando el front esté en GitHub Pages.

## 2) Build para GitHub Pages

Este repo incluye un script preparado para publicar bajo la ruta del repositorio `/pymeflowec-front/`:

```bash
npm install
npm run build:gh-pages
```

La salida queda en:

- `dist/pymeflowec-frontend/browser`

## 3) Activar GitHub Pages

1. Ve a **Settings → Pages** en tu repo de GitHub.
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Publica el contenido de la carpeta de build (por ejemplo en rama `gh-pages` o con GitHub Actions).

URL esperada del frontend:

- `https://<tu-usuario>.github.io/pymeflowec-front/`

## 4) Checklist AWS (backend)

- Permite CORS para el origen exacto de GitHub Pages:
  - `https://<tu-usuario>.github.io`
- Habilita métodos y headers necesarios (`Authorization`, `Content-Type`, etc.).
- Responde preflight `OPTIONS` correctamente.
- Verifica que tus rutas API coincidan con el prefijo configurado en `apiUrl`.

## Notas de enrutado

Se habilitó **hash routing** (`/#/ruta`) para evitar errores 404 al recargar rutas internas en GitHub Pages.

## Desarrollo local

```bash
npm install
npm start
```

Por defecto local:

- `src/environments/environment.ts`
- `http://localhost:8080/api`
