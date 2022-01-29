import { PublicKey } from "@solana/web3.js";

export const VERIFIED_CREATOR = new PublicKey(
  "AHx6cQKhJQ6vV9zhb37B7gKtRRGDuLtTfNWgvMiLDJp7"
);

export const TOKEN_TO_SEND = new PublicKey(
  "5gCuvpcxHUdZ3sEFDodjEAcxKBvp7TDMkfLT9veKsg4e"
);

export const TOKEN_DECIMALS = 9;

export const AMOUNT_TO_SEND = 42 * 10 ** TOKEN_DECIMALS; // including decimals

export const PROGRESS_FILE_PATH = `${__dirname}/../../progress.json`;
