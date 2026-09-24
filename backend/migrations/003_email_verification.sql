CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,

    email VARCHAR(255) NOT NULL,

    otp_hash VARCHAR(255) NOT NULL,

    purpose VARCHAR(30) NOT NULL,

    name VARCHAR(255),

    password_hash VARCHAR(255),

    expires_at TIMESTAMP NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    verified_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_email_verifications_id
    ON email_verifications (id);

CREATE INDEX IF NOT EXISTS ix_email_verifications_email
    ON email_verifications (email);
    