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

create table rentalley_db.Payment
(
    payment_id                      int auto_increment
        primary key,
    transaction_id                  varchar(50)                                                                                                                        null,
    bill_id                         varchar(20)                                                                                                                        null,
    agreement_id                    varchar(20)                                                                                                                        null,
    payment_type                    enum ('monthly_rent', 'monthly_billing', 'monthly_utilities', 'penalty', 'security_payment', 'advance_payment', 'reservation_fee') not null,
    amount_paid                     decimal(10, 2)                                                                                                                     not null,
    payment_method_id               varchar(50)                                                                                                                        not null,
    payment_status                  enum ('pending', 'confirmed', 'failed', 'cancelled') default 'pending'                                                             null,
    receipt_reference               varchar(255)                                                                                                                       null,
    payment_date                    timestamp                                            default CURRENT_TIMESTAMP                                                     null,
    created_at                      timestamp                                            default CURRENT_TIMESTAMP                                                     null,
    updated_at                      timestamp                                            default CURRENT_TIMESTAMP                                                     null on update CURRENT_TIMESTAMP,
    proof_of_payment                text                                                                                                                               null,
    payout_status                   enum ('unpaid', 'in_payout', 'paid')                 default 'unpaid'                                                              null,
    gross_amount                    decimal(10, 2)                                                                                                                     null comment 'Amount charged to tenant before gateway fee',
    gateway_fee                     decimal(10, 2)                                                                                                                     null comment 'Payment gateway fee (Xendit)',
    platform_fee                    decimal(10, 2)                                                                                                                     null comment 'Platform commission from split.payment',
    gateway_vat                     decimal(10, 2)                                                                                                                     null comment 'VAT charged on Xendit processing fee',
    net_amount                      decimal(10, 2)                                                                                                                     null comment 'Amount after gateway fee',
    gateway_transaction_ref         varchar(128)                                                                                                                       null,
    transfer_reference_id           varchar(128)                                                                                                                       null,
    gateway_settlement_status       enum ('pending', 'settled', 'failed')                default 'pending'                                                             null,
    gateway_settled_at              datetime                                                                                                                           null,
    raw_gateway_payload             json                                                                                                                               null,
    gateway_withholding_tax         decimal(15, 2)                                       default 0.00                                                                  null,
    gateway_third_party_withholding decimal(15, 2)                                       default 0.00                                                                  null,
    constraint gateway_transaction_ref
        unique (gateway_transaction_ref),
    constraint transaction_id
        unique (transaction_id),
    constraint fk_payment_agreement
        foreign key (agreement_id) references rentalley_db.LeaseAgreement (agreement_id)
            on update cascade on delete cascade,
    constraint fk_payment_billing
        foreign key (bill_id) references rentalley_db.Billing (billing_id)
            on update cascade on delete cascade
);

create index idx_payment_agreement_id
    on rentalley_db.Payment (agreement_id);

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

