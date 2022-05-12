require('dotenv').config()
const ethers = require('ethers');

/// SETTINGS
const bsc = "bsc";
const eth = "eth";
const polygon = "polygon";

let chain = bsc;
let buy = true;// false -> it goes into checkPair function, true -> goes into buyPair function
let repeating = true;// false -> if you want to buy just 1x at current price, cancel tx, true -> if you want to monitor price etc.
let biggestLiquidityPair = false;// true -> it will search for biggest liquidity pair; false -> it will use the first liquidity pair, that is big enough (with this, you can save some time, but maybe you get a little bigger slippage)
let getAlternativeBaseToken = true;// in case the specified liquidity pair isn't big enough, does it search for other liquidity pairs or not
let gasLimit = 260000;// you rather pay a more gas and not lose more time to check the gasLimit on-chain

let amountInMaxUsd = 2;// USD

let sellTresholds = [2, 4, 8];// multipliers based on boughtPrice

let sellPriceMultiplier = 1

const recipient = process.env.ACCOUNT;

const walletTokenEth = 'WETH';
const inputTokenEth = 'WETH';
const outputTokenEth = 'RISE';

const walletTokenBsc = 'BUSD';
const inputTokenBsc = '';
const outputTokenBsc = 'CBT';

const walletTokenPolygon = 'USDC';
const inputTokenPolygon = '';// if you don't add base token, it will get it from the biggest liquidity pair
const outputTokenPolygon = 'KMC';

/// SETTINGS END

const MS_2_MIN = 1000 * 60// milliseconds -> minutes conversion

let provider;
let exchangeAddresses;

let RPC_URL;

if (chain == eth)
{ RPC_URL = process.env.RPC_URL_ETH_INFURA; }
else if (chain == bsc)
{ RPC_URL = process.env.RPC_URL_BSC_ORIGINAL; }
else if (chain == polygon)
{ RPC_URL = process.env.RPC_URL_POLYGON_INFURA; }

if (chain == eth)
{
  exchangeAddresses = {
    nativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',// WETH
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', 
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    initCode: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  }
}
else if (chain == bsc)
{
  exchangeAddresses = {
    nativeToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',// WBNB
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    initCode: '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5',// pancakeswap v2 (v1 is different)
  }
}
else if (chain == polygon)
{
  exchangeAddresses = {
    nativeToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',// WMATIC
    factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    initCode: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  }
}
provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);

const account = wallet.connect(provider);

const factory = new ethers.Contract(
  exchangeAddresses.factory,
  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
  account
);

