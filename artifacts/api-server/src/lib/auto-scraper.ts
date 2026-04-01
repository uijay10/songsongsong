import OpenAI from "openai";
import Parser from "rss-parser";
import { db, postsTable } from "@workspace/db";
import { sql, inArray } from "drizzle-orm";
import https from "node:https";
import http from "node:http";

const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ?? "dummy",
});

const DEEPSEEK_MODEL = "deepseek/deepseek-v3.2";
const AI_SYSTEM_WALLET = "ai-system";
const AI_SYSTEM_NAME = "AI精选";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 8;
const MAX_RETRIES = 3;

export const CATEGORY_MAP: Record<string, string> = {
  "测试网": "testnet",
  "IDO/Launchpad": "ido", "IDO": "ido", "Launchpad": "ido",
  "预售": "presale",
  "融资公告": "funding",
  "空投": "airdrop",
  "招聘": "recruiting",
  "节点招募": "nodes",
  "主网上线": "mainnet",
  "代币解锁": "unlock",
  "交易所上线": "exchange",
  "链上任务": "quest",
  "开发者专区": "developer",
  "项目捐赠/赞助": "grant",
  "捐赠/赞助": "grant",
  "资助项目": "grant",
  "Grant": "grant",
  "Grants": "grant",
  "漏洞赏金": "bugbounty",
  "Bug Bounty": "bugbounty",
};

function mapCategory(cats: string[]): string | null {
  for (const cat of cats) {
    if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
    for (const [zh, en] of Object.entries(CATEGORY_MAP)) {
      if (cat.includes(zh)) return en;
    }
  }
  return null;
}

