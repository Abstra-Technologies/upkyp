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

create table rentalley_db.PropertyVerification
(
    verification_id int auto_increment
        primary key,
    property_id     varchar(12)                                                    not null,
    doc_type        enum ('business_permit', 'occupancy_permit', 'property_title') not null,
    submitted_doc   text                                                           not null,
    tin_number      varchar(10)                                                    null,
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

