export interface AuthUser {
  username: string;
  name: string;
  role: string;
  loginAt: string;
}

const STORAGE_KEY = 'adm_auth_session';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveUserSession(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Gagal menyimpan sesi login:', e);
  }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Gagal menghapus sesi login:', e);
  }
}

export function authenticateUser(
  usernameInput: string,
  passwordInput: string
): { success: boolean; message?: string; user?: AuthUser } {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // Validasi kredensial default
  const isValidUsername =
    username === 'admin' ||
    username === 'panitia' ||
    username === 'panitia@smpn1rajapolah.sch.id' ||
    username === 'smpn1rajapolah';

  const isValidPassword =
    password === 'admin' ||
    password === 'admin123' ||
    password === 'smpn1rajapolah' ||
    password === '123456';

  // Periksa juga kredensial kustom jika pernah disimpan oleh pengguna
  let customCreds: { username: string; passwordHash: string } | null = null;
  if (typeof window !== 'undefined') {
    try {
      const savedCreds = localStorage.getItem('adm_custom_creds');
      if (savedCreds) {
        customCreds = JSON.parse(savedCreds);
      }
    } catch {}
  }

  if (customCreds && customCreds.username.toLowerCase() === username && customCreds.passwordHash === password) {
    const user: AuthUser = {
      username: customCreds.username,
      name: 'Administrator SAS',
      role: 'Panitia Ujian',
      loginAt: new Date().toISOString(),
    };
    saveUserSession(user);
    return { success: true, user };
  }

  if (isValidUsername && isValidPassword) {
    const user: AuthUser = {
      username: usernameInput.trim(),
      name: 'Panitia Asesmen (SAS)',
      role: 'Administrator',
      loginAt: new Date().toISOString(),
    };
    saveUserSession(user);
    return { success: true, user };
  }

  return {
    success: false,
    message: 'Username atau password tidak sesuai. Silakan periksa kembali.',
  };
}

