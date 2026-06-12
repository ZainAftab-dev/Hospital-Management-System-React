USE zm_hospital;
GO

-- ============================================
--   HMS - Hospital Management System
--   Database Query Demonstration File
--   ZM Hospital | DB Course Project
-- ============================================


-- ============================================
-- SECTION 1: BASIC SELECT (ALL TABLES)
-- ============================================

-- 1. All Users (System Accounts)
SELECT id, name, email, role, status, createdAt
FROM [dbo].[User]
ORDER BY createdAt DESC;

-- 2. All Patients
SELECT id, name, age, gender, contact, email, bloodGroup, disease, address
FROM [dbo].[Patient]
ORDER BY name;

-- 3. All Doctors
SELECT id, name, specialization, qualification, age, gender,
       contact, consultationFee, availability
FROM [dbo].[Doctor]
ORDER BY specialization;

-- 4. All Appointments
SELECT id, patientId, doctorId, date, time, status, type, notes
FROM [dbo].[Appointment]
ORDER BY date DESC;

-- 5. All Invoices
SELECT id, invoiceNo, patientId, status,
       subtotalCents/100.0 AS subtotal_Rs,
       discountCents/100.0 AS discount_Rs,
       taxCents/100.0      AS tax_Rs,
       totalCents/100.0    AS total_Rs,
       paymentMode, createdAt
FROM [dbo].[Invoice]
ORDER BY createdAt DESC;

-- 6. All Invoice Items
SELECT id, invoiceId, description, quantity,
       unitPriceCents/100.0 AS unitPrice_Rs,
       amountCents/100.0    AS amount_Rs,
       sourceType
FROM [dbo].[InvoiceItem];

-- 7. All Medicines (Pharmacy Inventory)
SELECT id, name, manufacturer, category,
       priceCents/100.0 AS price_Rs,
       quantity AS stock, reorderLevel, unit, expiryDate, batchNumber
FROM [dbo].[Medicine]
ORDER BY name;


-- 8. All Dispensation Records
SELECT id, patientId, invoiceId, totalCents/100.0 AS total_Rs, createdAt AS dispensedAt
FROM [dbo].[Dispensation]
ORDER BY createdAt DESC;

-- 9. All Dispensation Items
SELECT id, dispensationId, medicineId, quantity, dosage, frequency, duration
FROM [dbo].[DispensationItem];


-- ============================================
-- SECTION 2: JOIN QUERIES (MULTI-TABLE)
-- ============================================

-- 10. Appointments with Patient and Doctor Names
SELECT
    a.id          AS AppointmentID,
    p.name        AS PatientName,
    d.name        AS DoctorName,
    d.specialization,
    a.date,
    a.time,
    a.status,
    a.type
FROM [dbo].[Appointment] a
JOIN [dbo].[Patient] p ON a.patientId = p.id
JOIN [dbo].[Doctor]  d ON a.doctorId  = d.id
ORDER BY a.date DESC;

-- 11. Invoices with Patient Names and Item Details
SELECT
    inv.invoiceNo,
    p.name              AS PatientName,
    ii.description      AS ChargeDescription,
    ii.quantity,
    ii.unitPriceCents/100.0 AS UnitPrice_Rs,
    ii.amountCents/100.0    AS Amount_Rs,
    inv.totalCents/100.0    AS InvoiceTotal_Rs,
    inv.status,
    inv.paymentMode
FROM [dbo].[Invoice]     inv
JOIN [dbo].[Patient]     p  ON inv.patientId = p.id
JOIN [dbo].[InvoiceItem] ii ON ii.invoiceId  = inv.id
ORDER BY inv.createdAt DESC;

-- 12. Dispensed Medicines with Patient and Medicine Details
SELECT
    p.name          AS PatientName,
    m.name          AS MedicineName,
    m.manufacturer,
    di.quantity     AS QuantityDispensed,
    di.dosage,
    di.frequency,
    di.duration,
    disp.createdAt  AS DispensedAt
