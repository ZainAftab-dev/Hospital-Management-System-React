BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(191) NOT NULL,
    [name] NVARCHAR(191) NOT NULL,
    [email] NVARCHAR(191) NOT NULL,
    [passwordHash] NVARCHAR(191) NOT NULL,
    [role] NVARCHAR(50) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Patient] (
    [id] NVARCHAR(191) NOT NULL,
    [name] NVARCHAR(191) NOT NULL,
    [age] INT NOT NULL,
    [gender] NVARCHAR(50) NOT NULL,
    [contact] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(191),
    [address] NVARCHAR(500),
    [disease] NVARCHAR(191),
    [bloodGroup] NVARCHAR(20),
    [allergies] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Patient_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Patient_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Medicine] (
    [id] NVARCHAR(191) NOT NULL,
    [name] NVARCHAR(191) NOT NULL,
    [manufacturer] NVARCHAR(191) NOT NULL,
    [category] NVARCHAR(191) NOT NULL,
    [priceCents] INT NOT NULL,
    [quantity] INT NOT NULL,
    [reorderLevel] INT NOT NULL CONSTRAINT [Medicine_reorderLevel_df] DEFAULT 20,
    [description] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Medicine_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Medicine_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Invoice] (
    [id] NVARCHAR(191) NOT NULL,
    [invoiceNo] NVARCHAR(191) NOT NULL,
    [patientId] NVARCHAR(191) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [Invoice_status_df] DEFAULT 'UNPAID',
    [subtotalCents] INT NOT NULL CONSTRAINT [Invoice_subtotalCents_df] DEFAULT 0,
    [discountCents] INT NOT NULL CONSTRAINT [Invoice_discountCents_df] DEFAULT 0,
    [taxCents] INT NOT NULL CONSTRAINT [Invoice_taxCents_df] DEFAULT 0,
    [totalCents] INT NOT NULL CONSTRAINT [Invoice_totalCents_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Invoice_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Invoice_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Invoice_invoiceNo_key] UNIQUE NONCLUSTERED ([invoiceNo])
);

-- CreateTable
CREATE TABLE [dbo].[InvoiceItem] (
    [id] NVARCHAR(191) NOT NULL,
    [invoiceId] NVARCHAR(191) NOT NULL,
    [description] NVARCHAR(500) NOT NULL,
    [quantity] INT NOT NULL,
    [unitPriceCents] INT NOT NULL,
    [amountCents] INT NOT NULL,
    [sourceType] NVARCHAR(100) NOT NULL,
    [sourceId] NVARCHAR(191),
    CONSTRAINT [InvoiceItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Dispensation] (
    [id] NVARCHAR(191) NOT NULL,
    [patientId] NVARCHAR(191) NOT NULL,
    [invoiceId] NVARCHAR(191),
    [pharmacistId] NVARCHAR(191) NOT NULL,
    [totalCents] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Dispensation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Dispensation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DispensationItem] (
    [id] NVARCHAR(191) NOT NULL,
    [dispensationId] NVARCHAR(191) NOT NULL,
    [medicineId] NVARCHAR(191) NOT NULL,
    [quantity] INT NOT NULL,
    [dosage] NVARCHAR(100) NOT NULL,
    [frequency] NVARCHAR(100) NOT NULL,
    [duration] NVARCHAR(100) NOT NULL,
    [unitPriceCents] INT NOT NULL,
    [lineTotalCents] INT NOT NULL,
    CONSTRAINT [DispensationItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [Invoice_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InvoiceItem] ADD CONSTRAINT [InvoiceItem_invoiceId_fkey] FOREIGN KEY ([invoiceId]) REFERENCES [dbo].[Invoice]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Dispensation] ADD CONSTRAINT [Dispensation_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Dispensation] ADD CONSTRAINT [Dispensation_invoiceId_fkey] FOREIGN KEY ([invoiceId]) REFERENCES [dbo].[Invoice]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DispensationItem] ADD CONSTRAINT [DispensationItem_dispensationId_fkey] FOREIGN KEY ([dispensationId]) REFERENCES [dbo].[Dispensation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DispensationItem] ADD CONSTRAINT [DispensationItem_medicineId_fkey] FOREIGN KEY ([medicineId]) REFERENCES [dbo].[Medicine]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
