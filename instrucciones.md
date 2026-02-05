# instrucciones.md

## Cambios realizados en esta versión
- Se reforzó la arquitectura del frontend en `docs/assets/app.js`:
  - manejo de errores y timeout para consumo de LibreTime,
  - renderizado seguro sin `innerHTML` para tablas/listas,
  - caché local robusta,
  - autenticación admin con hash SHA-256 + sesión local.
- Se mejoró seguridad de datos en `docs/data/default-db.json`:
  - credenciales admin migradas de password plano a `passwordHash`.
- Se mejoró el CLI `cli/runaradio-cli.mjs`:
  - `seed-admin` ahora guarda hash SHA-256,
  - `sync` soporta sincronización parcial (no rompe todo si falla un endpoint),
  - fetch con timeout y reporte de errores por endpoint.
- Se actualizó la documentación en `readme.md` con el flujo operativo actual.

## Requisitos o dependencias nuevas
- Node.js 18+ (incluye `fetch` y `AbortController` nativos).
- Python 3 para vista previa local estática.
- No se agregaron dependencias externas de npm.

## Guía paso a paso para probar la funcionalidad
1. **Validar sintaxis de frontend y CLI**
   ```bash
   npm run check
   ```
2. **Levantar vista previa local**
   ```bash
   npm run serve
   ```
3. **Rutas de prueba**
   - `http://localhost:4173/index.html`
   - `http://localhost:4173/schedule.html`
   - `http://localhost:4173/community.html`
   - `http://localhost:4173/admin.html`
4. **Probar panel admin**
   - Usuario por defecto: `admin`
   - Contraseña por defecto: `runaradio123`
   - Editar estación y guardar cambios.
   - Exportar JSON desde el botón `Export DB JSON`.
5. **Probar CLI**
   ```bash
   npm run sync
   npm run seed-admin -- --user admin --password NuevaClaveSegura
   npm run cli -- export --out ./runaradio-db-export.json
   ```
