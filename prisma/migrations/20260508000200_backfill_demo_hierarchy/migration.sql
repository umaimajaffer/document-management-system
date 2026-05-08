UPDATE "users"
SET "createdById" = (SELECT "id" FROM "users" WHERE "email" = 'admin@demo.com')
WHERE "email" = 'advanced@demo.com'
  AND "createdById" IS NULL;

UPDATE "users"
SET "createdById" = (SELECT "id" FROM "users" WHERE "email" = 'advanced@demo.com')
WHERE "email" = 'user@demo.com'
  AND "createdById" IS NULL;
