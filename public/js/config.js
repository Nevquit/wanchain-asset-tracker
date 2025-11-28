// js/config.js
export const COINGECKO_TOKEN_MAP = {
    // ... 您的映射内容 ...
    "0x11e77e27af5539872efed10abaa0b408cfd9fbbd": { symbol: "wanUSDT", coingeckoId: "tether" },
    "0x52a9cea01c4cbdd669883e41758b8eb8e8e2b34b": { symbol: "wanUSDC", coingeckoId: "usd-coin" },
    "0xe3ae74d1518a76715ab4c7bedf1af73893cd435a": { symbol: "wanETH", coingeckoId: "ethereum" },
    "0x50c439b6d602297252505a6799d84ea5928bcfb6": { symbol: "wanBTC", coingeckoId: "bitcoin" },
    "0x2ea407aa69be7367bf231e76b51fab9ec436766c": { symbol: "XWAN", coingeckoId: "wanchain" },
    "0x0000000000000000000000000000000000000000":{ symbol: "WAN", coingeckoId: "wanchain" },
};
export const COINGECKO_ID_API = 'https://api.coingecko.com/api/v3/simple/price';