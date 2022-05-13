import dotenv from 'dotenv'

import { ethers } from 'ethers'

import { eth, bsc, polygon } from './constants/blockchains.js'
import { chain, buy, repeating, biggestLiquidityPair, getAlternativeBaseToken, gasLimit, amountInMaxUsd, sellTresholds, sellPriceMultiplier, recipient } from './config.js'
import { walletTokenEth, inputTokenEth, outputTokenEth, walletTokenBsc, inputTokenBsc, outputTokenBsc, walletTokenPolygon, inputTokenPolygon, outputTokenPolygon, tokenAddressesAllChains, tokenDecimalsAllChains } from './constants/tokens.js'
import { exchangesAddresses, EXCHANGE_PAIR_ABIS } from './constants/exchanges.js'
import { RPC_URLS } from './constants/RPCs.js'

const MS_2_MIN = 1000 * 60// milliseconds -> minutes conversion

let provider

const RPC_URL = RPC_URLS[chain]
const tokenAddresses = tokenAddressesAllChains[chain]
const tokenDecimals = tokenDecimalsAllChains[chain]

const exchangeAddresses = exchangesAddresses[chain]

const EXCHANGE_PAIR_ABI = EXCHANGE_PAIR_ABIS[chain]

const token_contract_ABI = [{ constant: true, inputs: [], name: 'name', outputs: [{ name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ name: 'guy', type: 'address' }, { name: 'wad', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ name: 'src', type: 'address' }, { name: 'dst', type: 'address' }, { name: 'wad', type: 'uint256' }], name: 'transferFrom', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: false, inputs: [{ name: 'wad', type: 'uint256' }], name: 'withdraw', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [{ name: '', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ name: 'dst', type: 'address' }, { name: 'wad', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: false, inputs: [], name: 'deposit', outputs: [], payable: true, stateMutability: 'payable', type: 'function' }, { constant: true, inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { payable: true, stateMutability: 'payable', type: 'fallback' }, { anonymous: false, inputs: [{ indexed: true, name: 'src', type: 'address' }, { indexed: true, name: 'guy', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Approval', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'src', type: 'address' }, { indexed: true, name: 'dst', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Transfer', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'dst', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Deposit', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'src', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Withdrawal', type: 'event' }]

provider = new ethers.providers.JsonRpcProvider(RPC_URL)

const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC)

const account = wallet.connect(provider)

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
)

let alreadyInFunction = false

let walletToken = ''
let inputToken = ''
let outputToken = ''

let izpisWalletInputOutput = false

let baseTokens
let basePairAddresses

if (chain == bsc) {
  baseTokens = ['WBNB', 'BUSD', 'USDT']
  basePairAddresses = { WBNB: '', BUSD: '', USDT: '' }
} else if (chain == polygon) {
  baseTokens = ['WETH', 'USDT', 'USDC', 'WMATIC', 'DAI']
  basePairAddresses = { WETH: '', USDT: '', USDC: '', WMATIC: '', DAI: '' }
} else if (chain == eth) {
  baseTokens = ['WETH', 'USDT']
  basePairAddresses = { WETH: '', USDT: '' }
}
const basePairToken0Addresses = JSON.parse(JSON.stringify(basePairAddresses))

let baseTokenUsdPairAddresses// WBNB/BUSD, WETH/USDT, WMATIC/USDT
let baseTokenUsdPairToken0Addresses// WBNB or BUSD, WETH or USDT, WMATIC or USDT

const baseTokenUsdPairAddressesBsc = {
  WBNBBUSD: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16'
}
const baseTokenUsdPairToken0AddressesBsc = {
  WBNBBUSD: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'// WBNB
}

const baseTokenUsdPairAddressesPolygon = {
  WMATICUSDT: '0x604229c960e5CACF2aaEAc8Be68Ac07BA9dF81c3',
  WETHUSDT: '0xF6422B997c7F54D1c6a6e103bcb1499EeA0a7046'
}
const baseTokenUsdPairToken0AddressesPolygon = {
  WMATICUSDT: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  WETHUSDT: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'// WETH
}

const baseTokenUsdPairAddressesEth = {
  WETHUSDT: '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852'
}
const baseTokenUsdPairToken0AddressesEth = {
  WETHUSDT: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'// WETH
}

if (chain == bsc) {
  baseTokenUsdPairAddresses = baseTokenUsdPairAddressesBsc
  baseTokenUsdPairToken0Addresses = baseTokenUsdPairToken0AddressesBsc
} else if (chain == polygon) {
  baseTokenUsdPairAddresses = baseTokenUsdPairAddressesPolygon
  baseTokenUsdPairToken0Addresses = baseTokenUsdPairToken0AddressesPolygon
}
if (chain == eth) {
  baseTokenUsdPairAddresses = baseTokenUsdPairAddressesEth
  baseTokenUsdPairToken0Addresses = baseTokenUsdPairToken0AddressesEth
}

let priceBnb = 0// for bsc chain
let priceMatic = 0// for polygon chain
let priceEth = 0// for polygon and eth chain

let alreadyBought = false
let failedBuyTransactions = 0

let walletTokenPrice = 1
let inputTokenPrice = 1

let outputTokenApproved = false

let boughtWalletTokenAmount = 0
let boughtOutputTokenBalance = -1
let amountToSell = 0
let boughtPriceBase = 0
let currentPriceBase = 0

if (repeating) {
  const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 100 // ms
  setInterval(async () => {
    await newTrade()
  }, POLLING_INTERVAL)
} else// call just 1 time
{
  newTrade()
}

async function newTrade () {
  if (alreadyInFunction) {
    return
  }

  alreadyInFunction = true

  if (!alreadyBought) {
    if (chain == eth) {
      walletToken = walletTokenEth
      if (inputTokenEth != '') {
        inputToken = inputTokenEth
      }
      outputToken = outputTokenEth
    } else if (chain == bsc) {
      walletToken = walletTokenBsc
      if (inputTokenBsc != '') {
        inputToken = inputTokenBsc
      }
      outputToken = outputTokenBsc
    } else if (chain == polygon) {
      walletToken = walletTokenPolygon
      if (inputTokenPolygon != '') {
        inputToken = inputTokenPolygon
      }
      outputToken = outputTokenPolygon
    }

    // just in case you forgot to add 'W'
    if (walletToken == 'BNB' || walletToken == 'ETH' || walletToken == 'MATIC') {
      walletToken = 'W' + walletToken
    }
    if (inputToken == 'BNB' || inputToken == 'ETH' || inputToken == 'MATIC') {
      inputToken = 'W' + inputToken
    }

    if (!izpisWalletInputOutput) {
      izpisWalletInputOutput = true
    }
  }

  if (!outputTokenApproved) {
    const allowance = await checkAllowance(outputToken)
    if (allowance == 0) {
      let approved = false
      while (!approved) {
        approved = await approveMax(outputToken)
      }
    }
    outputTokenApproved = true
  }

  if (!alreadyBought) {
    await getNativeTokenPrices()

    // get decimals if needed
    while (inputToken != '' && tokenDecimals[inputToken] == 0) {
      tokenDecimals[inputToken] = await getDecimals(tokenAddresses[inputToken])
    }
    while (tokenDecimals[outputToken] == 0) {
      tokenDecimals[outputToken] = await getDecimals(tokenAddresses[outputToken])
    }

    console.log('decimals: ' + inputToken + ' ' + tokenDecimals[inputToken] + ', ' + outputToken + ' ' + tokenDecimals[outputToken])

    /// GET CORRECT LIQUIDITY PAIR ///

    // checks, if inputToken is specified
    const { inputTokenSymbol, rate, inputTokenReserve, outputTokenReserve } = await GetCorrectLiquidityPair({ inputTokenSymbol: inputToken, outputTokenSymbol: outputToken })
    if (inputTokenSymbol != '' && rate != 0) {
      inputToken = inputTokenSymbol
    } else // if (inputTokenSymbol == '')
    {
      console.log('No big enough liquidity pair found for outputToken: ' + outputToken)

      alreadyInFunction = false
      return
    }

    if ((buy) && !alreadyBought && failedBuyTransactions <= 5) {
      await buyPair({
        walletTokenSymbol: walletToken,
        inputTokenSymbol: inputToken,
        outputTokenSymbol: outputToken,
        rate// rate vedno gledaš glede na inputToken, ne walletToken
      })
    }
  } else // if (alreadyBought)
  {
    // you already have inputToken and output token decimals, so you check the price
    const { rate, pairAddressOut, pairToken0AddressOut, inputTokenReserve, outputTokenReserve } = await checkPair({
      inputTokenSymbol: inputToken,
      outputTokenSymbol: outputToken,
      logging: true,
      pairAddressIn: '',
      pairToken0AddressIn: ''
    })

    currentPriceBase = 1 / rate

    if (buy && alreadyBought) {
      // sell bought token
      if (boughtPriceBase != 0 && boughtWalletTokenAmount != 0)// just in case
      {
        const balanceToSell = amountToSell.mul(33).div(100)// you get 33%

        console.log('current price base: ' + currentPriceBase + ', bought price base: ' + boughtPriceBase + ', balanceToSell: ' + balanceToSell)

        if (currentPriceBase > sellTresholds[0] * boughtPriceBase * sellPriceMultiplier && successfulSells == 0 ||
            currentPriceBase > sellTresholds[1] * boughtPriceBase * sellPriceMultiplier && successfulSells == 1 ||
            currentPriceBase > sellTresholds[2] * boughtPriceBase * sellPriceMultiplier && successfulSells == 2) {
          await SellBoughtToken({ balanceToSell })
        }
      } else {
        console.log('This should not happen: boughtPriceBase == 0 or boughtWalletTokenAmount == 0')
      }
    }
  }

  alreadyInFunction = false
}

async function checkAllowance (tokenSymbol) {
  const tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], token_contract_ABI, account)
  let allowance = 0

  try {
    allowance = await tokenContractEthers.allowance(account.address, exchangeAddresses.router)
  } catch (error) {
    console.log('error checkAllowance for ' + tokenSymbol + ': ' + error.message)
    return allowance
  }

  return allowance
}

async function approveMax (tokenSymbol) {
  const tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], token_contract_ABI, account)
  let approval
  try {
    approval = await tokenContractEthers.approve(exchangeAddresses.router, ethers.constants.MaxUint256)
    console.log('approved ' + ethers.constants.MaxUint256 + ' ' + tokenSymbol + ' for owner ' + account.address + ' and sender ' + exchangeAddresses.router)

    return true
  } catch (error) {
    console.log('error approve: ' + error.message)

    if (approval != undefined) {
      console.log('\n\n!!!APPROVAL FAILED!!!\ntransactionHash: ' + approval.hash + '\n\n')
    }

    return false
  }
}

