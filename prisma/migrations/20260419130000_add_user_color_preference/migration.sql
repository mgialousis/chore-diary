CREATE TYPE "UserColor" AS ENUM ('ROSE', 'SKY', 'AMBER', 'EMERALD', 'VIOLET', 'SLATE');

ALTER TABLE "users"
ADD COLUMN "color_preference" "UserColor";