// uniswap v2
// Uniswap v2 Factory Contract: https://etherscan.io/address/0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f#code
const UNISWAP_V2_FACTORY_ABI = [{"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token0","type":"address"},{"indexed":true,"internalType":"address","name":"token1","type":"address"},{"indexed":false,"internalType":"address","name":"pair","type":"address"},{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"PairCreated","type":"event"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allPairs","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"allPairsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"createPair","outputs":[{"internalType":"address","name":"pair","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"feeTo","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"feeToSetter","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeTo","type":"address"}],"name":"setFeeTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"name":"setFeeToSetter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]
const UNISWAP_V2_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
let uniswapV2FactoryContract = new ethers.Contract(UNISWAP_V2_FACTORY_ADDRESS, UNISWAP_V2_FACTORY_ABI, account);

// pancakeswap factory V2:
const PANCAKESWAP_V2_FACTORY_ABI = [{"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token0","type":"address"},{"indexed":true,"internalType":"address","name":"token1","type":"address"},{"indexed":false,"internalType":"address","name":"pair","type":"address"},{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"PairCreated","type":"event"},{"constant":true,"inputs":[],"name":"INIT_CODE_PAIR_HASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allPairs","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"allPairsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"createPair","outputs":[{"internalType":"address","name":"pair","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"feeTo","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"feeToSetter","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeTo","type":"address"}],"name":"setFeeTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"name":"setFeeToSetter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]
const PANCAKESWAP_V2_FACTORY_ADDRESS = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
let pancakeV2FactoryContract = new ethers.Contract(PANCAKESWAP_V2_FACTORY_ADDRESS, PANCAKESWAP_V2_FACTORY_ABI, account);

// Pancakeswap v2 WBNB/USDC, WBNB/POCO PAIR Template: https://bscscan.com/address/0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b#code
const PANCAKESWAP_V2_PAIR_ABI = [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]

// functions from Contract Source Code, not from Contract ABI section - you only need interface
const router = new ethers.Contract(
  exchangeAddresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    // manually added:
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

// quickswap factory:
const QUICKSWAP_FACTORY_ADDRESS = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'
const QUICKSWAP_FACTORY_ABI = [{"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token0","type":"address"},{"indexed":true,"internalType":"address","name":"token1","type":"address"},{"indexed":false,"internalType":"address","name":"pair","type":"address"},{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"PairCreated","type":"event"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allPairs","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"allPairsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"createPair","outputs":[{"internalType":"address","name":"pair","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"feeTo","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"feeToSetter","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeTo","type":"address"}],"name":"setFeeTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"name":"setFeeToSetter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]
let quickswapFactoryContract = new ethers.Contract(QUICKSWAP_FACTORY_ADDRESS, QUICKSWAP_FACTORY_ABI, account);

const QUICKSWAP_PAIR_ABI = [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]

let EXCHANGE_PAIR_ABI
if (chain == eth)
{ EXCHANGE_PAIR_ABI = UNISWAP_V2_FACTORY_ABI; }
if (chain == bsc)
{ EXCHANGE_PAIR_ABI = PANCAKESWAP_V2_PAIR_ABI }
if (chain == polygon)
{ EXCHANGE_PAIR_ABI = QUICKSWAP_PAIR_ABI }

const token_contract_ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]

let tokenAddressesEth = {
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  KNC: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
  LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
  RISE: '0x8a2d988fe2e8c6716cbcef1b33df626c692f7b98',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
}

let tokenDecimalsEth = {
  WETH: 18,
  WBTC: 8,
  MKR: 18,
  DAI: 18,
  USDC: 6,
  KNC: 18,
  LINK: 18,
  RISE: 9,
  USDT: 6,
}

let tokenAddressesBsc = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
  DAI: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
  KING: '0x0ccd575bf9378c06f6dca82f8122f570769f00c2',
  USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  ZIL: '0xb86abcb37c3a4b64f74f59301aff131a1becc787',
  POCO: '0x394bBA8F309f3462b31238B3fd04b83F71A98848',
  USDT: '0x55d398326f99059ff775485246999027b3197955',
  GGG: '0xd8047afecb86e44eff3add991b9f063ed4ca716b',
  TITA: '0x0c1253a30da9580472064a91946c5ce0C58aCf7f',
  H2O: '0xb8b932d41d6be935ce1666aaf41f056093f9faee',
  DON: '0x86B3F23B6e90F5bbfac59b5b2661134Ef8Ffd255',
  GST: '0x7eDC0eC89F987ECd85617b891c44fE462a325869',
  BTL: '0x51e7b598c9155b9dccb04eb42519f6eec9c841e9',
  SPIN: '',
  BLOCK: '0xbc7a566b85ef73f935e640a06b5a8b031cd975df',
  CBT: '0x7c73967dC8c804Ea028247f5A953052f0CD5Fd58',
}

// if you set 0 decimals, it will get it from smart contract
let tokenDecimalsBsc = {
  WBNB: 18,
  BUSD: 18,
  DAI: 18,
  KING: 18, 
  USDC: 18,
  ZIL: 12,
  POCO: 18,
  USDT: 18,
  GGG: 18,
  TITA: 18,
  H2O: 18,
  DON: 18,
  GST: 18,
  BTL: 6,
  SPIN: 0,
  BLOCK: 0,
  CBT: 18,
}

let tokenAddressesPolygon = {
  WMATIC: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  TECH: '0x6286a9e6f7e745a6d884561d88f94542d6715698',
  USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  UM: '0x3B1A0c9252ee7403093fF55b4a5886d49a3d837a',
  WETH: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  BLOK: '0x229b1b6c23ff8953d663c4cbb519717e323a0a84',
  CHAMP: '0x8f9E8e833A69Aa467E42c46cCA640da84DD4585f',
  GAIA: '0x723b17718289a91af252d616de2c77944962d122',
  DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  QUICK: '0x831753DD7087CaC61aB5644b308642cc1c33Dc13',
  TRD: '0x2A1f0aD3Cab040e28845734d932f3fF0A24B14F4',
  KMC: '',
}

let tokenDecimalsPolygon = {
  WMATIC: 18,
  TECH: 18,
  USDC: 6,
  USDT: 6,
  UM: 18,
  WETH: 18,
  BLOK: 18,
  CHAMP: 8,
  GAIA: 18,
  DAI: 18,
  QUICK: 18,
  TRD: 18,
  KMC: 0,
  TRY: 0,
  TECH2: 0,
}

let tokenAddresses
let tokenDecimals

if (chain == eth)
{
  tokenAddresses = tokenAddressesEth;
  tokenDecimals = tokenDecimalsEth;
}
else if (chain == bsc)
{
  tokenAddresses = tokenAddressesBsc;
  tokenDecimals = tokenDecimalsBsc;
}
else if (chain == polygon)
{
  tokenAddresses = tokenAddressesPolygon;
  tokenDecimals = tokenDecimalsPolygon;
}

let alreadyInFunction = false

let walletToken = ''
let inputToken = ''
let outputToken = ''

let izpisWalletInputOutput = false;

let baseTokens
let basePairAddresses

if (chain == bsc)
{
  baseTokens = ['WBNB', 'BUSD', 'USDT'];
  basePairAddresses = { WBNB: '', BUSD: '', USDT: '' }
}
else if (chain == polygon)
{
  baseTokens = ['WETH', 'USDT', 'USDC', 'WMATIC', 'DAI'];
  basePairAddresses = { WETH: '',  USDT: '', USDC: '', WMATIC: '', DAI: '' }
}
else if (chain == eth)
{
  baseTokens = ['WETH', 'USDT'];
  basePairAddresses = { WETH: '', USDT: '' }
}
let basePairToken0Addresses = JSON.parse(JSON.stringify(basePairAddresses));

let baseTokenUsdPairAddresses// WBNB/BUSD, WETH/USDT, WMATIC/USDT
let baseTokenUsdPairToken0Addresses// WBNB or BUSD, WETH or USDT, WMATIC or USDT

let baseTokenUsdPairAddressesBsc = {
  WBNBBUSD: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16'
}
let baseTokenUsdPairToken0AddressesBsc = {
  WBNBBUSD: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',// WBNB
}

let baseTokenUsdPairAddressesPolygon = {
  WMATICUSDT: '0x604229c960e5CACF2aaEAc8Be68Ac07BA9dF81c3',
  WETHUSDT: '0xF6422B997c7F54D1c6a6e103bcb1499EeA0a7046',
}
let baseTokenUsdPairToken0AddressesPolygon = {
  WMATICUSDT: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',// WMATIC
  WETHUSDT: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',// WETH
}

let baseTokenUsdPairAddressesEth = {
  WETHUSDT: '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852'
}
let baseTokenUsdPairToken0AddressesEth = {
  WETHUSDT: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',// WETH
}

if (chain == bsc)
{
  baseTokenUsdPairAddresses = baseTokenUsdPairAddressesBsc;
  baseTokenUsdPairToken0Addresses = baseTokenUsdPairToken0AddressesBsc;
}
else if (chain == polygon)
{
  baseTokenUsdPairAddresses = baseTokenUsdPairAddressesPolygon;
  baseTokenUsdPairToken0Addresses = baseTokenUsdPairToken0AddressesPolygon;
}
if (chain == eth)
{
  baseTokenUsdPairAddresses = baseTokenUsdPairAddressesEth;
  baseTokenUsdPairToken0Addresses = baseTokenUsdPairToken0AddressesEth;
}

let priceBnb = 0;// for bsc chain
let priceMatic = 0;// for polygon chain
let priceEth = 0;// for polygon and eth chain

let alreadyBought = false
let failedBuyTransactions = 0

let walletTokenPrice = 1
let inputTokenPrice = 1

let outputTokenApproved = false;

let boughtWalletTokenAmount = 0;
let boughtOutputTokenBalance = -1;
let amountToSell = 0;
let boughtPriceBase = 0;
let currentPriceBase = 0;

if (repeating)
{
  const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 100 // ms
  setInterval(async () => { await newTrade() }, POLLING_INTERVAL)
}
else// call just 1 time
{
  newTrade()
}

async function newTrade() {
  if (alreadyInFunction)
  { return }
 
  alreadyInFunction = true

  if (!alreadyBought)
  {
    if (chain == eth)
    {
      walletToken = walletTokenEth;
      if (inputTokenEth != '')
      { inputToken = inputTokenEth; }
      outputToken = outputTokenEth;
    }
    else if (chain == bsc)
    {
      walletToken = walletTokenBsc;
      if (inputTokenBsc != '')
      { inputToken = inputTokenBsc; }
      outputToken = outputTokenBsc;
    }
    else if (chain == polygon)
    {
      walletToken = walletTokenPolygon;
      if (inputTokenPolygon != '')
      { inputToken = inputTokenPolygon; }
      outputToken = outputTokenPolygon;
    }

    // just in case you forgot to add 'W'
    if (walletToken == 'BNB' || walletToken == 'ETH' || walletToken == 'MATIC')
    { walletToken = 'W' + walletToken }
    if (inputToken == 'BNB' || inputToken == 'ETH' || inputToken == 'MATIC')
    { inputToken = 'W' + inputToken }

    if (!izpisWalletInputOutput)
    { izpisWalletInputOutput = true; }
  }
  
  if (!outputTokenApproved)
  {
    let allowance = await checkAllowance(outputToken);
    if (allowance == 0)
    {
      let approved = false
      while (!approved)
      {
        approved = await approveMax(outputToken);
      }
    }
    outputTokenApproved = true;
  }

  if (!alreadyBought)
  {
    await getNativeTokenPrices();

    // get decimals if needed
    while (inputToken != '' && tokenDecimals[inputToken] == 0)
    { tokenDecimals[inputToken] = await getDecimals(tokenAddresses[inputToken]); }
    while (tokenDecimals[outputToken] == 0)
    { tokenDecimals[outputToken] = await getDecimals(tokenAddresses[outputToken]); }
    
    console.log("decimals: " + inputToken + " " + tokenDecimals[inputToken] + ", " + outputToken + " " + tokenDecimals[outputToken]);
    
    /// GET CORRECT LIQUIDITY PAIR ///
    
    // checks, if inputToken is specified
    let { inputTokenSymbol, rate, inputTokenReserve, outputTokenReserve } = await GetCorrectLiquidityPair({ inputTokenSymbol: inputToken, outputTokenSymbol: outputToken });
    if (inputTokenSymbol != '' && rate != 0)
    {
      inputToken = inputTokenSymbol;
    }
    else //if (inputTokenSymbol == '')
    {
      console.log("No big enough liquidity pair found for outputToken: " + outputToken);

      alreadyInFunction = false
      return
    }

    if ((buy) && !alreadyBought && failedBuyTransactions <= 5)
    {
      await buyPair({
        walletTokenSymbol: walletToken,
        inputTokenSymbol: inputToken,
        outputTokenSymbol: outputToken,
        rate: rate// rate vedno gledaš glede na inputToken, ne walletToken
      })
    }
  }
  else //if (alreadyBought)
  {
    // you already have inputToken and output token decimals, so you check the price
    let { rate, pairAddressOut, pairToken0AddressOut, inputTokenReserve, outputTokenReserve } = await checkPair({
      inputTokenSymbol: inputToken,
      outputTokenSymbol: outputToken,
      logging: true,
      pairAddressIn: '',
      pairToken0AddressIn: '',
    })

    currentPriceBase = 1 / rate;

    if (buy && alreadyBought)
    {
      // sell bought token
      if (boughtPriceBase != 0 && boughtWalletTokenAmount != 0)// just in case
      {
        let balanceToSell = amountToSell.mul(33).div(100)// you get 33%

        console.log("current price base: " + currentPriceBase + ", bought price base: " + boughtPriceBase + ", balanceToSell: " + balanceToSell);

        if (currentPriceBase > sellTresholds[0] * boughtPriceBase * sellPriceMultiplier && successfulSells == 0 ||
            currentPriceBase > sellTresholds[1] * boughtPriceBase * sellPriceMultiplier && successfulSells == 1 ||
            currentPriceBase > sellTresholds[2] * boughtPriceBase * sellPriceMultiplier && successfulSells == 2)
        {
          await SellBoughtToken({ balanceToSell });
        }
      }
      else
      {
        console.log("This should not happen: boughtPriceBase == 0 or boughtWalletTokenAmount == 0");
      }
    }
  }

  alreadyInFunction = false
}

async function checkAllowance(tokenSymbol)
{
  let tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], token_contract_ABI, account);
  let allowance = 0
  
  try
  { allowance = await tokenContractEthers.allowance(account.address, exchangeAddresses.router); }
  catch (error)
  {
    console.log("error checkAllowance for " + tokenSymbol + ": " + error.message);
    return allowance
  }

  return allowance
}

async function approveMax(tokenSymbol)
{
  let tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], token_contract_ABI, account);
  let approval
  try
  {
    approval = await tokenContractEthers.approve(exchangeAddresses.router, ethers.constants.MaxUint256);
    console.log("approved " + ethers.constants.MaxUint256 + " " + tokenSymbol + " for owner " + account.address + " and sender " + exchangeAddresses.router);

    return true
  }
  catch (error)
  {
    console.log("error approve: " + error.message);

    if (approval != undefined)
    { console.log("\n\n!!!APPROVAL FAILED!!!\ntransactionHash: " + approval.hash + "\n\n"); }

    return false
  }
}

