export type AboutSection = {
  heading: string;
  intro?: string;
  items?: string[];
  subsections?: { heading: string; intro?: string; items?: string[] }[];
};

export type AboutContent = {
  title: string;
  subtitle: string;
  coreConcept: string;
  sections: AboutSection[];
};

export const ABOUT_CONTENT: Record<string, AboutContent> = {
  "zh-CN": {
    title: "关于平台",
    subtitle:
      "Web3 Release 是一个去中心化、社区驱动的 Web3 协作平台，定位为「加密团队一站式需求发布与匹配中心」。通过钱包连接实现真实身份验证，帮助加密团队、KOL 和开发者和加密用户的高效连接，发布需求、匹配人才、分享知识和社区互动。本平台仅作为去中心化信息桥梁。平台不参与任何匹配、聊天、交付或支付。用户发布需求后，请在内容中留下有效联系方式。感兴趣的用户可直接私信联系，双方自行协商一切事宜，平台不承担任何责任或纠纷调解。",
    coreConcept:
      "核心理念：连接需求，释放创新。加密团队可以随时发布各种需求，区块链用户（开发者、KOL、节点运营者等）可以快速发现并响应，实现透明、高效的协作。",
    sections: [
      {
        heading: "当前主要功能展示",
        items: [
          "Pinned Zone：置顶区，展示高优先级或热门需求（带倒计时，如 1 天剩余）。",
          "Elite Teams：精英团队/项目列表，按最新排序展示，支持不同视图（Testnet View、Jobs View、Integration View 等）。",
          "发布与匹配：团队发布需求后，内容以时间线形式出现在首页「项目展示」区和对应专栏，最新内容优先置顶。",
          "操作入口：Connect Wallet（连接钱包 🌙）、Join Guild / Join Now（申请加入，火箭 🚀）。",
        ],
      },
      {
        heading: "代币激励系统（核心激励机制）",
        intro:
          "平台内置代币获取与增长机制，用于奖励高质量内容创作、真实互动和社区参与。代币总量无限，是未来 $WBR 代币空投/兑换的重要凭证（TGE 时所有累积代币 1:1 兑换为正式代币，越活跃、贡献越大，持有份额越高）。",
        subsections: [
          {
            heading: "平台代币分配与空投计划",
            intro:
              "平台正式代币 $WBR 的 60% 将定期分批次通过空投形式发放，用于激励平台活跃用户、内容贡献者和社区增长，实现真正的去中心化治理与价值分配。空投将基于用户在平台上的真实贡献（如抽奖、互动、邀请、内容发布等累积代币）进行加权分配，确保代币向社区倾斜，促进长期可持续发展和去中心化。",
            items: [
              "⚠️ 重要提示：每期空投仅限前排名 3万名 用户参与。",
              "排名依据用户真实贡献，内容发布质量、有效互动、邀请。",
              "本期进入前3万名的用户：空投发放后，显示数量自动清零，重新开始下一周期积累。",
              "本期未进入前3万名的用户：全部自动累计至下一批次，继续参与下一次排名。",
              "越早注册、持续活跃、贡献越大，获得份额越高。",
            ],
          },
          {
            heading: "全部用户均可获取代币的方式",
            items: [
              "每日代币抽奖：每 24 小时可抽取一次；奖励范围及概率：100–300 代币（50%）、301–700 代币（30%）、701–1000 代币（20%）；所有抽奖所得实时累加至余额。",
              "邀请奖励：通过专属邀请链接/码成功邀请新用户并激活后，建立永久绑定。邀请者每日自动获得被邀请者当日实际获取代币总量的 15% 作为奖励，无上限、实时结算。所有身份用户均可参与邀请奖励。",
            ],
          },
          {
            heading: "普通用户额外获取方式（点赞/评论任务）",
            items: [
              "点赞一次：+5 代币（每日上限 20 次有效）。",
              "评论一次：+5 代币（每日上限 20 次有效）。",
              "每日点赞 + 评论任务总上限：40 次，超出后当日不再产生任务代币奖励，防止刷量。",
            ],
          },
          {
            heading: "团队、KOL 及开发者额外获取方式（被互动奖励）",
            items: [
              "自己发布的帖子每获得 1 个点赞：+5 代币。",
              "自己发布的帖子每获得 1 条评论：+5 代币。",
              "每 24 小时通过被互动获得的代币上限：2000 代币，超出部分不予累积。",
              "注：团队/KOL/开发者不可通过主动点赞或评论他人帖子获取代币任务奖励。",
            ],
          },
        ],
      },
      {
        heading: "能量系统（内容发布与曝光燃料）",
        intro:
          "能量是内容发布和提升可见度的核心资源，目前通过申请身份赠送，未来由代币提供或兑换（代币作为内容消耗的凭据）。",
        items: [
          "申请身份通过后自动赠送 1000 能量（首次使用礼包）。",
          "每次内容消耗 1 能量（无论内容类型）。",
          "每日内容最多 10 次（即使能量充足，也受此上限限制，防止刷量和内容泛滥）。",
          "未来 $WBR 代币将作为内容消耗凭据：用户持有/赚取代币后可兑换能量，用于发布内容、置顶、Boost 等行为，形成平台经济闭环。",
        ],
        subsections: [
          {
            heading: "惩罚与衰减机制（激励活跃使用）",
            intro:
              "为鼓励用户持续参与、避免能量长期囤积，引入强激励的衰减惩罚规则：",
            items: [
              "每日衰减：如果用户在过去 48 小时内未发布任何内容，则当日 00:00（UTC）自动对当前能量总量衰减 5%（向下取整）。示例：当前能量 1000 → 48 小时未发布 → 扣除 50，剩余 950。",
              "连续未活跃清零：如果用户连续 7 天（168 小时）未发布任何内容，则在第 7 天结束时，能量余额自动清零至 0。清零后，用户仍可通过未来 $WBR 代币兑换或其他方式重新获取能量，但首次礼包不再重复赠送。",
              "目的：通过每48小时 5% 小额衰减 + 7 天清零的组合，形成持续且可预期的压力，鼓励用户至少每天或每周保持内容输出，形成健康、高活跃的内容生态。",
            ],
          },
        ],
      },
      {
        heading: "内容规则（完整版）",
        subsections: [
          {
            heading: "1. 身份申请与能量门槛",
            items: [
              "申请时选择身份类别标签（仅限以下三种，不可多选）：加密团队、KOL（关键意见领袖）、开发者。",
              "身份通过后自动赠送 1000 能量。",
              "每次内容消耗 1 能量（能量不足无法发布，需未来通过代币兑换补充）。",
              "每日内容上限：最多 10 次/天。",
            ],
          },
          {
            heading: "2. 内容标签与自动归集",
            items: [
              "KOL 和开发者身份：内容自动归集到选择分区内（垂直展示，便于团队筛选人才，不占用首页普通位）。",
              "标签决定内容在对应子栏目的展示位置，实现精准匹配。",
              "普通用户：每日发布内容限 10 次（只限求职和社区聊天分区）。",
              "每个分区系统只会显示最新发布的一条内容，后续发布将会自动覆盖上一次的内容。",
              "您可以使用代币按 200:1 的比例兑换能量，用于获取更多发布次数或能量值。",
            ],
          },
          {
            heading: "3. 内容审核与优先级",
            items: [
              "内容即时发布，无需人工审核（去中心化原则）。",
              "高能量用户可额外申请置顶/Boost（消耗更多能量，置顶时间更长、位置更高）。",
              "平台保留举报/下架机制（社区治理或管理员干预，用于处理明显诈骗/垃圾内容）。",
            ],
          },
        ],
      },
      {
        heading: "平台愿景与解决的问题",
        intro:
          "Web3 Release 致力于成为 Web3 时代的「Twitter + LinkedIn + Gitcoin」——一个真正去中心化、社区自驱动的协作与发布中心。在信任、可追溯、激励充分的环境中，让加密团队、KOL 和开发者自由发布与协作，加速区块链下一波真实创新。",
        subsections: [
          {
            heading: "主要解决的问题",
            items: [
              "协作摩擦高：需求与供给分散多平台，筛选成本极高。",
              "信任缺失：低质量邀约、诈骗泛滥，项目真实性难辨。",
              "机会不均：开发者/KOL 难以被看见，缺乏持续激励。",
              "信息碎片化：跨链信息重复建设、低质协作严重。",
              "中心化依赖：中小参与者曝光难，依赖算法或付费推广。",
            ],
          },
          {
            heading: "Web3 Release 的解法",
            items: [
              "身份类别申请 + 内容标签分类，大幅降低协作门槛。",
              "能量门槛（未来代币消耗）+ 每日内容上限 10 次，建立可验证信任。",
              "抽奖 + 互动（每日活动上限 40 次） + 邀请机制（15% 奖励），激励真实活跃与社区增长。",
              "平台代币 60% 定期分批空投 + 代币 1:1 兑换，奖励长期贡献，实现真正的去中心化。",
              "去中心化声誉体系，促进多链互联，赋能中小参与者，让区块链生态更健康、更高效发展。",
            ],
          },
        ],
      },
    ],
  },

  "en": {
    title: "About",
    subtitle:
      "Web3 Release is a decentralized, community-driven Web3 collaboration platform — the all-in-one demand publishing & matching platform for crypto teams. Using wallet-based identity verification, it efficiently connects crypto teams, KOLs, and developers to publish needs, match talent, share knowledge, and engage with the community.",
    coreConcept:
      "Core Concept: Connect demand, unleash innovation. Crypto teams can post any requirement at any time, and blockchain users (developers, KOLs, node operators, etc.) can quickly discover and respond, enabling transparent and efficient collaboration.",
    sections: [
      {
        heading: "Key Features",
        items: [
          "Pinned Zone: Highlights high-priority or trending posts with a live countdown.",
          "Elite Teams: Project list sorted by latest activity, with multiple view modes (Testnet, Jobs, Integration, etc.).",
          "Publish & Match: Posts appear in the homepage timeline and their corresponding section immediately after publishing.",
          "Entry Points: Connect Wallet 🌙, Join Guild / Join Now 🚀 (apply for a space).",
        ],
      },
      {
        heading: "Token Incentive System (Core Mechanism)",
        intro:
          "The platform has a built-in token earning system to reward quality content, genuine interactions, and community participation. Tokens are unlimited and serve as the key credential for the future $WBR token airdrop/exchange — all accumulated tokens convert 1:1 at TGE, so the more active you are, the higher your share.",
        subsections: [
          {
            heading: "Token Distribution & Airdrop Plan",
            intro:
              "60% of the official $WBR token supply will be distributed periodically via airdrops to reward active users, content contributors, and community growth. Airdrops are weighted by real contributions (slot pulls, interactions, referrals, posts), ensuring tokens flow to the community and support long-term decentralized growth.",
          },
          {
            heading: "Token Sources Available to All Users",
            items: [
              "Daily slot pull: once every 24 hours; prize range: 100–300 tokens (50%), 301–700 tokens (30%), 701–1,000 tokens (20%). All prizes credited to balance instantly.",
              "Referral bonus: After a successful invite, earn 15% of your invitee's daily token earnings automatically — no cap, settled in real time. All user types are eligible for referral rewards.",
            ],
          },
          {
            heading: "General Users — Additional Task Rewards (Likes & Comments)",
            items: [
              "Like a post: +5 tokens (up to 20 valid likes/day).",
              "Comment on a post: +5 tokens (up to 20 valid comments/day).",
              "Daily task cap: 40 interactions (likes + comments). No more task rewards once the cap is reached.",
            ],
          },
          {
            heading: "Team, KOL & Developer — Additional Interaction Rewards",
            items: [
              "Each like received on their own posts: +5 tokens.",
              "Each comment received on their own posts: +5 tokens.",
              "Daily cap: 2,000 tokens received via interactions; amounts beyond the cap are not accumulated.",
              "Note: Team/KOL/Developer accounts do not earn task tokens by actively liking or commenting on others' posts.",
            ],
          },
        ],
      },
      {
        heading: "Energy System (Posting Fuel)",
        intro:
          "Energy is the core resource for posting and increasing visibility. Currently granted upon identity approval; in the future it will be provided or exchanged via tokens.",
        items: [
          "1,000 energy granted automatically upon identity approval (welcome package — one-time only).",
          "Each post costs 1 energy, regardless of content type.",
          "Daily post cap: 10 posts/day (even with sufficient energy — prevents spam).",
          "Future $WBR tokens will serve as posting currency: earn/hold tokens → convert to energy → post, pin, boost, forming a complete platform economic loop.",
        ],
        subsections: [
          {
            heading: "Energy Decay & Penalty Mechanism (Encouraging Active Use)",
            intro:
              "To discourage long-term energy hoarding and reward consistent content output, the platform enforces automatic decay rules:",
            items: [
              "Daily decay: If a user has not published any content in the past 48 hours, the system automatically deducts 5% of their current energy (rounded down) at 00:00 UTC each day. Example: 1,000 energy → no post for 48 h → deduct 50, remaining 950.",
              "7-day inactivity wipe: If a user has published no content for 7 consecutive days (168 hours), their energy balance is automatically reset to 0 at the end of the 7th day. After a wipe, energy can be restored via future $WBR token exchange, but the one-time welcome package will not be re-issued.",
              "Purpose: The combination of 5% daily decay (every 48 h) and a 7-day full wipe creates predictable, sustained pressure that motivates users to publish at least weekly — building a healthy, highly-active content ecosystem.",
            ],
          },
        ],
      },
      {
        heading: "Posting Rules (Full)",
        subsections: [
          {
            heading: "1. Identity Application & Energy Threshold",
            items: [
              "Choose one identity tag (only one): Crypto Team, KOL (Key Opinion Leader), or Developer.",
              "Upon approval, the system automatically grants 1,000 energy.",
              "Each post costs 1 energy (no energy = cannot post; replenish via future token exchange).",
              "Daily post limit: max 10/day.",
            ],
          },
          {
            heading: "2. Post Tags & Auto-Routing",
            items: [
              "Select a content-type tag when posting: Testnet Recruitment, IDO / Launchpad, Security Audit, Integration Announcement, Airdrop Plan, Funding / Hiring, Node Recruitment, Hackathon / Bug Bounty, Other.",
              "Crypto Team posts: automatically featured in the Elite Teams section on the homepage (one slot per team).",
              "KOL posts: automatically routed to the KOL Zone + KOL leaderboard (ranked by likes, comments, and views in real time).",
              "Developer posts: automatically routed to the Developer Column (vertical display for fast talent discovery, separate from the main homepage feed).",
            ],
          },
          {
            heading: "3. Content Moderation & Priority",
            items: [
              "Posts are published instantly with no manual review (decentralized principle).",
              "High-energy users can apply for pinning/boosting (consumes more energy for a longer or higher-placement pin).",
              "The platform retains a reporting/takedown mechanism for obvious scams or spam content.",
            ],
          },
        ],
      },
      {
        heading: "Vision & Problems Solved",
        intro:
          "Web3 Release aims to become the Web3-era 'Twitter + LinkedIn + Gitcoin' — a truly decentralized, community-driven collaboration and publishing hub. In a trustworthy, traceable, and incentive-rich environment, crypto teams, KOLs, and developers can freely publish and collaborate, accelerating the next wave of real blockchain innovation.",
        subsections: [
          {
            heading: "Key Problems Addressed",
            items: [
              "High collaboration friction: demand and supply scattered across many platforms with extreme filtering costs.",
              "Lack of trust: low-quality invitations and rampant scams make it hard to verify project legitimacy.",
              "Unequal opportunity: developers and KOLs struggle to gain visibility without continuous incentives.",
              "Information fragmentation: redundant cross-chain content and low-quality collaboration.",
              "Centralization dependency: smaller participants rely on algorithms or paid promotion for exposure.",
            ],
          },
          {
            heading: "Web3 Release's Solutions",
            items: [
              "Identity application + content tag routing significantly lower collaboration barriers.",
              "Energy threshold (future token consumption) + daily 10-post cap establish verifiable trust.",
              "Slot pull + interactions (40 daily cap) + referral rewards (15% bonus) incentivize genuine activity and community growth.",
              "60% periodic token airdrops + 1:1 TGE conversion reward long-term contributors and drive real decentralization.",
              "Decentralized reputation system across multiple chains empowers smaller participants for a healthier, more efficient blockchain ecosystem.",
            ],
          },
        ],
      },
    ],
  },

  "de": {
    title: "Über die Plattform",
    subtitle:
      "Web3 Release ist eine dezentralisierte, community-getriebene Web3-Kollaborationsplattform — das All-in-One-Zentrum für Bedarfsveröffentlichung und Matching für Krypto-Teams. Über Wallet-Verbindung werden Krypto-Teams, KOLs und Entwickler effizient vernetzt.",
    coreConcept:
      "Kernkonzept: Bedarf verbinden, Innovation freisetzen. Krypto-Teams können jederzeit Anforderungen veröffentlichen; Blockchain-Nutzer können diese schnell entdecken und darauf reagieren.",
    sections: [
      {
        heading: "Hauptfunktionen",
        items: [
          "Pinned Zone: Zeigt Beiträge mit hoher Priorität mit einem Live-Countdown.",
          "Elite Teams: Projektliste nach Aktualität sortiert, mit verschiedenen Ansichtsmodi.",
          "Veröffentlichen & Matchen: Beiträge erscheinen sofort in der Homepage-Timeline.",
          "Einstiegspunkte: Wallet verbinden 🌙, Gilde beitreten / Jetzt beitreten 🚀.",
        ],
      },
      {
        heading: "Token-Anreizsystem (Kernanreiz)",
        intro:
          "Das Token-System belohnt qualitativ hochwertigen Content, echte Interaktionen und Community-Teilnahme. Tokens sind unbegrenzt und werden bei TGE 1:1 in offizielle $WBR-Token getauscht.",
        subsections: [
          {
            heading: "Token-Verteilung & Airdrop-Plan",
            intro:
              "60 % der offiziellen $WBR-Token werden regelmäßig per Airdrop an aktive Nutzer, Content-Beitragende und die Community verteilt — gewichtet nach echten Beiträgen (Slots, Interaktionen, Einladungen, Posts).",
          },
          {
            heading: "Token-Quellen für normale Nutzer",
            items: [
              "Täglicher Slot-Zug: einmal alle 24 Stunden; 100–300 (50 %), 301–700 (30 %), 701–1000 (20 %) Tokens.",
              "Like: +5 Tokens (max. 20 gültige Likes/Tag).",
              "Kommentar: +5 Tokens (max. 20 gültige Kommentare/Tag).",
              "Tages-Cap: 40 Interaktionen insgesamt; danach keine weiteren Token-Belohnungen.",
              "Einladungsbonus: 15 % der täglichen Token-Einnahmen des Eingeladenen (kein Limit, Echtzeit-Abrechnung). Nur für normale Nutzer.",
            ],
          },
          {
            heading: "Team-, KOL- & Entwickler-Token-Regeln",
            items: [
              "Jeder Like oder Kommentar auf eigene Beiträge: +1 Token.",
              "Tages-Limit: 2.000 Tokens.",
            ],
          },
        ],
      },
      {
        heading: "Energiesystem (Beitrags-Treibstoff)",
        intro: "Energie ist die Kernressource zum Veröffentlichen und zur Sichtbarkeitssteigerung.",
        items: [
          "Nach Identitätsgenehmigung werden automatisch 1.000 Energie vergeben (Willkommenspaket – einmalig).",
          "Jeder Beitrag kostet 1 Energie.",
          "Tägliches Beitragslimit: max. 10 Beiträge/Tag.",
          "Zukünftiger $WBR-Token dient als Posting-Währung und bildet einen wirtschaftlichen Kreislauf.",
        ],
        subsections: [
          {
            heading: "Energie-Verfall & Strafmechanismus (Aktive Nutzung fördern)",
            intro: "Um Energie-Horten zu verhindern und kontinuierlichen Content zu fördern, gelten automatische Verfallsregeln:",
            items: [
              "Täglicher Verfall: Wurde in den letzten 48 Stunden kein Inhalt veröffentlicht, werden täglich um 00:00 UTC automatisch 5 % der aktuellen Energie abgezogen (abgerundet). Beispiel: 1.000 Energie → 48 h kein Beitrag → −50, verbleibend 950.",
              "7-Tage-Nullstellung: Werden 7 Tage (168 Stunden) lang keine Inhalte veröffentlicht, wird das Energieguthaben am Ende des 7. Tages auf 0 zurückgesetzt. Energie kann danach via $WBR-Token zurückgewonnen werden, das Willkommenspaket wird jedoch nicht erneut vergeben.",
              "Ziel: Die Kombination aus 5 % täglichem Verfall (alle 48 h) und 7-Tage-Nullstellung schafft nachhaltig messbaren Druck, der Nutzer zu regelmäßiger Content-Produktion motiviert.",
            ],
          },
        ],
      },
      {
        heading: "Beitragsregeln",
        subsections: [
          {
            heading: "1. Identitätsantrag & Energieschwelle",
            items: [
              "Wähle eine Identitätskategorie (nur eine): Krypto-Team, KOL oder Entwickler.",
              "Nach Genehmigung: 1.000 Energie; täglich max. 10 Beiträge.",
            ],
          },
          {
            heading: "2. Beitrags-Tags & Auto-Routing",
            items: [
              "Inhaltstyp-Tag wählen: Testnet, IDO/Launchpad, Sicherheitsaudit, Integration, Airdrop, Finanzierung, Nodes, Hackathon/Bug Bounty, Sonstiges.",
              "Krypto-Teams → Elite Teams. KOL → KOL-Zone + Rangliste. Entwickler → Entwickler-Spalte.",
            ],
          },
          {
            heading: "3. Inhaltsmoderation & Priorität",
            items: [
              "Sofortige Veröffentlichung ohne manuelle Prüfung.",
              "Nutzer mit viel Energie können Pinning/Boosting beantragen.",
              "Melde-/Abnahmemechanismus für offensichtliche Betrügereien.",
            ],
          },
        ],
      },
      {
        heading: "Vision & gelöste Probleme",
        intro:
          "Web3 Release strebt danach, das Web3-'Twitter + LinkedIn + Gitcoin' zu werden — ein wirklich dezentralisierter, community-getriebener Hub.",
        subsections: [
          {
            heading: "Hauptprobleme",
            items: [
              "Hohe Kollaborationsreibung: Angebot und Nachfrage auf vielen Plattformen verstreut.",
              "Mangelndes Vertrauen: Schlechte Qualität und Betrug erschweren die Verifikation.",
              "Ungleiche Chancen: Entwickler/KOLs kämpfen um Sichtbarkeit.",
              "Informationsfragmentierung und Zentralisierungsabhängigkeit.",
            ],
          },
          {
            heading: "Web3 Release's Lösungen",
            items: [
              "Identitätsantrag + Inhalts-Tags senken Hürden erheblich.",
              "Energieschwelle + 10-Beiträge-Limit schaffen verifizierbares Vertrauen.",
              "Slot + Interaktionen (40/Tag) + 15 % Einladungsbonus fördern echte Aktivität.",
              "60 % Airdrop + 1:1 TGE belohnen Langzeitbeitragende und fördern echte Dezentralisierung.",
            ],
          },
        ],
      },
    ],
  },

  "ru": {
    title: "О платформе",
    subtitle:
      "Web3 Release — децентрализованная, управляемая сообществом платформа Web3-коллаборации: универсальный центр публикации запросов и подбора участников для крипто-команд. Верификация через кошелёк соединяет команды, KOL-лидеров и разработчиков.",
    coreConcept:
      "Основная идея: соединить запросы, раскрыть инновации. Крипто-команды публикуют требования в любое время, а пользователи блокчейна быстро находят и откликаются на них.",
    sections: [
      {
        heading: "Основные функции",
        items: [
          "Pinned Zone: закреплённые записи с обратным отсчётом.",
          "Elite Teams: список проектов с сортировкой по дате и разными режимами просмотра.",
          "Публикация и подбор: записи сразу появляются в ленте главной страницы.",
          "Точки входа: подключение кошелька 🌙, вступление в гильдию 🚀.",
        ],
      },
      {
        heading: "Токен-система (ключевой стимул)",
        intro:
          "Встроенная система токенов поощряет качественный контент и участие в сообществе. Все накопленные токены конвертируются 1:1 в $WBR при TGE.",
        subsections: [
          {
            heading: "Распределение токенов и план аирдропа",
            intro:
              "60 % официальных $WBR-токенов будут распределяться периодически через аирдропы активным пользователям, взвешенным по реальным вкладам (слоты, взаимодействия, рефералы, публикации).",
          },
          {
            heading: "Источники токенов для обычных пользователей",
            items: [
              "Ежедневный слот: раз в 24 часа; 100–300 (50 %), 301–700 (30 %), 701–1000 (20 %) токенов.",
              "Лайк: +5 токенов (макс. 20 лайков/день).",
              "Комментарий: +5 токенов (макс. 20 комментариев/день).",
              "Дневной лимит: 40 взаимодействий; после — токены не начисляются.",
              "Реферальный бонус: 15 % ежедневных токенов приглашённого, без лимита, в реальном времени. Только для обычных пользователей.",
            ],
          },
          {
            heading: "Правила для команд, KOL и разработчиков",
            items: [
              "Каждый лайк или комментарий на собственные публикации: +1 токен.",
              "Дневной лимит: 2 000 токенов.",
            ],
          },
        ],
      },
      {
        heading: "Система энергии (топливо для публикаций)",
        intro: "Энергия — основной ресурс для публикации и повышения видимости.",
        items: [
          "После одобрения личности автоматически выдаётся 1 000 энергии (приветственный пакет — единоразово).",
          "Каждая публикация стоит 1 энергию; дневной лимит: 10 публикаций.",
          "Будущий $WBR-токен станет платёжным средством для публикаций.",
        ],
        subsections: [
          {
            heading: "Затухание энергии и штрафной механизм (поощрение активности)",
            intro: "Чтобы предотвратить накопление энергии и стимулировать регулярный выпуск контента, действуют автоматические правила затухания:",
            items: [
              "Ежедневное затухание: если за последние 48 часов не было опубликовано ни одного материала, каждый день в 00:00 UTC автоматически вычитается 5 % текущей энергии (округление вниз). Пример: 1 000 энергии → 48 ч без публикаций → −50, остаток 950.",
              "Обнуление через 7 дней: если публикации отсутствуют 7 дней (168 часов) подряд, баланс энергии автоматически обнуляется в конце 7-го дня. После обнуления энергию можно восстановить обменом токенов $WBR, но приветственный пакет повторно не выдаётся.",
              "Цель: сочетание ежедневного затухания 5 % (каждые 48 ч) и обнуления на 7-й день создаёт предсказуемое давление, мотивирующее публиковать контент хотя бы раз в неделю.",
            ],
          },
        ],
      },
      {
        heading: "Правила публикаций",
        subsections: [
          {
            heading: "1. Заявка на личность и порог энергии",
            items: [
              "Выберите одну категорию: крипто-команда, KOL или разработчик.",
              "После одобрения: 1 000 энергии; дневной лимит: 10 публикаций.",
            ],
          },
          {
            heading: "2. Теги и авто-маршрутизация",
            items: [
              "Тег типа контента: тестнет, IDO/Launchpad, аудит, интеграция, аирдроп, финансирование, ноды, хакатон/баунти, прочее.",
              "Крипто-команды → Elite Teams. KOL → зона KOL + рейтинг. Разработчики → колонка разработчиков.",
            ],
          },
          {
            heading: "3. Модерация и приоритет",
            items: [
              "Публикации выходят мгновенно без ручной модерации.",
              "Пользователи с большим количеством энергии могут закреплять/буст свои публикации.",
              "Механизм жалоб для очевидных мошенников и спама.",
            ],
          },
        ],
      },
      {
        heading: "Видение и решаемые проблемы",
        intro:
          "Web3 Release стремится стать Web3-аналогом 'Twitter + LinkedIn + Gitcoin' — по-настоящему децентрализованным центром для совместной работы.",
        subsections: [
          {
            heading: "Ключевые проблемы",
            items: [
              "Высокое трение при коллаборации: запросы разбросаны по множеству платформ.",
              "Недоверие: низкокачественные приглашения и мошенничество.",
              "Неравные возможности: разработчики и KOL не могут быть замечены.",
              "Фрагментация информации и зависимость от централизации.",
            ],
          },
          {
            heading: "Решения Web3 Release",
            items: [
              "Заявка на личность + теги снижают барьеры коллаборации.",
              "Порог энергии + 10 публикаций/день создают проверяемое доверие.",
              "Слот + 40 взаимодействий/день + 15 % реферальный бонус стимулируют реальную активность.",
              "60 % аирдроп + конвертация 1:1 вознаграждают долгосрочных участников.",
            ],
          },
        ],
      },
    ],
  },

  "fr": {
    title: "À propos",
    subtitle:
      "Web3 Release est une plateforme Web3 décentralisée et communautaire — le centre tout-en-un de publication et de matching pour les équipes crypto. La vérification via wallet connecte efficacement équipes, KOLs et développeurs.",
    coreConcept:
      "Concept clé : connecter les besoins, libérer l'innovation. Les équipes crypto publient à tout moment, les utilisateurs blockchain trouvent et répondent rapidement.",
    sections: [
      {
        heading: "Fonctionnalités principales",
        items: [
          "Pinned Zone : publications prioritaires avec compte à rebours en direct.",
          "Elite Teams : liste de projets triée par activité, avec plusieurs modes d'affichage.",
          "Publication & Matching : les posts apparaissent immédiatement dans la timeline de la page d'accueil.",
          "Points d'entrée : Connecter Wallet 🌙, Rejoindre la Guilde 🚀.",
        ],
      },
      {
        heading: "Système de tokens (mécanisme d'incitation)",
        intro:
          "Le système de tokens récompense le contenu de qualité, les interactions réelles et la participation communautaire. Tous les tokens accumulés sont convertis 1:1 en $WBR au TGE.",
        subsections: [
          {
            heading: "Distribution des tokens & plan d'airdrop",
            intro:
              "60 % des $WBR officiels seront distribués périodiquement via airdrops aux utilisateurs actifs, pondérés par les contributions réelles (tirages, interactions, parrainages, publications).",
          },
          {
            heading: "Sources de tokens pour les utilisateurs ordinaires",
            items: [
              "Tirage quotidien : une fois toutes les 24 h ; 100–300 (50 %), 301–700 (30 %), 701–1000 (20 %) tokens.",
              "Like : +5 tokens (max. 20 valides/jour).",
              "Commentaire : +5 tokens (max. 20 valides/jour).",
              "Plafond journalier : 40 interactions au total ; aucune récompense supplémentaire au-delà.",
              "Bonus de parrainage : 15 % des tokens quotidiens du filleul, sans plafond, en temps réel. Uniquement pour les utilisateurs ordinaires.",
            ],
          },
          {
            heading: "Règles pour équipes, KOLs & développeurs",
            items: [
              "Chaque like ou commentaire reçu sur leurs publications : +1 token.",
              "Plafond journalier : 2 000 tokens.",
            ],
          },
        ],
      },
      {
        heading: "Système d'énergie (carburant de publication)",
        intro: "L'énergie est la ressource centrale pour publier et augmenter la visibilité.",
        items: [
          "1 000 énergie accordée automatiquement après approbation de l'identité (pack de bienvenue — unique).",
          "Chaque publication coûte 1 énergie ; max. 10 publications/jour.",
          "Futur token $WBR = devise de publication, formant une boucle économique complète.",
        ],
        subsections: [
          {
            heading: "Décroissance de l'énergie & mécanisme de pénalité (encourager l'activité)",
            intro: "Pour décourager l'accumulation d'énergie et récompenser la création régulière, des règles de décroissance automatique s'appliquent :",
            items: [
              "Décroissance quotidienne : si aucun contenu n'a été publié au cours des 48 dernières heures, le système déduit automatiquement 5 % de l'énergie actuelle (arrondi à l'inférieur) chaque jour à 00:00 UTC. Exemple : 1 000 énergie → 48 h sans publication → −50, reste 950.",
              "Remise à zéro après 7 jours : si aucun contenu n'est publié pendant 7 jours consécutifs (168 heures), le solde d'énergie est automatiquement remis à 0. L'énergie peut ensuite être récupérée via l'échange de tokens $WBR, mais le pack de bienvenue ne sera pas redonné.",
              "Objectif : la combinaison de 5 % de décroissance quotidienne (toutes les 48 h) et de remise à zéro au bout de 7 jours crée une pression prévisible et soutenue motivant les utilisateurs à publier régulièrement.",
            ],
          },
        ],
      },
      {
        heading: "Règles de publication",
        subsections: [
          {
            heading: "1. Demande d'identité & seuil d'énergie",
            items: [
              "Choisissez une catégorie (une seule) : Équipe crypto, KOL ou Développeur.",
              "Après approbation : 1 000 énergie ; max. 10 publications/jour.",
            ],
          },
          {
            heading: "2. Tags & routage automatique",
            items: [
              "Tag de type de contenu : Testnet, IDO/Launchpad, Audit, Intégration, Airdrop, Financement, Nœuds, Hackathon/Bug Bounty, Autre.",
              "Équipes → Elite Teams. KOL → Zone KOL + classement. Développeurs → colonne développeurs.",
            ],
          },
          {
            heading: "3. Modération & priorité",
            items: [
              "Publication instantanée sans revue manuelle.",
              "Les utilisateurs avec beaucoup d'énergie peuvent épingler/booster.",
              "Mécanisme de signalement pour escroqueries et spam.",
            ],
          },
        ],
      },
      {
        heading: "Vision & problèmes résolus",
        intro:
          "Web3 Release vise à devenir le 'Twitter + LinkedIn + Gitcoin' du Web3 — un hub décentralisé et communautaire pour la collaboration et la publication.",
        subsections: [
          {
            heading: "Problèmes principaux résolus",
            items: [
              "Friction de collaboration élevée, manque de confiance, opportunités inégales.",
              "Fragmentation de l'information et dépendance à la centralisation.",
            ],
          },
          {
            heading: "Solutions de Web3 Release",
            items: [
              "Demande d'identité + tags de contenu réduisent les barrières.",
              "Tirage + 40 interactions/jour + 15 % de bonus de parrainage stimulent l'activité réelle.",
              "60 % d'airdrop + conversion 1:1 récompensent les contributeurs à long terme.",
            ],
          },
        ],
      },
    ],
  },

  "ja": {
    title: "プラットフォームについて",
    subtitle:
      "Web3 Release は、暗号チーム向けのオールインワン需要発信・マッチングプラットフォームです。ウォレット接続で本人確認を行い、暗号チーム・KOL・開発者を効率的につなぎます。",
    coreConcept:
      "コアコンセプト：需要をつなぎ、イノベーションを解放する。暗号チームはいつでも要件を投稿でき、ブロックチェーンユーザーはすぐに発見して応答できます。",
    sections: [
      {
        heading: "主な機能",
        items: [
          "Pinned Zone：カウントダウン付きの高優先度投稿を表示。",
          "Elite Teams：最新順のプロジェクトリスト（複数ビューモード対応）。",
          "発信・マッチング：投稿はすぐにホームページのタイムラインに表示されます。",
          "エントリー：ウォレット接続 🌙、ギルド参加 🚀。",
        ],
      },
      {
        heading: "トークンインセンティブシステム",
        intro:
          "質の高いコンテンツ・真のインタラクション・コミュニティ参加を報酬するトークンシステム。TGEで全累積トークンが$WBRに1:1交換されます。",
        subsections: [
          {
            heading: "トークン配布 & エアドロップ計画",
            intro:
              "公式$WBRの60%は定期的にエアドロップで配布。実際の貢献（スロット・インタラクション・紹介・投稿）に応じて加重分配されます。",
          },
          {
            heading: "一般ユーザーのトークン獲得方法",
            items: [
              "毎日スロット：24時間に1回；100–300（50%）・301–700（30%）・701–1000（20%）トークン。",
              "いいね：+5トークン（1日最大20回有効）。",
              "コメント：+5トークン（1日最大20回有効）。",
              "1日上限：40インタラクション（上限超過後は報酬なし）。",
              "紹介ボーナス：招待者が招待した人の1日獲得トークンの15%を自動取得（上限なし、リアルタイム精算）。一般ユーザーのみ対象。",
            ],
          },
          {
            heading: "チーム・KOL・開発者のルール",
            items: [
              "自分の投稿に対するいいね・コメント1件につき+1トークン。",
              "1日上限：2,000トークン。",
            ],
          },
        ],
      },
      {
        heading: "エネルギーシステム（投稿の燃料）",
        intro: "エネルギーは投稿と可視性向上の主要リソースです。",
        items: [
          "身分承認後に自動で1,000エネルギー付与（ウェルカムパッケージ：1回限り）。",
          "投稿1件につき1エネルギー消費；1日最大10件。",
          "将来的に$WBRトークンで投稿通貨として機能し、経済ループを形成。",
        ],
        subsections: [
          {
            heading: "エネルギー減衰とペナルティ機能（継続的な活動を促進）",
            intro: "エネルギーの長期的な蓄積を防ぎ、継続的なコンテンツ投稿を奨励するため、自動減衰ルールが適用されます：",
            items: [
              "毎日の減衰：過去48時間以内にコンテンツを投稿していない場合、毎日00:00 UTC に現在のエネルギー総量の5%が自動的に差し引かれます（切り捨て）。例：1,000エネルギー → 48時間投稿なし → −50、残量950。",
              "7日間の完全リセット：7日間（168時間）連続してコンテンツを投稿しなかった場合、7日目の終わりにエネルギー残高が自動的に0にリセットされます。その後は$WBRトークン交換でエネルギーを取り戻せますが、ウェルカムパッケージは再付与されません。",
              "目的：48時間ごとの5%減衰と7日リセットを組み合わせることで、ユーザーが少なくとも週に一度はコンテンツを発信するよう、継続的かつ予測可能なプレッシャーを生み出します。",
            ],
          },
        ],
      },
      {
        heading: "投稿ルール",
        subsections: [
          {
            heading: "1. 身分申請 & エネルギー閾値",
            items: [
              "カテゴリを1つ選択：暗号チーム・KOL・開発者。",
              "承認後：1,000エネルギー；1日最大10件。",
            ],
          },
          {
            heading: "2. タグ & 自動ルーティング",
            items: [
              "コンテンツタグを選択：テストネット・IDO/Launchpad・監査・統合・エアドロップ・採用・ノード・ハッカソン/バウンティ・その他。",
              "チーム → Elite Teams。KOL → KOLゾーン + ランキング。開発者 → 開発者コラム。",
            ],
          },
          {
            heading: "3. モデレーション & 優先度",
            items: [
              "即時公開（人工審査なし）。",
              "高エネルギーユーザーはピン留め/ブーストを申請可能。",
              "明らかな詐欺・スパムに対する通報/削除メカニズムあり。",
            ],
          },
        ],
      },
      {
        heading: "ビジョン & 解決する問題",
        intro:
          "Web3 Releaseは、Web3版の「Twitter + LinkedIn + Gitcoin」を目指す真の分散型コラボレーションハブです。",
        subsections: [
          {
            heading: "主な課題",
            items: [
              "高い協業摩擦・信頼欠如・不平等な機会・情報の断片化・中央集権依存。",
            ],
          },
          {
            heading: "Web3 Releaseの解決策",
            items: [
              "身分申請+タグで協業ハードルを大幅に低下。",
              "スロット+40件/日+15%紹介ボーナスで真の活動を促進。",
              "60%エアドロップ+1:1変換で長期貢献者を報酬。",
            ],
          },
        ],
      },
    ],
  },

  "ko": {
    title: "플랫폼 소개",
    subtitle:
      "Web3 Release는 탈중앙화된 커뮤니티 기반 Web3 협업 플랫폼으로, 암호화폐 팀을 위한 원스톱 수요 발행 및 매칭 센터입니다. 지갑 연결을 통한 실명 인증으로 팀, KOL, 개발자를 효율적으로 연결합니다.",
    coreConcept:
      "핵심 개념: 수요를 연결하고 혁신을 해방하라. 암호화폐 팀은 언제든지 요구사항을 게시하고, 블록체인 사용자는 빠르게 발견하고 응답할 수 있습니다.",
    sections: [
      {
        heading: "주요 기능",
        items: [
          "Pinned Zone: 실시간 카운트다운이 있는 고우선순위 게시물 표시.",
          "Elite Teams: 최신순으로 정렬된 프로젝트 목록 (다양한 뷰 모드 지원).",
          "발행 & 매칭: 게시물은 홈페이지 타임라인에 즉시 표시됩니다.",
          "진입점: 지갑 연결 🌙, 길드 가입 🚀.",
        ],
      },
      {
        heading: "토큰 인센티브 시스템",
        intro:
          "고품질 콘텐츠, 진정한 상호작용, 커뮤니티 참여를 보상하는 토큰 시스템. TGE 시 누적된 모든 토큰이 $WBR로 1:1 교환됩니다.",
        subsections: [
          {
            heading: "토큰 분배 & 에어드롭 계획",
            intro:
              "공식 $WBR의 60%는 정기적으로 에어드롭을 통해 활성 사용자에게 배포됩니다. 실제 기여도(슬롯, 상호작용, 초대, 게시물)에 가중치를 두어 분배합니다.",
          },
          {
            heading: "일반 사용자 토큰 획득 방법",
            items: [
              "일일 슬롯: 24시간에 1회; 100–300(50%)·301–700(30%)·701–1000(20%) 토큰.",
              "좋아요: +5 토큰 (일일 최대 20회 유효).",
              "댓글: +5 토큰 (일일 최대 20회 유효).",
              "일일 상한: 40회 상호작용 (초과 시 토큰 보상 없음).",
              "초대 보너스: 초대된 사용자의 일일 토큰 획득량의 15%를 자동 수령 (상한 없음, 실시간 정산). 일반 사용자만 해당.",
            ],
          },
          {
            heading: "팀·KOL·개발자 규칙",
            items: [
              "자신의 게시물에 좋아요/댓글 1회당 +1 토큰.",
              "일일 상한: 2,000 토큰.",
            ],
          },
        ],
      },
      {
        heading: "에너지 시스템 (게시 연료)",
        intro: "에너지는 게시 및 가시성 향상을 위한 핵심 자원입니다.",
        items: [
          "신원 승인 후 자동으로 1,000 에너지 지급 (환영 패키지 — 1회 한정).",
          "게시물 1개당 1 에너지 소모; 일일 최대 10개.",
          "향후 $WBR 토큰이 게시 통화로 기능하여 경제 루프를 형성.",
        ],
        subsections: [
          {
            heading: "에너지 감소 및 패널티 메커니즘 (활발한 활동 장려)",
            intro: "에너지의 장기 비축을 방지하고 지속적인 콘텐츠 게시를 장려하기 위해 자동 감소 규칙이 적용됩니다:",
            items: [
              "일일 감소: 지난 48시간 내에 콘텐츠를 게시하지 않은 경우, 매일 00:00 UTC에 현재 에너지 총량의 5%가 자동으로 차감됩니다 (내림). 예: 1,000 에너지 → 48시간 미게시 → −50, 잔량 950.",
              "7일 완전 초기화: 7일(168시간) 연속으로 콘텐츠를 게시하지 않으면 7일차 종료 시 에너지 잔액이 자동으로 0으로 초기화됩니다. 초기화 후 $WBR 토큰 교환을 통해 에너지를 다시 얻을 수 있지만, 환영 패키지는 재지급되지 않습니다.",
              "목적: 48시간마다 5% 감소와 7일 초기화를 결합하여, 사용자가 최소 주 1회 콘텐츠를 게시하도록 지속적이고 예측 가능한 압력을 형성합니다.",
            ],
          },
        ],
      },
      {
        heading: "게시 규칙",
        subsections: [
          {
            heading: "1. 신원 신청 & 에너지 임계값",
            items: [
              "카테고리 1개 선택: 암호화폐 팀·KOL·개발자.",
              "승인 후: 1,000 에너지; 일일 최대 10개.",
            ],
          },
          {
            heading: "2. 태그 & 자동 라우팅",
            items: [
              "콘텐츠 태그 선택: 테스트넷·IDO/Launchpad·감사·통합·에어드롭·채용·노드·해커톤/버그바운티·기타.",
              "팀 → Elite Teams. KOL → KOL존 + 랭킹. 개발자 → 개발자 컬럼.",
            ],
          },
          {
            heading: "3. 콘텐츠 관리 & 우선순위",
            items: [
              "즉시 게시 (수동 검토 없음).",
              "에너지가 많은 사용자는 핀/부스트 신청 가능.",
              "사기·스팸에 대한 신고/삭제 메커니즘.",
            ],
          },
        ],
      },
      {
        heading: "비전 & 해결하는 문제",
        intro:
          "Web3 Release는 Web3 시대의 'Twitter + LinkedIn + Gitcoin'을 목표로 하는 진정한 탈중앙화 협업 허브입니다.",
        subsections: [
          {
            heading: "주요 문제",
            items: [
              "높은 협업 마찰, 신뢰 부족, 불평등한 기회, 정보 파편화, 중앙화 의존.",
            ],
          },
          {
            heading: "Web3 Release의 솔루션",
            items: [
              "신원 신청 + 태그로 협업 장벽을 크게 낮춤.",
              "슬롯 + 40회/일 + 15% 초대 보너스로 진정한 활동 촉진.",
              "60% 에어드롭 + 1:1 변환으로 장기 기여자 보상.",
            ],
          },
        ],
      },
    ],
  },

  "vi": {
    title: "Giới thiệu nền tảng",
    subtitle:
      "Web3 Release là nền tảng cộng tác Web3 phi tập trung, cộng đồng — trung tâm tất cả trong một để các nhóm crypto đăng nhu cầu và tìm kiếm đối tác. Xác minh danh tính qua ví kết nối các đội, KOL và nhà phát triển hiệu quả.",
    coreConcept:
      "Khái niệm cốt lõi: Kết nối nhu cầu, giải phóng đổi mới. Đội crypto đăng yêu cầu bất kỳ lúc nào, người dùng blockchain nhanh chóng tìm thấy và phản hồi.",
    sections: [
      {
        heading: "Tính năng chính",
        items: [
          "Pinned Zone: Hiển thị bài đăng ưu tiên cao với đếm ngược trực tiếp.",
          "Elite Teams: Danh sách dự án sắp xếp theo mới nhất, nhiều chế độ xem.",
          "Đăng & Ghép cặp: Bài đăng xuất hiện ngay trên timeline trang chủ.",
          "Điểm vào: Kết nối Ví 🌙, Tham gia Guild 🚀.",
        ],
      },
      {
        heading: "Hệ thống token khuyến khích",
        intro:
          "Hệ thống token thưởng nội dung chất lượng, tương tác thực và tham gia cộng đồng. Tất cả token tích lũy được đổi 1:1 thành $WBR tại TGE.",
        subsections: [
          {
            heading: "Phân phối token & Kế hoạch airdrop",
            intro:
              "60% $WBR chính thức sẽ được phân phối định kỳ qua airdrop cho người dùng tích cực, được tính theo đóng góp thực tế (kéo slot, tương tác, giới thiệu, đăng bài).",
          },
          {
            heading: "Cách kiếm token cho người dùng thông thường",
            items: [
              "Kéo slot hàng ngày: 1 lần/24 giờ; 100–300 (50%)·301–700 (30%)·701–1000 (20%) token.",
              "Like: +5 token (tối đa 20 lần/ngày hợp lệ).",
              "Bình luận: +5 token (tối đa 20 lần/ngày hợp lệ).",
              "Giới hạn ngày: 40 tương tác; vượt quá không nhận thêm token.",
              "Thưởng giới thiệu: 15% token hàng ngày của người được mời, không giới hạn, thời gian thực. Chỉ áp dụng cho người dùng thông thường.",
            ],
          },
          {
            heading: "Quy tắc cho Nhóm, KOL & Nhà phát triển",
            items: [
              "Mỗi like hoặc bình luận nhận trên bài đăng: +1 token.",
              "Giới hạn ngày: 2.000 token.",
            ],
          },
        ],
      },
      {
        heading: "Hệ thống năng lượng (Nhiên liệu đăng bài)",
        intro: "Năng lượng là tài nguyên cốt lõi để đăng bài và tăng khả năng hiển thị.",
        items: [
          "Tự động tặng 1.000 năng lượng sau khi phê duyệt danh tính (gói chào mừng — tặng một lần).",
          "Mỗi bài đăng tốn 1 năng lượng; tối đa 10 bài/ngày.",
          "$WBR trong tương lai sẽ là tiền tệ đăng bài, tạo vòng kinh tế hoàn chỉnh.",
        ],
        subsections: [
          {
            heading: "Suy giảm năng lượng & cơ chế phạt (Khuyến khích hoạt động liên tục)",
            intro: "Để ngăn chặn tích lũy năng lượng dài hạn và khuyến khích đăng bài đều đặn, nền tảng áp dụng các quy tắc suy giảm tự động:",
            items: [
              "Suy giảm hàng ngày: Nếu người dùng không đăng bài trong 48 giờ qua, hệ thống tự động trừ 5% tổng năng lượng hiện tại (làm tròn xuống) vào lúc 00:00 UTC mỗi ngày. Ví dụ: 1.000 năng lượng → 48 giờ không đăng → −50, còn lại 950.",
              "Xóa về 0 sau 7 ngày: Nếu người dùng không đăng bài liên tục trong 7 ngày (168 giờ), số dư năng lượng sẽ tự động về 0 vào cuối ngày thứ 7. Sau khi bị xóa, năng lượng có thể được phục hồi qua đổi token $WBR, nhưng gói chào mừng sẽ không được tặng lại.",
              "Mục đích: Kết hợp suy giảm 5% mỗi 48 giờ và xóa sạch sau 7 ngày tạo ra áp lực có thể dự đoán, thúc đẩy người dùng đăng bài ít nhất mỗi tuần để duy trì hệ sinh thái nội dung sôi động.",
            ],
          },
        ],
      },
      {
        heading: "Quy tắc đăng bài",
        subsections: [
          {
            heading: "1. Đăng ký danh tính & Ngưỡng năng lượng",
            items: [
              "Chọn 1 danh mục: Đội crypto·KOL·Nhà phát triển.",
              "Sau phê duyệt: 1.000 năng lượng; tối đa 10 bài/ngày.",
            ],
          },
          {
            heading: "2. Tags & Định tuyến tự động",
            items: [
              "Chọn tag loại nội dung: Testnet·IDO/Launchpad·Kiểm toán·Tích hợp·Airdrop·Tuyển dụng·Node·Hackathon/Bug Bounty·Khác.",
              "Đội → Elite Teams. KOL → Khu KOL + Bảng xếp hạng. Nhà phát triển → Cột nhà phát triển.",
            ],
          },
          {
            heading: "3. Kiểm duyệt & Ưu tiên",
            items: [
              "Đăng ngay lập tức không cần duyệt thủ công.",
              "Người dùng nhiều năng lượng có thể ghim/boost.",
              "Cơ chế báo cáo/gỡ xuống cho lừa đảo và spam rõ ràng.",
            ],
          },
        ],
      },
      {
        heading: "Tầm nhìn & Vấn đề giải quyết",
        intro:
          "Web3 Release hướng tới trở thành 'Twitter + LinkedIn + Gitcoin' của Web3 — trung tâm cộng tác phi tập trung thực sự.",
        subsections: [
          {
            heading: "Vấn đề chính",
            items: [
              "Ma sát cộng tác cao, thiếu tin cậy, cơ hội không đồng đều, phân mảnh thông tin, phụ thuộc tập trung.",
            ],
          },
          {
            heading: "Giải pháp của Web3 Release",
            items: [
              "Đăng ký danh tính + phân loại tag giảm rào cản cộng tác.",
              "Slot + 40 tương tác/ngày + 15% thưởng giới thiệu khuyến khích hoạt động thực.",
              "60% airdrop + đổi 1:1 tặng thưởng người đóng góp lâu dài.",
            ],
          },
        ],
      },
    ],
  },
};
