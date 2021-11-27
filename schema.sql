DROP TABLE IF EXISTS Cards;

CREATE TABLE Cards (
    name        TEXT NOT NULL,
    identifier  TEXT NOT NULL,
    quantity    INTEGER NOT NULL,

    unknown     INTEGER DEFAULT 0,
    
    url         TEXT,
    unit_price_avg  INTEGER,
    unit_price_min  INTEGER,
    unit_price_max  INTEGER
);