async function getNativeTokenPrices () {
  let inputTokens
  let outputTokens

  if (chain == bsc) {
    inputTokens = ['WBNB']
    outputTokens = ['BUSD']
  } else if (chain == polygon) {
    inputTokens = ['WMATIC', 'WETH']
    outputTokens = ['USDT', 'USDT']
  } else if (chain == eth) {
    inputTokens = ['WETH']
    outputTokens = ['USDT']
  }

  for (let i = 0; i < inputTokens.length; i++) {
    let pairAddressIn = ''
    if (baseTokenUsdPairAddresses[inputTokens[i] + outputTokens[i]] != undefined)// sestaviš recimo: WBNBBUSD
    {
      pairAddressIn = baseTokenUsdPairAddresses[inputTokens[i] + outputTokens[i]]
    } else {
      console.log('Cannot get pairAddressIn, this should not happen!')
    }
    let pairToken0AddressIn = ''
    if (baseTokenUsdPairToken0Addresses[inputTokens[i] + outputTokens[i]] != undefined)// sestaviš recimo: WBNBBUSD
    {
      pairToken0AddressIn = baseTokenUsdPairToken0Addresses[inputTokens[i] + outputTokens[i]]
    } else {
      console.log('Cannot get pairToken0AddressIn, this should not happen!')
    }

    const { rate, pairAddressOut, pairToken0AddressOut, inputTokenReserve, outputTokenReserve } = await checkPair({
      inputTokenSymbol: inputTokens[i],
      outputTokenSymbol: outputTokens[i],
      logging: false,
      pairAddressIn,
      pairToken0AddressIn
    })

    if (rate != 0) {
      if (inputTokens[i] == 'WBNB') {
        priceBnb = rate
      } else if (inputTokens[i] == 'WMATIC') {
        priceMatic = rate
      } else if (inputTokens[i] == 'WETH') {
        priceEth = rate
      }
    } else {
      // there was an error
      i--
    }
  }

  /// END GET BASE PRICES ///
}