async function getNativeTokenPrices()
{
  let inputTokens
  let outputTokens

  if (chain == bsc)
  {
    inputTokens = ['WBNB'];
    outputTokens = ['BUSD'];
  }
  else if (chain == polygon)
  {
    inputTokens = ['WMATIC', 'WETH'];
    outputTokens = ['USDT', 'USDT'];
  }
  else if (chain == eth)
  {
    inputTokens = ['WETH'];
    outputTokens = ['USDT'];
  }

  for (let i = 0; i < inputTokens.length; i++)
  {
    let pairAddressIn = ''
    if (baseTokenUsdPairAddresses[inputTokens[i] + outputTokens[i]] != undefined)// sestaviš recimo: WBNBBUSD
    { pairAddressIn = baseTokenUsdPairAddresses[inputTokens[i] + outputTokens[i]]; }
    else
    { console.log("Cannot get pairAddressIn, this should not happen!"); }
    let pairToken0AddressIn = '';
    if (baseTokenUsdPairToken0Addresses[inputTokens[i] + outputTokens[i]] != undefined)// sestaviš recimo: WBNBBUSD
    { pairToken0AddressIn = baseTokenUsdPairToken0Addresses[inputTokens[i] + outputTokens[i]]; }
    else
    { console.log("Cannot get pairToken0AddressIn, this should not happen!"); }

    let { rate, pairAddressOut, pairToken0AddressOut, inputTokenReserve, outputTokenReserve } = await checkPair({
      inputTokenSymbol: inputTokens[i],
      outputTokenSymbol: outputTokens[i],
      logging: false,
      pairAddressIn: pairAddressIn,
      pairToken0AddressIn: pairToken0AddressIn
    })

    if (rate != 0)
    {
      if (inputTokens[i] == 'WBNB')
      { priceBnb = rate; }
      else if (inputTokens[i] == 'WMATIC')
      { priceMatic = rate; }
      else if (inputTokens[i] == 'WETH')
      { priceEth = rate; }
    }
    else
    {
      // there was an error
      i--;
    }
  }

  /// END GET BASE PRICES ///
}

