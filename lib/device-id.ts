"use client";

const DEVICE_ID_KEY = "careroot_device_id";

function randomHex(bytes: number) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `WEB-${randomHex(8)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
