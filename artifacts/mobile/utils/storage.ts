import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TemplateRules {
  productNameColumn: string;
  imageNameColumn: string;
  imageUrlColumn: string;
  priceColumn: string;
  categoryColumn: string;
  brandColumn: string;
  extraColumns: string[];
  caseSensitive: boolean;
  ignoreExtraSpaces: boolean;
  strictMode: boolean;
}

export interface CloudinarySettings {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
  folder: string;
}

export type ThemeMode = "system" | "light" | "dark";

export interface SessionRecord {
  id: string;
  date: string;
  excelFileName: string;
  totalProducts: number;
  matchedImages: number;
  uploadedImages: number;
  failedUploads: number;
}

const KEYS = {
  TEMPLATE_RULES: "grozio_template_rules",
  CLOUDINARY_SETTINGS: "grozio_cloudinary_settings",
  SESSION_HISTORY: "grozio_session_history",
  THEME_MODE: "grozio_theme_mode",
};

export const defaultTemplateRules: TemplateRules = {
  productNameColumn: "Product Name",
  imageNameColumn: "Image Name",
  imageUrlColumn: "Image URL",
  priceColumn: "Price",
  categoryColumn: "Category",
  brandColumn: "Brand",
  extraColumns: [],
  caseSensitive: false,
  ignoreExtraSpaces: true,
  strictMode: true,
};

export const defaultCloudinarySettings: CloudinarySettings = {
  cloudName: "",
  uploadPreset: "",
  apiKey: "",
  folder: "grozio-products",
};

export async function loadTemplateRules(): Promise<TemplateRules> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TEMPLATE_RULES);
    return raw ? { ...defaultTemplateRules, ...JSON.parse(raw) } : defaultTemplateRules;
  } catch {
    return defaultTemplateRules;
  }
}

export async function saveTemplateRules(rules: TemplateRules): Promise<void> {
  await AsyncStorage.setItem(KEYS.TEMPLATE_RULES, JSON.stringify(rules));
}

export async function loadCloudinarySettings(): Promise<CloudinarySettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CLOUDINARY_SETTINGS);
    return raw ? { ...defaultCloudinarySettings, ...JSON.parse(raw) } : defaultCloudinarySettings;
  } catch {
    return defaultCloudinarySettings;
  }
}

export async function saveCloudinarySettings(settings: CloudinarySettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.CLOUDINARY_SETTINGS, JSON.stringify(settings));
}

export async function loadSessionHistory(): Promise<SessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addSessionRecord(session: SessionRecord): Promise<void> {
  const history = await loadSessionHistory();
  const updated = [session, ...history].slice(0, 50);
  await AsyncStorage.setItem(KEYS.SESSION_HISTORY, JSON.stringify(updated));
}

export async function clearSessionHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SESSION_HISTORY);
}

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.THEME_MODE);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
    return "system";
  } catch {
    return "system";
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
}
