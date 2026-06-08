export interface UserSettings {
  nickname: string;
  signature: string;
  avatar: string;
  preferredAgent: string;
  reviewTime: string;
  pushEnabled: boolean;
  darkMode: boolean;
  fontSize: number;
  email: string;
  uid: string;
}

const STORAGE_ALL_USER_SETTINGS = 'tutor_all_user_settings';
const STORAGE_CURRENT_USER = 'tutor_current_user_phone';

/** 生成 9 位唯一数字 ID */
export function generateUID(): string {
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp + random;
}

/** 生成全局唯一 UID（在已存在 UID 中查重） */
export function generateUniqueUID(): string {
  const all = getAllUserSettings();
  let uid: string;
  let attempts = 0;
  do {
    uid = generateUID();
    attempts++;
  } while (Object.values(all).some(s => s.uid === uid) && attempts < 100);
  return uid;
}

const DEFAULT_SETTINGS: UserSettings = {
  nickname: '学习之星',
  signature: '',
  avatar: 'https://picsum.photos/seed/user/200/200',
  preferredAgent: 'math',
  reviewTime: '20:00',
  pushEnabled: true,
  darkMode: false,
  fontSize: 16,
  email: '',
  uid: '',
};

// ── 多用户设置存储（按手机号分片）───────────────────────────────

function getAllUserSettings(): Record<string, UserSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_ALL_USER_SETTINGS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllUserSettings(all: Record<string, UserSettings>): void {
  localStorage.setItem(STORAGE_ALL_USER_SETTINGS, JSON.stringify(all));
}

// ── 当前登录用户 ───────────────────────────────────────────────

export function getCurrentUserPhone(): string | null {
  return localStorage.getItem(STORAGE_CURRENT_USER);
}

export function setCurrentUserPhone(phone: string): void {
  localStorage.setItem(STORAGE_CURRENT_USER, phone);
}

export function clearCurrentUserPhone(): void {
  localStorage.removeItem(STORAGE_CURRENT_USER);
}

// ── 设置读写（均作用于当前登录用户）─────────────────────────────

export function getSettings(): UserSettings {
  const phone = getCurrentUserPhone();
  if (phone) {
    const all = getAllUserSettings();
    if (all[phone]) {
      return { ...DEFAULT_SETTINGS, ...all[phone] };
    }
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: UserSettings): void {
  const phone = getCurrentUserPhone();
  if (phone) {
    const all = getAllUserSettings();
    all[phone] = { ...DEFAULT_SETTINGS, ...settings };
    saveAllUserSettings(all);
  }
}

// ── 新用户初始化（注册或首次登录时调用）─────────────────────────

export function initUserSettings(phone: string, nickname: string, uid: string): void {
  const all = getAllUserSettings();
  if (!all[phone]) {
    all[phone] = { ...DEFAULT_SETTINGS, nickname, uid };
  } else {
    all[phone] = { ...all[phone], nickname, uid: all[phone].uid || uid };
  }
  saveAllUserSettings(all);
  setCurrentUserPhone(phone);
}

// ── 昵称/账号/UID 唯一性校验 ───────────────────────────────────

/** 检查昵称是否已被其他用户占用 */
export function isNicknameTaken(nickname: string, excludePhone?: string): boolean {
  const all = getAllUserSettings();
  for (const [phone, settings] of Object.entries(all)) {
    if (phone !== excludePhone && settings.nickname === nickname) {
      return true;
    }
  }
  return false;
}

/** 检查 UID 是否已被占用 */
export function isUIDTaken(uid: string, excludePhone?: string): boolean {
  const all = getAllUserSettings();
  for (const [phone, settings] of Object.entries(all)) {
    if (phone !== excludePhone && settings.uid === uid) {
      return true;
    }
  }
  return false;
}

// ── 便捷函数 ──────────────────────────────────────────────────

export function getUserDisplayName(): string {
  return getSettings().nickname || '张同学';
}

export function getUserAvatar(): string {
  return getSettings().avatar || DEFAULT_SETTINGS.avatar;
}