export const DEFAULT_SOURCES = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", type: "rss", priority: 1 },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", type: "rss", priority: 1 },
  { name: "Decrypt", url: "https://decrypt.co/feed", type: "rss", priority: 1 },
  { name: "The Block", url: "https://www.theblock.co/rss", type: "rss", priority: 1 },
  { name: "U.Today", url: "https://u.today/rss", type: "rss", priority: 1 },
  { name: "BeInCrypto", url: "https://beincrypto.com/feed/", type: "rss", priority: 1 },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/", type: "rss", priority: 1 },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed", type: "rss", priority: 1 },
  { name: "CoinGape", url: "https://coingape.com/feed/", type: "rss", priority: 1 },
  { name: "CryptoPotato", url: "https://cryptopotato.com/feed/", type: "rss", priority: 1 },
  { name: "News.Bitcoin.com", url: "https://news.bitcoin.com/feed/", type: "rss", priority: 1 },
  { name: "Bitcoinist", url: "https://bitcoinist.com/feed/", type: "rss", priority: 2 },
  { name: "The Daily Hodl", url: "https://dailyhodl.com/feed/", type: "rss", priority: 2 },
  { name: "AMBCrypto", url: "https://ambcrypto.com/feed/", type: "rss", priority: 2 },
  { name: "Crypto Briefing", url: "https://cryptobriefing.com/feed/", type: "rss", priority: 2 },
  { name: "Blockworks", url: "https://blockworks.co/feed/", type: "rss", priority: 1 },
  { name: "The Defiant", url: "https://thedefiant.io/feed/", type: "rss", priority: 1 },
  { name: "CryptoNews", url: "https://cryptonews.com/news/feed/", type: "rss", priority: 2 },
  { name: "NewsBTC", url: "https://www.newsbtc.com/feed/", type: "rss", priority: 2 },
  { name: "Crypto Ninjas", url: "https://www.cryptoninjas.net/feed/", type: "rss", priority: 2 },
  { name: "CoinJournal", url: "https://coinjournal.net/feed/", type: "rss", priority: 2 },
  { name: "Finance Magnates Crypto", url: "https://www.financemagnates.com/feed/", type: "rss", priority: 2 },
  { name: "CoinGeek", url: "https://coingeek.com/feed/", type: "rss", priority: 2 },
  { name: "Crypto Daily", url: "https://cryptodaily.co.uk/feed", type: "rss", priority: 2 },
  { name: "Ledger Insights", url: "https://www.ledgerinsights.com/feed/", type: "rss", priority: 2 },
  { name: "Protos", url: "https://www.protos.com/feed/", type: "rss", priority: 2 },
  { name: "Unchained", url: "https://unchainedcrypto.com/feed/", type: "rss", priority: 2 },
  { name: "Bankless", url: "https://www.bankless.com/feed", type: "rss", priority: 1 },
  { name: "Solana Blog", url: "https://solana.com/blog/rss.xml", type: "rss", priority: 1 },
  { name: "Ethereum Blog", url: "https://blog.ethereum.org/feed.xml", type: "rss", priority: 1 },
  { name: "Polygon Blog", url: "https://polygon.technology/blog/feed", type: "rss", priority: 1 },
  { name: "Binance Blog", url: "https://www.binance.com/en/blog/feed", type: "rss", priority: 1 },
  { name: "Coinbase Blog", url: "https://www.coinbase.com/blog/rss", type: "rss", priority: 1 },
  { name: "Ripple Blog", url: "https://ripple.com/feed/", type: "rss", priority: 2 },
  { name: "Cardano Blog", url: "https://cardano.org/feed/", type: "rss", priority: 2 },
  { name: "Near Protocol Blog", url: "https://near.org/blog/feed/", type: "rss", priority: 2 },
  { name: "Chainlink Blog", url: "https://blog.chain.link/feed/", type: "rss", priority: 1 },
  { name: "Optimism Blog", url: "https://optimism.io/blog/feed", type: "rss", priority: 1 },
  { name: "Arbitrum Blog", url: "https://arbitrum.io/blog/feed", type: "rss", priority: 1 },
  { name: "zkSync Blog", url: "https://zksync.io/blog/feed", type: "rss", priority: 1 },
  { name: "Medium Blockchain", url: "https://medium.com/feed/tag/blockchain", type: "rss", priority: 2 },
  { name: "Medium Web3", url: "https://medium.com/feed/tag/web3", type: "rss", priority: 2 },
  { name: "Medium Crypto", url: "https://medium.com/feed/tag/cryptocurrency", type: "rss", priority: 2 },
  { name: "Medium DeFi", url: "https://medium.com/feed/tag/defi", type: "rss", priority: 2 },
  { name: "Medium NFT", url: "https://medium.com/feed/tag/nft", type: "rss", priority: 2 },
  { name: "Medium DAO", url: "https://medium.com/feed/tag/dao", type: "rss", priority: 3 },
  { name: "Medium Layer2", url: "https://medium.com/feed/tag/layer2", type: "rss", priority: 2 },
  { name: "Reddit r/cryptocurrency", url: "https://old.reddit.com/r/cryptocurrency/.rss", type: "rss", priority: 2 },
  { name: "Reddit r/defi", url: "https://old.reddit.com/r/defi/.rss", type: "rss", priority: 2 },
  { name: "Reddit r/solana", url: "https://old.reddit.com/r/solana/.rss", type: "rss", priority: 2 },
  { name: "Reddit r/ethereum", url: "https://old.reddit.com/r/ethereum/.rss", type: "rss", priority: 2 },
  { name: "Blockchain.news", url: "https://blockchain.news/feed", type: "rss", priority: 2 },
  { name: "CoinMarketCap News", url: "https://coinmarketcap.com/headlines/news/rss/", type: "rss", priority: 1 },
  { name: "CNBC Crypto", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html", type: "rss", priority: 2 },
  { name: "Yahoo Finance Crypto", url: "https://finance.yahoo.com/news/rssindex", type: "rss", priority: 2 },
  { name: "Investing.com Crypto", url: "https://www.investing.com/rss/news_1.rss", type: "rss", priority: 2 },
  { name: "FXStreet Crypto", url: "https://www.fxstreet.com/rss/crypto", type: "rss", priority: 2 },
  { name: "CCN", url: "https://www.ccn.com/feed/", type: "rss", priority: 3 },
  { name: "Smart Liquidity", url: "https://smartliquidity.info/feed/", type: "rss", priority: 3 },
  { name: "MakerDAO Blog", url: "https://blog.makerdao.com/feed/", type: "rss", priority: 2 },
  { name: "Aave Blog", url: "https://aave.com/blog/feed", type: "rss", priority: 2 },
  { name: "Uniswap Blog", url: "https://uniswap.org/blog/feed", type: "rss", priority: 2 },

  // L1 / L2 公链博客
  { name: "Avalanche Blog", url: "https://medium.com/feed/avalancheavax", type: "rss", priority: 1 },
  { name: "Fantom Blog", url: "https://medium.com/feed/fantomfoundation", type: "rss", priority: 2 },
  { name: "Base Blog", url: "https://base.mirror.xyz/feed/atom", type: "rss", priority: 1 },
  { name: "Starknet Blog", url: "https://medium.com/feed/starkware", type: "rss", priority: 1 },
  { name: "Linea Blog", url: "https://linea.mirror.xyz/feed/atom", type: "rss", priority: 1 },
  { name: "Scroll Blog", url: "https://scroll.io/blog/rss.xml", type: "rss", priority: 1 },
  { name: "Mantle Blog", url: "https://www.mantle.xyz/blog/rss.xml", type: "rss", priority: 1 },
  { name: "BNB Chain Blog", url: "https://www.bnbchain.org/en/blog/rss.xml", type: "rss", priority: 1 },
  { name: "Sui Blog", url: "https://blog.sui.io/feed/", type: "rss", priority: 1 },
  { name: "Aptos Blog", url: "https://aptoslabs.medium.com/feed", type: "rss", priority: 1 },
  { name: "Cosmos Blog", url: "https://blog.cosmos.network/feed", type: "rss", priority: 1 },
  { name: "Polkadot Blog", url: "https://polkadot.network/blog/feed", type: "rss", priority: 1 },
  { name: "TON Blog", url: "https://blog.ton.org/rss.xml", type: "rss", priority: 1 },

  // DeFi 协议博客
  { name: "Compound Blog", url: "https://medium.com/feed/compound-finance", type: "rss", priority: 2 },
  { name: "Curve Finance Blog", url: "https://blog.curve.fi/feed/", type: "rss", priority: 2 },
  { name: "1inch Blog", url: "https://blog.1inch.io/feed/", type: "rss", priority: 2 },
  { name: "dYdX Blog", url: "https://dydx.exchange/blog/rss.xml", type: "rss", priority: 2 },
  { name: "GMX Blog", url: "https://medium.com/feed/gmx-io", type: "rss", priority: 2 },
  { name: "Pendle Finance Blog", url: "https://medium.com/feed/pendle-finance", type: "rss", priority: 2 },
  { name: "Lido Blog", url: "https://lido.fi/blog/rss.xml", type: "rss", priority: 1 },
  { name: "EigenLayer Blog", url: "https://www.blog.eigenlayer.xyz/rss/", type: "rss", priority: 1 },

  // 数据 / 研究平台
  { name: "Messari Research", url: "https://messari.io/rss/news.xml", type: "rss", priority: 1 },
  { name: "Delphi Digital Blog", url: "https://members.delphidigital.io/feed/podcast", type: "rss", priority: 2 },
  { name: "Galaxy Research", url: "https://www.galaxy.com/research/rss/", type: "rss", priority: 2 },
  { name: "Nansen Blog", url: "https://www.nansen.ai/post/rss.xml", type: "rss", priority: 2 },
  { name: "Token Terminal Blog", url: "https://tokenterminal.com/blog/rss.xml", type: "rss", priority: 2 },
  { name: "DeFiLlama Blog", url: "https://defillama.com/blog/rss.xml", type: "rss", priority: 1 },
  { name: "CryptoRank Blog", url: "https://cryptorank.io/news/feed", type: "rss", priority: 2 },

  // NFT / GameFi
  { name: "OpenSea Blog", url: "https://opensea.io/blog/feed/", type: "rss", priority: 2 },
  { name: "Blur Blog", url: "https://mirror.xyz/blurdao.eth/feed/atom", type: "rss", priority: 2 },
  { name: "Axie Infinity Blog", url: "https://axie.substack.com/feed", type: "rss", priority: 2 },
  { name: "Immutable Blog", url: "https://www.immutable.com/blog/rss.xml", type: "rss", priority: 2 },

  // 交易所 / 基础设施
  { name: "OKX Blog", url: "https://www.okx.com/learn/category/news/feed", type: "rss", priority: 1 },
  { name: "Kraken Blog", url: "https://blog.kraken.com/feed/", type: "rss", priority: 2 },
  { name: "Bybit Blog", url: "https://learn.bybit.com/news/feed/", type: "rss", priority: 2 },
  { name: "Alchemy Blog", url: "https://www.alchemy.com/blog/rss.xml", type: "rss", priority: 2 },
  { name: "Infura Blog", url: "https://blog.infura.io/feed/", type: "rss", priority: 2 },
  { name: "Hardhat Blog", url: "https://hardhat.org/blog/rss.xml", type: "rss", priority: 3 },

  // 其他综合媒体
  { name: "Web3 Foundation Blog", url: "https://medium.com/feed/web3foundation", type: "rss", priority: 1 },
  { name: "Electric Capital Blog", url: "https://medium.com/feed/electric-capital", type: "rss", priority: 2 },
  { name: "a16z Crypto Blog", url: "https://a16zcrypto.com/feed/", type: "rss", priority: 1 },
  { name: "Paradigm Blog", url: "https://www.paradigm.xyz/feed.xml", type: "rss", priority: 1 },
  { name: "Multicoin Capital Blog", url: "https://multicoin.capital/feed/", type: "rss", priority: 2 },
  { name: "Pantera Capital Blog", url: "https://panteracapital.com/blockchain-letter/feed/", type: "rss", priority: 2 },
  { name: "Medium ZK", url: "https://medium.com/feed/tag/zero-knowledge-proof", type: "rss", priority: 2 },
  { name: "Medium Airdrop", url: "https://medium.com/feed/tag/airdrop", type: "rss", priority: 2 },
  { name: "Reddit r/web3", url: "https://old.reddit.com/r/web3/.rss", type: "rss", priority: 2 },
  { name: "Reddit r/NFT", url: "https://old.reddit.com/r/NFT/.rss", type: "rss", priority: 3 },

  // ── 测试网任务 / 链上任务来源 ──────────────────────────────────────
  { name: "AirdropAlert", url: "https://airdropalert.com/feed/rss.xml", type: "rss", priority: 1 },
  { name: "Dropstab Activities", url: "https://dropstab.com/feed", type: "rss", priority: 2 },
  { name: "Medium Testnet", url: "https://medium.com/feed/tag/testnet", type: "rss", priority: 2 },
  { name: "Medium Airdrop Quests", url: "https://medium.com/feed/tag/airdrop-farming", type: "rss", priority: 2 },
  { name: "Reddit r/Airdrop", url: "https://old.reddit.com/r/Airdrop/.rss", type: "rss", priority: 2 },
  { name: "Reddit r/CryptoAirdrops", url: "https://old.reddit.com/r/CryptoAirdrops/.rss", type: "rss", priority: 2 },
  { name: "Medium Layer3", url: "https://medium.com/feed/layer3xyz", type: "rss", priority: 2 },
  { name: "Intract Blog", url: "https://medium.com/feed/intract-io", type: "rss", priority: 2 },

  // ── Web3 招聘来源 ────────────────────────────────────────────────
  { name: "Web3.career Jobs", url: "https://web3.career/remote-crypto-jobs.rss", type: "rss", priority: 1 },
  { name: "CryptoJobsList", url: "https://cryptojobslist.com/rss.xml", type: "rss", priority: 1 },
  { name: "Cryptocurrency Jobs", url: "https://cryptocurrencyjobs.co/feed/", type: "rss", priority: 1 },
  { name: "BeInCrypto Jobs", url: "https://beincrypto.com/jobs/feed/", type: "rss", priority: 2 },
  { name: "LaborX Blog", url: "https://medium.com/feed/laborx", type: "rss", priority: 3 },
  { name: "Medium Web3 Jobs", url: "https://medium.com/feed/tag/web3-jobs", type: "rss", priority: 2 },
  { name: "Reddit r/Jobs4Bitcoins", url: "https://old.reddit.com/r/Jobs4Bitcoins/.rss", type: "rss", priority: 3 },

  // ── 开发者讨论 / 开发者专区 ─────────────────────────────────────
  { name: "DEV.to Web3 Tag", url: "https://dev.to/feed/tag/web3", type: "rss", priority: 2 },
  { name: "DEV.to Blockchain Tag", url: "https://dev.to/feed/tag/blockchain", type: "rss", priority: 2 },
  { name: "Developer DAO Blog", url: "https://medium.com/feed/developer-dao", type: "rss", priority: 2 },
  { name: "Ethereum Magicians Forum", url: "https://ethereum-magicians.org/latest.rss", type: "rss", priority: 1 },
  { name: "Reddit r/ethdev", url: "https://old.reddit.com/r/ethdev/.rss", type: "rss", priority: 2 },
  { name: "Reddit r/SolanaDev", url: "https://old.reddit.com/r/SolanaDev/.rss", type: "rss", priority: 2 },

  // ── 漏洞赏金 / Bug Bounty 来源 ──────────────────────────────────
  { name: "Immunefi Blog", url: "https://medium.com/feed/immunefi", type: "rss", priority: 1 },
  { name: "Code4rena Blog", url: "https://medium.com/feed/code-423n4", type: "rss", priority: 1 },
  { name: "HackenProof Blog", url: "https://medium.com/feed/hackenproof", type: "rss", priority: 2 },
  { name: "Medium Bug Bounty", url: "https://medium.com/feed/tag/bug-bounty", type: "rss", priority: 2 },
  { name: "Reddit r/Bugbounty Web3", url: "https://old.reddit.com/r/bugbounty/.rss", type: "rss", priority: 3 },

  // ── 融资公告 / 投融资来源 ────────────────────────────────────────
  { name: "CryptoRank Fundraising", url: "https://cryptorank.io/news/feed?category=funding", type: "rss", priority: 1 },
  { name: "Medium Crypto Funding", url: "https://medium.com/feed/tag/crypto-funding", type: "rss", priority: 2 },
  { name: "Medium Venture Capital", url: "https://medium.com/feed/tag/venture-capital", type: "rss", priority: 2 },
  { name: "Crunchbase Crypto News", url: "https://news.crunchbase.com/tag/cryptocurrency/feed/", type: "rss", priority: 1 },

  // ── 预售 / IDO / Launchpad 来源 ─────────────────────────────────
  { name: "Seedify Blog", url: "https://medium.com/feed/seedify-fund", type: "rss", priority: 1 },
  { name: "DAO Maker Blog", url: "https://medium.com/feed/daomaker", type: "rss", priority: 1 },
  { name: "Polkastarter Blog", url: "https://medium.com/feed/polkastarter", type: "rss", priority: 2 },
  { name: "PinkSale Blog", url: "https://medium.com/feed/pinksale-finance", type: "rss", priority: 2 },
  { name: "CoinList Blog", url: "https://coinlist.co/blog/rss", type: "rss", priority: 1 },
  { name: "Medium IDO", url: "https://medium.com/feed/tag/ido", type: "rss", priority: 2 },
  { name: "Medium Presale", url: "https://medium.com/feed/tag/presale", type: "rss", priority: 2 },
  { name: "Legion Blog", url: "https://medium.com/feed/legionapp", type: "rss", priority: 1 },

  // ── 资助/捐赠 / Grants 来源 ──────────────────────────────────────
  { name: "Gitcoin Blog", url: "https://www.gitcoin.co/blog/rss", type: "rss", priority: 1 },
  { name: "Ethereum Foundation Blog", url: "https://blog.ethereum.org/feed.xml", type: "rss", priority: 1 },
  { name: "Near Foundation Blog", url: "https://near.org/blog/feed/", type: "rss", priority: 1 },
  { name: "Arbitrum Foundation Blog", url: "https://medium.com/feed/offchainlabs", type: "rss", priority: 1 },
  { name: "Optimism Foundation Blog", url: "https://optimism.io/blog/feed", type: "rss", priority: 1 },
  { name: "a16z Crypto Blog Grants", url: "https://a16zcrypto.com/feed/", type: "rss", priority: 1 },
  { name: "Binance Labs Blog", url: "https://medium.com/feed/binance-labs", type: "rss", priority: 1 },
  { name: "Medium Grants", url: "https://medium.com/feed/tag/crypto-grants", type: "rss", priority: 2 },
  { name: "Medium Web3 Grants", url: "https://medium.com/feed/tag/web3-grants", type: "rss", priority: 2 },
  { name: "Solana Foundation Blog", url: "https://solana.foundation/news/rss", type: "rss", priority: 1 },
];

