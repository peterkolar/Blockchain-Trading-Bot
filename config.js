import { eth, bsc, polygon } from './constants/blockchains.js'
import dotenv from 'dotenv'
dotenv.config()

export const chain = bsc
export const buy = true// false -> it goes into checkPair function, true -> goes into buyPair function
export const repeating = true// false -> if you want to buy just 1x at current price, cancel tx, true -> if you want to monitor price etc.
export const biggestLiquidityPair = false// true -> it will search for biggest liquidity pair; false -> it will use the first liquidity pair, that is big enough (with this, you can save some time, but maybe you get a little bigger slippage)
export const getAlternativeBaseToken = true// in case the specified liquidity pair isn't big enough, does it search for other liquidity pairs or not
export const gasLimit = 260000// you rather pay a more gas and not lose more time to check the gasLimit on-chain

export const amountInMaxUsd = 2// USD

export const sellTresholds = [2, 4, 8]// multipliers based on boughtPrice

export const sellPriceMultiplier = 1

export const recipient = process.env.ACCOUNT

const walletTokenEth = 'WETH'
const inputTokenEth = 'WETH'
const outputTokenEth = 'RISE'

const walletTokenBsc = 'BUSD'
const inputTokenBsc = ''
const outputTokenBsc = 'CBT'

const walletTokenPolygon = 'USDC'
const inputTokenPolygon = ''// if you don't add base token, it will get it from the biggest liquidity pair
const outputTokenPolygon = 'KMC'

export const walletTokens = {
  [eth]: walletTokenEth,
  [bsc]: walletTokenBsc,
  [polygon]: walletTokenPolygon
}

export const inputTokens = {
  [eth]: inputTokenEth,
  [bsc]: inputTokenBsc,
  [polygon]: inputTokenPolygon
}

export const outputTokens = {
  [eth]: outputTokenEth,
  [bsc]: outputTokenBsc,
  [polygon]: outputTokenPolygon
}

export const RPC_URLS = {
  [eth]: process.env.RPC_URL_ETH_INFURA,
  [bsc]: process.env.RPC_URL_BSC_ORIGINAL,
  [polygon]: process.env.RPC_URL_POLYGON_INFURA
}

export const gasPrices = {
  [eth]: '151',
  [bsc]: '6',
  [polygon]: '201'
}

export const nativeTokenPairsInputs = {
  [eth]: ['WETH'],
  [bsc]: ['WBNB'],
  [polygon]: ['WMATIC', 'WETH']
}

export const nativeTokenPairsOutputs = {
  [eth]: ['USDT'],
  [bsc]: ['BUSD'],
  [polygon]: ['USDT', 'USDT']
}
