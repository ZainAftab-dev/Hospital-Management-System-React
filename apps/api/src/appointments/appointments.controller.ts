import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles';
import { PrismaService } from '../common/prisma.service';
import { UpsertAppointmentDto } from './dto';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AppointmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  async listAppointments() {
    return this.prisma.appointment.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: { patient: true, doctor: true }
    });
  }

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  createAppointment(@Body() body: UpsertAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        id: body.id ?? `APT${Date.now()}`,
        patientId: body.patientId,
        doctorId: body.doctorId,
        date: new Date(body.date),
        time: body.time,
        status: body.status,
        type: body.type ?? 'In-Person',
        notes: body.notes
      },
      include: { patient: true, doctor: true }
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  updateAppointment(@Param('id') id: string, @Body() body: UpsertAppointmentDto) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        date: new Date(body.date),
        time: body.time,
        status: body.status,
        type: body.type ?? 'In-Person',
        notes: body.notes
      },
      include: { patient: true, doctor: true }
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  deleteAppointment(@Param('id') id: string) {
    return this.prisma.appointment.delete({ where: { id } });
  }
}
