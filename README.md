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
```

## 🚀 Comandos de Compilación y Ejecución

### Desarrollo

```bash
# Modo desarrollo con hot-reload
npm run start:dev
```

### Base de Datos (Drizzle)

```bash
# Crear las tablas y estructuras en la base de datos
npm run db:create

# Poblar la base de datos con datos de prueba
npm run db:seed

# Limpiar y resetear la base de datos
npm run db:reset

# Abrir Drizzle Studio (GUI para ver y editar datos)
npx run db:studio
```

## 🎨 Linting y Formato

```bash
# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

## 🌐 API

El servidor se ejecuta por defecto en `http://localhost:6001`

### Endpoints principales

_(Por definir según implementación de controladores)_

## 🔧 Scripts Disponibles

| Comando               | Descripción                                 |
| --------------------- | ------------------------------------------- |
| `npm run build`       | Compila el proyecto TypeScript a JavaScript |
| `npm start`           | Inicia la aplicación en modo normal         |
| `npm run start:dev`   | Inicia en modo desarrollo con hot-reload    |
| `npm run start:debug` | Inicia en modo debug                        |
| `npm run start:prod`  | Inicia la aplicación compilada              |
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