async function getDecimals (tokenAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, token_contract_ABI, account)
  let decimals = 0
  try {
    decimals = await tokenContract.decimals()
  } catch (error) {
    console.log('error getDecimals: ' + error.message)
  }

  return decimals
}

// returns input token symbol, in case of big enough liquidity, otherwise ""
async function GetCorrectLiquidityPair (args) {
  const { inputTokenSymbol, outputTokenSymbol } = args

  const prices = []
  const inputTokenReserves = []
  const outputTokenReserves = []
  const inputTokenReservesUSD = []

  const minReserveTreshold = 10000// če je manj kot 10000, pol je to ful malo
  let maxReserveUSDvalue = 0
  let maxReserveUSDindex = -1

  if (inputTokenSymbol != '' && baseTokens[0] != inputTokenSymbol) {
    array_move(baseTokens, baseTokens.indexOf(inputTokenSymbol), 0)
  }

  // get reserves for all pairs (for example BLOK/WETH, BLOK/USDT, BLOK/WMATIC)
  for (let i = 0; i < baseTokens.length; i++) {
    const pairAddressIn = basePairAddresses[baseTokens[i]]
    const pairToken0AddressIn = basePairToken0Addresses[baseTokens[i]]

    const { rate, pairAddressOut, pairToken0AddressOut, inputTokenReserve, outputTokenReserve } = await checkPair({
      inputTokenSymbol: baseTokens[i],
      outputTokenSymbol,
      logging: false,
      pairAddressIn,
      pairToken0AddressIn
    })
    if (pairAddressOut.toLowerCase() != '0x0000000000000000000000000000000000000000') {
      basePairAddresses[baseTokens[i]] = pairAddressOut
    }
    if (pairToken0AddressOut.toLowerCase() != '') {
      basePairToken0Addresses[baseTokens[i]] = pairToken0AddressOut
    }

    prices[i] = rate
    inputTokenReserves[i] = inputTokenReserve
    outputTokenReserves[i] = outputTokenReserve

    // get potenitalBaseTokenPrice, so you can price all liquidity pairs in USD value, so you can compare
    const potentialBaseTokenPrice = returnNativeTokenPrice(baseTokens[i])

    inputTokenReservesUSD[i] = inputTokenReserves[i] * potentialBaseTokenPrice / (10 ** tokenDecimals[baseTokens[i]])

    // check, if current liquidity pair is the biggest
    if (inputTokenReservesUSD[i] > maxReserveUSDvalue) {
      maxReserveUSDvalue = inputTokenReservesUSD[i]
      maxReserveUSDindex = i

      // if current biggest liquidity dovolj is big enough, you can set inputTokenSymbol
      if (!biggestLiquidityPair && maxReserveUSDvalue > minReserveTreshold) {
        return { inputTokenSymbol: baseTokens[maxReserveUSDindex], rate: prices[maxReserveUSDindex], inputTokenReserve: inputTokenReserves[maxReserveUSDindex], outputTokenReserve: outputTokenReserves[maxReserveUSDindex] }
      }
    } else if (i == 0 && inputTokenSymbol != '' && !getAlternativeBaseToken)// if an inputToken is specified and you want to buy with this pair, not necessarily the best
    {
      return { inputTokenSymbol: baseTokens[0], rate: prices[0], inputTokenReserve: inputTokenReserves[0], outputTokenReserve: outputTokenReserves[0] }
    }
  }

  // if the biggest liquidity pair is big enough, set inputTokenSymbol
  if (maxReserveUSDvalue > minReserveTreshold) {
    return { inputTokenSymbol: baseTokens[maxReserveUSDindex], rate: prices[maxReserveUSDindex], inputTokenReserve: inputTokenReserves[maxReserveUSDindex], outputTokenReserve: outputTokenReserves[maxReserveUSDindex] }
  } else// if you can't find big enough liquidity pair, don't buy anything
  {
    return { inputTokenSymbol: '', rate: 0, inputTokenReserve: 0, outputTokenReserve: 0 }
  }
}

