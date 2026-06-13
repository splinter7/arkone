import Link from "next/link";
import { ArkOneLogo } from "@/components/ArkOneLogo";

function Method({ children }: { children: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    POST: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold ${colors[children] ?? ""}`}
    >
      {children}
    </span>
  );
}

function Endpoint({
  method,
  path,
  title,
  description,
  children,
}: {
  method: string;
  path: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-neutral-200 pb-10 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-3">
        <Method>{method}</Method>
        <code className="font-mono text-sm">{path}</code>
      </div>
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
      {children}
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-neutral-100 p-4 font-mono text-xs leading-relaxed dark:bg-neutral-900">
      {children}
    </pre>
  );
}

export default function DocsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <div className="space-y-2">
          <ArkOneLogo />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            API reference
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/"
            className="text-sm text-neutral-500 underline-offset-4 transition-colors duration-150 hover:underline dark:text-neutral-400"
          >
            Back to app
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Authentication</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Every endpoint requires a Bearer token matching your{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-900">
            API_SECRET_KEY
          </code>{" "}
          environment variable.
        </p>
        <Code>{`Authorization: Bearer <API_SECRET_KEY>`}</Code>
      </section>

      <Endpoint
        method="POST"
        path="/api/upload"
        title="Upload a file"
        description="Upload a small image, video, or audio file via multipart form data. For large files, use the presigned URL flow below."
      >
        <Code>{`curl -X POST http://localhost:3000/api/upload \\
  -H "Authorization: Bearer your_secret" \\
  -F "file=@photo.jpg"`}</Code>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api/upload/url"
        title="Get presigned upload URL"
        description="Returns a signed URL for uploading large files directly to Pinata. Upload to the returned URL, then register the CID."
      >
        <Code>{`curl http://localhost:3000/api/upload/url \\
  -H "Authorization: Bearer your_secret"`}</Code>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Response:{" "}
          <code className="font-mono text-xs">{`{ "url": "...", "expiresSec": 300 }`}</code>
        </p>
      </Endpoint>

      <Endpoint
        method="POST"
        path="/api/media/register"
        title="Register an uploaded asset"
        description="Records a CID after uploading directly to a presigned Pinata URL."
      >
        <Code>{`curl -X POST http://localhost:3000/api/media/register \\
  -H "Authorization: Bearer your_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"cid":"bafy...","name":"clip.mp4","mimeType":"video/mp4"}'`}</Code>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api/media"
        title="List all assets"
        description="Returns every registered media asset."
      >
        <Code>{`curl http://localhost:3000/api/media \\
  -H "Authorization: Bearer your_secret"`}</Code>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Response:{" "}
          <code className="font-mono text-xs">{`{ "assets": [...] }`}</code>
        </p>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api/media/{cid}"
        title="Get signed playback URL"
        description="Returns a time-limited signed gateway URL for streaming or downloading the asset."
      >
        <Code>{`curl http://localhost:3000/api/media/bafybeig... \\
  -H "Authorization: Bearer your_secret"`}</Code>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Response:{" "}
          <code className="font-mono text-xs">
            {`{ "cid", "name", "mimeType", "category", "url", "expiresIn" }`}
          </code>
        </p>
      </Endpoint>

      <Endpoint
        method="DELETE"
        path="/api/media/{cid}"
        title="Delete an asset"
        description="Removes the file from Pinata and deletes the local asset record."
      >
        <Code>{`curl -X DELETE http://localhost:3000/api/media/bafybeig... \\
  -H "Authorization: Bearer your_secret"`}</Code>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Response:{" "}
          <code className="font-mono text-xs">{`{ "cid": "...", "deleted": true }`}</code>
        </p>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api/media/{cid}/thumbnail"
        title="Get signed thumbnail URL"
        description="Returns a time-limited signed gateway URL for the asset thumbnail."
      >
        <Code>{`curl http://localhost:3000/api/media/bafybeig.../thumbnail \\
  -H "Authorization: Bearer your_secret"`}</Code>
      </Endpoint>

      <Endpoint
        method="POST"
        path="/api/media/{cid}/thumbnail"
        title="Generate thumbnail"
        description={`Generates a WebP thumbnail for an asset. Pass { "force": true } to regenerate an existing thumbnail.`}
      >
        <Code>{`curl -X POST http://localhost:3000/api/media/bafybeig.../thumbnail \\
  -H "Authorization: Bearer your_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"force":false}'`}</Code>
      </Endpoint>
    </main>
  );
}
