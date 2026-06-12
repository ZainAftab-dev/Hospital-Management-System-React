import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles';
import { PrismaService } from '../common/prisma.service';
import { UpsertInvoiceDto } from './dto';

@Controller('billing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BillingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PHARMACIST)
  listInvoices() {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: true, items: true }
    });
  }

  @Get('patient/:patientId/current')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PHARMACIST)
  async currentInvoice(@Param('patientId') patientId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { patientId, status: { in: ['DRAFT', 'UNPAID'] } },
      orderBy: { createdAt: 'desc' },
      include: { patient: true, items: true }
    });
    return invoice;
  }

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  createInvoice(@Body() body: UpsertInvoiceDto) {
    const subtotalCents = body.items.reduce((sum, item) => sum + item.amountCents, 0);
    const totalCents = subtotalCents - body.discountCents + body.taxCents;
    return this.prisma.invoice.create({
      data: {
        invoiceNo: body.invoiceNo,
        patientId: body.patientId,
        status: body.status,
        subtotalCents,
        discountCents: body.discountCents,
        taxCents: body.taxCents,
        totalCents,
        paymentMode: body.paymentMode,
        items: {
          create: body.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            amountCents: item.amountCents,
            sourceType: item.sourceType ?? 'MANUAL',
            sourceId: item.sourceId
          }))
        }
      },
      include: { patient: true, items: true }
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  async updateInvoice(@Param('id') id: string, @Body() body: UpsertInvoiceDto) {
    const subtotalCents = body.items.reduce((sum, item) => sum + item.amountCents, 0);
    const totalCents = subtotalCents - body.discountCents + body.taxCents;
    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          invoiceNo: body.invoiceNo,
          patientId: body.patientId,
          status: body.status,
          subtotalCents,
          discountCents: body.discountCents,
          taxCents: body.taxCents,
          totalCents,
          paymentMode: body.paymentMode,
          items: {
            create: body.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              amountCents: item.amountCents,
              sourceType: item.sourceType ?? 'MANUAL',
              sourceId: item.sourceId
            }))
          }
        },
        include: { patient: true, items: true }
      });
    });
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PHARMACIST)
  updateInvoiceStatus(@Param('id') id: string, @Body() body: { status: string; paymentMode?: string }) {
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.paymentMode ? { paymentMode: body.paymentMode } : {})
      },
      include: { patient: true, items: true }
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  deleteInvoice(@Param('id') id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}
