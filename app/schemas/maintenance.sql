create table rentalley_db.MaintenanceRequest
(
    request_id      varchar(20)                                              not null
        primary key,
    lease_id        varchar(20)                                              not null,
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

