-- CreateEnum
CREATE TYPE "PendingImageStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "pending_images" ADD COLUMN     "candidateUrl" TEXT,
ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "status" "PendingImageStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "width" INTEGER;

-- CreateIndex
CREATE INDEX "pending_images_status_idx" ON "pending_images"("status");
