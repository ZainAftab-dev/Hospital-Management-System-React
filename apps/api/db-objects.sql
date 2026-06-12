-- ============================================================
-- HMS — Views, Triggers, Stored Procedures
-- Run via: sqlcmd -S localhost -d zm_hospital -U hms_app -P HmsApp@12345 -i db-objects.sql
-- ============================================================

USE zm_hospital;
GO

-- ============================================================
-- VIEWS
-- ============================================================

-- 1. Patient Summary View
CREATE OR ALTER VIEW [dbo].[vw_PatientSummary] AS
SELECT
  p.id                                    AS PatientId,
  p.name                                  AS PatientName,
  p.age,
  p.gender,
  p.bloodGroup,
  p.contact,
  COUNT(DISTINCT a.id)                    AS TotalAppointments,
  COUNT(DISTINCT i.id)                    AS TotalInvoices,
  COALESCE(SUM(i.totalCents) / 100.0, 0) AS TotalBilledRs
FROM [dbo].[Patient] p
LEFT JOIN [dbo].[Appointment] a ON a.patientId = p.id
LEFT JOIN [dbo].[Invoice]     i ON i.patientId = p.id
GROUP BY p.id, p.name, p.age, p.gender, p.bloodGroup, p.contact;
GO

-- 2. Doctor Schedule View
CREATE OR ALTER VIEW [dbo].[vw_DoctorSchedule] AS
SELECT
  d.id              AS DoctorId,
  d.name            AS DoctorName,
  d.specialization,
  d.qualification,
  a.id              AS AppointmentId,
  a.date            AS AppointmentDate,
  a.time            AS AppointmentTime,
  a.status          AS AppointmentStatus,
  a.type            AS AppointmentType,
  p.name            AS PatientName
FROM [dbo].[Doctor] d
LEFT JOIN [dbo].[Appointment] a ON a.doctorId = d.id
LEFT JOIN [dbo].[Patient]     p ON p.id       = a.patientId;
GO

-- 3. Pharmacy Stock View
CREATE OR ALTER VIEW [dbo].[vw_PharmacyStock] AS
SELECT
  m.id,
  m.name               AS MedicineName,
  m.category,
  m.manufacturer,
  m.quantity           AS CurrentStock,
  m.reorderLevel,
  m.priceCents / 100.0 AS PriceRs,
  m.expiryDate,
  CASE
    WHEN m.quantity = 0               THEN 'OUT OF STOCK'
    WHEN m.quantity <= m.reorderLevel THEN 'LOW STOCK'
    ELSE                                   'IN STOCK'
  END                  AS StockStatus
FROM [dbo].[Medicine] m;
GO

-- 4. Billing Overview View
CREATE OR ALTER VIEW [dbo].[vw_BillingOverview] AS
SELECT
  i.id                    AS InvoiceId,
  i.invoiceNo,
  p.name                  AS PatientName,
  i.status,
  i.subtotalCents / 100.0 AS SubtotalRs,
  i.discountCents / 100.0 AS DiscountRs,
  i.taxCents      / 100.0 AS TaxRs,
  i.totalCents    / 100.0 AS TotalRs,
  i.paymentMode,
  i.createdAt             AS InvoiceDate
FROM [dbo].[Invoice] i
JOIN [dbo].[Patient] p ON p.id = i.patientId;
GO

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 5. Patient INSERT audit trigger
CREATE OR ALTER TRIGGER [dbo].[trg_Patient_AfterInsert]
ON [dbo].[Patient]
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO [dbo].[AuditLog] (tableName, action, recordId, changedAt, details)
  SELECT 'Patient', 'INSERT', id, GETDATE(), 'New patient registered: ' + name
  FROM inserted;
END;
GO

-- 6. Patient UPDATE audit trigger
CREATE OR ALTER TRIGGER [dbo].[trg_Patient_AfterUpdate]
ON [dbo].[Patient]
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO [dbo].[AuditLog] (tableName, action, recordId, changedAt, details)
  SELECT 'Patient', 'UPDATE', i.id, GETDATE(), 'Patient record updated: ' + i.name
  FROM inserted i;
END;
GO

-- 7. Patient DELETE audit trigger
CREATE OR ALTER TRIGGER [dbo].[trg_Patient_AfterDelete]
ON [dbo].[Patient]
AFTER DELETE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO [dbo].[AuditLog] (tableName, action, recordId, changedAt, details)
  SELECT 'Patient', 'DELETE', id, GETDATE(), 'Patient deleted: ' + name
  FROM deleted;
