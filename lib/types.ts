import type { MediaCategory } from "./media-types";

export interface Asset {
  cid: string;
  name: string;
  mimeType: string;
  category: MediaCategory;
  uploadedAt: string;
  pinataFileId?: string;
  thumbnailCid?: string;
  thumbnailPinataFileId?: string;
}
