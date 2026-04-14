-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'EVERY_N_DAYS', 'WEEKLY', 'SPECIFIC_DAYS');

-- CreateEnum
CREATE TYPE "ChoreCategory" AS ENUM ('COOKING', 'CLEANING', 'LAUNDRY', 'GROCERIES', 'DISHES', 'TRASH', 'BATHROOM', 'TIDYING', 'HOUSEHOLD_ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "ChoreStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "MealStatus" AS ENUM ('PLANNED', 'COOKED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "GrocerySourceType" AS ENUM ('MEAL_PLAN', 'MANUAL');

-- CreateEnum
CREATE TYPE "GroceryStatus" AS ENUM ('NEEDED', 'BOUGHT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroceryCategory" AS ENUM ('VEGETABLES', 'FRUIT', 'DAIRY', 'MEAT_FISH', 'PANTRY', 'FROZEN', 'CLEANING_SUPPLIES', 'BATHROOM_SUPPLIES', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CHORE_COMPLETED', 'CHORE_SKIPPED', 'MEAL_COOKED', 'MEAL_PLANNED', 'GROCERY_BOUGHT', 'GROCERY_ADDED', 'RECIPE_CREATED');

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_templates" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ChoreCategory" NOT NULL DEFAULT 'OTHER',
    "assigned_user_id" TEXT,
    "recurrence_type" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrence_interval" INTEGER,
    "days_of_week" INTEGER[],
    "next_due_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chore_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_instances" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "chore_template_id" TEXT,
    "name" TEXT NOT NULL,
    "category" "ChoreCategory" NOT NULL DEFAULT 'OTHER',
    "assigned_user_id" TEXT,
    "due_date" DATE NOT NULL,
    "status" "ChoreStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "completed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chore_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_servings" INTEGER NOT NULL DEFAULT 2,
    "meal_type" "MealSlot",
    "prep_time_minutes" INTEGER,
    "instructions" TEXT,
    "tags" TEXT[],
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "ingredient_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "meal_slot" "MealSlot" NOT NULL,
    "recipe_id" TEXT,
    "custom_meal_name" TEXT,
    "assigned_user_id" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "status" "MealStatus" NOT NULL DEFAULT 'PLANNED',
    "cooked_at" TIMESTAMP(3),
    "cooked_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grocery_items" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "category" "GroceryCategory" NOT NULL DEFAULT 'OTHER',
    "source_type" "GrocerySourceType" NOT NULL,
    "source_id" TEXT,
    "needed_by_date" DATE,
    "status" "GroceryStatus" NOT NULL DEFAULT 'NEEDED',
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grocery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "households_invite_code_key" ON "households"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_household_id_user_id_key" ON "household_members"("household_id", "user_id");

-- CreateIndex
CREATE INDEX "chore_templates_household_id_idx" ON "chore_templates"("household_id");

-- CreateIndex
CREATE INDEX "chore_templates_household_id_is_active_idx" ON "chore_templates"("household_id", "is_active");

-- CreateIndex
CREATE INDEX "chore_instances_household_id_due_date_idx" ON "chore_instances"("household_id", "due_date");

-- CreateIndex
CREATE INDEX "chore_instances_household_id_status_idx" ON "chore_instances"("household_id", "status");

-- CreateIndex
CREATE INDEX "recipes_household_id_idx" ON "recipes"("household_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "meal_plans_household_id_date_idx" ON "meal_plans"("household_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plans_household_id_date_meal_slot_key" ON "meal_plans"("household_id", "date", "meal_slot");

-- CreateIndex
CREATE INDEX "grocery_items_household_id_status_idx" ON "grocery_items"("household_id", "status");

-- CreateIndex
CREATE INDEX "activity_log_household_id_created_at_idx" ON "activity_log"("household_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_log_household_id_event_type_idx" ON "activity_log"("household_id", "event_type");

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_templates" ADD CONSTRAINT "chore_templates_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_templates" ADD CONSTRAINT "chore_templates_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_chore_template_id_fkey" FOREIGN KEY ("chore_template_id") REFERENCES "chore_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_cooked_by_user_id_fkey" FOREIGN KEY ("cooked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grocery_items" ADD CONSTRAINT "grocery_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