async function getDecimals(tokenAddress)
{
  const tokenContract = new ethers.Contract(tokenAddress, token_contract_ABI, account)
  let decimals = 0
  try
  { decimals = await tokenContract.decimals() }
  catch (error)
  {
    console.log("error getDecimals: " + error.message);
  }
  
  return decimals
}

// returns input token symbol, in case of big enough liquidity, otherwise ""
async function GetCorrectLiquidityPair(args)
{
  let { inputTokenSymbol, outputTokenSymbol } = args

  let prices = []
  let inputTokenReserves = []
  let outputTokenReserves = []
  let inputTokenReservesUSD = []

  let minReserveTreshold = 10000;// če je manj kot 10000, pol je to ful malo
  let maxReserveUSDvalue = 0
  let maxReserveUSDindex = -1

  if (inputTokenSymbol != '' && baseTokens[0] != inputTokenSymbol)
  { array_move(baseTokens, baseTokens.indexOf(inputTokenSymbol), 0); }

  // get reserves for all pairs (for example BLOK/WETH, BLOK/USDT, BLOK/WMATIC)
  for (let i = 0; i < baseTokens.length; i++)
  {
    let pairAddressIn = basePairAddresses[baseTokens[i]];
    let pairToken0AddressIn = basePairToken0Addresses[baseTokens[i]];
    
    let { rate, pairAddressOut, pairToken0AddressOut, inputTokenReserve, outputTokenReserve } = await checkPair({
      inputTokenSymbol: baseTokens[i],
      outputTokenSymbol: outputTokenSymbol,
      logging: false,
      pairAddressIn: pairAddressIn,
      pairToken0AddressIn: pairToken0AddressIn,
    })
    if (pairAddressOut.toLowerCase() != "0x0000000000000000000000000000000000000000")
    {
      basePairAddresses[baseTokens[i]] = pairAddressOut;
    }
    if (pairToken0AddressOut.toLowerCase() != '')
    {
      basePairToken0Addresses[baseTokens[i]] = pairToken0AddressOut;
    }

    prices[i] = rate;
    inputTokenReserves[i] = inputTokenReserve;
    outputTokenReserves[i] = outputTokenReserve;
    
    // get potenitalBaseTokenPrice, so you can price all liquidity pairs in USD value, so you can compare
    let potentialBaseTokenPrice = returnNativeTokenPrice(baseTokens[i]);
    
    inputTokenReservesUSD[i] = inputTokenReserves[i] * potentialBaseTokenPrice / (10 ** tokenDecimals[baseTokens[i]])

    // check, if current liquidity pair is the biggest
    if (inputTokenReservesUSD[i] > maxReserveUSDvalue)
    {
      maxReserveUSDvalue = inputTokenReservesUSD[i]
      maxReserveUSDindex = i

      // if current biggest liquidity dovolj is big enough, you can set inputTokenSymbol
      if (!biggestLiquidityPair && maxReserveUSDvalue > minReserveTreshold)
      {
        return { inputTokenSymbol: baseTokens[maxReserveUSDindex], rate: prices[maxReserveUSDindex], inputTokenReserve: inputTokenReserves[maxReserveUSDindex], outputTokenReserve: outputTokenReserves[maxReserveUSDindex] };
      }
    }
    else if (i == 0 && inputTokenSymbol != "" && !getAlternativeBaseToken)// if an inputToken is specified and you want to buy with this pair, not necessarily the best
    {
      return { inputTokenSymbol: baseTokens[0], rate: prices[0], inputTokenReserve: inputTokenReserves[0], outputTokenReserve: outputTokenReserves[0] };
    }
  }

  // if the biggest liquidity pair is big enough, set inputTokenSymbol
  if (maxReserveUSDvalue > minReserveTreshold)
  {
    return { inputTokenSymbol: baseTokens[maxReserveUSDindex], rate: prices[maxReserveUSDindex], inputTokenReserve: inputTokenReserves[maxReserveUSDindex], outputTokenReserve: outputTokenReserves[maxReserveUSDindex] };
  }
  else// if you can't find big enough liquidity pair, don't buy anything
  {
    return { inputTokenSymbol: "", rate: 0, inputTokenReserve: 0, outputTokenReserve: 0 };
  }
}

