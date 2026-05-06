import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { dbConfig } from '@db/config.db';

async function migrate() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    console.log('🔄 Iniciando migraciones...');

    // Crear tabla de migraciones si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        aplicado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Leer archivos de migración
    const versionDir = process.env.DB_VERSION || '';
    const migrationsDir = path.join(__dirname, 'migrations', versionDir);

    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ Directorio de migraciones no encontrado: ${migrationsDir}`);
      process.exit(1);
    }

    console.log(`📂 Buscando migraciones en: migrations/${versionDir}`);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`📁 Encontradas ${files.length} migraciones`);

    for (const file of files) {
      // Verificar si ya fue aplicada
      const { rows } = await client.query('SELECT 1 FROM migraciones_aplicadas WHERE nombre = $1', [file]);

      if (rows.length > 0) {
        console.log(`⏭️  Saltando (ya aplicada): ${file}`);
        continue;
      }

      // Leer y ejecutar migración
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      console.log(`🚀 Aplicando: ${file}`);
      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query('INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Completada: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('✅ Todas las migraciones completadas');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