FROM [dbo].[Dispensation]     disp
JOIN [dbo].[Patient]          p  ON disp.patientId    = p.id
JOIN [dbo].[DispensationItem] di ON di.dispensationId = disp.id
JOIN [dbo].[Medicine]         m  ON di.medicineId     = m.id
ORDER BY disp.createdAt DESC;

-- 13. Full Patient Medical Summary (Appointments + Invoices)
SELECT
    p.id              AS PatientID,
    p.name            AS PatientName,
    p.age,
    p.bloodGroup,
    COUNT(DISTINCT a.id)               AS TotalAppointments,
    COUNT(DISTINCT inv.id)             AS TotalInvoices,
    ISNULL(SUM(inv.totalCents)/100.0, 0) AS TotalBilled_Rs
FROM [dbo].[Patient] p
LEFT JOIN [dbo].[Appointment] a   ON a.patientId   = p.id
LEFT JOIN [dbo].[Invoice]     inv ON inv.patientId  = p.id
GROUP BY p.id, p.name, p.age, p.bloodGroup
ORDER BY TotalBilled_Rs DESC;

-- 14. Doctor Appointment Load (How Busy Each Doctor Is)
SELECT
    d.name            AS DoctorName,
    d.specialization,
    d.availability,
    COUNT(a.id)       AS TotalAppointments,
    SUM(CASE WHEN a.status = 'Pending'   THEN 1 ELSE 0 END) AS Pending,
    SUM(CASE WHEN a.status = 'Confirmed' THEN 1 ELSE 0 END) AS Confirmed,
    SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS Completed,
    SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled
FROM [dbo].[Doctor] d
LEFT JOIN [dbo].[Appointment] a ON a.doctorId = d.id
GROUP BY d.id, d.name, d.specialization, d.availability
ORDER BY TotalAppointments DESC;


-- ============================================
-- SECTION 3: AGGREGATE & STATISTICAL QUERIES
-- ============================================

-- 15. Revenue Summary by Payment Mode
SELECT
    ISNULL(paymentMode, 'Not Set') AS PaymentMode,
    COUNT(*)                        AS NumberOfInvoices,
    SUM(totalCents)/100.0           AS TotalRevenue_Rs,
    AVG(totalCents)/100.0           AS AverageInvoice_Rs
FROM [dbo].[Invoice]
WHERE status = 'PAID'
GROUP BY paymentMode
ORDER BY TotalRevenue_Rs DESC;

-- 16. Monthly Revenue Report
SELECT
    YEAR(createdAt)             AS Year,
    MONTH(createdAt)            AS Month,
    DATENAME(MONTH, createdAt)  AS MonthName,
    COUNT(*)                    AS InvoiceCount,
    SUM(totalCents)/100.0       AS Revenue_Rs
FROM [dbo].[Invoice]
WHERE status = 'PAID'
GROUP BY YEAR(createdAt), MONTH(createdAt), DATENAME(MONTH, createdAt)
ORDER BY Year DESC, Month DESC;

-- 17. Patient Count by Blood Group
SELECT
    ISNULL(bloodGroup, 'Not Recorded') AS BloodGroup,
    COUNT(*)                            AS PatientCount
FROM [dbo].[Patient]
GROUP BY bloodGroup
ORDER BY PatientCount DESC;

-- 18. Patient Count by Gender (with Percentage)
SELECT
    gender,
    COUNT(*) AS Total,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,2)) AS Percentage
FROM [dbo].[Patient]
GROUP BY gender;

-- 19. Doctor Statistics by Specialization
SELECT
    specialization,
    COUNT(*)                               AS NumberOfDoctors,
    AVG(CAST(consultationFee AS FLOAT))    AS AvgFee_Rs,
    MIN(CAST(consultationFee AS FLOAT))    AS MinFee_Rs,
    MAX(CAST(consultationFee AS FLOAT))    AS MaxFee_Rs
