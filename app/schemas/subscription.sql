create table rentalley_db.Landlord
(
    landlord_id          varchar(20)                          not null
        primary key,
    user_id              char(36)                             not null,
    createdAt            timestamp  default CURRENT_TIMESTAMP not null,
    updatedAt            timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    is_trial_used        tinyint(1) default 0                 null,
    trial_used_at        datetime                             null,
    citizenship          varchar(200)                         null,
    is_verified          tinyint    default 0                 null,
    setup_completed      tinyint(1) default 0                 null,
    xendit_account_id    varchar(100)                         null,
    xendit_customer_id   varchar(100)                         null,
    payment_token_id     varchar(100)                         null,
    payment_method_type  varchar(50)                          null,
    payment_method_last4 varchar(10)                          null,
    constraint uniq_xendit_account_id
        unique (xendit_account_id),
    constraint uniq_xendit_customer_id
        unique (xendit_customer_id),
    constraint userID
        unique (user_id),
    constraint fk_user_landlord
        foreign key (user_id) references rentalley_db.User (user_id)
            on update cascade on delete cascade
);

create index idx_landlord_payment_token
    on rentalley_db.Landlord (payment_token_id);

create index idx_landlord_user_id
    on rentalley_db.Landlord (user_id);

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
    id             int auto_increment
        primary key,
    plan_id       int         not null,
    unit_range    varchar(50) not null comment 'e.g., 1-20, 21-50, 51-100',
    min_units     int         not null,
    max_units     int         not null,
    monthly_price decimal(10, 2) default 0.00 not null,
    annual_price  decimal(10, 2) default 0.00 not null,
    created_at    timestamp   default CURRENT_TIMESTAMP null,
    updated_at    timestamp   default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint PlanPrices_ibfk_1
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on delete cascade,
    constraint uq_plan_unit_range
        unique (plan_id, unit_range)
);

create index idx_plan_prices_plan_id
    on rentalley_db.PlanPrices (plan_id);

create table rentalley_db.Subscription
(
    subscription_id          int auto_increment
        primary key,
    landlord_id              varchar(20)                                                                            not null,
    plan_name                varchar(50)                                                                            not null,
    plan_code                varchar(50)                                                                            null,
    xendit_subscription_id   varchar(100)                                                                           null,
    start_date               date                                                                                   not null,
    end_date                 date                                                                                   null,
    next_billing_date        datetime                                                                               null,
    last_payment_date        datetime                                                                               null,
    cancelled_at             datetime                                                                               null,
    paused_at                datetime                                                                               null,
    payment_status           enum ('paid', 'unpaid', 'pending', 'failed', 'cancelled')    default 'pending'         null,
    subscription_status      enum ('trial', 'active', 'past_due', 'cancelled', 'expired') default 'active'          null,
    created_at               timestamp                                                    default CURRENT_TIMESTAMP null,
    updated_at               timestamp                                                    default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    request_reference_number varchar(50)                                                                            not null,
    is_trial                 tinyint(1)                                                   default 0                 not null,
    amount_paid              decimal(10, 2)                                               default 0.00              not null,
    is_active                tinyint(1)                                                   default 0                 null,
    raw_xendit_payload       json                                                                                   null,
    constraint Subscription_ibfk_1
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade
);

create index idx_subscription_active
    on rentalley_db.Subscription (landlord_id, is_active);

create index idx_subscription_landlord_id
    on rentalley_db.Subscription (landlord_id);

create index idx_subscription_status
    on rentalley_db.Subscription (subscription_status);

create index idx_subscription_trial
    on rentalley_db.Subscription (landlord_id, is_trial);

create index idx_subscription_xendit_id
    on rentalley_db.Subscription (xendit_subscription_id);

create table rentalley_db.XenditWebhookLog
(
    id         int auto_increment
        primary key,
    event_id   varchar(100)                         not null,
    event_type varchar(100)                         not null,
    processed  tinyint(1) default 0                 null,
    created_at timestamp  default CURRENT_TIMESTAMP null,
    constraint uniq_event_id
        unique (event_id)
);


create table rentalley_db.SubscriptionPayment
(
    payment_id        int auto_increment
        primary key,
    subscription_id   int                                                          not null,
    landlord_id       varchar(20)                                                  not null,
    xendit_payment_id varchar(100)                                                 null,
    xendit_invoice_id varchar(100)                                                 null,
    amount            decimal(10, 2)                                               not null,
    currency          varchar(10)                        default 'PHP'             null,
    status            enum ('pending', 'paid', 'failed') default 'pending'         null,
    paid_at           datetime                                                     null,
    created_at        timestamp                          default CURRENT_TIMESTAMP null,
    raw_payload       json                                                         null,
    constraint fk_payment_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade,
    constraint fk_payment_subscription
        foreign key (subscription_id) references rentalley_db.Subscription (subscription_id)
            on delete cascade
);

create index idx_payment_landlord
    on rentalley_db.SubscriptionPayment (landlord_id);

create index idx_payment_subscription
    on rentalley_db.SubscriptionPayment (subscription_id);


