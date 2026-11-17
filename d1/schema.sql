-- 统一用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nickname TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- 'admin' | 'user' | 'readonly'
    status TEXT DEFAULT 'active', -- 'active' | 'disabled'
    allowed_apps TEXT DEFAULT '*', -- '*' 或 JSON 数组如 '["book"]'
    remark TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 生态子系统登记表
CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY, -- 英文唯一标识, 如 'book'
    name TEXT NOT NULL, -- 应用名称, 如 '记账与持物'
    description TEXT, -- 应用描述
    url TEXT NOT NULL, -- 应用访问入口 URL
    icon TEXT NOT NULL, -- 图标标识
    badge TEXT, -- 状态/版本角标
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预置核心应用：记账与大件资产管理
INSERT OR IGNORE INTO apps (id, name, description, url, icon, badge, sort_order)
VALUES ('book', '个人记账与大件资产', '个人全维度收支与大件消费品日均成本折旧管理', 'https://book.b1uegrey.xyz', 'Wallet', '核心应用', 1);
