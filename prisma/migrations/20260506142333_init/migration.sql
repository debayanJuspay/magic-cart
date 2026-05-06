-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellRule" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "triggerType" TEXT NOT NULL,
    "triggerProducts" TEXT,
    "triggerCollections" TEXT,
    "minCartValue" DOUBLE PRECISION,
    "offerType" TEXT NOT NULL,
    "offerProducts" TEXT NOT NULL,
    "offerLimit" INTEGER NOT NULL DEFAULT 1,
    "discountPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeGiftRule" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "giftProductId" TEXT NOT NULL,
    "giftVariantId" TEXT,
    "giftQuantity" INTEGER NOT NULL DEFAULT 1,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "conditionType" TEXT NOT NULL,
    "minCartValue" DOUBLE PRECISION,
    "requiredProducts" TEXT,
    "requiredCoupon" TEXT,
    "displayAsLocked" BOOLEAN NOT NULL DEFAULT true,
    "customMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeGiftRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "bgColor" TEXT NOT NULL DEFAULT '#000000',
    "icon" TEXT,
    "displayType" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "position" TEXT NOT NULL DEFAULT 'top',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "cartDrawerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "drawerPosition" TEXT NOT NULL DEFAULT 'right',
    "primaryColor" TEXT NOT NULL DEFAULT '#008060',
    "showRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "maxRecommendations" INTEGER NOT NULL DEFAULT 3,
    "enableCoupons" BOOLEAN NOT NULL DEFAULT true,
    "enableNotes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpsellRule_shop_idx" ON "UpsellRule"("shop");

-- CreateIndex
CREATE INDEX "UpsellRule_isActive_idx" ON "UpsellRule"("isActive");

-- CreateIndex
CREATE INDEX "FreeGiftRule_shop_idx" ON "FreeGiftRule"("shop");

-- CreateIndex
CREATE INDEX "FreeGiftRule_isActive_idx" ON "FreeGiftRule"("isActive");

-- CreateIndex
CREATE INDEX "Banner_shop_idx" ON "Banner"("shop");

-- CreateIndex
CREATE INDEX "Banner_isActive_idx" ON "Banner"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "ShopSettings_shop_idx" ON "ShopSettings"("shop");
