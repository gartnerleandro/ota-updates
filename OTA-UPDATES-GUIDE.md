# Guía: Integrar OTA Updates con EAS Update

Basado en la configuración de gartnerleandro.

---

## Paso 0 — Instalar EAS CLI e iniciar sesión

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Iniciar sesión con tu cuenta de Expo
eas login
# Te va a pedir email y contraseña de tu cuenta expo.dev
```

Si no tienes cuenta, créala en [expo.dev](https://expo.dev).

Verificar que estás logueado:

```bash
eas whoami
```

---

## Paso 1 — Instalar `expo-updates`

Desde la raíz de tu proyecto:

```bash
npx expo install expo-updates
```

---

## Paso 2 — Vincular el proyecto con EAS

```bash
# Desde la raíz del proyecto
eas init
```

Esto hace dos cosas:

1. Crea el proyecto en tu cuenta de Expo (te da un `projectId`)
2. Agrega automáticamente a `app.json` la sección `extra.eas.projectId`

---

## Paso 3 — Configurar `app.json`

Agregar/modificar estas secciones en tu `app.json`:

```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/<TU_PROJECT_ID>",
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_ERROR_RECOVERY",
      "requestHeaders": {
        "expo-channel-name": "production"
      }
    },
    "plugins": [
      "expo-router",
      "expo-updates",
      "...tus otros plugins"
    ],
    "extra": {
      "eas": {
        "projectId": "<TU_PROJECT_ID>"
      }
    }
  }
}
```

**Qué hace cada cosa:**

- `runtimeVersion.policy: "appVersion"` — El runtime version = tu `expo.version`. Si bumpeas version, los binarios viejos dejan de recibir OTAs nuevos (previene crashes).
- `fallbackToCacheTimeout: 0` — La app NUNCA bloquea el arranque esperando un update. Abre inmediato con el bundle cacheado.
- `checkAutomatically: "ON_ERROR_RECOVERY"` — Expo solo comprueba automáticamente si hubo un crash. El check manual lo controlamos nosotros con el hook.
- `expo-channel-name` — Define a qué channel se conecta este build.

---

## Paso 4 — Crear `eas.json`

```bash
eas build:configure
```

O crearlo manualmente en la raíz del proyecto:

```json
{
  "cli": {
    "version": ">= 15.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "distribution": "store",
      "autoIncrement": true,
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Channels:**

| Channel       | Uso                                     |
| ------------- | --------------------------------------- |
| `production`  | Builds de store (usuarios reales)       |
| `preview`     | Builds de testing (TestFlight/internal) |
| `development` | Dev builds                              |

---

## Paso 5 — Crear el hook `useAppUpdate`

Crear `hooks/useAppUpdate.ts`:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos entre checks
const INITIAL_DELAY_MS = 5_000;      // 5s después del cold start

export function useAppUpdate() {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const lastCheckRef = useRef(0);

  const checkForUpdate = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;

    const now = Date.now();
    if (now - lastCheckRef.current < COOLDOWN_MS) return;
    lastCheckRef.current = now;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;

      const fetchResult = await Updates.fetchUpdateAsync();
      if (fetchResult.isNew) {
        setIsUpdateReady(true);
      }
    } catch {
      // Silent failure — sin red o CDN caído
    }
  }, []);

  const applyUpdate = useCallback(() => {
    void Updates.reloadAsync();
  }, []);

  // Check 5s después del cold start
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const timer = setTimeout(() => {
      void checkForUpdate();
    }, INITIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  // Check cuando la app vuelve a foreground
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void checkForUpdate();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkForUpdate]);

  return { isUpdateReady, applyUpdate };
}
```

---

## Paso 6 — Crear el modal `UpdateRequiredModal`

Crear `components/UpdateRequiredModal.tsx`. Conceptos clave:

- **Modal no-dismissible** (sin botón de cerrar) — fuerza al usuario a actualizar para evitar fragmentación de versiones.
- Animación de entrada con `FadeIn`.
- Overlay oscuro semi-transparente (`rgba(0, 0, 0, 0.7)`).
- Card blanca centrada con `maxWidth: 340`.

```typescript
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowDownToLine } from 'lucide-react-native';

interface UpdateRequiredModalProps {
  onUpdate: () => void;
}

export function UpdateRequiredModal({ onUpdate }: UpdateRequiredModalProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <ArrowDownToLine size={28} color="#6366F1" />
        </View>

        <Text style={styles.title}>Actualización disponible</Text>
        <Text style={styles.description}>
          Hay una nueva versión disponible. Actualiza ahora para continuar.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onUpdate}
        >
          <Text style={styles.buttonText}>Actualizar</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6366F1',  // adapta a tu color primario
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
```

> Nota: Los textos no están traducidos en este ejemplo para reducir complejidad. En tu app real usa `t('common.updates.title')` con tu sistema de i18n para usar las traducciones.

---

## Paso 7 — Montar en el root layout

En tu `app/_layout.tsx`:

```typescript
import { UpdateRequiredModal } from '@/components/UpdateRequiredModal';
import { useAppUpdate } from '@/hooks/useAppUpdate';

