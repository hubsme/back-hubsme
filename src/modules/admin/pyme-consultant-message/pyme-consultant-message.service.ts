import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PymeConsultantMessageRepository } from '@repositories/pyme-consultant-message.repository';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMessageCreateDto } from './dto/pyme-consultant-message-create.dto';
import { PymeConsultantMessageListFiltersDto } from './dto/pyme-consultant-message-list.dto';

@Injectable()
export class PymeConsultantMessageService {
  constructor(
    private readonly messageRepository: PymeConsultantMessageRepository,
    private readonly matchRepository: PymeConsultantMatchRepository,
  ) {}

  async findAll(filters: PymeConsultantMessageListFiltersDto) {
    const match = await this.matchRepository.findOne(filters.matchId);
    if (!match) throw new NotFoundException(`Match with ID ${filters.matchId} not found`);
    return { data: await this.messageRepository.findAllByMatch(filters.matchId) };
  }

  async create(data: PymeConsultantMessageCreateDto) {
    const match = await this.matchRepository.findOne(data.matchId);
    if (!match) throw new NotFoundException(`Match with ID ${data.matchId} not found`);
    if (match.status !== 'aceptado') {
      throw new BadRequestException(['El inbox se habilita cuando el match esta aceptado']);
    }
    if (data.senderId !== match.pymeId && data.senderId !== match.consultantId) {
      throw new BadRequestException(['El remitente no pertenece a este match']);
    }

    return this.messageRepository.create({
      matchId: data.matchId,
      senderId: data.senderId,
      message: data.message.trim(),
    });
  }
}