async function checkPair(args)
{
  let { inputTokenSymbol, outputTokenSymbol, logging, pairAddressIn, pairToken0AddressIn } = args

  let inputTokenAddress = tokenAddresses[inputTokenSymbol]
  let inputTokenDecimals = tokenDecimals[inputTokenSymbol]
  let outputTokenAddress = tokenAddresses[outputTokenSymbol]
  let outputTokenDecimals = tokenDecimals[outputTokenSymbol]

  let exchangePairAddress = "0x0000000000000000000000000000000000000000"

  if (inputTokenAddress == '' || outputTokenAddress == '')
  {
    console.log("Input or output token address not specified!");
  }

  let addressToken0 = '';
  let addressToken1;

  if (pairAddressIn == '')
  {
    // this is OFF-CHAIN calculation
    exchangePairAddress = calculatePairAddress(inputTokenAddress, outputTokenAddress)
  }
  else
  { exchangePairAddress = pairAddressIn; }

  if (exchangePairAddress.toLowerCase() == "0x0000000000000000000000000000000000000000")
  {
    console.log("Requested pair: " + inputTokenSymbol + "/" + outputTokenSymbol + " does not exist!");
    return { rate: 0, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve: 0, outputTokenReserve: 0 };
  }
  
  let exchangePairContract
  let exchangePairReserves
  
  exchangePairContract = new ethers.Contract(exchangePairAddress, EXCHANGE_PAIR_ABI, account)
  try
  { exchangePairReserves = await exchangePairContract.getReserves() }
  catch (error)
  {
    console.log("Both token reserves are 0!");
    return { rate: 0, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve: 0, outputTokenReserve: 0 };
  }
  
  if (exchangePairReserves._reserve0 == 0 && exchangePairReserves._reserve1 == 0)
  {
    return { rate: 0, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve: 0, outputTokenReserve: 0 };
  }

  if (pairToken0AddressIn == '')
  {
    // OFF-CHAIN
    addressToken0 = getToken0(inputTokenAddress, outputTokenAddress);
  }
  else
  { addressToken0 = pairToken0AddressIn; }
  
  // set addressToken1
  addressToken1 = inputTokenAddress;
  if (addressToken0.toLowerCase() == inputTokenAddress.toLowerCase())
  { addressToken1 = outputTokenAddress; }

  let rate = 0
  let inputTokenReserve = 0
  let outputTokenReserve = 0
  if (inputTokenAddress.toLowerCase() == addressToken0.toLowerCase() && outputTokenAddress.toLowerCase() == addressToken1.toLowerCase())// input = 0, output = 1
  {
    inputTokenReserve = exchangePairReserves._reserve0
    outputTokenReserve = exchangePairReserves._reserve1
  }
  else if (inputTokenAddress.toLowerCase() == addressToken1.toLowerCase() && outputTokenAddress.toLowerCase() == addressToken0.toLowerCase())
  {
    inputTokenReserve = exchangePairReserves._reserve1
    outputTokenReserve = exchangePairReserves._reserve0
  }

  if (inputTokenReserve != 0 && outputTokenReserve != 0)
  { rate = outputTokenReserve * 10 ** (inputTokenDecimals - outputTokenDecimals) / inputTokenReserve; }
  else
  {
    return { rate, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve, outputTokenReserve };
  }

  return { rate, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve, outputTokenReserve };
}

