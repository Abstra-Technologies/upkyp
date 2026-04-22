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
    created_at     datetime    default CURRENT_TIMESTAMP null,
    property_id    varchar(12)                           null
);

