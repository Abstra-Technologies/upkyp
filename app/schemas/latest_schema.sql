create table rentalley_db.Admin
(
    admin_id        varchar(20)                                  not null
        primary key,
    username        varchar(20)                                  not null,
    password        varchar(255)                                 not null,
    role            varchar(20)                                  not null,
    email           varchar(172)                                 not null,
    status          enum ('active', 'disabled') default 'active' null,
    fcm_token       text                                         null,
    first_name      varchar(225)                                 null,
    last_name       varchar(225)                                 null,
    email_hash      char(64)                                     not null,
    profile_picture varchar(255)                                 null,
    permissions     text                                         null
);

create table rentalley_db.AdminAnnouncement
(
    id              int auto_increment
        primary key,
    admin_id        varchar(20)                         not null,
    title           varchar(255)                        null,
    message         text                                null,
    target_audience enum ('all', 'tenant', 'landlord')  null,
    created_at      timestamp default CURRENT_TIMESTAMP null,
    constraint AdminAnnouncement_ibfk_1
        foreign key (admin_id) references rentalley_db.Admin (admin_id)
            on delete cascade
);

create index adminID
    on rentalley_db.AdminAnnouncement (admin_id);

create table rentalley_db.Admin_archive
(
    admin_id        varchar(20)                                  not null
        primary key,
    username        varchar(20)                                  not null,
    password        varchar(255)                                 not null,
    role            varchar(20)                                  not null,
    email           varchar(172)                                 not null,
    status          enum ('active', 'disabled') default 'active' null,
    fcm_token       text                                         null,
    first_name      varchar(225)                                 null,
    last_name       varchar(225)                                 null,
    email_hash      char(64)                                     not null,
    profile_picture varchar(255)                                 null,
    permissions     text                                         null,
    deleted_at      datetime                                     not null
);

create table rentalley_db.Expenses
(
    expense_id     int auto_increment
        primary key,
    reference_type varchar(50)                           null,
    reference_id   varchar(20)                           null,
    amount         decimal(10, 2)                        not null,
    category       varchar(50) default 'other'           null,
    description    varchar(255)                          null,
    created_by     int                                   null,
    created_at     datetime    default CURRENT_TIMESTAMP null
);

create table rentalley_db.InviteCode
(
    id         int auto_increment
        primary key,
    code       varchar(255)                                                              not null,
    email      varchar(255)                                                              not null,
    unitId     varchar(12)                                                               not null,
    status     enum ('PENDING', 'USED', 'EXPIRED', 'REJECTED') default 'PENDING'         null,
    expiresAt  datetime                                                                  not null,
    createdAt  datetime                                        default CURRENT_TIMESTAMP null,
    start_date date                                                                      null,
    end_date   date                                                                      null,
    constraint code
        unique (code)
);

create table rentalley_db.IpAddresses
(
    id                int auto_increment
        primary key,
    ip_address        varchar(45)                         not null,
    label             varchar(100)                        null,
    added_by_admin_id varchar(20)                         null,
    created_at        timestamp default CURRENT_TIMESTAMP null
);

create table rentalley_db.LandlordPayoutHistory
(
    payout_id              int auto_increment
        primary key,
    landlord_id            varchar(20)                                                                                                                                                      not null,
    amount                 decimal(10, 2)                                                                                                                                                   not null,
    included_payments      json                                                                                                                                                             null,
    payout_method          varchar(30)                                                                                                                                                      not null,
    channel_code           varchar(20)                                                                                                                                                      not null,
    external_id            varchar(100)                                                                                                                                                     not null,
    xendit_disbursement_id varchar(100)                                                                                                                                                     null,
    account_name           varchar(200)                                                                                                                                                     not null,
    account_number         varchar(200)                                                                                                                                                     not null,
    bank_name              varchar(200)                                                                                                                                                     null,
    status                 enum ('ACCEPTED', 'PENDING_COMPLIANCE_ASSESSMENT', 'COMPLIANCE_REJECTED', 'REQUESTED', 'FAILED', 'SUCCEEDED', 'CANCELLED', 'REVERSED') default 'ACCEPTED'        not null,
    receipt_url            text                                                                                                                                                             null,
    notes                  text                                                                                                                                                             null,
    created_at             timestamp                                                                                                                              default CURRENT_TIMESTAMP null,
    updated_at             timestamp                                                                                                                              default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
);

create index idx_payout_external_id
    on rentalley_db.LandlordPayoutHistory (external_id);

create index idx_payout_landlord
    on rentalley_db.LandlordPayoutHistory (landlord_id);

create table rentalley_db.LoginAttempts
(
    id              bigint auto_increment
        primary key,
    ip_address      varchar(45)                         not null,
    email_hash      varchar(64)                         not null,
    attempts        int       default 1                 null,
    last_attempt_at timestamp default CURRENT_TIMESTAMP null,
    locked_until    datetime                            null
);

create index idx_ip_email
    on rentalley_db.LoginAttempts (ip_address, email_hash);

create index idx_locked
    on rentalley_db.LoginAttempts (locked_until);

create table rentalley_db.PaymentMethod
(
    method_id   int auto_increment
        primary key,
    method_name varchar(50)                         not null,
    created_at  timestamp default CURRENT_TIMESTAMP null,
    updated_at  timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint method_name
        unique (method_name)
);

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
    plan_id                 int not null,
    max_properties          int null,
    max_units               int null,
    max_maintenance_request int null,
    max_billing             int null,
    max_prospect            int null,
    max_storage             int null,
    max_assets_per_property int null,
    financial_history_years int null,
    constraint PlanLimits_ibfk_1
        foreign key (plan_id) references rentalley_db.Plan (plan_id)
            on delete cascade
);

create index plan_id
    on rentalley_db.PlanLimits (plan_id);

create table rentalley_db.Property
(
    property_id              varchar(12)                                                       not null
        primary key,
    landlord_id              varchar(20)                                                       not null,
    property_name            varchar(60)                                                       not null,
    property_type            varchar(60)                                                       not null,
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
    house_policy             longtext                                                          null
);

