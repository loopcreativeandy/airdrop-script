
export class TokenInfo {
  metadataAccount: string;
  nftTokenMint: string;
  nftName: string | undefined;
  ownerWallet: string | undefined;
  sendableTokenMint: string | undefined;
  sendableAmount: number | undefined;
  txid: string | undefined;

  constructor(metadataAccount: string, tokenMint: string) {
      this.metadataAccount = metadataAccount;
      this.nftTokenMint = tokenMint;
  }

  show(){
      console.log(this.metadataAccount + " -> " + this.nftTokenMint +' -> '+ this.ownerWallet);
  }
}