async function checkPair (args) {
  const { inputTokenSymbol, outputTokenSymbol, logging, pairAddressIn, pairToken0AddressIn } = args

  const inputTokenAddress = tokenAddresses[inputTokenSymbol]
  const inputTokenDecimals = tokenDecimals[inputTokenSymbol]
  const outputTokenAddress = tokenAddresses[outputTokenSymbol]
  const outputTokenDecimals = tokenDecimals[outputTokenSymbol]

  let exchangePairAddress = '0x0000000000000000000000000000000000000000'

  if (inputTokenAddress == '' || outputTokenAddress == '') {
    console.log('Input or output token address not specified!')
  }

  let addressToken0 = ''
  let addressToken1

  if (pairAddressIn == '') {
    // this is OFF-CHAIN calculation
    exchangePairAddress = calculatePairAddress(inputTokenAddress, outputTokenAddress)
  } else {
    exchangePairAddress = pairAddressIn
  }

  if (exchangePairAddress.toLowerCase() == '0x0000000000000000000000000000000000000000') {
    console.log('Requested pair: ' + inputTokenSymbol + '/' + outputTokenSymbol + ' does not exist!')
    return { rate: 0, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve: 0, outputTokenReserve: 0 }
  }

  let exchangePairContract
  let exchangePairReserves

  exchangePairContract = new ethers.Contract(exchangePairAddress, EXCHANGE_PAIR_ABI, account)
  try {
    exchangePairReserves = await exchangePairContract.getReserves()
  } catch (error) {
    console.log('Both token reserves are 0!')
    return { rate: 0, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve: 0, outputTokenReserve: 0 }
  }

  if (exchangePairReserves._reserve0 == 0 && exchangePairReserves._reserve1 == 0) {
    return { rate: 0, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve: 0, outputTokenReserve: 0 }
  }

  if (pairToken0AddressIn == '') {
    // OFF-CHAIN
    addressToken0 = getToken0(inputTokenAddress, outputTokenAddress)
  } else {
    addressToken0 = pairToken0AddressIn
  }

  // set addressToken1
  addressToken1 = inputTokenAddress
  if (addressToken0.toLowerCase() == inputTokenAddress.toLowerCase()) {
    addressToken1 = outputTokenAddress
  }

  let rate = 0
  let inputTokenReserve = 0
  let outputTokenReserve = 0
  if (inputTokenAddress.toLowerCase() == addressToken0.toLowerCase() && outputTokenAddress.toLowerCase() == addressToken1.toLowerCase())// input = 0, output = 1
  {
    inputTokenReserve = exchangePairReserves._reserve0
    outputTokenReserve = exchangePairReserves._reserve1
  } else if (inputTokenAddress.toLowerCase() == addressToken1.toLowerCase() && outputTokenAddress.toLowerCase() == addressToken0.toLowerCase()) {
    inputTokenReserve = exchangePairReserves._reserve1
    outputTokenReserve = exchangePairReserves._reserve0
  }

  if (inputTokenReserve != 0 && outputTokenReserve != 0) {
    rate = outputTokenReserve * 10 ** (inputTokenDecimals - outputTokenDecimals) / inputTokenReserve
  } else {
    return { rate, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve, outputTokenReserve }
  }

  return { rate, pairAddressOut: exchangePairAddress, pairToken0AddressOut: addressToken0, inputTokenReserve, outputTokenReserve }
}

