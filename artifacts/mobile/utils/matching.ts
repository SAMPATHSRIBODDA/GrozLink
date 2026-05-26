export interface MatchResult {
  rowIndex: number;
  productName: string;
  imageName: string;
  imageKey: string | null;
  imageBase64: string | null;
  mimeType: string;
  status: "matched" | "unmatched";
  cloudinaryUrl: string | null;
  uploadStatus: "pending" | "uploading" | "success" | "failed";
  errorMessage: string | null;
}

function normalizeFilename(name: string, caseSensitive: boolean, ignoreSpaces: boolean): string {
  let n = name.trim();
  const dotIdx = n.lastIndexOf(".");
  if (dotIdx > 0) n = n.substring(0, dotIdx);
  if (ignoreSpaces) n = n.replace(/\s+/g, "");
  if (!caseSensitive) n = n.toLowerCase();
  return n;
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext] ?? "image/jpeg";
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function matchImages(
  rows: Array<{ rowIndex: number; productName: string; imageName: string }>,
  extractedFiles: Map<string, string>,
  caseSensitive: boolean,
  ignoreSpaces: boolean
): { results: MatchResult[]; unmatchedImages: string[]; duplicates: string[] } {
  const fileMap = new Map<string, { key: string; base64: string; mimeType: string }>();
  const duplicateNorms = new Set<string>();
  const seen = new Set<string>();

  for (const [filePath, base64] of extractedFiles.entries()) {
    const filename = filePath.split("/").pop() ?? filePath;
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const norm = normalizeFilename(filename, caseSensitive, ignoreSpaces);
    if (seen.has(norm)) {
      duplicateNorms.add(norm);
    } else {
      seen.add(norm);
      fileMap.set(norm, { key: filePath, base64, mimeType: getMimeType(filename) });
    }
  }

  const usedKeys = new Set<string>();
  const results: MatchResult[] = rows.map((row) => {
    const normImageName = normalizeFilename(row.imageName, caseSensitive, ignoreSpaces);
    const match = fileMap.get(normImageName);
    if (match && !usedKeys.has(match.key)) {
      usedKeys.add(match.key);
      return {
        rowIndex: row.rowIndex,
        productName: row.productName,
        imageName: row.imageName,
        imageKey: match.key,
        imageBase64: match.base64,
        mimeType: match.mimeType,
        status: "matched",
        cloudinaryUrl: null,
        uploadStatus: "pending",
        errorMessage: null,
      };
    }
    return {
      rowIndex: row.rowIndex,
      productName: row.productName,
      imageName: row.imageName,
      imageKey: null,
      imageBase64: null,
      mimeType: "image/jpeg",
      status: "unmatched",
      cloudinaryUrl: null,
      uploadStatus: "pending",
      errorMessage: null,
    };
  });

  const unmatchedImages: string[] = [];
  for (const [key] of extractedFiles.entries()) {
    if (!usedKeys.has(key)) {
      const ext = key.split(".").pop()?.toLowerCase() ?? "";
      if (IMAGE_EXTENSIONS.has(ext)) {
        unmatchedImages.push(key);
      }
    }
  }

  return { results, unmatchedImages, duplicates: [...duplicateNorms] };
}
