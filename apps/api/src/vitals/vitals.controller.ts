import { Body, Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles';
import { PrismaService } from '../common/prisma.service';
import { RecordVitalDto } from './dto';

@Controller('patients/:patientId/vitals')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VitalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.STAFF)
  list(@Param('patientId') patientId: string, @Query('take') take?: string) {
    const limit = Math.min(Math.max(Number(take) || 12, 1), 100);
    return this.prisma.vital.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      take: limit
    });
  }

  @Post()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.STAFF)
  async record(
    @Param('patientId') patientId: string,
    @Body() body: RecordVitalDto,
    @Req() request: { user: { id: string } }
  ) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) throw new NotFoundException('Patient not found');
    return this.prisma.vital.create({ data: { ...body, patientId, recordedById: request.user.id } });
  }
}
