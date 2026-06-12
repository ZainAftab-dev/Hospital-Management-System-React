-- Add emergency contact fields to Patient
ALTER TABLE [dbo].[Patient] ADD [emergencyContact] NVARCHAR(191);
ALTER TABLE [dbo].[Patient] ADD [emergencyPhone] NVARCHAR(100);

-- Add license number to Doctor
ALTER TABLE [dbo].[Doctor] ADD [licenseNumber] NVARCHAR(100);

-- Add appointment type to Appointment
ALTER TABLE [dbo].[Appointment] ADD [type] NVARCHAR(50) NOT NULL CONSTRAINT [Appointment_type_df] DEFAULT 'In-Person';

-- Add expiry date, batch number, and unit to Medicine
ALTER TABLE [dbo].[Medicine] ADD [expiryDate] DATETIME2;
ALTER TABLE [dbo].[Medicine] ADD [batchNumber] NVARCHAR(100);
ALTER TABLE [dbo].[Medicine] ADD [unit] NVARCHAR(50);

-- Add payment mode to Invoice
ALTER TABLE [dbo].[Invoice] ADD [paymentMode] NVARCHAR(50);
