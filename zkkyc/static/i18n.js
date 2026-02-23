// ── i18n.js — Language switching for zkKYC demo ──

const I18N = {
  zh: {
    // Global nav
    'nav.tech': '🔐 技术视角',
    'nav.user': '👤 用户视角',
    'nav.biz': '💼 商业视角',

    // index.html - Header
    'header.title': '🔐 zkKYC 演示',
    'header.subtitle': '零知识 KYC 凭证系统 — 链上 P2P 交易隐私合规方案',
    'header.switch-view': '👤 切换到用户视角',
    'header.issuer': '发行方',
    'header.user': '用户',
    'header.proof': '证明',
    'header.biz-view': '💼 商业视角',
    'header.creds': '凭证数: ',
    'header.verifs': '验证数: ',

    // Step buttons
    'step.1': '① 发行方初始化',
    'step.2': '② KYC & 凭证签发',
    'step.3': '③ P2P 交易请求',
    'step.4': '④ 生成 ZK 证明',
    'step.5': '⑤ 验证证明',
    'step.6': '⑥ 凭证撤销',
    'step.7': '⑦ 不可关联性',

    // Step 1
    's1.title': '🏛️ 初始化发行方',
    's1.badge': '第 1 步 / 共 7 步',
    's1.desc': '发行方（如 Binance）建立去中心化身份和密码学密钥。这是一次性的信任锚点设置。',
    's1.btn': '🚀 初始化 Binance 为发行方',
    's1.exp.title': '📖 技术解析',
    's1.exp.heading': '第一步：发行方初始化',
    's1.exp.desc': '在签发任何 KYC 凭证之前，发行方需要通过 DID（去中心化标识符）在区块链上建立身份。',
    's1.exp.technical': `点击"初始化"后会发生什么：

1. 生成 ECDSA P-256 椭圆曲线密钥对（私钥 + 公钥）
2. 从公钥哈希推导出 DID 标识符
3. 创建 W3C DID 文档（去中心化身份文档）
4. 将公钥注册到链上注册表

公钥被公开发布，任何人都可以用它来验证
该发行方签发的凭证。`,
    's1.exp.summary': '一句话总结：Binance 生成了一把密码学钥匙，用它推导出一个全球唯一的身份ID，写了一份标准化的身份文档，然后把公钥发布到区块链上 —— 从此任何人都可以独立验证 Binance 签发的凭证，不需要联系 Binance。',
    's1.exp.next': '👉 点击按钮开始演示',

    // Step 2
    's2.title': '📋 提交 KYC 并获取凭证',
    's2.badge': '第 2 步 / 共 7 步',
    's2.label.name': '姓名',
    's2.label.country': '国家代码',
    's2.label.id': '证件号码',
    's2.label.level': 'KYC 等级',
    's2.level.1': '等级 1 — 基础认证',
    's2.level.2': '等级 2 — 增强认证',
    's2.level.3': '等级 3 — 机构级认证',
    's2.btn': '📜 完成 KYC 并签发凭证',
    's2.exp.title': '📖 技术解析',
    's2.exp.heading': '第二步：KYC 与凭证签发',
    's2.exp.desc': '用户向发行方提交 KYC 信息。验证通过后，发行方创建一份用 BBS+ 签名的 W3C 可验证凭证。',
    's2.exp.technical': `KYC 过程中发生了什么：

1. 用户提交个人信息（姓名、国籍、证件号）
2. 发行方验证身份（本演示中为模拟）
3. 为用户生成独立的 DID（与链上地址无关）
4. 创建包含 KYC 认证的可验证凭证（VC）
5. 用 BBS+ 签名对所有字段签名
6. 将凭证加入 Merkle 树（有效集合）
7. 用户将凭证存储在本地设备

⚠️ 完成后，用户的个人信息仅存储在自己的
设备上，不会上链，也不会留在发行方。`,
    's2.exp.next': '👉 填写表单并签发凭证',

    // Step 3
    's3.title': '🤝 P2P 交易请求',
    's3.badge': '第 3 步 / 共 7 步',
    's3.alice': '👩 Alice（持有方）',
    's3.alice.did': 'DID: 尚未创建',
    's3.alice.status': '✅ 已持有 KYC 凭证',
    's3.bob': '👨 Bob（验证方）',
    's3.bob.status': '⚠️ 需要对方的 KYC 证明',
    's3.desc.bob': 'Bob',
    's3.desc': ' 想向 Alice 转账 10 ETH，但需要先确认她通过了知名机构的 KYC 认证。Bob 生成一个随机挑战 nonce：',
    's3.nonce.btn': '🎲 新随机数',
    's3.next.btn': '➡️ 进入证明生成',
    's3.exp.title': '📖 技术解析',
    's3.exp.heading': '第三步：P2P 交易场景',
    's3.exp.desc': '双方要在链上做 P2P 转账。双方都没有链上 KYC，但 Bob 需要确认 Alice 的合规状态。',
    's3.exp.technical': `挑战-响应协议：

1. Bob 想和 Alice 进行交易
2. Bob 要求："请证明你通过了 KYC"
3. Bob 生成一个随机数 NONCE（挑战值）
4. Bob 将 nonce 发送给 Alice

为什么要用新的随机数？
→ 防止重放攻击（重复使用旧证明）
→ 保证不可关联性（每次证明都是唯一的）
→ 证明这个证明是"现在"生成的，不是昨天的

这类似于 HTTPS 握手的工作原理 ——
一个新的随机值确保响应是实时生成的。`,
    's3.exp.next': '👉 生成随机数，然后进入证明生成步骤',

    // Step 4
    's4.title': '🔐 生成零知识证明',
    's4.badge': '第 4 步 / 共 7 步',
    's4.desc': 'Alice 将在不暴露身份的前提下，证明自己通过了 KYC。选择要披露的字段：',
    's4.field.kyc': 'KYC等级',
    's4.field.sanction': '制裁清单',
    's4.field.aml': '反洗钱检查',
    's4.field.country': '国家风险',
    's4.field.name': '姓名',
    's4.field.nationality': '国籍',
    's4.field.id': '证件号码',
    's4.field.did': 'DID 标识',
    's4.disclosed': '（披露）',
    's4.hidden': '（隐藏）',
    's4.btn': '🔐 生成零知识证明',
    's4.exp.title': '📖 技术解析',
    's4.exp.heading': '第四步：零知识证明生成',
    's4.exp.technical': `Alice 的设备在本地执行以下操作：

1. 选择性披露（BBS+ 签名）
   → 披露：KYC等级、制裁状态、反洗钱、国家风险
   → 隐藏：姓名、国籍、证件号、DID
   → 证明：隐藏字段确实被发行方签名过

2. Merkle 成员证明（非撤销证明）
   → 证明凭证在有效集合中
   → 不暴露是哪个凭证

3. Nullifier（消零器）生成
   → Nullifier = Hash(凭证密钥 || Bob的nonce)
   → 每次交互唯一，防止重放
   → 无法与其他证明关联

4. 过期检查
   → 证明凭证未过期
   → 不暴露具体过期日期

生成的证明约 2KB，不含任何个人信息，
任何人都可用发行方公钥验证。`,
    's4.privacy': '🔒 <strong>隐私保证：</strong>该证明在数学上保证验证方除了被披露的字段外，不会获取任何其他信息。即使是发行方也无法将此证明与原始凭证签发关联起来。',

    // Step 5
    's5.title': '🔍 Bob 的完整验证流程',
    's5.badge': '第 5 步 / 共 7 步',
    's5.vt0.title': '第零步：从链上获取信任锚点',
    's5.vt0.desc': 'Bob 自己从链上合约读取数据，不依赖 Alice，Alice 无法伪造',
    's5.vt0.note': '💡 <strong>关键：</strong>Merkle 根和公钥都来自链上合约，是公开数据。Bob 自己读链，不需要问 Alice 或 Binance。这就是 trustless 的含义。',
    's5.vt1.title': '第一步：验证 BBS+ 签名',
    's5.vt1.desc': '发行方真的签了这些字段吗？',
    's5.vt1.note': '📌 隐藏字段（姓名、证件号等）的 <strong>承诺值</strong> 也在签名里，所以 Bob 能确认"有些字段被签了，但我看不到内容"。这就是 BBS+ 选择性披露的核心。',
    's5.vt2.title': '第二步：验证 Merkle 证明（凭证没被撤销？）',
    's5.vt2.desc': '凭证是否仍在有效集合中',
    's5.vt2.note': '🌿 Bob 不知道 credential_id 是什么，只知道"链上有效集合中存在某个凭证，它的 Merkle 路径能算出正确的根"。如果凭证被撤销，根会变，路径算不出来。',
    's5.vt3.title': '第三步：检查 Nullifier（防重放）',
    's5.vt3.desc': '这个证明之前用过吗？',
    's5.vt3.note': '🔄 Nullifier = Hash(凭证密钥 || Bob的nonce)。因为 nonce 是 Bob 随机生成的，Alice 无法预先准备。同一凭证 + 不同 nonce = 不同 nullifier = 不可关联。',
    's5.vt4.title': '第四步：检查业务合规字段',
    's5.vt4.desc': '从已验证的披露字段中读取合规状态',
    's5.vt4.note': '✅ 这些值已通过第一步的签名验证确认是真实的（发行方签过的），Alice 无法伪造。Bob 看到的只是合规结果，看不到任何个人信息。',
    's5.vt5.title': '第五步：过期检查',
    's5.vt5.desc': '凭证是否仍在有效期内',
    's5.status.wait': '⏳ 等待执行',
    's5.btn': '🔍 开始逐步验证（以 Bob 身份）',
    's5.bob.knows': '✅ Bob 知道的',
    's5.bob.knows.list': '• Alice 通过了某大机构的 KYC<br>• Alice 不在制裁名单<br>• Alice 反洗钱检查已通过<br>• Alice 所在国家风险低<br>• 凭证未过期、未被撤销',
    's5.bob.unknown': '❌ Bob 不知道的',
    's5.bob.unknown.list': '• Alice 叫什么名字<br>• Alice 是哪国人<br>• Alice 的证件号码<br>• 是 Binance 还是 Coinbase 签发的<br>• Alice 的其他链上交易记录',
    's5.exp.title': '📖 技术解析',
    's5.exp.heading': '第五步：Bob 的验证流程',
    's5.exp.technical': `核心设计：Bob 的信任不来自 Alice，而来自链上数据

┌──────────────────────────────────┐
│  链上 Registry 合约（公开数据） │
│  ┌────────────────────────────┐ │
│  │ issuer_pubkey: 0x4a7c...  │ │
│  │ merkle_root:   0xf3b1...  │ │
│  │ last_updated:  1740100000 │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
         ▲ Bob 自己读链
         │
    ┌────┴────┐
    │  Bob    │ ← 只信任链上数据
    └────┬────┘
         │ 用链上数据验证 Alice 的 proof
         ▼
    ┌─────────┐
    │  Alice  │ ← 只提供 proof，无法伪造
    └─────────┘

❓ 常见问题：

Q: Alice 每次生成新证明，Merkle 根会变吗？
A: 不会！Merkle 根只在凭证签发/撤销时变。
   生成证明是 Alice 本地操作，不影响 Merkle 树。

Q: Merkle 根从哪来？
A: 链上合约公开存储，任何人可读。
   Binance 每次签发/撤销时更新合约。

Q: Bob 需要联系 Binance 吗？
A: 不需要。Bob 只需要读链上合约。
   这就是"去中心化验证"的含义。`,

    // Step 6
    's6.title': '🚫 凭证撤销',
    's6.badge': '第 6 步 / 共 7 步',
    's6.desc': '模拟 Alice 被加入制裁名单的场景。发行方撤销她的凭证，但不会公开暴露她的身份。',
    's6.btn': '🚫 撤销 Alice 的凭证',
    's6.test.desc': '现在尝试用被撤销的凭证生成并验证新的证明：',
    's6.test.btn': '🔄 测试已撤销凭证',
    's6.exp.title': '📖 技术解析',
    's6.exp.heading': '第六步：撤销演示',
    's6.exp.technical': `撤销机制的工作原理：

1. 发行方撤销凭证
   → 从 Merkle 树中移除该凭证
   → Merkle 根发生变化

2. 链上更新
   → 新的 Merkle 根被发布
   → 旧的证明自动失效

3. 隐私得到保护
   → Merkle 树不会暴露哪个叶子被移除了
   → 其他用户的凭证仍然有效
   → 只有被撤销用户的证明会失败

4. 接下来会发生什么
   → Alice 仍然可以生成证明（她还有凭证）
   → 但验证会失败，因为：
     - 她的凭证不再在 Merkle 树中
     - Merkle 成员证明与新根不匹配

这是相比黑名单的关键优势：
可以撤销某人的凭证而不公开其身份。`,

    // Step 7
    's7.title': '🔗 不可关联性演示',
    's7.badge': '第 7 步 / 共 7 步',
    's7.desc': '首先创建第二个用户来演示不可关联性（因为 Alice 已被撤销）。',
    's7.user2.btn': '👤 创建用户 Charlie',
    's7.demo.desc': '用同一凭证生成 3 次证明，每次使用不同的 nonce。观察：它们看起来完全不同，无法被关联！',
    's7.btn': '🔗 生成 3 个不可关联的证明',
    's7.exp.title': '📖 技术解析',
    's7.exp.heading': '第七步：不可关联性',
    's7.exp.technical': `为什么证明无法被关联：

NULLIFIER 设计：
  Nullifier = Hash(凭证密钥 || 验证方随机数)

由于每个验证方提供不同的随机 nonce：
→ Nullifier 每次都不同
→ 证明结构也会变化（盲因子重新随机化）
→ 观察者无法关联多次证明

对比：

传统 KYC：
  向 3 个商家出示护照 →
  3 个商家都知道你是同一个人 ❌

zkKYC：
  向 3 个商家出示 ZK 证明 →
  每个商家看到的是独立的证明 ✅
  无法判断是否为同一人

这对 P2P 交易至关重要：
→ 商家 A 无法与商家 B 串通追踪你
→ 即使发行方也无法追溯哪个证明是你的
→ 你的交易隐私得到完全保护`,

    // Reset
    'reset.btn': '🔄 重置演示',

    // business.html
    'biz.title': '💼 zkKYC 商业分析',
    'biz.subtitle': '业务模型 · 利益分析 · 风险评估',
    'biz.back.tech': '🔐 技术视角',
    'biz.back.user': '👤 用户视角',
    'biz.toc.players': '🎯 玩家利益',
    'biz.toc.revenue': '💰 收入模型',
    'biz.toc.risks': '⚠️ 风险分析',
    'biz.toc.insights': '🧠 关键判断',
    'biz.players.title': '🎯 玩家利益图谱',
    'biz.p1.name': '发行方（Binance / Coinbase 等交易所）',
    'biz.p1.b1': '💰 新收入源：KYC 凭证签发收费（一次性 or 年费），撤销/更新也可收费',
    'biz.p1.b2': '🏆 品牌溢价：成为链上信任锚点，"Binance Verified" 变成行业标准',
    'biz.p1.b3': '📊 数据优势：不存用户数据，但掌握签发量、撤销率等宏观数据',
    'biz.p1.b4': '🔗 生态锁定：用户依赖凭证，迁移成本高',
    'biz.p2.name': '用户 / 持有方（Alice）',
    'biz.p2.b1': '🔒 隐私保护：P2P 交易不用每次出示护照，个人信息零泄露',
    'biz.p2.b2': '⚡ 便捷性：一次 KYC，到处使用，不用重复认证',
    'biz.p2.b3': '💪 数据主权：凭证存本地，自己控制披露什么',
    'biz.p2.b4': '🌍 跨平台通用：一个凭证在多个 DEX / P2P 平台使用',
    'biz.p3.name': '验证方 / 交易对手（Bob）',
    'biz.p3.b1': '✅ 合规保障：确认对方 KYC 合规，降低法律风险',
    'biz.p3.b2': '🚫 无数据负担：不持有对方个人信息 = 不承担数据泄露责任',
    'biz.p3.b3': '⏱️ 即时验证：无需联系第三方，链上读数据自主验证',
    'biz.p4.name': 'P2P 平台 / DEX',
    'biz.p4.b1': '📋 合规达标：满足监管要求但不碰用户隐私数据',
    'biz.p4.b2': '💰 降低成本：不需自建 KYC 系统，接 SDK 即可',
    'biz.p4.b3': '👥 吸引用户：隐私友好 = 竞争优势',
    'biz.p5.name': '监管机构',
    'biz.p5.b1': '🔍 可控撤销：发现问题可要求发行方撤销凭证，立即全网失效',
    'biz.p5.b2': '📊 宏观监控：链上凭证签发/撤销趋势可见',
    'biz.p5.b3': '⚖️ 平衡点：隐私保护 vs 反洗钱的技术折中方案',
    'biz.revenue.title': '💰 收入模型',
    'biz.revenue.box': '发行方 → 用户：凭证签发费（$5-50/次）\n发行方 → 平台：SDK 授权 / API 调用费\n平台 → 用户：交易手续费（含验证成本）\n发行方 → 发行方：跨机构凭证互认费',
    'biz.revenue.entry': '🎯 最可能的切入点',
    'biz.revenue.entry.desc': 'Binance 作为首个发行方，在自己的 P2P 平台先跑通，然后开放给外部 DEX。已有 Proof of Reserves (PoR) 的零知识证明经验，技术和品牌基础最成熟。',
    'biz.risks.title': '⚠️ 风险分析',
    'biz.risks.high': '🔴 高风险',
    'biz.risks.mid': '🟡 中风险',
    'biz.risks.low': '🟢 低风险但需关注',
    'biz.risks.th.risk': '风险',
    'biz.risks.th.desc': '说明',
    'biz.risks.th.mitigation': '应对',
    'biz.r1.name': '监管不认可',
    'biz.r1.desc': '各国监管可能不接受 ZK 证明作为合规手段，要求能看到真实身份',
    'biz.r1.fix': '设计"执法后门"：法院命令下发行方可配合披露',
    'biz.r2.name': '发行方中心化',
    'biz.r2.desc': '签发权集中在少数交易所，可以拒签或任意撤销',
    'biz.r2.fix': '多发行方竞争 + DAO 治理撤销流程',
    'biz.r3.name': '密钥丢失',
    'biz.r3.desc': '用户设备丢失/损坏 = 凭证丢失，需重新 KYC',
    'biz.r3.fix': '加密备份到云端 / 社交恢复机制',
    'biz.r4.name': '凭证过期管理',
    'biz.r4.desc': '大量用户同时过期造成续签拥堵',
    'biz.r4.fix': '滚动过期 + 提前自动续签',
    'biz.r5.name': 'Merkle 树膨胀',
    'biz.r5.desc': '用户量大时链上更新成本高',
    'biz.r5.fix': '批量更新 + L2 Rollup',
    'biz.r6.name': '串谋攻击',
    'biz.r6.desc': '多个验证方联合分析时间戳等元数据尝试关联',
    'biz.r6.fix': '随机延迟 + 混淆提交时间',
    'biz.r7.name': '凭证转让/买卖',
    'biz.r7.desc': '用户把凭证卖给未认证的人',
    'biz.r7.fix': '绑定设备密钥 + 生物特征绑定',
    'biz.r8.name': '用户教育成本',
    'biz.r8.desc': 'ZK 概念对普通用户太抽象，需要极简 UX',
    'biz.r9.name': '跨链互操作',
    'biz.r9.desc': '不同链上的 Registry 合约需要同步',
    'biz.r10.name': '量子计算威胁',
    'biz.r10.desc': 'ECDSA / BBS+ 长期来看需升级到抗量子算法',
    'biz.insights.title': '🧠 关键判断',
    'biz.insights.prereq.title': '模式跑通的前提条件',
    'biz.insights.prereq.desc': '1. 至少一个大交易所愿意当发行方 — Binance 最有动力（已有 PoR 经验）\n2. 监管态度 — 至少不反对，最好是鼓励（欧盟 eIDAS 2.0 方向是利好的）\n3. 用户量临界点 — 需要足够多的人持有凭证，验证方才愿意接入',
    'biz.insights.contradiction.title': '⚡ 最大的矛盾',
    'biz.insights.contradiction.quote': '监管想要"能查到人"，用户想要"查不到我"。zkKYC 的价值就是在这两者之间找平衡 —— 正常情况下保护隐私，执法需要时发行方可以配合。这本质上是个政治问题，不只是技术问题。',

    // user-demo.html
    'ud.title': '🔐 zkKYC 用户视角',
    'ud.switch': '📖 技术视角 →',
    'ud.mode.wallet': '📱 方案A：钱包对钱包',
    'ud.mode.platform': '🌐 方案B：P2P 平台',
    'ud.mode.manual': '💻 方案C：手动验证',
    'ud.mode.wallet.desc': 'Alice 和 Bob 通过钱包直接 P2P 交易，SDK 自动完成验证',
    'ud.mode.platform.desc': 'Bob 在 P2P 交易平台上下单，平台自动请求并验证 Alice 的 KYC 证明',
    'ud.mode.manual.desc': '类似 Binance PoS — Bob 下载开源工具，在本地终端手动验证 Alice 的证明',
    'ud.biz': '💼 商业视角',
    'ud.narrative.default': '选择一个方案，点击开始',
    'ud.wallet.alice': 'Alice 的钱包',
    'ud.wallet.bob': 'Bob 的钱包',
    'ud.wallet.assets': '总资产',
    'ud.wallet.waiting': '等待开始...',
    'ud.wallet.start': '🚀 开始演示',
    'ud.platform.title': 'P2P 交易大厅',
    'ud.platform.loggedIn': '已登录：Bob (0xBob...7f3e)',
    'ud.platform.detail': '📋 交易详情',
    'ud.platform.type': '交易类型',
    'ud.platform.type.val': 'P2P 买入',
    'ud.platform.asset': '资产',
    'ud.platform.price': '单价',
    'ud.platform.total': '总价',
    'ud.platform.seller': '卖方',
    'ud.platform.kycStatus': '卖方 KYC 状态',
    'ud.platform.pending': '⏳ 待验证',
    'ud.platform.btn': '🔍 请求卖方 KYC 证明',
    'ud.manual.title': '💻 手动验证 zkKYC 证明',
    'ud.manual.desc': '类似 Binance Proof of Reserves — Bob 自行下载工具，本地验证 Alice 的证明',
    'ud.manual.btn': '▶️ 开始手动验证流程',
  },

  en: {
    // Global nav
    'nav.tech': '🔐 Technical',
    'nav.user': '👤 User View',
    'nav.biz': '💼 Business',

    // index.html - Header
    'header.title': '🔐 zkKYC Demo',
    'header.subtitle': 'Zero-Knowledge KYC Credential System — On-Chain P2P Privacy Compliance',
    'header.switch-view': '👤 Switch to User View',
    'header.issuer': 'Issuer',
    'header.user': 'User',
    'header.proof': 'Proof',
    'header.biz-view': '💼 Business View',
    'header.creds': 'Credentials: ',
    'header.verifs': 'Verifications: ',

    // Step buttons
    'step.1': '① Initialize Issuer',
    'step.2': '② KYC & Credential Issuance',
    'step.3': '③ P2P Trade Request',
    'step.4': '④ Generate ZK Proof',
    'step.5': '⑤ Verify Proof',
    'step.6': '⑥ Credential Revocation',
    'step.7': '⑦ Unlinkability',

    // Step 1
    's1.title': '🏛️ Initialize Issuer',
    's1.badge': 'Step 1 of 7',
    's1.desc': 'The issuer (e.g. Binance) establishes a decentralized identity and cryptographic keys. This is a one-time trust anchor setup.',
    's1.btn': '🚀 Initialize Binance as Issuer',
    's1.exp.title': '📖 Technical Explanation',
    's1.exp.heading': 'Step 1: Issuer Initialization',
    's1.exp.desc': 'Before issuing any KYC credentials, the issuer needs to establish an identity on the blockchain via a DID (Decentralized Identifier).',
    's1.exp.technical': `What happens when you click "Initialize":

1. Generate ECDSA P-256 elliptic curve key pair (private + public key)
2. Derive DID identifier from public key hash
3. Create W3C DID Document (Decentralized Identity Document)
4. Register public key on the on-chain registry

The public key is published openly — anyone can use it
to verify credentials issued by this issuer.`,
    's1.exp.summary': 'In a nutshell: Binance generates a cryptographic key pair, derives a globally unique identity ID from it, creates a standardized identity document, and publishes the public key on the blockchain — from then on, anyone can independently verify credentials issued by Binance, without ever contacting Binance.',
    's1.exp.next': '👉 Click the button to start the demo',

    // Step 2
    's2.title': '📋 Submit KYC & Get Credential',
    's2.badge': 'Step 2 of 7',
    's2.label.name': 'Name',
    's2.label.country': 'Country Code',
    's2.label.id': 'ID Number',
    's2.label.level': 'KYC Level',
    's2.level.1': 'Level 1 — Basic Verification',
    's2.level.2': 'Level 2 — Enhanced Verification',
    's2.level.3': 'Level 3 — Institutional Verification',
    's2.btn': '📜 Complete KYC & Issue Credential',
    's2.exp.title': '📖 Technical Explanation',
    's2.exp.heading': 'Step 2: KYC & Credential Issuance',
    's2.exp.desc': 'The user submits KYC information to the issuer. After verification, the issuer creates a W3C Verifiable Credential signed with BBS+.',
    's2.exp.technical': `What happens during KYC:

1. User submits personal information (name, nationality, ID number)
2. Issuer verifies identity (simulated in this demo)
3. Generate an independent DID for the user (unrelated to on-chain address)
4. Create a Verifiable Credential (VC) containing KYC attestation
5. Sign all fields with BBS+ signature
6. Add credential to Merkle tree (valid set)
7. User stores credential on local device

⚠️ After completion, the user's personal information is stored
only on their own device — never on-chain, never at the issuer.`,
    's2.exp.next': '👉 Fill in the form and issue the credential',

    // Step 3
    's3.title': '🤝 P2P Trade Request',
    's3.badge': 'Step 3 of 7',
    's3.alice': '👩 Alice (Holder)',
    's3.alice.did': 'DID: Not created yet',
    's3.alice.status': '✅ Holds KYC Credential',
    's3.bob': '👨 Bob (Verifier)',
    's3.bob.status': '⚠️ Needs counterparty KYC proof',
    's3.desc.bob': 'Bob',
    's3.desc': ' wants to transfer 10 ETH to Alice, but needs to confirm she passed KYC from a reputable institution. Bob generates a random challenge nonce:',
    's3.nonce.btn': '🎲 New Nonce',
    's3.next.btn': '➡️ Proceed to Proof Generation',
    's3.exp.title': '📖 Technical Explanation',
    's3.exp.heading': 'Step 3: P2P Trade Scenario',
    's3.exp.desc': 'Both parties want to do a P2P transfer on-chain. Neither has on-chain KYC, but Bob needs to confirm Alice\'s compliance status.',
    's3.exp.technical': `Challenge-Response Protocol:

1. Bob wants to trade with Alice
2. Bob requests: "Please prove you passed KYC"
3. Bob generates a random NONCE (challenge value)
4. Bob sends the nonce to Alice

Why use a fresh random number?
→ Prevent replay attacks (reusing old proofs)
→ Ensure unlinkability (each proof is unique)
→ Prove this proof was generated "now", not yesterday

This is similar to how HTTPS handshakes work —
a fresh random value ensures the response is generated in real-time.`,
    's3.exp.next': '👉 Generate a nonce, then proceed to proof generation',

    // Step 4
    's4.title': '🔐 Generate Zero-Knowledge Proof',
    's4.badge': 'Step 4 of 7',
    's4.desc': 'Alice will prove she passed KYC without revealing her identity. Select fields to disclose:',
    's4.field.kyc': 'KYC Level',
    's4.field.sanction': 'Sanctions List',
    's4.field.aml': 'AML Check',
    's4.field.country': 'Country Risk',
    's4.field.name': 'Name',
    's4.field.nationality': 'Nationality',
    's4.field.id': 'ID Number',
    's4.field.did': 'DID Identifier',
    's4.disclosed': '(Disclosed)',
    's4.hidden': '(Hidden)',
    's4.btn': '🔐 Generate Zero-Knowledge Proof',
    's4.exp.title': '📖 Technical Explanation',
    's4.exp.heading': 'Step 4: Zero-Knowledge Proof Generation',
    's4.exp.technical': `Alice's device performs the following locally:

1. Selective Disclosure (BBS+ Signature)
   → Disclose: KYC level, sanction status, AML, country risk
   → Hide: name, nationality, ID number, DID
   → Prove: hidden fields were indeed signed by the issuer

2. Merkle Membership Proof (Non-Revocation Proof)
   → Prove credential is in the valid set
   → Without revealing which credential

3. Nullifier Generation
   → Nullifier = Hash(credential_key || Bob's nonce)
   → Unique per interaction, prevents replay
   → Cannot be linked to other proofs

4. Expiration Check
   → Prove credential has not expired
   → Without revealing exact expiration date

The generated proof is ~2KB, contains no personal information,
and can be verified by anyone using the issuer's public key.`,
    's4.privacy': '🔒 <strong>Privacy Guarantee:</strong> This proof mathematically guarantees the verifier cannot learn anything beyond the disclosed fields. Even the issuer cannot link this proof back to the original credential issuance.',

    // Step 5
    's5.title': '🔍 Bob\'s Complete Verification Flow',
    's5.badge': 'Step 5 of 7',
    's5.vt0.title': 'Step 0: Fetch Trust Anchors from Chain',
    's5.vt0.desc': 'Bob reads data directly from the on-chain contract — no dependence on Alice, Alice cannot forge it',
    's5.vt0.note': '💡 <strong>Key Point:</strong> The Merkle root and public key both come from on-chain contracts — they are public data. Bob reads the chain himself, no need to ask Alice or Binance. This is what trustless means.',
    's5.vt1.title': 'Step 1: Verify BBS+ Signature',
    's5.vt1.desc': 'Did the issuer really sign these fields?',
    's5.vt1.note': '📌 The <strong>commitment values</strong> of hidden fields (name, ID, etc.) are also in the signature, so Bob can confirm "some fields were signed, but I can\'t see the content". This is the core of BBS+ selective disclosure.',
    's5.vt2.title': 'Step 2: Verify Merkle Proof (Not Revoked?)',
    's5.vt2.desc': 'Is the credential still in the valid set?',
    's5.vt2.note': '🌿 Bob doesn\'t know what credential_id is — he only knows "some credential in the valid set has a Merkle path that computes to the correct root". If revoked, the root changes and the path won\'t compute.',
    's5.vt3.title': 'Step 3: Check Nullifier (Anti-Replay)',
    's5.vt3.desc': 'Has this proof been used before?',
    's5.vt3.note': '🔄 Nullifier = Hash(credential_key || Bob\'s nonce). Since the nonce is randomly generated by Bob, Alice can\'t prepare in advance. Same credential + different nonce = different nullifier = unlinkable.',
    's5.vt4.title': 'Step 4: Check Business Compliance Fields',
    's5.vt4.desc': 'Read compliance status from verified disclosed fields',
    's5.vt4.note': '✅ These values have been confirmed authentic through Step 1\'s signature verification (signed by the issuer) — Alice cannot forge them. Bob only sees compliance results, no personal information.',
    's5.vt5.title': 'Step 5: Expiration Check',
    's5.vt5.desc': 'Is the credential still within its validity period?',
    's5.status.wait': '⏳ Waiting',
    's5.btn': '🔍 Start Step-by-Step Verification (as Bob)',
    's5.bob.knows': '✅ What Bob Knows',
    's5.bob.knows.list': '• Alice passed KYC at a major institution<br>• Alice is not on any sanctions list<br>• Alice passed AML checks<br>• Alice\'s country risk is low<br>• Credential is not expired or revoked',
    's5.bob.unknown': '❌ What Bob Does NOT Know',
    's5.bob.unknown.list': '• Alice\'s real name<br>• Alice\'s nationality<br>• Alice\'s ID number<br>• Whether it was Binance or Coinbase that issued it<br>• Alice\'s other on-chain transactions',
    's5.exp.title': '📖 Technical Explanation',
    's5.exp.heading': 'Step 5: Bob\'s Verification Flow',
    's5.exp.technical': `Core Design: Bob's trust comes from on-chain data, not Alice

┌──────────────────────────────────────┐
│  On-Chain Registry Contract (Public) │
│  ┌────────────────────────────────┐  │
│  │ issuer_pubkey: 0x4a7c...      │  │
│  │ merkle_root:   0xf3b1...      │  │
│  │ last_updated:  1740100000     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
         ▲ Bob reads chain himself
         │
    ┌────┴────┐
    │  Bob    │ ← Only trusts on-chain data
    └────┬────┘
         │ Verifies Alice's proof with on-chain data
         ▼
    ┌─────────┐
    │  Alice  │ ← Only provides proof, cannot forge
    └─────────┘

❓ FAQ:

Q: Does the Merkle root change each time Alice generates a new proof?
A: No! The Merkle root only changes on credential issuance/revocation.
   Proof generation is a local operation on Alice's device.

Q: Where does the Merkle root come from?
A: Publicly stored in the on-chain contract, readable by anyone.
   Binance updates the contract on each issuance/revocation.

Q: Does Bob need to contact Binance?
A: No. Bob only needs to read the on-chain contract.
   This is what "decentralized verification" means.`,

    // Step 6
    's6.title': '🚫 Credential Revocation',
    's6.badge': 'Step 6 of 7',
    's6.desc': 'Simulate a scenario where Alice is added to a sanctions list. The issuer revokes her credential without publicly exposing her identity.',
    's6.btn': '🚫 Revoke Alice\'s Credential',
    's6.test.desc': 'Now try generating and verifying a new proof with the revoked credential:',
    's6.test.btn': '🔄 Test Revoked Credential',
    's6.exp.title': '📖 Technical Explanation',
    's6.exp.heading': 'Step 6: Revocation Demo',
    's6.exp.technical': `How the revocation mechanism works:

1. Issuer revokes credential
   → Remove credential from Merkle tree
   → Merkle root changes

2. On-chain update
   → New Merkle root is published
   → Old proofs automatically become invalid

3. Privacy is preserved
   → Merkle tree doesn't reveal which leaf was removed
   → Other users' credentials remain valid
   → Only the revoked user's proofs will fail

4. What happens next
   → Alice can still generate proofs (she still has the credential)
   → But verification will fail because:
     - Her credential is no longer in the Merkle tree
     - Merkle membership proof won't match the new root

This is the key advantage over blacklists:
You can revoke someone's credential without revealing their identity.`,

    // Step 7
    's7.title': '🔗 Unlinkability Demo',
    's7.badge': 'Step 7 of 7',
    's7.desc': 'First, create a second user to demo unlinkability (since Alice was revoked).',
    's7.user2.btn': '👤 Create User Charlie',
    's7.demo.desc': 'Generate 3 proofs with the same credential, each with a different nonce. Observe: they look completely different and cannot be linked!',
    's7.btn': '🔗 Generate 3 Unlinkable Proofs',
    's7.exp.title': '📖 Technical Explanation',
    's7.exp.heading': 'Step 7: Unlinkability',
    's7.exp.technical': `Why proofs cannot be linked:

NULLIFIER DESIGN:
  Nullifier = Hash(credential_key || verifier_nonce)

Since each verifier provides a different random nonce:
→ Nullifier is different every time
→ Proof structure also changes (blinding factors re-randomized)
→ Observers cannot link multiple proofs

Comparison:

Traditional KYC:
  Show passport to 3 merchants →
  All 3 merchants know you're the same person ❌

zkKYC:
  Show ZK proof to 3 merchants →
  Each merchant sees an independent proof ✅
  Cannot determine if it's the same person

This is critical for P2P trading:
→ Merchant A cannot collude with Merchant B to track you
→ Even the issuer cannot trace which proof is yours
→ Your transaction privacy is fully protected`,

    // Reset
    'reset.btn': '🔄 Reset Demo',

    // business.html
    'biz.title': '💼 zkKYC Business Analysis',
    'biz.subtitle': 'Business Model · Stakeholder Benefits · Risk Assessment',
    'biz.back.tech': '🔐 Technical View',
    'biz.back.user': '👤 User View',
    'biz.toc.players': '🎯 Stakeholders',
    'biz.toc.revenue': '💰 Revenue Model',
    'biz.toc.risks': '⚠️ Risk Analysis',
    'biz.toc.insights': '🧠 Key Insights',
    'biz.players.title': '🎯 Stakeholder Benefits Map',
    'biz.p1.name': 'Issuer (Binance / Coinbase / Exchanges)',
    'biz.p1.b1': '💰 New revenue: KYC credential issuance fees (one-time or annual), revocation/renewal fees',
    'biz.p1.b2': '🏆 Brand premium: Become on-chain trust anchor, "Binance Verified" as industry standard',
    'biz.p1.b3': '📊 Data advantage: No user data stored, but access to macro data (issuance volume, revocation rates)',
    'biz.p1.b4': '🔗 Ecosystem lock-in: Users depend on credentials, high migration cost',
    'biz.p2.name': 'User / Holder (Alice)',
    'biz.p2.b1': '🔒 Privacy protection: No need to show passport for every P2P trade, zero personal info leakage',
    'biz.p2.b2': '⚡ Convenience: One KYC, use everywhere, no repeated verification',
    'biz.p2.b3': '💪 Data sovereignty: Credentials stored locally, you control what to disclose',
    'biz.p2.b4': '🌍 Cross-platform: One credential works on multiple DEXs / P2P platforms',
    'biz.p3.name': 'Verifier / Counterparty (Bob)',
    'biz.p3.b1': '✅ Compliance assurance: Confirm counterparty KYC compliance, reduce legal risk',
    'biz.p3.b2': '🚫 No data liability: Holding no personal data = no data breach responsibility',
    'biz.p3.b3': '⏱️ Instant verification: No need to contact third parties, self-verify from on-chain data',
    'biz.p4.name': 'P2P Platform / DEX',
    'biz.p4.b1': '📋 Compliance ready: Meet regulatory requirements without touching user privacy data',
    'biz.p4.b2': '💰 Cost reduction: No need to build KYC system, just integrate SDK',
    'biz.p4.b3': '👥 User attraction: Privacy-friendly = competitive advantage',
    'biz.p5.name': 'Regulators',
    'biz.p5.b1': '🔍 Controlled revocation: Can request issuer to revoke credentials, immediately effective network-wide',
    'biz.p5.b2': '📊 Macro monitoring: On-chain credential issuance/revocation trends visible',
    'biz.p5.b3': '⚖️ Balance point: Technical compromise between privacy protection and AML',
    'biz.revenue.title': '💰 Revenue Model',
    'biz.revenue.box': 'Issuer → User: Credential issuance fee ($5-50/time)\nIssuer → Platform: SDK license / API call fees\nPlatform → User: Transaction fees (incl. verification cost)\nIssuer → Issuer: Cross-institution credential recognition fees',
    'biz.revenue.entry': '🎯 Most Likely Entry Point',
    'biz.revenue.entry.desc': 'Binance as the first issuer — run it on their own P2P platform first, then open to external DEXs. Already has zero-knowledge proof experience from Proof of Reserves (PoR), most mature in both technology and brand.',
    'biz.risks.title': '⚠️ Risk Assessment',
    'biz.risks.high': '🔴 High Risk',
    'biz.risks.mid': '🟡 Medium Risk',
    'biz.risks.low': '🟢 Low Risk (Monitor)',
    'biz.risks.th.risk': 'Risk',
    'biz.risks.th.desc': 'Description',
    'biz.risks.th.mitigation': 'Mitigation',
    'biz.r1.name': 'Regulatory Rejection',
    'biz.r1.desc': 'Regulators may not accept ZK proofs for compliance, demanding real identity visibility',
    'biz.r1.fix': 'Design "law enforcement backdoor": issuer can cooperate with court orders',
    'biz.r2.name': 'Issuer Centralization',
    'biz.r2.desc': 'Issuance power concentrated in few exchanges — can refuse to issue or arbitrarily revoke',
    'biz.r2.fix': 'Multi-issuer competition + DAO-governed revocation process',
    'biz.r3.name': 'Key Loss',
    'biz.r3.desc': 'Device lost/damaged = credential lost, need to redo KYC',
    'biz.r3.fix': 'Encrypted cloud backup / social recovery mechanism',
    'biz.r4.name': 'Credential Expiry Management',
    'biz.r4.desc': 'Mass expiry causing renewal congestion',
    'biz.r4.fix': 'Rolling expiry + automatic pre-renewal',
    'biz.r5.name': 'Merkle Tree Bloat',
    'biz.r5.desc': 'High on-chain update costs at scale',
    'biz.r5.fix': 'Batch updates + L2 Rollup',
    'biz.r6.name': 'Collusion Attack',
    'biz.r6.desc': 'Multiple verifiers jointly analyzing timestamps and metadata to link proofs',
    'biz.r6.fix': 'Random delays + submission time obfuscation',
    'biz.r7.name': 'Credential Transfer/Sale',
    'biz.r7.desc': 'Users selling credentials to unverified individuals',
    'biz.r7.fix': 'Device key binding + biometric binding',
    'biz.r8.name': 'User Education Cost',
    'biz.r8.desc': 'ZK concepts too abstract for average users, need minimal UX',
    'biz.r9.name': 'Cross-chain Interoperability',
    'biz.r9.desc': 'Registry contracts on different chains need synchronization',
    'biz.r10.name': 'Quantum Computing Threat',
    'biz.r10.desc': 'ECDSA / BBS+ will need upgrading to post-quantum algorithms long-term',
    'biz.insights.title': '🧠 Key Insights',
    'biz.insights.prereq.title': 'Prerequisites for Success',
    'biz.insights.prereq.desc': '1. At least one major exchange willing to be issuer — Binance most motivated (existing PoR experience)\n2. Regulatory stance — at least not opposed, ideally encouraging (EU eIDAS 2.0 direction is favorable)\n3. User critical mass — enough credential holders needed for verifiers to want to integrate',
    'biz.insights.contradiction.title': '⚡ The Core Tension',
    'biz.insights.contradiction.quote': 'Regulators want "able to find the person", users want "unable to find me". The value of zkKYC is finding the balance — protect privacy under normal circumstances, issuer can cooperate when law enforcement requires. This is fundamentally a political question, not just a technical one.',

    // user-demo.html
    'ud.title': '🔐 zkKYC User View',
    'ud.switch': '📖 Technical View →',
    'ud.mode.wallet': '📱 Option A: Wallet to Wallet',
    'ud.mode.platform': '🌐 Option B: P2P Platform',
    'ud.mode.manual': '💻 Option C: Manual Verification',
    'ud.mode.wallet.desc': 'Alice and Bob trade P2P directly via wallets, SDK handles verification automatically',
    'ud.mode.platform.desc': 'Bob places an order on a P2P platform, the platform automatically requests and verifies Alice\'s KYC proof',
    'ud.mode.manual.desc': 'Like Binance PoS — Bob downloads open-source tools and manually verifies Alice\'s proof locally',
    'ud.biz': '💼 Business View',
    'ud.narrative.default': 'Choose an option and click start',
    'ud.wallet.alice': 'Alice\'s Wallet',
    'ud.wallet.bob': 'Bob\'s Wallet',
    'ud.wallet.assets': 'Total Assets',
    'ud.wallet.waiting': 'Waiting...',
    'ud.wallet.start': '🚀 Start Demo',
    'ud.platform.title': 'P2P Trading Hall',
    'ud.platform.loggedIn': 'Logged in: Bob (0xBob...7f3e)',
    'ud.platform.detail': '📋 Trade Details',
    'ud.platform.type': 'Trade Type',
    'ud.platform.type.val': 'P2P Buy',
    'ud.platform.asset': 'Asset',
    'ud.platform.price': 'Unit Price',
    'ud.platform.total': 'Total',
    'ud.platform.seller': 'Seller',
    'ud.platform.kycStatus': 'Seller KYC Status',
    'ud.platform.pending': '⏳ Pending',
    'ud.platform.btn': '🔍 Request Seller KYC Proof',
    'ud.manual.title': '💻 Manual zkKYC Proof Verification',
    'ud.manual.desc': 'Like Binance Proof of Reserves — Bob downloads open-source tools to verify Alice\'s proof locally',
    'ud.manual.btn': '▶️ Start Manual Verification',
  }
};

