import {
  getPriceIdentifier,
  // 引入新的工具函数，用于富化子资产
  getAssetPriceAndValue,
} from "./utils.js";

// -----------------------------------------------------\
// 价值计算逻辑 (Value Calculation Logic)
// -----------------------------------------------------\

/**
 * 标准资产（代币、主币）的价格计算逻辑。
 * Price calculation logic for standard assets (tokens, native coins).
 * @param {Object} asset - The asset object.
 * @param {Object} pricesMap - The price lookup table (CoinGecko ID -> price).
 * @returns {{usdPrice: number, usdValue: number}} Calculated price and value.
 */
function calculateStandardAssetValue(asset, pricesMap) {
  const contract = asset.asset_ca;
  // 构建一个结构相似的临时对象，使用新的工具函数计算
  const tempAsset = { address: contract, amount: asset.amount };

  const { usdPrice, usdValue } = getAssetPriceAndValue(tempAsset, pricesMap);

  return { usdPrice, usdValue };
}

/**
 * 复杂资产 (如 V3 LP NFT, Farming 仓位) 的价格计算逻辑。
 * **适用于具有 primary_assets 和 reward_assets 数组的结构。**
 * Price calculation logic for complex positions.
 * **此函数将富化 primary_assets 和 reward_assets 数组中的子资产对象。**
 * @param {Object} asset - The asset object.
 * @param {Object} pricesMap - The price lookup table (CoinGecko ID -> price).
 * @returns {{usdPrice: number, usdValue: number}} Calculated price and value.
 */
function calculateComplexPositionAssetValue(asset, pricesMap) {
  let totalUsdValue = 0;

  // 处理质押资产 (Primary Assets)
  if (asset.extra?.primary_assets) {
    asset.extra.primary_assets = asset.extra.primary_assets.map((subAsset) => {
      const subAssetWithAddress = {
        ...subAsset,
        address: subAsset.address || subAsset.asset_ca,
      };
      const { usdPrice, usdValue } = getAssetPriceAndValue(
        subAssetWithAddress,
        pricesMap,
      );
      subAsset.usdPrice = usdPrice;
      subAsset.usdValue = usdValue;
      totalUsdValue += usdValue;
      return subAsset;
    });
  }

  // 处理奖励资产 (Reward Assets)
  if (asset.extra?.reward_assets) {
    asset.extra.reward_assets = asset.extra.reward_assets.map((subAsset) => {
      const subAssetWithAddress = {
        ...subAsset,
        address: subAsset.address || subAsset.asset_ca,
      };
      const { usdPrice, usdValue } = getAssetPriceAndValue(
        subAssetWithAddress,
        pricesMap,
      );
      subAsset.usdPrice = usdPrice;
      subAsset.usdValue = usdValue;
      totalUsdValue += usdValue;
      return subAsset;
    });
  }

  // 对于复杂仓位，usdPrice 字段没有意义，直接返回 0
  return { usdPrice: 0, usdValue: totalUsdValue };
}

/**
 * 质押或单资产挖矿仓位 (如 xStake) 的价格计算逻辑。
 * **适用于主资产为 staked asset，extra.reward 为 reward asset 的结构。**
 * **此函数将富化主资产对象（作为 staked asset）和 extra.reward 对象。**
 * @param {Object} asset - The asset object (represents the position and the staked asset).
 * @param {Object} pricesMap - The price lookup table (CoinGecko ID -> price).
 * @returns {{usdPrice: number, usdValue: number}} Calculated total position value.
 */
function calculateXStakeFarmingAssetValue(asset, pricesMap) {
  let totalUsdValue = 0;

  // 1. 处理质押资产 (Stake Asset - 对应主对象自身)
  const stakedAssetTemp = { address: asset.asset_ca, amount: asset.amount };
  const { usdPrice: stakedPrice, usdValue: stakedValue } =
    getAssetPriceAndValue(stakedAssetTemp, pricesMap);

  // 富化主资产对象（质押资产）- 满足用户将价格和价值写到 stake 资产的需求
  // 注意：这里的 usdPrice/usdValue 只是**质押资产**的价值，最终会被 position total value 覆盖。
  asset.usdPrice = stakedPrice;
  asset.usdValue = stakedValue;

  totalUsdValue += stakedValue;

  // 2. 处理奖励资产 (Reward Asset - 对应 extra.reward)
  if (asset.extra && asset.extra.reward) {
    const rewardAsset = asset.extra.reward;
    // 奖励资产在 JSON 中包含 asset_ca 和 amount
    const rewardAssetTemp = {
      address: rewardAsset.asset_ca,
      amount: rewardAsset.amount,
    };
    const { usdPrice, usdValue } = getAssetPriceAndValue(
      rewardAssetTemp,
      pricesMap,
    );

    // 富化奖励资产对象 - 满足用户将价格和价值写到 reward 资产的需求
    rewardAsset.usdPrice = usdPrice;
    rewardAsset.usdValue = usdValue;

    totalUsdValue += usdValue;
  }

  // 3. 返回位置的总价值 (Position Total Value)
  // Position Price 统一为 0
  return { usdPrice: 0, usdValue: totalUsdValue };
}

