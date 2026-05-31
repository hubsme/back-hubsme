# Integración de Videollamadas de Microsoft Teams & Azure en Hubsme

Este documento contiene un resumen completo de la arquitectura, configuración, permisos y librerías utilizadas para:
1. Crear reuniones de Microsoft Teams mediante API a nivel del backend.
2. Embeber y unir a los usuarios de forma nativa a la videollamada desde el frontend de Angular.

---

## PARTE 1: Backend - Creación de Reuniones Teams por API

La creación de las reuniones se realiza de forma automatizada mediante la API de **Microsoft Graph** utilizando credenciales de aplicación (App-only).

### 🛠️ Librerías Utilizadas (npm)
* `@microsoft/microsoft-graph-client`: SDK oficial de Microsoft Graph para Node.js/TypeScript.
* `@azure/identity`: Proveedor de credenciales seguro de Azure para autenticación Oauth 2.0.

### 🔑 Requisitos Previos en Microsoft Azure & Entra ID

Para que la creación de reuniones funcione, es obligatorio realizar las siguientes configuraciones en el portal de Azure:

1. **Registro de Aplicación en Microsoft Entra ID:**
   * Registrar una aplicación multitenant o single-tenant (App Registration).
   * Generar un **Client Secret** (Secreto del Cliente) que se utilizará para el flujo de autenticación de credenciales de cliente (`Client Credentials Flow`).

2. **Permisos de API requeridos en Microsoft Graph (Application Permissions):**
   * Se requiere el permiso de tipo **Aplicación** (Application Permission, no Delegado):
     * `Calendars.ReadWrite`: Permite crear eventos de calendario con salas de Teams asociadas.
   * **¡CRÍTICO!** Se debe conceder el **Consentimiento de Administrador** (`Admin Consent`) en el tenant de Azure para que la aplicación pueda actuar en nombre del organizador sin interacción manual de login.

3. **Requisito de Cuenta / Licencia de Teams:**
   * El ID de usuario especificado en `MS_GRAPH_TEAMS_ORGANIZER_USER_ID` debe corresponder a un usuario del tenant que cuente con una **licencia de Microsoft Teams pagada** (ej. Enterprise E3/E5, Business Premium). Las cuentas personales o gratuitas no tienen soporte para agendar `onlineMeetings` mediante Microsoft Graph.

### ⚙️ Variables de Entorno en el Backend (`.env`)

Las siguientes variables deben configurarse en el backend para habilitar la creación de reuniones:

```bash
# Habilita o deshabilita la automatización de Teams (si es false, fallback a Google Meet u otro)
TEAMS_MEETINGS_ENABLED=true

# Azure Communication Services (ACS) para tokens temporales
AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://hubsme-acs.communication.azure.com/;accesskey=..."

# Credenciales de Aplicación en Azure Entra ID
MS_GRAPH_TENANT_ID="tu-tenant-id-de-azure"
MS_GRAPH_CLIENT_ID="tu-client-id-de-registro-de-app"
MS_GRAPH_CLIENT_SECRET="tu-secreto-de-app"

# ID de usuario del Organizador (Usuario corporativo con licencia Teams activa)
MS_GRAPH_TEAMS_ORGANIZER_USER_ID="id-del-usuario-organizador-en-graph-uuid"
```

---

## PARTE 2: Frontend - Videollamada Embebida (ACS a Teams Interop)

Para que el usuario pueda unirse a la reunión directamente desde la web (sin descargar Teams ni abrir ventanas externas), se utiliza la interoperabilidad de **Azure Communication Services (ACS)**.

### 🛠️ Librerías Utilizadas (npm)

#### En el Backend:
* `@azure/communication-identity`: Para crear identidades de comunicación efímeras y emitir tokens temporales con el scope `['voip']`.

#### En el Frontend:
* `react` & `react-dom` (v18): Motor de UI base requerido para renderizar los componentes nativos de Azure.
* `@azure/communication-common`: SDK común para tokens y credenciales.
* `@azure/communication-react`: Contiene el componente pre-diseñado `CallComposite` que envuelve toda la experiencia de audio/video.
* `@fluentui/react`: Librería de UI de Microsoft en la que se basan los componentes visuales de ACS.
* **Peer-Dependencies Críticas (para compilador Angular/ESBuild):**
  * `@azure/communication-calling`
  * `@azure/communication-chat`
  * `@azure/communication-calling-effects`
  *(Estas tres dependencias evitan que el compilador ESBuild de Angular falle al buscar imports internos de `@azure/communication-react`).*

### 💻 Conexión en Angular (Sala Autocontenida)

La lógica reside dentro del componente Angular Standalone **`<app-teams-meeting-room>`**:

1. **Servicio Centralizado (`TeamsCallService`):**
   * Es un singleton de módulo que maneja de forma reactiva con *Angular Signals* el estado del panel: `meetingId`, `displayName`, `isOpen` y `isFullscreen`.
2. **Petición del Token de Acceso:**
   * El backend genera un usuario de comunicación temporal (`acsUserId`) y un token JWT seguro con vigencia limitada mediante el método `createUserAndToken(['voip'])` de ACS.
