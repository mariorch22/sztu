import { createClient } from "@supabase/supabase-js";

export const VIDEO_FOLDER = "clips";
export const MAX_VIDEO_MIB = 25;
export const VIDEO_TYPES = { mp4: "video/mp4", webm: "video/webm" };

const VIDEO_BUCKET = "video-app-clips";
let supabase;

export function getVideoStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase-URL oder Publishable Key fehlt in .env.");

  supabase ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return supabase.storage.from(VIDEO_BUCKET);
}

export function describeUploadError(error) {
  const code = error?.code;
  const message = error instanceof Error ? error.message : "";
  const status = Number(error?.statusCode ?? error?.status);

  if (code === "NoSuchBucket" || /bucket not found/i.test(message)) {
    return `Supabase findet den Bucket „${VIDEO_BUCKET}“ nicht. Führe supabase/setup.sql im SQL Editor deines Projekts aus.`;
  }
  if (code === "InvalidJWT" || status === 401) {
    return "Supabase lehnt den Schlüssel ab. Prüfe, ob URL und Publishable Key in .env zum selben Projekt gehören.";
  }
  if (code === "AccessDenied" || status === 403 || /row.level security/i.test(message)) {
    return `Supabase hat den Upload abgelehnt. Prüfe die Upload-Policy für „${VIDEO_BUCKET}“ aus supabase/setup.sql.`;
  }
  if (code === "EntityTooLarge" || status === 413) {
    return "Die Datei überschreitet das Upload-Limit in Supabase Storage.";
  }
  if (code === "InvalidMimeType" || status === 415) {
    return `Supabase akzeptiert diesen Dateityp nicht. Prüfe, ob „${VIDEO_BUCKET}“ MP4 und WebM erlaubt.`;
  }

  return message ? `Upload fehlgeschlagen. ${message}` : "Upload fehlgeschlagen.";
}