create table rentalley_db.ConcessionaireBilling
(
    bill_id                 int auto_increment
        primary key,
    property_id             varchar(12)                         not null,
    period_start            date                                not null,
    period_end              date                                not null,
    water_consumption       decimal(10, 2)                      null,
    water_total             decimal(12, 2)                      null,
    electricity_consumption decimal(10, 2)                      null,
    electricity_total       decimal(12, 2)                      null,
    created_at              timestamp default CURRENT_TIMESTAMP null,
    updated_at              timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    water_rate              decimal(10, 4)                      null comment 'Computed rate: water_total / water_consumption',
    electricity_rate        decimal(10, 4)                      null comment 'Computed rate: electricity_total / electricity_consumption',
    constraint ConcessionaireBilling_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create index property_id
    on rentalley_db.ConcessionaireBilling (property_id);

create index Property_ibfk_1
    on rentalley_db.Property (landlord_id);

create index idx_property_landlord_created
    on rentalley_db.Property (landlord_id, created_at);

create index idx_property_landlord_status
    on rentalley_db.Property (landlord_id, status);

create index idx_property_landlord_status_created
    on rentalley_db.Property (landlord_id asc, status asc, created_at desc);

create table rentalley_db.PropertyConfiguration
(
    config_id          char(36)                                               not null
        primary key,
    property_id        varchar(12)                                            not null,
    billingReminderDay tinyint unsigned             default '1'               null comment 'Day of the month to remind tenants (e.g., 25 for every 25th)',
    billingDueDay      tinyint unsigned             default '30'              null comment 'Day of the month when rent is due. For months shorter than 30 days (e.g., February), the system will automatically adjust to the last valid day.',
    notifyEmail        tinyint(1)                   default 0                 null,
    notifySms          tinyint(1)                   default 0                 null,
    lateFeeType        enum ('fixed', 'percentage') default 'fixed'           null comment 'Type of late fee: fixed amount or percentage of rent',
    lateFeeFrequency   enum ('one_time', 'per_day')                           null,
    lateFeeAmount      decimal(10, 2)               default 0.00              null comment 'Amount or percentage value for late fee',
    gracePeriodDays    smallint unsigned            default '3'               null comment 'Days after due date before applying penalty',
    createdAt          timestamp                    default CURRENT_TIMESTAMP null,
    updatedAt          timestamp                    default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint PropertyConfiguration_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade,
    constraint chk_due_day_valid
        check (`billingDueDay` between 1 and 31)
);

create table rentalley_db.PropertyPaymentMethod
(
    id          int auto_increment
        primary key,
    property_id varchar(12)                         not null,
    method_id   int                                 not null,
    created_at  timestamp default CURRENT_TIMESTAMP null,
    constraint unique_property_method
        unique (property_id, method_id),
    constraint PropertyPaymentMethod_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade,
    constraint PropertyPaymentMethod_ibfk_2
        foreign key (method_id) references rentalley_db.PaymentMethod (method_id)
            on delete cascade
);

create index method_id
    on rentalley_db.PropertyPaymentMethod (method_id);

create table rentalley_db.PropertyPhoto
(
    photo_id    int auto_increment
        primary key,
    property_id varchar(12)                         null,
    photo_url   text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP null,
    updated_at  timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint PropertyPhoto_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create table rentalley_db.PropertyVerification
(
    verification_id int auto_increment
        primary key,
    property_id     varchar(12)                                                    not null,
    doc_type        enum ('business_permit', 'occupancy_permit', 'property_title') not null,
    submitted_doc   text                                                           not null,
    gov_id          text                                                           not null,
    outdoor_photo   text                                                           not null,
    indoor_photo    text                                                           not null,
    status          enum ('Pending', 'Verified', 'Rejected')                       null,
    admin_message   text                                                           null,
    reviewed_by     varchar(20)                                                    null,
    created_at      timestamp  default CURRENT_TIMESTAMP                           null,
    updated_at      timestamp  default CURRENT_TIMESTAMP                           null on update CURRENT_TIMESTAMP,
    verified        tinyint(1) default 0                                           null,
    attempts        int        default 0                                           not null,
    constraint property_id
        unique (property_id),
    constraint PropertyVerification_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade,
    constraint fk_admin
        foreign key (reviewed_by) references rentalley_db.Admin (admin_id)
            on delete set null
);

create table rentalley_db.SupportRequest
(
    support_id int auto_increment
        primary key,
    email      varchar(200)                                                                    null,
    issue      varchar(100)                                                                    null,
    message    text                                                                            not null,
    status     enum ('Pending', 'In Progress', 'Resolved', 'Closed') default 'Pending'         null,
    created_at timestamp                                             default CURRENT_TIMESTAMP null
);

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

create table rentalley_db.Asset
(
    asset_id             varchar(12)                                                                           not null
        primary key,
    property_id          varchar(12)                                                                           not null,
    unit_id              varchar(12)                                                                           null,
    parent_asset_id      varchar(12)                                                                           null,
    asset_name           varchar(100)                                                                          not null,
    category             varchar(50)                                                                           null,
    model                varchar(100)                                                                          null,
    manufacturer         varchar(100)                                                                          null,
    serial_number        varchar(100)                                                                          null,
    description          text                                                                                  null,
    purchase_date        date                                                                                  null,
    warranty_expiry      date                                                                                  null,
    status               enum ('active', 'under_maintenance', 'retired', 'disposed') default 'active'          null,
    `condition`          enum ('good', 'needs_repair', 'damaged')                    default 'good'            null,
    qr_code_url          text                                                                                  null,
    documents            json                                                                                  null,
    image_urls           json                                                                                  null,
    parts_used           json                                                                                  null,
    total_downtime_hours decimal(10, 2)                                              default 0.00              null,
    maintenance_count    int                                                         default 0                 null,
    created_at           timestamp                                                   default CURRENT_TIMESTAMP null,
    updated_at           timestamp                                                   default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint Asset_ibfk_parent
        foreign key (parent_asset_id) references rentalley_db.Asset (asset_id)
            on delete set null,
    constraint Asset_ibfk_property
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade,
    constraint Asset_ibfk_unit
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete set null
);

create index idx_asset_parent_id
    on rentalley_db.Asset (parent_asset_id);

create index idx_asset_property_id
    on rentalley_db.Asset (property_id);

create index idx_asset_status
    on rentalley_db.Asset (status);

create index idx_asset_unit_id
    on rentalley_db.Asset (unit_id);

create table rentalley_db.ElectricMeterReading
(
    reading_id             int auto_increment
        primary key,
    unit_id                varchar(12)                          not null,
    period_start           date                                 not null,
    period_end             date                                 not null,
    reading_date           date                                 not null,
    previous_reading       decimal(10, 2)                       not null,
    current_reading        decimal(10, 2)                       not null,
    consumption            decimal(10, 2) as ((`current_reading` - `previous_reading`)) stored,
    concessionaire_bill_id int                                  null,
    is_locked              tinyint(1) default 0                 null,
    created_at             timestamp  default CURRENT_TIMESTAMP null,
    updated_at             timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint ElectricMeterReading_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade,
    constraint ElectricMeterReading_ibfk_2
        foreign key (concessionaire_bill_id) references rentalley_db.ConcessionaireBilling (bill_id)
            on delete set null
);

create index concessionaire_bill_id
    on rentalley_db.ElectricMeterReading (concessionaire_bill_id);

create index unit_id
    on rentalley_db.ElectricMeterReading (unit_id);

create table rentalley_db.MeterReading
(
    reading_id       int auto_increment
        primary key,
    unit_id          varchar(12)                         not null,
    utility_type     enum ('water', 'electricity')       not null,
    reading_date     date                                not null,
    previous_reading decimal(10, 2)                      not null,
    current_reading  decimal(10, 2)                      not null,
    created_at       timestamp default CURRENT_TIMESTAMP null,
    updated_at       timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint MeterReading_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
);

create index unit_id
    on rentalley_db.MeterReading (unit_id);

create index idx_unit_property_created
    on rentalley_db.Unit (property_id asc, created_at desc);

create index idx_unit_property_publish_status
    on rentalley_db.Unit (property_id, publish, status);

create index idx_unit_property_publish_status_rent
    on rentalley_db.Unit (property_id, publish, status, rent_amount);

create index property_id_idx
    on rentalley_db.Unit (property_id);

create table rentalley_db.Unit360
(
    id           int auto_increment
        primary key,
    unit_id      varchar(12)                         not null,
    photo360_url text                                not null,
    created_at   timestamp default CURRENT_TIMESTAMP null,
    updated_at   timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint Unit360_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
);

create table rentalley_db.UnitPhoto
(
    id         int auto_increment
        primary key,
    unit_id    varchar(12)                         null,
    photo_url  text                                null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    updated_at timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint UnitPhoto_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
);

create table rentalley_db.User
(
    user_id        char(36)                                                                          not null
        primary key,
    firstName      varchar(200)                                                                      null,
    lastName       varchar(150)                                                                      not null,
    companyName    varchar(190)                                                                      null,
    email          varchar(255)                                                                      not null,
    emailHashed    char(64)                                                                          not null,
    password       varchar(255)                                                                      not null,
    birthDate      varchar(150)                                                                      null,
    phoneNumber    varchar(150)                                                                      null,
    civil_status   varchar(50)                                                                       null,
    userType       enum ('tenant', 'landlord')                                                       null,
    is_2fa_enabled tinyint(1)                                              default 0                 null,
    emailVerified  tinyint(1)                                              default 0                 null,
    createdAt      timestamp                                               default CURRENT_TIMESTAMP not null,
    updatedAt      timestamp                                               default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    google_id      varchar(100)                                                                      not null,
    profilePicture text                                                                              null,
    status         enum ('active', 'suspended', 'deactivated', 'archived') default 'active'          null,
    points         int                                                     default 0                 null,
    fcm_token      varchar(255)                                                                      null,
    address        text                                                                              null,
    citizenship    varchar(200)                                                                      null,
    occupation     varchar(70)                                                                       null,
    timezone       varchar(100)                                            default 'UTC'             null,
    nameHashed     varchar(80)                                                                       null comment 'SHA256 hash of full lowercase name for exact search',
    nameTokens     json                                                                              null comment 'Array of hashed lowercase name tokens for partial search',
    last_login_at  timestamp                                                                         null comment 'Tracks the most recent successful user login',
    constraint email
        unique (email),
    constraint emailHashed
        unique (emailHashed)
);

create table rentalley_db.ActivityLog
(
    log_id        int auto_increment
        primary key,
    user_id       char(36)                                       null,
    admin_id      varchar(20)                                    null,
    action        varchar(130)                                   not null,
    description   text                                           null comment 'Human-readable summary of what happened',
    target_table  varchar(100)                                   null comment 'Name of affected table',
    target_id     varchar(100)                                   null comment 'Primary key or unique ID of affected record',
    old_value     json                                           null comment 'Data before change',
    new_value     json                                           null comment 'Data after change',
    endpoint      varchar(255)                                   null comment 'API endpoint or page URL accessed',
    http_method   enum ('GET', 'POST', 'PUT', 'DELETE', 'PATCH') null comment 'HTTP verb used',
    status_code   smallint                                       null comment 'Response status code (e.g., 200, 401, 500)',
    ip_address    varchar(45)                                    null comment 'IPv4/IPv6 address of client',
    user_agent    text                                           null comment 'Browser or device user agent string',
    device_type   enum ('web', 'mobile', 'tablet', 'api')        null comment 'Platform of user activity',
    location      varchar(255)                                   null comment 'Geo-IP derived location (city, country)',
    session_id    char(36)                                       null comment 'Session or JWT ID if available',
    is_suspicious tinyint(1) default 0                           null comment 'Flag for anomaly detection or suspicious behavior',
    timestamp     datetime   default CURRENT_TIMESTAMP           not null comment 'Exact time of the event',
    constraint fk_activitylog_admin_id
        foreign key (admin_id) references rentalley_db.Admin (admin_id)
            on update cascade on delete cascade,
    constraint fk_activitylog_user_id
        foreign key (user_id) references rentalley_db.User (user_id)
            on update cascade on delete cascade
);

create index idx_activity_action
    on rentalley_db.ActivityLog (action);

create index idx_activity_admin
    on rentalley_db.ActivityLog (admin_id);

create index idx_activity_timestamp
    on rentalley_db.ActivityLog (timestamp);

create index idx_activity_user
    on rentalley_db.ActivityLog (user_id);

create table rentalley_db.BugReport
(
    report_id     int auto_increment
        primary key,
    user_id       char(36)                                                                     not null,
    subject       varchar(150)                                                                 null,
    description   text                                                                         not null,
    status        enum ('open', 'in progress', 'resolved', 'closed') default 'open'            not null,
    admin_message text                                                                         null,
    updated_by    varchar(20)                                                                  null,
    created_at    timestamp                                          default CURRENT_TIMESTAMP not null,
    updated_at    timestamp                                          default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint BugReport_Admin_fk
        foreign key (updated_by) references rentalley_db.Admin (admin_id)
            on update cascade on delete set null,
    constraint BugReport_User_fk
        foreign key (user_id) references rentalley_db.User (user_id)
            on update cascade on delete cascade
);

create table rentalley_db.FCM_Token
(
    id        char(36)                             not null
        primary key,
    user_id   char(36)                             not null,
    token     varchar(255)                         not null,
    platform  enum ('web', 'android', 'ios')       not null,
    createdAt timestamp  default CURRENT_TIMESTAMP not null,
    updatedAt timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    active    tinyint(1) default 1                 null,
    constraint unique_token
        unique (token),
    constraint FCM_Token_ibfk_1
        foreign key (user_id) references rentalley_db.User (user_id)
            on delete cascade
);

create index user_id
    on rentalley_db.FCM_Token (user_id);

create table rentalley_db.Landlord
(
    landlord_id       varchar(20)                          not null
        primary key,
    user_id           char(36)                             not null,
    createdAt         timestamp  default CURRENT_TIMESTAMP not null,
    updatedAt         timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    is_trial_used     tinyint(1) default 0                 null,
    trial_used_at     datetime                             null,
    citizenship       varchar(200)                         null,
    is_verified       tinyint    default 0                 null,
    setup_completed   tinyint(1) default 0                 null,
    xendit_account_id varchar(100)                         null,
    constraint uniq_xendit_account_id
        unique (xendit_account_id),
    constraint userID
        unique (user_id),
    constraint fk_user_landlord
        foreign key (user_id) references rentalley_db.User (user_id)
            on update cascade on delete cascade
);

create table rentalley_db.Announcement
(
    announcement_id int auto_increment
        primary key,
    property_id     varchar(12)                         null,
    landlord_id     varchar(20)                         null,
    subject         text                                null,
    description     text                                null,
    created_at      timestamp default CURRENT_TIMESTAMP null,
    updated_at      timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint Announcement_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade,
    constraint fk_announcement_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade
);

create index Announcement_ibfk_2
    on rentalley_db.Announcement (landlord_id);

create table rentalley_db.AnnouncementPhoto
(
    photo_id        int auto_increment
        primary key,
    announcement_id int                                 not null,
    photo_url       text                                not null,
    created_at      timestamp default CURRENT_TIMESTAMP null,
    constraint announcement_fk
        foreign key (announcement_id) references rentalley_db.Announcement (announcement_id)
            on delete cascade
);

create table rentalley_db.ApiKey
(
    api_key_id      char(36)              default (uuid())          not null
        primary key,
    user_id         char(36)                                        not null,
    landlord_id     varchar(20)                                     null,
    api_key         varchar(80)                                     not null,
    secret_key_hash varchar(255)                                    not null,
    name            varchar(100)                                    null,
    environment     enum ('test', 'live') default 'live'            null,
    is_active       tinyint(1)            default 1                 null,
    last_used_at    datetime                                        null,
    created_at      timestamp             default CURRENT_TIMESTAMP null,
    updated_at      timestamp             default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    revoked_at      datetime                                        null,
    constraint uniq_api_key
        unique (api_key),
    constraint fk_apikey_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade,
    constraint fk_apikey_user
        foreign key (user_id) references rentalley_db.User (user_id)
            on update cascade on delete cascade
);

create index idx_apikey_active
    on rentalley_db.ApiKey (is_active);

create index idx_apikey_env
    on rentalley_db.ApiKey (environment);

create index idx_apikey_landlord
    on rentalley_db.ApiKey (landlord_id);

create index idx_apikey_user
    on rentalley_db.ApiKey (user_id);

create table rentalley_db.ApiKeyUsage
(
    usage_id       bigint auto_increment
        primary key,
    api_key_id     char(36)                            not null,
    request_count  int       default 0                 null,
    error_count    int       default 0                 null,
    avg_latency_ms int       default 0                 null,
    usage_date     date                                not null,
    created_at     timestamp default CURRENT_TIMESTAMP null,
    constraint fk_usage_apikey
        foreign key (api_key_id) references rentalley_db.ApiKey (api_key_id)
            on update cascade on delete cascade
);

create index idx_usage_apikey
    on rentalley_db.ApiKeyUsage (api_key_id);

create index idx_usage_date
    on rentalley_db.ApiKeyUsage (usage_date);

create table rentalley_db.ApiRequestLog
(
    log_id      bigint auto_increment
        primary key,
    api_key_id  char(36)                            not null,
    endpoint    varchar(255)                        not null,
    method      varchar(10)                         not null,
    status_code int                                 null,
    latency_ms  int                                 null,
    ip_address  varchar(45)                         null,
    user_agent  text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP null,
    constraint fk_log_apikey
        foreign key (api_key_id) references rentalley_db.ApiKey (api_key_id)
            on update cascade on delete cascade
);

create index idx_log_apikey
    on rentalley_db.ApiRequestLog (api_key_id);

create index idx_log_created
    on rentalley_db.ApiRequestLog (created_at);

create table rentalley_db.BetaUsers
(
    beta_id                bigint auto_increment
        primary key,
    landlord_id            varchar(20)                                                        not null,
    full_name              varchar(255)                                                       not null,
    email                  varchar(255)                                                       not null,
    properties_count       int                                                                not null,
    avg_units_per_property int                                                                not null,
    region                 varchar(100)                                                       not null,
    province               varchar(100)                                                       not null,
    city                   varchar(100)                                                       not null,
    status                 enum ('pending', 'approved', 'rejected') default 'pending'         not null,
    is_activated           tinyint(1)                               default 0                 not null comment '1 if landlord has manually activated beta access, 0 otherwise',
    approved_by            varchar(20)                                                        null,
    approved_at            datetime                                                           null,
    rejection_reason       text                                                               null,
    applied_at             timestamp                                default CURRENT_TIMESTAMP null,
    updated_at             timestamp                                default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint uq_beta_landlord
        unique (landlord_id),
    constraint fk_beta_admin
        foreign key (approved_by) references rentalley_db.Admin (admin_id)
            on delete set null,
    constraint fk_beta_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade
);

create index idx_landlord_user_id
    on rentalley_db.Landlord (user_id);

create table rentalley_db.LandlordPayoutAccount
(
    payout_id      int auto_increment
        primary key,
    landlord_id    varchar(20)                          not null,
    channel_code   varchar(20)                          not null,
    account_name   varchar(150)                         not null,
    account_number varchar(100)                         not null,
    bank_name      varchar(120)                         null,
    is_active      tinyint(1) default 1                 null,
    created_at     timestamp  default CURRENT_TIMESTAMP null,
    updated_at     timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint fk_landlord_payout
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade
);

create index idx_landlord_id
    on rentalley_db.LandlordPayoutAccount (landlord_id);

create table rentalley_db.LandlordPlatformAgreement
(
    id                char(36)   default (uuid())          not null
        primary key,
    landlord_id       varchar(20)                          not null,
    agreement_version varchar(50)                          not null,
    agreement_hash    char(64)                             not null comment 'SHA256 of agreement text at time of signing',
    ip_address        varchar(45)                          not null comment 'Supports IPv4 & IPv6',
    user_agent        text                                 null,
    country           varchar(100)                         null,
    region            varchar(100)                         null,
    city              varchar(100)                         null,
    timezone          varchar(100)                         null,
    accepted_at       datetime   default CURRENT_TIMESTAMP not null,
    revoked_at        datetime                             null,
    is_active         tinyint(1) default 1                 null,
    constraint fk_landlord_agreement
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade
);

create index idx_active
    on rentalley_db.LandlordPlatformAgreement (is_active);

create index idx_landlord
    on rentalley_db.LandlordPlatformAgreement (landlord_id);

create index idx_version
    on rentalley_db.LandlordPlatformAgreement (agreement_version);

create table rentalley_db.LandlordTaxProfile
(
    tax_profile_id      char(36)                              default (uuid())          not null
        primary key,
    landlord_id         varchar(20)                                                     not null,
    tin_number          varchar(15)                                                     not null,
    registered_name     varchar(255)                                                    null,
    bir_branch_code     varchar(20)                                                     null,
    tax_type            enum ('vat', 'non-vat', 'percentage') default 'percentage'      null,
    filing_type         enum ('monthly', 'quarterly')         default 'monthly'         null,
    bir_certificate_url text                                                            null,
    last_filing_date    date                                                            null,
    created_at          timestamp                             default CURRENT_TIMESTAMP null,
    updated_at          timestamp                             default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint LandlordTaxProfile_ibfk_1
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade
);

create index landlord_id
    on rentalley_db.LandlordTaxProfile (landlord_id);

create table rentalley_db.LandlordVerification
(
    id            char(36)                                                 default (uuid())          not null
        primary key,
    landlord_id   varchar(20)                                                                        not null,
    document_type varchar(50)                                                                        not null,
    document_url  text                                                                               not null,
    selfie_url    text                                                                               not null,
    status        enum ('pending', 'approved', 'rejected', 'not verified') default 'not verified'    null,
    message       text                                                                               null,
    reviewed_by   varchar(20)                                                                        null,
    review_date   datetime                                                                           null,
    created_at    timestamp                                                default CURRENT_TIMESTAMP null,
    updated_at    timestamp                                                default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint LandlordVerification_ibfk_1
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade
);

create index idx_landlord_id
    on rentalley_db.LandlordVerification (landlord_id);

create table rentalley_db.LandlordWallet
(
    wallet_id         char(36)                                 not null
        primary key,
    landlord_id       varchar(20)                              not null,
    available_balance decimal(14, 2) default 0.00              not null,
    created_at        timestamp      default CURRENT_TIMESTAMP null,
    updated_at        timestamp      default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint landlord_id
        unique (landlord_id),
    constraint fk_wallet_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade
);

create table rentalley_db.LandlordWalletLedger
(
    ledger_id       bigint auto_increment
        primary key,
    wallet_id       char(36)                                     not null,
    type            enum ('credit', 'debit')                     not null,
    amount          decimal(14, 2)                               not null,
    balance_before  decimal(14, 2)                               not null,
    balance_after   decimal(14, 2)                               not null,
    reference_type  enum ('payment', 'withdrawal', 'adjustment') not null,
    reference_id    varchar(50)                                  not null,
    idempotency_key varchar(100)                                 not null,
    created_at      timestamp default CURRENT_TIMESTAMP          null,
    constraint idempotency_key
        unique (idempotency_key),
    constraint fk_ledger_wallet
        foreign key (wallet_id) references rentalley_db.LandlordWallet (wallet_id)
            on delete cascade
);

create index idx_created_at
    on rentalley_db.LandlordWalletLedger (created_at);

create index idx_reference
    on rentalley_db.LandlordWalletLedger (reference_type, reference_id);

create index idx_wallet
    on rentalley_db.LandlordWalletLedger (wallet_id);

create table rentalley_db.Message
(
    message_id        int auto_increment
        primary key,
    sender_id         char(36)                            not null,
    receiver_id       char(36)                            not null,
    encrypted_message text                                not null,
    iv                varchar(255)                        not null,
    chat_room         varchar(255)                        not null,
    timestamp         timestamp default CURRENT_TIMESTAMP not null,
    constraint Message_receiver_fk
        foreign key (receiver_id) references rentalley_db.User (user_id)
            on delete cascade,
    constraint Message_sender_fk
        foreign key (receiver_id) references rentalley_db.User (user_id)
            on delete cascade
);

create index chat_room_index
    on rentalley_db.Message (chat_room);

create index receiverID_index
    on rentalley_db.Message (receiver_id);

create index senderID_index
    on rentalley_db.Message (sender_id);

create table rentalley_db.Notification
(
    id         int auto_increment
        primary key,
    user_id    char(36)                             null,
    title      varchar(130)                         null,
    body       text                                 not null,
    url        text                                 null,
    is_read    tinyint(1) default 0                 null,
    created_at timestamp  default CURRENT_TIMESTAMP null,
    constraint Notification_ibfk_1
        foreign key (user_id) references rentalley_db.User (user_id)
            on delete cascade
);

create index user_id
    on rentalley_db.Notification (user_id);

create table rentalley_db.PayoutOTP
(
    otp_id       int auto_increment
        primary key,
    landlord_id  varchar(20)                                not null,
    payout_id    int                                        not null,
    otp_hash     varchar(255)                               not null,
    attempts     tinyint unsigned default '0'               null,
    max_attempts tinyint unsigned default '5'               null,
    expires_at   datetime                                   not null,
    verified_at  datetime                                   null,
    created_at   timestamp        default CURRENT_TIMESTAMP null,
    constraint fk_payoutotp_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade,
    constraint fk_payoutotp_payout
        foreign key (payout_id) references rentalley_db.LandlordPayoutAccount (payout_id)
            on delete cascade
);

create table rentalley_db.PropertyDocument
(
    document_id bigint auto_increment
        primary key,
    property_id varchar(12)                                           not null,
    landlord_id varchar(20)                                           not null,
    folder_id   bigint                                                null,
    file_name   varchar(255)                                          not null,
    file_type   varchar(100)                                          not null,
    file_size   bigint                                                not null comment 'File size in BYTES',
    file_url    text                                                  not null,
    visibility  enum ('private', 'tenant')  default 'private'         null,
    uploaded_by enum ('landlord', 'tenant') default 'landlord'        null,
    created_at  timestamp                   default CURRENT_TIMESTAMP null,
    updated_at  timestamp                   default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint fk_doc_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade,
    constraint fk_doc_property
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create index idx_doc_landlord
    on rentalley_db.PropertyDocument (landlord_id);

create index idx_doc_property
    on rentalley_db.PropertyDocument (property_id);

create index idx_doc_property_created
    on rentalley_db.PropertyDocument (property_id asc, created_at desc);

create table rentalley_db.Subscription
(
    subscription_id          int auto_increment
        primary key,
    landlord_id              varchar(20)                                                                         not null,
    plan_name                varchar(50)                                                                         not null,
    plan_code                enum ('FREE', 'STANDARD', 'PRO', 'ENTERPRISE', 'BETA')                              null,
    start_date               date                                                                                not null,
    end_date                 date                                                                                null,
    payment_status           enum ('paid', 'unpaid', 'pending', 'failed', 'cancelled') default 'unpaid'          not null,
    created_at               timestamp                                                 default CURRENT_TIMESTAMP null,
    updated_at               timestamp                                                 default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    request_reference_number varchar(50)                                                                         not null,
    is_trial                 tinyint(1)                                                default 0                 not null,
    amount_paid              decimal(10, 2)                                            default 0.00              not null,
    is_active                tinyint(1)                                                default 0                 null,
    constraint Subscription_ibfk_1
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade
);

create index idx_subscription_active
    on rentalley_db.Subscription (landlord_id, is_active);

create index idx_subscription_landlord_id
    on rentalley_db.Subscription (landlord_id);

create index idx_subscription_trial
    on rentalley_db.Subscription (landlord_id, is_trial);

create table rentalley_db.Tenant
(
    tenant_id          varchar(20)                         not null
        primary key,
    user_id            char(36)                            not null,
    createdAt          timestamp default CURRENT_TIMESTAMP not null,
    updatedAt          timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    employment_type    varchar(50)                         not null,
    monthly_income     varchar(50)                         not null,
    xendit_customer_id varchar(100)                        null,
    constraint userID
        unique (user_id),
    constraint fk_user_tenant
        foreign key (user_id) references rentalley_db.User (user_id)
            on update cascade on delete cascade
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

create index tenant_id
    on rentalley_db.LeaseAgreement (tenant_id);

create index unit_id
    on rentalley_db.LeaseAgreement (unit_id);

create table rentalley_db.LeaseEKyp
(
    ekyp_id      varchar(36)                                                   not null comment 'Public eKYP identifier (UUID or nanoid)'
        primary key,
    agreement_id varchar(20)                                                   not null,
    tenant_id    varchar(20)                                                   not null,
    unit_id      varchar(12)                                                   not null,
    landlord_id  varchar(20)                                                   not null,
    qr_payload   json                                                          not null comment 'Canonical QR payload snapshot',
    qr_hash      char(64)                                                      not null comment 'SHA-256 hash of signed payload',
    status       enum ('draft', 'active', 'revoked') default 'draft'           not null,
    issued_at    datetime                                                      null comment 'Timestamp when eKYP was activated',
    revoked_at   datetime                                                      null comment 'Timestamp when eKYP was revoked',
    created_at   timestamp                           default CURRENT_TIMESTAMP not null,
    updated_at   timestamp                           default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint uq_ekyp_agreement
        unique (agreement_id),
    constraint fk_ekyp_agreement
        foreign key (agreement_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade,
    constraint fk_ekyp_tenant
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on delete cascade,
    constraint fk_ekyp_unit
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
);

create index idx_ekyp_hash
    on rentalley_db.LeaseEKyp (qr_hash);

create index idx_ekyp_landlord_status
    on rentalley_db.LeaseEKyp (landlord_id, status);

create index idx_ekyp_status
    on rentalley_db.LeaseEKyp (status);

create index idx_ekyp_tenant
    on rentalley_db.LeaseEKyp (tenant_id);

create index idx_ekyp_unit
    on rentalley_db.LeaseEKyp (unit_id);

create table rentalley_db.LeaseSetupRequirements
(
    id                      int auto_increment
        primary key,
    agreement_id            varchar(20)                          not null,
    lease_agreement         tinyint(1) default 1                 null,
    move_in_checklist       tinyint(1) default 0                 null,
    move_out_checklist      tinyint(1) default 0                 null comment 'Required at end of lease',
    security_deposit        tinyint(1) default 0                 null,
    security_deposit_months int        default 1                 null,
    advance_payment         tinyint(1) default 0                 null,
    advance_payment_months  int        default 1                 null,
    other_essential         tinyint(1) default 0                 null,
    created_at              timestamp  default CURRENT_TIMESTAMP null,
    updated_at              timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint LeaseSetupRequirements_ibfk_1
        foreign key (agreement_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade
);

create table rentalley_db.LeaseSignature
(
    id                  int auto_increment
        primary key,
    agreement_id        varchar(20)                                              not null,
    email               varchar(255)                                             null,
    role                enum ('landlord', 'tenant')                              not null,
    status              enum ('pending', 'signed', 'declined') default 'pending' null,
    otp_code            varchar(10)                                              null,
    otp_expires_at      datetime                                                 null,
    otp_sent_at         datetime                                                 null,
    signed_at           datetime                                                 null,
    verified_ip         varchar(45)                                              null,
    verified_user_agent varchar(255)                                             null,
    constraint LeaseSignature_ibfk_1
        foreign key (agreement_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade
);

create table rentalley_db.MaintenanceRequest
(
    request_id      varchar(20)                                              not null
        primary key,
    tenant_id       varchar(20)                                              null,
    unit_id         varchar(12)                                              null,
    asset_id        varchar(20)                                              null,
    subject         varchar(50)                                              null,
    description     varchar(100)                                             null,
    status          varchar(20)                    default 'pending'         not null,
    category        varchar(100)                                             null,
    priority_level  enum ('LOW', 'MEDIUM', 'HIGH') default 'LOW'             null,
    schedule_date   datetime                                                 null,
    completion_date datetime                                                 null,
    created_at      timestamp                      default CURRENT_TIMESTAMP null,
    updated_at      timestamp                      default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    property_id     varchar(12)                                              not null,
    constraint MaintenanceRequest_ibfk_3
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade,
    constraint MaintenanceRequest_ibfk_4
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on update cascade on delete set null,
    constraint MaintenanceRequest_ibfk_5
        foreign key (asset_id) references rentalley_db.Asset (asset_id)
            on update cascade on delete set null
);

create table rentalley_db.MaintenancePhoto
(
    id         int auto_increment
        primary key,
    request_id varchar(20)                         null,
    photo_url  text                                null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    updated_at timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint MaintenancePhoto_ibfk_1
        foreign key (request_id) references rentalley_db.MaintenanceRequest (request_id)
            on update cascade on delete cascade
);

create index unit_id
    on rentalley_db.MaintenanceRequest (unit_id);

create table rentalley_db.MoveInChecklist
(
    checklist_id int auto_increment
        primary key,
    agreement_id varchar(20)                                             not null,
    status       enum ('pending', 'completed') default 'pending'         null,
    submitted_at timestamp                                               null,
    notes        text                                                    null,
    created_at   timestamp                     default CURRENT_TIMESTAMP null,
    updated_at   timestamp                     default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint MoveInChecklist_ibfk_1
        foreign key (agreement_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade
);

create index agreement_id
    on rentalley_db.MoveInChecklist (agreement_id);

create table rentalley_db.MoveInItems
(
    item_id      int auto_increment
        primary key,
    checklist_id int                                                                                               not null,
    item_name    varchar(255)                                                                                      not null,
    `condition`  enum ('good', 'damaged', 'needs_repair', 'scratched', 'needs_cleaning') default 'good'            null,
    notes        text                                                                                              null,
    created_at   timestamp                                                               default CURRENT_TIMESTAMP null,
    updated_at   timestamp                                                               default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint MoveInItems_ibfk_1
        foreign key (checklist_id) references rentalley_db.MoveInChecklist (checklist_id)
            on delete cascade
);

create index checklist_id
    on rentalley_db.MoveInItems (checklist_id);

create table rentalley_db.MoveInPhotos
(
    photo_id    int auto_increment
        primary key,
    item_id     int                                 not null,
    file_url    varchar(255)                        not null,
    description varchar(255)                        null,
    uploaded_at timestamp default CURRENT_TIMESTAMP null,
    constraint MoveInPhotos_ibfk_1
        foreign key (item_id) references rentalley_db.MoveInItems (item_id)
            on delete cascade
);

create index item_id
    on rentalley_db.MoveInPhotos (item_id);

create table rentalley_db.PostDatedCheck
(
    pdc_id             int auto_increment
        primary key,
    lease_id           varchar(20)                                                                  not null,
    check_number       varchar(64)                                                                  not null,
    bank_name          varchar(100)                                                                 null,
    amount             decimal(12, 2)                                                               not null,
    due_date           date                                                                         not null,
    status             enum ('pending', 'cleared', 'bounced', 'replaced') default 'pending'         not null,
    uploaded_image_url varchar(512)                                                                 null,
    notes              varchar(500)                                                                 null,
    received_at        timestamp                                          default CURRENT_TIMESTAMP null,
    cleared_at         timestamp                                                                    null,
    bounced_at         timestamp                                                                    null,
    replaced_by_pdc_id int                                                                          null,
    created_at         timestamp                                          default CURRENT_TIMESTAMP not null,
    updated_at         timestamp                                          default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint uniq_lease_check_number
        unique (lease_id, check_number),
    constraint fk_pdc_lease
        foreign key (lease_id) references rentalley_db.LeaseAgreement (agreement_id)
            on update cascade on delete cascade,
    constraint fk_pdc_replaced_by
        foreign key (replaced_by_pdc_id) references rentalley_db.PostDatedCheck (pdc_id)
            on update cascade on delete set null
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

create table rentalley_db.AdvancePayment
(
    advance_id            int auto_increment
        primary key,
    lease_id              varchar(20)                                                                                not null,
    tenant_id             varchar(20)                                                                                not null,
    amount                decimal(12, 2)                                                                             not null,
    months_covered        int                                                              default 1                 null,
    status                enum ('unpaid', 'partially_paid', 'paid', 'applied', 'refunded') default 'unpaid'          null,
    received_at           timestamp                                                                                  null,
    proof_of_payment      text                                                                                       null,
    applied_to_billing_id varchar(20)                                                                                null,
    notes                 text                                                                                       null,
    created_at            timestamp                                                        default CURRENT_TIMESTAMP null,
    updated_at            timestamp                                                        default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint fk_advance_billing
        foreign key (applied_to_billing_id) references rentalley_db.Billing (billing_id)
            on delete set null,
    constraint fk_advance_lease
        foreign key (lease_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade,
    constraint fk_advance_tenant
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on delete cascade
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

create table rentalley_db.Payment
(
    payment_id                      int auto_increment
        primary key,
    transaction_id                  char(36)                                                                                                                           null,
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

create index idx_pdc_due_date
    on rentalley_db.PostDatedCheck (due_date);

create index idx_pdc_lease
    on rentalley_db.PostDatedCheck (lease_id);

create index idx_pdc_status
    on rentalley_db.PostDatedCheck (status);

create table rentalley_db.PropertyVisit
(
    visit_id           int auto_increment
        primary key,
    tenant_id          varchar(20)                                                                        null,
    unit_id            varchar(12)                                                                        null,
    visit_date         date                                                                               null,
    visit_time         time                                                                               null,
    status             enum ('pending', 'approved', 'disapproved', 'cancelled') default 'pending'         null,
    disapproval_reason varchar(70)                                                                        null,
    created_at         timestamp                                                default CURRENT_TIMESTAMP null,
    updated_at         timestamp                                                default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint PropertyVisit_ibfk_1
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on update cascade on delete cascade,
    constraint PropertyVisit_ibfk_3
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
);

create index tenant_id
    on rentalley_db.PropertyVisit (tenant_id);

create index unit_id
    on rentalley_db.PropertyVisit (unit_id);

create table rentalley_db.ProspectiveTenant
(
    id              varchar(20)                                                           not null
        primary key,
    tenant_id       varchar(20)                                                           not null,
    unit_id         varchar(12)                                                           null,
    valid_id        text                                                                  not null,
    proof_of_income text                                                                  null,
    message         varchar(150)                                                          null,
    status          enum ('pending', 'approved', 'disapproved') default 'pending'         null,
    proceeded       enum ('yes', 'no')                                                    null,
    created_at      timestamp                                   default CURRENT_TIMESTAMP null,
    updated_at      timestamp                                   default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint ProspectiveTenant_ibfk_1
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on update cascade on delete cascade,
    constraint ProspectiveTenant_ibfk_3
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
);

create index tenant_id
    on rentalley_db.ProspectiveTenant (tenant_id);

create table rentalley_db.RenewalRequest
(
    id                    int auto_increment
        primary key,
    tenant_id             varchar(20)                                                                   not null,
    agreement_id          varchar(20)                                                                   not null,
    unit_id               varchar(12)                                                                   not null,
    requested_start_date  date                                                                          not null,
    requested_end_date    date                                                                          not null,
    requested_rent_amount decimal(10, 2)                                                                null comment 'Tenant-proposed rent amount, NULL if same as current',
    status                enum ('pending', 'approved', 'declined', 'expired') default 'pending'         null,
    notes                 text                                                                          null comment 'Additional comments from tenant or landlord',
    created_at            timestamp                                           default CURRENT_TIMESTAMP null,
    updated_at            timestamp                                           default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint RenewalRequest_ibfk_1
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on update cascade on delete cascade,
    constraint RenewalRequest_ibfk_2
        foreign key (agreement_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade,
    constraint RenewalRequest_ibfk_3
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade
)
    comment 'Stores tenant-initiated lease renewal requests';

create index idx_agreement_id
    on rentalley_db.RenewalRequest (agreement_id);

create index idx_tenant_id
    on rentalley_db.RenewalRequest (tenant_id);

create index idx_unit_id
    on rentalley_db.RenewalRequest (unit_id);

create table rentalley_db.Review
(
    id                     int auto_increment
        primary key,
    tenant_id              varchar(20)                         not null,
    unit_id                varchar(12)                         not null,
    rating_communication   int                                 null,
    rating_maintenance     int                                 null,
    rating_condition       int                                 null,
    rating_safety          int                                 null,
    rating_value           int                                 null,
    rating_professionalism int                                 null,
    rating_support         int                                 null,
    overall_rating         decimal(3, 2) as ((
        ((((((coalesce(`rating_communication`, 0) + coalesce(`rating_maintenance`, 0)) +
             coalesce(`rating_condition`, 0)) + coalesce(`rating_safety`, 0)) + coalesce(`rating_value`, 0)) +
          coalesce(`rating_professionalism`, 0)) + coalesce(`rating_support`, 0)) / 7)) stored,
    review_text            varchar(500)                        null,
    created_at             timestamp default CURRENT_TIMESTAMP null,
    updated_at             timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint Review_ibfk_1
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on update cascade on delete cascade,
    constraint Review_ibfk_2
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade,
    check (`rating_communication` between 1 and 5),
    check (`rating_maintenance` between 1 and 5),
    check (`rating_condition` between 1 and 5),
    check (`rating_safety` between 1 and 5),
    check (`rating_value` between 1 and 5),
    check (`rating_professionalism` between 1 and 5),
    check (`rating_support` between 1 and 5)
);

create table rentalley_db.Feedback
(
    id            int auto_increment
        primary key,
    landlord_id   varchar(20)                         not null,
    review_id     int                                 not null,
    feedback_text varchar(170)                        null,
    created_at    timestamp default CURRENT_TIMESTAMP null,
    updated_at    timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint Feedback_ibfk_1
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade,
    constraint Feedback_ibfk_2
        foreign key (review_id) references rentalley_db.Review (id)
            on delete cascade
);

create index landlord_id
    on rentalley_db.Feedback (landlord_id);

create index review_id
    on rentalley_db.Feedback (review_id);

create index tenant_id
    on rentalley_db.Review (tenant_id);

create index unit_id
    on rentalley_db.Review (unit_id);

create table rentalley_db.SecurityDeposit
(
    deposit_id       int auto_increment
        primary key,
    lease_id         varchar(20)                                                                                  not null,
    tenant_id        varchar(20)                                                                                  not null,
    amount           decimal(12, 2)                                                                               not null,
    status           enum ('unpaid', 'partially_paid', 'paid', 'refunded', 'forfeited') default 'unpaid'          null,
    received_at      timestamp                                                                                    null,
    refunded_at      timestamp                                                                                    null,
    proof_of_payment text                                                                                         null,
    refund_reason    text                                                                                         null,
    notes            text                                                                                         null,
    created_at       timestamp                                                          default CURRENT_TIMESTAMP null,
    updated_at       timestamp                                                          default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint fk_security_lease
        foreign key (lease_id) references rentalley_db.LeaseAgreement (agreement_id)
            on delete cascade,
    constraint fk_security_tenant
        foreign key (tenant_id) references rentalley_db.Tenant (tenant_id)
            on delete cascade
);

create table rentalley_db.DepositTransactionLog
(
    log_id       bigint auto_increment
        primary key,
    deposit_id   int                                                                                not null,
    action       enum ('created', 'payment_received', 'partial_refund', 'full_refund', 'forfeited') not null,
    amount       decimal(12, 2)                                                                     not null,
    performed_by varchar(36)                                                                        null,
    description  text                                                                               null,
    created_at   timestamp default CURRENT_TIMESTAMP                                                null,
    constraint fk_log_deposit
        foreign key (deposit_id) references rentalley_db.SecurityDeposit (deposit_id)
            on delete cascade
);

create index idx_tenant_user_id
    on rentalley_db.Tenant (user_id);

create index idx_user_google_id
    on rentalley_db.User (google_id);

create index idx_user_nameHashed
    on rentalley_db.User (nameHashed);

create index idx_user_status
    on rentalley_db.User (status);

create index idx_user_type
    on rentalley_db.User (userType);

create table rentalley_db.UserSessions
(
    id         bigint auto_increment
        primary key,
    user_id    char(36)                             not null,
    session_id varchar(255)                         not null,
    ip_address varchar(45)                          null,
    user_agent text                                 null,
    expires_at datetime                             not null,
    is_valid   tinyint(1) default 1                 null,
    created_at timestamp  default CURRENT_TIMESTAMP null,
    constraint session_id
        unique (session_id)
);

create index idx_expires
    on rentalley_db.UserSessions (expires_at);

create index idx_user_session
    on rentalley_db.UserSessions (user_id, session_id);

create index idx_user_valid
    on rentalley_db.UserSessions (user_id, is_valid);

create table rentalley_db.UserToken
(
    auth_id    int auto_increment
        primary key,
    user_id    char(36)                                             not null,
    token_type enum ('email_verification', 'password_reset', '2fa') not null,
    token      varchar(10)                                          not null,
    expires_at datetime                                             not null,
    created_at datetime default CURRENT_TIMESTAMP                   not null,
    used_at    datetime                                             null,
    constraint UserToken_ibfk_1
        foreign key (user_id) references rentalley_db.User (user_id)
            on delete cascade
);

create index user_id
    on rentalley_db.UserToken (user_id);

create table rentalley_db.WalletTransactionLock
(
    lock_id        bigint auto_increment
        primary key,
    wallet_id      char(36)                                              not null,
    operation_type enum ('withdrawal', 'credit')                         not null,
    status         enum ('locked', 'released') default 'locked'          null,
    created_at     timestamp                   default CURRENT_TIMESTAMP null,
    constraint fk_lock_wallet
        foreign key (wallet_id) references rentalley_db.LandlordWallet (wallet_id)
            on delete cascade
);

create index idx_wallet
    on rentalley_db.WalletTransactionLock (wallet_id);

create table rentalley_db.WaterMeterReading
(
    reading_id             int auto_increment
        primary key,
    unit_id                varchar(12)                          not null,
    period_start           date                                 not null,
    period_end             date                                 not null,
    reading_date           date                                 not null,
    previous_reading       decimal(10, 2)                       not null,
    current_reading        decimal(10, 2)                       not null,
    consumption            decimal(10, 2) as ((`current_reading` - `previous_reading`)) stored,
    concessionaire_bill_id int                                  null,
    is_locked              tinyint(1) default 0                 null,
    created_at             timestamp  default CURRENT_TIMESTAMP null,
    updated_at             timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint WaterMeterReading_ibfk_1
        foreign key (unit_id) references rentalley_db.Unit (unit_id)
            on delete cascade,
    constraint WaterMeterReading_ibfk_2
        foreign key (concessionaire_bill_id) references rentalley_db.ConcessionaireBilling (bill_id)
            on delete set null
);

create index concessionaire_bill_id
    on rentalley_db.WaterMeterReading (concessionaire_bill_id);

create index unit_id
    on rentalley_db.WaterMeterReading (unit_id);

create table rentalley_db.WithdrawalRequest
(
    withdrawal_id   char(36)                                                                        not null
        primary key,
    wallet_id       char(36)                                                                        not null,
    landlord_id     varchar(20)                                                                     not null,
    amount          decimal(14, 2)                                                                  not null,
    status          enum ('pending', 'processing', 'completed', 'failed') default 'pending'         not null,
    gateway_ref     varchar(128)                                                                    null,
    idempotency_key varchar(100)                                                                    not null,
    ip_address      varchar(45)                                                                     not null,
    user_agent      text                                                                            null,
    device_type     enum ('web', 'mobile', 'api')                                                   null,
    location        varchar(255)                                                                    null,
    requested_by    varchar(20)                                                                     null,
    created_at      timestamp                                             default CURRENT_TIMESTAMP null,
    processed_at    timestamp                                                                       null,
    constraint idempotency_key
        unique (idempotency_key),
    constraint fk_withdrawal_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on delete cascade,
    constraint fk_withdrawal_wallet
        foreign key (wallet_id) references rentalley_db.LandlordWallet (wallet_id)
            on delete cascade
);

create index idx_created_at
    on rentalley_db.WithdrawalRequest (created_at);

create index idx_landlord
    on rentalley_db.WithdrawalRequest (landlord_id);

create index idx_status
    on rentalley_db.WithdrawalRequest (status);

create index idx_wallet
    on rentalley_db.WithdrawalRequest (wallet_id);

create table rentalley_db.payout_channels
(
    channel_code varchar(30)              not null
        primary key,
    channel_type enum ('BANK', 'EWALLET') not null,
    bank_name    varchar(255)             not null,
    is_available tinyint(1) default 1     not null
);

create table rentalley_db.user_push_subscriptions
(
    id         bigint auto_increment
        primary key,
    user_id    char(36)                            null,
    endpoint   varchar(500)                        not null,
    p256dh     varchar(200)                        not null,
    auth       varchar(200)                        not null,
    user_agent varchar(255)                        null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    updated_at timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    admin_id   char(36)                            null,
    constraint endpoint
        unique (endpoint),
    constraint fk_user_push_subscriptions_admin
        foreign key (admin_id) references rentalley_db.Admin (admin_id)
            on delete cascade,
    constraint fk_user_push_subscriptions_user
        foreign key (user_id) references rentalley_db.User (user_id)
            on delete cascade
);

create index idx_admin
    on rentalley_db.user_push_subscriptions (admin_id);

create index idx_user
    on rentalley_db.user_push_subscriptions (user_id);

