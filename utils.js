import { tokenAddressesAllChains, TOKEN_CONTRACT_ABI } from './constants/tokens.js'
import { chain } from './config.js'
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
