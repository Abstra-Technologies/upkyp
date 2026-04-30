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

