import { Logger } from '@l2beat/backend-tools'
import { writeFile } from 'fs/promises'
import Papa from 'papaparse'

import { getBaseTokens } from './comparison/getBaseTokens'
import {
  ComparableToken,
  toComparableTokens,
} from './comparison/toComparableTokens'
import { Config } from './config/Config'
import { getChainSources } from './getChainSources'
import { Output } from './Output'
import { SourcePipeline } from './pipeline/SourcePipeline'
import { CoingeckoRanker } from './ranking/CoingeckoRanker'
import { TokenRanker } from './ranking/TokenRanker'
import { TotalSupplyChecker } from './ranking/TotalSupplyChecker'
import { AxelarConfigSource } from './sources/AxelarConfigSource'
import { CoingeckoSource } from './sources/CoingeckoSource'
import { JsonSource } from './sources/JsonSource'
import { OrbitSource } from './sources/OrbitSource'
import { TokenListSource } from './sources/TokenListSource'
import { WormholeSource } from './sources/WormholeSource'
import { Stats } from './Stats'
import { CanonicalArbitrumHeuristic } from './transformers/CanonicalArbitrumHeuristic'
import { CanonicalOptimismHeuristic } from './transformers/CanonicalOptimismHeuristic'
import { ChainTransformer } from './transformers/ChainTransformer'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    const logger = new Logger({
      logLevel: 'INFO',
      format: 'pretty',
      colors: true,
    })

    const chainSources = getChainSources(config, logger)

    // #region pipeline

    const mainPipeline = new SourcePipeline()

    mainPipeline.add(new JsonSource(config.tokenFile, logger))

    if (config.sources.coingecko) {
      mainPipeline.add(new CoingeckoSource(logger, config.chains))
    }

    if (config.sources.axelarConfig) {
      mainPipeline.add(
        new AxelarConfigSource(logger, config.axelarListUrl, config.chains),
      )
    }

    if (config.sources.axelarGateway) {
      for (const { axelarSource } of chainSources) {
        if (axelarSource) {
          mainPipeline.add(axelarSource)
        }
      }
    }

    if (config.sources.wormhole) {
      mainPipeline.add(
        new WormholeSource(config.wormholeListUrl, logger, config.chains),
      )
    }

    if (config.sources.orbit) {
      mainPipeline.add(
        new OrbitSource(config.orbitListUrl, logger, config.chains),
      )
    }

    if (config.sources.tokenLists) {
      for (const list of config.tokenLists) {
        mainPipeline.add(
          new TokenListSource(
            list.url,
            list.tag,
            logger.tag(list.tag),
            config.chains,
          ),
        )
      }
    }

    for (const sources of chainSources) {
      if (sources.escrowSource) {
        mainPipeline.add(sources.escrowSource)
      }
    }

    mainPipeline.commit()
    mainPipeline.transform(new ChainTransformer(logger, config.chains))

    if (config.sources.onChainMetadata) {
      for (const sources of chainSources) {
        if (sources.onChainMetadataSource) {
          mainPipeline.add(sources.onChainMetadataSource)
        }
      }
    }

    if (config.sources.deployments) {
      for (const sources of chainSources) {
        if (sources.deploymentSource) {
          mainPipeline.add(sources.deploymentSource)
        }
      }
    }

    mainPipeline.commit()
    mainPipeline.transform(new CanonicalArbitrumHeuristic())
    mainPipeline.transform(new CanonicalOptimismHeuristic())

    // #endregion

    const stats = new Stats(logger, config.chains)
    const output = new Output(config.tokenFile)

    const coingeckoRanker = new CoingeckoRanker(config.coingecko, logger)
    const totalSupplyChecker = new TotalSupplyChecker(chainSources, logger)
    const tokenRanker = new TokenRanker(
      coingeckoRanker,
      totalSupplyChecker,
      logger,
    )

    this.start = async () => {
      const tokens = await mainPipeline.getTokens()
      stats.outputStats(tokens)
      console.log('Tokens:', tokens.length)
      await output.write(tokens)

      if (config.rankTokens) {
        const ranked = await tokenRanker.getRanking(tokens)
        const csv = Papa.unparse(ranked)
        await writeFile('ranked.csv', csv)
      }

      if (config.compareToFile) {
        const baseTokens = getBaseTokens(config.compareToFile)
        const foundTokens = toComparableTokens(tokens)

        const getId = (t: ComparableToken) => `${t.chainId}-${t.address}`
        const currentTokens = new Set(baseTokens.map((t) => getId(t)))
        const missing = foundTokens.filter((t) => !currentTokens.has(getId(t)))

        await writeFile('missing.json', JSON.stringify(missing, null, 2))
      }
    }
  }
}
