import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PatientsController } from './patients.controller';

@Module({
  controllers: [PatientsController],
  providers: [PrismaService]
})
export class PatientsModule {}
