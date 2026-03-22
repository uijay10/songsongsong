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
      "Web3 Release 是一个去中心化、社区驱动的 Web3 协作平台，定位为「加密团队一站式需求发布与匹配中心」。平台通过钱包连接实现真实身份验证，帮助加密团队、KOL 和开发者高效连接，发布需求、匹配人才、分享知识和社区互动。",
    coreConcept: "核心理念：连接需求，释放创新。加密团队可以随时发布各种需求，区块链用户（开发者、KOL、节点运营者等）可以快速发现并响应，实现透明、高效的协作。",
    sections: [
      {
        heading: "当前主要功能",
        items: [
          "Pinned Zone：置顶区，展示高优先级或热门需求（有倒计时，如 3 天剩余）。",
          "Elite Teams：精英团队/项目列表，按最新排序展示，支持不同视图（Testnet View、Jobs View、Integration View 等）。",
          "发布与匹配：团队发布需求后，内容以时间线形式出现在首页「项目展示」区和对应专栏，最新内容优先置顶。",
          "操作入口：Connect Wallet、Join Guild / Join Now（申请加入）。",
        ],
      },
      {
        heading: "积分系统（核心激励机制）",
        intro:
          "平台内置积分系统，用于奖励高质量内容创作、真实互动和社区参与。积分总量无限，是兑换未来空投的重要凭证（未来 $W3R 代币空投分配将以积分占比作为主要权重依据，越活跃、贡献越大，空投份额越高）。",
        subsections: [
          {
            heading: "普通用户积分来源",
            items: [
              "每日签到：+1000 积分",
              "点赞：+100 积分/次（每日上限）",
              "评论：+100 积分/条（前 10 条有效，每日上限）",
              "邀请奖励：被邀请用户每日积分的 20% 自动分配给邀请者（无上限）",
            ],
          },
          {
            heading: "KOL 专属积分来源（KOL 不参与普通签到/点赞/评论积分）",
            items: [
              "每条帖子被点赞 1 次 +10 积分，被评论 1 次 +10 积分",
              "帖子浏览量每 1000 次 +50 积分",
              "邀请奖励同上",
            ],
          },
        ],
      },
      {
        heading: "能量系统（发帖与曝光燃料）",
        intro:
          "能量是发帖和提升可见度的核心资源，目前通过申请身份赠送，未来由代币提供或兑换（代币作为发帖消耗的凭据）。",
        items: [
          "申请身份通过后自动赠送 1000 能量（作为首次使用礼包）。",
          "每次发帖消耗 1 能量（无论内容类型）。",
          "每日发帖最多 10 次（即使能量充足，也受此上限限制，防止刷量和内容泛滥）。",
          "能量有上限（当前测试上限 100,000），未使用能量每 30 天衰减 20%（鼓励活跃使用）。",
          "未来代币（$WBR）将作为发帖消耗的凭据：用户持有/赚取代币后兑换能量，用于发帖、置顶、Boost 等行为，形成平台经济闭环。",
        ],
      },
      {
        heading: "发帖规则（完整版）",
        subsections: [
          {
            heading: "1. 身份申请与能量门槛",
            items: [
              "所有用户需先连接钱包并申请身份。",
              "申请时选择身份类别标签（仅限以下三种，不可多选）：加密团队、KOL（关键意见领袖）、开发者。",
              "身份申请通过后，系统自动赠送 1000 能量。",
              "每次发帖消耗 1 能量（能量不足无法发帖，需通过未来代币兑换或其他方式补充）。",
              "每日发帖上限：最多 10 次/天（无论能量剩余多少，超出后需次日重置）。",
            ],
          },
          {
            heading: "2. 发帖标签与自动归集",
            items: [
              "发帖时，用户需选择内容类型标签（非身份类别），例如：测试网招募、IDO 合作/Launchpad、安全审计、集成公告、空投计划、融资招聘、节点招募、黑客松/漏洞赏金、其他（自定义描述）。",
              "加密团队身份用户发帖后：内容自动显示在首页优质团队区（Elite Teams/Pinned Zone 优先考虑），默认获得首页曝光卡位（每个团队限 1 个卡位）。",
              "KOL 身份用户发帖后：帖子自动归集到 KOL 专区 + KOL 排行榜（基于点赞、评论、浏览量实时排名）。",
              "开发者身份用户发帖后：帖子自动归集到开发者专栏（垂直展示，便于团队快速筛选人才，不占用首页普通展示位）。",
            ],
          },
          {
            heading: "3. 内容审核与优先级",
            items: [
              "发帖即时发布，无需人工审核（去中心化原则）。",
              "高能量用户可额外申请置顶/Boost（消耗更多能量，置顶时间更长、位置更高）。",
              "平台保留举报/下架机制（社区治理或管理员干预，用于处理明显诈骗/垃圾内容）。",
            ],
          },
        ],
      },
      {
        heading: "平台愿景与解决的问题",
        intro:
          "Web3 Release 致力于成为 Web3 时代的「Twitter + LinkedIn + Gitcoin」——一个真正去中心化、由社区自驱动的协作与发布中心。在信任、可追溯、激励充分的环境中，让加密团队、KOL 和开发者自由发布与协作，加速区块链下一波真实创新。",
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
          "Entry Points: Connect Wallet, Join Guild / Join Now (apply for a space).",
        ],
      },
      {
        heading: "Points System (Core Incentive)",
        intro:
          "The platform has a built-in points system to reward quality content creation, genuine interactions, and community participation. Points are unlimited and serve as credentials for future airdrops — the more active and contributive you are, the higher your airdrop allocation.",
        subsections: [
          {
            heading: "General User Points Sources",
            items: [
              "Daily check-in: +1,000 points",
              "Likes given: +100 points each (daily cap)",
              "Comments posted: +100 points each (first 10 valid, daily cap)",
              "Referral reward: 20% of invited users' daily points auto-credited to the referrer (no cap)",
            ],
          },
          {
            heading: "KOL Exclusive Points (KOLs do not earn regular check-in/like/comment points)",
            items: [
              "Each like on a post: +10 points; each comment: +10 points",
              "Every 1,000 post views: +50 points",
              "Referral reward: same as above",
            ],
          },
        ],
      },
      {
        heading: "Energy System (Posting Fuel)",
        intro:
          "Energy is the core resource for posting and increasing visibility. Currently granted upon identity approval; in the future it will be provided or exchanged via tokens.",
        items: [
          "1,000 energy granted automatically upon identity approval (welcome package).",
          "Each post costs 1 energy, regardless of content type.",
          "Daily post cap: 10 posts/day (even with sufficient energy — prevents spam).",
          "Energy has a ceiling (current test cap: 100,000); unused energy decays 20% every 30 days (encouraging active use).",
          "Future token ($WBR) will serve as posting currency: earn/hold tokens → convert to energy → post, pin, boost, forming a platform economic loop.",
        ],
      },
      {
        heading: "Posting Rules (Full)",
        subsections: [
          {
            heading: "1. Identity Application & Energy Threshold",
            items: [
              "All users must first connect a wallet and apply for an identity.",
              "Choose one identity tag (only one allowed): Crypto Team, KOL (Key Opinion Leader), or Developer.",
              "Upon approval, the system automatically grants 1,000 energy.",
              "Each post costs 1 energy (no energy = cannot post; replenish via future token exchange).",
              "Daily post limit: max 10/day; resets the next day.",
            ],
          },
          {
            heading: "2. Post Tags & Auto-Routing",
            items: [
              "Select a content-type tag when posting (not your identity): Testnet Recruitment, IDO / Launchpad, Security Audit, Integration Announcement, Airdrop Plan, Funding / Hiring, Node Recruitment, Hackathon / Bug Bounty, Other.",
              "Crypto Team posts: automatically featured in the Elite Teams section on the homepage (one slot per team).",
              "KOL posts: automatically routed to the KOL Zone + KOL leaderboard (ranked by likes, comments, and views in real time).",
              "Developer posts: automatically routed to the Developer Column (vertical display for fast talent discovery, does not occupy the main homepage feed).",
            ],
          },
          {
            heading: "3. Content Moderation & Priority",
            items: [
              "Posts are published instantly with no manual review (decentralized principle).",
              "High-energy users can apply for pinning/boosting (consumes more energy for a longer or higher-placement pin).",
              "The platform retains a reporting/takedown mechanism (community governance or admin intervention for obvious scams/spam).",
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
        ],
      },
    ],
  },

  "de": {
    title: "Über die Plattform",
    subtitle:
      "Web3 Release ist eine dezentralisierte, community-getriebene Web3-Kollaborationsplattform — das All-in-One-Zentrum für Bedarfsveröffentlichung und Matching für Krypto-Teams. Über Wallet-Verbindung werden Krypto-Teams, KOLs und Entwickler effizient vernetzt.",
    coreConcept:
      "Kernkonzept: Bedarf verbinden, Innovation freisetzen. Krypto-Teams können jederzeit Anforderungen veröffentlichen; Blockchain-Nutzer (Entwickler, KOLs, Node-Betreiber usw.) können diese schnell entdecken und darauf reagieren.",
    sections: [
      {
        heading: "Hauptfunktionen",
        items: [
          "Pinned Zone: Zeigt Beiträge mit hoher Priorität mit einem Live-Countdown.",
          "Elite Teams: Projektliste nach Aktualität sortiert, mit verschiedenen Ansichtsmodi.",
          "Veröffentlichen & Matchen: Beiträge erscheinen sofort in der Homepage-Timeline.",
          "Einstiegspunkte: Wallet verbinden, Gilde beitreten / Jetzt beitreten.",
        ],
      },
      {
        heading: "Punktesystem (Kernanreiz)",
        intro:
          "Das Punktesystem belohnt qualitativ hochwertigen Content, echte Interaktionen und Community-Teilnahme. Punkte sind unbegrenzt und dienen als Nachweis für zukünftige Airdrops.",
        subsections: [
          {
            heading: "Punktequellen für normale Nutzer",
            items: [
              "Tägliches Einchecken: +1.000 Punkte",
              "Likes: +100 Punkte je Like (Tageslimit)",
              "Kommentare: +100 Punkte je Kommentar (erste 10 gültig, Tageslimit)",
              "Einladungsbonus: 20 % der täglichen Punkte der eingeladenen Nutzer für den Einlader (kein Limit)",
            ],
          },
          {
            heading: "KOL-exklusive Punkte",
            items: [
              "Je Like auf einen Beitrag: +10 Punkte; je Kommentar: +10 Punkte",
              "Alle 1.000 Aufrufe: +50 Punkte",
              "Einladungsbonus wie oben",
            ],
          },
        ],
      },
      {
        heading: "Energiesystem (Beitrags-Treibstoff)",
        intro: "Energie ist die Kernressource zum Veröffentlichen und zur Sichtbarkeitssteigerung.",
        items: [
          "Nach Identitätsgenehmigung werden automatisch 1.000 Energie vergeben.",
          "Jeder Beitrag kostet 1 Energie.",
          "Tägliches Beitragslimit: max. 10 Beiträge/Tag.",
          "Energie hat eine Obergrenze; ungenutzte Energie verfällt alle 30 Tage um 20 %.",
          "Zukünftiger Token ($WBR) dient als Posting-Währung.",
        ],
      },
      {
        heading: "Beitragsregeln",
        subsections: [
          {
            heading: "1. Identitätsantrag & Energieschwelle",
            items: [
              "Alle Nutzer müssen zuerst eine Wallet verbinden und eine Identität beantragen.",
              "Wähle eine Identitätskategorie: Krypto-Team, KOL oder Entwickler.",
              "Nach Genehmigung werden automatisch 1.000 Energie gewährt.",
              "Jeder Beitrag kostet 1 Energie; tägliches Limit: max. 10/Tag.",
            ],
          },
          {
            heading: "2. Beitrags-Tags & Auto-Routing",
            items: [
              "Wähle beim Veröffentlichen einen Inhaltstyp-Tag: Testnet, IDO/Launchpad, Sicherheitsaudit, Integration, Airdrop, Finanzierung, Nodes, Hackathon/Bug Bounty, Sonstiges.",
              "Krypto-Team-Beiträge: automatisch in der Elite-Teams-Sektion featured.",
              "KOL-Beiträge: automatisch in die KOL-Zone + Rangliste weitergeleitet.",
              "Entwickler-Beiträge: automatisch in die Entwickler-Spalte weitergeleitet.",
            ],
          },
          {
            heading: "3. Inhaltsmoderation & Priorität",
            items: [
              "Beiträge werden sofort ohne manuelle Prüfung veröffentlicht.",
              "Nutzer mit viel Energie können Pinning/Boosting beantragen.",
              "Die Plattform behält einen Melde-/Abnahmemechanismus für offensichtliche Betrügereien.",
            ],
          },
        ],
      },
      {
        heading: "Vision & gelöste Probleme",
        intro:
          "Web3 Release strebt danach, das Web3-'Twitter + LinkedIn + Gitcoin' zu werden — ein wirklich dezentralisierter, community-getriebener Kollaborations- und Veröffentlichungs-Hub.",
        subsections: [
          {
            heading: "Hauptprobleme",
            items: [
              "Hohe Kollaborationsreibung: Angebot und Nachfrage auf vielen Plattformen verstreut.",
              "Mangelndes Vertrauen: Schlechte Qualität und Betrug erschweren die Verifikation.",
              "Ungleiche Chancen: Entwickler/KOLs kämpfen um Sichtbarkeit.",
              "Informationsfragmentierung: Redundante Inhalte und minderwertige Kollaboration.",
              "Zentralisierungsabhängigkeit: Kleinere Teilnehmer sind auf Algorithmen oder bezahlte Werbung angewiesen.",
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
          "Точки входа: подключение кошелька, вступление в гильдию.",
        ],
      },
      {
        heading: "Система очков (ключевой стимул)",
        intro:
          "Встроенная система очков поощряет качественный контент, взаимодействие и участие в сообществе. Очки служат подтверждением для будущих аирдропов.",
        subsections: [
          {
            heading: "Источники очков для обычных пользователей",
            items: [
              "Ежедневный чек-ин: +1 000 очков",
              "Лайки: +100 очков за лайк (дневной лимит)",
              "Комментарии: +100 очков за комментарий (первые 10, дневной лимит)",
              "Реферальный бонус: 20 % ежедневных очков приглашённых пользователей (без лимита)",
            ],
          },
          {
            heading: "Эксклюзивные очки KOL",
            items: [
              "Лайк на запись: +10 очков; комментарий: +10 очков",
              "Каждые 1 000 просмотров: +50 очков",
              "Реферальный бонус аналогичен",
            ],
          },
        ],
      },
      {
        heading: "Система энергии (топливо для публикаций)",
        intro: "Энергия — основной ресурс для публикации и повышения видимости.",
        items: [
          "После одобрения личности автоматически выдаётся 1 000 энергии.",
          "Каждая публикация стоит 1 энергию.",
          "Дневной лимит публикаций: max 10 в день.",
          "Энергия имеет потолок; неиспользованная энергия убывает на 20 % каждые 30 дней.",
          "Будущий токен ($WBR) станет платёжным средством для публикаций.",
        ],
      },
      {
        heading: "Правила публикаций",
        subsections: [
          {
            heading: "1. Заявка на личность и порог энергии",
            items: [
              "Все пользователи должны подключить кошелёк и подать заявку на личность.",
              "Выберите одну категорию: крипто-команда, KOL или разработчик.",
              "После одобрения автоматически выдаётся 1 000 энергии; дневной лимит: 10 публикаций.",
            ],
          },
          {
            heading: "2. Теги и авто-маршрутизация",
            items: [
              "Выберите тег типа контента: тестнет, IDO/Launchpad, аудит, интеграция, аирдроп, финансирование, ноды, хакатон/баунти, прочее.",
              "Крипто-команды: контент попадает в Elite Teams на главной.",
              "KOL: запись попадает в зону KOL + рейтинг.",
              "Разработчики: запись попадает в колонку разработчиков.",
            ],
          },
          {
            heading: "3. Модерация и приоритет",
            items: [
              "Публикации выходят мгновенно без ручной модерации.",
              "Пользователи с высокой энергией могут закреплять/бустить записи.",
              "Платформа сохраняет механизм жалоб/удалений.",
            ],
          },
        ],
      },
      {
        heading: "Видение и решаемые проблемы",
        intro:
          "Web3 Release стремится стать Web3-аналогом «Twitter + LinkedIn + Gitcoin» — по-настоящему децентрализованным, управляемым сообществом центром коллаборации.",
        subsections: [
          {
            heading: "Ключевые проблемы",
            items: [
              "Высокое трение коллаборации: спрос и предложение рассредоточены по многим платформам.",
              "Недоверие: мошенничество и низкокачественные приглашения.",
              "Неравные возможности: разработчикам и KOL трудно получить видимость.",
              "Фрагментация информации: дублирование контента между цепочками.",
              "Зависимость от централизации: малые участники вынуждены полагаться на алгоритмы.",
            ],
          },
        ],
      },
    ],
  },

  "fr": {
    title: "À propos",
    subtitle:
      "Web3 Release est une plateforme de collaboration Web3 décentralisée et communautaire — le centre tout-en-un de publication de besoins et de mise en relation pour les équipes crypto. La vérification par wallet connecte efficacement équipes, KOL et développeurs.",
    coreConcept:
      "Concept central : connecter les besoins, libérer l'innovation. Les équipes crypto publient leurs besoins à tout moment et les utilisateurs blockchain y répondent rapidement.",
    sections: [
      {
        heading: "Fonctionnalités principales",
        items: [
          "Pinned Zone : met en avant les publications prioritaires avec un compte à rebours.",
          "Elite Teams : liste de projets triée par date avec plusieurs modes d'affichage.",
          "Publier & Matcher : les publications apparaissent immédiatement dans le fil de la page d'accueil.",
          "Points d'entrée : Connecter le wallet, Rejoindre la guilde / Rejoindre maintenant.",
        ],
      },
      {
        heading: "Système de points (incitation principale)",
        intro:
          "Le système de points intégré récompense la création de contenu de qualité, les interactions authentiques et la participation communautaire. Les points servent de preuve pour les futurs airdrops.",
        subsections: [
          {
            heading: "Sources de points pour les utilisateurs généraux",
            items: [
              "Check-in quotidien : +1 000 points",
              "Likes : +100 points par like (plafond quotidien)",
              "Commentaires : +100 points par commentaire (10 premiers valides, plafond quotidien)",
              "Bonus de parrainage : 20 % des points quotidiens des utilisateurs invités (sans plafond)",
            ],
          },
          {
            heading: "Points exclusifs KOL",
            items: [
              "Chaque like sur une publication : +10 points ; chaque commentaire : +10 points",
              "Toutes les 1 000 vues : +50 points",
              "Bonus de parrainage identique",
            ],
          },
        ],
      },
      {
        heading: "Système d'énergie (carburant de publication)",
        intro: "L'énergie est la ressource centrale pour publier et augmenter la visibilité.",
        items: [
          "1 000 énergie accordée automatiquement après approbation de l'identité.",
          "Chaque publication coûte 1 énergie.",
          "Plafond quotidien : max 10 publications/jour.",
          "L'énergie a un plafond ; l'énergie non utilisée décroît de 20 % tous les 30 jours.",
          "Le futur token ($WBR) servira de monnaie de publication.",
        ],
      },
      {
        heading: "Règles de publication",
        subsections: [
          {
            heading: "1. Demande d'identité et seuil d'énergie",
            items: [
              "Tous les utilisateurs doivent connecter un wallet et demander une identité.",
              "Choisissez une catégorie : Équipe crypto, KOL ou Développeur.",
              "Après approbation : 1 000 énergie ; limite quotidienne : 10 publications.",
            ],
          },
          {
            heading: "2. Tags et routage automatique",
            items: [
              "Choisissez un tag de type de contenu : Testnet, IDO/Launchpad, Audit, Intégration, Airdrop, Financement, Nœuds, Hackathon/Bug Bounty, Autre.",
              "Équipes crypto : le contenu apparaît dans Elite Teams sur la page d'accueil.",
              "KOL : publication routée vers la zone KOL + classement.",
              "Développeurs : publication routée vers la colonne Développeur.",
            ],
          },
          {
            heading: "3. Modération et priorité",
            items: [
              "Les publications sont instantanées, sans modération manuelle.",
              "Les utilisateurs à haute énergie peuvent épingler/booster leurs publications.",
              "La plateforme conserve un mécanisme de signalement/suppression.",
            ],
          },
        ],
      },
      {
        heading: "Vision et problèmes résolus",
        intro:
          "Web3 Release vise à devenir le « Twitter + LinkedIn + Gitcoin » du Web3 — un hub de collaboration vraiment décentralisé et communautaire.",
        subsections: [
          {
            heading: "Problèmes clés adressés",
            items: [
              "Forte friction de collaboration : offre et demande dispersées sur de nombreuses plateformes.",
              "Manque de confiance : invitations de mauvaise qualité et arnaques répandues.",
              "Opportunités inégales : les développeurs/KOL peinent à être visibles.",
              "Fragmentation de l'information : contenu redondant inter-chaînes.",
              "Dépendance à la centralisation : les petits participants dépendent des algorithmes.",
            ],
          },
        ],
      },
    ],
  },

  "ja": {
    title: "プラットフォームについて",
    subtitle:
      "Web3 Release は分散型・コミュニティ主導の Web3 コラボレーションプラットフォームです。ウォレット接続による本人確認を通じて、暗号チーム・KOL・開発者を効率的につなぎます。",
    coreConcept:
      "コアコンセプト：ニーズをつなぎ、イノベーションを解き放つ。暗号チームはいつでもニーズを投稿でき、ブロックチェーンユーザーが迅速に発見・応答できます。",
    sections: [
      {
        heading: "主な機能",
        items: [
          "Pinned Zone：優先度の高い投稿をカウントダウン付きで表示。",
          "Elite Teams：最新順のプロジェクト一覧、複数のビューモードをサポート。",
          "投稿 & マッチング：投稿後すぐにホームページのタイムラインに表示。",
          "エントリーポイント：ウォレット接続、ギルド加入 / 今すぐ加入。",
        ],
      },
      {
        heading: "ポイントシステム（コアインセンティブ）",
        intro:
          "組み込みのポイントシステムは、質の高いコンテンツ作成、真のインタラクション、コミュニティ参加を報酬します。ポイントは無制限で、将来のエアドロップの証明になります。",
        subsections: [
          {
            heading: "一般ユーザーのポイント源",
            items: [
              "毎日のチェックイン：+1,000 ポイント",
              "いいね：+100 ポイント/回（日次上限あり）",
              "コメント：+100 ポイント/件（最初の 10 件有効、日次上限あり）",
              "招待ボーナス：招待ユーザーの日次ポイントの 20% が自動付与（上限なし）",
            ],
          },
          {
            heading: "KOL 専用ポイント",
            items: [
              "投稿へのいいね 1 回：+10 ポイント；コメント 1 件：+10 ポイント",
              "1,000 回表示ごと：+50 ポイント",
              "招待ボーナスは同上",
            ],
          },
        ],
      },
      {
        heading: "エネルギーシステム（投稿の燃料）",
        intro: "エネルギーは投稿と可視性向上のコアリソースです。",
        items: [
          "身分承認後に 1,000 エネルギーが自動付与されます。",
          "投稿ごとに 1 エネルギーを消費します。",
          "1 日の投稿上限：最大 10 件/日。",
          "エネルギーには上限があり、未使用分は 30 日ごとに 20% 減衰します。",
          "将来のトークン（$WBR）が投稿通貨となります。",
        ],
      },
      {
        heading: "投稿ルール",
        subsections: [
          {
            heading: "1. 身分申請とエネルギー要件",
            items: [
              "全ユーザーはウォレットを接続し、身分を申請する必要があります。",
              "1 つの身分カテゴリを選択：暗号チーム・KOL・開発者。",
              "承認後に 1,000 エネルギーが付与。1 日最大 10 件まで投稿可能。",
            ],
          },
          {
            heading: "2. 投稿タグ & 自動ルーティング",
            items: [
              "コンテンツタイプタグを選択：テストネット、IDO/Launchpad、セキュリティ監査、統合、エアドロップ、資金調達、ノード、ハッカソン/バグバウンティ、その他。",
              "暗号チームの投稿：ホームページの Elite Teams に自動掲載。",
              "KOL の投稿：KOL ゾーン + ランキングに自動配信。",
              "開発者の投稿：開発者コラムに自動配信。",
            ],
          },
          {
            heading: "3. コンテンツモデレーションと優先度",
            items: [
              "投稿は即時公開、手動審査なし（分散型原則）。",
              "高エネルギーユーザーはピン留め/ブーストを申請可能。",
              "プラットフォームには報告/削除メカニズムが残されています。",
            ],
          },
        ],
      },
      {
        heading: "ビジョンと解決する問題",
        intro:
          "Web3 Release は Web3 時代の「Twitter + LinkedIn + Gitcoin」を目指します。信頼・追跡可能・十分なインセンティブの環境で、自由なコラボレーションを実現します。",
        subsections: [
          {
            heading: "解決する主な問題",
            items: [
              "高いコラボレーションの摩擦：需要と供給が多くのプラットフォームに分散。",
              "信頼の欠如：低品質な招待や詐欺が蔓延。",
              "機会の不平等：開発者/KOL は可視性を得るのが困難。",
              "情報の断片化：クロスチェーンの冗長コンテンツ。",
              "中央集権への依存：小規模参加者はアルゴリズムや有料プロモーションに頼る。",
            ],
          },
        ],
      },
    ],
  },

  "ko": {
    title: "플랫폼 소개",
    subtitle:
      "Web3 Release는 탈중앙화된 커뮤니티 기반 Web3 협업 플랫폼으로, 크립토 팀을 위한 올인원 수요 발행 및 매칭 센터입니다. 지갑 연결을 통한 실명 인증으로 크립토 팀, KOL, 개발자를 효율적으로 연결합니다.",
    coreConcept:
      "핵심 개념: 수요를 연결하고 혁신을 해방시킵니다. 크립토 팀은 언제든지 요구사항을 게시할 수 있고, 블록체인 사용자들이 빠르게 발견하고 응답할 수 있습니다.",
    sections: [
      {
        heading: "주요 기능",
        items: [
          "Pinned Zone: 우선순위가 높은 게시물을 카운트다운과 함께 표시.",
          "Elite Teams: 최신순으로 정렬된 프로젝트 목록, 다양한 보기 모드 지원.",
          "게시 & 매칭: 게시 후 즉시 홈페이지 타임라인에 표시.",
          "진입점: 지갑 연결, 길드 가입 / 지금 가입.",
        ],
      },
      {
        heading: "포인트 시스템 (핵심 인센티브)",
        intro:
          "내장된 포인트 시스템은 고품질 콘텐츠 제작, 진정한 상호작용, 커뮤니티 참여를 보상합니다. 포인트는 무제한이며 미래 에어드롭의 증빙으로 사용됩니다.",
        subsections: [
          {
            heading: "일반 사용자 포인트 출처",
            items: [
              "일일 체크인: +1,000 포인트",
              "좋아요: +100 포인트/회 (일일 한도)",
              "댓글: +100 포인트/건 (첫 10건 유효, 일일 한도)",
              "초대 보너스: 초대한 사용자 일일 포인트의 20% 자동 적립 (한도 없음)",
            ],
          },
          {
            heading: "KOL 전용 포인트",
            items: [
              "게시물 좋아요 1회: +10 포인트; 댓글 1건: +10 포인트",
              "1,000회 조회마다: +50 포인트",
              "초대 보너스 동일",
            ],
          },
        ],
      },
      {
        heading: "에너지 시스템 (게시 연료)",
        intro: "에너지는 게시 및 가시성 향상을 위한 핵심 자원입니다.",
        items: [
          "신분 승인 후 자동으로 1,000 에너지 지급.",
          "게시물당 1 에너지 소모.",
          "일일 게시 한도: 최대 10회/일.",
          "에너지에는 상한이 있으며, 미사용 에너지는 30일마다 20% 감소.",
          "향후 토큰($WBR)이 게시 통화로 사용됩니다.",
        ],
      },
      {
        heading: "게시 규칙",
        subsections: [
          {
            heading: "1. 신분 신청 및 에너지 요건",
            items: [
              "모든 사용자는 지갑 연결 후 신분을 신청해야 합니다.",
              "하나의 신분 카테고리 선택: 크립토 팀, KOL, 개발자.",
              "승인 후 1,000 에너지 자동 지급; 일일 최대 10회 게시 가능.",
            ],
          },
          {
            heading: "2. 게시물 태그 및 자동 라우팅",
            items: [
              "콘텐츠 유형 태그 선택: 테스트넷, IDO/런치패드, 보안 감사, 통합, 에어드롭, 자금 조달, 노드, 해커톤/버그 바운티, 기타.",
              "크립토 팀 게시물: 홈페이지 Elite Teams에 자동 노출.",
              "KOL 게시물: KOL 구역 + 리더보드에 자동 배치.",
              "개발자 게시물: 개발자 컬럼에 자동 배치.",
            ],
          },
          {
            heading: "3. 콘텐츠 모더레이션 및 우선순위",
            items: [
              "게시물은 수동 검토 없이 즉시 게시됩니다 (탈중앙화 원칙).",
              "에너지가 높은 사용자는 핀/부스트 신청 가능.",
              "플랫폼은 신고/삭제 메커니즘을 유지합니다.",
            ],
          },
        ],
      },
      {
        heading: "비전 및 해결하는 문제",
        intro:
          "Web3 Release는 Web3 시대의 'Twitter + LinkedIn + Gitcoin'이 되기를 목표로 합니다 — 진정한 탈중앙화, 커뮤니티 주도의 협업 허브.",
        subsections: [
          {
            heading: "주요 해결 문제",
            items: [
              "높은 협업 마찰: 수요와 공급이 여러 플랫폼에 분산.",
              "신뢰 부족: 저품질 초대 및 사기 만연.",
              "불평등한 기회: 개발자/KOL의 가시성 확보 어려움.",
              "정보 파편화: 크로스체인 중복 콘텐츠.",
              "중앙화 의존: 소규모 참여자는 알고리즘이나 유료 홍보에 의존.",
            ],
          },
        ],
      },
    ],
  },

  "vi": {
    title: "Giới thiệu nền tảng",
    subtitle:
      "Web3 Release là nền tảng cộng tác Web3 phi tập trung, do cộng đồng vận hành — trung tâm đăng tải nhu cầu và kết nối toàn diện cho các nhóm crypto. Xác thực danh tính qua ví giúp kết nối hiệu quả các nhóm, KOL và nhà phát triển.",
    coreConcept:
      "Khái niệm cốt lõi: Kết nối nhu cầu, giải phóng sáng tạo. Các nhóm crypto có thể đăng yêu cầu bất cứ lúc nào và người dùng blockchain nhanh chóng phát hiện và phản hồi.",
    sections: [
      {
        heading: "Tính năng chính",
        items: [
          "Pinned Zone: Hiển thị bài đăng ưu tiên cao với đồng hồ đếm ngược.",
          "Elite Teams: Danh sách dự án được sắp xếp theo mới nhất, hỗ trợ nhiều chế độ xem.",
          "Đăng & Kết nối: Bài đăng xuất hiện ngay trên timeline trang chủ.",
          "Điểm vào: Kết nối ví, Tham gia Hội / Tham gia ngay.",
        ],
      },
      {
        heading: "Hệ thống điểm (Khuyến khích cốt lõi)",
        intro:
          "Hệ thống điểm tích hợp thưởng cho nội dung chất lượng, tương tác thực và tham gia cộng đồng. Điểm không giới hạn và là bằng chứng cho các airdrop trong tương lai.",
        subsections: [
          {
            heading: "Nguồn điểm cho người dùng thông thường",
            items: [
              "Điểm danh hàng ngày: +1.000 điểm",
              "Lượt thích: +100 điểm/lần (giới hạn ngày)",
              "Bình luận: +100 điểm/bình luận (10 bình luận đầu hợp lệ, giới hạn ngày)",
              "Thưởng giới thiệu: 20% điểm ngày của người được mời tự động cộng vào người giới thiệu (không giới hạn)",
            ],
          },
          {
            heading: "Điểm độc quyền KOL",
            items: [
              "Mỗi lượt thích bài đăng: +10 điểm; mỗi bình luận: +10 điểm",
              "Mỗi 1.000 lượt xem: +50 điểm",
              "Thưởng giới thiệu tương tự",
            ],
          },
        ],
      },
      {
        heading: "Hệ thống năng lượng (Nhiên liệu đăng bài)",
        intro: "Năng lượng là tài nguyên cốt lõi để đăng bài và tăng khả năng hiển thị.",
        items: [
          "1.000 năng lượng tự động cấp sau khi danh tính được phê duyệt.",
          "Mỗi bài đăng tiêu tốn 1 năng lượng.",
          "Giới hạn đăng bài hàng ngày: tối đa 10 bài/ngày.",
          "Năng lượng có giới hạn tối đa; năng lượng không dùng giảm 20% mỗi 30 ngày.",
          "Token trong tương lai ($WBR) sẽ là tiền tệ đăng bài.",
        ],
      },
      {
        heading: "Quy tắc đăng bài",
        subsections: [
          {
            heading: "1. Đăng ký danh tính & ngưỡng năng lượng",
            items: [
              "Tất cả người dùng cần kết nối ví và đăng ký danh tính.",
              "Chọn một danh mục: Nhóm Crypto, KOL hoặc Nhà phát triển.",
              "Sau khi phê duyệt: 1.000 năng lượng; giới hạn 10 bài/ngày.",
            ],
          },
          {
            heading: "2. Thẻ bài đăng & định tuyến tự động",
            items: [
              "Chọn thẻ loại nội dung: Testnet, IDO/Launchpad, Kiểm toán, Tích hợp, Airdrop, Tài trợ, Node, Hackathon/Bug Bounty, Khác.",
              "Bài của nhóm Crypto: tự động hiển thị trong Elite Teams trên trang chủ.",
              "Bài của KOL: tự động chuyển đến Vùng KOL + bảng xếp hạng.",
              "Bài của Nhà phát triển: tự động chuyển đến Cột Nhà phát triển.",
            ],
          },
          {
            heading: "3. Kiểm duyệt nội dung & ưu tiên",
            items: [
              "Bài đăng được phát hành ngay lập tức, không cần kiểm duyệt thủ công.",
              "Người dùng năng lượng cao có thể đăng ký ghim/boost.",
              "Nền tảng giữ lại cơ chế báo cáo/gỡ xuống.",
            ],
          },
        ],
      },
      {
        heading: "Tầm nhìn & Vấn đề giải quyết",
        intro:
          "Web3 Release hướng tới trở thành 'Twitter + LinkedIn + Gitcoin' của Web3 — một trung tâm cộng tác phi tập trung thực sự, do cộng đồng dẫn dắt.",
        subsections: [
          {
            heading: "Vấn đề chính được giải quyết",
            items: [
              "Ma sát cộng tác cao: cung và cầu phân tán trên nhiều nền tảng.",
              "Thiếu tin tưởng: lời mời kém chất lượng và lừa đảo tràn lan.",
              "Cơ hội không bình đẳng: nhà phát triển/KOL khó được nhìn thấy.",
              "Thông tin phân mảnh: nội dung trùng lặp xuyên chuỗi.",
              "Phụ thuộc tập trung: người tham gia nhỏ phụ thuộc vào thuật toán hoặc quảng cáo trả phí.",
            ],
          },
        ],
      },
    ],
  },
};
