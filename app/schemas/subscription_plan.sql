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

create table rentalley_db.PlanUnitPriceByPropertyType
(
    id            int auto_increment
        primary key,
    plan_id       int                                         not null,
    property_type enum ('residential', 'commercial', 'mixed') not null,
    unit_price    decimal(10, 2) default 0.00                 not null,
    created_at    timestamp      default CURRENT_TIMESTAMP    null,
    updated_at    timestamp      default CURRENT_TIMESTAMP    null on update CURRENT_TIMESTAMP,
    constraint uq_plan_property_type
        unique (plan_id, property_type),
    constraint fk_plan_unit_price_plan
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on delete cascade
);

create index idx_plan_unit_price_plan_id
    on rentalley_db.PlanUnitPriceByPropertyType (plan_id);

create index idx_plan_unit_price_property_type
    on rentalley_db.PlanUnitPriceByPropertyType (property_type);

