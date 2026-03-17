-- Community Reporting System - PostgreSQL Schema
-- Initialize database with tables and indexes

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    agency VARCHAR(255),
    jurisdiction VARCHAR(255),
    location VARCHAR(255),
    profile_image_url VARCHAR(500),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ==================== REPORTS TABLE ====================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under-review', 'resolved', 'rejected')),
    verifications INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_incident_type ON reports(incident_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);

-- ==================== REPORT UPDATES TABLE ====================
CREATE TABLE IF NOT EXISTS report_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_updates_report_id ON report_updates(report_id);
CREATE INDEX idx_report_updates_admin_id ON report_updates(admin_id);

-- ==================== REPORT VERIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS report_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_verifications_report_id ON report_verifications(report_id);
CREATE INDEX idx_report_verifications_user_id ON report_verifications(user_id);

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_report_id ON notifications(report_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ==================== AUDIT LOGS TABLE ====================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==================== SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO settings (key, value, type) VALUES
    ('system_name', 'Community Reporting System', 'string'),
    ('support_email', 'support@communityreporting.dev', 'string'),
    ('report_expiry_days', '90', 'integer'),
    ('max_reports_per_user', '10', 'integer'),
    ('allow_anonymous_reports', 'true', 'boolean'),
    ('require_report_verification', 'false', 'boolean')
ON CONFLICT (key) DO NOTHING;

-- ==================== SYSTEM STATS VIEW ====================
CREATE OR REPLACE VIEW system_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_citizens,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM reports) as total_reports,
    (SELECT COUNT(*) FROM reports WHERE status = 'submitted') as pending_reports,
    (SELECT COUNT(*) FROM reports WHERE status = 'under-review') as reviewing_reports,
    (SELECT COUNT(*) FROM reports WHERE status = 'resolved') as resolved_reports,
    (SELECT COUNT(*) FROM reports WHERE status = 'rejected') as rejected_reports,
    (SELECT AVG(EXTRACT(DAY FROM (resolved_at - created_at)))
     FROM reports WHERE resolved_at IS NOT NULL) as avg_resolution_days;

-- ==================== GRANT PERMISSIONS ====================
-- For production: create separate app user with limited permissions
CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password_change_me';

GRANT CONNECT ON DATABASE community_reporting_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- ==================== CREATE FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER users_update_timestamp BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for reports table
CREATE TRIGGER reports_update_timestamp BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for settings table
CREATE TRIGGER settings_update_timestamp BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function for audit logging
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id VARCHAR,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details, NULL, NULL)
    RETURNING id INTO log_id;
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== DATA INITIALIZATION ====================
-- Insert test data (for development only)
INSERT INTO users (email, password, name, phone, role, status, agency, jurisdiction)
VALUES
    ('user@test.com', '$2a$10$dXJ3SW6G7P50eS3xsNV/2e/tqVDpLmWWGZ1j3qsQ8IkXQc2j5r9hm', 'John Doe', '+234-800-000-0001', 'user', 'active', NULL, NULL),
    ('admin@test.com', '$2a$10$KY1BW9jNqAHqz3yWMxQR7ucFLtGTOvTDw2U.JIDb78JPvWnJqXbym', 'Admin Officer', '+234-800-000-0002', 'admin', 'active', 'National Emergency Service', 'Lagos State')
ON CONFLICT (email) DO NOTHING;

COMMIT;
