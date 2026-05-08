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