async function buyPair (args)// walletTokenSymbol is base token in your wallet, inputTokenSymbol is liquidity pair base token, outputToken is buyToken
{
  const { walletTokenSymbol, inputTokenSymbol, outputTokenSymbol, rate } = args

  tokenPriceBase = 1 / rate

  let inputTokenAddress = ''

  if (inputTokenSymbol != '')// input (base) token je znan
  {
    inputTokenAddress = tokenAddresses[inputTokenSymbol]
    inputTokenDecimals = tokenDecimals[inputTokenSymbol]
  }

  const outputTokenAddress = tokenAddresses[outputTokenSymbol]
  const outputTokenDecimals = tokenDecimals[outputTokenSymbol]

  let walletTokenAddress = ''
  let walletTokenDecimals = 0

  if (walletTokenSymbol != '') {
    walletTokenAddress = tokenAddresses[walletTokenSymbol]
    walletTokenDecimals = tokenDecimals[walletTokenSymbol]
  }

  const gasPrice = getGasPrice()

  /// AMOUNTS ///

  walletTokenPrice = returnNativeTokenPrice(walletTokenSymbol)
  inputTokenPrice = returnNativeTokenPrice(inputTokenSymbol)

  const amountInNum = amountInMaxUsd / walletTokenPrice

  const amountIn = ethers.utils.parseUnits(amountInNum.toString(), walletTokenDecimals)

  let path// token addresses
  if (walletTokenAddress.toLowerCase() == inputTokenAddress.toLowerCase()) {
    path = [inputTokenAddress, outputTokenAddress]
  } else if (walletTokenAddress.toLowerCase() != inputTokenAddress.toLowerCase()) {
    path = [walletTokenAddress, inputTokenAddress, outputTokenAddress]
  }

  let amounts
  try {
    amounts = await router.getAmountsOut(amountIn, path)
  }// dobiš array z isto dolžino kot path (za vsak element posebej), 1. element je isti kot amountIn
  catch (error) {
    console.log('error buy getAmountsOut: ' + error.message)
    return
  }

  const amountOutLastToken = amounts[amounts.length - 1]

  // Our execution price will be a little bit different, so we need some flexbility
  const amountOutMin = amountOutLastToken.sub(amountOutLastToken.div(10))// hočeš vsaj 90%
  console.log(`Buying new token:
    tokenWallet: ${walletTokenSymbol} ${amountIn.toString()} ${walletTokenAddress}
    tokenIn: ${inputTokenSymbol} ${inputTokenAddress}
    tokenOut: ${outputTokenSymbol} ${amountOutMin.toString()} ${outputTokenAddress}`)

  let options = {
    value: amountIn,
    gasLimit,
    gasPrice
  }
  if (walletTokenAddress.toLowerCase() != exchangeAddresses.nativeToken.toLowerCase()) {
    options = {
      gasLimit,
      gasPrice
    }
  }

  let tx
  let txCreated = false
  let txSuccessful = false
  const swapExactEthForTokens = 'swapExactEthForTokens'
  const swapExactTokensForTokens = 'swapExactTokensForTokens'
  let swapMethod = swapExactEthForTokens
  if (walletTokenAddress.toLowerCase() != exchangeAddresses.nativeToken.toLowerCase()) {
    swapMethod = swapExactTokensForTokens
  }

  if (buy) {
    if (swapMethod == swapExactTokensForTokens) {
      try {
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, // 10 minutes
          options// in swapExactTokensForETH method you have to put amountIn inside options
        )
        txCreated = true
      } catch (error) {
        console.log('error buy swapExactTokensForTokens: ' + error.message)
      }
    } else if (swapMethod == swapExactEthForTokens) {
      try {
        tx = await router.swapExactETHForTokens(
          amountOutMin, // with amountOutMin you specify slippage
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, // 10 minutes
          options
        )
        txCreated = true
      } catch (error) {
        console.log('error buy swapExactETHForTokens: ' + error.message)
        console.log('\n\n!!!TRANSACTION ERROR!!!\n\n')
      }
    }

    if (txCreated) {
      console.log('Transaction created')

      let receipt
      try {
        receipt = await tx.wait()
        txSuccessful = true
        boughtWalletTokenAmount = amountIn// so you can calculate the actual buy price

        console.log('\n\n!!!BUY TRANSACTION SUCCESSFUL!!!\ntransactionHash: ' + receipt.transactionHash + '\n\n')// to dela
        console.log('IN: ' + amountIn / (10 ** walletTokenDecimals) + ' ' + walletTokenSymbol + '\nOUT: ' + amountOutMin / (10 ** outputTokenDecimals) + ' ' + outputTokenSymbol + '\n\n')
      } catch (error) {
        console.log('error buy receipt: ' + error.message)

        if (receipt != undefined) {
          console.log('\n\n!!!BUY TRANSACTION FAILED!!!\ntransactionHash: ' + receipt.transactionHash + '\n\n')
        }
      }

      if (txSuccessful) {
        alreadyBought = true

        // beep - alert
        console.log('\u0007')

        // how much of bought tokens do you have and at what price you bought them
        while (boughtOutputTokenBalance == -1) {
          boughtOutputTokenBalance = await checkBalances(outputTokenSymbol)
        }// returns -1 in case of error

        if (amountOutLastToken.lte(boughtOutputTokenBalance))// lte means <=
        {
          amountToSell = amountOutLastToken
        } else if (boughtOutputTokenBalance.lte(amountOutLastToken))// lte means <=
        {
          amountToSell = boughtOutputTokenBalance
        }

        const boughtRateWallet = amountToSell * 10 ** (walletTokenDecimals - outputTokenDecimals) / boughtWalletTokenAmount// works, assuming you didn't have this token in the wallet prior to buying
        boughtPriceBase = 1 / boughtRateWallet * walletTokenPrice / inputTokenPrice
        console.log('bought output token balance: ' + boughtOutputTokenBalance + ', amountToSell: ' + amountToSell + ', bought price base: ' + boughtPriceBase)

        // checks, if token is approved and approve it if needed
        if (!outputTokenApproved) {
          const allowance = await checkAllowance(outputTokenSymbol)
          if (allowance == 0) {
            let approved = false
            while (!approved) {
              approved = await approveMax(outputTokenSymbol)
            }
          }
          outputTokenApproved = true// če je prišel do sem, je zihr approvan
        }
      } else {
        failedBuyTransactions++
      }
    }
  }
}

