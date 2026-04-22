create table rentalley_db.Property
(
    property_id              varchar(12)                                                       not null
        primary key,
    landlord_id              varchar(20)                                                       not null,
    property_name            varchar(60)                                                       not null,
    property_type            varchar(60)                                                       not null,
    amenities                varchar(100)                                                      null,
    street                   varchar(60)                                                       null,
    brgy_district            varchar(100)                                                      null,
    city                     varchar(50)                                                       not null,
    zip_code                 int                                                               null,
    province                 varchar(50)                                                       not null,
    water_billing_type       enum ('submetered', 'included', 'provider')                       null,
    electricity_billing_type enum ('submetered', 'included', 'provider')                       null,
    description              text                                                              null,
    floor_area               int                                                               null,
    late_fee                 decimal(10, 2)                                                    null,
    assoc_dues               int                                                               null,
    created_at               timestamp                               default CURRENT_TIMESTAMP null,
    updated_at               timestamp                               default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    status                   enum ('active', 'inactive', 'archived') default 'active'          not null,
    flexipay_enabled         tinyint(1)                              default 0                 null comment '1 if FlexiPay is supported, 0 otherwise',
    property_preferences     text                                                              null comment 'JSON or comma-separated preferences like pet_friendly, smoking_allowed',
    accepted_payment_methods text                                                              null,
    latitude                 float                                                             null,
    longitude                float                                                             null,
    rent_increase_percent    decimal(5, 2)                           default 0.00              null comment 'Percentage increase applied to base rent or billing at property level',
    house_policy             longtext                                                          null
);

-- ConcessionaireBilling table is now replaced by WaterConcessionaireBilling and ElectricityConcessionaireBilling (see below)

create index Property_ibfk_1
    on rentalley_db.Property (landlord_id);

create index idx_property_landlord_created
    on rentalley_db.Property (landlord_id, created_at);

create index idx_property_landlord_status
    on rentalley_db.Property (landlord_id, status);

create index idx_property_landlord_status_created
    on rentalley_db.Property (landlord_id asc, status asc, created_at desc);

