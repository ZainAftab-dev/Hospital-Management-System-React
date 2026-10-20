import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { VitalsController } from './vitals.controller';

@Module({
  controllers: [VitalsController],
  providers: [PrismaService]
})
export class VitalsModule {}
