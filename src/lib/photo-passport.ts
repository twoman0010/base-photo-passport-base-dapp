import type { Address } from "viem";

export const photoPassportAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenURI", type: "string" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;

export const photoPassportContractAddress =
  process.env.NEXT_PUBLIC_PHOTO_PASSPORT_CONTRACT_ADDRESS as
    | Address
    | undefined;

export type PassportRole =
  | "Builder"
  | "Creator"
  | "Collector"
  | "Supporter";

export type FrameStyle = "studio" | "gallery" | "signal" | "archive";

export const roleCopy: Record<PassportRole, string> = {
  Builder: "Ships on Base",
  Creator: "Mints culture",
  Collector: "Curates moments",
  Supporter: "Backs people",
};

export const framePalettes: Record<
  FrameStyle,
  {
    label: string;
    background: string;
    ink: string;
    accent: string;
    soft: string;
  }
> = {
  studio: {
    label: "Studio",
    background: "#f7f4ec",
    ink: "#171717",
    accent: "#0052ff",
    soft: "#d7e2ff",
  },
  gallery: {
    label: "Gallery",
    background: "#fff8f0",
    ink: "#27130b",
    accent: "#d84315",
    soft: "#f6d7bc",
  },
  signal: {
    label: "Signal",
    background: "#ecfdf5",
    ink: "#052e24",
    accent: "#047857",
    soft: "#b7f2d2",
  },
  archive: {
    label: "Archive",
    background: "#f4f4f5",
    ink: "#18181b",
    accent: "#52525b",
    soft: "#d4d4d8",
  },
};
