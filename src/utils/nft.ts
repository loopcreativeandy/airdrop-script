import { web3 } from "@project-serum/anchor";
import { assert } from "console";
import {
  Connection,
  GetProgramAccountsConfig,
  PublicKey,
} from "@solana/web3.js";
import { TokenInfo } from "../prepareAirdrop";

export async function getAllNFTsForCreator(
  c: Connection,
  verifiedCreator: PublicKey
): Promise<TokenInfo[]> {
  const config: GetProgramAccountsConfig = {
    commitment: undefined,
    encoding: "base64",
    dataSlice: undefined,
    filters: [
      {
        memcmp: {
          offset:
            1 + // key
            32 + // update auth
            32 + // mint
            4 + // name string length
            32 + //MAX_NAME_LENGTH + // name
            4 + // uri string length
            200 + // MAX_URI_LENGTH + // uri*
            4 + // symbol string length
            10 + // MAX_SYMBOL_LENGTH + // symbol
            2 + // seller fee basis points
            1 + // whether or not there is a creators vec
            4, // creators
          bytes: verifiedCreator.toString(),
        },
      },
    ],
  };

  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  const accountList = await c.getProgramAccounts(
    TOKEN_METADATA_PROGRAM_ID,
    config
  );

  const allInfo: TokenInfo[] = [];

  for (let i = 0; i < accountList.length; i++) {
    const metadataAccountPK = accountList[i].pubkey.toBase58();

    const tokenMint = new web3.PublicKey(
      accountList[i].account.data.slice(1 + 32, 1 + 32 + 32)
    ).toBase58();

    allInfo[i] = new TokenInfo(metadataAccountPK, tokenMint);

    const nameLenght = accountList[i].account.data.readUInt32LE(1 + 32 + 32);
    const nameBuffer = accountList[i].account.data.slice(
      1 + 32 + 32 + 4,
      1 + 32 + 32 + 4 + 32
    );

    let name = "";
    for (let j = 0; j < nameLenght; j++) {
      if (nameBuffer.readUInt8(j) == 0) break;
      name += String.fromCharCode(nameBuffer.readUInt8(j));
    }
    allInfo[i].nftName = name;
  }
  return allInfo;
}

export async function getOwnerForNFT(
  c: web3.Connection,
  tokenMint: PublicKey
): Promise<web3.PublicKey> {
  const largestAccouts = await c.getTokenLargestAccounts(tokenMint);
  const onlyHolder: web3.TokenAccountBalancePair[] =
    largestAccouts!.value.filter(
      (tokenHolder: web3.TokenAccountBalancePair) => tokenHolder.uiAmount
    );

  assert(onlyHolder.length == 1);
  const NFTTokenAccount = onlyHolder[0].address;

  const tokenAccountInfo = await c.getAccountInfo(NFTTokenAccount);
  const owner = new web3.PublicKey(tokenAccountInfo!.data.slice(32, 64));
  return owner;
}
