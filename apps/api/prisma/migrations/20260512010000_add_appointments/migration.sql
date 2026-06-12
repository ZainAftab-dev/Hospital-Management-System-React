BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[Appointment] (
    [id] NVARCHAR(191) NOT NULL,
    [patientId] NVARCHAR(191) NOT NULL,
    [doctorId] NVARCHAR(191) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [time] NVARCHAR(20) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [Appointment_status_df] DEFAULT 'Pending',
    [notes] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Appointment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Appointment_pkey] PRIMARY KEY CLUSTERED ([id])
);

ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_doctorId_fkey] FOREIGN KEY ([doctorId]) REFERENCES [dbo].[Doctor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
