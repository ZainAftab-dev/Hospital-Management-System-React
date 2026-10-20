BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Ward] (
    [id] NVARCHAR(191) NOT NULL,
    [name] NVARCHAR(191) NOT NULL,
    [totalBeds] INT NOT NULL,
    [occupiedBeds] INT NOT NULL CONSTRAINT [Ward_occupiedBeds_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ward_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Ward_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Ward_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Vital] (
    [id] NVARCHAR(191) NOT NULL,
    [patientId] NVARCHAR(191) NOT NULL,
    [heartRate] INT NOT NULL,
    [systolic] INT NOT NULL,
    [diastolic] INT NOT NULL,
    [spo2] INT NOT NULL,
    [temperatureC] FLOAT(53) NOT NULL,
    [recordedById] NVARCHAR(191),
    [recordedAt] DATETIME2 NOT NULL CONSTRAINT [Vital_recordedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Vital_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Vital_patientId_recordedAt_idx] ON [dbo].[Vital]([patientId], [recordedAt]);

-- AddForeignKey
ALTER TABLE [dbo].[Vital] ADD CONSTRAINT [Vital_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
