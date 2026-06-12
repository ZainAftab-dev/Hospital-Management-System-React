import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles';
import { PrismaService } from '../common/prisma.service';
import { UpsertDoctorDto } from './dto';

@Controller('doctors')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DoctorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PHARMACIST)
  listDoctors() {
    return this.prisma.doctor.findMany({ orderBy: [{ specialization: 'asc' }, { name: 'asc' }] });
  }

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  createDoctor(@Body() body: UpsertDoctorDto) {
    return this.prisma.doctor.create({
      data: {
        id: body.id ?? `D${Date.now()}`,
        name: body.name,
        age: body.age,
        gender: body.gender,
        contact: body.contact,
        email: body.email,
        address: body.address,
        specialization: body.specialization,
        qualification: body.qualification,
        availability: body.availability,
        consultationFee: body.consultationFee,
        licenseNumber: body.licenseNumber
      }
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  updateDoctor(@Param('id') id: string, @Body() body: UpsertDoctorDto) {
    return this.prisma.doctor.update({
      where: { id },
      data: {
        name: body.name,
        age: body.age,
        gender: body.gender,
        contact: body.contact,
        email: body.email,
        address: body.address,
        specialization: body.specialization,
        qualification: body.qualification,
        availability: body.availability,
        consultationFee: body.consultationFee,
        licenseNumber: body.licenseNumber
      }
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteDoctor(@Param('id') id: string) {
    return this.prisma.doctor.delete({ where: { id } });
  }
}
