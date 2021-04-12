const { Fetcher, WETH, TokenAmount } = require('@uniswap/sdk')
const UNISWAP = require('@uniswap/sdk')
const ethers = require('ethers')

console.log(`ChainId :: ${UNISWAP.ChainId.MAINNET} :: ${UNISWAP.ChainId.KOVAN}`)

/*
* As an example, let’s try to represent DAI in a format the SDK can work with. 
* To do so, we need at least 3 pieces of data: a chainId, a token address, and how many decimals the token has. 
* We also may be interested in the symbol and/or name of the token.
*/

//Identify the network, KOVAN or MAINNET and the address of say DAI.  We will do MAINNET 
const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F' //must be checked sum and this is the DAI token address on mainnet
const ETH = '0x0000000000000000000000000000000000000000'
const UNISWAPROUTER02 = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
//next define the decimal places
const decimals = 18
const chainId = UNISWAP.ChainId.MAINNET
const DAI = new UNISWAP.Token(chainId, tokenAddress, decimals)


/*
* Now that we’ve explored how to define a token, let’s talk about pairs. 
* As an example, let’s try to represent the DAI-WETH pair.
*/
async function getPair() {

    const DAI = new UNISWAP.Token(
        chainId,
        tokenAddress,
        18,
        'DAI',
        'Dai Stablecoin'
    )

    const pair = await UNISWAP.Fetcher.fetchPairData(DAI, WETH[DAI.chainId])
    const route = new UNISWAP.Route([pair], WETH[DAI.chainId])

    console.log(`Mid Price ${route.midPrice.toSignificant(6)}`)
    console.log(`Invert Mid Price ${route.midPrice.invert().toSignificant(6)}`)

    //Execute Trade
    const amountIn = '1000000000000000000' // 1 WETH

    //Get execution price
    const trade = new UNISWAP.Trade(route, new UNISWAP.TokenAmount(WETH[DAI.chainId], amountIn), UNISWAP.TradeType.EXACT_INPUT)
    console.log(`Execution Price ${trade.executionPrice.toSignificant(6)}`)
    console.log(`Next Execution Price ${trade.nextMidPrice.toSignificant(6)}`)

    //Now Trade.  Setup Swap data
    const slippageTolerance = new UNISWAP.Percent('50','100000') //50 bips 1 bip = 0.050
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;  //how much we want to pay based on a tolerance
    const path = [WETH[chainId], DAI.tokenAddress]; //now we can interact with this pair
    const to = '';
    const deadline = Math.floor(Date.now()/1000) + 60 * 20;
    const value = trade.inputAmount.raw; //HOW MUCH ETH WE ARE WILLING TO SEND
    
    const provider = ethers.getDefaultProvider('mainnet', {
        infura: 'https://mainnet.infura.io/v3/6fd2fd8e1b334661b0c38556bd48b257'
    })

    const signer = new ethers.Wallet('386cdf0dbac6075c8ccc38576e4262b003bff87a5f7d9699243b3f18c9b92d2c')
    const account = signer.connect(provider)

    const uniswap = new ethers.Contract(
        UNISWAPROUTER02,
        ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
        account
    )

    const tx = await uniswap.swapExactETHForTokens(
        amountOutMin,
        path,
        to,
        deadline,
        {value, gasPrice: 20e9}
    )

    console.log(`Transaction hash: ${tx.hash}`)
    const receipt = await tx.wait();
    console.log(`Transaction mined in block ${receipt.blockNumber}`)
}

getPair();
