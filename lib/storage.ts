import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const memoryStore: Record<string, string> = {};

const isWeb = Platform.OS === "web";

function hasLocalStorage(): boolean {
  try {
    return isWeb && typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    if (hasLocalStorage()) return window.localStorage.getItem(key);
    if (!isWeb) return await AsyncStorage.getItem(key);
    return memoryStore[key] ?? null;
  } catch {
    return memoryStore[key] ?? null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (hasLocalStorage()) {
      window.localStorage.setItem(key, value);
      return;
    }
    if (!isWeb) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    memoryStore[key] = value;
  } catch {
    memoryStore[key] = value;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (hasLocalStorage()) {
      window.localStorage.removeItem(key);
      return;
    }
    if (!isWeb) {
      await AsyncStorage.removeItem(key);
      return;
    }
    delete memoryStore[key];
  } catch {
    delete memoryStore[key];
  }
}

export function getItemSync(key: string): string | null {
  try {
    if (hasLocalStorage()) return window.localStorage.getItem(key);
    return memoryStore[key] ?? null;
  } catch {
    return memoryStore[key] ?? null;
  }
}

export function setItemSync(key: string, value: string): void {
  try {
    if (hasLocalStorage()) {
      window.localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
    if (!isWeb) {
      AsyncStorage.setItem(key, value).catch(() => {});
    }
  } catch {
    memoryStore[key] = value;
  }
}
