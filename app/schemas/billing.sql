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

create table rentalley_db.ElectricityConcessionaireBilling
(
    bill_id      int auto_increment
        primary key,
    property_id  varchar(12)                         not null,
    period_start date                                not null,
    period_end   date                                not null,
    consumption  decimal(10, 2)                      not null comment 'Electricity consumption in kWh',
    total_amount decimal(12, 2)                      not null comment 'Total amount in PHP',
    rate_per_kwh decimal(10, 4)                      not null comment 'Rate per kWh',
    created_at   timestamp default CURRENT_TIMESTAMP null,
    updated_at   timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint ElectricityConcessionaireBilling_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create index electricity_concessionaire_period
    on rentalley_db.ElectricityConcessionaireBilling (period_start, period_end);

create index electricity_concessionaire_property_id
    on rentalley_db.ElectricityConcessionaireBilling (property_id);

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

create table rentalley_db.ElectricMeterReading
(
    reading_id          int auto_increment
        primary key,
    unit_id             varchar(12)                          not null,
    lease_id            varchar(20)                          null,
    period_start        date                                 not null,
    period_end          date                                 not null,
    previous_reading    decimal(10, 2)                       not null,
    current_reading     decimal(10, 2)                       not null,
    consumption         decimal(10, 2) as ((`current_reading` - `previous_reading`)) stored,
    electricity_bill_id int                                  null,
    is_locked           tinyint(1) default 0                 null,
    created_at          timestamp  default CURRENT_TIMESTAMP null,
    updated_at          timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint ElectricMeterReading_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade,
    constraint ElectricMeterReading_ibfk_2
        foreign key (electricity_bill_id) references rentalley_db.ConcessionaireBilling (bill_id)
            on delete set null,
    constraint fk_electric_meter_lease
        foreign key (lease_id) references rentalley_db.LeaseAgreement (agreement_id)
            on update cascade on delete set null
);

create index concessionaire_bill_id
    on rentalley_db.ElectricMeterReading (electricity_bill_id);

create index idx_electric_meter_lease_id
    on rentalley_db.ElectricMeterReading (lease_id);

create index unit_id
    on rentalley_db.ElectricMeterReading (unit_id);

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

create table rentalley_db.WaterConcessionaireBilling
(
    bill_id        int auto_increment
        primary key,
    property_id    varchar(12)                         not null,
    period_start   date                                not null,
    period_end     date                                not null,
    consumption    decimal(10, 2)                      not null comment 'Water consumption in cubic meters (m³)',
    total_amount   decimal(12, 2)                      not null comment 'Total amount in PHP',
    rate_per_cubic decimal(10, 4)                      not null comment 'Rate per cubic meter',
    created_at     timestamp default CURRENT_TIMESTAMP null,
    updated_at     timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint WaterConcessionaireBilling_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create index water_concessionaire_period
    on rentalley_db.WaterConcessionaireBilling (period_start, period_end);

create index water_concessionaire_property_id
    on rentalley_db.WaterConcessionaireBilling (property_id);

create table rentalley_db.WaterMeterReading
(
    reading_id       int auto_increment
        primary key,
    unit_id          varchar(12)                          not null,
    lease_id         varchar(20)                          null,
    period_start     date                                 not null,
    period_end       date                                 not null,
    previous_reading decimal(10, 2)                       not null,
    current_reading  decimal(10, 2)                       not null,
    consumption      decimal(10, 2) as ((`current_reading` - `previous_reading`)) stored,
    water_bill_id    int                                  null,
    is_locked        tinyint(1) default 0                 null,
    created_at       timestamp  default CURRENT_TIMESTAMP null,
    updated_at       timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint WaterMeterReading_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade,
    constraint WaterMeterReading_ibfk_2
        foreign key (water_bill_id) references rentalley_db.ConcessionaireBilling (bill_id)
            on delete set null,
    constraint fk_water_meter_lease
        foreign key (lease_id) references rentalley_db.LeaseAgreement (agreement_id)
            on update cascade on delete set null
);

create index concessionaire_bill_id
    on rentalley_db.WaterMeterReading (water_bill_id);

create index idx_water_meter_lease_id
    on rentalley_db.WaterMeterReading (lease_id);

create index unit_id
    on rentalley_db.WaterMeterReading (unit_id);

/* =====================================================
   UNIQUE INDEXES - Prevent duplicate meter readings per lease per month
===================================================== */

create unique index uniq_electric_meter_lease_month
    on rentalley_db.ElectricMeterReading (lease_id, YEAR(period_end), MONTH(period_end));

create unique index uniq_water_meter_lease_month
    on rentalley_db.WaterMeterReading (lease_id, YEAR(period_end), MONTH(period_end));

/* =====================================================
   SEED DATA - Meter Readings for Lease UPKYPLI06FGDAOCC
   (March 2026 - last month billing period)
===================================================== */

INSERT IGNORE INTO rentalley_db.WaterMeterReading
    (unit_id, lease_id, period_start, period_end, previous_reading, current_reading)
SELECT u.unit_id, 'UPKYPLI06FGDAOCC', '2026-03-01', '2026-03-31', 100.00, 150.00
FROM LeaseAgreement la
JOIN Unit u ON la.unit_id = u.unit_id
WHERE la.agreement_id = 'UPKYPLI06FGDAOCC'
  AND NOT EXISTS (
      SELECT 1 FROM WaterMeterReading wmr
      WHERE wmr.lease_id = 'UPKYPLI06FGDAOCC'
        AND YEAR(wmr.period_end) = 2026
        AND MONTH(wmr.period_end) = 3
  );

INSERT IGNORE INTO rentalley_db.ElectricMeterReading
    (unit_id, lease_id, period_start, period_end, previous_reading, current_reading)
SELECT u.unit_id, 'UPKYPLI06FGDAOCC', '2026-03-01', '2026-03-31', 500.00, 650.00
FROM LeaseAgreement la
JOIN Unit u ON la.unit_id = u.unit_id
WHERE la.agreement_id = 'UPKYPLI06FGDAOCC'
  AND NOT EXISTS (
      SELECT 1 FROM ElectricMeterReading emr
      WHERE emr.lease_id = 'UPKYPLI06FGDAOCC'
        AND YEAR(emr.period_end) = 2026
        AND MONTH(emr.period_end) = 3
  );

