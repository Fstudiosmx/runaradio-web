# RunaRadio Web

Sitio estático + CLI para operar en GitHub Pages con integración a LibreTime.

## Características
- Frontend multi-página (`docs/`) listo para GitHub Pages.
- Integración con API de `https://libretime.kusmedios.lat` con timeout y fallback a caché local.
- Base de datos compatible con GitHub Pages (`localStorage` + JSON semilla).
- Panel administrativo con autenticación local (hash SHA-256), edición de estación y exportación de configuración.
- CLI para sincronizar metadata y administrar semilla.

## Comandos
```bash
npm run check
npm run serve
npm run sync
npm run seed-admin -- --user admin --password nuevaClave
npm run cli -- export --out ./backup.json
```

## Deploy GitHub Pages
1. Push del repositorio.
2. En GitHub, Settings > Pages.
3. Source: Deploy from branch.
4. Branch: `main` (o tu branch de release), folder: `/docs`.
