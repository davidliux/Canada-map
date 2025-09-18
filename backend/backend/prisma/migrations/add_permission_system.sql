-- CreateTable: permission_groups
CREATE TABLE IF NOT EXISTS "permission_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "permissions" JSONB DEFAULT '[]',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_permissions
CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "modules" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permission_groups_name_key" ON "permission_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_user_id_group_id_key" ON "user_permissions"("user_id", "group_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_permissions_user_id_idx" ON "user_permissions"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_permissions_group_id_idx" ON "user_permissions"("group_id");

-- AddForeignKey
ALTER TABLE "user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions"
    ADD CONSTRAINT "user_permissions_group_id_fkey"
    FOREIGN KEY ("group_id")
    REFERENCES "permission_groups"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Insert default permission groups
INSERT INTO "permission_groups" ("name", "description", "permissions", "is_active")
VALUES
    ('超级管理员', '拥有系统所有权限', '["*"]', true),
    ('管理员', '拥有大部分管理权限', '["users.view", "users.edit", "regions.manage", "pricing.manage", "reports.view"]', true),
    ('运营人员', '负责日常运营管理', '["regions.view", "regions.edit", "pricing.view", "reports.view"]', true),
    ('查看者', '只能查看数据', '["regions.view", "pricing.view", "reports.view"]', true)
ON CONFLICT (name) DO NOTHING;
