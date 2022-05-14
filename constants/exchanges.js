import { eth, bsc, polygon } from './blockchains.js'

export const exchangesAddresses = {
  [eth]: {
    nativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    initCode: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
  },
  [bsc]: {
    nativeToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    initCode: '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5'// pancakeswap v2 (v1 is different)
  },
  [polygon]: {
    nativeToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
    factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    initCode: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
  }
}

// is the same for Uniswap V2, pancakeswap V2 and quickswap - you can get Pancakeswap v2 WBNB/USDC Template here: https://bscscan.com/address/0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b#code, similar for all chains
const exchangePairAbi = [{ inputs: [], payable: false, stateMutability: 'nonpayable', type: 'constructor' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'owner', type: 'address' }, { indexed: true, internalType: 'address', name: 'spender', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Approval', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'sender', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'to', type: 'address' }], name: 'Burn', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'sender', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' }], name: 'Mint', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'sender', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount0In', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount1In', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount0Out', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount1Out', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'to', type: 'address' }], name: 'Swap', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'uint112', name: 'reserve0', type: 'uint112' }, { indexed: false, internalType: 'uint112', name: 'reserve1', type: 'uint112' }], name: 'Sync', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'from', type: 'address' }, { indexed: true, internalType: 'address', name: 'to', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Transfer', type: 'event' }, { constant: true, inputs: [], name: 'DOMAIN_SEPARATOR', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'MINIMUM_LIQUIDITY', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'PERMIT_TYPEHASH', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [{ internalType: 'address', name: '', type: 'address' }, { internalType: 'address', name: '', type: 'address' }], name: 'allowance', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'approve', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'balanceOf', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: 'to', type: 'address' }], name: 'burn', outputs: [{ internalType: 'uint256', name: 'amount0', type: 'uint256' }, { internalType: 'uint256', name: 'amount1', type: 'uint256' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'factory', outputs: [{ internalType: 'address', name: '', type: 'address' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'getReserves', outputs: [{ internalType: 'uint112', name: '_reserve0', type: 'uint112' }, { internalType: 'uint112', name: '_reserve1', type: 'uint112' }, { internalType: 'uint32', name: '_blockTimestampLast', type: 'uint32' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: '_token0', type: 'address' }, { internalType: 'address', name: '_token1', type: 'address' }], name: 'initialize', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'kLast', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: 'to', type: 'address' }], name: 'mint', outputs: [{ internalType: 'uint256', name: 'liquidity', type: 'uint256' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'name', outputs: [{ internalType: 'string', name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'nonces', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: 'owner', type: 'address' }, { internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }, { internalType: 'uint8', name: 'v', type: 'uint8' }, { internalType: 'bytes32', name: 'r', type: 'bytes32' }, { internalType: 'bytes32', name: 's', type: 'bytes32' }], name: 'permit', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'price0CumulativeLast', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'price1CumulativeLast', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: 'to', type: 'address' }], name: 'skim', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: false, inputs: [{ internalType: 'uint256', name: 'amount0Out', type: 'uint256' }, { internalType: 'uint256', name: 'amount1Out', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'bytes', name: 'data', type: 'bytes' }], name: 'swap', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'symbol', outputs: [{ internalType: 'string', name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [], name: 'sync', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'token0', outputs: [{ internalType: 'address', name: '', type: 'address' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'token1', outputs: [{ internalType: 'address', name: '', type: 'address' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'totalSupply', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'transfer', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: false, inputs: [{ internalType: 'address', name: 'from', type: 'address' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'transferFrom', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }]

export const EXCHANGE_PAIR_ABIS = {
  [eth]: exchangePairAbi,
  [bsc]: exchangePairAbi,
  [polygon]: exchangePairAbi
}

export const ROUTER_FUNCTIONS = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  // manually added:
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
]
