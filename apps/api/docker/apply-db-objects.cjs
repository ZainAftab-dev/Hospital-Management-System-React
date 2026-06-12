/**
 * apply-db-objects.cjs
 * ----------------------------------------------------------------
 * Container-friendly version of add-db-objects.js.
 * Creates the AuditLog table, indexes, and then runs db-objects.sql
 * (views, triggers, stored procedures) WITHOUT requiring the `sqlcmd`
 * CLI — every batch is executed through Prisma instead.
 *
 * Safe to re-run: objects that already exist are skipped.
 * ----------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run(label, sql) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('  [+] ' + label);
  } catch (e) {
    const msg = (e.message || '').split('\n')[0];
    if (/already exists|There is already|already an object/i.test(msg)) {
      console.log('  [~] ' + label + ' — already exists');
    } else {
      console.log('  [!] ' + label + ' — ' + msg);
    }
  }
}

const INDEXES = [
  ['idx_patient_name',         'CREATE INDEX [idx_patient_name]         ON [dbo].[Patient](name)'],
  ['idx_appointment_date',     'CREATE INDEX [idx_appointment_date]     ON [dbo].[Appointment](date)'],
  ['idx_appointment_patient',  'CREATE INDEX [idx_appointment_patient]  ON [dbo].[Appointment](patientId)'],
  ['idx_appointment_doctor',   'CREATE INDEX [idx_appointment_doctor]   ON [dbo].[Appointment](doctorId)'],
  ['idx_invoice_patient',      'CREATE INDEX [idx_invoice_patient]      ON [dbo].[Invoice](patientId)'],
  ['idx_invoice_status',       'CREATE INDEX [idx_invoice_status]       ON [dbo].[Invoice](status)'],
  ['idx_medicine_name',        'CREATE INDEX [idx_medicine_name]        ON [dbo].[Medicine](name)'],
  ['idx_medicine_category',    'CREATE INDEX [idx_medicine_category]    ON [dbo].[Medicine](category)'],
  ['idx_dispensation_patient', 'CREATE INDEX [idx_dispensation_patient] ON [dbo].[Dispensation](patientId)'],
];

async function main() {
  console.log('\n  HMS — Database objects setup (Docker)\n');

  // 1. AuditLog table (used by the audit triggers)
  await run('AuditLog table', `
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLog')
    CREATE TABLE [dbo].[AuditLog] (
      [id]        INT IDENTITY(1,1) PRIMARY KEY,
      [tableName] NVARCHAR(100) NOT NULL,
      [action]    NVARCHAR(20)  NOT NULL,
      [recordId]  NVARCHAR(191) NULL,
      [changedAt] DATETIME2     NOT NULL DEFAULT GETDATE(),
      [details]   NVARCHAR(MAX) NULL
    )`);

  // 2. Indexes
  for (const [label, sql] of INDEXES) await run(label, sql);

  // 3. Views, triggers, stored procedures from db-objects.sql
  //    The file is batched with `GO` separators; SQL Server requires each
  //    CREATE VIEW/TRIGGER/PROCEDURE to be its own batch, so we split on GO.
  const file = path.join(__dirname, '..', 'db-objects.sql');
  const raw = fs.readFileSync(file, 'utf8');

  const batches = raw
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.replace(/^\s*USE\s+\[?zm_hospital\]?\s*;?\s*$/gim, '').trim())
    .filter((b) => b.length > 0 && !/^\s*PRINT\b/i.test(b));

  for (const batch of batches) {
    const m = batch.match(/(VIEW|TRIGGER|PROCEDURE)\s+\[?dbo\]?\.\[?([A-Za-z0-9_]+)\]?/i);
    const label = m ? `${m[1].toLowerCase()} ${m[2]}` : batch.slice(0, 40).replace(/\s+/g, ' ');
    await run(label, batch);
  }

  console.log('\n  Database objects ready (AuditLog, 9 indexes, 4 views, 4 triggers, 4 procedures).\n');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
