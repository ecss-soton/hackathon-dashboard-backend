create table Announcements (
    Id integer not null primary key autoincrement,
    Title varchar(255) not null,
    Content text,
    PublishTime timestamp default current_timestamp not null
);
