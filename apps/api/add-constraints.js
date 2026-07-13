/**
 * HMS — Add SQL Server CHECK Constraints
 * Run once: node apps/api/add-constraints.js  (from project root)
 * Safe to re-run — skips constraints that already exist.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CONSTRAINTS = [
  // ── User ──────────────────────────────────────────────────────────
  ['[chk_user_role]',   '[dbo].[User]',
    `[role] IN ('ADMIN','DOCTOR','RECEPTIONIST','PHARMACIST','STAFF')`],
  ['[chk_user_status]', '[dbo].[User]',
    `[status] IN ('Active','Inactive','Suspended')`],

  // ── Patient ───────────────────────────────────────────────────────
  ['[chk_patient_age]',    '[dbo].[Patient]', `[age] >= 0 AND [age] <= 150`],
  ['[chk_patient_gender]', '[dbo].[Patient]',
    `[gender] IN ('Male','Female','Other')`],

  // ── Doctor ────────────────────────────────────────────────────────
  ['[chk_doctor_age]',          '[dbo].[Doctor]', `[age] >= 18 AND [age] <= 100`],
  ['[chk_doctor_gender]',       '[dbo].[Doctor]',
    `[gender] IN ('Male','Female','Other')`],
  ['[chk_doctor_availability]', '[dbo].[Doctor]',
    `[availability] IN ('yes','no')`],

  // ── Appointment ───────────────────────────────────────────────────
  ['[chk_appt_status]', '[dbo].[Appointment]',
    `[status] IN ('Pending','Confirmed','Completed','Cancelled')`],
  ['[chk_appt_type]',   '[dbo].[Appointment]',
    `[type] IN ('In-Person','Follow-up','Emergency')`],

  // ── Medicine ──────────────────────────────────────────────────────
  ['[chk_medicine_price]',    '[dbo].[Medicine]', `[priceCents]   >= 0`],
  ['[chk_medicine_qty]',      '[dbo].[Medicine]', `[quantity]     >= 0`],
  ['[chk_medicine_reorder]',  '[dbo].[Medicine]', `[reorderLevel] >= 0`],

  // ── Invoice ───────────────────────────────────────────────────────
  ['[chk_invoice_status]',   '[dbo].[Invoice]',
    `[status] IN ('DRAFT','UNPAID','PAID','CANCELLED')`],
  ['[chk_invoice_subtotal]', '[dbo].[Invoice]', `[subtotalCents] >= 0`],
  ['[chk_invoice_discount]', '[dbo].[Invoice]', `[discountCents] >= 0`],
  ['[chk_invoice_tax]',      '[dbo].[Invoice]', `[taxCents]      >= 0`],
  ['[chk_invoice_total]',    '[dbo].[Invoice]', `[totalCents]    >= 0`],
  ['[chk_invoice_pay_mode]', '[dbo].[Invoice]',
    `[paymentMode] IS NULL OR [paymentMode] IN ('Cash','Card','Online','Bank Transfer','Insurance')`],

  // ── InvoiceItem ───────────────────────────────────────────────────
  ['[chk_invitem_qty]',       '[dbo].[InvoiceItem]', `[quantity]      >  0`],
  ['[chk_invitem_unitprice]', '[dbo].[InvoiceItem]', `[unitPriceCents] >= 0`],
  ['[chk_invitem_amount]',    '[dbo].[InvoiceItem]', `[amountCents]   >= 0`],

  // ── Dispensation ──────────────────────────────────────────────────
  ['[chk_disp_total]', '[dbo].[Dispensation]', `[totalCents] >= 0`],

  // ── DispensationItem ──────────────────────────────────────────────
  ['[chk_dispitem_qty]',       '[dbo].[DispensationItem]', `[quantity]       >  0`],
  ['[chk_dispitem_unitprice]', '[dbo].[DispensationItem]', `[unitPriceCents] >= 0`],
  ['[chk_dispitem_linetotal]', '[dbo].[DispensationItem]', `[lineTotalCents] >= 0`],
];

async function main() {
  console.log(`Applying ${CONSTRAINTS.length} CHECK constraints to SQL Server...\n`);
  let applied = 0, failed = 0;

  for (const [name, table, check] of CONSTRAINTS) {
    const label = name.replace(/\[|\]/g, '');
    try {
      // Drop the constraint if it exists (handles definition changes), then recreate
      await prisma.$executeRawUnsafe(
        `IF OBJECT_ID('dbo.${label}', 'C') IS NOT NULL ALTER TABLE ${table} DROP CONSTRAINT ${name}`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE ${table} ADD CONSTRAINT ${name} CHECK (${check})`
      );
      console.log(`  + ${label}`);
      applied++;
    } catch (err) {
      console.log(`  ! ${label} (error: ${err.message})`);
      failed++;
    }
  }

  console.log(`\nDone — ${applied} applied, ${failed} failed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
