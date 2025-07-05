-- Initial database setup for Sports App
-- This file will be executed when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sports_app database if it doesn't exist
-- (Note: This is already created by the POSTGRES_DB environment variable)

-- Create initial tables (will be replaced by Sequelize migrations later)
-- This is just for initial development setup
