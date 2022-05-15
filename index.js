import { ethers } from 'ethers'

import { chain, buy, repeating, biggestLiquidityPair, getAlternativeBaseToken, gasLimit, amountInMaxUsd, sellTresholds, sellPriceMultiplier, recipient, walletTokens, inputTokens, outputTokens, RPC_URLS, nativeTokensPairsInputs, nativeTokensPairsOutputs } from './config.js'
import { tokenAddressesAllChains, tokenDecimalsAllChains, baseTokenUsdPairAddressesAllChains, baseTokenUsdPairToken0AddressesAllChains, baseTokensAllChains, basePairAddressesAllChains } from './constants/tokens.js'
import { exchangesAddresses, EXCHANGE_PAIR_ABIS, ROUTER_FUNCTIONS } from './constants/exchanges.js'
import { MS_2_MIN } from './constants/simple.js'
import { checkAllowance, approveMax, getDecimals, getGasPrice, checkBalances, arrayMove, calculatePairAddress, getToken0 } from './utils.js'

const basePairAddresses = basePairAddressesAllChains[chain]
const basePairToken0Addresses = basePairAddressesAllChains[chain]

const walletToken = walletTokens[chain]
const inputToken = inputTokens[chain]
const outputToken = outputTokens[chain]

let alreadyInFunction = false

let priceBnb = 0// for bsc chain
let priceMatic = 0// for polygon chain
let priceEth = 0// for polygon and eth chain

let alreadyBought = false
let failedBuyTransactions = 0

let outputTokenApproved = false

let boughtWalletTokenAmount = 0
let boughtOutputTokenBalance = -1
let amountToSell = 0
let boughtPriceBase = 0

let successfulSells = 0

init()

async function init () {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[chain])
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
  const account = wallet.connect(provider)

  // functions from Contract Source Code, not from Contract ABI section - you only need interface
  const router = new ethers.Contract(
    exchangesAddresses[chain].router,
    ROUTER_FUNCTIONS,
    account
  )

  if (repeating) {
    const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 100 // ms
    setInterval(async () => {
      await tryToExecuteTrade({ walletToken, inputToken, outputToken, walletTokens, inputTokens, outputTokens, chain, tokenDecimals: tokenDecimalsAllChains[chain], account, tokenAddresses: tokenAddressesAllChains[chain], buy, alreadyBought, failedBuyTransactions, boughtPriceBase, boughtWalletTokenAmount, amountToSell, sellTresholds, sellPriceMultiplier, successfulSells, outputTokenApproved, nativeTokensPairsInputs, nativeTokensPairsOutputs, baseTokenUsdPairAddresses: baseTokenUsdPairAddressesAllChains[chain], baseTokenUsdPairToken0Addresses: baseTokenUsdPairToken0AddressesAllChains[chain], exchangeAddresses: exchangesAddresses[chain], baseTokens: baseTokensAllChains[chain], router })
    }, POLLING_INTERVAL)
  } else {
    await tryToExecuteTrade({ walletToken, inputToken, outputToken, walletTokens, inputTokens, outputTokens, chain, tokenDecimals: tokenDecimalsAllChains[chain], account, tokenAddresses: tokenAddressesAllChains[chain], buy, alreadyBought, failedBuyTransactions, boughtPriceBase, boughtWalletTokenAmount, amountToSell, sellTresholds, sellPriceMultiplier, successfulSells, outputTokenApproved, nativeTokensPairsInputs, nativeTokensPairsOutputs, baseTokenUsdPairAddresses: baseTokenUsdPairAddressesAllChains[chain], baseTokenUsdPairToken0Addresses: baseTokenUsdPairToken0AddressesAllChains[chain], exchangeAddresses: exchangesAddresses[chain], baseTokens: baseTokensAllChains[chain], router })
  }
}

