CREATE TABLE IF NOT EXISTS countries (
  id serial PRIMARY KEY,
  name varchar(50) NOT NULL,
  code char(2) NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id serial PRIMARY KEY,
  title varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username varchar(50) NOT NULL,
  email varchar(100) NOT NULL,
  citizenship integer REFERENCES countries,
  job integer REFERENCES jobs
);

TRUNCATE countries, jobs, users RESTART IDENTITY CASCADE;

INSERT INTO countries (name, code) VALUES
  ('Ukraine', 'UA'),
  ('United States of America', 'US');

INSERT INTO jobs (title) VALUES
  ('programmer'),
  ('teacher');

INSERT INTO users (username, email, citizenship, job) VALUES
  ('wizard', 'wizard@email.com', 1, 1),
  ('toyz', 'toyz@email.com', 2, 2);