FROM [dbo].[Doctor]
GROUP BY specialization
ORDER BY NumberOfDoctors DESC;

-- 20. Appointment Statistics by Status (with Percentage)
SELECT
    status,
    COUNT(*) AS Count,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,2)) AS Percentage
FROM [dbo].[Appointment]
GROUP BY status;

-- 21. Top 10 Most Dispensed Medicines
SELECT TOP 10
    m.name          AS MedicineName,
    m.category,
    m.manufacturer,
    SUM(di.quantity) AS TotalDispensed,
    m.quantity       AS CurrentStock
FROM [dbo].[DispensationItem] di
JOIN [dbo].[Medicine] m ON di.medicineId = m.id
GROUP BY m.id, m.name, m.category, m.manufacturer, m.quantity
ORDER BY TotalDispensed DESC;

-- 22. Top 5 Highest Billed Patients
SELECT TOP 5
    p.name           AS PatientName,
    p.age,
    p.disease,
    COUNT(inv.id)    AS TotalInvoices,
    SUM(inv.totalCents)/100.0 AS TotalBilled_Rs
FROM [dbo].[Patient] p
JOIN [dbo].[Invoice] inv ON inv.patientId = p.id
GROUP BY p.id, p.name, p.age, p.disease
ORDER BY TotalBilled_Rs DESC;


-- ============================================
-- SECTION 4: FILTER / WHERE QUERIES
-- ============================================

-- 23. Today's Appointments
SELECT
    a.id,
    p.name           AS Patient,
    d.name           AS Doctor,
    d.specialization,
    a.time,
    a.type,
    a.status
FROM [dbo].[Appointment] a
JOIN [dbo].[Patient] p ON a.patientId = p.id
JOIN [dbo].[Doctor]  d ON a.doctorId  = d.id
WHERE a.date = CAST(GETDATE() AS DATE)
ORDER BY a.time;

-- 24. Low Stock Medicines (At or Below Reorder Level)
SELECT
    id, name, category, manufacturer,
    quantity        AS CurrentStock,
    reorderLevel,
    (reorderLevel - quantity) AS ShortfallUnits,
    priceCents/100.0 AS Price_Rs
FROM [dbo].[Medicine]
WHERE quantity <= reorderLevel
ORDER BY ShortfallUnits DESC;

-- 25. Medicines Expiring Within 3 Months
SELECT
    name, manufacturer, category,
    quantity    AS Stock,
    expiryDate,
    batchNumber,
    DATEDIFF(DAY, GETDATE(), expiryDate) AS DaysUntilExpiry
FROM [dbo].[Medicine]
WHERE expiryDate IS NOT NULL
  AND expiryDate <= DATEADD(MONTH, 3, GETDATE())
ORDER BY expiryDate ASC;

-- 26. Unpaid Invoices (Outstanding Dues)
SELECT
    inv.invoiceNo,
    p.name           AS PatientName,
    p.contact        AS PatientContact,
    inv.totalCents/100.0 AS AmountDue_Rs,
    inv.createdAt    AS InvoiceDate,
    DATEDIFF(DAY, inv.createdAt, GETDATE()) AS DaysOverdue
FROM [dbo].[Invoice] inv
JOIN [dbo].[Patient] p ON inv.patientId = p.id
WHERE inv.status = 'UNPAID'
ORDER BY DaysOverdue DESC;

-- 27. Available Doctors Only
SELECT
    id, name, specialization, qualification,
    consultationFee, contact, email
FROM [dbo].[Doctor]
WHERE availability = 'yes'
ORDER BY specialization;

-- 28. Patients With Upcoming Appointments
SELECT DISTINCT
    p.name           AS PatientName,
    p.contact,
    a.date           AS AppointmentDate,
    a.time,
    d.name           AS DoctorName,
    a.type,
    a.status
