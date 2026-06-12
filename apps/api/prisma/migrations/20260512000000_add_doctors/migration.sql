BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Doctor] (
    [id] NVARCHAR(191) NOT NULL,
    [name] NVARCHAR(191) NOT NULL,
    [age] INT NOT NULL,
    [gender] NVARCHAR(50) NOT NULL,
    [contact] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(191),
    [address] NVARCHAR(500),
    [specialization] NVARCHAR(191) NOT NULL,
    [qualification] NVARCHAR(191) NOT NULL,
    [availability] NVARCHAR(20) NOT NULL CONSTRAINT [Doctor_availability_df] DEFAULT 'yes',
    [consultationFee] NVARCHAR(50) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Doctor_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Doctor_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
