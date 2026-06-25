// Placeholder landing page. Reads the public env vars so you can confirm the
// frontend is wired to the backend API and PocketBase.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "(unset)";
const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "(unset)";

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Kreach</h1>
      <p>Frontend container is running.</p>
      <ul>
        <li>
          <code>NEXT_PUBLIC_API_URL</code>: {apiUrl}
        </li>
        <li>
          <code>NEXT_PUBLIC_POCKETBASE_URL</code>: {pocketbaseUrl}
        </li>
      </ul>
    </main>
  );
}
