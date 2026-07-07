# JARVIS — App móvil (Android + iOS)

Este proyecto envuelve tu HUD (`index-6.html`) en una app nativa real usando
**Capacitor**, con reconocimiento y síntesis de voz nativos, y acceso a
cámara, archivos, contactos/llamadas, calendario y ubicación. Al abrirse en
el teléfono, la app pide todos los permisos y activa el modo manos libres
automáticamente: el teclado y los botones de texto quedan ocultos, y la
única forma de dar órdenes es hablando. El reactor central se deja visible
como único control táctil (para poder silenciar el micrófono), por
accesibilidad.

## ⚠️ Importante: qué puedo generar aquí y qué no

No tengo Android Studio, un SDK de Android completo, una Mac ni Xcode en
este entorno, así que **no puedo compilar aquí el archivo `.apk` o `.ipa`
final que se instala en un teléfono**. Lo que sí hice fue dejarte el
proyecto Capacitor completo, ya generado y sincronizado (carpetas
`android/` y `ios/` incluidas, permisos declarados, plugins instalados),
listo para abrir y compilar en tu máquina en pocos minutos.

## Qué contiene el proyecto

- `www/index.html` — tu HUD original, adaptado para usar plugins nativos.
- `src/native.js` — el "puente" que conecta el HUD con Capacitor (voz,
  cámara, archivos, contactos, calendario, ubicación). Se compila a
  `www/native-bundle.js` con esbuild.
- `android/` — proyecto Android completo (Gradle), con permisos ya
  declarados en `AndroidManifest.xml`.
- `ios/` — proyecto Xcode completo, con las descripciones de uso de
  permisos ya declaradas en `Info.plist`.
- `capacitor.config.ts` — configuración de la app (nombre, ID, carpeta web).

## Cómo compilar el APK (Android)

1. Instala [Android Studio](https://developer.android.com/studio).
2. Copia esta carpeta `jarvis-app` a tu computadora y abre una terminal en ella.
3. `npm install`
4. `npm run android:studio` (recompila el puente nativo, sincroniza y abre Android Studio)
5. En Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
6. Instala el APK generado en tu teléfono, o conéctalo por USB y pulsa ▶ Run.

## Cómo compilar la app de iOS

Requiere una **Mac** con Xcode instalado (es una limitación de Apple, no de
este proyecto: Xcode no existe para Windows/Linux).

1. Copia la carpeta a tu Mac.
2. `npm install`
3. `cd ios/App && pod install && cd ../..`
4. `npm run ios:xcode`
5. En Xcode: selecciona tu equipo de desarrollador (Signing & Capabilities)
   y pulsa ▶ Run, o **Product → Archive** para generar el `.ipa`.

## Permisos que pedirá la app

| Acceso | Para qué |
|---|---|
| Micrófono / reconocimiento de voz | Escuchar tus órdenes (control 100% por voz) |
| Cámara / fotos | Comando "toma una foto" |
| Archivos | Guardar notas/documentos |
| Contactos | Comando "llama a [nombre]" |
| Calendario | Comando "agenda una cita..." |
| Ubicación | Comando "¿dónde estoy?" y el clima local |

## Limitaciones reales del sistema operativo (no de la app)

- **Ni Android ni iOS permiten que una app marque una llamada real de forma
  100% automática sin que el usuario toque "Llamar"** en el marcador. Es una
  protección del sistema contra apps que hacen llamadas ocultas. El comando
  de voz "llama a [nombre]" abre el marcador con el número ya cargado; el
  toque final para llamar es del sistema operativo, no se puede evitar.
- La función que respondía usando la IA de Claude (`callClaudeAPI`) llamaba
  directamente a `api.anthropic.com` desde el navegador — eso solo funcionaba
  dentro del entorno de artefactos de Claude.ai, que añadía la clave por ti.
  En la app instalada esa llamada fallará (no hay clave ni proxy). Si quieres
  que JARVIS siga respondiendo con IA real fuera de comandos simples, dime y
  te preparo un pequeño backend/proxy seguro para tu propia clave de API (no
  es buena práctica meter una clave de API directamente en una app pública).
- Publicar en Google Play o App Store exige además cuentas de desarrollador
  de pago y revisión de cada tienda; esto genera una app instalable de
  prueba, no la publicación en las tiendas.

## Personalizar el ícono, nombre o ID de la app

- Nombre/ID: edita `capacitor.config.ts`.
- Ícono: reemplaza los archivos en `android/app/src/main/res/mipmap-*` (Android)
  y usa Xcode → Assets.xcassets → AppIcon (iOS), o pídeme que te genere los
  íconos a partir de una imagen.
