
import * as web3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import * as splToken from "@solana/spl-token";
const fs = require('fs');
import { TokenInfo, readJson, writeJson } from "./prepareAirdrop";

const USE_MAINNET = false;
const MAGIC_EDEN_ADDRESS = "GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp";
const MAGIC_EDEN_ESCROW = "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix";
export const ERROR_FILE_PATH = "./error.json";
export const KEYPAIR_FILE = "C:\\Users\\loopc\\wkdir\\DEVkasD4qwUJQ8LS7rcJHcGDQQzrEtWgk2jB6v5FHngo.json";

async function sendToken(connection: web3.Connection, dropInfo: TokenInfo, sender: web3.Keypair): Promise<string>{

    if(!dropInfo.sendableAmount || !dropInfo.sendableTokenMint || !dropInfo.ownerWallet) return "";

    const mint = new web3.PublicKey(dropInfo.sendableTokenMint);
    const owner = new web3.PublicKey(dropInfo.ownerWallet);

    
    const transaction = new web3.Transaction();

    //new splToken.Token(connection, mint, splToken.TOKEN_PROGRAM_ID, )

    const destinationAccount = await splToken.Token.getAssociatedTokenAddress(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID, mint,
        owner, false);

    const sourceAccount = await splToken.Token.getAssociatedTokenAddress(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID, mint,
        sender.publicKey, false);

        
    const destinationAccountInfo = await connection.getAccountInfo(destinationAccount);
    const destTokenAccountMissing = !destinationAccountInfo;
    if(destTokenAccountMissing){
        console.log("creating token account...");
        
        const createATAinstruction = splToken.Token.createAssociatedTokenAccountInstruction(
            splToken.ASSOCIATED_TOKEN_PROGRAM_ID, 
            splToken.TOKEN_PROGRAM_ID, mint, 
            destinationAccount, owner, sender.publicKey);

        transaction.add(createATAinstruction);
    }

    const transferInstruction =
        splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            sourceAccount,
            destinationAccount,
            sender.publicKey,
            [],
            dropInfo.sendableAmount
        )
    transaction.add(transferInstruction);

    console.log("Sending from", sourceAccount.toBase58(),"to", destinationAccount.toBase58());

    const txid = await web3.sendAndConfirmTransaction(
        connection, transaction, [sender], { commitment: 'confirmed' });
    
    return txid;
}

export function loadWalletKey(keypairFile:string): web3.Keypair {
    if (!keypairFile || keypairFile == '') {
      throw new Error('Keypair is required!');
    }
    const loaded = web3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    console.log(`using wallet: ${loaded.publicKey}`);
    return loaded;
}

  export function writeErrors(data: TokenInfo[]){
    let json = JSON.stringify(data);
    fs.writeFileSync(ERROR_FILE_PATH, json);
}

async function main() {

    const rpcHost = web3.clusterApiUrl(USE_MAINNET?"mainnet-beta":"devnet");
    const c = new anchor.web3.Connection(rpcHost);

    const allInfo = readJson();
    
    const sender = loadWalletKey(KEYPAIR_FILE);

    //const txid = await sendToken(c, allInfo[0], sender);
    //console.log(txid);
    //return;
    

    let counter = 0;
    let errorTransactions: TokenInfo[] = [];
    for (let i = 0; i<allInfo.length; i++){
        if(!allInfo[i].txid){
            if(allInfo[i].ownerWallet === MAGIC_EDEN_ADDRESS || allInfo[i].ownerWallet === MAGIC_EDEN_ESCROW) {
                console.log("skipping MagicEden address...");
                continue;
            }
            const txid = await sendToken(c, allInfo[i], sender).then((txn) => {
                return txn;
            }).catch( err => {
                console.log(err);
                //unfortunately I didn't figure out how to get the txn id from the error, but the wallet is easy enough to look at
                errorTransactions.push(allInfo[i]); 
                return "error or timeout";
            });
            allInfo[i].txid = txid;
            writeJson(allInfo);
            // console.log(txid);
            await new Promise(f => setTimeout(f, 500));
        }
    }
    writeErrors(errorTransactions);
    console.log(counter);

}

if (require.main === module) {
    main();
}