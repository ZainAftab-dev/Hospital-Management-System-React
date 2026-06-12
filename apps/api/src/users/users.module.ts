import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [PrismaService]
})
export class UsersModule {}