export const DEFAULT_KEYWORDS = [
  // 基础 Web3 词汇
  "blockchain","web3","crypto","bitcoin","btc","ethereum","eth","solana",
  "defi","nft","rwa","depin","layer1","layer2","dao","zk","zkp",
  // 事件类型（英文）
  "airdrop","testnet","mainnet","ido","presale","launchpad","token",
  "funding","grant","hackathon","quest","node","staking","yield",
  "token unlock","token sale","token listing","token generation event","tge",
  "public sale","private sale","whitelist","early access","beta",
  "incentive","reward","bounty","mint","claim","snapshot",
  // 链名 / 生态
  "arbitrum","optimism","zksync","base","starknet","linea","scroll","mantle",
  "avalanche","polygon","bnb","sui","aptos","cosmos","polkadot","ton",
  "near","fantom","algorand","tron","hedera","stellar","iota",
  // 项目类型
  "ai agent","defi protocol","liquidity","tvl","dex","cex","nft mint",
  "layer 2","rollup","bridge","lsd","lst","restaking","eigenlayer",
  "perp","perpetual","options","lending","borrowing","yield farming",
  "launchpad","incubator","accelerator","investment","seed round","series",
  "oracle","data feed","cross-chain","interoperability","modular",
  // 招聘 / 开发者
  "hiring","job","developer","engineer","ambassador","community","kol",
  "testnet node","validator","operator","early adopter",
  // 漏洞赏金
  "bug bounty","bounty program","security audit","vulnerability","exploit",
  "hackenproof","immunefi","code4rena","security researcher","responsible disclosure",
  // 融资公告
  "raises","raised","seed round","series a","series b","pre-seed","investment round",
  "lead investor","backed by","announces funding","closes funding",
  // 预售 / IDO
  "public sale","private sale","seedify","dao maker","polkastarter","coinlist","legion",
  "pinksale","initial dex offering","token sale","dxsale","whitelisted",
  // Grants / 资助
  "grant program","grant round","gitcoin","ecosystem fund","foundation grant",
  "incubation","accelerator program","web3 foundation","near grants","arbitrum grants",
  "optimism rpgf","retroactive funding","binance labs","a16z crypto","grants for",
  // Web3 招聘
  "web3 job","crypto job","blockchain developer","solidity developer","rust developer",
  "web3.career","cryptojobslist","remote blockchain","protocol engineer","smart contract engineer",
  // 中文关键词
  "区块链","加密货币","空投","测试网","主网","代币","融资","挖矿",
  "交易所","上线","发行","生态","跨链","钱包","隐私","智能合约",
  "节点","质押","铸造","白名单","快照","奖励","激励","测试","社区",
  "链游","元宇宙","去中心化","公链","侧链","二层","零知识","锁仓",
  "预售","内测","公测","开放","申请","报名","任务","活动","招募",
  "漏洞","赏金","资助","捐赠","赞助","孵化","加速器","招聘",
  "融资轮","种子轮","战略投资","天使轮","安全审计","漏洞赏金",
];

