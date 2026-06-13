import "./ensure-pinata-tls";
import { PinataSDK } from "pinata";

function getPinataConfig() {
  const pinataJwt = process.env.PINATA_JWT;
  const pinataGateway = process.env.PINATA_GATEWAY;

  if (!pinataJwt || !pinataGateway) {
    throw new Error("PINATA_JWT and PINATA_GATEWAY must be set");
  }

  return { pinataJwt, pinataGateway };
}

let pinataInstance: PinataSDK | null = null;

export function getPinata(): PinataSDK {
  if (!pinataInstance) {
    const { pinataJwt, pinataGateway } = getPinataConfig();
    pinataInstance = new PinataSDK({
      pinataJwt,
      pinataGateway,
    });
  }

  return pinataInstance;
}

export async function createSignedPlaybackUrl(cid: string): Promise<string> {
  const pinata = getPinata();
  const expiresIn = 3600;
  const url = await pinata.gateways.private.createAccessLink({
    cid,
    expires: expiresIn,
  });
  return url;
}

export const PLAYBACK_URL_EXPIRES_SEC = 3600;
export const PRESIGNED_UPLOAD_EXPIRES_SEC = 300;

export async function resolvePinataFileId(
  cid: string,
  pinataFileId?: string,
): Promise<string> {
  if (pinataFileId) {
    return pinataFileId;
  }

  const pinata = getPinata();
  const files = await pinata.files.public.list().cid(cid).all();
  const match = files.find((file) => file.cid === cid);

  if (!match) {
    throw new Error(`No Pinata file found for CID ${cid}`);
  }

  return match.id;
}

export async function deleteFileFromPinata(
  cid: string,
  pinataFileId?: string,
): Promise<void> {
  const fileId = await resolvePinataFileId(cid, pinataFileId);
  const pinata = getPinata();
  await pinata.files.public.delete([fileId]);
}
