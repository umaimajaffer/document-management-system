ALTER TABLE "users" ADD COLUMN "createdById" TEXT REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_createdById_idx" ON "users"("createdById");
