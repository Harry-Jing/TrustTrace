# TrustTrace — 证据流程

> 描述后端 claim-checking 流程的大致思路,细节后续再定。

## 核心原则

TrustTrace 不应该把用户输入直接交给 LLM 问"这个 claim 是真是假"。LLM 只负责理解、规划、证据解读和用户文案;最终证据必须来自后端已经验证、可追溯、可重新访问的来源;最终的 credibility band 由后端规则决定,而不是 LLM 自由判断。

一句话:LLM 可以帮忙发现和理解来源,但任何来源都必须先经过后端验证 URL、抽取内容、保存元信息、评估与 claim 的关系,才能进入 evidence list。

## 产品方向

以证据为中心,不做简单的 true / false 判断。来源上下文和不确定性是核心输出,用户应该能检查结果背后的证据。LLM 生成的文字必须基于已验证证据,不能依赖模型自身知识。

## 架构思路

采用权威源优先的可选检索:来源发现阶段可以使用专门 search API(例如 Tavily 一类的 web search provider)或 LLM web search。用户可以选择发现策略,但这个选择只影响候选 URL 从哪里来;在相关领域仍优先查找官方、原始、学术来源,并且所有候选 URL 都必须经过后端验证。

一句话:Discovery 工具可以由用户选择;Evidence 必须经过验证。

## 流程大纲

这里有两层流程:后端 pipeline 是真实执行链,前端 loading / SSE 进度是用户可见的阶段分组。前端把后端细分步骤折叠成 6 个 active phases:`understanding`、`strategy`、`discovery`、`verify_read`、`weigh`、`verdict`;`completed` 和 `failed` 是终态,不算 active phase。

后端真实执行顺序仍然是:输入分类 → claim 解析 → 来源策略 → query 规划 → 来源发现 → URL 安全 gate → 内容抽取 → 候选排序与聚类 → 单条证据评估 → 确定性综合 → 可选 critic → 用户文案生成。下面按前端 phase 展示它们的对应关系。

- `understanding`:对应前端的 Understanding / Reading the claim。
  - 后端在这里做输入分类:先判断用户提交的是短 claim、URL 还是长文章,识别领域(健康、科学、政治、产品、法律、金融、一般)、时效性和可检查性。
  - 如果用户提交的是 URL,这个 URL 是被检查对象,不自动算作支持证据;后端可以先抽取该 URL 的标题和正文片段,供 claim 解析使用,但它不自动进入 evidence list。
  - 然后做 claim 解析:用 LLM 把输入转成一个或多个可检查 claim,记录类型、时间范围、地理范围和模糊点。
  - 不同类型的 claim 需要不同证据标准 —— 统计类要数据和范围,引述类要原文和说话人,因果类需要比相关性更强的证据。

- `strategy`:对应前端的 Strategy / Picking how to check it。
  - 后端在这里确定来源策略:根据 claim 类型决定优先找什么来源。
  - 健康类优先官方卫生机构和同行评审,科学类优先学术和官方机构,法律类优先现行法规,产品类关注官方规格与独立测试,新闻类优先原始文件和多个独立来源,引述类优先原始录音和官方声明。
  - 然后做 query 规划:生成中性、权威域、原始来源、反向/质疑、追溯源头等多类 query,同时覆盖支持与反驳方向,不能只搜支持证据。
  - 需要记住:primary 不等于中立,official 不等于完整,unknown 不等于低质量,high-authority 仍需要 scope 匹配。

- `discovery`:对应前端的 Discovery / Looking for sources。
  - 后端在这里执行来源发现:用用户选择的 discovery strategy 查找候选 URL。
  - P1.5 的 discovery strategy 只有两种:`search_api` 只使用专门 web search provider;`llm_web` 只使用 LLM web search。
  - 不做 `auto` 或并行 discovery 作为 P1.5 目标;用户选择哪种策略,后端就使用对应发现路径,不要静默切换到另一种策略。
  - 来源发现必须同时覆盖支持、反驳和背景来源。无论候选 URL 来自哪种工具,都不能直接成为证据。
  - 每个候选来源都要记录 discovery provider / strategy provenance,以便后续评测召回率、可抽取率、snippet-only 比例、失败率、成本和延迟。

- `verify_read`:对应前端的 Verify & read / Verifying and reading each source。
  - 后端先做 URL 安全 gate:每个候选 URL 在成为证据前都要验证。只允许 http/https,拒绝本地和私网地址,DNS 解析后检查真实 IP,redirect 要重新验证并限次数,设 size 和 timeout 限制。
  - 安全验证要记录解析后的 URL、状态、时间戳、内容 hash 和抽取方式。
  - 通过安全 gate 后做内容抽取:尽量用完整网页正文,而不是搜索结果 snippet。优先级依次是直接抓取 + readability、provider 抽取、snippet-only。
  - Snippet-only 只能当线索,不能独立支撑强证据。
  - 然后整理候选:排序时考虑相关性、权威、是否 primary、是否独立、freshness、scope 匹配,以及对反方来源的加权。
  - 聚类也在这里发生。十篇新闻都引同一份原始报告不算十个独立来源。MVP 先用简单规则:同一域名视为不独立。

