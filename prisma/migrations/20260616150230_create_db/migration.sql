-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "PresentationStatus" AS ENUM ('draft', 'outlining', 'outlined', 'generating', 'rendering', 'done', 'failed');

-- CreateEnum
CREATE TYPE "SlideStatus" AS ENUM ('pending', 'generated', 'rendered');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('image', 'chart');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('pending', 'done', 'failed');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('pdf', 'pptx', 'png_zip');

-- CreateEnum
CREATE TYPE "JobStage" AS ENUM ('outline', 'cards', 'images', 'render');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'active', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "language_code" TEXT NOT NULL DEFAULT 'uz',
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "credits" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "preview_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presentations" (
    "id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "theme_id" UUID,
    "title" TEXT,
    "topic_prompt" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'uz',
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "slide_count" INTEGER NOT NULL DEFAULT 10,
    "status" "PresentationStatus" NOT NULL DEFAULT 'draft',
    "outline" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presentations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" UUID NOT NULL,
    "presentation_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "layout" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "SlideStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "slide_id" UUID,
    "type" "AssetType" NOT NULL,
    "prompt" TEXT,
    "provider" TEXT,
    "storage_key" TEXT,
    "url" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'pending',
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" UUID NOT NULL,
    "presentation_id" UUID NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT,
    "file_size" INTEGER,
    "telegram_file_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" UUID NOT NULL,
    "presentation_id" UUID NOT NULL,
    "bull_job_id" TEXT,
    "stage" "JobStage" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "model_used" TEXT,
    "tokens_used" INTEGER,
    "cost_usd" DECIMAL(10,5),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_sessions" (
    "user_id" BIGINT NOT NULL,
    "state" TEXT,
    "context" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_sessions_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "presentations_user_id_idx" ON "presentations"("user_id");

-- CreateIndex
CREATE INDEX "presentations_status_idx" ON "presentations"("status");

-- CreateIndex
CREATE INDEX "slides_presentation_id_idx" ON "slides"("presentation_id");

-- CreateIndex
CREATE UNIQUE INDEX "slides_presentation_id_position_key" ON "slides"("presentation_id", "position");

-- CreateIndex
CREATE INDEX "generation_jobs_presentation_id_idx" ON "generation_jobs"("presentation_id");

-- AddForeignKey
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_slide_id_fkey" FOREIGN KEY ("slide_id") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_sessions" ADD CONSTRAINT "bot_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
