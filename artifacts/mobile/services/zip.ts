import * as FileSystem from "expo-file-system/legacy";

export async function extractZipImages(_: string): Promise<{
  files: Map<string, string>;
  imageCount: number;
  totalCount: number;
}> {
  // ZIP extraction using JSZip is disabled in the minimal mobile build to save binary size.
  // If you need zip processing, perform extraction on the server and return image data to the app.
  throw new Error(
    "ZIP extraction is disabled in the minimal mobile APK. Upload the ZIP to the server for processing or re-enable JSZip in package.json."
  );
}
