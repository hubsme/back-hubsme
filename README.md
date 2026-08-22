# Backend Hubsme

API REST desarrollada con NestJS para la plataforma Hubsme, enfocada en diagnostico empresarial, consultoria para PYMES, reuniones, tareas, documentos y suscripciones.

## 📋 Descripción

Sistema backend que proporciona una API para gestionar:

- **Usuarios**: Registro, autenticacion, roles y perfiles.
- **PYMES**: Datos de empresa, responsables, sector y contacto.
- **Consultores**: Perfil profesional, especialidades, sectores y validacion.
- **Contactos**: Match, aceptacion, rechazo y mensajes entre PYMES y consultores.
- **Diagnosticos**: Evaluacion empresarial asistida por IA y documentos derivados.
- **Reuniones**: Solicitudes, confirmaciones, integracion con Teams, actas y tareas.
- **Suscripciones**: Planes y estado de acceso a la plataforma.

## 🛠️ Tecnologías

- **NestJS** (v11.x) - Framework de Node.js
- **TypeScript** (v5.7.x) - Lenguaje de programación
- **Drizzle ORM** (v0.44.x) - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **dotenv** - Gestión de variables de entorno
- **Microsoft Graph** - Reuniones de Teams, grabaciones, transcripciones y correo
- **Azure Blob Storage** - Almacenamiento de archivos
- **Google Gemini** - Diagnósticos y asistencia de IA
- **Mercado Pago** - Pagos y suscripciones
- **WhatsApp Cloud API** - Notificaciones y webhooks

## 📦 Requisitos Previos

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL instalado y en ejecución

## ⚙️ Instalación

1. **Clonar el repositorio**

```bash
git clone <url-del-repositorio>
cd backend-hubsme
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=hubsme
PORT=6001
```

## 🚀 Comandos de Compilación y Ejecución

### Desarrollo

```bash
# Modo desarrollo con hot-reload
npm run start:dev
```

### Base de Datos (Drizzle)

Estos comandos quedan documentados para mantenimiento humano. La IA no debe ejecutarlos porque la base de datos está en producción. Las migraciones se preparan manualmente y las aplica una persona autorizada.

```bash
# Crear las tablas y estructuras en la base de datos
npm run db:create

# Poblar la base de datos con datos de prueba
npm run db:seed

# Limpiar y resetear la base de datos
npm run db:reset

# Abrir Drizzle Studio (GUI para ver y editar datos)
npm run db:studio
```

## 🎨 Linting y Formato

```bash
# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

## 🌐 API

El servidor se ejecuta en el puerto definido por `PORT` y usa `6001` por defecto: `http://localhost:6001`.

La documentación interactiva de Swagger está disponible en `http://localhost:6001/api`.

## 🕐 Fechas y zona horaria

La zona de negocio de Hubsme es `America/Lima` (UTC-5). Toda conversión debe pasar por `src/functions/date.function.ts`; no se deben repetir offsets, `Intl.DateTimeFormat` con zonas horarias ni conversiones manuales dentro de módulos.

Contrato de fechas:

- Los instantes que viajan por API o se persisten usan ISO 8601 en UTC, por ejemplo `2026-08-20T05:00:00.000Z`.
- Las fechas calendario sin hora usan `YYYY-MM-DD`, por ejemplo `2026-08-20`.
- Si una fecha calendario debe convertirse en instante, `peruDateOnlyToUtc()` la interpreta desde medianoche de Perú. No usar `new Date('YYYY-MM-DD')`, porque JavaScript lo interpreta como medianoche UTC.
- Para mostrar o agrupar instantes en Perú usar `formatInPeru()`, `dateKeyInPeru()` o `monthKeyInPeru()`.
- Para rangos mensuales usar `peruMonthRange()`; para inputs con fecha y hora usar `peruDateTimeInputToUtc()`.
- `formatInUtc()` se reserva para calendarios neutrales o valores `date-only` cuya aritmética es deliberadamente UTC.

Ejemplo:

```ts
import { dateKeyInPeru, formatInPeru, peruDateOnlyToUtc } from '@functions/date.function';

const today = dateKeyInPeru();
const dueAt = peruDateOnlyToUtc('2026-08-20');
const label = formatInPeru(new Date(), { dateStyle: 'long', timeStyle: 'short' });
```

## 💳 Cobros de consultoría y depósitos a consultores

Los checkouts nuevos de consultoría se crean con `collection_destination = hubsme`: Mercado Pago cobra el importe completo usando la cuenta de Hubsme y no recibe `marketplace_fee`. El campo `checkout.marketplace_fee` conserva únicamente la comisión contable configurada en `MERCADO_PAGO_PLATFORM_FEE_PERCENT` para calcular el neto que corresponde al consultor.

Cuando Mercado Pago confirma un pago real de consultoría:

