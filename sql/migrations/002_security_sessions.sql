-- =====================================================
-- SECURITY ENHANCEMENT: User Sessions & Login Attempts
-- =====================================================

-- User Sessions Table (for token validation & session management)
CREATE TABLE IF NOT EXISTS UserSessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_session (user_id, session_id),
    INDEX idx_user_valid (user_id, is_valid),
    INDEX idx_expires (expires_at)
);

-- Login Attempts Table (for rate limiting)
CREATE TABLE IF NOT EXISTS LoginAttempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    email_hash VARCHAR(64) NOT NULL,
    attempts INT DEFAULT 1,
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_until DATETIME NULL,
    INDEX idx_ip_email (ip_address, email_hash),
    INDEX idx_locked (locked_until)
);

-- =====================================================
-- CLEANUP: Remove expired sessions daily via cron
-- =====================================================
-- DELETE FROM UserSessions WHERE expires_at < NOW() OR is_valid = 0;
-- DELETE FROM LoginAttempts WHERE last_attempt_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
