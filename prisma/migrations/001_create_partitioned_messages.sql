-- Create partitioned messages table
-- Note: This is a raw SQL migration for PostgreSQL partitioning
-- Run this manually after running `prisma migrate dev`

-- First, let's create the partitioned table structure
-- This should be run after the initial Prisma migration

-- Create a function to create partition tables dynamically
CREATE OR REPLACE FUNCTION create_tenant_partition(tenant_id UUID)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
BEGIN
    partition_name := 'messages_tenant_' || replace(tenant_id::text, '-', '_');
    
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF messages
        FOR VALUES IN (%L)
    ', partition_name, tenant_id);
    
    -- Create indexes on the partition
    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I (created_at DESC)
    ', partition_name || '_created_at_idx', partition_name);
    
    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I (id)
    ', partition_name || '_id_idx', partition_name);
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically create partitions
CREATE OR REPLACE FUNCTION create_partition_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_tenant_partition(NEW.tenant_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The actual partitioning setup will be done after Prisma creates the base table
-- You'll need to run additional SQL to convert the table to partitioned after migration