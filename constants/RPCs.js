import { eth, bsc, polygon } from './blockchains.js'
import { chain } from '../config.js'
import dotenv from 'dotenv'
dotenv.config()

export const RPC_URLS = {
    eth: process.env.RPC_URL_ETH_INFURA,
    bsc: process.env.RPC_URL_BSC_ORIGINAL,
    polygon: process.env.RPC_URL_POLYGON_INFURA
}
