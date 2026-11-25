import { getVideoStorage, VIDEO_FOLDER } from "../../video-storage";

export async function GET() {
  try {
    const storage = getVideoStorage();
    const { data, error } = await storage.list(VIDEO_FOLDER, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw error;

    const videos = data.filter((file) => file.id).map((file) => ({
      id: file.id,
      title: file.name.replace(/^[0-9a-f-]{36}_/, ""),
      url: storage.getPublicUrl(`${VIDEO_FOLDER}/${file.name}`).data.publicUrl,
    }));

    return Response.json({ videos }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not list videos", error.message);
    return Response.json({ error: "Videos konnten nicht geladen werden." }, { status: 502 });
  }
}
