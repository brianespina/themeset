-- Re-keys `users` onto Supabase Auth and lets loadout items reference
-- seed-catalog skins that the price-refresh job has not priced yet.
--
-- The DROP COLUMN statements below are destructive in principle but safe here:
-- no route has ever written to users/loadouts/likes/favorites/comments, and
-- DATABASE_URL pointed at an unprovisioned localhost until this change, so
-- these tables are empty. Do NOT reuse this migration on a populated database.

-- DropForeignKey
ALTER TABLE "loadouts" DROP CONSTRAINT "loadouts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "loadout_items" DROP CONSTRAINT "loadout_items_skin_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "likes" DROP CONSTRAINT "likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_user_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "loadouts" DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "loadout_items" ADD COLUMN     "skin_ref" TEXT NOT NULL,
ALTER COLUMN "skin_variant_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "likes" DROP CONSTRAINT "likes_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("user_id", "loadout_id");

-- AlterTable
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id", "loadout_id");

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_steam_id_key" ON "users"("steam_id");

-- CreateIndex
CREATE UNIQUE INDEX "loadout_items_loadout_id_weapon_slot_key" ON "loadout_items"("loadout_id", "weapon_slot");

-- AddForeignKey
ALTER TABLE "loadouts" ADD CONSTRAINT "loadouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loadout_items" ADD CONSTRAINT "loadout_items_skin_variant_id_fkey" FOREIGN KEY ("skin_variant_id") REFERENCES "skin_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

