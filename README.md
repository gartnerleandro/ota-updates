# OTA Updates con Expo — Ejemplo

Repositorio de ejemplo con la configuración de **OTA (Over-The-Air) updates** usando [expo-updates](https://docs.expo.dev/versions/latest/sdk/updates/) y EAS Update, mantenido por [@gartnerleandro](https://github.com/gartnerleandro).

El proyecto incluye una integración funcional de `expo-updates` con:

- Detección automática de actualizaciones disponibles.
- Descarga y aplicación de la nueva versión.
- Un `UpdateRequiredModal` de ejemplo para avisar al usuario.
- Hook `useAppUpdate` reutilizable.

## Guía completa paso a paso

Tienes la guía detallada, con todos los pasos para configurar EAS Update desde cero, en este mismo repositorio:

👉 [**OTA-UPDATES-GUIDE.md**](./OTA-UPDATES-GUIDE.md)

Cubre desde instalar la CLI de EAS hasta publicar tu primera actualización en producción.

## Guía en vídeo en YouTube

También tengo una **guía completa en vídeo** en mi canal de YouTube donde explico:

- Qué es una OTA update y para qué sirve.
- Cómo funciona por dentro (runtime version, channels, manifest, etc.).
- Cómo configurarla paso a paso en tu proyecto Expo.

🎥 [**Ver el vídeo en YouTube**](https://youtu.be/6tPZEK2Jl-s)

## Empezar con el proyecto

```bash
pnpm install
pnpm start
```

Recuerda sustituir en `app.json` los placeholders `<TU_PROJECT_ID>` y `<TU_EXPO_USER>` por los tuyos después de ejecutar `eas init`.

## Licencia

Código libre para usar como referencia en tus propios proyectos.