function returnNativeTokenPrice (tokenSymbol) {
  switch (tokenSymbol) {
    case 'WBNB':
      return priceBnb
    case 'WMATIC':
      return priceMatic
    case 'WETH':
      return priceEth
    case 'USDT': case 'USDC': case 'BUSD': case 'DAI':
      return 1
  }
  return 1
}

async function SellBoughtToken (args)// walletTokenSymbol is base token in your wallet, inputTokenSymbol is base token from liquidity pair (USDT, WETH, WBNB, WMATIC, USDC, ...), outputToken is buyToken
{
  const { balanceToSell } = args

  let inputTokenAddress = ''

  if (inputToken != '') {
    inputTokenAddress = tokenAddresses[inputToken]
  }

  const outputTokenAddress = tokenAddresses[outputToken]
  const outputTokenDecimals = tokenDecimals[outputToken]

  let walletTokenAddress = ''
  let walletTokenDecimals = 0

  if (walletToken != '') {
    walletTokenAddress = tokenAddresses[walletToken]
    walletTokenDecimals = tokenDecimals[walletToken]
  }

  const gasPrice = getGasPrice()

  const amountIn = balanceToSell

  let path// token addresses
  if (walletTokenAddress.toLowerCase() == inputTokenAddress.toLowerCase()) {
    path = [outputTokenAddress, inputTokenAddress]
  } else if (walletTokenAddress.toLowerCase() != inputTokenAddress.toLowerCase()) {
    path = [outputTokenAddress, inputTokenAddress, walletTokenAddress]
  }

  let amounts
  try {
    amounts = await router.getAmountsOut(amountIn, path)
  } catch (error) {
    console.log('error sell getAmountsOut: ' + error.message)
    return// because the price might have changed
  }
  const amountOutLastToken = amounts[amounts.length - 1]

  // Our execution price will be a little bit different, so we need some flexbility
  const amountOutMin = amountOutLastToken.sub(amountOutLastToken.div(50))// you want at least 98%
  console.log(`Selling new token:
    tokenWallet: ${walletToken} ${amountIn.toString()} ${tokenAddresses[walletToken]}
    tokenIn: ${inputToken} ${tokenAddresses[inputToken]}
    tokenOut: ${outputToken} ${amountOutMin.toString()} ${tokenAddresses[outputToken]}`)

  // should be the same for both swapExactTokensForEth and swapExactTokensForTokens
  const options = {
    gasLimit,
    gasPrice
  }

  let tx
  let txCreated = false
  let txSuccessful = false
  const swapExactTokensForEth = 'swapExactTokensForEth'
  const swapExactTokensForTokens = 'swapExactTokensForTokens'
  let swapMethod = swapExactTokensForEth
  if (walletTokenAddress.toLowerCase() != exhcnageAddresses.nativeToken.toLowerCase()) {
    swapMethod = swapExactTokensForTokens
  }

  if (buy) {
    if (swapMethod == swapExactTokensForTokens) {
      try {
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, // 10 minutes
          options
        )
        txCreated = true
      } catch (error) {
        console.log('error sell swapExactTokensForTokens: ' + error.message)
      }
    } else if (swapMethod == swapExactTokensForEth) {
      try {
        tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          recipient,
          Date.now() + MS_2_MIN * 10, // 10 minutes
          options// in swapExactTokensForETH method you have to put amountIn inside options
        )
        txCreated = true
      } catch (error) {
        console.log('error sell swapExactTokensForETH: ' + error.message)
      }
    }

    if (txCreated) {
      console.log('Transaction created')

      let receipt
      try {
        receipt = await tx.wait()// typeof receipt ti vrne: object
        txSuccessful = true// if tx fails due to gas being too low, it throws an error and doesn't even get to here

        console.log('\n\n!!!SELL TRANSACTION ' + (successfulSells + 1) + ' SUCCESSFUL!!!\ntransactionHash: ' + receipt.transactionHash + '\n' + (currentPriceBase / boughtPriceBase) + ' X\n\n')// to dela
        console.log('IN: ' + amountIn / (10 ** outputTokenDecimals) + ' ' + outputToken + '\nOUT: ' + amountOutMin / (10 ** walletTokenDecimals) + ' ' + walletToken + '\n\n')
      } catch (error) {
        console.log('error sell receipt: ' + error.message)

        if (receipt != undefined) {
          console.log('\n\n!!!SELL TRANSACTION ' + (successfulSells + 1) + ' FAILED!!!\ntransactionHash: ' + receipt.transactionHash + '\n\n')
        }
      }

      if (txSuccessful) {
        successfulSells++

        // beep - alert
        console.log('\u0007')
      }
    }
  }
}