async function buyPair(args)// walletTokenSymbol is base token in your wallet, inputTokenSymbol is liquidity pair base token, outputToken is buyToken
{
  let { walletTokenSymbol, inputTokenSymbol, outputTokenSymbol, rate } = args

  tokenPriceBase = 1 / rate;

  let inputTokenAddress = ''

  if (inputTokenSymbol != '')// input (base) token je znan
  {
    inputTokenAddress = tokenAddresses[inputTokenSymbol]
    inputTokenDecimals = tokenDecimals[inputTokenSymbol]
  }

  let outputTokenAddress = tokenAddresses[outputTokenSymbol]
  let outputTokenDecimals = tokenDecimals[outputTokenSymbol]

  let walletTokenAddress = ''
  let walletTokenDecimals = 0
  
  if (walletTokenSymbol != '')
  {
    walletTokenAddress = tokenAddresses[walletTokenSymbol]
    walletTokenDecimals = tokenDecimals[walletTokenSymbol]
  }

  let gasPrice = getGasPrice();

  /// AMOUNTS ///
  
  walletTokenPrice = returnNativeTokenPrice(walletTokenSymbol);
  inputTokenPrice = returnNativeTokenPrice(inputTokenSymbol);
  
  let amountInNum = amountInMaxUsd / walletTokenPrice;
  
  const amountIn = ethers.utils.parseUnits(amountInNum.toString(), walletTokenDecimals);
  
  let path// token addresses
  if (walletTokenAddress.toLowerCase() == inputTokenAddress.toLowerCase())
  { path = [inputTokenAddress, outputTokenAddress] }
  else if (walletTokenAddress.toLowerCase() != inputTokenAddress.toLowerCase())
  { path = [walletTokenAddress, inputTokenAddress, outputTokenAddress] }
  
  let amounts
  try
  { amounts = await router.getAmountsOut(amountIn, path); }// dobiš array z isto dolžino kot path (za vsak element posebej), 1. element je isti kot amountIn
  catch (error)
  {
    console.log("error buy getAmountsOut: " + error.message);
    return;
  }

  let amountOutLastToken = amounts[amounts.length - 1]
  
  //Our execution price will be a little bit different, so we need some flexbility
  const amountOutMin = amountOutLastToken.sub(amountOutLastToken.div(10));// hočeš vsaj 90%
  console.log(`Buying new token:
    tokenWallet: ${walletTokenSymbol} ${amountIn.toString()} ${walletTokenAddress}
    tokenIn: ${inputTokenSymbol} ${inputTokenAddress}
    tokenOut: ${outputTokenSymbol} ${amountOutMin.toString()} ${outputTokenAddress}`);

  let options = {
    value: amountIn,
    gasLimit: gasLimit,
    gasPrice: gasPrice
  };
  if (walletTokenAddress.toLowerCase() != exchangeAddresses.nativeToken.toLowerCase())
  {
    options = {
      gasLimit: gasLimit,
      gasPrice: gasPrice
    };
  }

  let tx
  let txCreated = false
  let txSuccessful = false
  const swapExactEthForTokens = "swapExactEthForTokens";
  const swapExactTokensForTokens = "swapExactTokensForTokens";
  let swapMethod = swapExactEthForTokens;
  if (walletTokenAddress.toLowerCase() != exchangeAddresses.nativeToken.toLowerCase())
  { swapMethod = swapExactTokensForTokens; }

  if (buy)
  {
    if (swapMethod == swapExactTokensForTokens)
    {
      try {
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, //10 minutes
          options// in swapExactTokensForETH method you have to put amountIn inside options 
        );
        txCreated = true
      }
      catch (error)
      {
        console.log("error buy swapExactTokensForTokens: " + error.message);
      }
    }
    else if (swapMethod == swapExactEthForTokens)
    {
      try {
        tx = await router.swapExactETHForTokens(
          amountOutMin,// with amountOutMin you specify slippage
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, //10 minutes
          options
        );
        txCreated = true
      }
      catch (error)
      {
        console.log("error buy swapExactETHForTokens: " + error.message);
        console.log("\n\n!!!TRANSACTION ERROR!!!\n\n");
      }
    }

    if (txCreated)
    {
      console.log('Transaction created');

      let receipt
      try {
        receipt = await tx.wait();
        txSuccessful = true;
        boughtWalletTokenAmount = amountIn// so you can calculate the actual buy price

        console.log("\n\n!!!BUY TRANSACTION SUCCESSFUL!!!\ntransactionHash: " + receipt.transactionHash + "\n\n");// to dela
        console.log("IN: " + amountIn / (10 ** walletTokenDecimals) + " " + walletTokenSymbol + "\nOUT: " + amountOutMin / (10 ** outputTokenDecimals) + " " + outputTokenSymbol + "\n\n");
      }
      catch (error)
      {
        console.log("error buy receipt: " + error.message);

        if (receipt != undefined)
        {
          console.log("\n\n!!!BUY TRANSACTION FAILED!!!\ntransactionHash: " + receipt.transactionHash + "\n\n");
        }
      }

      if (txSuccessful)
      {
        alreadyBought = true

        // beep - alert
        console.log('\u0007');

        // how much of bought tokens do you have and at what price you bought them
        while (boughtOutputTokenBalance == -1)
        { boughtOutputTokenBalance = await checkBalances(outputTokenSymbol); }// returns -1 in case of error
        
        if (amountOutLastToken.lte(boughtOutputTokenBalance))// lte means <=
        { amountToSell = amountOutLastToken; }
        else if (boughtOutputTokenBalance.lte(amountOutLastToken))// lte means <=
        { amountToSell = boughtOutputTokenBalance; }
        
        let boughtRateWallet = amountToSell * 10 ** (walletTokenDecimals - outputTokenDecimals) / boughtWalletTokenAmount;// works, assuming you didn't have this token in the wallet prior to buying
        boughtPriceBase = 1 / boughtRateWallet * walletTokenPrice / inputTokenPrice;
        console.log("bought output token balance: " + boughtOutputTokenBalance + ", amountToSell: " + amountToSell + ", bought price base: " + boughtPriceBase);
        
        // checks, if token is approved and approve it if needed
        if (!outputTokenApproved)
        {
          let allowance = await checkAllowance(outputTokenSymbol);
          if (allowance == 0)
          {
            let approved = false
            while (!approved)
            {
              approved = await approveMax(outputTokenSymbol);
            }
          }
          outputTokenApproved = true;// če je prišel do sem, je zihr approvan
        }
      }
      else
      {
        failedBuyTransactions++;
      }
    }
  }
}

