import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export async function extractZipImages(uri: string): Promise<{
  files: Map<string, string>;
  imageCount: number;
  totalCount: number;
}> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const zip = await JSZip.loadAsync(base64, { base64: true });

  const files = new Map<string, string>();
  let imageCount = 0;
  let totalCount = 0;

  const fileEntries = Object.entries(zip.files).filter(([, f]) => !f.dir);
  totalCount = fileEntries.length;

  await Promise.all(
    fileEntries.map(async ([name, file]) => {
      const filename = name.split("/").pop() ?? name;
      if (filename.startsWith(".") || filename.startsWith("__MACOSX")) return;
      const ext = filename.split(".").pop()?.toLowerCase() ?? "";
      if (!IMAGE_EXTENSIONS.has(ext)) return;

      const content = await file.async("base64");
      files.set(name, content);
      imageCount++;
    })
  );

  return { files, imageCount, totalCount };
}
