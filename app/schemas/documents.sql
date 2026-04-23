create table rentalley_db.Document
(
    document_id    varchar(36)                                                                                not null
        primary key,
    reference_type enum ('property', 'unit', 'lease', 'tenant', 'maintenance', 'expense', 'vendor', 'others') not null,
    reference_id   varchar(50)                                                                                not null,
    document_type  varchar(50)                                                                                not null,
    file_name      varchar(255)                                                                               not null,
    file_url       text                                                                                       not null,
    file_size      bigint                                                                                     null,
    file_mime_type varchar(100)                                                                               null,
    uploaded_by    char(36)                                                                                   null,
    description    text                                                                                       null,
    created_at     timestamp default CURRENT_TIMESTAMP                                                        null,
    updated_at     timestamp default CURRENT_TIMESTAMP                                                        null on update CURRENT_TIMESTAMP,
    folder_id      bigint                                                                                     null,
    landlord_id    varchar(20)                                                                                not null,
    constraint fk_document_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade
);

create index idx_landlord_id
    on rentalley_db.Document (landlord_id);

create index idx_reference
    on rentalley_db.Document (reference_type, reference_id);

create index idx_uploaded_by
    on rentalley_db.Document (uploaded_by);

create table rentalley_db.DocumentFolder
(
    folder_id      bigint auto_increment
        primary key,
    landlord_id  varchar(20)                                                                                not null,
    reference_type enum ('property', 'unit', 'lease', 'tenant', 'maintenance', 'expense', 'vendor', 'others') not null,
    reference_id   varchar(50)                                                                                not null,
    name           varchar(255)                                                                               not null,
    created_at     timestamp default CURRENT_TIMESTAMP                                                        null,
    updated_at     timestamp default CURRENT_TIMESTAMP                                                        null on update CURRENT_TIMESTAMP,
    constraint fk_folder_landlord
        foreign key (landlord_id) references rentalley_db.Landlord (landlord_id)
            on update cascade on delete cascade
);

create index idx_folder_landlord
    on rentalley_db.DocumentFolder (landlord_id);

create index idx_folder_reference
    on rentalley_db.DocumentFolder (reference_type, reference_id);

