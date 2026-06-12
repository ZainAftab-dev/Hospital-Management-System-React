import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { DoctorsController } from './doctors.controller';

@Module({
  controllers: [DoctorsController],
  providers: [PrismaService]
})
export class DoctorsModule {}