function returnNativeTokenPrice(tokenSymbol)
{
  switch(tokenSymbol) {
    case "WBNB":
      return priceBnb;
    case "WMATIC":
      return priceMatic;
    case "WETH":
      return priceEth;
    case "USDT": case "USDC": case "BUSD": case "DAI":
      return 1;
  }
  return 1;
}

async function SellBoughtToken(args)// walletTokenSymbol is base token in your wallet, inputTokenSymbol is base token from liquidity pair (USDT, WETH, WBNB, WMATIC, USDC, ...), outputToken is buyToken
{
  let { balanceToSell } = args
  
  let inputTokenAddress = ''

  if (inputToken != '')
  { inputTokenAddress = tokenAddresses[inputToken] }

  let outputTokenAddress = tokenAddresses[outputToken]
  let outputTokenDecimals = tokenDecimals[outputToken]

  let walletTokenAddress = ''
  let walletTokenDecimals = 0
  
  if (walletToken != '')
  {
    walletTokenAddress = tokenAddresses[walletToken]
    walletTokenDecimals = tokenDecimals[walletToken]
  }

  let gasPrice = getGasPrice();

  const amountIn = balanceToSell;
  
  let path// token addresses
  if (walletTokenAddress.toLowerCase() == inputTokenAddress.toLowerCase())
  { path = [outputTokenAddress, inputTokenAddress] }
  else if (walletTokenAddress.toLowerCase() != inputTokenAddress.toLowerCase())
  { path = [outputTokenAddress, inputTokenAddress, walletTokenAddress] }

  let amounts
  try
  { amounts = await router.getAmountsOut(amountIn, path); }
  catch (error)
  {
    console.log("error sell getAmountsOut: " + error.message);
    return;// because the price might have changed
  }
  let amountOutLastToken = amounts[amounts.length - 1]
  
  //Our execution price will be a little bit different, so we need some flexbility
  const amountOutMin = amountOutLastToken.sub(amountOutLastToken.div(50));// you want at least 98%
  console.log(`Selling new token:
    tokenWallet: ${walletToken} ${amountIn.toString()} ${tokenAddresses[walletToken]}
    tokenIn: ${inputToken} ${tokenAddresses[inputToken]}
    tokenOut: ${outputToken} ${amountOutMin.toString()} ${tokenAddresses[outputToken]}`);

  // should be the same for both swapExactTokensForEth and swapExactTokensForTokens
  let options = {
    gasLimit: gasLimit,
    gasPrice: gasPrice
  };

  let tx
  let txCreated = false
  let txSuccessful = false
  const swapExactTokensForEth = "swapExactTokensForEth";
  const swapExactTokensForTokens = "swapExactTokensForTokens";
  let swapMethod = swapExactTokensForEth;
  if (walletTokenAddress.toLowerCase() != exhcnageAddresses.nativeToken.toLowerCase())
  { swapMethod = swapExactTokensForTokens; }

  if (buy)
  {
    if (swapMethod == swapExactTokensForTokens)
    {
      try {
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, //10 minutes
          options
        );
        txCreated = true
      }
      catch (error)
      { console.log("error sell swapExactTokensForTokens: " + error.message); }
    }
    else if (swapMethod == swapExactTokensForEth)
    {
      try {
        tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, //10 minutes
          options// in swapExactTokensForETH method you have to put amountIn inside options 
        );
        txCreated = true
      }
      catch (error)
      { console.log("error sell swapExactTokensForETH: " + error.message); }
    }

    if (txCreated)
    {
      console.log('Transaction created');

      let receipt
      try {
        receipt = await tx.wait();// typeof receipt ti vrne: object
        txSuccessful = true;// if tx fails due to gas being too low, it throws an error and doesn't even get to here

        console.log("\n\n!!!SELL TRANSACTION " + (successfulSells + 1) + " SUCCESSFUL!!!\ntransactionHash: " + receipt.transactionHash + "\n" + (currentPriceBase / boughtPriceBase) + " X\n\n");// to dela
        console.log("IN: " + amountIn / (10 ** outputTokenDecimals) + " " + outputToken + "\nOUT: " + amountOutMin / (10 ** walletTokenDecimals) + " " + walletToken + "\n\n");
      }
      catch (error)
      {
        console.log("error sell receipt: " + error.message);

        if (receipt != undefined)
        { console.log("\n\n!!!SELL TRANSACTION " + (successfulSells + 1) + " FAILED!!!\ntransactionHash: " + receipt.transactionHash + "\n\n"); }
      }

      if (txSuccessful)
      {
        successfulSells++;

        // beep - alert
        console.log('\u0007');
      }
    }
  }
}

