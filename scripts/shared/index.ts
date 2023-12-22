export const CONTRACT_ADDRESSES = {
  BEANSTALK: '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5',
  BEAN: '0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab',
  THREE_CURVE: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490',
  THREE_POOL: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
  TRI_CRYPTO_POOL: '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46',
  BEAN_3_CURVE: '0xc9C32cd16Bf7eFB85Ff14e0c8603cc90F6F2eE49',
  LUSD_3_CURVE: '0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA',
  BEAN_LUSD_CURVE: '0xD652c40fBb3f06d6B58Cb9aa9CFF063eE63d465D',
  UNISWAP_V2_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  UNISWAP_V2_PAIR: '0x87898263B6C5BABe34b4ec53F22d98430b91e371',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  UNRIPE_BEAN: '0x1BEA0050E63e05FBb5D8BA2f10cf5800B6224449',
  UNRIPE_LP: '0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D',
  FERTILIZER: '0x402c84De2Ce49aF88f5e2eF3710ff89bFED36cB6',
  BEAN_ETH_WELL: '0xBEA0e11282e2bB5893bEcE110cF199501e872bAd',
  /// tokens
  LUSD: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  ETHER: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  SPOT: '0xC1f33e0cf7e40a67375007104B929E49a581bafE',
  ROOT: '0x77700005BEA4DE0A78b956517f099260C2CA9a26',
  OHM: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5',
  PAXG: '0x45804880De22913dAFE09f4980848ECE6EcbAf78',
  CNHT: '0x6E109E9dD7Fa1a58BC3eff667e8e41fC3cc07AEF',
  FXS: '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0',
  frxETH: '0x5E8422345238F34275888049021821E8E08CAa1f',
  CRV: '0xD533a949740bb3306d119CC777fa900bA034cd52',
  AURA: '0xc0c293ce456ff0ed870add98a0828dd4d2903dbf',
  BAL: '0xba100000625a3754423978a60c9317c58a424e3D',
  SNX: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
  stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  gOHM: '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f',
  /// chainlink data feeds
  CHAINLINK_ORACLE_ETH: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  CHAINLINK_ORACLE_DAI: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
  CHAINLINK_ORACLE_USDT: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
  CHAINLINK_ORACLE_LUSD: '0x3D7aE7E594f2f2091Ad8798313450130d0Aba3a0',
  CHAINLINK_ORACLE_USDC: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
  CHAINLINK_ORACLE_OHM: '0x9a72298ae3886221820B1c878d12D872087D3a23',
  CHAINLINK_ORACLE_PAXG: '0x9B97304EA12EFed0FAd976FBeCAad46016bf269e',
  /// uniswap pools
  UNIV3_POOL_SPOT: '0x7e0c73af898e1ad50a8efd7d3a678c23cd90b74c',
  UNIV3_POOL_ROOT: '0x11dd6f9e1a7bb35a61fada4aec645f603050783e',
  UNIV3_POOL_CNHT: '0x6193cBB6D823F99156be3A5bBD4915842d0646a7',
  UNIV3_POOL_GOHM: '0xC987D503a9f78F6D1d782C1fFF5aF4cb34437E3F',
  /// minters
  USDC_MINTER: '0x5B6122C109B78C6755486966148C1D70a50A47D7',
  LUSD_MINTER: '0x24179CD81c9e782A4096035f7eC97fB8B783e007',

  BEANSTALK_PRICE: '0xF2C2b7eabcB353bF6f2128a7f8e1e32Eeb112530',
  MULTICALL2: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
};

export enum OracleType {
  DIRECT,
  CHAINLINK,
  CURVE_FINANCE,
  UNISWAP_V2,
  UNISWAP_V3,
  CUSTOM_ORACLE,
}

/// all function and event names used in subgraph and UI
export const includesInAbi = [
  // external functions
  //  auction
  'buyNow',
  'claimBid',
  'closeAuction',
  'createAuction',
  'placeBid',
  'updateAuction',
  //  sprinkler
  'exchangeETHToWater',
  'exchangeTokenToWater',
  //  tranche
  'createTranchesWithPods',
  'receivePodsForTranche',
  //  watertower
  'claim',
  'deposit',
  'irrigate',
  'withdraw',
  'setAutoIrrigate',
  //  tranche erc1155
  'setApprovalForAll',
  'Metamask_ApprovalForAll',
  'safeTransferFrom',
  'safeBatchTransferFrom',
  /// view functions
  'getPrice',
  'latestPriceOfPods',
  'getAuctionFeeAndLimit',
  'getTranchePods',
  'getPlotsForTranche',
  'getPlotsForUser',
  'totalDeposits',
  'userInfo',
  'getLockedUserInfo',
  'userETHReward',
  'getPoolInfo',
  'getBonusForIrrigate',
  'balanceOf',
  'isApprovedForAll',
  'balanceOfBatch',
  // events (exclude erc20 and erc1155 events)
  //  auction
  'AuctionCreated',
  'AuctionBuy',
  'AuctionBid',
  'AuctionClosed',
  'ClaimBid',
  'UpdateBidTokenGroup',
  'UpdateAuctionPeriods',
  'UpdateAuctionFee',
  //  sprinkler
  'WaterExchanged',
  'AddWhiteListAsset',
  'UnListAsset',
  'DepositWater',
  //  tranche
  'CreateTranche',
  'ReceivePodsWithTranche',
  'SetMaturityPeriods',
  //  watertower
  'Deposited',
  'Withdrawn',
  'Claimed',
  'Irrigate',
  'SetAutoIrrigate',
  'AddETHReward',
  'UpdateRewardPeriod',
  'AutoIrrigate',
];
