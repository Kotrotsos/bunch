export function shortenPath(fullPath: string): string {
  // Simple heuristic: replace /Users/<name> or /home/<name> with ~
  const homePattern = /^(\/Users\/[^/]+|\/home\/[^/]+)/;
  const match = homePattern.exec(fullPath);
  if (match) {
    return "~" + fullPath.slice(match[1].length);
  }
  return fullPath;
}

export function getFileExtension(path: string): string {
  const parts = path.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function getLanguageFromPath(path: string): string {
  const ext = getFileExtension(path);
  switch (ext) {
    case "md":
      return "markdown";
    case "json":
      return "json";
    default:
      return "plaintext";
  }
}