function getGasPrice()
{
  let gasPriceStr = '';

  if (chain == bsc)
  { gasPriceStr = '6'; }
  else if (chain == polygon)
  { gasPriceStr = '201'; }
  else if (chain == eth)
  { gasPriceStr = '151'; }

  let gasPrice = ethers.utils.parseUnits(gasPriceStr, 'gwei')
  
  return gasPrice;
}

function array_move(arr, old_index, new_index) {
  if (new_index >= arr.length) {
      let k = new_index - arr.length + 1;
      while (k--) {
          arr.push(undefined);
      }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};

async function checkBalances(tokenSymbol)
{
  let balance = -1

  let tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], token_contract_ABI, account);
  try
  { balance = await tokenContractEthers.balanceOf(account.address) }
  catch (error)
  {
    console.log("error balanceOf " + tokenSymbol + ": " + error.message);
    return balance;
  }
  balanceStr = ethers.utils.formatUnits(balance.toString(), tokenDecimals[tokenSymbol]);

  return balance;
}

function getToken0(tokenAaddress, tokenBaddress)
{ return Number(tokenAaddress) < Number(tokenBaddress) ? tokenAaddress : tokenBaddress }
function getToken1(tokenAaddress, tokenBaddress)
{ return Number(tokenAaddress) > Number(tokenBaddress) ? tokenAaddress : tokenBaddress }

function calculatePairAddress(tokenAaddress, tokenBaddress)
{
  let token1Address = getToken0(tokenAaddress, tokenBaddress);
  let token2Address = getToken1(tokenAaddress, tokenBaddress);
  
  let packedResult = ethers.utils.solidityKeccak256([ 'bytes', 'bytes' ], [ token1Address, token2Address ]);

  let part1 = '0xff';
  let part2 = exchangeAddresses.initCode;
  let factory1 = exchangeAddresses.factory;

  let packedResult2 = ethers.utils.solidityKeccak256([ 'bytes', 'bytes', 'bytes', 'bytes' ], [ part1, factory1, packedResult, part2 ]);//
  
  // string that you get is larger, so you cut the front part
  let pairAddress = "0x" + packedResult2.substring(packedResult2.length - 40);
  
  return pairAddress;
}