// checks, if trade is already executing, if not, checks, if the trade can be executed with specified token and executes it
async function tryToExecuteTrade ({ walletToken, inputToken, outputToken, walletTokens, inputTokens, outputTokens, chain, tokenDecimals, account, tokenAddresses, buy, alreadyBought, failedBuyTransactions, boughtPriceBase, boughtWalletTokenAmount, amountToSell, sellTresholds, sellPriceMultiplier, successfulSells, outputTokenApproved, nativeTokensPairsInputs, nativeTokensPairsOutputs, baseTokenUsdPairAddresses, baseTokenUsdPairToken0Addresses, exchangeAddresses, baseTokens, router }) {
  if (alreadyInFunction) {
    return
  }

  alreadyInFunction = true

  if (alreadyBought) {
    await tryToSell({ inputToken, outputToken, boughtPriceBase, boughtWalletTokenAmount, amountToSell, sellTresholds, sellPriceMultiplier, successfulSells, outputTokenApproved, tokenAddresses, tokenDecimals, exchangeAddresses, account, router })
  } else {
    await tryToBuy({ walletToken, inputToken, outputToken, walletTokens, inputTokens, outputTokens, chain, tokenDecimals, account, tokenAddresses, buy, alreadyBought, failedBuyTransactions, outputTokenApproved, nativeTokensPairsInputs, nativeTokensPairsOutputs, baseTokenUsdPairAddresses, baseTokenUsdPairToken0Addresses, exchangeAddresses, baseTokens, router })
  }

  alreadyInFunction = false
}

async function tryToBuy ({ walletToken, inputToken, outputToken, walletTokens, inputTokens, outputTokens, chain, tokenDecimals, account, tokenAddresses, buy, alreadyBought, failedBuyTransactions, nativeTokensPairsInputs, nativeTokensPairsOutputs, baseTokenUsdPairAddresses, baseTokenUsdPairToken0Addresses, exchangeAddresses, baseTokens, router }) {
  walletToken = walletTokens[chain]
  if (inputToken != '') {
    inputToken = inputTokens[chain]
  }
  outputToken = outputTokens[chain]

  // just in case you forgot to add 'W'
  if (walletToken == 'BNB' || walletToken == 'ETH' || walletToken == 'MATIC') {
    walletToken = 'W' + walletToken
  }
  if (inputToken == 'BNB' || inputToken == 'ETH' || inputToken == 'MATIC') {
    inputToken = 'W' + inputToken
  }

  await approveIfNeeded({ outputTokenApproved, account, outputToken })

  await getNativeTokenPrices({ nativeTokensPairsInputs, nativeTokensPairsOutputs, chain, baseTokenUsdPairAddresses, baseTokenUsdPairToken0Addresses, tokenAddresses, tokenDecimals, account })

  while (inputToken != '' && tokenDecimals[inputToken] == 0) {
    tokenDecimals[inputToken] = await getDecimals(account, tokenAddresses[inputToken])
  }
  while (tokenDecimals[outputToken] == 0) {
    tokenDecimals[outputToken] = await getDecimals(account, tokenAddresses[outputToken])
  }

  console.log('decimals: ' + inputToken + ' ' + tokenDecimals[inputToken] + ', ' + outputToken + ' ' + tokenDecimals[outputToken])

  /// GET CORRECT LIQUIDITY PAIR ///

  // checks, if inputToken is specified
  const { inputTokenSymbol, rate } = await GetCorrectLiquidityPair({ inputTokenSymbol: inputToken, outputTokenSymbol: outputToken, tokenAddresses, tokenDecimals, baseTokens, account })
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
      rate, // rate vedno gledaš glede na inputToken, ne walletToken
      tokenAddresses,
      tokenDecimals,
      exchangeAddresses,
      router,
      account
    })
  }
}

