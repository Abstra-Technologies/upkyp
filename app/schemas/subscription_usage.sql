hooks/landlord/useSubscription.ts
hooks/landlord/useSubscriptionData.ts


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

create table rentalley_db.PlanPrices
(
    id            int auto_increment
        primary key,
    plan_id       int                                      not null,
    unit_range    varchar(50)                              not null comment 'e.g., 1-20, 21-50, 51-100',
    min_units     int                                      not null,
    max_units     int                                      not null,
    monthly_price decimal(10, 2) default 0.00              not null,
    annual_price  decimal(10, 2) default 0.00              not null,
    created_at    timestamp      default CURRENT_TIMESTAMP null,
    updated_at    timestamp      default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint uq_plan_unit_range
        unique (plan_id, unit_range),
    constraint PlanPrices_ibfk_1
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on delete cascade
);

create index idx_plan_prices_plan_id
    on rentalley_db.PlanPrices (plan_id);

create table rentalley_db.SubscriptionUsage
(
    id                  int auto_increment
        primary key,
    landlord_id         int         not null,
    plan_id             int         not null,
    current_properties  int         default 0                 not null comment 'Current number of properties used',
    max_properties      int         null                       comment 'Max properties allowed (null = unlimited)',
    current_units       int         default 0                 not null comment 'Current number of units across all properties',
    max_units           int         null                       comment 'Max units allowed (null = unlimited)',
    current_assets      int         default 0                 not null comment 'Current total assets across all properties',
    max_assets_per_unit int         null                       comment 'Max assets per unit allowed (null = unlimited)',
    storage_used_mb     decimal(10, 2) default 0              not null comment 'Storage used in MB',
    max_storage_mb      decimal(10, 2) null                    comment 'Max storage in MB (null = unlimited)',
    created_at          timestamp   default CURRENT_TIMESTAMP null,
    updated_at          timestamp   default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint SubscriptionUsage_ibfk_1
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade,
    constraint SubscriptionUsage_ibfk_2
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on delete cascade
);

create index idx_subscription_usage_landlord_id
    on rentalley_db.SubscriptionUsage (landlord_id);

create index idx_subscription_usage_plan_id
    on rentalley_db.SubscriptionUsage (plan_id);

