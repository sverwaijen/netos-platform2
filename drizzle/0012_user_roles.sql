-- Migration: Expand user roles from (admin, user, guest) to (administrator, host, teamadmin, member, guest)
-- Step 1: Add new temporary column
ALTER TABLE `users` ADD COLUMN `role_new` VARCHAR(20) NOT NULL DEFAULT 'member';

-- Step 2: Migrate existing data
UPDATE `users` SET `role_new` = CASE
  WHEN `role` = 'admin' THEN 'administrator'
  WHEN `role` = 'user' THEN 'member'
  WHEN `role` = 'guest' THEN 'guest'
  ELSE 'member'
END;

-- Step 3: Drop old column and rename
ALTER TABLE `users` DROP COLUMN `role`;
ALTER TABLE `users` CHANGE COLUMN `role_new` `role` ENUM('administrator','host','teamadmin','member','guest') NOT NULL DEFAULT 'member';
