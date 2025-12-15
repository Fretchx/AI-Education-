
import { Message } from '../types';

// Robust conversion to prevent stack overflow on large buffers
const buff_to_base64 = (buff: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buff);
  const len = bytes.byteLength;
  // Use a loop to avoid call stack limits with spread operator
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64_to_buff = (b64: string): Uint8Array => {
  const binary_string = atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
};

export const generateShareableLink = async (messages: Message[]): Promise<string> => {
  try {
    // Filter out images to keep URL length manageable
    // and remove unnecessary fields
    const optimizedData = messages.map(m => ({
      id: m.id,
      role: m.role,
      text: m.text,
      timestamp: m.timestamp
    }));

    const jsonString = JSON.stringify(optimizedData);
    const enc = new TextEncoder();
    const encodedData = enc.encode(jsonString);

    // Generate Key
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Encrypt
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    // Export Key
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);

    // Construct Query Params
    const params = new URLSearchParams();
    params.set("p", buff_to_base64(encryptedContent));
    params.set("iv", buff_to_base64(iv));
    params.set("k", buff_to_base64(exportedKey));

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to generate secure link");
  }
};

export const parseShareableLink = async (): Promise<Message[] | null> => {
  const params = new URLSearchParams(window.location.search);
  const p = params.get("p");
  const ivStr = params.get("iv");
  const kStr = params.get("k");

  if (!p || !ivStr || !kStr) return null;

  try {
    const key = await window.crypto.subtle.importKey(
      "raw",
      base64_to_buff(kStr),
      "AES-GCM",
      true,
      ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64_to_buff(ivStr) },
      key,
      base64_to_buff(p)
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decrypted);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to decrypt share link", e);
    return null;
  }
};