END;
GO

-- 8. Invoice status change audit trigger
CREATE OR ALTER TRIGGER [dbo].[trg_Invoice_AfterUpdate]
ON [dbo].[Invoice]
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(status)
  BEGIN
    INSERT INTO [dbo].[AuditLog] (tableName, action, recordId, changedAt, details)
    SELECT 'Invoice', 'STATUS_CHANGE', i.id, GETDATE(),
           'Invoice ' + i.invoiceNo + ' status changed to: ' + i.status
    FROM inserted i;
  END
END;
GO

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- 9. Full patient history (appointments + invoices + dispensations)
CREATE OR ALTER PROCEDURE [dbo].[sp_GetPatientHistory]
  @PatientId NVARCHAR(191)
AS
BEGIN
  SET NOCOUNT ON;

  -- Patient info
  SELECT id, name, age, gender, bloodGroup, contact, address, disease, allergies
  FROM [dbo].[Patient] WHERE id = @PatientId;

  -- Appointments
  SELECT a.id, a.date, a.time, a.status, a.type, a.notes,
         d.name AS DoctorName, d.specialization
  FROM [dbo].[Appointment] a
  JOIN [dbo].[Doctor] d ON d.id = a.doctorId
  WHERE a.patientId = @PatientId ORDER BY a.date DESC;

  -- Invoices
  SELECT i.id, i.invoiceNo, i.status,
         i.totalCents / 100.0 AS TotalRs, i.paymentMode, i.createdAt
  FROM [dbo].[Invoice] i
  WHERE i.patientId = @PatientId ORDER BY i.createdAt DESC;

  -- Dispensations
  SELECT m.name AS MedicineName, di.quantity, di.dosage,
         di.frequency, di.duration, disp.createdAt AS DispensedAt
  FROM [dbo].[Dispensation] disp
  JOIN [dbo].[DispensationItem] di ON di.dispensationId = disp.id
  JOIN [dbo].[Medicine]         m  ON m.id = di.medicineId
  WHERE disp.patientId = @PatientId ORDER BY disp.createdAt DESC;
END;
GO

-- 10. Get medicines at or below reorder level
CREATE OR ALTER PROCEDURE [dbo].[sp_GetLowStockMedicines]
AS
BEGIN
  SET NOCOUNT ON;
  SELECT id, name, category, quantity AS CurrentStock,
         reorderLevel, priceCents / 100.0 AS PriceRs,
         CASE
           WHEN quantity = 0               THEN 'OUT OF STOCK'
           WHEN quantity <= reorderLevel   THEN 'LOW STOCK'
         END AS StockStatus
  FROM [dbo].[Medicine]
  WHERE quantity <= reorderLevel
  ORDER BY quantity ASC;
END;
GO

-- 11. Doctor appointment stats
CREATE OR ALTER PROCEDURE [dbo].[sp_GetDoctorStats]
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    d.id, d.name AS DoctorName, d.specialization, d.qualification,
    COUNT(a.id)                                              AS TotalAppointments,
    SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS Completed,
    SUM(CASE WHEN a.status = 'Pending'   THEN 1 ELSE 0 END) AS Pending,
    SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled
  FROM [dbo].[Doctor] d
  LEFT JOIN [dbo].[Appointment] a ON a.doctorId = d.id
  GROUP BY d.id, d.name, d.specialization, d.qualification
  ORDER BY TotalAppointments DESC;
END;
GO

-- 12. Monthly revenue breakdown
CREATE OR ALTER PROCEDURE [dbo].[sp_GetMonthlyRevenue]
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    YEAR(createdAt)            AS [Year],
    MONTH(createdAt)           AS [Month],
    DATENAME(MONTH, createdAt) AS MonthName,
    COUNT(*)                   AS TotalInvoices,
    SUM(totalCents) / 100.0    AS TotalRevenueRs,
    SUM(CASE WHEN status = 'PAID'   THEN totalCents ELSE 0 END) / 100.0 AS PaidRs,
    SUM(CASE WHEN status = 'UNPAID' THEN totalCents ELSE 0 END) / 100.0 AS UnpaidRs
  FROM [dbo].[Invoice]
  GROUP BY YEAR(createdAt), MONTH(createdAt), DATENAME(MONTH, createdAt)
  ORDER BY [Year] DESC, [Month] DESC;
END;
GO

PRINT 'All views, triggers and stored procedures created successfully.';
GO
