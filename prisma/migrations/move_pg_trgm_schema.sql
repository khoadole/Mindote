-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Grant usage on schema to public (so everyone can use the functions)
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Add extensions to search_path for all roles
ALTER ROLE postgres SET search_path TO public, extensions;
ALTER ROLE anon SET search_path TO public, extensions;
ALTER ROLE authenticated SET search_path TO public, extensions;
ALTER ROLE service_role SET search_path TO public, extensions;
