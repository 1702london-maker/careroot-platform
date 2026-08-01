const STORAGE_PATH_PART = /^[a-zA-Z0-9._-]+$/;

export function safeStorageFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}

export function buildStoragePath(...parts: string[]) {
  if (parts.some((part) => !STORAGE_PATH_PART.test(part))) {
    throw new Error("Unsafe storage path segment");
  }
  return parts.join("/");
}

export function isSafeStoragePath(path: string, ...expectedPrefix: string[]) {
  const parts = path.split("/");
  return (
    parts.length >= expectedPrefix.length + 1 &&
    expectedPrefix.every((part, index) => parts[index] === part) &&
    parts.every((part) => STORAGE_PATH_PART.test(part))
  );
}
