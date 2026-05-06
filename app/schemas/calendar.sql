-- Calendar scheduled items table (tasks, events, reminders)
CREATE TABLE CalendarItem (
    item_id        INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id    VARCHAR(20)                                                        NOT NULL,
    property_id    VARCHAR(12)                                                        NULL,
    unit_id        VARCHAR(12)                                                        NULL,
    title          VARCHAR(255)                                                       NOT NULL,
    description    TEXT                                                               NULL,
    item_type      ENUM('task', 'event', 'reminder')                                  NOT NULL DEFAULT 'task',
    category       VARCHAR(50)                                                        NULL,
    item_date      DATE                                                               NOT NULL,
    item_time      TIME                                                               NULL,
    end_date       DATE                                                               NULL,
    end_time       TIME                                                               NULL,
    all_day        TINYINT(1) DEFAULT 0                                               NULL,
    status         ENUM('pending', 'in_progress', 'completed', 'cancelled', 'dismissed') NOT NULL DEFAULT 'pending',
    priority       ENUM('low', 'medium', 'high')                                      NOT NULL DEFAULT 'medium',
    reminder       ENUM('none', '5min', '15min', '30min', '1hour', '1day', '1week')   NOT NULL DEFAULT 'none',
    repeat_rule    ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly')   NOT NULL DEFAULT 'none',
    location       VARCHAR(255)                                                       NULL,
    meeting_link   VARCHAR(500)                                                       NULL,
    color          VARCHAR(7)                                                         NULL COMMENT 'Hex color for calendar display',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP                                NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT CalendarItem_ibfk_landlord
        FOREIGN KEY (landlord_id) REFERENCES Landlord (landlord_id)
            ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CalendarItem_ibfk_property
        FOREIGN KEY (property_id) REFERENCES Property (property_id)
            ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT CalendarItem_ibfk_unit
        FOREIGN KEY (unit_id) REFERENCES Unit (unit_id)
            ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_calendar_item_landlord ON CalendarItem (landlord_id);
CREATE INDEX idx_calendar_item_date ON CalendarItem (item_date);
CREATE INDEX idx_calendar_item_status ON CalendarItem (status);
CREATE INDEX idx_calendar_item_type ON CalendarItem (item_type);


DROP TABLE CalendarTask;