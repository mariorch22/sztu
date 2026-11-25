import VideoList from "./video-list";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#inhalt">Zum Inhalt</a>
      <main id="inhalt" tabIndex={-1}>
        <VideoList />
      </main>
    </>
  );
}
