import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { pyme } from '@db/tables/pyme.table';
import { user } from '@db/tables/user.table';
import { and, eq, inArray, isNull } from 'drizzle-orm';

@Injectable()
export class UserJoinQuery {
  @TraceNode({ name: 'user.findPymeNames', type: 'method' })
  async findPymeNames(pymeIds: number[]) {
    return pymeIds.length > 0
      ? await database
          .select({ userId: pyme.id, pymeName: pyme.name, userName: user.name })
          .from(user)
          .leftJoin(pyme, eq(pyme.id, user.id))
          .where(and(inArray(user.id, pymeIds), isNull(user.deletedAt)))
      : [];
  }
}
