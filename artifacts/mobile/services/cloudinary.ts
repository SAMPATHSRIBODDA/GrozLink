import { CloudinarySettings } from "@/utils/storage";

export interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadImageToCloudinary(
  base64Data: string,
  mimeType: string,
  settings: CloudinarySettings,
  retries = 2
): Promise<string> {
  const { cloudName, uploadPreset, folder } = settings;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary Cloud Name and Upload Preset are required");
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const dataUri = `data:${mimeType};base64,${base64Data}`;

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("upload_preset", uploadPreset);
  if (folder) formData.append("folder", folder);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloudinary error ${response.status}: ${errText}`);
      }
      const data = (await response.json()) as UploadResult;
      if (!data.secure_url) throw new Error("No secure_url in Cloudinary response");
      return data.secure_url;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError!;
}

export function isCloudinaryConfigured(settings: CloudinarySettings): boolean {
  return Boolean(settings.cloudName?.trim() && settings.uploadPreset?.trim());
}
