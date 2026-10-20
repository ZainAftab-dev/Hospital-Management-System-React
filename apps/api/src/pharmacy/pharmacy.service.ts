import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { DispenseMedicineDto, UpsertMedicineDto } from './dto';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService) {}

  listDispensations(filters: { patientId?: string; take: number }) {
    return this.prisma.dispensation.findMany({
      where: filters.patientId ? { patientId: filters.patientId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(filters.take, 1), 100),
      include: { items: { include: { medicine: { select: { id: true, name: true, unit: true } } } } }
    });
  }

  listMedicines(filters: { search?: string; category?: string }) {
    const where: Prisma.MedicineWhereInput = {};
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search } },
        { name: { contains: filters.search } },
        { manufacturer: { contains: filters.search } }
      ];
    }
    if (filters.category && filters.category !== 'all') where.category = filters.category;
    return this.prisma.medicine.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  }

  createMedicine(dto: UpsertMedicineDto) {
    return this.prisma.medicine.create({
      data: {
        id: dto.id ?? `M${Date.now()}`,
        name: dto.name,
        manufacturer: dto.manufacturer,
        category: dto.category,
        priceCents: dto.priceCents,
        quantity: dto.quantity,
        reorderLevel: dto.reorderLevel,
        description: dto.description,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        batchNumber: dto.batchNumber,
        unit: dto.unit
      }
    });
  }

  updateMedicine(id: string, dto: UpsertMedicineDto) {
    return this.prisma.medicine.update({
      where: { id },
      data: {
        name: dto.name,
        manufacturer: dto.manufacturer,
        category: dto.category,
        priceCents: dto.priceCents,
        quantity: dto.quantity,
        reorderLevel: dto.reorderLevel,
        description: dto.description,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        batchNumber: dto.batchNumber,
        unit: dto.unit
      }
    });
  }

  deleteMedicine(id: string) {
    return this.prisma.medicine.delete({ where: { id } });
  }

  async dispense(dto: DispenseMedicineDto, pharmacistId: string) {
    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({ where: { id: dto.patientId } });
      if (!patient) throw new NotFoundException('Patient not found');

      const medicines = await tx.medicine.findMany({
        where: { id: { in: dto.items.map((item) => item.medicineId) } }
      });
      const medicineById = new Map(medicines.map((medicine) => [medicine.id, medicine]));

      for (const item of dto.items) {
        const medicine = medicineById.get(item.medicineId);
        if (!medicine) throw new NotFoundException(`Medicine ${item.medicineId} not found`);
        if (item.quantity > medicine.quantity) {
          throw new BadRequestException(`${medicine.name} has only ${medicine.quantity} units available`);
        }
      }

      const totalCents = dto.items.reduce((sum, item) => {
        const medicine = medicineById.get(item.medicineId)!;
        return sum + medicine.priceCents * item.quantity;
      }, 0);

      const invoice =
        dto.invoiceId
          ? await tx.invoice.findUnique({ where: { id: dto.invoiceId } })
          : await tx.invoice.create({
              data: {
                invoiceNo: `INV-${Date.now()}`,
                patientId: dto.patientId,
                status: 'UNPAID'
              }
            });

      if (!invoice) throw new NotFoundException('Invoice not found');

      const dispensation = await tx.dispensation.create({
        data: {
          patientId: dto.patientId,
          pharmacistId,
          invoiceId: invoice.id,
          totalCents,
          items: {
            create: dto.items.map((item) => {
              const medicine = medicineById.get(item.medicineId)!;
              return {
                medicineId: item.medicineId,
                quantity: item.quantity,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                unitPriceCents: medicine.priceCents,
                lineTotalCents: medicine.priceCents * item.quantity
              };
            })
          }
        },
        include: { items: true }
      });

      for (const item of dto.items) {
        const result = await tx.medicine.updateMany({
          where: { id: item.medicineId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } }
        });
        if (result.count !== 1) {
          const medicine = medicineById.get(item.medicineId);
          throw new BadRequestException(`${medicine?.name ?? item.medicineId} no longer has enough stock`);
        }
      }

      await tx.invoiceItem.createMany({
        data: dto.items.map((item) => {
          const medicine = medicineById.get(item.medicineId)!;
          return {
            invoiceId: invoice.id,
            description: `Medicine - ${medicine.name}`,
            quantity: item.quantity,
            unitPriceCents: medicine.priceCents,
            amountCents: medicine.priceCents * item.quantity,
            sourceType: 'PHARMACY',
            sourceId: dispensation.id
          };
        })
      });

      const invoiceItems = await tx.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
      const subtotalCents = invoiceItems.reduce((sum, item) => sum + item.amountCents, 0);
      const totalAfterAdjustments = subtotalCents - invoice.discountCents + invoice.taxCents;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { subtotalCents, totalCents: totalAfterAdjustments },
        include: { items: true, patient: true }
      });

      return { dispensation, invoice: updatedInvoice };
    });
  }
}
