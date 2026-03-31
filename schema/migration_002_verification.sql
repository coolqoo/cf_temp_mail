-- 添加验证码和验证链接字段
ALTER TABLE emails ADD COLUMN verification_code TEXT;
ALTER TABLE emails ADD COLUMN verification_link TEXT;
