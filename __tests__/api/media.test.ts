import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import {
  clearAssetsFilePath,
  setAssetsFilePath,
  addAsset,
} from "@/lib/assets";

vi.mock("@/lib/pinata", () => ({
  getPinata: vi.fn(),
  PLAYBACK_URL_EXPIRES_SEC: 3600,
  PRESIGNED_UPLOAD_EXPIRES_SEC: 300,
  createSignedPlaybackUrl: vi.fn(),
  deleteFileFromPinata: vi.fn(),
  resolvePinataFileId: vi.fn(),
}));

vi.mock("@/lib/thumbnails", () => ({
  generateThumbnailFromBuffer: vi.fn().mockResolvedValue({
    thumbnailCid: "bafythumb",
    thumbnailPinataFileId: "thumb-file-id",
  }),
  generateThumbnailForAsset: vi.fn().mockResolvedValue({
    thumbnailCid: "bafythumb",
    thumbnailPinataFileId: "thumb-file-id",
  }),
  THUMBNAIL_MAX_WIDTH: 320,
  THUMBNAIL_MIME_TYPE: "image/webp",
}));

import { POST as uploadPost } from "@/app/api/upload/route";
import { GET as uploadUrlGet } from "@/app/api/upload/url/route";
import { GET as mediaGet } from "@/app/api/media/route";
import {
  DELETE as mediaCidDelete,
  GET as mediaCidGet,
} from "@/app/api/media/[cid]/route";
import {
  GET as thumbnailGet,
  POST as thumbnailPost,
} from "@/app/api/media/[cid]/thumbnail/route";
import { POST as mediaRegisterPost } from "@/app/api/media/register/route";
import {
  getPinata,
  createSignedPlaybackUrl,
  deleteFileFromPinata,
} from "@/lib/pinata";
import {
  generateThumbnailFromBuffer,
  generateThumbnailForAsset,
} from "@/lib/thumbnails";

const authHeader = { authorization: "Bearer test_secret_key" };

