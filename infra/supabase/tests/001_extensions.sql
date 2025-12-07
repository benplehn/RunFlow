DISCARD ALL;
BEGIN;
select plan(1);
select has_extension('uuid-ossp', 'uuid-ossp extension is installed');
select * from finish();
ROLLBACK;
