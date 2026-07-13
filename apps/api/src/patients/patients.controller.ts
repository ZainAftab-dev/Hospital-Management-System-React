import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles';
import { PrismaService } from '../common/prisma.service';
import { UpsertPatientDto } from './dto';

@Controller('patients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PatientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST)
  listPatients(
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string
  ) {
    const limit = Math.min(Number(take ?? 1000), 1000);
    const offset = Math.max(Number(skip ?? 0), 0);
    if (search) {
      return this.prisma.patient.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { id: { contains: search } },
            { contact: { contains: search } },
            { disease: { contains: search } }
          ]
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset
      });
    }
    return this.prisma.patient.findMany({ orderBy: { name: 'asc' }, take: limit, skip: offset });
  }

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  createPatient(@Body() body: UpsertPatientDto) {
    return this.prisma.patient.create({
      data: {
        id: body.id ?? `P${Date.now()}`,
        name: body.name,
        age: body.age,
        gender: body.gender,
        contact: body.contact,
        email: body.email,
        address: body.address,
        disease: body.disease,
        bloodGroup: body.bloodGroup,
        allergies: body.allergies,
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        photoUrl: body.photoUrl,
        status: body.status ?? 'Stable'
      }
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  updatePatient(@Param('id') id: string, @Body() body: UpsertPatientDto) {
    return this.prisma.patient.update({
      where: { id },
      data: {
        name: body.name,
        age: body.age,
        gender: body.gender,
        contact: body.contact,
        email: body.email,
        address: body.address,
        disease: body.disease,
        bloodGroup: body.bloodGroup,
        allergies: body.allergies,
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        photoUrl: body.photoUrl,
        status: body.status ?? 'Stable'
      }
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deletePatient(@Param('id') id: string) {
    return this.prisma.patient.delete({ where: { id } });
  }
}
