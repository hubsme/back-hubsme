import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { dbConfig } from '@db/config.db';

import { meeting } from '@db/tables/meeting.table';
import { user } from '@db/tables/user.table';
import { pyme } from '@db/tables/pyme.table';
import { subscription } from '@db/tables/subscription.table';
import { diagnostic } from '@db/tables/diagnostic.table';
import { consultant } from '@db/tables/consultant.table';
import { task } from '@db/tables/task.table';

const pool = new Pool(dbConfig);

const schema = {
  meeting,
  user,
  pyme,
  subscription,
  diagnostic,
  consultant,
  task,
};

export const database = drizzle(pool, { schema: schema });
