import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { hash } from 'bcryptjs';
import { Role } from '../auth/roles';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../common/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN)
  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        status: true,
        createdAt: true
      }
    });
  }

  @Post()
  @Roles(Role.ADMIN)
  async createUser(@Body() body: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: await hash(body.password ?? 'Password@123', 12),
        role: body.role,
        phone: body.phone,
        department: body.department,
        status: body.status ?? 'Active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        status: true,
        createdAt: true
      }
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
        email: body.email,
        role: body.role,
        phone: body.phone,
        department: body.department,
        status: body.status ?? 'Active',
        ...passwordData
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        status: true,
        createdAt: true
      }
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        status: true,
        createdAt: true
      }
    });
  }
}