// JSON comments for app.js
const JSON_COMMENTS_I18N = {
  zh: {
    '"@context"': '// W3C 标准上下文',
    '"id"': '// 唯一标识符',
    '"issuer"': '// 发行方 DID',
    '"issuer_did"': '// 发行方去中心化标识符',
    '"holder_did"': '// 持有方去中心化标识符',
    '"public_key"': '// 发行方公钥（用于验证签名）',
    '"algorithm"': '// 签名算法',
    '"verificationMethod"': '// 验证方法（公钥信息）',
    '"authentication"': '// 身份认证方式',
    '"assertionMethod"': '// 断言方法',
    '"publicKeyHex"': '// 公钥十六进制',
    '"controller"': '// 密钥控制者',
    '"name"': '// 名称',
    '"type"': '// 凭证类型',
    '"issuanceDate"': '// 签发日期',
    '"expirationDate"': '// 过期日期',
    '"credentialSubject"': '// 凭证主体（KYC 信息）',
    '"credential_id"': '// 凭证唯一 ID',
    '"credential"': '// 可验证凭证全文',
    '"signed_fields"': '// 被 BBS+ 签名的字段列表',
    '"merkle_root"': '// Merkle 树根哈希（链上公开）',
    '"credentialStatus"': '// 凭证状态（撤销用）',
    '"statusPurpose"': '// 状态用途：撤销',
    '"kycLevel"': '// KYC 认证等级',
    '"sanctionClear"': '// 制裁名单清查：true=未命中',
    '"countryRisk"': '// 国家风险等级',
    '"amlCheck"': '// 反洗钱检查结果',
    '"nationality"': '// 国籍（隐私字段）',
    '"idNumber"': '// 证件号码（隐私字段）',
    '"presentation"': '// 可验证展示（包含 ZK 证明）',
    '"proof"': '// 零知识证明',
    '"nullifier"': '// 消零器（防重放+不可关联）',
    '"proof_size_bytes"': '// 证明大小（字节）',
    '"verifierNonce"': '// 验证方挑战随机数',
    '"selectiveDisclosure"': '// 选择性披露证明',
    '"revocationProof"': '// 非撤销证明（Merkle 成员）',
    '"expirationProof"': '// 过期证明',
    '"provenStatements"': '// 已证明的断言',
    '"hiddenInformation"': '// 被隐藏的信息',
    '"disclosed"': '// 已披露字段',
    '"hidden_commitments"': '// 隐藏字段的承诺值',
    '"signature"': '// BBS+ 组合签名',
    '"all_commitments"': '// 所有字段的承诺值',
    '"commitment"': '// Pedersen 承诺',
    '"blinding"': '// 盲因子（随机数）',
    '"value"': '// 原始值',
    '"merkleRoot"': '// Merkle 根（链上对比用）',
    '"leafHash"': '// 叶子哈希',
    '"notExpired"': '// 是否未过期',
    '"holder"': '// 持有方',
    '"revoked"': '// 是否已撤销',
    '"old_merkle_root"': '// 旧 Merkle 根',
    '"new_merkle_root"': '// 新 Merkle 根（根变=有撤销）',
    '"proofs_generated"': '// 生成的证明数量',
    '"all_from_same_user"': '// 全部来自同一用户',
    '"can_link_proofs"': '// 能否关联这些证明',
    '"nonce"': '// 验证方随机数',
    '"proof_hash"': '// 证明哈希（观察差异）',
    '"signature_fragment"': '// 签名片段（观察差异）',
  },
  en: {
    '"@context"': '// W3C standard context',
    '"id"': '// Unique identifier',
    '"issuer"': '// Issuer DID',
    '"issuer_did"': '// Issuer decentralized identifier',
    '"holder_did"': '// Holder decentralized identifier',
    '"public_key"': '// Issuer public key (for signature verification)',
    '"algorithm"': '// Signature algorithm',
    '"verificationMethod"': '// Verification method (public key info)',
    '"authentication"': '// Authentication method',
    '"assertionMethod"': '// Assertion method',
    '"publicKeyHex"': '// Public key in hex',
    '"controller"': '// Key controller',
    '"name"': '// Name',
    '"type"': '// Credential type',
    '"issuanceDate"': '// Issuance date',
    '"expirationDate"': '// Expiration date',
    '"credentialSubject"': '// Credential subject (KYC info)',
    '"credential_id"': '// Credential unique ID',
    '"credential"': '// Verifiable Credential full text',
    '"signed_fields"': '// Fields signed by BBS+',
    '"merkle_root"': '// Merkle tree root hash (public on-chain)',
    '"credentialStatus"': '// Credential status (for revocation)',
    '"statusPurpose"': '// Status purpose: revocation',
    '"kycLevel"': '// KYC verification level',
    '"sanctionClear"': '// Sanctions check: true=not listed',
    '"countryRisk"': '// Country risk level',
    '"amlCheck"': '// AML check result',
    '"nationality"': '// Nationality (private field)',
    '"idNumber"': '// ID number (private field)',
    '"presentation"': '// Verifiable Presentation (contains ZK proof)',
    '"proof"': '// Zero-knowledge proof',
    '"nullifier"': '// Nullifier (anti-replay + unlinkable)',
    '"proof_size_bytes"': '// Proof size (bytes)',
    '"verifierNonce"': '// Verifier challenge nonce',
    '"selectiveDisclosure"': '// Selective disclosure proof',
    '"revocationProof"': '// Non-revocation proof (Merkle membership)',
    '"expirationProof"': '// Expiration proof',
    '"provenStatements"': '// Proven statements',
    '"hiddenInformation"': '// Hidden information',
    '"disclosed"': '// Disclosed fields',
    '"hidden_commitments"': '// Hidden field commitments',
    '"signature"': '// BBS+ combined signature',
    '"all_commitments"': '// All field commitments',
    '"commitment"': '// Pedersen commitment',
    '"blinding"': '// Blinding factor (random)',
    '"value"': '// Original value',
    '"merkleRoot"': '// Merkle root (for on-chain comparison)',
    '"leafHash"': '// Leaf hash',
    '"notExpired"': '// Whether not expired',
    '"holder"': '// Holder',
    '"revoked"': '// Whether revoked',
    '"old_merkle_root"': '// Old Merkle root',
    '"new_merkle_root"': '// New Merkle root (changed = revocation)',
    '"proofs_generated"': '// Number of proofs generated',
    '"all_from_same_user"': '// All from same user',
    '"can_link_proofs"': '// Can these proofs be linked',
    '"nonce"': '// Verifier nonce',
    '"proof_hash"': '// Proof hash (observe differences)',
    '"signature_fragment"': '// Signature fragment (observe differences)',
  }
};

