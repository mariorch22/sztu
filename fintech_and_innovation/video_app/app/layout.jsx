import "./globals.css";

export const metadata = {
  title: "Video-App · Upload und Mediathek",
  description: "MP4- und WebM-Videos hochladen und in der öffentlichen Mediathek abspielen.",
  applicationName: "Video-App",
  openGraph: {
    title: "Video-App · Upload und Mediathek",
    description: "MP4- und WebM-Videos hochladen und in der öffentlichen Mediathek abspielen.",
    type: "website",
  },
  other: { "page-type": "software", "site-kind": "software" },
};

export const viewport = { themeColor: "#171a18" };

export default function RootLayout({ children }) {
  return (
    <html lang="de" data-type="software" data-radius="soft" data-buttons="solid" data-motion="quiet">
      <body>{children}</body>
    </html>
  );
}
