import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BillingController } from './billing.controller';

@Module({
  controllers: [BillingController],
  providers: [PrismaService]
})
export class BillingModule {}