// ── Language state ──
let currentLang = localStorage.getItem('zkkyc-lang') || 'zh';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || (I18N['zh'][key]) || key;
}

function getJsonComments() {
  return JSON_COMMENTS_I18N[currentLang] || JSON_COMMENTS_I18N['zh'];
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('zkkyc-lang', lang);
  applyTranslations();
  updateLangToggle();
}

function toggleLang() {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
}

function updateLangToggle() {
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = currentLang === 'zh' ? 'EN' : '中文';
  });
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (el.tagName === 'OPTION') {
      el.textContent = val;
    } else {
      el.innerHTML = val;
    }
  });
  // Update page title
  const htmlEl = document.documentElement;
  if (htmlEl.getAttribute('data-page') === 'index') {
    document.title = currentLang === 'zh' ? 'zkKYC — 零知识 KYC 凭证系统' : 'zkKYC — Zero-Knowledge KYC Credential System';
  } else if (htmlEl.getAttribute('data-page') === 'business') {
    document.title = currentLang === 'zh' ? 'zkKYC — 商业分析' : 'zkKYC — Business Analysis';
  } else if (htmlEl.getAttribute('data-page') === 'user-demo') {
    document.title = currentLang === 'zh' ? 'zkKYC — 用户视角演示' : 'zkKYC — User Perspective Demo';
  }
  // Update html lang
  htmlEl.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  updateLangToggle();
});
