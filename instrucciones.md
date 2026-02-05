# instrucciones.md

## Cambios realizados en esta versión
- Se separó correctamente el flujo de autenticación:
  - Login ahora vive en `docs/login/index.html` (ruta `/login/`).
  - `docs/admin.html` quedó como panel protegido (sin form de login embebido).
  - Si no hay sesión activa, `/admin.html` redirige automáticamente a `/login/`.
- Se añadió `docs/login.html` como redirección de compatibilidad hacia `/login/`.
- Se actualizó `docs/assets/app.js` para soportar páginas `home`, `schedule`, `community`, `login` y `admin` con rutas relativas correctas.
- Se agregó botón de cerrar sesión en admin.
- Se agregó workflow de despliegue automático para GitHub Pages en `.github/workflows/deploy-pages.yml`.
- Se actualizó `readme.md` con instrucciones exactas para activar Pages con GitHub Actions y rutas clave.

## Requisitos o dependencias nuevas
- Node.js 18+.
- Python 3 para pruebas locales (`http.server`).
- GitHub Actions habilitado en el repositorio para despliegue automático.

## Guía paso a paso para probar la funcionalidad
1. **Validación de sintaxis**
   ```bash
   npm run check
   ```
2. **Levantar servidor local**
   ```bash
   npm run serve
   ```
3. **Probar rutas**
   - Home: `http://localhost:4173/index.html`
   - Login: `http://localhost:4173/login/`
   - Admin: `http://localhost:4173/admin.html` (debe redirigir a login si no hay sesión)
   - Schedule: `http://localhost:4173/schedule.html`
   - Community: `http://localhost:4173/community.html`
4. **Login admin**
   - Usuario: `admin`
   - Password: `runaradio123`
   - Después del login debe entrar a admin.
5. **Despliegue GitHub Pages**
   - Push a `main`.
   - En Settings > Pages selecciona **GitHub Actions**.
   - Espera workflow `Deploy GitHub Pages`.
