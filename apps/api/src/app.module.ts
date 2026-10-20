import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { PrismaService } from './common/prisma.service';
import { DoctorsModule } from './doctors/doctors.module';
import { HealthController } from './health.controller';
import { PatientsModule } from './patients/patients.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { UsersModule } from './users/users.module';
import { VitalsModule } from './vitals/vitals.module';
import { WardsModule } from './wards/wards.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    PharmacyModule,
    BillingModule,
    UsersModule,
    WardsModule,
    VitalsModule
  ],
  controllers: [HealthController],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}