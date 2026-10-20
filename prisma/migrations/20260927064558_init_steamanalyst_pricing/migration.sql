-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "steam_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skins" (
    "id" TEXT NOT NULL,
    "weapon" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market_hash_name" TEXT NOT NULL,
    "image_url" TEXT,
    "rarity" TEXT,
    "collection" TEXT,
    "description" TEXT,

    CONSTRAINT "skins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_variants" (
    "id" TEXT NOT NULL,
    "skin_id" TEXT NOT NULL,
    "exterior" TEXT,
    "float_min" DOUBLE PRECISION,
    "float_max" DOUBLE PRECISION,
    "stattrak" BOOLEAN NOT NULL DEFAULT false,
    "souvenir" BOOLEAN NOT NULL DEFAULT false,
    "phase" TEXT,
    "pattern" TEXT,

    CONSTRAINT "skin_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_attributes" (
    "skin_id" TEXT NOT NULL,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "accent_colors" TEXT[],
    "color_score" DOUBLE PRECISION,
    "style" TEXT[],
    "theme" TEXT[],
    "brightness" DOUBLE PRECISION,
    "contrast" DOUBLE PRECISION,
    "visual_tags" TEXT[],

    CONSTRAINT "skin_attributes_pkey" PRIMARY KEY ("skin_id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "skin_variant_id" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'steamanalyst',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "skin_variant_id" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'steamanalyst',
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loadouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget" DOUBLE PRECISION,
    "match_score" INTEGER,
    "theme" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loadouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loadout_items" (
    "id" TEXT NOT NULL,
    "loadout_id" TEXT NOT NULL,
    "skin_variant_id" TEXT NOT NULL,
    "weapon_slot" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "loadout_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "user_id" TEXT NOT NULL,
    "loadout_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("user_id","loadout_id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" TEXT NOT NULL,
    "loadout_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","loadout_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "loadout_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "skins_market_hash_name_key" ON "skins"("market_hash_name");

-- CreateIndex
CREATE INDEX "skins_weapon_idx" ON "skins"("weapon");

-- CreateIndex
CREATE UNIQUE INDEX "skin_variants_skin_id_exterior_stattrak_souvenir_phase_key" ON "skin_variants"("skin_id", "exterior", "stattrak", "souvenir", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "prices_skin_variant_id_marketplace_key" ON "prices"("skin_variant_id", "marketplace");

-- CreateIndex
CREATE INDEX "price_history_skin_variant_id_timestamp_idx" ON "price_history"("skin_variant_id", "timestamp");

-- AddForeignKey
ALTER TABLE "skin_variants" ADD CONSTRAINT "skin_variants_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_attributes" ADD CONSTRAINT "skin_attributes_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_skin_variant_id_fkey" FOREIGN KEY ("skin_variant_id") REFERENCES "skin_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_skin_variant_id_fkey" FOREIGN KEY ("skin_variant_id") REFERENCES "skin_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loadouts" ADD CONSTRAINT "loadouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loadout_items" ADD CONSTRAINT "loadout_items_loadout_id_fkey" FOREIGN KEY ("loadout_id") REFERENCES "loadouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loadout_items" ADD CONSTRAINT "loadout_items_skin_variant_id_fkey" FOREIGN KEY ("skin_variant_id") REFERENCES "skin_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_loadout_id_fkey" FOREIGN KEY ("loadout_id") REFERENCES "loadouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_loadout_id_fkey" FOREIGN KEY ("loadout_id") REFERENCES "loadouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_loadout_id_fkey" FOREIGN KEY ("loadout_id") REFERENCES "loadouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