3. **Inicialización en Angular:**
   * Se crea una credencial cliente: `new AzureCommunicationTokenCredential(token)`.
   * Se genera el adaptador de llamada: `createAzureCommunicationCallAdapter(...)` apuntando al enlace obtenido de Microsoft Graph (`locator: { meetingLink: meetingUrl }`).
4. **Montado dinámico en React:**
   * Se utiliza `createRoot(container)` apuntando a un `#reactContainer` local para inicializar el componente de React `CallComposite`.
5. **Comportamiento en Caliente y Fullscreen:**
   * El contenedor del componente cambia de estilos dinámicamente (`w-screen h-screen rounded-none z-[110]` para Pantalla Completa y `w-full max-w-5xl h-[85vh] rounded-2xl` para Modal Normal) **sin destruir el nodo del DOM**, garantizando que el streaming de audio y video nunca sufra micro-cortes o desconexiones.
6. **Ciclo de vida ultra-limpio (`ngOnDestroy`):**
   * Se realiza un dispose estricto del adaptador (`callAdapter.dispose()`) y se desmontea la raíz de React (`reactRoot.unmount()`) al cerrar el componente. Esto asegura que la cámara y el micrófono se apaguen inmediatamente en el navegador del usuario al salir de la reunión.

---

## PARTE 3: Grabación Automática & Restricciones Temporales de Acceso

Para garantizar la privacidad, la automatización y el control de accesos a la sala de videollamadas, se implementaron dos características críticas en el backend:

### 🎙️ 1. Grabación y Transcripción Automática en la Nube (Opción A)
* **¿Por qué es automática?** Los usuarios de la web embebida (ACS) entran a la llamada como **invitados anónimos**, por lo que Microsoft Teams no les permite presionar manualmente el botón de "Iniciar Grabación".
* **Solución y Requerimiento de Endpoint:** La creación de reuniones utiliza el endpoint `/calendar/events` para que los eventos aparezcan automáticamente en el calendario del organizador sin requerir políticas complejas de acceso.
* **Cómo habilitar la Grabación Automática sin cambiar de endpoint:**
  1. **A nivel de Teams (Recomendado):** En el panel de Teams Admin Center (`admin.teams.microsoft.com`), ve a **Reuniones > Directivas de reunión** y edita tu política (ej. Global). En la sección *Grabación y transcripción*, activa la opción para que las reuniones de los usuarios con esta política se graben y transcriban de forma automática al iniciar.
  2. **Vía PowerShell (Para usar onlineMeetings directo):** Si a futuro decides usar el endpoint `/onlineMeetings`, un administrador de TI de tu tenant de Microsoft 365 debe ejecutar los siguientes comandos en PowerShell de Skype/Teams para crear y asignar una política de acceso de aplicación a tu ID de Cliente de Azure:
     ```powershell
     New-CsApplicationAccessPolicy -Identity "HubsmeTeamsPolicy" -AppIds "tu-client-id" -Description "Access to online meetings"
     Grant-CsApplicationAccessPolicy -PolicyName "HubsmeTeamsPolicy" -Identity "organizer-upn-o-object-id"
     ```

### 📂 2. Obtención de Grabaciones desde OneDrive por API (Implementado)
* **¿Cómo funciona?** Cuando una reunión de Teams finaliza y ha sido grabada, Teams guarda el archivo `.mp4` automáticamente en la carpeta `Recordings` del OneDrive de la cuenta organizadora (`MS_GRAPH_TEAMS_ORGANIZER_USER_ID`).
* **Endpoint Implementado:** En [meeting.controller.ts](file:///Users/erixcel/chamba/hubsme/backend-hubsme/src/modules/admin/meeting/meeting.controller.ts) se expuso el endpoint `GET /admin/meeting/recording/:id` que busca dinámicamente este archivo en la cuenta OneDrive de la cuenta corporativa:
  * Llama a `/users/{organizerUserId}/drive/root:/Recordings:/children`.
  * Filtra y empareja el archivo de forma inteligente buscando que coincida con el **Título de la Reunión** (`meeting.title`).
  * Retorna los detalles de la grabación, incluyendo el enlace de descarga directa en la nube de Microsoft (`downloadUrl`).
* **Permiso Requerido:** Requiere que tu registro de aplicación de Azure AD tenga concedido el permiso de tipo aplicación **`Files.Read.All`** con consentimiento del administrador.

### ⏱️ 3. Restricción Horaria de Acceso a Videollamadas
* **Lógica en Backend:** Modificado el método `createTeamsJoinToken` en [meeting.service.ts](file:///Users/erixcel/chamba/hubsme/backend-hubsme/src/modules/admin/meeting/meeting.service.ts) para validar de manera estricta el tiempo actual contra el horario agendado de la reunión:
  * **Acceso Temprano Limitado:** El usuario solo puede solicitar su token de acceso a partir de **10 minutos antes** de la hora de inicio de la reunión. Si intenta conectarse antes, recibe un mensaje claro indicando la hora exacta de apertura.
  * **Expiración Limitada:** El enlace deja de admitir conexiones **30 minutos después** de la hora programada de cierre (es decir: `startTime + durationMinutes + 30 minutos`). Intentos de conexión posteriores retornan un error de expiración.