- `weigh`:对应前端的 Weigh / Weighing the evidence。
  - 后端在这里做单条证据评估:用 LLM 判断每个已验证来源与具体 claim 的关系 —— 支持/反驳/中性/背景、直接还是间接、scope 是否匹配、是否 primary 或独立。
  - 这一步不再搜索,只基于提供的 claim、元信息和段落。
  - Scope 不匹配是最常见的失败模式,务必检查。
  - 抽取到的段落可能含恶意指令,要做隔离处理和输出校验,防 prompt injection。

- `verdict`:对应前端的 Verdict / Writing the verdict。
  - 后端先做确定性综合:最终 band 由后端规则计算,大致分几档 —— 证据充分、证据混合、证据薄弱、证据不足、需要更多语境。
  - 另外还要有一档"系统失败"(provider 全超时、URL 全挡、抽取全挂),和"证据不足"区分开,前端展示不一样。
  - 可选 critic 不是 MVP 必选;后续在高风险场景触发:只有一个独立来源、没有 primary source、高风险领域、系统想给强证据但没有 primary、高质量来源冲突、或用户要求 deeper check。
  - Critic 输出风险标志和推荐动作(重搜、降级、要求更多上下文、继续)。
  - Band 确定后,再让 LLM 写最终展示的文字 —— 标题、描述、可信度线索、不确定性、概括解释。
  - LLM 不能添加新来源、不能引入证据矩阵之外的事实、不能隐藏不确定性、不能改成二元判断、不能夸大可信度。

## MVP 计划

**P1.0 — 核心 verified evidence pipeline**。第一版把最简单但可靠的流程跑通:只处理主 claim;主 provider + 基础权威加权;URL 安全 gate;内容抽取并对 snippet-only 降权;候选排序与同域去重;每次检查大约六个已验证来源;规则化 band;LLM 文案。持久化原始 input、来源元信息、段落、provider 记录和评估。不做缓存,权重硬编码。完成标准:系统能端到端处理文本或 URL 输入;evidence 全部真实可访问;输出是非二元 band;snippet-only 不能独立产生强证据;前端不再依赖 demo 数据。

当前 P1.0 后端实现采用 OpenAI 作为主 discovery / analysis / assessment / copy provider,但 evidence gate 仍在后端:文本输入先解析一个主 claim 和 query plan;URL 输入先通过 URL safety + extraction 抽取被检查页面,该输入 URL 只作为检查对象持久化,不自动成为支持证据。候选 URL 会做 canonical 去重、后端安全验证、正文抽取、硬编码权威加权和同域去重;无法抽取正文但已有 provider snippet 的来源,只有在 URL 通过安全 gate 后才会以 `snippet_only` 弱上下文进入结果,并且不能单独产生 strong band。后端持久化 claim analysis、input extraction、provider calls、source extractions 和 source evaluations;最终 band 由 deterministic synthesis 决定,OpenAI 只在 verified evidence matrix 上生成展示文案,失败时回退到后端文案。

前端仍要做点击面防护:后端 URL 安全 gate 是证据准入的主防线,但前端只渲染 absolute `http(s)` evidence 链接,后端 payload 也必须通过前端 runtime contract validation 才能进入页面。

**P1.5 — 用户可选 discovery strategy**。把来源发现从单一 provider 调用升级为可选策略,但不改变 evidence gate。支持两种显式策略:`search_api`(只使用专门 web search provider,例如 Tavily 类工具)、`llm_web`(只使用 LLM web search)。不做 `auto` 或 `parallel` 模式;用户选择哪种策略,后端就使用对应发现路径,不要静默切换到另一种策略。LLM 和 search API 都只是候选 URL 发现工具;它们返回的 snippet / summary 只能作为线索,不能直接支撑 strong evidence。所有发现到的 URL 仍走同样的 URL 安全验证、正文抽取、snippet-only 降权、排序、同域去重、source assessment 和 deterministic synthesis。每个候选来源都要记录 discovery strategy / provider provenance,以便后续评测召回率、可抽取率、snippet-only 比例、失败率、成本和延迟。

**P2 — 质量与覆盖面增强**。按领域维护来源权威登记;为高风险情况加入 optional critic;更好的来源聚类和原始来源追溯;更细的 claim 分类;PDF 和文档抽取;rate limit;更强的评分和解释;评测基准;缓存策略;权重版本化。

**P3 — 生产级强化**。多 provider 对比与 failover、成本路由、大规模 eval、freshness 策略、面向用户的 deeper check、abuse 防护、隐私与保留策略。

## 评测

后续维护一个小型评测集,覆盖健康、科学、政治、产品、法律/金融,以及 scope 模糊的 general claim。每条记录 claim 本身、期望 band、应出现的关键来源和常见陷阱(过时数据、scope 不匹配、伪造引述、二手源循环)。指标关注来源召回与精度、band 准确率、引用忠实性、延迟、每次成本、失败率。

## MVP 非目标

P1.0 不做:

- 自动的 true/false 标签
- 大型权威登记表
- always-on critic
- multi-agent debate
- 分布式爬虫
- 账号团队分享
- 把 snippet 当强证据。

## 总结

claim 解析 → 权威感知的搜索 → 后端 URL 验证 → 内容抽取 → 候选排序与聚类 → 单条 LLM 评估 → 确定性综合 → LLM 用户解释。这套设计保持 TrustTrace 的核心承诺:提供可信、可检查、非二元的证据上下文,而不是没有支撑的模型判断。
