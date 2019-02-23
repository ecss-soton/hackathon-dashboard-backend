create table Announcements (
    Id integer not null primary key autoincrement,
    Title varchar(255) not null,
    Content text,
    PublishTime timestamp default current_timestamp not null
);

create table Repos (
    RepoUrl url not null primary key,
    TeamName varchar(255),
    RecordTime timestamp default current_timestamp not null
);