create table rentalley_db.Unit
(
    unit_id          varchar(12)                                                                                   not null
        primary key,
    property_id      varchar(12)                                                                                   not null,
    unit_name        varchar(20)                                                                                   not null,
    unit_size        int                                                                                           not null,
    unit_style       varchar(50)                                                         default 'studio'          null,
    rent_amount      decimal(10, 2)                                                                                not null,
    furnish          varchar(70)                                                                                   not null,
    amenities        varchar(100)                                                                                  null,
    status           enum ('occupied', 'unoccupied', 'reserved', 'inactive', 'archived') default 'unoccupied'      not null,
    publish          tinyint(1)                                                          default 0                 null,
    created_at       timestamp                                                           default CURRENT_TIMESTAMP null,
    updated_at       timestamp                                                           default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    qr_enabled       tinyint(1)                                                          default 1                 null comment 'Allow QR access for this unit',
    qr_claim_enabled tinyint(1)                                                          default 0                 null comment 'Allow existing tenant to claim occupied unit via QR',
    qr_code_url      text                                                                                          null comment 'S3 URL of generated QR code image',
    constraint Unit_ibfk_property
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create table rentalley_db.LeaseAgreement
(
    agreement_id            varchar(20)                                                                                                                                                         not null
        primary key,
    is_renewal_of           varchar(20)                                                                                                                                                         null,
    tenant_id               varchar(20)                                                                                                                                                         null,
    unit_id                 varchar(12)                                                                                                                                                         not null,
    start_date              date                                                                                                                                                                null,
    end_date                date                                                                                                                                                                null,
    move_in_date            date                                                                                                                                                                null,
    move_out_date           date                                                                                                                                                                null,
    rent_amount             decimal(12, 2)                                                                                                                            default 0.00              not null,
    security_deposit_amount decimal(10, 2)                                                                                                                            default 0.00              null,
    advance_payment_amount  decimal(10, 2)                                                                                                                            default 0.00              null,
    billing_due_day         tinyint unsigned                                                                                                                          default '1'               null,
    agreement_url           text                                                                                                                                                                null,
    status                  enum ('draft', 'pending', 'sent', 'landlord_signed', 'tenant_signed', 'completed', 'active', 'expired', 'cancelled', 'pending_signature') default 'draft'           null,
    created_at              timestamp                                                                                                                                 default CURRENT_TIMESTAMP null,
    updated_at              timestamp                                                                                                                                 default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    grace_period_days       int                                                                                                                                       default 3                 null,
    late_penalty_amount     decimal(10, 2)                                                                                                                            default 1000.00           null,
    xendit_customer_id      varchar(100)                                                                                                                                                        null,
    constraint uq_lease_agreement_id
        unique (agreement_id),
    constraint LeaseAgreement_ibfk_1
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on update cascade on delete cascade,
    constraint LeaseAgreement_ibfk_2
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
);

create table rentalley_db.Billing
(
    billing_id               varchar(20)                                                                        not null
        primary key,
    lease_id                 varchar(20)                                                                        not null,
    unit_id                  varchar(12)                                                                        not null,
    billing_period           date                                                                               not null,
    total_water_amount       decimal(10, 2)                                           default 0.00              null,
    total_electricity_amount decimal(10, 2)                                           default 0.00              null,
    total_amount_due         decimal(10, 2)                                                                     null,
    status                   enum ('draft', 'finalized', 'unpaid', 'paid', 'overdue') default 'draft'           null,
    due_date                 date                                                                               not null,
    paid_at                  timestamp                                                                          null,
    created_at               timestamp                                                default CURRENT_TIMESTAMP null,
    updated_at               timestamp                                                default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    pdc_id                   int                                                                                null,
    constraint uniq_unit_billing_month
        unique (unit_id, billing_period),
    constraint Billing_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade,
    constraint fk_billing_lease
        foreign key (lease_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade,
    constraint fk_billing_pdc
        foreign key (pdc_id) references rentalley_db.PostDatedCheck (pdc_id)
            on update cascade on delete set null
);

create index idx_billing_lease_id
    on rentalley_db.Billing (lease_id);

create index idx_billing_lease_period
    on rentalley_db.Billing (lease_id asc, billing_period desc);

create index idx_billing_status_due
    on rentalley_db.Billing (status, due_date);

create index idx_billing_status_due_date
    on rentalley_db.Billing (status, due_date);

create index idx_billing_unit_status
    on rentalley_db.Billing (unit_id, status);

create index idx_billing_unit_status_due
    on rentalley_db.Billing (unit_id, status, due_date);

create index unit_id
    on rentalley_db.Billing (unit_id);

create table rentalley_db.BillingAdditionalCharge
(
    id              int auto_increment
        primary key,
    billing_id      varchar(20)                                               not null,
    charge_category enum ('additional', 'discount') default 'additional'      null,
    charge_type     varchar(100)                                              not null,
    amount          decimal(10, 2)                  default 0.00              not null,
    created_at      timestamp                       default CURRENT_TIMESTAMP null,
    constraint fk_billing_additional_charge
        foreign key (billing_id) references rentalley_db.Billing (billing_id)
            on delete cascade
);

create index tenant_id
    on rentalley_db.LeaseAgreement (tenant_id);

create index unit_id
    on rentalley_db.LeaseAgreement (unit_id);

create index idx_unit_property_created
    on rentalley_db.Unit (property_id asc, created_at desc);

create index idx_unit_property_publish_status
    on rentalley_db.Unit (property_id, publish, status);

create index idx_unit_property_publish_status_rent
    on rentalley_db.Unit (property_id, publish, status, rent_amount);

create index property_id_idx
    on rentalley_db.Unit (property_id);

CREATE TABLE IF NOT EXISTS rentalley_db.WaterMeterReading
(
    reading_id             INT AUTO_INCREMENT PRIMARY KEY,
    unit_id                VARCHAR(12) NOT NULL,
    period_start           DATE NOT NULL,
    period_end             DATE NOT NULL,
    reading_date           DATE NOT NULL,
    previous_reading       DECIMAL(10, 2) NOT NULL,
    current_reading        DECIMAL(10, 2) NOT NULL,
    consumption           DECIMAL(10, 2) GENERATED ALWAYS AS ((current_reading - previous_reading)) STORED,
    water_bill_id         INT DEFAULT NULL,
    is_locked              TINYINT(1) DEFAULT 0,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT WaterMeterReading_ibfk_1
        FOREIGN KEY (unit_id) REFERENCES rentalley_db.Unit (unit_id)
            ON DELETE CASCADE
);

CREATE INDEX water_meter_unit_id ON rentalley_db.WaterMeterReading (unit_id);
CREATE INDEX water_meter_period ON rentalley_db.WaterMeterReading (period_start, period_end);

-- =====================================================
-- DROP OLD COMBINED TABLE (if exists)
-- =====================================================

DROP TABLE IF EXISTS rentalley_db.ConcessionaireBilling;

-- =====================================================
-- NORMALIZED: Separate Water and Electricity Billing Tables
-- =====================================================

-- Create Water Concessionaire Billing Table
CREATE TABLE IF NOT EXISTS rentalley_db.WaterConcessionaireBilling (
    bill_id                 INT AUTO_INCREMENT PRIMARY KEY,
    property_id             VARCHAR(12) NOT NULL,
    consumption           DECIMAL(10, 2) NOT NULL COMMENT 'Water consumption in cubic meters (m³)',
    total_amount           DECIMAL(12, 2) NOT NULL COMMENT 'Total amount in PHP',
    rate_per_cubic         DECIMAL(10, 4) NOT NULL COMMENT 'Rate per cubic meter',
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT WaterConcessionaireBilling_ibfk_1
        FOREIGN KEY (property_id) REFERENCES rentalley_db.Property (property_id)
        ON DELETE CASCADE
);

CREATE INDEX water_concessionaire_property_id ON rentalley_db.WaterConcessionaireBilling (property_id);
CREATE INDEX water_concessionaire_created ON rentalley_db.WaterConcessionaireBilling (created_at);

-- Create Electricity Concessionaire Billing Table
CREATE TABLE IF NOT EXISTS rentalley_db.ElectricityConcessionaireBilling (
    bill_id                 INT AUTO_INCREMENT PRIMARY KEY,
    property_id             VARCHAR(12) NOT NULL,
    consumption           DECIMAL(10, 2) NOT NULL COMMENT 'Electricity consumption in kWh',
    total_amount           DECIMAL(12, 2) NOT NULL COMMENT 'Total amount in PHP',
    rate_per_kwh           DECIMAL(10, 4) NOT NULL COMMENT 'Rate per kWh',
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ElectricityConcessionaireBilling_ibfk_1
        FOREIGN KEY (property_id) REFERENCES rentalley_db.Property (property_id)
        ON DELETE CASCADE
);

CREATE INDEX electricity_concessionaire_property_id ON rentalley_db.ElectricityConcessionaireBilling (property_id);
CREATE INDEX electricity_concessionaire_created ON rentalley_db.ElectricityConcessionaireBilling (created_at);

-- =====================================================
-- MOCK SEED DATA FOR TESTING
-- Property: UPKYP668L6X
-- Unit: UPKYUXS22W6
-- Uses created_at timestamp for month
-- =====================================================

-- Property Utility Rates (Water - April 2026)
INSERT INTO rentalley_db.WaterConcessionaireBilling (property_id, consumption, total_amount, rate_per_cubic)
VALUES (
    'UPKYP668L6X',
    45.00,
    1125.00,
    25.0000
);

-- Property Utility Rates (Electricity - April 2026)
INSERT INTO rentalley_db.ElectricityConcessionaireBilling (property_id, consumption, total_amount, rate_per_kwh)
VALUES (
    'UPKYP668L6X',
    320.00,
    4928.64,
    15.4013
);

-- =====================================================
-- ALTER STATEMENTS: Update Concessionaire Billing Tables
-- Drop old period_start/period_end columns if they exist
-- =====================================================

-- Drop period columns from Water table (if exists from previous schema)
-- ALTER TABLE rentalley_db.WaterConcessionaireBilling DROP COLUMN IF EXISTS period_start;
-- ALTER TABLE rentalley_db.WaterConcessionaireBilling DROP COLUMN IF EXISTS period_end;

-- Drop period columns from Electricity table (if exists from previous schema)
-- ALTER TABLE rentalley_db.ElectricityConcessionaireBilling DROP COLUMN IF EXISTS period_start;
-- ALTER TABLE rentalley_db.ElectricityConcessionaireBilling DROP COLUMN IF EXISTS period_end;

-- =====================================================
-- ALTER STATEMENTS: Update Meter Reading Tables
-- Run these SEPARATELY - check constraint names first if needed
-- Run: SHOW CREATE TABLE rentalley_db.ElectricMeterReading; to find exact constraint name
-- =====================================================

-- Step 1: Drop old FK constraint (use actual name from SHOW CREATE TABLE)
-- ALTER TABLE rentalley_db.ElectricMeterReading DROP FOREIGN KEY <constraint_name>;
-- ALTER TABLE rentalley_db.WaterMeterReading DROP FOREIGN KEY <constraint_name>;

-- Step 2: Rename columns (run these)
ALTER TABLE rentalley_db.ElectricMeterReading CHANGE COLUMN concessionaire_bill_id electricity_bill_id INT DEFAULT NULL;
ALTER TABLE rentalley_db.WaterMeterReading CHANGE COLUMN concessionaire_bill_id water_bill_id INT DEFAULT NULL;

-- Convert consumption to computed column if not already
-- (MySQL 5.7+ syntax - requires table rebuild)
-- Note: If consumption is not generated, manually calculate:
-- ALTER TABLE rentalley_db.ElectricMeterReading MODIFY consumption DECIMAL(10,2) GENERATED ALWAYS AS ((current_reading - previous_reading)) STORED;
-- ALTER TABLE rentalley_db.WaterMeterReading MODIFY consumption DECIMAL(10,2) GENERATED ALWAYS AS ((current_reading - previous_reading)) STORED;

-- =====================================================
-- SEED DATA: Meter Readings (Property: UPKYP668L6X, Unit: UPKYUXS22W6)
-- =====================================================

-- Electric Meter Reading (Feb 2026)
INSERT INTO rentalley_db.ElectricMeterReading (unit_id, period_start, period_end, reading_date, previous_reading, current_reading)
VALUES ('UPKYUXS22W6', '2026-02-01', '2026-02-28', '2026-02-28', 100.00, 380.00);

-- Electric Meter Reading (March 2026)
INSERT INTO rentalley_db.ElectricMeterReading (unit_id, period_start, period_end, reading_date, previous_reading, current_reading)
VALUES ('UPKYUXS22W6', '2026-03-01', '2026-03-31', '2026-03-31', 380.00, 700.00);

-- Water Meter Reading (Feb 2026)
INSERT INTO rentalley_db.WaterMeterReading (unit_id, period_start, period_end, reading_date, previous_reading, current_reading)
VALUES ('UPKYUXS22W6', '2026-02-01', '2026-02-28', '2026-02-28', 10.00, 45.00);

-- Water Meter Reading (March 2026)
INSERT INTO rentalley_db.WaterMeterReading (unit_id, period_start, period_end, reading_date, previous_reading, current_reading)
VALUES ('UPKYUXS22W6', '2026-03-01', '2026-03-31', '2026-03-31', 45.00, 90.00);

