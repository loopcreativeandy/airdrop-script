import fs from "fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { writeJson, readJson } from "./utils/file";
import { getAllNFTsForCreator, getOwnerForNFT } from "./utils/nft";
import {
  AMOUNT_TO_SEND,
  TOKEN_TO_SEND,
  PROGRESS_FILE_PATH,
  VERIFIED_CREATOR,
} from "./utils/constants";

export class TokenInfo {
  metadataAccount: string;
  nftTokenMint: string;
  nftName: string | undefined;
  owner: string | undefined;
  sendableTokenMint: string | undefined;
  sendableAmount: number | undefined;
  txid: string | undefined;

  constructor(metadataAccount: string, tokenMint: string) {
    this.metadataAccount = metadataAccount;
    this.nftTokenMint = tokenMint;
  }

  show() {
    console.log(
      this.metadataAccount + " -> " + this.nftTokenMint + " -> " + this.owner
    );
  }
}

async function prepareSend(data: TokenInfo[]) {
  data.forEach((element) => {
    element.sendableAmount = AMOUNT_TO_SEND;
    element.sendableTokenMint = TOKEN_TO_SEND.toString();
  });
}

(async function main() {
  const rpcHost = "https://ssc-dao.genesysgo.net/";
  const c = new Connection(rpcHost);

  if (!fs.existsSync(PROGRESS_FILE_PATH)) {
    const allInfo = await getAllNFTsForCreator(c, VERIFIED_CREATOR);
    writeJson(allInfo);
    console.log("file saved");
  }

  const allInfo = readJson();

  console.log("finding owners...");
  allInfo.forEach(async (tokenInfo) => {
    if (!tokenInfo.owner) {
      tokenInfo.owner = (
        await getOwnerForNFT(c, new PublicKey(tokenInfo.nftTokenMint))
      ).toBase58();
      writeJson(allInfo);
    }
  });

  prepareSend(allInfo);
  writeJson(allInfo);

  console.log("DONE");
})();
