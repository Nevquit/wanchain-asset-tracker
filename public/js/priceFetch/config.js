// js/config.js
export const COINGECKO_TOKEN_MAP = {
    // ... 您的映射内容 ...
    "0x11e77e27af5539872efed10abaa0b408cfd9fbbd": { symbol: "wanUSDT", coingeckoId: "tether" },
    "0x52a9cea01c4cbdd669883e41758b8eb8e8e2b34b": { symbol: "wanUSDC", coingeckoId: "usd-coin" },
    "0xe3ae74d1518a76715ab4c7bedf1af73893cd435a": { symbol: "wanETH", coingeckoId: "ethereum" },
    "0x50c439b6d602297252505a6799d84ea5928bcfb6": { symbol: "wanBTC", coingeckoId: "bitcoin" },
    "0x2ea407aa69be7367bf231e76b51fab9ec436766c": { symbol: "XWAN", coingeckoId: "wanchain" },
    "0x0000000000000000000000000000000000000000":{ symbol: "WAN", coingeckoId: "wanchain" },
    "0xdabd997ae5e4799be47d6e69d9431615cba28f48":{ symbol: "WWAN", coingeckoId: "wanchain" },
    "0x79d745178bc271a1f29f8fbe9251dfc512db842c":{ symbol: "wanADA", coingeckoId: "cardano" },
    "0x8b9f9f4aa777d142ec10b7b72ade921f2de83b28":{ symbol: "WASP", coingeckoId: "wanswap" },
    "0xf314e91e4f7117e128153406e23761b0c9b74075":{ symbol: "wanXRP", coingeckoId: "ripple" },
    "0x9134a01c3b0833a6f1d1b2a658d2495d4d12643a":{ symbol: "wanDOT", coingeckoId: "polkadot" },


};
export const COINGECKO_ID_API = 'https://api.coingecko.com/api/v3/simple/price';