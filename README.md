# Backend Hubsme 🐕

API REST desarrollada con NestJS para la gestión de una veterinaria especializada en el cuidado de mascotas. El sistema permite administrar clientes, mascotas, baños y tratamientos.

## 📋 Descripción

Sistema backend que proporciona una API para gestionar:

- **Clientes**: Registro y gestión de propietarios de mascotas
- **Mascotas**: Información de las mascotas (razas, especies, etc.)
- **Baños**: Tipos de baños y servicios de limpieza
- **Tratamientos**: Tipos de tratamientos médicos y seguimiento

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
cd backend-cachorros
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

El servidor se ejecuta por defecto en `http://localhost:3000`

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

- **Customer**: Clientes/propietarios de mascotas
- **Pet**: Mascotas registradas en el sistema
- **Specie**: Especies de animales (perro, gato, etc.)
- **Breed**: Razas de mascotas
- **Bath**: Registros de baños realizados
- **BathType**: Tipos de servicios de baño
- **Treatment**: Tratamientos médicos aplicados
- **TreatmentType**: Tipos de tratamientos disponibles

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
