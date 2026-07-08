import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import solc from "solc";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(join(root, ".env.local"));

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("Missing DEPLOYER_PRIVATE_KEY in .env.local or shell env.");
}

const account = privateKeyToAccount(
  privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
);

const sourcePath = join(root, "contracts", "BasePhotoPassport.sol");
const source = readFileSync(sourcePath, "utf8");

function findImport(importPath) {
  const candidates = [
    join(root, "node_modules", importPath),
    join(root, "contracts", importPath),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return { contents: readFileSync(candidate, "utf8") };
    }
  }

  return { error: `File not found: ${importPath}` };
}

const input = {
  language: "Solidity",
  sources: {
    "BasePhotoPassport.sol": {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(
  solc.compile(JSON.stringify(input), { import: findImport }),
);
const errors = output.errors?.filter((item) => item.severity === "error") ?? [];
if (errors.length) {
  throw new Error(errors.map((item) => item.formattedMessage).join("\n"));
}

const contract = output.contracts["BasePhotoPassport.sol"].BasePhotoPassport;
const bytecode = `0x${contract.evm.bytecode.object}`;
const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";

const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(rpcUrl),
});

console.log(`Deploying BasePhotoPassport from ${account.address} on Base...`);

const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode,
  args: [account.address],
});

console.log(`Transaction: https://basescan.org/tx/${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(`Contract: ${receipt.contractAddress}`);
console.log(
  "Set NEXT_PUBLIC_PHOTO_PASSPORT_CONTRACT_ADDRESS to this contract address in Vercel.",
);
