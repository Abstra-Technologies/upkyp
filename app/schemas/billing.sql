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