async function tryToSell ({ inputToken, outputToken, boughtPriceBase, boughtWalletTokenAmount, amountToSell, sellTresholds, sellPriceMultiplier, successfulSells, tokenAddresses, tokenDecimals, exchangeAddresses, account, router }) {
  await approveIfNeeded({ outputTokenApproved, account, outputToken })

  // you already have inputToken and output token decimals, so you check the price
  const { rate } = await checkPair({
    inputTokenSymbol: inputToken,
    outputTokenSymbol: outputToken,
    logging: true,
    pairAddressIn: '',
    pairToken0AddressIn: '',
    tokenAddresses,
    tokenDecimals,
    account
  })

  const currentPriceBase = 1 / rate

  if (buy && alreadyBought) {
    // sell bought token
    if (boughtPriceBase != 0 && boughtWalletTokenAmount != 0)// just in case
    {
      const balanceToSell = amountToSell.mul(33).div(100)// you get 33%

      console.log('current price base: ' + currentPriceBase + ', bought price base: ' + boughtPriceBase + ', balanceToSell: ' + balanceToSell)

      if (currentPriceBase > sellTresholds[0] * boughtPriceBase * sellPriceMultiplier && successfulSells == 0 ||
          currentPriceBase > sellTresholds[1] * boughtPriceBase * sellPriceMultiplier && successfulSells == 1 ||
          currentPriceBase > sellTresholds[2] * boughtPriceBase * sellPriceMultiplier && successfulSells == 2) {
        await SellBoughtToken({ balanceToSell, currentPriceBase, tokenAddresses, tokenDecimals, exchangeAddresses, router })
      }
    } else {
      console.log('This should not happen: boughtPriceBase == 0 or boughtWalletTokenAmount == 0')
    }
  }
}

async function approveIfNeeded ({ outputTokenApproved, account, outputToken }) {
  if (!outputTokenApproved) {
    const allowance = await checkAllowance(account, outputToken)
    if (allowance == 0) {
      let approved = false
      while (!approved) {
        approved = await approveMax(account, outputToken)
      }
    }
    outputTokenApproved = true
  }
}

async function getNativeTokenPrices ({ nativeTokensPairsInputs, nativeTokensPairsOutputs, chain, baseTokenUsdPairAddresses, baseTokenUsdPairToken0Addresses, tokenAddresses, tokenDecimals, account }) {
  const inputTokens = nativeTokensPairsInputs[chain]
  const outputTokens = nativeTokensPairsOutputs[chain]

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

    const { rate } = await checkPair({
      inputTokenSymbol: inputTokens[i],
      outputTokenSymbol: outputTokens[i],
      logging: false,
      pairAddressIn,
      pairToken0AddressIn,
      tokenAddresses,
      tokenDecimals,
      account
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

// returns input token symbol, in case of big enough liquidity, otherwise ""
async function GetCorrectLiquidityPair (args) {
  const { inputTokenSymbol, outputTokenSymbol, tokenAddresses, tokenDecimals, baseTokens, account } = args

  const prices = []
  const inputTokenReserves = []
  const outputTokenReserves = []
  const inputTokenReservesUSD = []

  const minReserveTreshold = 10000// če je manj kot 10000, pol je to ful malo
  let maxReserveUSDvalue = 0
  let maxReserveUSDindex = -1

  if (inputTokenSymbol != '' && baseTokens[0] != inputTokenSymbol) {
    arrayMove(baseTokens, baseTokens.indexOf(inputTokenSymbol), 0)
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
      pairToken0AddressIn,
      tokenAddresses,
      tokenDecimals,
      account
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
  const { inputTokenSymbol, outputTokenSymbol, pairAddressIn, pairToken0AddressIn, tokenAddresses, tokenDecimals, account } = args

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

  let exchangePairReserves

  const exchangePairContract = new ethers.Contract(exchangePairAddress, EXCHANGE_PAIR_ABIS[chain], account)
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
  const { walletTokenSymbol, inputTokenSymbol, outputTokenSymbol, tokenAddresses, tokenDecimals, exchangeAddresses, router, account } = args

  let inputTokenAddress = ''

  if (inputTokenSymbol != '')// input (base) token je znan
  {
    inputTokenAddress = tokenAddresses[inputTokenSymbol]
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

  const walletTokenPrice = returnNativeTokenPrice(walletTokenSymbol)
  const inputTokenPrice = returnNativeTokenPrice(inputTokenSymbol)

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
          boughtOutputTokenBalance = await checkBalances(account, outputTokenSymbol)
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
          const allowance = await checkAllowance(account, outputTokenSymbol)
          if (allowance == 0) {
            let approved = false
            while (!approved) {
              approved = await approveMax(account, outputTokenSymbol)
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
  const { balanceToSell, currentPriceBase, tokenAddresses, tokenDecimals, exchangeAddresses, router } = args

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
