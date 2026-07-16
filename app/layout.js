export const metadata = {
  title: "Fingerprint Builders — Lead Management",
  description: "Internal lead management tool for Fingerprint Builders",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#0f1115",
          color: "#e8e8e8",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
