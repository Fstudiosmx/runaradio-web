# instrucciones.md

## Cambios realizados en esta versión
- Se transformó el Home en un **reproductor de radio integrado (Luna Player)** para que no abra el stream en otra URL:
  - controles Play/Pause, Stop y volumen,
  - estado de stream en vivo,
  - metadatos de canción/artist sincronizados con LibreTime o fallback local,
  - barra visual estilo waveform animada.
- Se eliminó el enfoque anterior de botón externo para escuchar, reemplazándolo por reproducción embebida (`<audio>` HTML5).
- Se mantuvo la arquitectura segura existente (login/admin separado) y solo se mejoró la experiencia del reproductor en `index`.

## Requisitos o dependencias nuevas
- Node.js 18+.
- Python 3 para vista previa local.
- No se agregaron dependencias externas de npm.

## Guía paso a paso para probar la funcionalidad
1. **Validar sintaxis**
   ```bash
   npm run check
   ```
2. **Levantar servidor local**
   ```bash
   npm run serve
   ```
3. **Abrir Home con player integrado**
   - `http://localhost:4173/index.html`
4. **Probar reproductor Luna**
   - Click en **Play** para iniciar stream.
   - Ajustar **Volumen**.
   - Click en **Stop** para detener.
   - Verificar que metadatos “Ahora sonando” muestren track/artista.
5. **Rutas secundarias**
   - Login: `http://localhost:4173/login/`
   - Admin: `http://localhost:4173/admin.html`