export interface ScrapeSource {
  id?: number;
  name: string;
  url: string;
  type: string;
  priority: number;
  enabled: boolean;
}

export interface ScrapeLogEntry {
  id?: number;
  runId: string;
  sourceName: string;
  sourceUrl: string;
  status: "ok" | "error" | "skip";
  itemsFound: number;
  itemsSaved: number;
  errorMsg?: string | null;
  createdAt?: Date;
}

export interface ScrapeRunSummary {
  runId: string;
  totalSources: number;
  totalItemsFound: number;
  totalItemsSaved: number;
  errors: number;
  durationMs: number;
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchRssWithRetry(url: string, retries = MAX_RETRIES): Promise<Parser.Output<Record<string, unknown>> | null> {
  const parser = new Parser({
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Web3ReleaseBot/1.0; +https://web3release.com)",
      "Accept": "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
    },
    requestOptions: {
      rejectUnauthorized: false,
    },
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const feed = await parser.parseURL(url);
      return feed;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt === retries) {
        console.warn(`[auto-scrape] fetchRss failed after ${retries} attempts: ${url} — ${msg}`);
        return null;
      }
      await sleep(attempt * 1500);
    }
  }
  return null;
}

function passesKeywordFilter(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function safeDate(val: unknown): Date | null {
  if (!val || typeof val !== "string") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

interface ProcessedEvent {
  title: string;
  project_name: string;
  description: string;
  category: string[];
  start_time: string | null;
  end_time: string | null;
  source_url: string;
  importance: "high" | "medium" | "low";
  ai_confidence: number;
}

const WEB3_BATCH_PROMPT = `You are a Web3 event extraction expert working exclusively for web3release.com.

Platform sections (choose 1–2 strictly from this list). Read each definition carefully before classifying:

- 测试网: Project launches or upgrades a testnet network, inviting users to test. ONLY if it is a testnet — not mainnet, not a presale, not a quest.

- IDO/Launchpad: Token IDO or Launchpad listing event on a launchpad platform (e.g. Binance Launchpad, Bybit, Gate Startup, Polkastarter). NOT general news or funding.

- 预售: Token or NFT presale (private sale, public sale, whitelist sale) on platforms like CoinList, Seedify, DAO Maker, PinkSale, Legion, DxSale. NOT airdrop, not IDO.

- 融资公告: ONLY confirmed funding events — VC investment, seed round, Series A/B, strategic investment round, angel round. Must mention a specific dollar amount raised or investor names. STRICT EXCLUSIONS: do NOT use for regulatory news, government policy, laws, bills, proposals, partnership announcements, protocol integrations, market expansions, testnet launches, presales, airdrops, or anything without a confirmed investment round.

- 空投: Airdrop campaign open to users (free token distribution). NOT staking rewards or liquidity mining.

- 招聘: Web3/blockchain job openings, hiring announcements, remote roles. NOT ecosystem grants.

- 节点招募: Validator node or miner node recruitment programs.

- 主网上线: ONLY confirmed mainnet launch / mainnet goes live events — when a blockchain network officially launches its mainnet, or a protocol deploys to mainnet for the first time, or a major bridge/cross-chain goes live on mainnet. STRICT EXCLUSIONS: do NOT use for testnets, funding rounds, partnerships, integrations, feature updates, upgrades that are not mainnet launches, or any content without the words "mainnet launch", "mainnet goes live", "launches mainnet", "mainnet activation", or equivalent.

- 代币解锁: Scheduled token unlock or vesting cliff events. Must have a specific unlock date or amount.

- 交易所上线: ONLY confirmed or officially announced token listings on a named CEX or major DEX (e.g. "listed on Binance", "will list on Coinbase", "Upbit listing", "OKX listing"). STRICT EXCLUSIONS: do NOT use for testnet news, funding, presales, IDO, node recruitment, regulatory news, or general project updates without a specific exchange listing announcement.

- 链上任务: ONLY for campaigns where users must complete specific on-chain actions to earn rewards — quests on Galxe, Layer3, QuestN, Zealy, TaskOn, Intract. Partnership announcements, feature launches, and protocol upgrades do NOT qualify.

- 开发者专区: Developer tools, SDKs, APIs, hackathons, technical upgrades, smart contract audits/releases, developer tutorials.

- 漏洞赏金: Bug bounty programs, security audit competitions, vulnerability reward programs (Immunefi, Code4rena, HackenProof, Sherlock, etc.).

- 项目捐赠/赞助: Grant programs, ecosystem funds, sponsorships, accelerators, incubators (Gitcoin, Web3 Foundation, Ethereum Foundation, Solana Foundation, Arbitrum Grants, Optimism RPGF, Binance Labs, a16z, etc.).

Strict routing rules — apply in this order:
1. Contains testnet/testnet quest content → 测试网 or 链上任务 (NOT 融资公告 or 主网上线)
2. Contains presale/IDO/whitelist sale → 预售 or IDO/Launchpad (NOT 融资公告)
3. Contains regulatory news, government bills, policy, laws, court rulings → SKIP entirely (no section fits)
4. Contains "raised $X", "seed round", "Series A/B", named VC investor → 融资公告
5. Contains "mainnet launch", "launches mainnet", "mainnet goes live", "mainnet activation" → 主网上线
6. Protocol upgrade, new feature, integration, partnership, expansion → 开发者专区 or 主网上线 (NOT 融资公告, NOT 交易所上线)
7. Contains "listed on [exchange]", "will list on", "[exchange] listing" → 交易所上线
8. Requires active user on-chain action → 链上任务
9. Bug bounty / security vulnerability reward → 漏洞赏金
10. Grant / ecosystem fund / Gitcoin round → 项目捐赠/赞助
11. Job posting → 招聘
12. If content does not clearly match any section above → SKIP IT (return nothing for this article)

Task: For each article below, decide:
1. Is it a valid Web3 / crypto event?
2. Does it belong to one of the sections above?
3. Extract any dates and write a concise English description

Output rules:
- Return ONLY a raw JSON array — no markdown, no code blocks
- Include only qualifying events; skip the rest silently
- Return [] if nothing qualifies


Format for each qualifying event:
{
  "title": "Concise title, max 12 words, action-oriented — keep the original source language",
  "project_name": "Official project name",
  "description": "60–100 word description highlighting the opportunity, key dates, and what users should do. Keep the original source language — do NOT translate.",
  "category": ["空投"],
  "start_time": "ISO 8601 or null",
  "end_time": "ISO 8601 or null",
  "source_url": "original URL",
  "importance": "high/medium/low",
  "ai_confidence": 0.85
}

Article list:
{{ARTICLES}}`;

async function processBatchWithDeepSeek(
  articles: Array<{ title: string; description: string; link: string; pubDate?: string }>,
  retries = MAX_RETRIES,
): Promise<ProcessedEvent[]> {
  const articlesText = articles.map((a, i) =>
    `[${i + 1}] Title: ${a.title}\nContent: ${a.description?.slice(0, 600) ?? ""}\nURL: ${a.link}\nPublished: ${a.pubDate ?? "unknown"}`
  ).join("\n\n---\n\n");

  const prompt = WEB3_BATCH_PROMPT.replace("{{ARTICLES}}", articlesText);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await openrouter.chat.completions.create({
        model: DEEPSEEK_MODEL,
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content ?? "[]";
      const cleaned = raw.trim()
        .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

      let parsed: ProcessedEvent[];
      try {
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) parsed = [];
      } catch {
        parsed = [];
      }

      return parsed.filter(ev => ev && typeof ev.title === "string" && ev.title.trim());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt === retries) {
        console.error(`[auto-scrape] DeepSeek batch failed after ${retries} attempts: ${msg}`);
        return [];
      }
      await sleep(attempt * 2000);
    }
  }
  return [];
}

