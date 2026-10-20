import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles';
import { PrismaService } from '../common/prisma.service';
import { UpdateWardOccupancyDto } from './dto';

@Controller('wards')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WardsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.STAFF)
  listWards() {
    return this.prisma.ward.findMany({ orderBy: { name: 'asc' } });
  }

  @Patch(':id/occupancy')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.STAFF)
  async updateOccupancy(@Param('id') id: string, @Body() body: UpdateWardOccupancyDto) {
    const ward = await this.prisma.ward.findUnique({ where: { id } });
    if (!ward) throw new NotFoundException('Ward not found');
    if (body.occupiedBeds > ward.totalBeds) {
      throw new BadRequestException(`Occupied beds cannot exceed the ward's ${ward.totalBeds} beds`);
    }
    return this.prisma.ward.update({ where: { id }, data: { occupiedBeds: body.occupiedBeds } });
  }
}
