import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { dbConfig } from '@db/config.db';

import { user } from '@db/tables/user.table';
import { pyme } from '@db/tables/pyme.table';
import { consultant } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { task } from '@db/tables/task.table';
import { diagnostic } from '@db/tables/diagnostic.table';
import { subscription } from '@db/tables/subscription.table';

const pool = new Pool(dbConfig);

const schema = {
  user,
  pyme,
  consultant,
  meeting,
  task,
  diagnostic,
  subscription,
};

export const database = drizzle(pool, { schema: schema });
