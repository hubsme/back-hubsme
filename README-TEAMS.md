# Integración de Microsoft Teams, Calendar y Azure en Hubsme

Este documento describe la configuración necesaria para crear reuniones de Microsoft Teams desde Hubsme, permitir el acceso desde el frontend, recuperar grabaciones y leer transcripciones.

## Estado actual de la integración

La creación de reuniones usa el flujo **calendar-backed** de Microsoft Graph:

1. Hubsme crea un evento en el calendario de Microsoft 365 del organizador.
2. El evento se crea con `isOnlineMeeting: true` y `onlineMeetingProvider: 'teamsForBusiness'`.
3. Graph devuelve el enlace de Teams asociado al evento.
4. Hubsme resuelve el `onlineMeeting` correspondiente mediante su `joinWebUrl`.
5. Hubsme configura la reunión con:
   - `recordAutomatically: true`
   - `meetingSpokenLanguageTag: 'es-ES'`
   - `allowedPresenters: 'everyone'`
   - `lobbyBypassSettings.scope: 'everyone'`

No se debe volver a crear la reunión únicamente con `POST /users/{id}/onlineMeetings`. La API de grabaciones no soporta reuniones creadas de esa forma si no están asociadas a un evento de calendario. Esto fue la causa de que `meeting/recordings` devolviera una lista vacía.

Referencias oficiales:

