import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WardsController } from './wards.controller';

@Module({
  controllers: [WardsController],
  providers: [PrismaService]
})
export class WardsModule {}
