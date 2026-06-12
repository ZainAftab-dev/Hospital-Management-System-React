USE master;
GO

IF DB_ID(N'zm_hospital') IS NULL
BEGIN
    CREATE DATABASE zm_hospital;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'hms_app')
BEGIN
    CREATE LOGIN hms_app WITH PASSWORD = 'HmsApp@12345', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF;
END
GO

USE zm_hospital;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'hms_app')
BEGIN
    CREATE USER hms_app FOR LOGIN hms_app;
END
GO

ALTER ROLE db_owner ADD MEMBER hms_app;
GO
