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

/* ============================================================
   ALTER TABLE – migrate to Diddit-managed verification
   Removes manual upload fields, adds Diddit session tracking
============================================================ */

-- Add Diddit columns
ALTER TABLE rentalley_db.LandlordVerification
    ADD COLUMN didit_session_id VARCHAR(50) NULL AFTER landlord_id,
    ADD COLUMN didit_workflow_id VARCHAR(50) NULL AFTER didit_session_id;

-- Drop manual upload fields (no longer needed – Diddit handles identity data)
ALTER TABLE rentalley_db.LandlordVerification
    DROP COLUMN document_type,
    DROP COLUMN document_url,
    DROP COLUMN selfie_url,
    DROP COLUMN reviewed_by,
    DROP COLUMN review_date,
    DROP COLUMN message;