async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  try {
    const rows = await db.execute(
      sql`SELECT source_url FROM posts WHERE source_url = ANY(${urls})`
    );
    return new Set((rows.rows as Array<{ source_url: string }>).map(r => r.source_url));
  } catch {
    return new Set();
  }
}

async function getExistingTitles(titles: string[]): Promise<Set<string>> {
  if (titles.length === 0) return new Set();
  try {
    const rows = await db.execute(
      sql`SELECT title FROM posts
          WHERE title = ANY(${titles})
            AND created_at > NOW() - INTERVAL '14 days'`
    );
    return new Set((rows.rows as Array<{ title: string }>).map(r => r.title));
  } catch {
    return new Set();
  }
}

async function insertPost(ev: ProcessedEvent, section: string): Promise<boolean> {
  try {
    const now = new Date();
    await db.insert(postsTable).values({
      title: ev.title.slice(0, 200),
      content: (ev.description ?? "").slice(0, 2000),
      section,
      authorWallet: AI_SYSTEM_WALLET,
      authorName: (ev.project_name?.slice(0, 100)) || AI_SYSTEM_NAME,
      authorType: "ai",
      sourceUrl: ev.source_url?.slice(0, 500) ?? null,
      aiConfidence: typeof ev.ai_confidence === "number" ? Math.min(1, Math.max(0, ev.ai_confidence)) : 0.8,
      importance: (["high", "medium", "low"] as const).includes(ev.importance as "high") ? ev.importance : "medium",
      eventStartTime: safeDate(ev.start_time),
      eventEndTime: safeDate(ev.end_time),
      expiresAt: new Date(now.getTime() + SIXTY_DAYS_MS),
      views: 0, likes: 0, comments: 0, kolLikePoints: 0, kolCommentPoints: 0,
      isPinned: false, pinQueued: false,
    });
    return true;
  } catch (e) {
    console.error("[auto-scrape] insertPost error:", e);
    return false;
  }
}

