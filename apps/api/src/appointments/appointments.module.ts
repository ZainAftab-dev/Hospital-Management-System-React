import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AppointmentsController } from './appointments.controller';

@Module({
  controllers: [AppointmentsController],
  providers: [PrismaService]
})
export class AppointmentsModule {}
