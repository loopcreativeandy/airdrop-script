import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  Connection,
  Cluster,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from "@solana/web3.js";

import fs from "fs";

import { TokenInfo } from "./prepareAirdrop";
import { readJson, writeJson } from "./utils/file";
import { config } from "dotenv";

const MAGIC_EDEN_ADDRESS = "GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp";

async function sendToken(
  connection: Connection,
  { sendableAmount, sendableTokenMint, owner }: TokenInfo,
  sender: Keypair
): Promise<string | undefined> {
  if (!sendableAmount || !sendableTokenMint || !owner) return undefined;

  const mint = new PublicKey(sendableTokenMint);
  const receiver = new PublicKey(owner);

  const transaction = new Transaction();

  const destinationAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    receiver
  );

  const sourceAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    sender.publicKey
  );

  const destinationAccountInfo = await connection.getAccountInfo(
    destinationAccount
  );

  if (!destinationAccountInfo) {
    console.log("creating token account...");

    const createATAinstruction = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      destinationAccount,
      receiver,
      sender.publicKey
    );

    transaction.add(createATAinstruction);
  }

  const transferInstruction = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    sourceAccount,
    destinationAccount,
    sender.publicKey,
    [],
    sendableAmount
  );

  transaction.add(transferInstruction);

  console.log(
    "Sending from",
    sourceAccount.toBase58(),
    "to",
    destinationAccount.toBase58()
  );

  const txid = await sendAndConfirmTransaction(connection, transaction, [
    sender,
  ]);

  return txid;
}

export function loadWalletKey(keypairFile: string): Keypair {
  if (!keypairFile || keypairFile == "") {
    throw new Error("Keypair is required!");
  }
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString()))
  );
  console.log(`Using wallet: ${loaded.publicKey}`);
  return loaded;
}

(async function main() {
  config();

  const rpcHost = clusterApiUrl(process.env.RPC_ENV! as Cluster);
  const connection = new Connection(rpcHost);

  const allInfo = readJson();

  const myKeypairFile = process.env.KEYPAIR_PATH;

  if (!myKeypairFile) throw new Error("Keypair not present");

  const sender = loadWalletKey(myKeypairFile);

  const nonMagicEdenInfo = allInfo.filter(
    (info) => info.owner !== MAGIC_EDEN_ADDRESS
  );

  for (const info of nonMagicEdenInfo) {
    if (!info.txid) {
      const txid = await sendToken(connection, info, sender);
      info.txid = txid;
      writeJson(allInfo);
      console.log(`Tokens sent to ${info.owner.toString()}. Tx Hash: ${txid}`);
    }
  }
})();
