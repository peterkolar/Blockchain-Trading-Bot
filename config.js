import { eth, bsc, polygon } from './constants/blockchains.js'

export let chain = bsc;
export let buy = true;// false -> it goes into checkPair function, true -> goes into buyPair function
export let repeating = true;// false -> if you want to buy just 1x at current price, cancel tx, true -> if you want to monitor price etc.
export let biggestLiquidityPair = false;// true -> it will search for biggest liquidity pair; false -> it will use the first liquidity pair, that is big enough (with this, you can save some time, but maybe you get a little bigger slippage)
export let getAlternativeBaseToken = true;// in case the specified liquidity pair isn't big enough, does it search for other liquidity pairs or not
export let gasLimit = 260000;// you rather pay a more gas and not lose more time to check the gasLimit on-chain

export let amountInMaxUsd = 2;// USD

export let sellTresholds = [2, 4, 8];// multipliers based on boughtPrice

export let sellPriceMultiplier = 1

export const recipient = process.env.ACCOUNT;

const walletTokenEth = 'WETH';
const inputTokenEth = 'WETH';
const outputTokenEth = 'RISE';

const walletTokenBsc = 'BUSD';
const inputTokenBsc = '';
const outputTokenBsc = 'CBT';

const walletTokenPolygon = 'USDC';
const inputTokenPolygon = '';// if you don't add base token, it will get it from the biggest liquidity pair
const outputTokenPolygon = 'KMC';

export let walletTokens = {
    eth: walletTokenEth,
    bsc: walletTokenBsc,
    polygon: walletTokenPolygon
}

export let inputTokens = {
    eth: inputTokenEth,
    bsc: inputTokenBsc,
    polygon: inputTokenPolygon
}

export let outputTokens = {
    eth: outputTokenEth,
    bsc: outputTokenBsc,
    polygon: outputTokenPolygon
}