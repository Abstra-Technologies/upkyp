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

create table rentalley_db.Subscription
(
    subscription_id          char(20)                                                                                                                  not null
        primary key,
    landlord_id              varchar(20)                                                                                                               not null,
    plan_id                  int                                                                                                                       not null,
    pending_plan_id          int                                                                                                                       null,
    plan_change_effective_at datetime                                                                                                                  null,
    recurring_plan_id        varchar(100)                                                                                                              null,
    start_date               date                                                                                                                      not null,
    activated_at             datetime                                                                                                                  null,
    end_date                 date                                                                                                                      null,
    billing_timezone         varchar(50)                                                                                  default 'Asia/Manila'        null,
    last_payment_date        datetime                                                                                                                  null,
    cancelled_at             datetime                                                                                                                  null,
    paused_at                datetime                                                                                                                  null,
    cancel_at_period_end     tinyint(1)                                                                                   default 0                    not null,
    payment_status           enum ('paid', 'unpaid', 'pending', 'failed', 'cancelled')                                    default 'pending'            null,
    past_due_since           datetime                                                                                                                  null,
    cancel_reason            varchar(255)                                                                                                              null,
    subscription_status      enum ('trial', 'pending_activation', 'active', 'past_due', 'paused', 'cancelled', 'expired') default 'pending_activation' null,
    created_at               timestamp                                                                                    default CURRENT_TIMESTAMP    null,
    updated_at               timestamp                                                                                    default CURRENT_TIMESTAMP    null on update CURRENT_TIMESTAMP,
    request_reference_number varchar(50)                                                                                                               not null,
    is_trial                 tinyint(1)                                                                                   default 0                    not null,
    raw_xendit_payload       json                                                                                                                      null,
    payment_token_id         varchar(100)                                                                                                              null,
    anchor_day               datetime                                                                                                                  null,
    constraint uq_subscription_recurring_plan_id
        unique (recurring_plan_id),
    constraint uq_subscription_request_reference
        unique (request_reference_number),
    constraint Subscription_ibfk_1
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade,
    constraint fk_subscription_pending_plan
        foreign key (pending_plan_id) references rentalley_db.Plan (plan_id)
            on update cascade,
    constraint fk_subscription_plan
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on update cascade
);

create index idx_subscription_anchor_day
    on rentalley_db.Subscription (anchor_day);

create index idx_subscription_landlord_id
    on rentalley_db.Subscription (landlord_id);

create index idx_subscription_pending_plan
    on rentalley_db.Subscription (pending_plan_id);

create index idx_subscription_plan_change_effective
    on rentalley_db.Subscription (plan_change_effective_at);

create index idx_subscription_plan_id
    on rentalley_db.Subscription (plan_id);

create index idx_subscription_status
    on rentalley_db.Subscription (subscription_status);

create index idx_subscription_trial
    on rentalley_db.Subscription (landlord_id, is_trial);

