
import * as web3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import { assert } from 'console';
import * as splToken from "@solana/spl-token";
import { token } from '@project-serum/anchor/dist/cjs/utils';
const fs = require('fs');

const PROGRESS_FILE_PATH = "./progress.json";

class TokenInfo {
    metadataAccount: string;
    tokenMint: string;
    nftName: string | null = null;
    owner: string | null = null;
    txid: string | null = null;

    constructor(metadataAccount: string, tokenMint: string) {
        this.metadataAccount = metadataAccount;
        this.tokenMint = tokenMint;
    }

    show(){
        console.log(this.metadataAccount + " -> " + this.tokenMint +' -> '+ this.owner);
    }
}

function writeJson(data: TokenInfo[]){
    let json = JSON.stringify(data);
    fs.writeFileSync(PROGRESS_FILE_PATH, json);
}

function readJson(): TokenInfo[] {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE_PATH).toString());
}

async function getOwnerForNFT(c: web3.Connection, tokenMintString: string) : Promise<web3.PublicKey>{

    const tokenMint = new anchor.web3.PublicKey(tokenMintString);
    //const accountInfo = await c.getAccountInfo(tokenMint);

    const largestAccouts = await c.getTokenLargestAccounts(tokenMint);
    const onlyHolder : web3.TokenAccountBalancePair[] = largestAccouts!.value.filter((tokenHolder: web3.TokenAccountBalancePair) => tokenHolder.uiAmount);
    assert(onlyHolder.length == 1);
    const NFTTokenAccount = onlyHolder[0].address;
    //console.log(NFTTokenAccount.toBase58());
    
    const tokenAccountInfo = await c.getAccountInfo(NFTTokenAccount);
    const owner = new web3.PublicKey(tokenAccountInfo!.data.slice(32, 64));

    //console.log(owner.toBase58());
    return owner;
}

async function getAllNFTsForCreator(c: web3.Connection, verifiedCreator: string) : Promise<TokenInfo[]>{

    const config : web3.GetProgramAccountsConfig = {
        commitment: undefined,
        encoding: "base64",
        dataSlice: undefined,
        filters: [
            {
                "memcmp": {
                    "offset": 1 + // key
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
                    "bytes": verifiedCreator
                }
            }
        ]
    }

    const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const accountList = await c.getProgramAccounts(TOKEN_METADATA_PROGRAM_ID, config);

    //console.log(accountList);

    const allInfo : TokenInfo[] = [];

    for (let i =0; i<accountList.length; i++){
        const metadataAccountPK = accountList[i].pubkey.toBase58()

        const tokenMint = new web3.PublicKey(accountList[i].account.data.slice(1+32, 1+32+32)).toBase58();
        
        allInfo[i] = new TokenInfo(metadataAccountPK, tokenMint);

        //allInfo[i].show();

        const nameLenght = accountList[i].account.data.readUInt32LE(1+32+32);
        const nameBuffer = accountList[i].account.data.slice(1+32+32+4, 1+32+32+4+32);
        
        //console.log(nameLenght);
        let name = "";
        for (let j = 0; j< nameLenght; j++){
            name += String.fromCharCode(nameBuffer.readUInt8(j));
        }
        allInfo[i].nftName = name;
        //console.log(name);
    }
    return allInfo;

}

async function main(){
    
    
    const rpcHost = "https://ssc-dao.genesysgo.net/"
    const c = new anchor.web3.Connection(rpcHost);

    //const owner = await getOwnerForNFT(c, "AP7VntKBj4253RV6ktMrZJst5JFFmrQnHy29HC7rHvd");
    //console.log(owner.toBase58());

    if(!fs.existsSync(PROGRESS_FILE_PATH)){
        const allInfo = await getAllNFTsForCreator(c, "PUT_VERIFIED_CREATOR_HERE");
        writeJson(allInfo);
        console.log("file saved");
    }
    
    const allInfo = readJson();
        
    console.log("finding owners...")
    allInfo.forEach(async tokenInfo => {
        if (!tokenInfo.owner) {
            tokenInfo.owner = await (await getOwnerForNFT(c, tokenInfo.tokenMint)).toBase58();
            writeJson(allInfo);
        }
    });
    console.log("DONE");
}

main();