FROM [dbo].[Patient] p
JOIN [dbo].[Appointment] a ON a.patientId = p.id
JOIN [dbo].[Doctor]      d ON a.doctorId  = d.id
WHERE a.date >= CAST(GETDATE() AS DATE)
  AND a.status IN ('Pending', 'Confirmed')
ORDER BY a.date, a.time;


-- ============================================
-- SECTION 5: ADVANCED / SUBQUERY / CASE QUERIES
-- ============================================

-- 29. Patient Age Group Classification
SELECT
    name, age, gender, bloodGroup, disease,
    CASE
        WHEN age < 18              THEN 'Pediatric'
        WHEN age BETWEEN 18 AND 40 THEN 'Adult'
        WHEN age BETWEEN 41 AND 60 THEN 'Middle Aged'
        ELSE                            'Senior'
    END AS AgeGroup
FROM [dbo].[Patient]
ORDER BY age;

-- 30. Full Financial Overview (Single Query)
SELECT
    SUM(CASE WHEN status = 'PAID'   THEN totalCents ELSE 0 END)/100.0 AS TotalRevenue_Rs,
    SUM(CASE WHEN status = 'UNPAID' THEN totalCents ELSE 0 END)/100.0 AS Outstanding_Rs,
    SUM(CASE WHEN status = 'DRAFT'  THEN totalCents ELSE 0 END)/100.0 AS DraftAmount_Rs,
    COUNT(*)                                                            AS TotalInvoices,
    SUM(CASE WHEN status = 'PAID'   THEN 1 ELSE 0 END)                AS PaidCount,
    SUM(CASE WHEN status = 'UNPAID' THEN 1 ELSE 0 END)                AS UnpaidCount,
    AVG(totalCents)/100.0                                              AS AvgInvoiceValue_Rs
FROM [dbo].[Invoice];

-- 31. Patients Who Have NEVER Had an Appointment
SELECT
    p.id, p.name, p.age, p.gender, p.contact, p.disease
FROM [dbo].[Patient] p
WHERE p.id NOT IN (SELECT DISTINCT patientId FROM [dbo].[Appointment])
ORDER BY p.name;

-- 32. Patients Who Have NEVER Been Billed
SELECT
    p.id, p.name, p.age, p.contact
FROM [dbo].[Patient] p
WHERE p.id NOT IN (SELECT DISTINCT patientId FROM [dbo].[Invoice])
ORDER BY p.name;

-- 33. Doctors With No Appointments Assigned
SELECT
    d.id, d.name, d.specialization, d.availability, d.contact
FROM [dbo].[Doctor] d
WHERE d.id NOT IN (SELECT DISTINCT doctorId FROM [dbo].[Appointment]);

-- 34. User Roles Distribution (System Access Control)
SELECT
    role,
    COUNT(*) AS UserCount,
    STRING_AGG(name, ', ') AS UserNames
FROM [dbo].[User]
GROUP BY role
ORDER BY UserCount DESC;

-- 35. Complete Pharmacy Dispensing History Per Patient
SELECT
    p.name                          AS PatientName,
    COUNT(DISTINCT disp.id)         AS TotalVisits,
    SUM(di.quantity)                AS TotalMedicinesDispensed,
    STRING_AGG(m.name, ', ')        AS MedicinesReceived
FROM [dbo].[Patient] p
JOIN [dbo].[Dispensation]     disp ON disp.patientId    = p.id
JOIN [dbo].[DispensationItem] di   ON di.dispensationId = disp.id
JOIN [dbo].[Medicine]         m    ON di.medicineId     = m.id
GROUP BY p.id, p.name
ORDER BY TotalMedicinesDispensed DESC;


-- ============================================
-- SECTION 6: CHECK CONSTRAINTS & INTEGRITY
-- ============================================

-- 36. View All CHECK Constraints Defined in the Database
SELECT
    t.name  AS TableName,
    cc.name AS ConstraintName,
    cc.definition AS ConstraintRule