describe("API routes", () => {
  let tempDir: string;

  afterEach(async () => {
    clearAssetsFilePath();
    vi.clearAllMocks();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  async function setupAssetsStore() {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arkone-api-"));
    setAssetsFilePath(path.join(tempDir, "assets.json"));
  }

  it("POST /api/upload rejects unauthorized requests", async () => {
    const request = new NextRequest("http://localhost/api/upload", {
      method: "POST",
    });
    const response = await uploadPost(request);
    expect(response.status).toBe(401);
  });

  it("POST /api/upload uploads valid media and generates thumbnail", async () => {
    await setupAssetsStore();

    vi.mocked(getPinata).mockReturnValue({
      upload: {
        public: {
          file: vi.fn().mockResolvedValue({
            cid: "bafyupload",
            id: "pinata-file-id",
          }),
        },
      },
    } as never);

    const file = new File(["pixels"], "photo.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      headers: authHeader,
    });
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await uploadPost(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cid).toBe("bafyupload");
    expect(body.category).toBe("image");
    expect(generateThumbnailFromBuffer).toHaveBeenCalled();
  });

  it("POST /api/upload rejects invalid mime type", async () => {
    await setupAssetsStore();

    const file = new File(["text"], "notes.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      headers: authHeader,
    });
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await uploadPost(request);
    expect(response.status).toBe(400);
  });

  it("GET /api/upload/url returns presigned URL", async () => {
    vi.mocked(getPinata).mockReturnValue({
      upload: {
        public: {
          createSignedURL: vi
            .fn()
            .mockResolvedValue("https://uploads.pinata.cloud/signed"),
        },
      },
    } as never);

    const request = new NextRequest("http://localhost/api/upload/url", {
      headers: authHeader,
    });
    const response = await uploadUrlGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toContain("signed");
  });

  it("GET /api/media lists assets", async () => {
    await setupAssetsStore();

    const registerRequest = new NextRequest(
      "http://localhost/api/media/register",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          cid: "bafylist",
          name: "song.mp3",
          mimeType: "audio/mpeg",
        }),
      },
    );
    await mediaRegisterPost(registerRequest);

    const request = new NextRequest("http://localhost/api/media", {
      headers: authHeader,
    });
    const response = await mediaGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.assets).toHaveLength(1);
    expect(body.assets[0].cid).toBe("bafylist");
  });

  it("GET /api/media/[cid] returns signed playback URL", async () => {
    await setupAssetsStore();

    const registerRequest = new NextRequest(
      "http://localhost/api/media/register",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          cid: "bafyplay",
          name: "clip.mp4",
          mimeType: "video/mp4",
        }),
      },
    );
    await mediaRegisterPost(registerRequest);

    vi.mocked(createSignedPlaybackUrl).mockResolvedValue(
      "https://gateway.example/files/bafyplay?sig=abc",
    );

    const request = new NextRequest("http://localhost/api/media/bafyplay", {
      headers: authHeader,
    });
    const response = await mediaCidGet(request, {
      params: Promise.resolve({ cid: "bafyplay" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toContain("bafyplay");
    expect(body.expiresIn).toBe(3600);
  });

  it("GET /api/media/[cid] returns 404 for unknown cid", async () => {
    await setupAssetsStore();

    const request = new NextRequest("http://localhost/api/media/missing", {
      headers: authHeader,
    });
    const response = await mediaCidGet(request, {
      params: Promise.resolve({ cid: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("GET /api/media/[cid]/thumbnail returns signed thumbnail URL", async () => {
    await setupAssetsStore();

    await addAsset({
      cid: "bafyimage",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
      thumbnailCid: "bafythumb",
    });

    vi.mocked(createSignedPlaybackUrl).mockResolvedValue(
      "https://gateway.example/files/bafythumb?sig=abc",
    );

    const request = new NextRequest(
      "http://localhost/api/media/bafyimage/thumbnail",
      { headers: authHeader },
    );
    const response = await thumbnailGet(request, {
      params: Promise.resolve({ cid: "bafyimage" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.thumbnailCid).toBe("bafythumb");
    expect(body.url).toContain("bafythumb");
  });

  it("POST /api/media/[cid]/thumbnail generates thumbnail", async () => {
    await setupAssetsStore();

    await addAsset({
      cid: "bafygen",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
    });

    const request = new NextRequest(
      "http://localhost/api/media/bafygen/thumbnail",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );
    const response = await thumbnailPost(request, {
      params: Promise.resolve({ cid: "bafygen" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.thumbnailCid).toBe("bafythumb");
    expect(generateThumbnailForAsset).toHaveBeenCalled();
  });

  it("DELETE /api/media/[cid] deletes asset from Pinata and registry", async () => {
    await setupAssetsStore();

    const registerRequest = new NextRequest(
      "http://localhost/api/media/register",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          cid: "bafydelete",
          name: "photo.jpg",
          mimeType: "image/jpeg",
          pinataFileId: "pinata-file-id",
        }),
      },
    );
    await mediaRegisterPost(registerRequest);

    vi.mocked(deleteFileFromPinata).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost/api/media/bafydelete", {
      method: "DELETE",
      headers: authHeader,
    });
    const response = await mediaCidDelete(request, {
      params: Promise.resolve({ cid: "bafydelete" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deleted).toBe(true);
    expect(deleteFileFromPinata).toHaveBeenCalledWith(
      "bafydelete",
      "pinata-file-id",
    );

    const listRequest = new NextRequest("http://localhost/api/media", {
      headers: authHeader,
    });
    const listResponse = await mediaGet(listRequest);
    const listBody = await listResponse.json();

    expect(listBody.assets).toHaveLength(0);
  });

  it("DELETE /api/media/[cid] deletes thumbnail when present", async () => {
    await setupAssetsStore();

    await addAsset({
      cid: "bafywiththumb",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
      pinataFileId: "pinata-file-id",
      thumbnailCid: "bafythumb",
      thumbnailPinataFileId: "thumb-file-id",
    });

    vi.mocked(deleteFileFromPinata).mockResolvedValue(undefined);

    const request = new NextRequest(
      "http://localhost/api/media/bafywiththumb",
      {
        method: "DELETE",
        headers: authHeader,
      },
    );
    await mediaCidDelete(request, {
      params: Promise.resolve({ cid: "bafywiththumb" }),
    });

    expect(deleteFileFromPinata).toHaveBeenCalledWith(
      "bafywiththumb",
      "pinata-file-id",
    );
    expect(deleteFileFromPinata).toHaveBeenCalledWith(
      "bafythumb",
      "thumb-file-id",
    );
  });

  it("DELETE /api/media/[cid] returns 404 for unknown cid", async () => {
    await setupAssetsStore();

    const request = new NextRequest("http://localhost/api/media/missing", {
      method: "DELETE",
      headers: authHeader,
    });
    const response = await mediaCidDelete(request, {
      params: Promise.resolve({ cid: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("POST /api/media/register validates required fields", async () => {
    await setupAssetsStore();

    const request = new NextRequest("http://localhost/api/media/register", {
      method: "POST",
      headers: {
        ...authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify({ cid: "only-cid" }),
    });

    const response = await mediaRegisterPost(request);
    expect(response.status).toBe(400);
  });
});
