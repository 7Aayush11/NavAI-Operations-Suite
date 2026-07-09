-- Database Schema Changes for Customer Journey Tracking Engine
-- Designed to support both PostgreSQL and SQLite fallback environments.

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email and phone for quick lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

-- 2. Applications Table (Extending / replacing basic tracking)
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    branch_name VARCHAR(100),
    assigned_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' NOT NULL, -- IN_PROGRESS, COMPLETED, ABANDONED, REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_customer_id ON applications(customer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- 3. Application Sessions Table
CREATE TABLE IF NOT EXISTS application_sessions (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    device_type VARCHAR(50) NOT NULL,                  -- MOBILE, TABLET, DESKTOP
    browser VARCHAR(100) NOT NULL,                      -- Chrome, Safari, Firefox
    operating_system VARCHAR(100) NOT NULL,             -- iOS, Android, Windows, macOS
    ip_address VARCHAR(45) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_application_id ON application_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON application_sessions(is_active);

-- 4. Journey Events Table
CREATE TABLE IF NOT EXISTS journey_events (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES application_sessions(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,                    -- Predefined steps (e.g., 'Application Started', etc.)
    step_order INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,                        -- STARTED, COMPLETED, FAILED
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    time_spent_seconds DOUBLE PRECISION,
    device_type VARCHAR(50) NOT NULL,
    browser VARCHAR(100) NOT NULL,
    operating_system VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    failure_reason TEXT,
    metadata TEXT,                                      -- Stringified JSON (SQLite fallback) / JSONB (PostgreSQL)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key indexes for event querying
CREATE INDEX IF NOT EXISTS idx_events_application_id ON journey_events(application_id);
CREATE INDEX IF NOT EXISTS idx_events_customer_id ON journey_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON journey_events(timestamp);