FROM sys.check_constraints cc
JOIN sys.tables t ON cc.parent_object_id = t.object_id
ORDER BY t.name, cc.name;

-- 37. PROVE Age Constraint Works (Should FAIL with error message)
BEGIN TRY
    INSERT INTO [dbo].[Patient] (id, name, age, gender, contact)
    VALUES ('TEST01', 'Test Patient', 200, 'Male', '0300-0000000');
    PRINT 'ERROR: Constraint did not work!';
END TRY
BEGIN CATCH
    PRINT 'SUCCESS: CHECK constraint blocked invalid age (200).';
    PRINT 'Error: ' + ERROR_MESSAGE();
END CATCH;

-- 38. PROVE Role Constraint Works (Should FAIL with error message)
BEGIN TRY
    INSERT INTO [dbo].[User] (id, name, email, role, password)
    VALUES ('TEST02', 'Hacker', 'hack@test.com', 'SUPERADMIN', 'abc');
    PRINT 'ERROR: Constraint did not work!';
END TRY
BEGIN CATCH
    PRINT 'SUCCESS: CHECK constraint blocked invalid role (SUPERADMIN).';
    PRINT 'Error: ' + ERROR_MESSAGE();
END CATCH;

-- 39. View All Foreign Keys (Referential Integrity Map)
SELECT
    fk.name     AS ForeignKeyName,
    tp.name     AS ParentTable,
    cp.name     AS ParentColumn,
    tr.name     AS ReferencedTable,
    cr.name     AS ReferencedColumn
FROM sys.foreign_keys fk
JOIN sys.tables  tp  ON fk.parent_object_id     = tp.object_id
JOIN sys.tables  tr  ON fk.referenced_object_id = tr.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns cp  ON fkc.parent_object_id     = cp.object_id
                     AND fkc.parent_column_id    = cp.column_id
JOIN sys.columns cr  ON fkc.referenced_object_id = cr.object_id
                     AND fkc.referenced_column_id = cr.column_id
ORDER BY tp.name;

-- 40. Full Database Overview (All Tables with Row Counts)
SELECT
    t.name   AS TableName,
    p.rows   AS [RowCount]
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0, 1)
ORDER BY p.rows DESC;

-- 1. See which patients HAVE a photo uploaded
SELECT id, name, email, contact
FROM Patient
WHERE photoUrl IS NOT NULL;

-- 2. See which patients have NO photo yet
SELECT id, name, email, contact
FROM Patient
WHERE photoUrl IS NULL;

-- 3. Count how many patients have photos vs not
SELECT
    COUNT(CASE WHEN photoUrl IS NOT NULL THEN 1 END) AS with_photo,
    COUNT(CASE WHEN photoUrl IS NULL     THEN 1 END) AS without_photo,
    COUNT(*) AS total_patients
FROM Patient;

-- 4. See the photo data (first 100 chars so it doesn't flood the screen)
SELECT name, LEFT(photoUrl, 100) AS photo_preview_base64
FROM Patient
WHERE photoUrl IS NOT NULL;

-- 5. See the full size of each stored photo in KB
SELECT name,
       LEN(photoUrl) / 1024 AS photo_size_kb
FROM Patient
WHERE photoUrl IS NOT NULL;

-- Show the audit log filling up live (add/edit a patient first)
SELECT * FROM AuditLog ORDER BY changedAt DESC;

-- Run a view
SELECT * FROM vw_PatientSummary;
SELECT * FROM vw_PharmacyStock WHERE StockStatus != 'IN STOCK';

-- Run a stored procedure
EXEC sp_GetDoctorStats;
EXEC sp_GetLowStockMedicines;
EXEC sp_GetMonthlyRevenue;

-- Patient history (replace with a real patient id from your DB)
EXEC sp_GetPatientHistory @PatientId = 'put-patient-id-here';
