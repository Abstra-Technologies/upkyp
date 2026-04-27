create table rentalley_db.ElectricityConcessionaireBilling
(
    bill_id      int auto_increment
        primary key,
    property_id  varchar(12)                         not null,
    period_start date                                not null,
    period_end   date                                not null,
    consumption  decimal(10, 2)                      not null comment 'Electricity consumption in kWh',
    total_amount decimal(12, 2)                      not null comment 'Total amount in PHP',
    rate_per_kwh decimal(10, 4)                      not null comment 'Rate per kWh',
    created_at   timestamp default CURRENT_TIMESTAMP null,
    updated_at   timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint ElectricityConcessionaireBilling_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create index electricity_concessionaire_period
    on rentalley_db.ElectricityConcessionaireBilling (period_start, period_end);

create index electricity_concessionaire_property_id
    on rentalley_db.ElectricityConcessionaireBilling (property_id);

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

create table rentalley_db.WaterConcessionaireBilling
(
    bill_id        int auto_increment
        primary key,
    property_id    varchar(12)                         not null,
    period_start   date                                not null,
    period_end     date                                not null,
    consumption    decimal(10, 2)                      not null comment 'Water consumption in cubic meters (m³)',
    total_amount   decimal(12, 2)                      not null comment 'Total amount in PHP',
    rate_per_cubic decimal(10, 4)                      not null comment 'Rate per cubic meter',
    created_at     timestamp default CURRENT_TIMESTAMP null,
    updated_at     timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint WaterConcessionaireBilling_ibfk_1
        foreign key (property_id) references rentalley_db.Property (property_id)
            on delete cascade
);

create index water_concessionaire_period
    on rentalley_db.WaterConcessionaireBilling (period_start, period_end);

create index water_concessionaire_property_id
    on rentalley_db.WaterConcessionaireBilling (property_id);

