# RunaRadio Web

Sitio estático + CLI para operar en GitHub Pages con integración a LibreTime.

## Características
- Frontend multi-página (`docs/`) listo para GitHub Pages con reproductor integrado en Home (sin abrir otra URL).
- Login de administración separado en `/login` (archivo `docs/login/index.html`).
- Panel admin protegido en `/admin.html` con sesión local.
- Integración con API de `https://libretime.kusmedios.lat` con timeout y fallback a caché local.
- Base de datos compatible con GitHub Pages (`localStorage` + JSON semilla).
- CLI para sincronizar metadata y administrar semilla.

## Comandos
```bash
npm run check
npm run serve
npm run sync
npm run seed-admin -- --user admin --password nuevaClave
npm run cli -- export --out ./backup.json
```

## Deploy GitHub Pages (recomendado)
Este repositorio incluye workflow: `.github/workflows/deploy-pages.yml`.

1. Haz push a `main` (o `work`).
2. En GitHub > Settings > Pages > Source, selecciona **GitHub Actions**.
3. Espera el workflow **Deploy GitHub Pages**.
4. URL final esperada: `https://<usuario>.github.io/<repo>/`.

## Rutas importantes
- Home: `/index.html`
- Login: `/login/`
- Admin: `/admin.html`