// Dentro del componente root:
const { isUpdateReady, applyUpdate } = useAppUpdate();

// En el JSX, al final de todo (después de Stack, providers, etc):
{isUpdateReady && <UpdateRequiredModal onUpdate={applyUpdate} />}
```

---

## Paso 8 — Hacer el primer build nativo

**IMPORTANTE:** OTA updates solo funcionan en builds de Release (no en `expo start`). Necesitas al menos una build con `expo-updates` incluido.

```bash
# Build de preview para testear
eas build --profile preview --platform ios

# O para Android
eas build --profile preview --platform android
```

---

## Paso 9 — Publicar tu primer OTA update

```bash
# 1. Publicar a preview primero (SIEMPRE)
eas update --channel preview --message "feat: descripción del cambio"

# 2. Testear en el build de preview

# 3. Si todo OK, publicar a producción
eas update --channel production --message "feat: descripción del cambio"
```

---

## Rollback (si algo sale mal)

```bash
# Ver updates recientes
eas update:list --branch production

# Identificar el ID del grupo del último update BUENO

# Republicarlo al channel
eas update:republish --group <update-group-id>
```

Consideraciones:

- El usuario sigue en el bundle malo hasta el próximo check (cooldown 30 min + cold start / foreground).
- Si el OTA malo crashea en arranque, `checkAutomatically: "ON_ERROR_RECOVERY"` fuerza un check automático → recuperación.
- Si el crash rompe el check mismo, solo queda un build de store nuevo. Por eso: **siempre testear en `preview` primero**.

---

## Cuándo OTA vs store build

| OTA (`eas update`)      | Store build (Xcode / EAS Build)          |
| ----------------------- | ---------------------------------------- |
| Cambios de JS/TS/assets | Agregar/quitar paquetes nativos          |
| Bug fixes, UI tweaks    | Cambiar permisos (cámara, notifs, etc)   |
| Traducciones            | Bump de Expo SDK                         |
| Ajustes de lógica       | Cambios en `app.json` que afectan nativo |
| Nuevas pantallas JS     | Bump de `version` / `runtimeVersion`     |

---

## Workflow típico de deploy

1. Detectar bug / mejora de JS
2. Implementar + testear local (`npm run ios`)
3. `eas update --channel preview --message "..."` → validar en TestFlight / build interno
4. `eas update --channel production --message "..."`
5. Monitorizar analytics para verificar adopción del update

---

## Archivos clave

| Archivo                              | Descripción                                           |
| ------------------------------------ | ----------------------------------------------------- |
| `app.json`                           | `updates`, `runtimeVersion`, plugin `expo-updates`    |
| `eas.json`                           | `channel` por build profile                           |
| `hooks/useAppUpdate.ts`              | Hook que chequea, descarga y expone estado del update |
| `components/UpdateRequiredModal.tsx` | Modal obligatorio con animación de entrada            |
| `app/_layout.tsx`                    | Monta el hook + modal a nivel root                    |

---

## Gotchas

- **Nunca publicar a producción sin pasar por `preview`.** Un OTA roto afecta a todos los usuarios en minutos.
- **`__DEV__` bypass:** el hook ignora updates en desarrollo. Para testear de verdad, build en Release.
- **`fallbackToCacheTimeout: 0`** → la app nunca bloquea el arranque esperando un check.
- **`checkAutomatically: "ON_ERROR_RECOVERY"`** → Expo solo chequea automáticamente en error recovery; el resto lo controlamos manualmente desde `useAppUpdate`.
- **El bundle viejo sigue cacheado** hasta que el usuario hace cold start + pasa el delay + descarga el nuevo. No esperes propagación instantánea.
- **Store guidelines:** OTA está permitido para fixes y mejoras, no para cambiar la propuesta de valor de la app.

---

## Checklist resumida

- [ ] `npm install -g eas-cli`
- [ ] `eas login`
- [ ] `npx expo install expo-updates`
- [ ] `eas init` (vincula proyecto + genera projectId)
- [ ] Configurar `app.json` (runtimeVersion, updates, plugin)
- [ ] Crear `eas.json` (channels por profile)
- [ ] Crear `hooks/useAppUpdate.ts`
- [ ] Crear `components/UpdateRequiredModal.tsx`
- [ ] Montar hook + modal en `app/_layout.tsx`
- [ ] `eas build --profile preview` (primer build nativo)
- [ ] `eas update --channel preview` (primer OTA de prueba)
- [ ] Verificar que el modal aparece en el build de preview
- [ ] `eas build --profile production` + `eas update --channel production`
