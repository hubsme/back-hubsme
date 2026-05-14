import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { PymeConsultantMessageDTO, pymeConsultantMessage } from '@db/tables/pyme-consultant-message.table';
import { user } from '@db/tables/user.table';

@Injectable()
export class PymeConsultantMessageRepository {
  async findAllByMatch(matchId: number) {
    return await database
      .select({
        id: pymeConsultantMessage.id,
        createdAt: pymeConsultantMessage.createdAt,
        updatedAt: pymeConsultantMessage.updatedAt,
        deletedAt: pymeConsultantMessage.deletedAt,
        matchId: pymeConsultantMessage.matchId,
        senderId: pymeConsultantMessage.senderId,
        senderName: user.name,
        senderRole: user.role,
        message: pymeConsultantMessage.message,
        readAt: pymeConsultantMessage.readAt,
      })
      .from(pymeConsultantMessage)
      .leftJoin(user, eq(pymeConsultantMessage.senderId, user.id))
      .where(and(eq(pymeConsultantMessage.matchId, matchId), isNull(pymeConsultantMessage.deletedAt)))
      .orderBy(asc(pymeConsultantMessage.createdAt));
  }

  async create(data: PymeConsultantMessageDTO) {
    const result = await database.insert(pymeConsultantMessage).values(data).returning();
    return result[0];
  }
}
