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

create table rentalley_db.SubscriptionMonthlyBillingSnapshot
(
    snapshot_id          int auto_increment
        primary key,
    subscription_id      char(20)                                                       not null,
    xendit_cycle_id      varchar(100)                                                   null,
    billing_month        date                                                           not null,
    billing_period_start datetime                                                       null,
    billing_period_end   datetime                                                       null,
    cutoff_at            datetime                                                       null,
    applied_floor_price  decimal(10, 2)                                                 not null,
    total_computed       decimal(10, 2)                                                 not null,
    final_charge         decimal(10, 2)                                                 not null,
    charge_basis         enum ('floor_price', 'unit_based')   default 'floor_price'     not null,
    sync_status          enum ('pending', 'synced', 'failed') default 'pending'         not null,
    synced_at            datetime                                                       null,
    created_at           timestamp                            default CURRENT_TIMESTAMP null,
    constraint uq_subscription_billing_month
        unique (subscription_id, billing_month),
    constraint fk_subscription_snapshot
        foreign key (subscription_id) references rentalley_db.Subscription (subscription_id)
);

create index idx_snapshot_cycle_id
    on rentalley_db.SubscriptionMonthlyBillingSnapshot (xendit_cycle_id);

create table rentalley_db.SubscriptionMonthlyBillingSnapshotItem
(
    item_id         int auto_increment
        primary key,
    snapshot_id     int                                         not null,
    property_type   enum ('residential', 'commercial', 'mixed') not null,
    units_used      int            default 0                    not null,
    unit_price      decimal(10, 2) default 0.00                 not null,
    computed_amount decimal(10, 2) default 0.00                 not null,
    created_at      timestamp      default CURRENT_TIMESTAMP    null,
    constraint uq_snapshot_item_property_type
        unique (snapshot_id, property_type),
    constraint fk_snapshot_item_snapshot
        foreign key (snapshot_id) references rentalley_db.SubscriptionMonthlyBillingSnapshot (snapshot_id)
            on delete cascade
);

create index idx_snapshot_item_snapshot_id
    on rentalley_db.SubscriptionMonthlyBillingSnapshotItem (snapshot_id);

create table rentalley_db.SubscriptionPayment
(
    payment_id        int auto_increment
        primary key,
    subscription_id   char(20)                                                     not null,
    snapshot_id       int                                                          null,
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
    constraint fk_payment_snapshot
        foreign key (snapshot_id) references rentalley_db.SubscriptionMonthlyBillingSnapshot (snapshot_id)
            on delete set null,
    constraint fk_payment_subscription
        foreign key (subscription_id) references rentalley_db.Subscription (subscription_id)
            on delete cascade
);

create index idx_payment_landlord
    on rentalley_db.SubscriptionPayment (landlord_id);

create index idx_payment_snapshot
    on rentalley_db.SubscriptionPayment (snapshot_id);

create index idx_payment_subscription
    on rentalley_db.SubscriptionPayment (subscription_id);