function getGasPrice () {
  let gasPriceStr = ''

  if (chain == bsc) {
    gasPriceStr = '6'
  } else if (chain == polygon) {
    gasPriceStr = '201'
  } else if (chain == eth) {
    gasPriceStr = '151'
  }

  const gasPrice = ethers.utils.parseUnits(gasPriceStr, 'gwei')

  return gasPrice
}

function array_move (arr, old_index, new_index) {
  if (new_index >= arr.length) {
    let k = new_index - arr.length + 1
    while (k--) {
      arr.push(undefined)
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
};

async function checkBalances (tokenSymbol) {
  let balance = -1

  const tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], token_contract_ABI, account)
  try {
    balance = await tokenContractEthers.balanceOf(account.address)
  } catch (error) {
    console.log('error balanceOf ' + tokenSymbol + ': ' + error.message)
    return balance
  }
  balanceStr = ethers.utils.formatUnits(balance.toString(), tokenDecimals[tokenSymbol])

  return balance
}

function getToken0 (tokenAaddress, tokenBaddress) {
  return Number(tokenAaddress) < Number(tokenBaddress) ? tokenAaddress : tokenBaddress
}
function getToken1 (tokenAaddress, tokenBaddress) {
  return Number(tokenAaddress) > Number(tokenBaddress) ? tokenAaddress : tokenBaddress
}

function calculatePairAddress (tokenAaddress, tokenBaddress) {
  const token1Address = getToken0(tokenAaddress, tokenBaddress)
  const token2Address = getToken1(tokenAaddress, tokenBaddress)

  const packedResult = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [token1Address, token2Address])

  const part1 = '0xff'
  const part2 = exchangeAddresses.initCode
  const factory1 = exchangeAddresses.factory

  const packedResult2 = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'bytes'], [part1, factory1, packedResult, part2])//

  // string that you get is larger, so you cut the front part
  const pairAddress = '0x' + packedResult2.substring(packedResult2.length - 40)

  return pairAddress
}
