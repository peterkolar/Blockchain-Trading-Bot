import { eth, bsc, polygon } from './blockchains.js'

const tokenAddressesEth = {
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  KNC: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
  LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
  RISE: '0x8a2d988fe2e8c6716cbcef1b33df626c692f7b98',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7'
}

const tokenDecimalsEth = {
  WETH: 18,
  WBTC: 8,
  MKR: 18,
  DAI: 18,
  USDC: 6,
  KNC: 18,
  LINK: 18,
  RISE: 9,
  USDT: 6
}

const tokenAddressesBsc = {
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
  CBT: '0x7c73967dC8c804Ea028247f5A953052f0CD5Fd58'
}

// if you set 0 decimals, it will get it from smart contract
const tokenDecimalsBsc = {
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
  CBT: 18
}

const tokenAddressesPolygon = {
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
  KMC: ''
}

const tokenDecimalsPolygon = {
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
  TECH2: 0
}

export const tokenAddressesAllChains = {
  [eth]: tokenAddressesEth,
  [bsc]: tokenAddressesBsc,
  [polygon]: tokenAddressesPolygon
}

export const tokenDecimalsAllChains = {
  [eth]: tokenDecimalsEth,
  [bsc]: tokenDecimalsBsc,
  [polygon]: tokenDecimalsPolygon
}

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

export const baseTokenUsdPairAddressesAllChains = {
  [eth]: baseTokenUsdPairAddressesEth,
  [bsc]: baseTokenUsdPairAddressesBsc,
  [polygon]: baseTokenUsdPairAddressesPolygon
}

export const baseTokenUsdPairToken0AddressesAllChains = {
  [eth]: baseTokenUsdPairToken0AddressesEth,
  [bsc]: baseTokenUsdPairToken0AddressesBsc,
  [polygon]: baseTokenUsdPairToken0AddressesPolygon
}

export const baseTokensAllChains = {
  [eth]: ['WETH', 'USDT'],
  [bsc]: ['WBNB', 'BUSD', 'USDT'],
  [polygon]: ['WETH', 'USDT', 'USDC', 'WMATIC', 'DAI']
}
export const basePairAddressesAllChains = {
  [eth]: { WETH: '', USDT: '' },
  [bsc]: { WBNB: '', BUSD: '', USDT: '' },
  [polygon]: { WETH: '', USDT: '', USDC: '', WMATIC: '', DAI: '' }
}

export const TOKEN_CONTRACT_ABI = [{ constant: true, inputs: [], name: 'name', outputs: [{ name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ name: 'guy', type: 'address' }, { name: 'wad', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ name: 'src', type: 'address' }, { name: 'dst', type: 'address' }, { name: 'wad', type: 'uint256' }], name: 'transferFrom', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: false, inputs: [{ name: 'wad', type: 'uint256' }], name: 'withdraw', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: true, inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [{ name: '', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: true, inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' }, { constant: false, inputs: [{ name: 'dst', type: 'address' }, { name: 'wad', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' }, { constant: false, inputs: [], name: 'deposit', outputs: [], payable: true, stateMutability: 'payable', type: 'function' }, { constant: true, inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' }, { payable: true, stateMutability: 'payable', type: 'fallback' }, { anonymous: false, inputs: [{ indexed: true, name: 'src', type: 'address' }, { indexed: true, name: 'guy', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Approval', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'src', type: 'address' }, { indexed: true, name: 'dst', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Transfer', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'dst', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Deposit', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'src', type: 'address' }, { indexed: false, name: 'wad', type: 'uint256' }], name: 'Withdrawal', type: 'event' }]
