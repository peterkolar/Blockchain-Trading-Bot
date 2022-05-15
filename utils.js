import { tokenAddressesAllChains, TOKEN_CONTRACT_ABI } from './constants/tokens.js'
import { chain, gasPrices } from './config.js'
import { ethers } from 'ethers'
import { exchangesAddresses } from './constants/exchanges.js'

const tokenAddresses = tokenAddressesAllChains[chain]
const exchangeAddresses = exchangesAddresses[chain]

export async function checkAllowance (account, tokenSymbol) {
  const tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], TOKEN_CONTRACT_ABI, account)
  let allowance = 0

  try {
    allowance = await tokenContractEthers.allowance(account.address, exchangeAddresses.router)
  } catch (error) {
    console.log('error checkAllowance for ' + tokenSymbol + ': ' + error.message)
    return allowance
  }

  return allowance
}

export async function approveMax (account, tokenSymbol) {
  const tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], TOKEN_CONTRACT_ABI, account)
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

export async function getDecimals (account, tokenAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_CONTRACT_ABI, account)
  let decimals = 0
  try {
    decimals = await tokenContract.decimals()
  } catch (error) {
    console.log('error getDecimals: ' + error.message)
  }

  return decimals
}

export function getGasPrice () {
  const gasPriceStr = gasPrices[chain]

  const gasPrice = ethers.utils.parseUnits(gasPriceStr, 'gwei')

  return gasPrice
}
