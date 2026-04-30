create table rentalley_db.Property
(
    property_id              varchar(12)                                                       not null
        primary key,
    landlord_id              varchar(20)                                                       not null,
    property_name            varchar(60)                                                       not null,
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
    house_policy             longtext                                                          null,
    property_type            enum ('residential', 'commercial', 'mixed')                       not null,
    property_subtype         varchar(60)                                                       null
);

create index Property_ibfk_1
    on rentalley_db.Property (landlord_id);

create index idx_property_landlord_created
    on rentalley_db.Property (landlord_id, created_at);

create index idx_property_landlord_status
    on rentalley_db.Property (landlord_id, status);

create index idx_property_landlord_status_created
    on rentalley_db.Property (landlord_id asc, status asc, created_at desc);

create table rentalley_db.PropertySubtype
(
    subtype_id    int auto_increment
        primary key,
    property_type enum ('residential', 'commercial', 'mixed') not null,
    name          varchar(60)                                 not null,
    created_at    timestamp default CURRENT_TIMESTAMP         null
);

create index idx_subtype_property_type
    on rentalley_db.PropertySubtype (property_type);

# Subscrition

create table rentalley_db.Plan
(
    plan_id       int auto_increment
        primary key,
    plan_code     varchar(50)                                                      not null,
    name          varchar(50)                                                      not null,
    price         decimal(10, 2)                         default 0.00              not null,
    billing_cycle enum ('monthly', 'yearly', 'lifetime') default 'monthly'         null,
    is_active     tinyint(1)                             default 1                 null,
    created_at    timestamp                              default CURRENT_TIMESTAMP null,
    updated_at    timestamp                              default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    platform_fee  decimal(5, 2)                          default 0.00              not null comment 'Platform commission percentage (e.g. 5.00 = 5%)',
    fee_type      enum ('percentage', 'flat')            default 'percentage'      null,
    split_rule_id varchar(100)                                                     null,
    unit_price    decimal(10, 2)                         default 0.00              not null comment 'Additional price per unit (monthly)',
    constraint name
        unique (name),
    constraint uq_plan_code
        unique (plan_code)
);

create table rentalley_db.PlanFeatures
(
    id                 int auto_increment
        primary key,
    plan_id            int                  not null,
    reports            tinyint(1) default 0 null,
    pdc_management     tinyint(1) default 0 null,
    ai_unit_generator  tinyint(1) default 0 null,
    bulk_import        tinyint(1) default 0 null,
    announcements      tinyint(1) default 0 null,
    asset_management   tinyint(1) default 0 null,
    financial_insights tinyint(1) default 0 null,
    constraint PlanFeatures_ibfk_1
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on delete cascade
);

create index plan_id
    on rentalley_db.PlanFeatures (plan_id);

create table rentalley_db.PlanLimits
(
    id                      int auto_increment
        primary key,
    plan_id                 int         not null,
    max_storage             varchar(20) null,
    max_assets_per_property int         null,
    financial_history_years int         null,
    constraint PlanLimits_ibfk_1
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on delete cascade
);

create index plan_id
    on rentalley_db.PlanLimits (plan_id);

