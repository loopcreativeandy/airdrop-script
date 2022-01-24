
import * as web3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import { assert } from 'console';

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

async function main(){
    
    
    const rpcHost = "https://api.mainnet-beta.solana.com"
    const c = new anchor.web3.Connection(rpcHost);

    const owner = await getOwnerForNFT(c, "AP7VntKBj4253RV6ktMrZJst5JFFmrQnHy29HC7rHvd");
    console.log(owner.toBase58());
}

main();