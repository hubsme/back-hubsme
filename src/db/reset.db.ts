import { sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { dbConfig } from '@db/config.db';

async function reset() {
  try {
    // Validación de seguridad: solo permitir en localhost
    const isLocalhost = dbConfig.host === 'localhost' || dbConfig.host === '127.0.0.1' || dbConfig.host === '::1';

    if (!isLocalhost) {
      console.error('❌ Error: Solo se puede ejecutar reset en localhost');
      console.error(`   Host actual: ${dbConfig.host}`);
      process.exit(1);
    }

    console.log('🗑️  Eliminando todas las tablas y enums...');

    // Eliminar todas las tablas en cascada
    await database.execute(sql`DROP SCHEMA public CASCADE`);
    await database.execute(sql`CREATE SCHEMA public`);

    console.log('✅ Base de datos limpiada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  }
}

reset();
