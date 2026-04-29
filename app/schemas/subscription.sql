create table rentalley_db.Subscription
(
    subscription_id          int auto_increment
        primary key,
    landlord_id              varchar(20)                                                                            not null,
    plan_name                varchar(50)                                                                            not null,
    plan_code                varchar(50)                                                                            null,
    xendit_subscription_id   varchar(100)                                                                           null,
    payment_session_id       varchar(100)                                                                           null,
    recurring_plan_id        varchar(100)                                                                           null,
    customer_id              varchar(100)                                                                           null,
    payment_link_url         varchar(500)                                                                           null,
    expires_at               datetime                                                                               null,
    start_date               date                                                                                   not null,
    end_date                 date                                                                                   null,
    next_billing_date        datetime                                                                               null,
    last_payment_date        datetime                                                                               null,
    cancelled_at             datetime                                                                               null,
    paused_at                datetime                                                                               null,
    payment_status           enum ('paid', 'unpaid', 'pending', 'failed', 'cancelled')    default 'pending'         null,
    cancel_reason            varchar(255)                                                                           null,
    subscription_status      enum ('trial', 'active', 'past_due', 'cancelled', 'expired') default 'active'          null,
    created_at               timestamp                                                    default CURRENT_TIMESTAMP null,
    updated_at               timestamp                                                    default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    request_reference_number varchar(50)                                                                            not null,
    is_trial                 tinyint(1)                                                   default 0                 not null,
    amount_paid              decimal(10, 2)                                               default 0.00              not null,
    is_active                tinyint(1)                                                   default 0                 null,
    raw_xendit_payload       json                                                                                   null,
    payment_token_id         varchar(100)                                                                           null,
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