// 由于 V3 LP 和 Farming 仓位结构类似，都由 primary_assets 和 reward_assets 构成，
// 我们可以将它们的计算逻辑合并到 calculateComplexPositionAssetValue。
const calculateV3LpAssetValue = calculateComplexPositionAssetValue;
const calculateFarmingAssetValue = calculateComplexPositionAssetValue;

// -----------------------------------------------------\
// 价格ID聚合逻辑 (Price ID Aggregation Logic)
// -----------------------------------------------------\

/**
 * 标准资产的 ID 聚合逻辑。
 * ID aggregation logic for standard assets.
 * @param {Object} asset - The asset object.
 * @param {Set<string>} idSet - The mutable set of unique IDs.
 */
function aggregateStandardAssetIds(asset, idSet) {
  const contract = asset.asset_ca;
  const priceIdentifier = getPriceIdentifier(contract);
  if (priceIdentifier && priceIdentifier.type === "id") {
    idSet.add(priceIdentifier.key);
  }
}

/**
 * 复杂资产 (如 V3 LP NFT, Farming 仓位) 的 ID 聚合逻辑。
 * **适用于具有 primary_assets 和 reward_assets 数组的结构。**
 * ID aggregation logic for complex positions.
 * @param {Object} asset - The asset object.
 * @param {Set<string>} idSet - The mutable set of unique IDs.
 */
function aggregateComplexPositionAssetIds(asset, idSet) {
  const subAssets = [
    ...(asset.extra?.primary_assets || []),
    ...(asset.extra?.reward_assets || []),
  ];

  // Collect CoinGecko IDs for all nested assets
  subAssets.forEach((subAsset) => {
    // Sub-assets use the address field
    const subAssetAddress = subAsset.address || subAsset.asset_ca;
    const priceIdentifier = getPriceIdentifier(subAssetAddress);
    if (priceIdentifier && priceIdentifier.type === "id") {
      idSet.add(priceIdentifier.key);
    }
  });
}

/**
 * 质押或单资产挖矿仓位 (如 xStake) 的 ID 聚合逻辑。
 * **适用于主资产为 staked asset，extra.reward 为 reward asset 的结构。**
 * @param {Object} asset - The asset object.
 * @param {Set<string>} idSet - The mutable set of unique IDs.
 */
function aggregateXStakeFarmingAssetIds(asset, idSet) {
  // 1. 质押资产 (主资产)
  const stakedContract = asset.asset_ca;
  const stakedIdentifier = getPriceIdentifier(stakedContract);
  if (stakedIdentifier && stakedIdentifier.type === "id") {
    idSet.add(stakedIdentifier.key);
  }

  // 2. 奖励资产 (extra.reward)
  if (asset.extra && asset.extra.reward) {
    const rewardContract = asset.extra.reward.asset_ca;
    const rewardIdentifier = getPriceIdentifier(rewardContract);
    if (rewardIdentifier && rewardIdentifier.type === "id") {
      idSet.add(rewardIdentifier.key);
    }
  }
}

// 由于 V3 LP 和 Farming 仓位结构类似，都由 primary_assets 和 reward_assets 构成，
// 我们可以将它们的 ID 聚合逻辑合并到 aggregateComplexPositionAssetIds。
const aggregateV3LpAssetIds = aggregateComplexPositionAssetIds;
const aggregateFarmingAssetIds = aggregateComplexPositionAssetIds;

// -----------------------------------------------------\
// 注册表 (Registries)
// -----------------------------------------------------\

/**
 * 映射资产类型到相应的价值计算函数。
 * Handler registry mapping asset types to their corresponding value calculation functions.
 */
export const ASSET_TYPE_HANDLERS = {
  // V3 LP 和 Farming 资产
  V3_LP_POSITION: calculateV3LpAssetValue,
  "V3 LP NFT": calculateV3LpAssetValue,
  FARMING_POSITION: calculateFarmingAssetValue, // 🚨 新增 Farming 仓位类型
  "xStake-xWAN-Farming": calculateXStakeFarmingAssetValue, // 🚨 新增 xStake 质押类型

  // Default handler for standard tokens/coins
  default: calculateStandardAssetValue,
};

/**
 * 映射资产类型到相应的 CoinGecko ID 聚合函数。
 * Registry mapping asset types to their corresponding CoinGecko ID aggregation functions.
 */
export const ASSET_TYPE_ID_AGGREGATORS = {
  // V3 LP 和 Farming 资产
  V3_LP_POSITION: aggregateV3LpAssetIds,
  "V3 LP NFT": aggregateV3LpAssetIds,
  FARMING_POSITION: aggregateFarmingAssetIds, // 🚨 新增 Farming 仓位 ID 聚合
  "xStake-xWAN-Farming": aggregateXStakeFarmingAssetIds, // 🚨 新增 xStake 质押 ID 聚合

  // Default handler for standard tokens/coins
  default: aggregateStandardAssetIds,
};
