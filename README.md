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

```bash
npm install
npm run build:gh-pages
```

Si quieres publicar desde la carpeta `docs/` de tu rama (como en tu captura), usa:

```bash
npm run build:pages-docs
```

Ese comando deja listo:

- `docs/` con el build de Angular
- `docs/.nojekyll`

## 3) Subir a GitHub (paso a paso)

### Opción recomendada para tu caso (Deploy from a branch + `/docs`)

1. Ejecuta localmente:

   ```bash
   npm run build:pages-docs
   ```

2. Sube cambios:

   ```bash
   git add docs package.json README.md
   git commit -m "Deploy build for GitHub Pages"
   git push origin <tu-rama>
   ```

3. En GitHub entra a **Settings → Pages**.
4. En **Source** elige **Deploy from a branch**.
5. En **Branch** selecciona:
   - rama: `main` (o la rama donde subiste `docs`)
   - carpeta: `/docs`
6. Presiona **Save**.
7. Espera 1–3 minutos y abre:

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
