create table test.config (
    name varchar(64) not null primary key,
    value varchar(1024)
);
create table test.mst_group (
    guid varchar(64) not null primary key,
    alterid int not null default 0,
    name varchar(1024) not null default '',
    parent varchar(1024) not null default '',
    _parent varchar(64) not null default '',
    primary_group varchar(1024) not null default '',
    is_revenue smallint,
    is_deemedpositive smallint,
    is_reserved smallint,
    affects_gross_profit smallint,
    sort_position int
);

create table test.mst_ledger (
    guid varchar(64) not null primary key,
    alterid int not null default 0,
    name varchar(1024) not null default '',
    parent varchar(1024) not null default '',
    _parent varchar(64) not null default '',
    alias varchar(256) not null default '',
    is_revenue smallint,
    is_deemedpositive smallint,
    opening_balance decimal(17, 2) default 0,
    description varchar(256) not null default '',
    mailing_name varchar(256) not null default '',
    mailing_address varchar(1024) not null default '',
    mailing_state varchar(256) not null default '',
    mailing_country varchar(256) not null default '',
    mailing_pincode varchar(64) not null default '',
    email varchar(256) not null default '',
    it_pan varchar(64) not null default '',
    gstn varchar(64) not null default '',
    gst_registration_type varchar(64) not null default '',
    gst_supply_type varchar(64) not null default '',
    gst_duty_head varchar(16) not null default '',
    tax_rate decimal(9, 4) default 0,
    bank_account_holder varchar(256) not null default '',
    bank_account_number varchar(64) not null default '',
    bank_ifsc varchar(64) not null default '',
    bank_swift varchar(64) not null default '',
    bank_name varchar(64) not null default '',
    bank_branch varchar(64) not null default '',
    closing_balance decimal(17, 2) default 0
);