# Blockchain-Trading-Bot
### Summary:
This is a part of a bigger blockchain trading bot for new token listings, which is responsible for getting all the necessary prices and executing trades.

### Use case:
Combined with Telegram or Discord listener can be used to automatically scrape newly listed token contract address and execute trades.
Creating alerts for price changes of tokens that are not on TradingView and potentially trade with them.
Limit orders on DEXes.

### How it works:
Based on your settings, the program checks if it can find the appropriate liquidity pair on a DEX.
In case it finds it, it checks all the necessary prices for the trade and depending on your trade settings buys the appropriate amount of tokens.
After buying tokens, it checks repeatedly if the price of the bought token has risen to a predefined sell price and sells it in that case.

### How to use:
Enter your RPC providers for all chains, private key, account address, and mnemonic phrase in .env.example file and rename the extension to .env.

Set config.js settings:
|setting|description     |
|------------------------|-----------------------------------
|buy                     | true -> the program will execute trades normally <br> false -> program will skip the actual buyPair function, so will not buy or sell anything
|repeating               | true -> if you need to repeatedly monitor the blockchain (for a price, liquidity added, etc.) <br> false -> if you don't need to perform repeated actions, but just want for example to execute a market order, cancel a transaction, check token allowance, etc.
|biggestLiquidityPair    | true -> it will search for the biggest liquidity pair <br> false -> it will use the first liquidity pair, that is big enough (if false, you can save some time, but maybe you get a little bigger slippage)
|getAlternativeBaseToken | in case you specified the liquidity pair for the trade and it isn't big enough, does it search for other liquidity pairs or not (if the specified liquidity pair is big enough, this setting does nothing)
|gasLimit                | set a high enough gas limit for your transactions or the transaction will fail
|amountInMaxUsd          | converted to USD value, how much of the base tokens value do you want to use for buying
|sellTresholds           | example: if you buy tokens XYZ at a price $10 per token and sellTresholds are set to 2, 4, and 8, it will try to sell 1 third of the tokens when the price reaches $20, $40, and $80
|sellPriceMultiplier     | multiply all of the values in the setting sellTreshold
|walletTokenEth*         | the token you have in your wallet and want to buy with it
|inputTokenEth*          | the base token of the liquidity pair of token XYZ (usually: ETH, USDT, USDC, ...)
|outputTokenEth*         | the buying token
<p>* similar for Bsc and Polygon chains</p>

to start: npm run start (if you set everything correctly and have money on BSC, it will buy 2 USD worth of $CBT with $BUSD on Binance Smart Chain)

### Other:
Most of the constants in the program can be dynamically retrieved on the blockchain, but are hardcoded in the program instead for fewer ON-chain calls and consequently better performance.
