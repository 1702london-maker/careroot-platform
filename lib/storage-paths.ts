const STORAGE_PATH_PART = /^[a-zA-Z0-9._-]+$/;

function isSafeStoragePathPart(part: string) {
  return (
    STORAGE_PATH_PART.test(part) &&
    part !== "." &&
    part !== ".." &&
    !part.includes("..")
  );
}

export function safeStorageFileName(name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\.+/g, "_").slice(0, 160);
  return safeName && isSafeStoragePathPart(safeName) ? safeName : "document";
}

export function buildStoragePath(...parts: string[]) {
  if (parts.some((part) => !isSafeStoragePathPart(part))) {
    throw new Error("Unsafe storage path segment");
  }
  return parts.join("/");
}

export function isSafeStoragePath(path: string, ...expectedPrefix: string[]) {
  const parts = path.split("/");
  return (
    parts.length >= expectedPrefix.length + 1 &&
    expectedPrefix.every((part, index) => parts[index] === part) &&
    parts.every((part) => isSafeStoragePathPart(part))
  );
}

export function sanitizeStoragePath(path: string, ...expectedPrefix: string[]) {
  if (!isSafeStoragePath(path, ...expectedPrefix)) {
    throw new Error("Unsafe storage path");
  }
  return path;
}
