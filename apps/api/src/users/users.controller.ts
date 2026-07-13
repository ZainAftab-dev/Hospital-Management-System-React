import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { hash } from 'bcryptjs';
import { Role } from '../auth/roles';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../common/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  department: true,
  status: true,
  createdAt: true
};

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN)
  async listUsers(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = Math.min(Number(take ?? 500), 500);
    const offset = Math.max(Number(skip ?? 0), 0);
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: userSelect,
      take: limit,
      skip: offset
    });
  }

  @Post()
  @Roles(Role.ADMIN)
  async createUser(@Body() body: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email.trim().toLowerCase(),
        passwordHash: await hash(body.password, 12),
        role: body.role,
        phone: body.phone,
        department: body.department,
        status: body.status ?? 'Active'
      },
      select: userSelect
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const passwordData = body.password ? { passwordHash: await hash(body.password, 12) } : {};

    return this.prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email.trim().toLowerCase(),
        role: body.role,
        phone: body.phone,
        department: body.department,
        status: body.status ?? 'Active',
        ...passwordData
      },
      select: userSelect
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: userSelect
    });
  }
}