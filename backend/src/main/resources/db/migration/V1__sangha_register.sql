CREATE TABLE sangha_person (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    mobile          VARCHAR(20)  NOT NULL,
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(200),
    alt_mobile      VARCHAR(20),
    gender          VARCHAR(20),
    age_group       VARCHAR(20),
    meditation      VARCHAR(20),
    birth_date      VARCHAR(2),
    birth_month     VARCHAR(2),
    language        VARCHAR(40),
    pyramid_center  VARCHAR(200),
    since_year      VARCHAR(4),
    id_type         VARCHAR(40),
    password_hash   VARCHAR(100) NOT NULL,
    live_photo      LONGTEXT,
    id_proof_photo  LONGTEXT,
    place_kind      VARCHAR(20),
    place_village   VARCHAR(120),
    place_town      VARCHAR(120),
    place_district  VARCHAR(120),
    place_city      VARCHAR(120),
    place_state     VARCHAR(120),
    place_country   VARCHAR(120),
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    CONSTRAINT uk_sangha_person_mobile UNIQUE (mobile)
);

CREATE TABLE sangha_person_role (
    person_id BIGINT      NOT NULL,
    role_id   VARCHAR(40) NOT NULL,
    PRIMARY KEY (person_id, role_id),
    CONSTRAINT fk_person_role_person FOREIGN KEY (person_id) REFERENCES sangha_person (id) ON DELETE CASCADE
);

CREATE TABLE sangha_family_member (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    person_id       BIGINT NOT NULL,
    sort_order      INT    NOT NULL DEFAULT 0,
    name            VARCHAR(200),
    relation_label  VARCHAR(80),
    mobile          VARCHAR(20),
    gender          VARCHAR(20),
    age_group       VARCHAR(20),
    meditation      VARCHAR(20),
    addr_mode       VARCHAR(20),
    id_type         VARCHAR(40),
    live_photo      LONGTEXT,
    id_proof_photo  LONGTEXT,
    place_kind      VARCHAR(20),
    place_village   VARCHAR(120),
    place_town      VARCHAR(120),
    place_district  VARCHAR(120),
    place_city      VARCHAR(120),
    place_state     VARCHAR(120),
    place_country   VARCHAR(120),
    CONSTRAINT fk_family_person FOREIGN KEY (person_id) REFERENCES sangha_person (id) ON DELETE CASCADE
);

CREATE TABLE sangha_event (
    id                VARCHAR(40)  NOT NULL PRIMARY KEY,
    name              VARCHAR(200) NOT NULL,
    start_date        DATE         NOT NULL,
    end_date          DATE         NOT NULL,
    created_by_mobile VARCHAR(20)  NOT NULL,
    created_at        TIMESTAMP    NOT NULL
);

CREATE INDEX idx_sangha_person_mobile ON sangha_person (mobile);
CREATE INDEX idx_sangha_event_created ON sangha_event (created_at);