- [Crear eventos de calendario con Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/calendar-post-events?view=graph-rest-1.0)
- [Listar grabaciones de una reunión](https://learn.microsoft.com/en-us/graph/api/onlinemeeting-list-recordings?view=graph-rest-1.0)
- [Actualizar un onlineMeeting](https://learn.microsoft.com/en-us/graph/api/onlinemeeting-update?view=graph-rest-1.0)

## Variables de entorno

Configurar en `backend-hubsme/.env`:

```env
# Activa la creación de reuniones de Microsoft Teams.
TEAMS_MEETINGS_ENABLED=true

# Microsoft Entra ID / App Registration.
MS_GRAPH_TENANT_ID="tenant-id"
MS_GRAPH_CLIENT_ID="application-client-id"
MS_GRAPH_CLIENT_SECRET="client-secret-value"

# Object ID del usuario que será dueño del calendario y organizador de Teams.
# Ejemplo actual: reunion@hubsme.net.
MS_GRAPH_TEAMS_ORGANIZER_USER_ID="organizer-user-object-id"
```

El `MS_GRAPH_TEAMS_ORGANIZER_USER_ID` es el **Object ID** del usuario en Microsoft Entra ID, no su correo y no el Application/Client ID de la aplicación.

Para cambiar de organizador se debe cambiar también la cuenta que tiene configurado Exchange Online, Teams y OneDrive. Por ejemplo, no basta con cambiar el correo si el Object ID todavía apunta a otro usuario.

## 1. Microsoft Entra ID: registro de aplicación

En [Microsoft Entra admin center](https://entra.microsoft.com/):

1. Crear o reutilizar un **App registration** del tenant.
2. Copiar:
   - **Directory (tenant) ID** → `MS_GRAPH_TENANT_ID`.
   - **Application (client) ID** → `MS_GRAPH_CLIENT_ID`.
3. Crear un secreto en **Certificates & secrets** y guardar el valor una sola vez en `.env`.
4. No subir `.env`, secretos ni capturas con el valor del secreto al repositorio.
5. En **API permissions → Microsoft Graph → Application permissions**, conceder como mínimo los permisos que usa el backend:

   | Permiso | Uso en Hubsme |
   | --- | --- |
   | `Calendars.ReadWrite` | Crear y consultar el evento calendar-backed. |
   | `OnlineMeetings.ReadWrite.All` | Buscar y configurar el `onlineMeeting`. |
   | `OnlineMeetingRecording.Read.All` | Leer las grabaciones de Teams. |
   | `OnlineMeetingTranscript.Read.All` | Leer el contenido de las transcripciones. |
   | `Files.ReadWrite.All` | Leer `Recordings` en OneDrive y crear el enlace compartido. |

6. Pulsar **Grant admin consent** para el tenant.

Los permisos `OnlineMeetings.ReadWrite.All`, `OnlineMeetingRecording.Read.All` y `OnlineMeetingTranscript.Read.All` requieren además una política de acceso de aplicación para limitar el uso al organizador autorizado.

## 2. Application Access Policy de Teams

La política se crea con una cuenta administradora, por ejemplo `erick.flores@cymingenieros.pe`. La cuenta organizadora `reunion@hubsme.net` no necesita entrar al Teams Admin Center.

Instalar y conectar el módulo:

```powershell
Install-Module -Name MicrosoftTeams -Force -AllowClobber
Connect-MicrosoftTeams
```

Crear la política usando el **Client ID de la aplicación**:

```powershell
New-CsApplicationAccessPolicy `
  -Identity "HubsmeTeamsAccessPolicy" `
  -AppIds "<MS_GRAPH_CLIENT_ID>" `
  -Description "Permitir a Hubsme acceder a reuniones y artefactos de Teams"
```

Asignarla al **Object ID del organizador**:

```powershell
Grant-CsApplicationAccessPolicy `
  -PolicyName "HubsmeTeamsAccessPolicy" `
  -Identity "<MS_GRAPH_TEAMS_ORGANIZER_USER_ID>"
```

Verificar la asignación:

```powershell
Get-CsUserPolicyAssignment `
  -Identity "<MS_GRAPH_TEAMS_ORGANIZER_USER_ID>"
```

Los cambios de una Application Access Policy pueden tardar hasta 30 minutos en propagarse en Graph. Si se cambia de organizador, la política debe asignarse también al nuevo usuario.

## 3. Cuenta organizadora en Microsoft 365

El usuario de `MS_GRAPH_TEAMS_ORGANIZER_USER_ID` debe cumplir todo lo siguiente:

- Existir como usuario activo en Entra ID.
- Tener licencia de Microsoft Teams.
- Tener un buzón **UserMailbox** de Exchange Online, no solamente un contacto o un buzón sin aprovisionar.
- Tener OneDrive for Business aprovisionado si se quieren guardar las grabaciones.
- Tener permisos para crear reuniones privadas.

En este proyecto la cuenta usada para las pruebas fue `reunion@hubsme.net`. La cuenta `erick.flores@cymingenieros.pe` se utilizó para administrar Microsoft 365, Exchange y Teams; no es obligatorio que sea el organizador configurado en el `.env`.

Verificar el buzón desde Exchange Online PowerShell:

```powershell
Connect-ExchangeOnline -UserPrincipalName <correo-de-administrador>

Get-Mailbox -Identity reunion@hubsme.net |
  Format-List UserPrincipalName,RecipientTypeDetails
```

El resultado esperado es `RecipientTypeDetails: UserMailbox`.

## 4. Exchange Online: habilitar Teams como proveedor del calendario

Este es el punto más importante del flujo calendar-backed. El calendario del organizador debe aceptar `teamsForBusiness`.

Consultar la configuración:

```powershell
Get-MailboxCalendarConfiguration -Identity reunion@hubsme.net |
  Format-List DefaultOnlineMeetingProvider,OnlineMeetingsByDefaultEnabled
```

Configurar el proveedor predeterminado:

```powershell
Set-MailboxCalendarConfiguration `
  -Identity reunion@hubsme.net `
  -DefaultOnlineMeetingProvider TeamsForBusiness `
  -OnlineMeetingsByDefaultEnabled $true
```

La configuración esperada es:

```text
DefaultOnlineMeetingProvider    : TeamsForBusiness
OnlineMeetingsByDefaultEnabled  : True
```

Importante: `DefaultOnlineMeetingProvider` no es lo mismo que `allowedOnlineMeetingProviders`. Hubsme consulta el calendario mediante Graph y exige que la lista `allowedOnlineMeetingProviders` incluya `teamsForBusiness`. Esa lista es administrada por Microsoft y no se puede completar manualmente desde `Set-MailboxCalendarConfiguration`.

Si Graph devuelve:

```text
allowed=ninguno, default=teamsForBusiness
```

el buzón todavía no está aprovisionado para crear reuniones de Teams desde Calendar. Se debe revisar la licencia, el buzón, la integración Teams-Exchange y esperar la propagación de Microsoft 365. Reiniciar NestJS no corrige ese estado.

También se debe comprobar en Outlook o Teams Calendar que un evento nuevo muestre la opción **Teams meeting**. Si no aparece, el problema sigue estando en el aprovisionamiento de Microsoft 365, no en el código de Hubsme.

## 5. Teams Admin Center

Administrar desde [Microsoft Teams admin center](https://admin.teams.microsoft.com/) usando una cuenta administradora, como `erick.flores@cymingenieros.pe`.

En **Meetings → Meeting policies → Global** —o en la política asignada al organizador— verificar:

- **Private meeting scheduling**: On.
- **Outlook add-in**: On.
- Grabación y transcripción permitidas según la política de la organización.
- El usuario organizador debe mostrar `Global (Org-wide default)` o una política equivalente habilitada en su pestaña **Policies**.

La política de Teams por sí sola no agrega `teamsForBusiness` a `allowedOnlineMeetingProviders`; también son necesarios el buzón de Exchange, la licencia y el aprovisionamiento del calendario.

## 6. Flujo implementado en el backend

La lógica está en `src/modules/admin/meeting/teams-meeting.service.ts`:

```text
confirmar reunión
  -> validar TEAMS_MEETINGS_ENABLED
  -> validar allowedOnlineMeetingProviders
  -> POST /users/{organizerId}/calendar/events
       isOnlineMeeting = true
       onlineMeetingProvider = teamsForBusiness
  -> resolver onlineMeeting.joinUrl
  -> buscar onlineMeeting por joinWebUrl
  -> PATCH /users/{organizerId}/onlineMeetings/{meetingId}
       recordAutomatically = true
       meetingSpokenLanguageTag = es-ES
       allowedPresenters = everyone
       lobbyBypassSettings.scope = everyone
  -> guardar teamsOnlineMeetingId y joinWebUrl en Meeting
  -> programar notificaciones y enviar correos/WhatsApp
```

El frontend usa el `joinWebUrl` para la experiencia de llamada mediante ACS. ACS no almacena las grabaciones ni genera la transcripción; esos artefactos pertenecen a Microsoft Teams.

## 7. Grabaciones y transcripciones

### Grabaciones

El endpoint del backend es:

```text
GET /admin/meeting/recordings/:id
```

El backend consulta:

```text
/users/{organizerId}/onlineMeetings/{onlineMeetingId}/recordings
```

Después intenta asociar cada grabación con un archivo de la carpeta `Recordings` del OneDrive del organizador:

```text
/users/{organizerId}/drive/root:/Recordings:/children
```

Para que el archivo aparezca:

- La reunión debe ser calendar-backed.
- La grabación automática debe iniciar correctamente.
- El organizador debe tener OneDrive for Business aprovisionado.
- La política de almacenamiento/compartición de OneDrive no debe bloquear el acceso.

El enlace anónimo `publicUrl` solo se crea si las políticas del tenant permiten enlaces anónimos. El `webUrl` puede continuar requiriendo inicio de sesión.

### Transcripciones

El endpoint de IA obtiene la transcripción desde:

```text
/users/{organizerId}/onlineMeetings/{onlineMeetingId}/transcripts
```

Luego descarga WebVTT, elimina marcas de tiempo y etiquetas de orador, y envía el texto limpio al servicio de IA para generar el resumen y las tareas.

Las reuniones nuevas se configuran con `meetingSpokenLanguageTag: 'es-ES'`. Este valor debe configurarse antes de que comience la grabación/transcripción para que Teams reconozca correctamente el español.

## 8. Diagnóstico rápido

| Síntoma | Causa probable | Revisión |
| --- | --- | --- |
| `allowed=ninguno` | Calendario sin proveedor Teams aprovisionado | Licencia, UserMailbox, Exchange y propagación. |
| `default=teamsForBusiness` pero falla la creación | El valor predeterminado existe, pero Teams no está en la lista permitida | Verificar Outlook/Teams Calendar y esperar aprovisionamiento. |
| Evento creado sin `joinUrl` | Graph no generó la reunión de Teams | Revisar `allowedOnlineMeetingProviders`, licencia y buzón. |
| `recordings` devuelve vacío | Reunión creada con `/onlineMeetings` puro, grabación aún no procesada o reunión expirada | Crear reuniones calendar-backed y revisar OneDrive. |
| Grabación aparece en Teams pero no en OneDrive | Organizador sin OneDrive/licencia o carga fallida | Revisar OneDrive del organizador y reintentar carga. |
| Transcripción en inglés | Idioma hablado no configurado | Usar una reunión nueva con `meetingSpokenLanguageTag: 'es-ES'`. |
| Error `403` al leer artefactos | Permiso Graph o Application Access Policy incompleta | Revisar consentimiento y asignación al organizador. |

## Frontend: sala embebida mediante ACS

El frontend usa Azure Communication Services para permitir que los usuarios entren a la reunión desde Hubsme:

- `@azure/communication-identity` genera una identidad ACS temporal y un token `voip`.
- `@azure/communication-react` renderiza el `CallComposite`.
- El adaptador usa el `joinWebUrl` generado por Microsoft Graph.
- Al cerrar la sala se libera el adaptador y se desmonta el componente React para apagar cámara y micrófono.

La conexión de ACS no reemplaza la cuenta organizadora de Teams ni la configuración de Exchange/OneDrive.