1. El total cobrado queda registrado en `checkout.amount`.
2. El cargo real de Mercado Pago se obtiene de `raw_payment.transaction_details.net_received_amount` (con `fee_details` como respaldo) y se guarda en `meeting_consultant_payout.mercado_pago_fee_amount` y `mercado_pago_fee_percent`.
3. La comisión contable de Hubsme queda registrada en `checkout.marketplace_fee`.
4. Se crea idempotentemente una obligación `meeting_consultant_payout` en estado `pending` por el neto real recibido menos la comisión de Hubsme (`net_received_amount - marketplace_fee`).
5. El administrador realiza el depósito fuera del sistema y lo registra desde Backoffice > Reuniones > Pagos a consultores.
6. Para cambiar la obligación a `paid` son obligatorias la referencia, la constancia PDF/imagen, la fecha y el administrador responsable.

El cargo de Mercado Pago no se calcula con un porcentaje fijo: puede incluir comisión, IGV y un importe fijo según la configuración y el momento de liberación del dinero. Por eso el valor de la API de Mercado Pago es la fuente de verdad para cada operación. La migración `src/db/migrations/version_010/v010_001_add_mercado_pago_fee_to_meeting_consultant_payout.sql` agrega estos campos y corrige únicamente las obligaciones pendientes; los pagos ya realizados conservan el importe histórico transferido.

Los cupones no generan obligaciones monetarias y las cuotas de servicios usan su flujo propio. Los checkouts históricos de consultoría se conservan con destino `consultant` para no duplicar deudas ya liquidadas mediante el split anterior.

La estructura se incorpora mediante las migraciones manuales `src/db/migrations/version_009/v009_001_create_meeting_consultant_payout.sql`, `src/db/migrations/version_009/v009_002_create_meeting_reschedule_history.sql` y `src/db/migrations/version_010/v010_001_add_mercado_pago_fee_to_meeting_consultant_payout.sql`. Debido a que la base está en producción, debe aplicarlas una persona autorizada; la IA no ejecuta migraciones.

## 👥 Organizaciones y acceso compartido

Una PYME funciona como organización compartida. El perfil `pyme` sigue representando a la empresa y sus recursos continúan relacionados mediante `pyme_id`; las cuentas personales se vinculan a esa empresa con `pyme_member`.

- Cada usuario puede tener una sola membresía activa en este MVP.
- El usuario que creó la PYME es miembro `owner`; la migración `version_011` agrega esta membresía a las empresas históricas.
- Un `owner` puede invitar correos desde Equipo. La invitación vence en 7 días y la base solo guarda el hash SHA-256 del token.
- Si el invitado todavía no tiene cuenta, el registro por invitación crea `app_user` y `pyme_member`, pero no crea otra fila `pyme` ni otra suscripción.
- Si ya tiene una cuenta compatible sin organización, inicia sesión y acepta el mismo token.
- Los miembros ven los diagnósticos, reuniones, calendario, tareas, servicios y documentos de la organización. En el MVP su acceso es de solo lectura; el propietario conserva las operaciones de creación, edición, pago y administración del equipo.
- El JWT identifica a la persona. En cada petición autenticada el backend resuelve `pymeId` y `membershipRole` desde la membresía activa, por lo que el alcance no depende del ID enviado por el navegador.

La migración manual `src/db/migrations/version_011/v011_001_create_pyme_organization_membership.sql` crea `pyme_member`, `pyme_invitation` y el backfill de propietarios. La aplicación no ejecuta esta migración automáticamente.

### Endpoints principales

- `POST /auth/login` y `POST /auth/register`: autenticación de usuarios.
- `/admin/*`: API protegida con JWT para PYMES y consultores.
- `/admin/backoffice/*`: API protegida con autenticación administrativa.
- `/public/consultant/*`: consultas públicas de consultores.
- `/storage/*`: subida, descarga y eliminación de archivos.

## 🔧 Scripts Disponibles

| Comando               | Descripción                                 |
| --------------------- | ------------------------------------------- |
| `npm run build`       | Compila el proyecto TypeScript a JavaScript |
| `npm start`           | Inicia la aplicación en modo normal         |
| `npm run start:dev`   | Inicia en modo desarrollo con hot-reload    |
| `npm run start:debug` | Inicia en modo debug                        |
| `npm run start:prod`  | Inicia la aplicación compilada              |
| `npm run db:studio`   | Abre Drizzle Studio                         |
| `npm run generate:types` | Genera el cliente tipado para el frontend |
| `npm run lint`        | Ejecuta ESLint para encontrar problemas     |
| `npm run format`      | Formatea el código con Prettier             |

## 📝 Modelos de Datos

- **User**: Usuarios de la plataforma.
- **Pyme**: Empresas registradas.
- **Consultant**: Consultores disponibles en la plataforma.
- **PymeConsultantMatch**: Relacion/contacto entre PYME y consultor.
- **PymeConsultantMessage**: Mensajes dentro de un contacto.
- **Diagnostic**: Diagnosticos empresariales.
- **DiagnosticDocument**: Documentos generados desde diagnosticos.
- **Meeting**: Reuniones entre PYME y consultor.
- **Task**: Tareas asociadas al seguimiento.
- **Subscription**: Planes y estados de suscripcion.
- **DashboardAlert**: Alertas del tablero.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

Proyecto Hubsme - Backend Team

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo.
