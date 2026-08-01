import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

// A file chosen from the library, camera or document picker, shaped for a
// React Native multipart upload (FormData wants { uri, name, type }).
export interface PickedFile {
  uri: string;
  name: string;
  type: string; // mime type
}

// Keep in sync with the API's upload cap (api/src/common/uploads.ts).
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_UPLOAD_LABEL = "2 MB";

function nameFromUri(uri: string, fallback: string): string {
  const last = uri.split("/").pop();
  return last && last.includes(".") ? last : fallback;
}

// Reject an over-sized file up front (when the picker reports a size) so the
// user gets an instant, clear message instead of a failed upload round-trip.
function withinSizeLimit(bytes: number | null | undefined, noun: string): boolean {
  if (bytes != null && bytes > MAX_UPLOAD_BYTES) {
    Alert.alert(
      `${noun} is too large`,
      `Please choose a ${noun.toLowerCase()} under ${MAX_UPLOAD_LABEL}.`,
    );
    return false;
  }
  return true;
}

/** Pick an image from the photo library. Returns null if cancelled/denied. */
export async function pickImageFromLibrary(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      "Permission needed",
      "Allow photo library access to choose an image.",
    );
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
    allowsEditing: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!withinSizeLimit(asset.fileSize, "Image")) return null;
  return {
    uri: asset.uri,
    name: asset.fileName ?? nameFromUri(asset.uri, "photo.jpg"),
    type: asset.mimeType ?? "image/jpeg",
  };
}

/** Take a photo with the camera. Returns null if cancelled/denied. */
export async function takePhoto(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Allow camera access to take a photo.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsEditing: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!withinSizeLimit(asset.fileSize, "Photo")) return null;
  return {
    uri: asset.uri,
    name: asset.fileName ?? nameFromUri(asset.uri, "photo.jpg"),
    type: asset.mimeType ?? "image/jpeg",
  };
}

/** Pick a document (image or PDF). Returns null if cancelled. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["image/*", "application/pdf"],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!withinSizeLimit(asset.size, "File")) return null;
  return {
    uri: asset.uri,
    name: asset.name ?? nameFromUri(asset.uri, "document"),
    type: asset.mimeType ?? "application/octet-stream",
  };
}

/** Build a multipart form with a file plus optional text fields. */
export function fileForm(
  file: PickedFile,
  fields: Record<string, string> = {},
): FormData {
  const form = new FormData();
  // RN's FormData accepts this file shape; the cast keeps TypeScript happy.
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return form;
}
