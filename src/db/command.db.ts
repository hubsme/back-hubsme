import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { dbConfig } from '@db/config.db';

async function executeCommands() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    console.log('🔄 Iniciando ejecución de comandos SQL...');

    // Crear tabla de control de comandos si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS comandos_ejecutados (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        ejecutado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Leer archivos de comandos
    const versionDir = process.env.DB_VERSION || '';
    const commandsDir = path.join(__dirname, 'commands', versionDir);

    if (!fs.existsSync(commandsDir)) {
      console.log('⚠️ No se encontró el directorio de comandos.');
      return;
    }

    const files = fs
      .readdirSync(commandsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`📁 Encontrados ${files.length} comandos`);

    for (const file of files) {
      // Verificar si ya fue ejecutado
      const { rows } = await client.query('SELECT 1 FROM comandos_ejecutados WHERE nombre = $1', [file]);

      if (rows.length > 0) {
        console.log(`⏭️  Saltando (ya ejecutado): ${file}`);
        continue;
      }

      // Leer y ejecutar comando
      const sqlPath = path.join(commandsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      console.log(`🚀 Ejecutando: ${file}`);
      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query('INSERT INTO comandos_ejecutados (nombre) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Completado: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error ejecutando ${file}:`, err);
        throw err;
      }
    }

    console.log('✅ Todos los comandos ejecutados correctamente');
  } catch (error) {
    console.error('❌ Error general en ejecución de comandos:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

executeCommands();
