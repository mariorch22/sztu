"use client";

import { useEffect, useRef, useState } from "react";
import { describeUploadError, getVideoStorage, MAX_VIDEO_MIB, VIDEO_FOLDER, VIDEO_TYPES } from "./video-storage";

function VideoPreview({ file }) {
  const player = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    player.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <video ref={player} aria-label="Vorschau" controls playsInline preload="auto" />;
}

export default function VideoList() {
  const picker = useRef(null);
  const [videos, setVideos] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selection, setSelection] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVideos() {
      try {
        const response = await fetch("/api/videos", { signal: controller.signal });
        if (!response.ok) throw new Error("Video request failed");

        const { videos } = await response.json();
        if (!Array.isArray(videos)) throw new Error("Invalid video list");
        if (!controller.signal.aborted) {
          setVideos(videos);
          setFailed(false);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }

    loadVideos();
    return () => controller.abort();
  }, [attempt]);

  function refreshVideos() {
    setFailed(false);
    setAttempt((previous) => previous + 1);
  }

  function selectVideo(file) {
    if (!file || uploading) return;

    const dot = file.name.lastIndexOf(".");
    const extension = dot < 0 ? "" : file.name.slice(dot + 1).toLowerCase();

    if (!Object.hasOwn(VIDEO_TYPES, extension) || !file.size) {
      setSelection(null);
      setUploadFeedback({ error: true, text: "Wähle eine MP4- oder WebM-Datei." });
      return;
    }
    if (file.size > MAX_VIDEO_MIB * 1024 * 1024) {
      setSelection(null);
      setUploadFeedback({ error: true, text: `Das Video ist größer als ${MAX_VIDEO_MIB} MiB.` });
      return;
    }

    setSelection({ file, dot, extension });
    setUploadFeedback(null);
  }

  async function uploadVideo(event) {
    event.preventDefault();
    if (!selection || uploading) return;

    const { file, dot, extension } = selection;
    const title = file.name.slice(0, dot).normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .replace(/ß/g, "ss")
      .replace(/[^\w. -]/g, "_")
      .trim()
      .slice(0, 100);

    setUploading(true);
    setUploadFeedback(null);

    try {
      const path = `${VIDEO_FOLDER}/${crypto.randomUUID()}_${title || "Video"}.${extension}`;
      const video = file.slice(0, file.size, VIDEO_TYPES[extension]);
      const { error } = await getVideoStorage().upload(path, video);
      if (error) throw error;

      setSelection(null);
      setUploadFeedback({ text: "Video hochgeladen." });
      refreshVideos();
    } catch (error) {
      setUploadFeedback({ error: true, text: describeUploadError(error) });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <section className="hero" id="upload" aria-labelledby="upload-title">
        <header className="masthead wrap">
          <a className="brand" href="#upload">
            <span className="brand-mark" aria-hidden="true" />
            Video-App
          </a>
          <nav aria-label="Seitennavigation">
            <a className="text-link" href="#mediathek">
              Mediathek <span aria-hidden="true">↘</span>
            </a>
          </nav>
        </header>

        <div className="hero-layout wrap" data-enter>
          <div className="hero-copy">
            <h1 id="upload-title">Videos<br />hochladen</h1>
            <p>Hochgeladene Clips sind öffentlich abrufbar und lassen sich direkt in der Mediathek abspielen.</p>
          </div>

          <form className="app-frame" onSubmit={uploadVideo} aria-label="Video-Upload">
            <div className="frame-header">
              <span className="frame-filename" title={selection?.file.name}>
                {selection ? selection.file.name : "Videodatei"}
              </span>
              <span className="file-formats">{selection ? selection.extension.toUpperCase() : "MP4 / WebM"}</span>
            </div>

            <div
              className="viewfinder"
              data-dragging={dragging ? "true" : undefined}
              onDragOver={(event) => {
                if (!event.dataTransfer.types.includes("Files")) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = uploading ? "none" : "copy";
                if (!uploading) setDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectVideo(event.dataTransfer.files[0]);
              }}
            >
              {selection ? <VideoPreview file={selection.file} /> : (
                <div className="viewfinder-instruction">
                  <span className="upload-symbol" aria-hidden="true">↑</span>
                  <span>Video hier ablegen</span>
                </div>
              )}
            </div>

            <div className="frame-footer">
              <input
                ref={picker}
                type="file"
                accept=".mp4,.webm"
                aria-label="Videodatei auswählen"
                disabled={uploading}
                onChange={(event) => {
                  selectVideo(event.currentTarget.files[0]);
                  event.currentTarget.value = "";
                }}
                hidden
              />
              {selection ? (
                <button className="button button-secondary" type="button" disabled={uploading}
                  onClick={() => picker.current.click()}>Datei wechseln</button>
              ) : <span className="file-formats" id="upload-limits">Bis {MAX_VIDEO_MIB} MiB</span>}
              {selection ? (
                <button className="button button-primary" type="submit" disabled={uploading}>
                  {uploading ? "Wird hochgeladen …" : "Video hochladen"}
                </button>
              ) : (
                <button className="button button-primary" type="button" aria-describedby="upload-limits"
                  onClick={() => picker.current.click()}>Datei auswählen <span aria-hidden="true">↗</span></button>
              )}
            </div>
            {uploadFeedback && (
              <p className="upload-feedback" role={uploadFeedback.error ? "alert" : "status"}>
                {uploadFeedback.text}
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="library" id="mediathek" aria-labelledby="library-title">
        <div className="wrap">
          <div className="library-header">
            <h2 id="library-title">Mediathek</h2>
            {videos && <span className="library-count">{videos.length} {videos.length === 1 ? "Video" : "Videos"}</span>}
          </div>
          {failed ? (
            <div className="library-state">
              <p role="alert">Die Videos konnten nicht geladen werden.</p>
              <button className="button button-secondary" type="button" onClick={refreshVideos}>
                Videos erneut laden
              </button>
            </div>
          ) : !videos?.length && (
            <div className="library-state">
              <p role="status">{videos ? "In der Mediathek sind noch keine Videos." : "Videos werden geladen …"}</p>
              {videos && <a className="text-link" href="#upload">Zum Upload <span aria-hidden="true">↑</span></a>}
            </div>
          )}
          {!!videos?.length && (
            <ul className="video-grid">
              {videos.map((video) => (
                <li key={video.id} className="video-card">
                  <h3>{video.title}</h3>
                  <video src={video.url} aria-label={video.title} controls playsInline preload="metadata" loading="lazy" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