async function logEntry(entry: ScrapeLogEntry): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO scrape_logs (run_id, source_name, source_url, status, items_found, items_saved, error_msg)
      VALUES (${entry.runId}, ${entry.sourceName}, ${entry.sourceUrl}, ${entry.status}, ${entry.itemsFound}, ${entry.itemsSaved}, ${entry.errorMsg ?? null})
    `);
  } catch (e) {
    console.error("[auto-scrape] log error:", e);
  }
}

export async function getKeywordsFromDb(): Promise<string[]> {
  try {
    const rows = await db.execute(sql`SELECT keyword FROM scrape_keywords WHERE enabled = true`);
    const kws = (rows.rows as Array<{ keyword: string }>).map(r => r.keyword);
    return kws.length > 0 ? kws : DEFAULT_KEYWORDS;
  } catch {
    return DEFAULT_KEYWORDS;
  }
}

export async function getSourcesFromDb(): Promise<ScrapeSource[]> {
  try {
    const rows = await db.execute(sql`SELECT id, name, url, type, priority, enabled FROM scrape_sources WHERE enabled = true ORDER BY priority ASC, id ASC`);
    const sources = rows.rows as ScrapeSource[];
    if (sources.length > 0) return sources;
    return DEFAULT_SOURCES.map(s => ({ ...s, enabled: true }));
  } catch {
    return DEFAULT_SOURCES.map(s => ({ ...s, enabled: true }));
  }
}

let globalScrapeRunning = false;

export function isScrapeRunning(): boolean { return globalScrapeRunning; }

export async function runAutoScrape(): Promise<ScrapeRunSummary> {
  if (globalScrapeRunning) {
    console.warn("[auto-scrape] Skipping run — another scrape is already in progress");
    return { runId: "skipped", totalSources: 0, totalItemsFound: 0, totalItemsSaved: 0, errors: 0, durationMs: 0 };
  }
  globalScrapeRunning = true;
  const runId = `run_${Date.now()}`;
  const startMs = Date.now();
  console.log(`[auto-scrape] Starting run ${runId}`);

  let sources: ScrapeSource[] = [];
  let totalItemsFound = 0;
  let totalItemsSaved = 0;
  let errors = 0;

  try {
    const [srcs, keywords] = await Promise.all([getSourcesFromDb(), getKeywordsFromDb()]);
    sources = srcs;

    for (const source of sources) {
      try {
        const feed = await fetchRssWithRetry(source.url);
        if (!feed || !Array.isArray(feed.items) || feed.items.length === 0) {
          await logEntry({ runId, sourceName: source.name, sourceUrl: source.url, status: "skip", itemsFound: 0, itemsSaved: 0, errorMsg: "No feed items" });
          continue;
        }

        const candidates = feed.items
          .slice(0, 30)
          .filter(item => {
            const text = `${item.title ?? ""} ${item.contentSnippet ?? item.summary ?? item.content ?? ""}`;
            return passesKeywordFilter(text, keywords);
          })
          .map(item => ({
            title: (item.title ?? "").replace(/<[^>]+>/g, "").trim(),
            description: (item.contentSnippet ?? item.summary ?? item.content ?? "").replace(/<[^>]+>/g, "").slice(0, 800).trim(),
            link: item.link ?? item.guid ?? source.url,
            pubDate: item.pubDate ?? item.isoDate,
          }))
          .filter(c => c.title && c.link);

        if (candidates.length === 0) {
          await logEntry({ runId, sourceName: source.name, sourceUrl: source.url, status: "skip", itemsFound: 0, itemsSaved: 0, errorMsg: "All filtered out by keywords" });
          continue;
        }

        const allLinks = candidates.map(c => c.link);
        const existingUrls = await getExistingUrls(allLinks);
        const newCandidates = candidates.filter(c => !existingUrls.has(c.link));

        if (newCandidates.length === 0) {
          await logEntry({ runId, sourceName: source.name, sourceUrl: source.url, status: "skip", itemsFound: candidates.length, itemsSaved: 0, errorMsg: "All already in DB" });
          continue;
        }

        totalItemsFound += newCandidates.length;
        let savedCount = 0;

        for (let i = 0; i < newCandidates.length; i += BATCH_SIZE) {
          const batch = newCandidates.slice(i, i + BATCH_SIZE);
          const events = await processBatchWithDeepSeek(batch);

          const generatedTitles = events.map(ev => ev.title).filter(Boolean);
          const existingTitles = await getExistingTitles(generatedTitles);

          for (const ev of events) {
            if (existingTitles.has(ev.title)) continue;
            const section = mapCategory(Array.isArray(ev.category) ? ev.category : []);
            if (!section) continue;
            const saved = await insertPost(ev, section);
            if (saved) savedCount++;
          }

          if (i + BATCH_SIZE < newCandidates.length) await sleep(1000);
        }

        totalItemsSaved += savedCount;
        await logEntry({ runId, sourceName: source.name, sourceUrl: source.url, status: "ok", itemsFound: newCandidates.length, itemsSaved: savedCount });
      } catch (e: unknown) {
        errors++;
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[auto-scrape] source ${source.name} error:`, msg);
        await logEntry({ runId, sourceName: source.name, sourceUrl: source.url, status: "error", itemsFound: 0, itemsSaved: 0, errorMsg: msg.slice(0, 500) });
      }

      await sleep(300);
    }
  } finally {
    globalScrapeRunning = false;
  }

  const durationMs = Date.now() - startMs;
  console.log(`[auto-scrape] Run ${runId} done. Found: ${totalItemsFound}, Saved: ${totalItemsSaved}, Errors: ${errors}, Duration: ${durationMs}ms`);

  return { runId, totalSources: sources.length, totalItemsFound, totalItemsSaved, errors, durationMs };
}
