import { UserQuery } from '@queries/user/user.query';
import { Module } from '@nestjs/common';
import { UserController } from '@modules/admin/modules/user/user.controller';
import { UserService } from '@modules/admin/modules/user/user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserQuery],
  exports: [UserService],
})
export class UserModule {}
