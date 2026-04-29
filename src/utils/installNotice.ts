import path from 'path';

export type InstallNoticeLanguage = 'zh-CN' | 'en' | 'ru' | 'vi' | 'pt-BR';

const installNoticeText: Record<
  InstallNoticeLanguage,
  {
    title: string;
    message: string;
    detailPrefix: string;
    buttons: [string, string];
  }
> = {
  'zh-CN': {
    title: '建议从开始菜单启动',
    message:
      '检测到你正在从非安装路径启动应用。为了确保自动更新生效，请从开始菜单或桌面快捷方式启动。如果没有快捷方式，请重新运行安装包。',
    detailPrefix: '安装目录：',
    buttons: ['打开安装目录', '知道了'],
  },
  en: {
    title: 'Please launch from the Start menu',
    message:
      'We detected the app is running from a non-install location. To ensure auto-updates work, launch it from the Start menu or desktop shortcut. If no shortcut exists, run the installer again.',
    detailPrefix: 'Install location: ',
    buttons: ['Open install folder', 'OK'],
  },
  ru: {
    title: 'Запускайте приложение из меню «Пуск»',
    message:
      'Обнаружен запуск из неустановленного пути. Чтобы автообновления работали, запускайте приложение из меню «Пуск» или ярлыка. Если ярлыка нет, запустите установщик ещё раз.',
    detailPrefix: 'Папка установки: ',
    buttons: ['Открыть папку', 'Понятно'],
  },
  vi: {
    title: 'Hãy mở ứng dụng từ menu Start',
    message:
      'Ứng dụng đang được chạy từ vị trí không phải thư mục cài đặt. Để tự động cập nhật hoạt động đúng, hãy mở ứng dụng từ menu Start hoặc biểu tượng ngoài màn hình. Nếu chưa có lối tắt, hãy chạy lại bộ cài.',
    detailPrefix: 'Thư mục cài đặt: ',
    buttons: ['Mở thư mục cài đặt', 'Đã hiểu'],
  },
  'pt-BR': {
    title: 'Inicie pelo menu Iniciar',
    message:
      'Detectamos que o app está sendo executado fora do local de instalação. Para garantir que as atualizações automáticas funcionem, inicie-o pelo menu Iniciar ou pelo atalho da área de trabalho. Se não houver atalho, execute o instalador novamente.',
    detailPrefix: 'Local de instalação: ',
    buttons: ['Abrir pasta de instalação', 'Entendi'],
  },
};

/**
 * Match a locale tag to a supported InstallNoticeLanguage.
 * Returns the matched language or null if no match found.
 */
function matchLocaleTag(tag: string): InstallNoticeLanguage | null {
  const normalized = tag.toLowerCase();
  if (normalized.startsWith('zh')) {
    return 'zh-CN';
  }

  if (normalized.startsWith('ru')) {
    return 'ru';
  }

  if (normalized.startsWith('vi')) {
    return 'vi';
  }

  if (normalized.startsWith('pt')) {
    return 'pt-BR';
  }

  if (normalized.startsWith('en')) {
    return 'en';
  }

  return null;
}

/**
 * Resolve the language to use for the install notice dialog.
 *
 * Priority: configLanguage > preferredLanguages > locale > 'en'
 *
 * `preferredLanguages` should come from `app.getPreferredSystemLanguages()`
 * which returns the OS-level preferred language list and is more reliable
 * than `app.getLocale()` which can return Chromium's internal locale.
 */
export function resolveInstallNoticeLanguage({
  configLanguage,
  preferredLanguages,
  locale,
}: {
  configLanguage?: string | null;
  preferredLanguages?: string[];
  locale?: string | null;
}): InstallNoticeLanguage {
  // 1. Explicit user config takes highest priority
  if (configLanguage) {
    return matchLocaleTag(configLanguage) ?? 'en';
  }

  // 2. OS preferred languages (most reliable source)
  if (preferredLanguages && preferredLanguages.length > 0) {
    for (const lang of preferredLanguages) {
      const matched = matchLocaleTag(lang);
      if (matched) {
        return matched;
      }
    }
  }

  // 3. Chromium locale (fallback)
  if (locale) {
    return matchLocaleTag(locale) ?? 'en';
  }

  return 'en';
}

export function getInstallNoticeText(language: InstallNoticeLanguage) {
  return installNoticeText[language] || installNoticeText.en;
}

function getPathApi(platform: string) {
  if (platform === 'win32') {
    return path.win32;
  }

  return path;
}

function normalizeWindowsInstallDirName(appName: string) {
  return appName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/**
 * Return the primary expected install root (Squirrel per-user location).
 * Used for the dialog detail text to tell the user where to find the app.
 */
export function getExpectedInstallRoot({
  platform,
  localAppData,
  appName,
}: {
  platform: string;
  localAppData?: string | null;
  appName: string;
}) {
  if (platform !== 'win32') {
    return null;
  }

  if (!localAppData) {
    return null;
  }

  const pathApi = getPathApi(platform);
  const installDirName = normalizeWindowsInstallDirName(appName);
  return pathApi.resolve(pathApi.join(localAppData, installDirName));
}

/**
 * Return all valid install root directories for the app on Windows.
 * Includes both Squirrel (%LOCALAPPDATA%) and WiX/MSI (Program Files) paths.
 */
export function getAllExpectedInstallRoots({
  platform,
  localAppData,
  appName,
  programFiles,
  programFilesX86,
}: {
  platform: string;
  localAppData?: string | null;
  appName: string;
  programFiles?: string | null;
  programFilesX86?: string | null;
}): string[] {
  if (platform !== 'win32') {
    return [];
  }

  const pathApi = getPathApi(platform);
  const roots: string[] = [];

  // Squirrel per-user install: %LOCALAPPDATA%\gemini_nexus
  if (localAppData) {
    const installDirName = normalizeWindowsInstallDirName(appName);
    roots.push(pathApi.resolve(pathApi.join(localAppData, installDirName)));
  }

  // WiX/MSI system-wide install: C:\Program Files\Gemini Nexus
  // and C:\Program Files (x86)\Gemini Nexus
  const displayName = appName.trim();
  if (programFiles) {
    roots.push(pathApi.resolve(pathApi.join(programFiles, displayName)));
  }

  if (programFilesX86) {
    roots.push(pathApi.resolve(pathApi.join(programFilesX86, displayName)));
  }

  return roots;
}

export function isRunningFromExpectedInstallDir({
  platform,
  isPackaged,
  localAppData,
  appName,
  execPath,
  programFiles,
  programFilesX86,
}: {
  platform: string;
  isPackaged: boolean;
  localAppData?: string | null;
  appName: string;
  execPath: string;
  programFiles?: string | null;
  programFilesX86?: string | null;
}) {
  if (platform !== 'win32' || !isPackaged) {
    return true;
  }

  const roots = getAllExpectedInstallRoots({
    platform,
    localAppData,
    appName,
    programFiles,
    programFilesX86,
  });

  if (roots.length === 0) {
    return true;
  }

  const pathApi = getPathApi(platform);
  const normalizedExecPath = pathApi.resolve(execPath).toLowerCase();

  return roots.some((root) => normalizedExecPath.startsWith(root.toLowerCase() + pathApi.sep));
}
