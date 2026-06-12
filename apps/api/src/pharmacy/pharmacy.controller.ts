import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles';
import { DispenseMedicineDto, UpsertMedicineDto } from './dto';
import { PharmacyService } from './pharmacy.service';

@Controller('pharmacy')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacy: PharmacyService) {}

  @Get('medicines')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST)
  listMedicines(@Query('search') search?: string, @Query('category') category?: string) {
    return this.pharmacy.listMedicines({ search, category });
  }

  @Post('medicines')
  @Roles(Role.ADMIN, Role.PHARMACIST)
  createMedicine(@Body() body: UpsertMedicineDto) {
    return this.pharmacy.createMedicine(body);
  }

  @Put('medicines/:id')
  @Roles(Role.ADMIN, Role.PHARMACIST)
  updateMedicine(@Param('id') id: string, @Body() body: UpsertMedicineDto) {
    return this.pharmacy.updateMedicine(id, body);
  }

  @Delete('medicines/:id')
  @Roles(Role.ADMIN, Role.PHARMACIST)
  deleteMedicine(@Param('id') id: string) {
    return this.pharmacy.deleteMedicine(id);
  }

  @Post('dispense')
  @Roles(Role.ADMIN, Role.PHARMACIST)
  dispense(@Body() body: DispenseMedicineDto, @Req() request: { user: { id: string } }) {
    return this.pharmacy.dispense(body, request.user.id);
  }
}
