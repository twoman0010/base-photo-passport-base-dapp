"use client";

import {
  BadgeCheck,
  Camera,
  Check,
  ExternalLink,
  ImagePlus,
  Loader2,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  type FrameStyle,
  type PassportRole,
  framePalettes,
  photoPassportAbi,
  photoPassportContractAddress,
  roleCopy,
} from "@/lib/photo-passport";

type UploadResult = {
  tokenURI: string;
  imageURI: string;
  gatewayImage: string;
  gatewayToken: string;
};

const roles: PassportRole[] = ["Builder", "Creator", "Collector", "Supporter"];
const frames: FrameStyle[] = ["studio", "gallery", "signal", "archive"];

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function PhotoPassportApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const [name, setName] = useState("Base Native");
  const [caption, setCaption] = useState("Minted my photo identity on Base.");
  const [role, setRole] = useState<PassportRole>("Creator");
  const [frame, setFrame] = useState<FrameStyle>("studio");
  const [photoUrl, setPhotoUrl] = useState("");
  const [canvasUrl, setCanvasUrl] = useState("");
  const [ownsRights, setOwnsRights] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [status, setStatus] = useState("");
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: mintPending,
    error: mintError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const palette = framePalettes[frame];
  const canMint =
    Boolean(photoPassportContractAddress) &&
    Boolean(uploadResult?.tokenURI) &&
    ownsRights &&
    isConnected &&
    chainId === base.id;

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }

  const drawPassport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 1600;

    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(23, 23, 23, 0.18)";
    ctx.lineWidth = 3;
    for (let x = 80; x < canvas.width; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 80; y < canvas.height; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(84, 84, 1032, 1432);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 8;
    ctx.strokeRect(84, 84, 1032, 1432);

    ctx.fillStyle = palette.accent;
    ctx.fillRect(84, 84, 1032, 154);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px Arial";
    ctx.fillText("BASE PHOTO PASSPORT", 132, 182);

    ctx.fillStyle = palette.soft;
    ctx.fillRect(132, 294, 936, 844);

    if (previewImageRef.current) {
      const image = previewImageRef.current;
      const imageRatio = image.width / image.height;
      const boxRatio = 936 / 844;
      let sourceWidth = image.width;
      let sourceHeight = image.height;
      let sourceX = 0;
      let sourceY = 0;

      if (imageRatio > boxRatio) {
        sourceWidth = image.height * boxRatio;
        sourceX = (image.width - sourceWidth) / 2;
      } else {
        sourceHeight = image.width / boxRatio;
        sourceY = (image.height - sourceHeight) / 2;
      }

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        132,
        294,
        936,
        844,
      );
    } else {
      ctx.fillStyle = palette.soft;
      ctx.fillRect(132, 294, 936, 844);
      ctx.fillStyle = palette.ink;
      ctx.font = "700 68px Arial";
      ctx.fillText("ADD PHOTO", 404, 700);
      ctx.font = "400 34px Arial";
      ctx.fillText("Your NFT preview appears here", 360, 762);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fillRect(132, 1020, 936, 118);
    ctx.fillStyle = palette.ink;
    ctx.font = "700 58px Arial";
    ctx.fillText(name.slice(0, 24) || "Base Native", 170, 1095);

    ctx.fillStyle = palette.ink;
    ctx.font = "700 46px Arial";
    ctx.fillText(role.toUpperCase(), 132, 1238);
    ctx.fillStyle = palette.accent;
    ctx.font = "700 38px Arial";
    ctx.fillText(roleCopy[role], 132, 1296);

    ctx.fillStyle = palette.ink;
    ctx.font = "400 36px Arial";
    ctx.fillText(caption.slice(0, 46), 132, 1382);

    ctx.fillStyle = palette.accent;
    ctx.fillRect(840, 1210, 228, 228);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 82px Arial";
    ctx.fillText("BASE", 862, 1338);

    ctx.fillStyle = palette.ink;
    ctx.font = "400 28px Arial";
    ctx.fillText("Minted on Base", 132, 1462);
    ctx.fillText(new Date().toISOString().slice(0, 10), 840, 1462);

    setCanvasUrl(canvas.toDataURL("image/png"));
  }, [caption, name, palette, role]);

  useEffect(() => {
    void drawPassport();
  }, [drawPassport]);

  useEffect(() => {
    if (!photoUrl) {
      previewImageRef.current = null;
      void drawPassport();
      return;
    }

    const image = new Image();
    image.onload = () => {
      previewImageRef.current = image;
      void drawPassport();
    };
    image.src = photoUrl;
  }, [drawPassport, photoUrl]);

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setStatus("Use an image under 8 MB for a faster mobile mint.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setUploadResult(null);
    setStatus("Photo loaded. Adjust the passport and upload to IPFS.");
  }

  async function uploadToIpfs() {
    if (!canvasUrl) return;

    setUploading(true);
    setStatus("Uploading image and metadata to IPFS...");
    setUploadResult(null);

    try {
      const response = await fetch("/api/ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: canvasUrl,
          metadata: {
            name: `${name || "Base Native"} Photo Passport`,
            description:
              caption || "A personal photo identity NFT minted on Base.",
            attributes: [
              { trait_type: "Role", value: role },
              { trait_type: "Frame", value: framePalettes[frame].label },
              { trait_type: "Network", value: "Base" },
            ],
          },
        }),
      });

      const result = (await response.json()) as UploadResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "IPFS upload failed.");
      }

      setUploadResult(result);
      setStatus("IPFS upload ready. Mint the passport NFT on Base.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not upload to IPFS.",
      );
    } finally {
      setUploading(false);
    }
  }

  function mintPassport() {
    if (!photoPassportContractAddress || !uploadResult?.tokenURI) return;

    writeContract({
      address: photoPassportContractAddress,
      abi: photoPassportAbi,
      functionName: "mint",
      args: [uploadResult.tokenURI],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen px-4 py-5 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b-2 border-neutral-950 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-neutral-950 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
              <Camera className="h-4 w-4" />
              Base Photo Passport
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[0.95] sm:text-6xl">
              Turn a photo into an onchain identity NFT.
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isConnected ? (
              <>
                <span className="border-2 border-neutral-950 bg-white px-3 py-2 font-mono text-sm font-bold">
                  {shortAddress(address)}
                </span>
                <button
                  className="border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-sm font-black text-white shadow-[4px_4px_0_#0052ff] disabled:opacity-60"
                  disabled={disconnecting}
                  onClick={disconnectWallet}
                >
                  {disconnecting ? "Disconnecting" : "Disconnect"}
                </button>
              </>
            ) : (
              <button
                className="inline-flex items-center gap-2 border-2 border-neutral-950 bg-[#0052ff] px-4 py-2 text-sm font-black text-white shadow-[4px_4px_0_#171717] disabled:opacity-60"
                disabled={availableConnectors.length === 0 || connecting}
                onClick={connectWallet}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Connect
              </button>
            )}
            {walletStatus ? (
              <p className="basis-full text-right text-xs font-bold text-neutral-700 md:max-w-sm">
                {walletStatus}
              </p>
            ) : null}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]">
          <div className="flex flex-col gap-5">
            <div className="border-2 border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#171717]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">Photo</h2>
                <ImagePlus className="h-5 w-5" />
              </div>

              <label className="flex min-h-40 flex-col items-center justify-center gap-3 border-2 border-dashed border-neutral-950 bg-[#f7f4ec] px-4 py-8 text-center">
                <Upload className="h-8 w-8" />
                <span className="text-lg font-black">Upload your photo</span>
                <span className="max-w-xs text-sm font-semibold text-neutral-600">
                  JPG, PNG, or WebP under 8 MB. Use an image you own.
                </span>
                <input
                  accept="image/*"
                  className="sr-only"
                  type="file"
                  onChange={handlePhoto}
                />
              </label>
            </div>

            <div className="border-2 border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#0052ff]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">Passport Details</h2>
                <Palette className="h-5 w-5" />
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em]">
                    Display name
                  </span>
                  <input
                    className="border-2 border-neutral-950 bg-[#f7f4ec] px-3 py-3 text-base font-bold outline-none focus:bg-white"
                    maxLength={24}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em]">
                    Caption
                  </span>
                  <input
                    className="border-2 border-neutral-950 bg-[#f7f4ec] px-3 py-3 text-base font-bold outline-none focus:bg-white"
                    maxLength={46}
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                  />
                </label>

                <div className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em]">
                    Identity
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((item) => (
                      <button
                        className={`border-2 border-neutral-950 px-3 py-3 text-left font-black ${
                          role === item
                            ? "bg-neutral-950 text-white"
                            : "bg-[#f7f4ec] text-neutral-950"
                        }`}
                        key={item}
                        onClick={() => setRole(item)}
                        type="button"
                      >
                        {item}
                        <span className="block text-xs font-bold opacity-70">
                          {roleCopy[item]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em]">
                    Frame
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {frames.map((item) => (
                      <button
                        aria-label={framePalettes[item].label}
                        className={`h-14 border-2 border-neutral-950 ${
                          frame === item ? "ring-4 ring-[#0052ff]" : ""
                        }`}
                        key={item}
                        onClick={() => setFrame(item)}
                        style={{
                          background: `linear-gradient(135deg, ${framePalettes[item].background} 0 48%, ${framePalettes[item].accent} 48% 100%)`,
                        }}
                        title={framePalettes[item].label}
                        type="button"
                      />
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 border-2 border-neutral-950 bg-[#ecfdf5] p-3">
                  <input
                    checked={ownsRights}
                    className="mt-1 h-5 w-5 accent-[#0052ff]"
                    type="checkbox"
                    onChange={(event) => setOwnsRights(event.target.checked)}
                  />
                  <span className="text-sm font-bold">
                    I own the rights to this image and want to mint it as a
                    personal NFT on Base.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="border-2 border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#d84315]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">NFT Preview</h2>
                  <p className="text-sm font-semibold text-neutral-600">
                    The generated image is uploaded to IPFS before minting.
                  </p>
                </div>
                <button
                  aria-label="Refresh preview"
                  className="border-2 border-neutral-950 bg-[#f7f4ec] p-2"
                  onClick={() => void drawPassport()}
                  title="Refresh preview"
                  type="button"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="overflow-hidden border-2 border-neutral-950 bg-[#f7f4ec]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Generated Base Photo Passport NFT preview"
                    className="aspect-[3/4] w-full object-cover"
                    src={canvasUrl || undefined}
                  />
                  <canvas className="hidden" ref={canvasRef} />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="border-2 border-neutral-950 bg-[#f7f4ec] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em]">
                      Mint readiness
                    </p>
                    <div className="mt-3 grid gap-2 text-sm font-bold">
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-700" />
                        Preview generated
                      </p>
                      <p className="flex items-center gap-2">
                        {photoUrl ? (
                          <Check className="h-4 w-4 text-emerald-700" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-neutral-500" />
                        )}
                        Personal photo
                      </p>
                      <p className="flex items-center gap-2">
                        {uploadResult ? (
                          <Check className="h-4 w-4 text-emerald-700" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-neutral-500" />
                        )}
                        IPFS metadata
                      </p>
                      <p className="flex items-center gap-2">
                        {photoPassportContractAddress ? (
                          <Check className="h-4 w-4 text-emerald-700" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-neutral-500" />
                        )}
                        Contract address
                      </p>
                    </div>
                  </div>

                  <button
                    className="inline-flex items-center justify-center gap-2 border-2 border-neutral-950 bg-white px-4 py-3 text-sm font-black shadow-[4px_4px_0_#171717] disabled:opacity-50"
                    disabled={!canvasUrl || !photoUrl || uploading}
                    onClick={uploadToIpfs}
                    type="button"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload IPFS
                  </button>

                  {chainId !== base.id && isConnected ? (
                    <button
                      className="inline-flex items-center justify-center gap-2 border-2 border-neutral-950 bg-[#0052ff] px-4 py-3 text-sm font-black text-white shadow-[4px_4px_0_#171717] disabled:opacity-50"
                      disabled={switching}
                      onClick={() => switchChain({ chainId: base.id })}
                      type="button"
                    >
                      {switching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Switch Base
                    </button>
                  ) : (
                    <button
                      className="inline-flex items-center justify-center gap-2 border-2 border-neutral-950 bg-[#0052ff] px-4 py-3 text-sm font-black text-white shadow-[4px_4px_0_#171717] disabled:opacity-50"
                      disabled={!canMint || mintPending || confirming}
                      onClick={mintPassport}
                      type="button"
                    >
                      {mintPending || confirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="h-4 w-4" />
                      )}
                      Mint NFT
                    </button>
                  )}

                  {uploadResult ? (
                    <a
                      className="inline-flex items-center justify-center gap-2 border-2 border-neutral-950 bg-[#ecfdf5] px-4 py-3 text-sm font-black"
                      href={uploadResult.gatewayToken}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Metadata
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-2 border-neutral-950 bg-neutral-950 p-4 text-white shadow-[6px_6px_0_#0052ff]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#9ff6cf]" />
                <h2 className="text-lg font-black">Mint Status</h2>
              </div>

              <p className="min-h-6 text-sm font-semibold text-neutral-200">
                {confirmed
                  ? "Mint confirmed. Your Base Photo Passport is onchain."
                  : mintError
                    ? mintError.message
                    : status ||
                      "Upload a photo, generate the passport, then upload to IPFS and mint."}
              </p>

              {hash ? (
                <a
                  className="inline-flex w-fit items-center gap-2 border-2 border-white px-3 py-2 text-sm font-black"
                  href={`https://basescan.org/tx/${hash}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  View transaction
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              {!photoPassportContractAddress ? (
                    <p className="border border-white/30 bg-white/10 p-3 text-xs font-semibold text-neutral-200">
                      Add NEXT_PUBLIC_PHOTO_PASSPORT_CONTRACT_ADDRESS in Vercel
                      after deploying the NFT contract. Add PINATA_JWT for IPFS
                      uploads, and NEXT_PUBLIC_BASE_APP_ID for Base App domain
                      verification.
                    </p>
                  ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
