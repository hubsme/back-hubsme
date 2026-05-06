import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

// Configuración básica
const dbVersion = process.env.DB_VERSION || 'backup_default';
const backupDir = path.join(process.cwd(), 'src', 'db', 'backups');

const runBackup = () => {
  // 1. Asegurar que existe el directorio de backups
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 2. Nombre del archivo LIMPIO (Solo la versión)
  // Si tu .env dice DB_VERSION=version_002, el archivo será version_002.sql
  const fileName = `${dbVersion}.sql`;
  const filePath = path.join(backupDir, fileName);

  const { DB_HOST, DB_USER, DB_NAME, DB_CONTAINER_NAME, DB_PASSWORD, DB_PORT } = process.env;

  // 3. Detección de entorno
  const isLocalhost = !DB_HOST || DB_HOST === 'localhost' || DB_HOST === '127.0.0.1' || DB_HOST === '::1';
  const port = DB_PORT || '5432';

  let args: string[] = [];

  console.log(`📦 Iniciando Backup...`);
  console.log(`📂 Archivo destino: ${fileName}`);

  if (isLocalhost) {
    // === MODO LOCAL (Docker Exec) ===
    if (!DB_CONTAINER_NAME) {
      console.error('❌ Error: DB_CONTAINER_NAME es requerido en local.');
      process.exit(1);
    }

    console.log(`🖥️  Modo Local: Extrayendo desde contenedor '${DB_CONTAINER_NAME}'`);

    args = [
      'exec',
      '-i',
      DB_CONTAINER_NAME,
      'pg_dump',
      '-U',
      DB_USER!,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-acl',
      DB_NAME!,
    ];

    if (DB_PASSWORD) {
      args.splice(2, 0, '-e', `PGPASSWORD=${DB_PASSWORD}`);
    }
  } else {
    // === MODO NUBE (Docker Run Efímero) ===
    console.log(`☁️  Modo Nube: Conectando a servidor ${DB_HOST}:${port}`);

    args = [
      'run',
      '--rm',
      '-i',
      '-e',
      `PGPASSWORD=${DB_PASSWORD}`,
      'postgres',
      'pg_dump',
      '-h',
      DB_HOST!,
      '-p',
      port,
      '-U',
      DB_USER!,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-acl',
      DB_NAME!,
    ];
  }

  console.log(`⏳ Ejecutando comando Docker...`);

  // 4. Ejecutar el proceso
  const child = spawn('docker', args);
  const fileStream = fs.createWriteStream(filePath);

  // Redirigir la salida al archivo (sobrescribe si existe)
  child.stdout.pipe(fileStream);

  child.stderr.on('data', (data) => {
    const msg = data.toString();
    // Ignorar mensajes informativos
    if (!msg.startsWith('NOTICE') && !msg.includes('extension "plpgsql" already exists')) {
      // console.log(`pg_dump log: ${msg}`);
    }
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ Backup generado exitosamente: ${filePath}`);

      // Mostrar tamaño
      try {
        const stats = fs.statSync(filePath);
        const sizeInMB = stats.size / (1024 * 1024);
        console.log(`📊 Tamaño: ${sizeInMB.toFixed(2)} MB`);
      } catch (e) {}
    } else {
      console.error(`❌ Error (Código ${code}).`);
      // Borrar si quedó vacío
      if (fs.existsSync(filePath) && fs.statSync(filePath).size === 0) {
        fs.unlinkSync(filePath);
      }
    }
  });

  child.on('error', (err) => {
    console.error('❌ Error crítico:', err.message);
  });
};

runBackup();
