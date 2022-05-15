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

export async function checkBalances (account, tokenSymbol) {
  let balance = -1

  const tokenContractEthers = new ethers.Contract(tokenAddresses[tokenSymbol], TOKEN_CONTRACT_ABI, account)
  try {
    balance = await tokenContractEthers.balanceOf(account.address)
  } catch (error) {
    console.log('error balanceOf ' + tokenSymbol + ': ' + error.message)
    return balance
  }

  return balance
}

export function arrayMove (arr, oldIndex, newIndex) {
  if (newIndex >= arr.length) {
    let k = newIndex - arr.length + 1
    while (k--) {
      arr.push(undefined)
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
};

export function getToken0 (tokenAaddress, tokenBaddress) {
  return Number(tokenAaddress) < Number(tokenBaddress) ? tokenAaddress : tokenBaddress
}
function getToken1 (tokenAaddress, tokenBaddress) {
  return Number(tokenAaddress) > Number(tokenBaddress) ? tokenAaddress : tokenBaddress
}

export function calculatePairAddress (tokenAaddress, tokenBaddress) {
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
