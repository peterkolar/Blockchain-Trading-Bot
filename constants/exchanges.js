import { eth, bsc, polygon } from './blockchains.js'
import { chain } from '../config.js'


export const exchangesAddresses = {
  eth: {
    nativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',// WETH
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', 
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    initCode: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  },
  bsc: {
    nativeToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',// WBNB
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    initCode: '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5',// pancakeswap v2 (v1 is different)
  },
  polygon: {
    nativeToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',// WMATIC
    factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    initCode: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  }
}