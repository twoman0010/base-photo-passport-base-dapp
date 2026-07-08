import { NextResponse } from "next/server";

type UploadRequest = {
  imageDataUrl?: string;
  metadata?: {
    name?: string;
    description?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
};

function dataUrlToBlob(dataUrl: string) {
  const [header, payload] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const bytes = Buffer.from(payload ?? "", "base64");
  return new Blob([bytes], { type: mime });
}

async function pinJson(jwt: string, body: unknown) {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Pinata JSON upload failed: ${response.status}`);
  }

  return (await response.json()) as { IpfsHash: string };
}

async function pinFile(jwt: string, imageDataUrl: string, fileName: string) {
  const formData = new FormData();
  formData.append("file", dataUrlToBlob(imageDataUrl), fileName);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pinata file upload failed: ${response.status}`);
  }

  return (await response.json()) as { IpfsHash: string };
}

export async function POST(request: Request) {
  try {
    const jwt = process.env.PINATA_JWT;
    const body = (await request.json()) as UploadRequest;

    if (!jwt) {
      return NextResponse.json(
        {
          error:
            "PINATA_JWT is not configured. Add it in Vercel Environment Variables before production minting.",
        },
        { status: 400 },
      );
    }

    if (!body.imageDataUrl?.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        { error: "A PNG data URL is required." },
        { status: 400 },
      );
    }

    const safeName = (body.metadata?.name ?? "base-photo-passport")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const image = await pinFile(jwt, body.imageDataUrl, `${safeName}.png`);
    const token = await pinJson(jwt, {
      name: body.metadata?.name ?? "Base Photo Passport",
      description:
        body.metadata?.description ??
        "A personal photo identity NFT minted on Base.",
      image: `ipfs://${image.IpfsHash}`,
      attributes: body.metadata?.attributes ?? [],
    });

    return NextResponse.json({
      imageURI: `ipfs://${image.IpfsHash}`,
      tokenURI: `ipfs://${token.IpfsHash}`,
      gatewayImage: `https://gateway.pinata.cloud/ipfs/${image.IpfsHash}`,
      gatewayToken: `https://gateway.pinata.cloud/ipfs/${token.IpfsHash}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown IPFS upload error.",
      },
      { status: 500 },
    );
  }
}
