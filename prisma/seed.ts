const { PrismaClient } = require('../prisma-generated/client');

const prisma = new PrismaClient();
const MODEL_NAMES = ["sysuser", "category", "product", "productsku", "cart", "cartitem", "importtask", "importtaskitem"];
const modelIdMap = {
  "sysuser": new Map(),
  "category": new Map(),
  "product": new Map(),
  "productsku": new Map(),
  "cart": new Map(),
  "cartitem": new Map(),
  "importtask": new Map(),
  "importtaskitem": new Map()
};

// === Seed Functions Start ===
async function seedsysuser(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const sysuserData = [
    {
      account: "admin@globaltrade.com",
      username: "超级管理员",
      email: "admin@globaltrade.com",
      role: "ADMIN",
      avatarUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/7154d9343aaf4ac089d1d995b7661f8b.png",
      status: "ACTIVE",
      timeAnchor: -25,
      lastLoginAnchor: -1
    },
    {
      account: "m.chen@example.com",
      username: "陈美玲",
      email: "m.chen@example.com",
      role: "CUSTOMER",
      avatarUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a0710dc77a9848acaf1bbb36360d9d6e.png",
      status: "ACTIVE",
      timeAnchor: -15,
      lastLoginAnchor: -2
    },
    {
      account: "j.wilson@example.com",
      username: "James Wilson",
      email: "j.wilson@example.com",
      role: "CUSTOMER",
      avatarUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/298c920a113a42ca92a3bd2d24f27dba.png",
      status: "ACTIVE",
      timeAnchor: -10,
      lastLoginAnchor: -3
    },
    {
      account: "t.sato@example.com",
      username: "佐藤 健",
      email: "t.sato@example.com",
      role: "CUSTOMER",
      avatarUrl: "https://images.unsplash.com/photo-1632957801446-d0a26e1b1302?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4MTc3NTR8MHwxfHNlYXJjaHw1fHx3b21hbiUyMHNvcGhpc3RpY2F0ZWQlMjBsaWZlc3R5bGUlMjBoZWFkc2hvdCUyMHByb2ZpbGUlMjBwb3J0cmFpdHxlbnwwfDF8fHwxNzc1ODk1MDUzfDA&ixlib=rb-4.1.0&q=85",
      status: "ACTIVE",
      timeAnchor: -5,
      lastLoginAnchor: -1
    },
    {
      account: "sarah.connor@example.com",
      username: "Sarah Connor",
      email: "sarah.connor@example.com",
      role: "CUSTOMER",
      avatarUrl: "https://www.autocoder.cc/background/zaki_prod/generated/a144c5db2fc148b69048d4724bfbb553.png",
      status: "ACTIVE",
      timeAnchor: -45,
      lastLoginAnchor: -10
    },
    {
      account: "jason_bourne@example.com",
      username: "Jason Bourne",
      email: "jason_bourne@example.com",
      role: "CUSTOMER",
      avatarUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/12dde241ef9b45a49d80cf9fe05f93fc.png",
      status: "DISABLED",
      timeAnchor: -60,
      lastLoginAnchor: -20
    }
  ];

  modelIdMap["sysuser"] = new Map<number, string>();

  for (let i = 0; i < sysuserData.length; i++) {
    const data = sysuserData[i];
    const createdAt = addDays(baseDate, data.timeAnchor);
    const lastLoginAt = addDays(baseDate, data.lastLoginAnchor);
    const updatedAt = addDays(baseDate, data.timeAnchor + 1);

    const record = await prisma.sysuser.create({
      data: {
        account: data.account,
        password: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        email: data.email,
        role: data.role as any,
        status: data.status as any,
        username: data.username,
        avatarUrl: data.avatarUrl,
        lastLoginAt: lastLoginAt,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });
    
    modelIdMap["sysuser"].set(i, record.id);
  }
}
async function seedcategory(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const categoryData = [
    {
      name: "电子数码",
      slug: "electronics",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9c83563212e94759b715547d41c534c7.png",
      description: "探索最新科技潮流，提供高品质的智能手机、电脑配件及各类创新电子数码产品，满足日常所需。",
      sortWeight: 100,
      status: "ACTIVE",
      timeAnchor: -45,
      updateAnchor: -5
    },
    {
      name: "时尚服饰",
      slug: "fashion",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/5a43017a9e4a436d91aa64dc649f8c8f.png",
      description: "精选全球流行趋势，涵盖男女潮流服饰、鞋靴箱包，为您打造个性化穿搭体验，展现独特魅力。",
      sortWeight: 90,
      status: "ACTIVE",
      timeAnchor: -15,
      updateAnchor: -2
    },
    {
      name: "家居生活",
      slug: "home",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/7a061b3b3426494da79af8ef12f16349.png",
      description: "打造温馨舒适的居家环境，汇集精美家具、实用收纳与创意家饰，提升生活品质与幸福感。",
      sortWeight: 80,
      status: "ACTIVE",
      timeAnchor: -60,
      updateAnchor: -40
    },
    {
      name: "美妆个护",
      slug: "beauty",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a84754609d9045b6994483aa942c203f.png",
      description: "严选国际知名品牌，提供护肤、彩妆及个人护理佳品，让您焕发自然光彩，保持健康美丽状态。",
      sortWeight: 70,
      status: "ACTIVE",
      timeAnchor: -20,
      updateAnchor: -10
    },
    {
      name: "户外运动",
      slug: "sports",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/7b20ed0f25994a0aa9bb54b551fb5ac1.png",
      description: "专为热爱自然与挑战的您准备，精选各类专业运动装备与户外露营用品，助您尽情释放活力。",
      sortWeight: 60,
      status: "INACTIVE",
      timeAnchor: -90,
      updateAnchor: -80
    },
    {
      name: "母婴玩具",
      slug: "toys",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/593d5b3090b344b2823e166e7c84736d.png",
      description: "关注宝宝健康成长，提供安全无毒的婴童服饰、益智玩具及日常护理用品，让妈妈更加安心。",
      sortWeight: 50,
      status: "ACTIVE",
      timeAnchor: -10,
      updateAnchor: -1
    }
  ];

  modelIdMap["category"] = new Map<number, string>();

  for (let i = 0; i < categoryData.length; i++) {
    const data = categoryData[i];
    const createdAt = addDays(baseDate, data.timeAnchor);
    const updatedAt = addDays(baseDate, data.updateAnchor);

    const record = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        imageUrl: data.imageUrl,
        description: data.description,
        sortWeight: data.sortWeight,
        status: data.status as any,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });
    
    modelIdMap["category"].set(i, record.id);
  }
}
async function seedproduct(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const productData = [
    {
      categoryId: 0,
      name: "智能多功能运动防水手环 5.0 触控屏",
      slug: "prod-001",
      productCode: "SKU-W2024-01",
      source: "IMPORT_1688",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a529ffcfe7b044e4bcc81b353b3242bf.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/ac4e1920ee1e4d14b459a278c28406a2.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/b0f9409356ab47a68ab4125307c6a773.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/759ae59fdbf8418da70489fc53129412.png", sort: 3 }
      ],
      shortDescription: "全天候心率血氧监测，50米深度防水，支持多种运动模式，长达14天续航，让您的健康管理更智能便捷。",
      sellingPointsJson: [
        { title: "标签", content: "爆款推荐" },
        { title: "健康", content: "全天候健康监测" },
        { title: "续航", content: "14天超长续航" },
        { title: "防水", content: "50米深度防水" }
      ],
      detailContentJson: [
        { type: "text", title: "产品概览", content: "这款智能运动手环集成了最新的生物传感器，能够实时监测您的健康数据。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/60551c030f944705b66cf213eaee3767.png" },
        { type: "text", title: "核心功能", content: "支持多达20种运动模式，精确记录运动轨迹与消耗热量。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/bd1d071ad975436db8a62064874cc704.png" }
      ],
      parameterJson: [
        { group: "基本参数", items: [{ key: "屏幕尺寸", value: "1.47英寸" }, { key: "电池容量", value: "180mAh" }] },
        { group: "网络与连接", items: [{ key: "蓝牙版本", value: "蓝牙 5.0" }, { key: "兼容系统", value: "Android 6.0 或 iOS 10.0 及以上" }] }
      ],
      tradeInfoJson: { minOrderQty: "10 件起订", shippingNote: "3天内发货", shipFrom: "深圳, 中国", deliveryDays: 7, supportedRegions: ["US", "EU"], tradeNotice: "本商品支持7天无理由退换货" },
      faqJson: [
        { question: "是否支持游泳佩戴？", answer: "支持，本产品具备50米防水性能。" },
        { question: "电池寿命如何？", answer: "典型使用场景下可达14天。" },
        { question: "可以接收手机消息吗？", answer: "可以，通过蓝牙连接手机后，可实时接收微信、短信等通知。" },
        { question: "保修期多久？", answer: "自购买之日起提供一年质保服务。" }
      ],
      ratingAverage: 4.9,
      ratingCount: 142,
      sortWeight: 100,
      timeAnchor: -15,
      updateAnchor: -2
    },
    {
      categoryId: 0,
      name: "主动降噪无线蓝牙头戴式耳机 HIFI音质",
      slug: "prod-002",
      productCode: "SKU-H2024-02",
      source: "IMPORT_1688",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9f9d5bc943db4aff883598293aafa1d6.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/0fbd0fa237d44a6fbd43ceb065c93a78.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/986bf9a7126d4db08494051106ebf5c7.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/60a581894fcf49bc87ace63878ca3529.png", sort: 3 }
      ],
      shortDescription: "采用混合主动降噪技术，有效隔绝外界喧嚣；定制大动圈单元，呈现纯净动人的HiFi级高保真音质。",
      sellingPointsJson: [
        { title: "标签", content: "限时特惠" },
        { title: "降噪", content: "深度主动降噪" },
        { title: "音质", content: "HiFi级高保真" },
        { title: "舒适", content: "云朵般佩戴体验" }
      ],
      detailContentJson: [
        { type: "text", title: "设计理念", content: "专为音乐发烧友设计，结合人体工学，带来无与伦比的佩戴舒适度与音质享受。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/73b12b1c2294444ab545b1bb0c1f9587.png" },
        { type: "text", title: "降噪性能", content: "最高可达40dB的降噪深度，让您在嘈杂环境中也能沉浸在音乐世界。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/23e3a27ee6c74e84a263932b4da22818.png" }
      ],
      parameterJson: [
        { group: "基本参数", items: [{ key: "驱动单元", value: "40mm 动圈" }, { key: "续航时间", value: "降噪开约30小时，降噪关约50小时" }] },
        { group: "连接参数", items: [{ key: "蓝牙版本", value: "蓝牙 5.2" }, { key: "音频解码", value: "SBC, AAC, aptX" }] }
      ],
      tradeInfoJson: { minOrderQty: "5 件起订", shippingNote: "5天内发货", shipFrom: "广州, 中国", deliveryDays: 10, supportedRegions: ["Global"], tradeNotice: "海外订单请注意关税政策" },
      faqJson: [
        { question: "降噪效果明显吗？", answer: "非常明显，尤其对低频噪音如引擎声过滤效果极佳。" },
        { question: "支持有线连接吗？", answer: "支持，包装内附赠3.5mm音频线。" },
        { question: "眼镜党佩戴夹头吗？", answer: "耳罩采用慢回弹记忆海绵，对眼镜党非常友好。" },
        { question: "如何开启降噪模式？", answer: "耳机左侧有独立降噪按键，一键切换降噪/透传模式。" }
      ],
      ratingAverage: 4.8,
      ratingCount: 96,
      sortWeight: 95,
      timeAnchor: -20,
      updateAnchor: -5
    },
    {
      categoryId: 0,
      name: "双向快充便携式移动电源 20000mAh 金属外壳",
      slug: "prod-003",
      productCode: "SKU-P2024-03",
      source: "IMPORT_1688",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/60c5761fa02b45168c579e914990a92a.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/30ac38b37cf04c18884b44f211085c4f.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9a5db9d607914da982b8f9ed28cad841.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/792e7efb289544078622b95a6d42e7c4.png", sort: 3 }
      ],
      shortDescription: "超大容量20000mAh，支持PD3.0等多种快充协议，航空级铝合金外壳，散热更佳，安全耐用，出行必备。",
      sellingPointsJson: [
        { title: "标签", content: "货源稳定" },
        { title: "容量", content: "20000mAh大容量" },
        { title: "快充", content: "双向PD快充" },
        { title: "材质", content: "航空铝合金外壳" }
      ],
      detailContentJson: [
        { type: "text", title: "安全防护", content: "内置十重安全防护电路，防过充、过放、短路等，保障您的设备安全。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/a7e4157622f046ec80ed19ffbb2c13d0.png" },
        { type: "text", title: "兼容性", content: "广泛兼容主流智能手机、平板电脑以及部分轻薄笔记本电脑。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/71367bec3e914f8e9a67455d1feeef4a.png" }
      ],
      parameterJson: [
        { group: "基本规格", items: [{ key: "电芯类型", value: "锂聚合物电池" }, { key: "外壳材质", value: "铝合金" }] },
        { group: "输入输出", items: [{ key: "输入接口", value: "Type-C" }, { key: "输出接口", value: "Type-C, USB-A" }] }
      ],
      tradeInfoJson: { minOrderQty: "50 件起订", shippingNote: "7天内发货", shipFrom: "东莞, 中国", deliveryDays: 14, supportedRegions: ["US", "EU", "AS"], tradeNotice: "大批量订单可定制Logo" },
      faqJson: [
        { question: "可以带上飞机吗？", answer: "容量符合民航局规定，可以直接携带登机。" },
        { question: "充满电需要多久？", answer: "使用18W及以上快充适配器，约需6-8小时充满。" },
        { question: "支持同时充几个设备？", answer: "支持两个设备同时充电，但总输出功率会智能分配。" },
        { question: "外壳会发烫吗？", answer: "金属外壳导热快，快充时会有温热感，属于正常散热现象。" }
      ],
      ratingAverage: 4.7,
      ratingCount: 218,
      sortWeight: 90,
      timeAnchor: -30,
      updateAnchor: -10
    },
    {
      categoryId: 0,
      name: "1080P 智能家用无线监控摄像头 夜视云台版",
      slug: "prod-004",
      productCode: "SKU-C2024-04",
      source: "IMPORT_1688",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/42cedc6e82244dc88ec042447205f73f.png",
      galleryJson: [
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/c1b644a475f145b9b52a3324ccd77a39.png", sort: 1 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/a619a25e35c844c4ae27574d2307f989.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/fa78ee54a2884e03b395b117cf0d974e.png", sort: 3 }
      ],
      shortDescription: "1080P高清画质，360度全景视野，增强红外夜视，支持AI人形移动侦测与双向语音对讲，守护家庭安全。",
      sellingPointsJson: [
        { title: "标签", content: "高转化率" },
        { title: "画质", content: "1080P全高清" },
        { title: "视野", content: "360度云台全景" },
        { title: "智能", content: "AI人形侦测" }
      ],
      detailContentJson: [
        { type: "text", title: "高清夜视", content: "内置多颗红外补光灯，即使在全黑环境下也能呈现清晰细腻的画面。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/b387eda35a9544faa0531bc38b48fe14.png" },
        { type: "text", title: "智能追踪", content: "开启移动追踪功能后，摄像头会自动捕捉并跟随移动物体拍摄。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/d092d425b8dc405f9fc7e5ea72363030.png" }
      ],
      parameterJson: [
        { group: "视频参数", items: [{ key: "分辨率", value: "1920x1080" }, { key: "视场角", value: "水平360度，垂直108度" }] },
        { group: "网络与存储", items: [{ key: "无线连接", value: "Wi-Fi IEEE 802.11b/g/n 2.4GHz" }, { key: "存储功能", value: "MicroSD卡(最大支持256GB), 云存储" }] }
      ],
      tradeInfoJson: { minOrderQty: "20 件起订", shippingNote: "4天内发货", shipFrom: "杭州, 中国", deliveryDays: 8, supportedRegions: ["US", "EU"], tradeNotice: "产品内置多国语言包" },
      faqJson: [
        { question: "需要拉网线吗？", answer: "不需要，连接家里2.4G Wi-Fi即可使用。" },
        { question: "怎么查看录像？", answer: "通过专属APP随时随地回放TF卡或云端录像。" },
        { question: "可以多人同时观看吗？", answer: "支持主账号分享给家人，允许多设备同时在线观看。" },
        { question: "存储卡能录多久？", answer: "64G存储卡在连续录像模式下大约可保存7天画面。" }
      ],
      ratingAverage: 4.9,
      ratingCount: 88,
      sortWeight: 85,
      timeAnchor: -12,
      updateAnchor: -1
    },
    {
      categoryId: 0,
      name: "无线主动降噪头戴式耳机",
      slug: "wireless-noise-cancelling-headphones",
      productCode: "P-1001",
      source: "IMPORT_1688",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9f9d5bc943db4aff883598293aafa1d6.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/fb8c90a0980b414cb6b9995380857351.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/4bfe7fb3435b467d8ca147314749ffe0.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/0de3f6d94fb044669442d5790c6bd223.png", sort: 3 }
      ],
      shortDescription: "卓越的降噪体验，让您专注聆听内心的声音，摆脱外界干扰。",
      sellingPointsJson: [
        { title: "音质", content: "专业调音，三频均衡" },
        { title: "佩戴", content: "轻量化设计，久戴不累" },
        { title: "续航", content: "快充技术，充电10分钟听歌2小时" },
        { title: "通话", content: "双麦克风通话降噪" }
      ],
      detailContentJson: [
        { type: "text", title: "专注时刻", content: "无论是在喧闹的办公室还是通勤途中，只需戴上耳机，瞬间开启静谧空间。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/e8612b5d4f324b79b012e25e8dda38ef.png" },
        { type: "text", title: "便捷操控", content: "耳罩集成触控面板，指尖轻点即可完成播放、暂停、切歌等操作。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/59d7d84e5bff4c7a8fec74be19c43672.png" }
      ],
      parameterJson: [
        { group: "音频规格", items: [{ key: "频响范围", value: "20Hz-20kHz" }, { key: "阻抗", value: "32欧姆" }] },
        { group: "其他", items: [{ key: "重量", value: "250g" }, { key: "充电接口", value: "Type-C" }] }
      ],
      tradeInfoJson: { minOrderQty: "10 件起订", shippingNote: "3天内发货", shipFrom: "深圳, 中国", deliveryDays: 7, supportedRegions: ["Global"], tradeNotice: "提供OEM定制服务" },
      faqJson: [
        { question: "支持苹果手机吗？", answer: "完全兼容iOS系统，支持弹窗显示电量。" },
        { question: "降噪开启后底噪大吗？", answer: "采用先进的降噪算法，底噪控制极佳，几不可闻。" },
        { question: "耳罩坏了可以更换吗？", answer: "耳罩采用卡扣式设计，方便用户自行更换。" },
        { question: "蓝牙连接稳定吗？", answer: "搭载最新蓝牙芯片，连接更迅速，抗干扰能力更强。" }
      ],
      ratingAverage: 4.6,
      ratingCount: 150,
      sortWeight: 80,
      timeAnchor: -45,
      updateAnchor: -15
    },
    {
      categoryId: 0,
      name: "智能运动健康监测手表",
      slug: "smart-sports-health-watch",
      productCode: "P-1002",
      source: "IMPORT_1688",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/550b89c9dbe34d8e91874a55c622970a.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/7083573cdd6c4afa8bd36f069c54df4d.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/1dcf8251fdc64c34ab2d9271f4b8f765.png", sort: 2 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/895ea93e12474d949bceb71965b7f90a.png", sort: 3 }
      ],
      shortDescription: "全能腕上管家，不仅记录运动数据，更关注您的睡眠与心脏健康。",
      sellingPointsJson: [
        { title: "屏幕", content: "AMOLED高清彩屏" },
        { title: "健康", content: "ECG心电图检测" },
        { title: "运动", content: "内置独立GPS" },
        { title: "表盘", content: "海量个性化表盘" }
      ],
      detailContentJson: [
        { type: "text", title: "健康守护", content: "新增ECG心电图功能，随时随地了解心脏状况，为健康保驾护航。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/2efc37d1da9042cabf7991f427ecea02.png" },
        { type: "text", title: "运动指导", content: "内置多种专业运动课程，提供实时语音指导，让运动更科学有效。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/02e03a3fca6b42849e5c4d1f7ff83408.png" }
      ],
      parameterJson: [
        { group: "屏幕参数", items: [{ key: "屏幕材质", value: "AMOLED" }, { key: "分辨率", value: "454x454" }] },
        { group: "传感器", items: [{ key: "心率传感器", value: "光学心率传感器" }, { key: "定位系统", value: "GPS, GLONASS, Galileo, Beidou" }] }
      ],
      tradeInfoJson: { minOrderQty: "5 件起订", shippingNote: "2天内发货", shipFrom: "上海, 中国", deliveryDays: 5, supportedRegions: ["US", "EU", "AS"], tradeNotice: "电子产品请轻拿轻放" },
      faqJson: [
        { question: "表带可以更换吗？", answer: "采用标准22mm快拆表带，市面上大部分表带均可通用。" },
        { question: "支持NFC支付吗？", answer: "支持，可绑定公交卡及部分银行卡使用。" },
        { question: "血压测量准吗？", answer: "本产品非医疗器械，测量数据仅供参考，不作为诊断依据。" },
        { question: "可以独立播放音乐吗？", answer: "手表内置2GB存储空间，可连接蓝牙耳机脱离手机听歌。" }
      ],
      ratingAverage: 4.8,
      ratingCount: 320,
      sortWeight: 75,
      timeAnchor: -60,
      updateAnchor: -20
    },
    {
      categoryId: 2,
      name: "人体工学高背网面办公椅",
      slug: "ergonomic-high-back-mesh-chair",
      productCode: "P-1003",
      source: "MANUAL",
      status: "DRAFT",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/221e81b0a04c42f8af610074f7074ef9.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/b2bd655a52cb4ce8b1bfbaf4a28a4a22.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/76c653ad12c946ae8c48620d22705ac9.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/cad71f2ce9ba46a6a1e60f21092cf486.png", sort: 3 }
      ],
      shortDescription: "专为久坐人群设计，提供全面背部与腰部支撑，透气网布材质，四季舒爽。",
      sellingPointsJson: [
        { title: "护腰", content: "自适应动态腰托" },
        { title: "透气", content: "高弹力特网材质" },
        { title: "调节", content: "多维度调节扶手" },
        { title: "底盘", content: "线控防爆底盘" }
      ],
      detailContentJson: [
        { type: "text", title: "腰部支撑", content: "独创的自适应腰托设计，随坐姿变化自动调节支撑力度，有效缓解腰部疲劳。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/d9316732b6294526b1201096a735461a.png" },
        { type: "text", title: "午休神器", content: "最大支持135度后仰锁定，配合隐藏式脚踏，瞬间化身舒适午休床。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/a53d7d63afc44a40b9d41ddc1b8fa34a.png" }
      ],
      parameterJson: [
        { group: "材质信息", items: [{ key: "靠背材质", value: "透气网布" }, { key: "坐垫材质", value: "高密度海绵/网布可选" }] },
        { group: "尺寸规格", items: [{ key: "整体高度", value: "115-125cm可调" }, { key: "最大承重", value: "150kg" }] }
      ],
      tradeInfoJson: { minOrderQty: "1 件起订", shippingNote: "下单后72小时内发货", shipFrom: "佛山, 中国", deliveryDays: 10, supportedRegions: ["CN", "US", "EU"], tradeNotice: "大件商品物流需自提或额外付费送货上门" },
      faqJson: [
        { question: "安装复杂吗？", answer: "不复杂，附赠详细说明书及安装工具，单人约15分钟即可完成组装。" },
        { question: "轮子会刮花木地板吗？", answer: "采用PU静音万向轮，顺滑且不伤地板。" },
        { question: "异响严重吗？", answer: "各连接处均有降噪垫片，正常使用下不会产生异响。" },
        { question: "网布容易破吗？", answer: "选用进口高弹力特网，经过严格耐磨测试，不易破损塌陷。" }
      ],
      ratingAverage: 0,
      ratingCount: 0,
      sortWeight: 70,
      timeAnchor: -5,
      updateAnchor: -1
    },
    {
      categoryId: 1,
      name: "复古纯棉加厚保暖连帽卫衣 男式",
      slug: "vintage-cotton-hoodie-men",
      productCode: "SKU-F2024-01",
      source: "MANUAL",
      status: "ACTIVE",
      mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/891a4eaca3ed44808260f9f4d4b56df5.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/57df2fdb14cc4a88ace7e754fcd4a813.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/5e3dc7837a46407aa03f74a82c84c580.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/5ecba099c3da4f5aac3ea25b7d1d8d16.png", sort: 3 }
      ],
      shortDescription: "精选新疆长绒棉，内里加绒加厚处理，保暖性能极佳；宽松落肩版型，尽显慵懒复古风尚。",
      sellingPointsJson: [
        { title: "面料", content: "100%精梳纯棉" },
        { title: "保暖", content: "内里细密摇粒绒" },
        { title: "版型", content: "Oversize落肩设计" },
        { title: "百搭", content: "多色可选易穿搭" }
      ],
      detailContentJson: [
        { type: "text", title: "工艺细节", content: "领口与袖口采用高弹力罗纹拼接，水洗不易变形；胸前简约刺绣Logo，彰显品质。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/3905ac85158548799a3aa4aa0ca140ba.png" },
        { type: "text", title: "穿搭建议", content: "内搭白T恤露出下摆，下身搭配工装裤或直筒牛仔裤，轻松营造层次感。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/960fde22ceea4958bc6251d67c7d12cb.png" }
      ],
      parameterJson: [
        { group: "产品参数", items: [{ key: "厚薄", value: "加厚" }, { key: "版型", value: "宽松型" }] },
        { group: "洗涤说明", items: [{ key: "洗涤方式", value: "建议手洗/轻柔机洗，水温不高于30度" }, { key: "不可熨烫", value: "印花部分不可直接熨烫" }] }
      ],
      tradeInfoJson: { minOrderQty: "2 件起订", shippingNote: "2天内发货", shipFrom: "广州, 中国", deliveryDays: 5, supportedRegions: ["Global"], tradeNotice: "色差问题请以实物为准" },
      faqJson: [
        { question: "容易起球吗？", answer: "面料经过抗起球处理，正常穿着洗涤不易起球。" },
        { question: "缩水严重吗？", answer: "成衣已做预缩水处理，缩水率控制在国家标准范围内。" },
        { question: "掉毛吗？", answer: "初次洗涤可能会有轻微浮毛，建议单洗一次后再穿着。" },
        { question: "尺码偏大还是偏小？", answer: "版型偏宽松，喜欢合身效果可拍小一码。" }
      ],
      ratingAverage: 4.8,
      ratingCount: 110,
      sortWeight: 65,
      timeAnchor: -25,
      updateAnchor: -12
    },
    {
      categoryId: 3,
      name: "氨基酸温和洁面慕斯 泡沫洗面奶",
      slug: "amino-acid-cleansing-mousse",
      productCode: "SKU-B2024-01",
      source: "MANUAL",
      status: "ACTIVE",
      mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/cf8c72fdaaa747a6af2772488c760f32.png",
      galleryJson: [
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/8705e0d674a4465e91216df8a0234df4.png", sort: 1 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/ee2fe0292e1a4e57a3240085a3e79276.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a59b490ea2744866a144f69d356fd7b2.png", sort: 3 }
      ],
      shortDescription: "弱酸性配方，接近肌肤自身PH值；一按即出绵密云朵泡，温和清洁毛孔污垢，洗后水润不紧绷。",
      sellingPointsJson: [
        { title: "成分", content: "纯正氨基酸表活" },
        { title: "温和", content: "无皂基不伤肤" },
        { title: "肤感", content: "洗后不假滑不紧绷" },
        { title: "便捷", content: "微米级自发泡泵头" }
      ],
      detailContentJson: [
        { type: "text", title: "核心成分", content: "特别添加神经酰胺与玻尿酸精华，清洁的同时修护肌肤屏障，锁住水分。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/f9001a0c9d9d4532a7ea22e7251007f6.png" },
        { type: "text", title: "适用肤质", content: "敏感肌、干性肌肤及痘痘肌均可安心使用，不含酒精、香精及防腐剂。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/54b06a2d8bcc47ca9b54b5017412ca65.png" }
      ],
      parameterJson: [
        { group: "产品信息", items: [{ key: "净含量", value: "150ml" }, { key: "保质期", value: "3年" }] },
        { group: "使用方法", items: [{ key: "用量", value: "按压1-2泵即可" }, { key: "步骤", value: "湿润面部后，将泡沫均匀涂抹打圈按摩，清水洗净" }] }
      ],
      tradeInfoJson: { minOrderQty: "5 瓶起订", shippingNote: "24小时内发货", shipFrom: "上海, 中国", deliveryDays: 3, supportedRegions: ["CN", "US"], tradeNotice: "化妆品类运输需特殊包装" },
      faqJson: [
        { question: "能卸妆吗？", answer: "可卸除日常防晒及淡妆，浓妆建议先使用专业卸妆产品。" },
        { question: "孕妇可用吗？", answer: "成分安全温和，孕妇及哺乳期均可放心使用。" },
        { question: "男士可以用吗？", answer: "可以的，氨基酸洁面不挑性别，适合所有肤质。" },
        { question: "用完脸会干吗？", answer: "含有保湿成分，洗后触感水嫩，不会有紧绷感。" }
      ],
      ratingAverage: 4.9,
      ratingCount: 540,
      sortWeight: 60,
      timeAnchor: -40,
      updateAnchor: -8
    },
    {
      categoryId: 5,
      name: "益智拼装大颗粒积木 婴幼儿童玩具",
      slug: "educational-building-blocks-kids",
      productCode: "SKU-T2024-01",
      source: "MANUAL",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/fa16c9e8efc74107a78f2160829d2417.png",
      galleryJson: [
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/72d8482099ed441c93168aae01bc3004.png", sort: 1 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/cef27cc4ab1a45618c89db6ba9f34e8b.png", sort: 2 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/2333e78762fc47028d00fcf309f7d886.png", sort: 3 }
      ],
      shortDescription: "专为低龄宝宝设计的大颗粒积木，防吞咽更安全；色彩鲜艳，激发宝宝想象力与动手能力。",
      sellingPointsJson: [
        { title: "安全", content: "大颗粒防吞咽" },
        { title: "材质", content: "环保ABS无毒无味" },
        { title: "益智", content: "锻炼手眼协调" },
        { title: "创意", content: "百变造型随意拼" }
      ],
      detailContentJson: [
        { type: "text", title: "安全认证", content: "通过国家3C及欧盟CE双重安全认证，边缘圆润无毛刺，呵护宝宝娇嫩小手。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/843755574857459cb207928e5728f8a9.png" },
        { type: "text", title: "收纳设计", content: "附赠大容量收纳桶，培养宝宝玩耍后自主整理的好习惯。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/d3b4d9fb2afb4d088f38a97c2f992030.png" }
      ],
      parameterJson: [
        { group: "产品规格", items: [{ key: "颗粒数", value: "100PCS" }, { key: "适用年龄", value: "18个月及以上" }] },
        { group: "包装信息", items: [{ key: "包装方式", value: "收纳桶装" }, { key: "材质", value: "食品级ABS塑料" }] }
      ],
      tradeInfoJson: { minOrderQty: "10 桶起订", shippingNote: "3天内发货", shipFrom: "澄海, 中国", deliveryDays: 7, supportedRegions: ["Global"], tradeNotice: "量大从优，欢迎咨询" },
      faqJson: [
        { question: "积木可以水洗吗？", answer: "可以的，建议使用温水清洗，不可高温蒸煮。" },
        { question: "容易松动吗？", answer: "咬合紧密适中，既保证拼装稳固，又方便宝宝拆卸。" },
        { question: "和某高兼容吗？", answer: "本产品为标准大颗粒尺寸，与市面上主流大颗粒积木均可兼容。" },
        { question: "有异味吗？", answer: "采用环保原料，打开包装绝对无任何异味。" }
      ],
      ratingAverage: 4.9,
      ratingCount: 380,
      sortWeight: 55,
      timeAnchor: -8,
      updateAnchor: -2
    },
    {
      categoryId: 1,
      name: "女士高腰提臀无缝瑜伽裤 健身长裤",
      slug: "seamless-yoga-leggings-women",
      productCode: "SKU-F2024-02",
      source: "MANUAL",
      status: "ACTIVE",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/1ab0b0f7bd0d4f6a8060418ae4debcba.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a42737867e9c43fe803281dedde3840f.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/d68b4ba139c047a4bb16ec7fef0adb00.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/030cd72b804d4151a74c4bfd10f8bc57.png", sort: 3 }
      ],
      shortDescription: "3D立体剪裁，蜜桃臀线设计；裸感速干面料，四面弹力不紧绷，让你在运动中自由伸展，尽显完美曲线。",
      sellingPointsJson: [
        { title: "提臀", content: "微笑提臀线" },
        { title: "显瘦", content: "高腰收腹设计" },
        { title: "面料", content: "裸感透气速干" },
        { title: "舒适", content: "无缝工艺防摩擦" }
      ],
      detailContentJson: [
        { type: "text", title: "面料科技", content: "采用锦纶与氨纶科学配比，吸湿排汗性能提升50%，告别运动后的黏腻感。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/bfcdda2944db4bf5b0cc4f1e8c60f770.png" },
        { type: "text", title: "细节展示", content: "隐藏式内兜设计，方便存放钥匙、卡片等小物件；裤脚无痕处理，贴合脚踝不起边。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/b1db1f36865c400694ac88ccbbb25ad3.png" }
      ],
      parameterJson: [
        { group: "商品属性", items: [{ key: "腰型", value: "高腰" }, { key: "裤长", value: "九分裤/长裤" }] },
        { group: "适合场景", items: [{ key: "运动类型", value: "瑜伽、跑步、健身、普拉提" }, { key: "季节", value: "四季皆宜" }] }
      ],
      tradeInfoJson: { minOrderQty: "5 件起订", shippingNote: "2天内发货", shipFrom: "义乌, 中国", deliveryDays: 6, supportedRegions: ["US", "EU"], tradeNotice: "支持一件代发" },
      faqJson: [
        { question: "做深蹲会透吗？", answer: "面料厚实且具有高密度编织，深蹲绝对不透，避免尴尬。" },
        { question: "会掉裆吗？", answer: "高腰设计贴合腰腹曲线，运动过程中不易下滑掉裆。" },
        { question: "出汗后会有汗痕吗？", answer: "速干面料能快速将汗水扩散蒸发，深色系几乎看不出汗痕。" },
        { question: "洗了会缩水变形吗？", answer: "优质弹力纤维恢复性好，正常洗涤不会变形缩水。" }
      ],
      ratingAverage: 4.7,
      ratingCount: 265,
      sortWeight: 50,
      timeAnchor: -22,
      updateAnchor: -5
    },
    {
      categoryId: 2,
      name: "智能恒温电热毛巾架 卫生间烘干架",
      slug: "smart-electric-towel-warmer",
      productCode: "SKU-H2024-01",
      source: "MANUAL",
      status: "DRAFT",
      mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/d055ee371d844f70a69d70c07546a9b0.png",
      galleryJson: [
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/ed8550609abd4c40a62dfa31ea5f5780.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/3a94cceb180b47a39c361c222ed24673.png", sort: 2 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/c6e94d39a79647b1960c9f98cd9ce051.png", sort: 3 }
      ],
      shortDescription: "告别潮湿霉味，碳纤维干式发热，快速烘干衣物毛巾；支持手机APP远程操控，杀菌除螨，提升卫浴体验。",
      sellingPointsJson: [
        { title: "发热", content: "碳纤维干加热" },
        { title: "智能", content: "WIFI智联APP控制" },
        { title: "杀菌", content: "55度恒温抑菌" },
        { title: "防水", content: "IPX4级整机防水" }
      ],
      detailContentJson: [
        { type: "text", title: "恒温科技", content: "内置智能温控芯片，精准控制表面温度在50-55度之间，烘干不伤衣物，触碰不烫手。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/ffd95d124b70465987237bd4fe57d255.png" },
        { type: "text", title: "定时模式", content: "支持自由设定工作时长，下班前提前开启，回家即可享受温暖干燥的浴巾。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/47c2e2fb50a64fe381aca2aa4ce37115.png" }
      ],
      parameterJson: [
        { group: "技术参数", items: [{ key: "额定功率", value: "300W" }, { key: "电源线长", value: "1.5米，带漏电保护插头" }] },
        { group: "外观材质", items: [{ key: "主体材质", value: "低碳钢/铝合金" }, { key: "表面工艺", value: "高温静电喷涂" }] }
      ],
      tradeInfoJson: { minOrderQty: "1 套起订", shippingNote: "5天内发货", shipFrom: "温州, 中国", deliveryDays: 10, supportedRegions: ["CN", "EU"], tradeNotice: "插头规格可根据出口国家定制" },
      faqJson: [
        { question: "费电吗？", answer: "非常省电，全天开启约只需1度电。" },
        { question: "需要预留暗线吗？", answer: "支持明线插座供电，也可在装修时预留暗线安装，更加美观。" },
        { question: "只能挂毛巾吗？", answer: "还可以烘干贴身内衣裤、婴儿衣物、袜子等小件物品。" },
        { question: "防漏电安全吗？", answer: "插头自带漏电保护开关，遇异常微弱电流瞬间切断电源，绝对安全。" }
      ],
      ratingAverage: 0,
      ratingCount: 0,
      sortWeight: 45,
      timeAnchor: -3,
      updateAnchor: -1
    },
    {
      categoryId: 3,
      name: "水杨酸收缩毛孔爽肤水 控油净痘",
      slug: "salicylic-acid-pore-toner",
      productCode: "SKU-B2024-02",
      source: "MANUAL",
      status: "INACTIVE",
      mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/f4c6602189a2432492c55b4c54e48abf.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/721cb2968b2b48939686e396b89305ba.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/c0f524756bee4bfda4ec52f27decea74.png", sort: 2 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/426d87306ae0434ba8489b66d77a35f2.png", sort: 3 }
      ],
      shortDescription: "含2%包裹型水杨酸，温和刷酸不刺激；有效溶解深层油脂，疏通毛孔，改善黑头闭口，令肌肤细腻光滑。",
      sellingPointsJson: [
        { title: "祛痘", content: "改善闭口粉刺" },
        { title: "控油", content: "平衡肌肤水油" },
        { title: "细腻", content: "收敛粗大毛孔" },
        { title: "舒缓", content: "复配积雪草精粹" }
      ],
      detailContentJson: [
        { type: "text", title: "科学配方", content: "采用缓释包裹技术，降低水杨酸刺激性的同时延长作用时间，新手小白也可轻松建立耐受。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/989df48246cb4a9988b22b997b9d7085.png" },
        { type: "text", title: "多效合一", content: "除日常拍打吸收外，还可针对局部闭口黑头严重区域进行湿敷，效果更佳。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/ef67e2d0dbf94228bf85c73edfe3508c.png" }
      ],
      parameterJson: [
        { group: "成分信息", items: [{ key: "核心成分", value: "2%水杨酸，北美金缕梅提取物，积雪草提取物" }] },
        { group: "规格说明", items: [{ key: "容量", value: "200ml" }, { key: "适用肤质", value: "油性、混油性及痘痘肌" }] }
      ],
      tradeInfoJson: { minOrderQty: "10 瓶起订", shippingNote: "暂停发货", shipFrom: "广州, 中国", deliveryDays: 0, supportedRegions: [], tradeNotice: "商品包装升级中，暂时下架" },
      faqJson: [
        { question: "白天可以使用吗？", answer: "可以，但水杨酸会增加肌肤对紫外线的敏感度，白天使用后请务必做好防晒。" },
        { question: "敏感肌能用吗？", answer: "建议敏感肌先在耳后测试，无不适后再上脸，使用频率从每周1-2次开始。" },
        { question: "会爆痘吗？", answer: "初期使用可能会加速深层炎症爆发，属于正常疏通过程，坚持使用会逐渐改善。" },
        { question: "可以和其他酸类叠加吗？", answer: "不建议同时与其他果酸、A醇等强功效产品叠加使用，以免损伤肌肤屏障。" }
      ],
      ratingAverage: 4.5,
      ratingCount: 180,
      sortWeight: 40,
      timeAnchor: -120,
      updateAnchor: -100
    },
    {
      categoryId: 5,
      name: "儿童智能早教陪伴机器人 对话故事机",
      slug: "smart-early-education-robot",
      productCode: "SKU-T2024-02",
      source: "MANUAL",
      status: "ACTIVE",
      mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/ae87d2cb47f04b12b8e5c36ee6bf59a0.png",
      galleryJson: [
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/9b03207581a545108eda542427aec06b.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/1a67448b1f8e4e57be5a7bba37d34c42.png", sort: 2 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/80f7b313c4f043009e87afe98b077fde.png", sort: 3 }
      ],
      shortDescription: "集英语启蒙、国学经典、儿歌故事于一体；支持智能语音交互，解答孩子十万个为什么，是孩子的好玩伴。",
      sellingPointsJson: [
        { title: "内容", content: "海量云端资源" },
        { title: "互动", content: "AI智能语音对话" },
        { title: "材质", content: "食品级硅胶耳灯" },
        { title: "操作", content: "微信小程序远程点播" }
      ],
      detailContentJson: [
        { type: "text", title: "智能陪伴", content: "搭载先进的自然语言处理技术，能够精准识别儿童语音，进行趣味横生的对话交流。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/9067682f48dc47bd9c376ec9c4da8807.png" },
        { type: "text", title: "贴心设计", content: "机身圆润无棱角，耳朵部分采用柔光材质，夜晚可作为安抚小夜灯使用。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/eb63f82193f944c3ac01208aa69812de.png" }
      ],
      parameterJson: [
        { group: "硬件参数", items: [{ key: "电池容量", value: "2000mAh" }, { key: "连接方式", value: "Wi-Fi 2.4G" }] },
        { group: "功能特性", items: [{ key: "麦克风", value: "双麦克风阵列，支持3米远场拾音" }, { key: "扬声器", value: "高保真全频喇叭" }] }
      ],
      tradeInfoJson: { minOrderQty: "5 台起订", shippingNote: "2天内发货", shipFrom: "深圳, 中国", deliveryDays: 5, supportedRegions: ["CN", "AS"], tradeNotice: "提供一件代发服务" },
      faqJson: [
        { question: "需要一直连网吗？", answer: "智能对话和点播新内容需要联网，设备也内置了部分本地故事，断网时可播放。" },
        { question: "音质怎么样？", answer: "采用专业级音响腔体设计，声音清晰柔和，保护孩子听力。" },
        { question: "可以发微信消息吗？", answer: "支持，孩子按住语音键可发送微聊消息到家长手机微信。" },
        { question: "资源更新收费吗？", answer: "云端海量早教资源持续免费更新，无需额外购买会员。" }
      ],
      ratingAverage: 4.8,
      ratingCount: 420,
      sortWeight: 35,
      timeAnchor: -35,
      updateAnchor: -15
    },
    {
      categoryId: 1,
      name: "法式复古碎花雪纺连衣裙 收腰显瘦",
      slug: "french-vintage-floral-dress",
      productCode: "SKU-F2024-03",
      source: "MANUAL",
      status: "DRAFT",
      mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/7c5780ca30e74708bb9239a1b3f9fa13.png",
      galleryJson: [
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/59c830957dfc4c5d9370a2c0a4ff74db.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/081d84576ca84e019bb389f37735a772.png", sort: 2 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/58bbef7151f34bd5bf93efa4c59fb99f.png", sort: 3 }
      ],
      shortDescription: "浪漫法式风情，清新淡雅碎花印花；V领设计拉长颈部线条，高收腰版型优化身材比例，飘逸灵动。",
      sellingPointsJson: [
        { title: "版型", content: "X型收腰设计" },
        { title: "面料", content: "亲肤透气雪纺" },
        { title: "领口", content: "气质法式V领" },
        { title: "内衬", content: "防走光顺滑内衬" }
      ],
      detailContentJson: [
        { type: "text", title: "设计亮点", content: "袖口采用精致的微泡泡袖设计，完美遮掩手臂肉肉；裙摆随风摇曳，充满仙气。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/836d0d3f392047c288d10392edb3e2d1.png" },
        { type: "text", title: "搭配建议", content: "搭配一双简约的玛丽珍鞋或小白鞋，再配上编织草帽，轻松驾驭度假出游风。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/037406f4708047b68bf717b26cb6bc64.png" }
      ],
      parameterJson: [
        { group: "商品信息", items: [{ key: "裙长", value: "中长裙" }, { key: "门襟", value: "套头/侧边隐形拉链" }] },
        { group: "洗护说明", items: [{ key: "洗涤", value: "建议冷水轻柔手洗，不可漂白" }, { key: "晾晒", value: "阴凉处悬挂晾干，避免暴晒褪色" }] }
      ],
      tradeInfoJson: { minOrderQty: "3 件起订", shippingNote: "预售中，15天后发货", shipFrom: "杭州, 中国", deliveryDays: 7, supportedRegions: ["Global"], tradeNotice: "新品预售，敬请期待" },
      faqJson: [
        { question: "雪纺材质会透吗？", answer: "裙身自带亲肤顺滑内衬，绝对不会透光。" },
        { question: "领口会容易走光吗？", answer: "V领开口深度经过反复测试，既能展现锁骨又不易走光。" },
        { question: "有弹性吗？", answer: "面料本身无弹，但后背有松紧抽褶设计，包容性强。" },
        { question: "起静电吗？", answer: "内衬采用防静电处理，穿着舒适不易贴腿。" }
      ],
      ratingAverage: 0,
      ratingCount: 0,
      sortWeight: 30,
      timeAnchor: -2,
      updateAnchor: -1
    },
    {
      categoryId: 2,
      name: "全自动感应不锈钢垃圾桶 智能开盖",
      slug: "automatic-sensor-trash-can",
      productCode: "SKU-H2024-02",
      source: "IMPORT_1688",
      status: "ACTIVE",
      mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/3254b43e39f44256bbfdf27ce4c9d7a7.png",
      galleryJson: [
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/53a3d5566f24461bbfffaa427922004c.png", sort: 1 },
        { url: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/54fc9ba933cc4ac79cee30c6a61c5c75.png", sort: 2 },
        { url: "https://www.autocoder.cc/background/zaki_prod/generated/63af1dfa8b63433b84389a552287ea1e.png", sort: 3 }
      ],
      shortDescription: "红外线挥手感应，0.3秒极速开盖，无需触碰更卫生；不锈钢拉丝桶身，防指纹易清洁，密封锁住异味。",
      sellingPointsJson: [
        { title: "感应", content: "0.3秒灵敏开启" },
        { title: "续航", content: "充一次用半年" },
        { title: "材质", content: "防指纹不锈钢" },
        { title: "静音", content: "缓降闭合无噪音" }
      ],
      detailContentJson: [
        { type: "text", title: "多种开盖方式", content: "除了红外感应外，还支持踢碰感应和一键常开模式，满足不同场景下的使用需求。" },
        { type: "image", content: "https://www.autocoder.cc/background/zaki_prod/generated/fda5a37efb4d4167b0728d59073efd7c.png" },
        { type: "text", title: "密封防臭", content: "严密贴合的桶盖设计，有效阻隔垃圾异味散发，同时防止飞虫滋生。" },
        { type: "image", content: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/299d9cb7c3be47db9046e702baeeeb86.png" }
      ],
      parameterJson: [
        { group: "规格参数", items: [{ key: "容量", value: "12L/15L可选" }, { key: "供电方式", value: "USB充电版/电池版" }] },
        { group: "材质工艺", items: [{ key: "桶身材质", value: "430不锈钢" }, { key: "桶盖材质", value: "ABS高强度塑料" }] }
      ],
      tradeInfoJson: { minOrderQty: "5 个起订", shippingNote: "2天内发货", shipFrom: "宁波, 中国", deliveryDays: 6, supportedRegions: ["US", "EU"], tradeNotice: "产品内置锂电池，走特殊物流通道" },
      faqJson: [
        { question: "感应距离是多少？", answer: "感应区域在感应窗上方20-30cm范围内最为灵敏。" },
        { question: "路过会自动打开吗？", answer: "感应角度经过优化，正常走动路过不会误触发。" },
        { question: "内桶可以拿出来洗吗？", answer: "带有独立内桶设计，方便提出倾倒垃圾和水洗清洁。" },
        { question: "电池版用什么电池？", answer: "使用4节5号(AA)电池，日常使用可维持约3-4个月。" }
      ],
      ratingAverage: 4.6,
      ratingCount: 95,
      sortWeight: 25,
      timeAnchor: -50,
      updateAnchor: -10
    }
  ];

  modelIdMap["product"] = new Map<number, string>();

  for (let i = 0; i < productData.length; i++) {
    const data = productData[i];
    const categoryId = modelIdMap["category"].get(data.categoryId);
    const createdAt = addDays(baseDate, data.timeAnchor);
    const updatedAt = addDays(baseDate, data.updateAnchor);

    const record = await prisma.product.upsert({
      where: {
        productCode: data.productCode
      },
      update: {
        categoryId: categoryId,
        name: data.name,
        slug: data.slug,
        source: data.source as any,
        status: data.status as any,
        mainImageUrl: data.mainImageUrl,
        galleryJson: data.galleryJson as any,
        shortDescription: data.shortDescription,
        sellingPointsJson: data.sellingPointsJson as any,
        detailContentJson: data.detailContentJson as any,
        parameterJson: data.parameterJson as any,
        tradeInfoJson: data.tradeInfoJson as any,
        faqJson: data.faqJson as any,
        ratingAverage: data.ratingAverage,
        ratingCount: data.ratingCount,
        sortWeight: data.sortWeight,
        updatedAt: updatedAt
      },
      create: {
        categoryId: categoryId,
        name: data.name,
        slug: data.slug,
        productCode: data.productCode,
        source: data.source as any,
        status: data.status as any,
        mainImageUrl: data.mainImageUrl,
        galleryJson: data.galleryJson as any,
        shortDescription: data.shortDescription,
        sellingPointsJson: data.sellingPointsJson as any,
        detailContentJson: data.detailContentJson as any,
        parameterJson: data.parameterJson as any,
        tradeInfoJson: data.tradeInfoJson as any,
        faqJson: data.faqJson as any,
        ratingAverage: data.ratingAverage,
        ratingCount: data.ratingCount,
        sortWeight: data.sortWeight,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });

    modelIdMap["product"].set(i, record.id);
  }
}
async function seedcart(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  // parent sysuser index:
  // 0: admin@globaltrade.com (ADMIN, ACTIVE) - Skip for cart as usually customer has cart
  // 1: m.chen@example.com (CUSTOMER, ACTIVE)
  // 2: j.wilson@example.com (CUSTOMER, ACTIVE)
  // 3: t.sato@example.com (CUSTOMER, ACTIVE)
  // 4: sarah.connor@example.com (CUSTOMER, ACTIVE)
  // 5: jason_bourne@example.com (CUSTOMER, DISABLED) - Skip disabled

  const cartData = [
    {
      parentIndex: 1, // m.chen
      timeAnchor: -14,
      updatedAnchor: -1
    },
    {
      parentIndex: 2, // j.wilson
      timeAnchor: -9,
      updatedAnchor: -2
    },
    {
      parentIndex: 3, // t.sato
      timeAnchor: -4,
      updatedAnchor: 0
    },
    {
      parentIndex: 4, // sarah.connor
      timeAnchor: -40,
      updatedAnchor: -5
    }
  ];

  modelIdMap["cart"] = new Map<number, string>();

  for (let i = 0; i < cartData.length; i++) {
    const data = cartData[i];
    const accountId = modelIdMap["sysuser"].get(data.parentIndex);
    
    if (!accountId) continue;

    const createdAt = addDays(baseDate, data.timeAnchor);
    const updatedAt = addDays(baseDate, data.updatedAnchor);

    const record = await prisma.cart.create({
      data: {
        accountId: accountId,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });

    modelIdMap["cart"].set(i, record.id);
  }
}
async function seedimporttask(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));

  const importTaskData = [
    {
      taskName: "1688 智能数码及配件批量导入",
      status: "RUNNING",
      sourceLinkCount: 200,
      successCount: 170,
      failureCount: 0,
      progressPercent: 85,
      markupRate: 30.50,
      defaultStatus: "DRAFT",
      stockStrategyJson: { type: "fixed", stock: 100 },
      creatorIndex: 0, // 超级管理员
      categoryIndex: 0, // 电子数码
      timeAnchor: -3,
      updateAnchor: -1
    },
    {
      taskName: "秋冬男士保暖夹克大类采集",
      status: "COMPLETED",
      sourceLinkCount: 100,
      successCount: 95,
      failureCount: 5,
      progressPercent: 100,
      markupRate: 50.00,
      defaultStatus: "ACTIVE",
      stockStrategyJson: { type: "random", min: 50, max: 200 },
      creatorIndex: 0, // 超级管理员
      categoryIndex: 1, // 时尚服饰
      timeAnchor: -15,
      updateAnchor: -5
    },
    {
      taskName: "极简牛皮钱夹与配饰上架任务",
      status: "FAILED",
      sourceLinkCount: 50,
      successCount: 5,
      failureCount: 7,
      progressPercent: 15,
      markupRate: 100.00,
      defaultStatus: "INACTIVE",
      stockStrategyJson: { type: "percentage", ratio: 0.8 },
      creatorIndex: 0, // 超级管理员
      categoryIndex: 1, // 时尚服饰
      timeAnchor: -20,
      updateAnchor: -18
    },
    {
      taskName: "夏日清凉系列家居用品批量采集",
      status: "PENDING",
      sourceLinkCount: 150,
      successCount: 0,
      failureCount: 0,
      progressPercent: 0,
      markupRate: 40.00,
      defaultStatus: "DRAFT",
      stockStrategyJson: { type: "fixed", stock: 500 },
      creatorIndex: 0, // 超级管理员
      categoryIndex: 2, // 家居生活
      timeAnchor: -5,
      updateAnchor: -4
    }
  ];

  modelIdMap["importtask"] = new Map<number, string>();

  for (let i = 0; i < importTaskData.length; i++) {
    const data = importTaskData[i];
    
    // 获取父表 ID，确保能取到有效的 ID
    const creatorId = modelIdMap["sysuser"]?.get(data.creatorIndex);
    const categoryId = modelIdMap["category"]?.get(data.categoryIndex);

    if (!creatorId) {
      console.warn(`[seedimporttask] 未找到 creatorIndex 为 ${data.creatorIndex} 的 sysuser，跳过创建`);
      continue;
    }

    const createdAt = addDays(baseDate, data.timeAnchor);
    const updatedAt = addDays(baseDate, data.updateAnchor);

    const record = await prisma.importtask.create({
      data: {
        taskName: data.taskName,
        status: data.status as any,
        sourceLinkCount: data.sourceLinkCount,
        successCount: data.successCount,
        failureCount: data.failureCount,
        progressPercent: data.progressPercent,
        markupRate: data.markupRate,
        defaultStatus: data.defaultStatus as any,
        defaultCategoryId: categoryId || null,
        stockStrategyJson: data.stockStrategyJson,
        creatorId: creatorId,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });

    modelIdMap["importtask"].set(i, record.id);
  }
}
async function seedproductsku(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const skuData = [
    {
      parentIndex: 0,
      skuCode: "SKU-W2024-01-DEFAULT",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/f3265d471aa04c8aa8519f81df959003.png",
      price: 135.0,
      originalPrice: 213.5,
      stock: 150,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "曜石黑" },
        { name: "版本", value: "标准版" }
      ],
      deliveryDays: 3,
      weightKg: 0.15,
      volumeM3: 0.001,
      timeAnchor: -15,
      updateAnchor: -2
    },
    {
      parentIndex: 1,
      skuCode: "SKU-H2024-02-DEFAULT",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/0d8dbc0283304aafa2f7f348aa0bd5d8.png",
      price: 252.0,
      originalPrice: 418.9,
      stock: 80,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "星空灰" },
        { name: "版本", value: "降噪升级版" }
      ],
      deliveryDays: 5,
      weightKg: 0.4,
      volumeM3: 0.005,
      timeAnchor: -20,
      updateAnchor: -5
    },
    {
      parentIndex: 4,
      skuCode: "SKU-HD-009",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a1893604678c41f7940b208d13269806.png",
      price: 129.0,
      originalPrice: 199.0,
      stock: 5,
      stockStatus: "LOW_STOCK",
      attributeJson: [
        { name: "颜色", value: "曜石黑" },
        { name: "规格", value: "带收纳盒" }
      ],
      deliveryDays: 4,
      weightKg: 0.3,
      volumeM3: 0.004,
      timeAnchor: -45,
      updateAnchor: -15
    },
    {
      parentIndex: 5,
      skuCode: "SKU-SW-102",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/802a9d73c4dd49deafd01ca21d643fbe.png",
      price: 89.99,
      originalPrice: 129.99,
      stock: 3,
      stockStatus: "LOW_STOCK",
      attributeJson: [
        { name: "颜色", value: "硅胶黑" },
        { name: "表盘", value: "46mm" }
      ],
      deliveryDays: 2,
      weightKg: 0.2,
      volumeM3: 0.002,
      timeAnchor: -60,
      updateAnchor: -20
    },
    {
      parentIndex: 0,
      skuCode: "SKU-W2024-01-BLUE",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/568f8ac946b14553ba3983649268f7dc.png",
      price: 135.0,
      originalPrice: 213.5,
      stock: 120,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "深海蓝" },
        { name: "版本", value: "标准版" }
      ],
      deliveryDays: 3,
      weightKg: 0.15,
      volumeM3: 0.001,
      timeAnchor: -14,
      updateAnchor: -2
    },
    {
      parentIndex: 1,
      skuCode: "SKU-H2024-02-WHITE",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/570cced00bd6454384382645f17a1307.png",
      price: 252.0,
      originalPrice: 418.9,
      stock: 60,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "珍珠白" },
        { name: "版本", value: "降噪升级版" }
      ],
      deliveryDays: 5,
      weightKg: 0.4,
      volumeM3: 0.005,
      timeAnchor: -19,
      updateAnchor: -4
    },
    {
      parentIndex: 2,
      skuCode: "SKU-P2024-03-SILVER",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a7c1b76274bf4af6b98caf900a342efb.png",
      price: 89.0,
      originalPrice: 159.0,
      stock: 200,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "太空银" },
        { name: "容量", value: "20000mAh" }
      ],
      deliveryDays: 4,
      weightKg: 0.45,
      volumeM3: 0.002,
      timeAnchor: -30,
      updateAnchor: -10
    },
    {
      parentIndex: 2,
      skuCode: "SKU-P2024-03-BLACK",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/3425d0a54a0c411eafcdafdf90884293.png",
      price: 89.0,
      originalPrice: 159.0,
      stock: 0,
      stockStatus: "OUT_OF_STOCK",
      attributeJson: [
        { name: "颜色", value: "陨石黑" },
        { name: "容量", value: "20000mAh" }
      ],
      deliveryDays: 7,
      weightKg: 0.45,
      volumeM3: 0.002,
      timeAnchor: -28,
      updateAnchor: -9
    },
    {
      parentIndex: 3,
      skuCode: "SKU-C2024-04-WHITE",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/8c3ebb0f419544f28e41d1e8d596fd3f.png",
      price: 158.0,
      originalPrice: 258.0,
      stock: 90,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "纯净白" },
        { name: "存储", value: "无内存卡" }
      ],
      deliveryDays: 3,
      weightKg: 0.35,
      volumeM3: 0.003,
      timeAnchor: -12,
      updateAnchor: -1
    },
    {
      parentIndex: 3,
      skuCode: "SKU-C2024-04-64G",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/a3a2dc858f6241dd9191a9b2fd32e4c9.png",
      price: 188.0,
      originalPrice: 298.0,
      stock: 45,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "纯净白" },
        { name: "存储", value: "带64G内存卡" }
      ],
      deliveryDays: 3,
      weightKg: 0.36,
      volumeM3: 0.003,
      timeAnchor: -11,
      updateAnchor: -1
    },
    {
      parentIndex: 4,
      skuCode: "SKU-HD-010",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/c908011370004a34b953bfca05aff175.png",
      price: 129.0,
      originalPrice: 199.0,
      stock: 0,
      stockStatus: "OUT_OF_STOCK",
      attributeJson: [
        { name: "颜色", value: "樱花粉" },
        { name: "规格", value: "带收纳盒" }
      ],
      deliveryDays: 4,
      weightKg: 0.3,
      volumeM3: 0.004,
      timeAnchor: -40,
      updateAnchor: -14
    },
    {
      parentIndex: 5,
      skuCode: "SKU-SW-103",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/aa2ef498d9fb40a28d6e8383f41d3d38.png",
      price: 99.99,
      originalPrice: 149.99,
      stock: 12,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "真皮棕" },
        { name: "表盘", value: "46mm" }
      ],
      deliveryDays: 2,
      weightKg: 0.22,
      volumeM3: 0.002,
      timeAnchor: -55,
      updateAnchor: -18
    },
    {
      parentIndex: 7,
      skuCode: "SKU-F2024-01-GREY-M",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/922eedf9e3714f9d828484329c112265.png",
      price: 145.0,
      originalPrice: 229.0,
      stock: 60,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "花灰" },
        { name: "尺码", value: "M" }
      ],
      deliveryDays: 3,
      weightKg: 0.5,
      volumeM3: 0.01,
      timeAnchor: -25,
      updateAnchor: -12
    },
    {
      parentIndex: 7,
      skuCode: "SKU-F2024-01-GREY-L",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/4c39175fcb15425e9f3eb7ef04b155c7.png",
      price: 145.0,
      originalPrice: 229.0,
      stock: 45,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "花灰" },
        { name: "尺码", value: "L" }
      ],
      deliveryDays: 3,
      weightKg: 0.52,
      volumeM3: 0.01,
      timeAnchor: -24,
      updateAnchor: -11
    },
    {
      parentIndex: 7,
      skuCode: "SKU-F2024-01-BLACK-L",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/393b23d0ba2343d08e1d149ef5e94fcb.png",
      price: 145.0,
      originalPrice: 229.0,
      stock: 8,
      stockStatus: "LOW_STOCK",
      attributeJson: [
        { name: "颜色", value: "经典黑" },
        { name: "尺码", value: "L" }
      ],
      deliveryDays: 3,
      weightKg: 0.52,
      volumeM3: 0.01,
      timeAnchor: -23,
      updateAnchor: -10
    },
    {
      parentIndex: 8,
      skuCode: "SKU-B2024-01-150",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/e14231f2c6ed495192951d2b09cbfa79.png",
      price: 49.9,
      originalPrice: 89.0,
      stock: 300,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "规格", value: "150ml" },
        { name: "类型", value: "单瓶装" }
      ],
      deliveryDays: 2,
      weightKg: 0.2,
      volumeM3: 0.001,
      timeAnchor: -40,
      updateAnchor: -8
    },
    {
      parentIndex: 8,
      skuCode: "SKU-B2024-01-300",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/887c55bcee014cd390f6a476e0acbef6.png",
      price: 85.0,
      originalPrice: 158.0,
      stock: 150,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "规格", value: "150ml*2" },
        { name: "类型", value: "双瓶特惠" }
      ],
      deliveryDays: 2,
      weightKg: 0.4,
      volumeM3: 0.002,
      timeAnchor: -38,
      updateAnchor: -7
    },
    {
      parentIndex: 9,
      skuCode: "SKU-T2024-01-100",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/ec96c4636d694a94a8f5af9b40457927.png",
      price: 68.0,
      originalPrice: 118.0,
      stock: 80,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颗粒数", value: "100颗粒" },
        { name: "包装", value: "收纳桶装" }
      ],
      deliveryDays: 3,
      weightKg: 1.2,
      volumeM3: 0.015,
      timeAnchor: -8,
      updateAnchor: -2
    },
    {
      parentIndex: 9,
      skuCode: "SKU-T2024-01-200",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/8bde67031389411c88a64e6677812435.png",
      price: 118.0,
      originalPrice: 198.0,
      stock: 40,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颗粒数", value: "200颗粒" },
        { name: "包装", value: "大号桶装" }
      ],
      deliveryDays: 3,
      weightKg: 2.2,
      volumeM3: 0.025,
      timeAnchor: -7,
      updateAnchor: -1
    },
    {
      parentIndex: 10,
      skuCode: "SKU-F2024-02-BLACK-S",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/22d9031e1a2f4fdcac5609b6639c0eb5.png",
      price: 79.0,
      originalPrice: 139.0,
      stock: 90,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "星夜黑" },
        { name: "尺码", value: "S" },
        { name: "裤长", value: "九分裤" }
      ],
      deliveryDays: 2,
      weightKg: 0.25,
      volumeM3: 0.003,
      timeAnchor: -22,
      updateAnchor: -5
    },
    {
      parentIndex: 10,
      skuCode: "SKU-F2024-02-BLACK-M",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/212227e7ce1f4b3992a910d09de8dff1.png",
      price: 79.0,
      originalPrice: 139.0,
      stock: 110,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "星夜黑" },
        { name: "尺码", value: "M" },
        { name: "裤长", value: "九分裤" }
      ],
      deliveryDays: 2,
      weightKg: 0.25,
      volumeM3: 0.003,
      timeAnchor: -21,
      updateAnchor: -4
    },
    {
      parentIndex: 10,
      skuCode: "SKU-F2024-02-BLUE-M",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9a649cceadf041e3babf7c094b3d2bf2.png",
      price: 79.0,
      originalPrice: 139.0,
      stock: 6,
      stockStatus: "LOW_STOCK",
      attributeJson: [
        { name: "颜色", value: "雾霾蓝" },
        { name: "尺码", value: "M" },
        { name: "裤长", value: "九分裤" }
      ],
      deliveryDays: 2,
      weightKg: 0.25,
      volumeM3: 0.003,
      timeAnchor: -20,
      updateAnchor: -3
    },
    {
      parentIndex: 13,
      skuCode: "SKU-T2024-02-BLUE",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/bbc53213262840fab1510ba9132abdf8.png",
      price: 169.0,
      originalPrice: 299.0,
      stock: 45,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "天空蓝" },
        { name: "版本", value: "WIFI智能版" }
      ],
      deliveryDays: 2,
      weightKg: 0.8,
      volumeM3: 0.008,
      timeAnchor: -35,
      updateAnchor: -15
    },
    {
      parentIndex: 13,
      skuCode: "SKU-T2024-02-PINK",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/16f95d01af5e4a7a89793865732e5532.png",
      price: 169.0,
      originalPrice: 299.0,
      stock: 0,
      stockStatus: "OUT_OF_STOCK",
      attributeJson: [
        { name: "颜色", value: "樱花粉" },
        { name: "版本", value: "WIFI智能版" }
      ],
      deliveryDays: 5,
      weightKg: 0.8,
      volumeM3: 0.008,
      timeAnchor: -34,
      updateAnchor: -14
    },
    {
      parentIndex: 15,
      skuCode: "SKU-H2024-02-12L",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/f13b2b7dff5c45ffa8567d0a0dbd0d32.png",
      price: 88.0,
      originalPrice: 168.0,
      stock: 75,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "容量", value: "12L" },
        { name: "供电", value: "电池版" }
      ],
      deliveryDays: 3,
      weightKg: 1.5,
      volumeM3: 0.02,
      timeAnchor: -50,
      updateAnchor: -10
    },
    {
      parentIndex: 15,
      skuCode: "SKU-H2024-02-15L",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/630628a399574e6fade54735a8e82d5f.png",
      price: 108.0,
      originalPrice: 198.0,
      stock: 40,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "容量", value: "15L" },
        { name: "供电", value: "USB充电版" }
      ],
      deliveryDays: 3,
      weightKg: 1.8,
      volumeM3: 0.025,
      timeAnchor: -48,
      updateAnchor: -8
    },
    {
      parentIndex: 15,
      skuCode: "SKU-H2024-02-15L-W",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/1d4e3ec64dd44d15b1d3dfa4429a6f1c.png",
      price: 108.0,
      originalPrice: 198.0,
      stock: 4,
      stockStatus: "LOW_STOCK",
      attributeJson: [
        { name: "容量", value: "15L" },
        { name: "供电", value: "USB充电版" },
        { name: "颜色", value: "纯白" }
      ],
      deliveryDays: 3,
      weightKg: 1.8,
      volumeM3: 0.025,
      timeAnchor: -45,
      updateAnchor: -7
    },
    {
      parentIndex: 2,
      skuCode: "SKU-P2024-03-GOLD",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/9edd01df26a241eaa07ade5c773e73e4.png",
      price: 89.0,
      originalPrice: 159.0,
      stock: 0,
      stockStatus: "OUT_OF_STOCK",
      attributeJson: [
        { name: "颜色", value: "香槟金" },
        { name: "容量", value: "20000mAh" }
      ],
      deliveryDays: 8,
      weightKg: 0.45,
      volumeM3: 0.002,
      timeAnchor: -25,
      updateAnchor: -6
    },
    {
      parentIndex: 3,
      skuCode: "SKU-C2024-04-128G",
      imageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/a30bac492fe94736a040abeff84a1140.png",
      price: 218.0,
      originalPrice: 358.0,
      stock: 25,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "纯净白" },
        { name: "存储", value: "带128G内存卡" }
      ],
      deliveryDays: 3,
      weightKg: 0.36,
      volumeM3: 0.003,
      timeAnchor: -10,
      updateAnchor: -1
    },
    {
      parentIndex: 7,
      skuCode: "SKU-F2024-01-GREY-XL",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/bdc84c679419481a9822a86e7c29d0a8.png",
      price: 145.0,
      originalPrice: 229.0,
      stock: 35,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "花灰" },
        { name: "尺码", value: "XL" }
      ],
      deliveryDays: 3,
      weightKg: 0.54,
      volumeM3: 0.012,
      timeAnchor: -22,
      updateAnchor: -9
    },
    {
      parentIndex: 10,
      skuCode: "SKU-F2024-02-BLACK-L",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/b4201f21821948a99ef606906acdca29.png",
      price: 79.0,
      originalPrice: 139.0,
      stock: 5,
      stockStatus: "LOW_STOCK",
      attributeJson: [
        { name: "颜色", value: "星夜黑" },
        { name: "尺码", value: "L" },
        { name: "裤长", value: "九分裤" }
      ],
      deliveryDays: 2,
      weightKg: 0.26,
      volumeM3: 0.003,
      timeAnchor: -19,
      updateAnchor: -2
    },
    {
      parentIndex: 13,
      skuCode: "SKU-T2024-02-YELLOW",
      imageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/22ef0d3406074db29b2dc64624a7f877.png",
      price: 169.0,
      originalPrice: 299.0,
      stock: 30,
      stockStatus: "IN_STOCK",
      attributeJson: [
        { name: "颜色", value: "柠檬黄" },
        { name: "版本", value: "WIFI智能版" }
      ],
      deliveryDays: 2,
      weightKg: 0.8,
      volumeM3: 0.008,
      timeAnchor: -32,
      updateAnchor: -12
    }
  ];

  modelIdMap["productsku"] = new Map<number, string>();

  for (let i = 0; i < skuData.length; i++) {
    const data = skuData[i];
    const productId = modelIdMap["product"].get(data.parentIndex);
    const createdAt = addDays(baseDate, data.timeAnchor);
    const updatedAt = addDays(baseDate, data.updateAnchor);

    const record = await prisma.productsku.create({
      data: {
        productId: productId,
        skuCode: data.skuCode,
        imageUrl: data.imageUrl,
        price: data.price,
        originalPrice: data.originalPrice,
        stock: data.stock,
        stockStatus: data.stockStatus as any,
        attributeJson: data.attributeJson,
        deliveryDays: data.deliveryDays,
        weightKg: data.weightKg,
        volumeM3: data.volumeM3,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });

    modelIdMap["productsku"].set(i, record.id);
  }
}
async function seedimporttaskitem(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  // 1688 task (index 0) status: RUNNING
  // jacket task (index 1) status: COMPLETED
  // wallet task (index 2) status: FAILED
  // home task (index 3) status: PENDING

  const importTaskItemData = [
    {
      importTaskIndex: 0,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/701234567890.html",
      parsedName: "新款TWS真无线蓝牙耳机 迷你隐形 运动降噪入耳式",
      parsedMainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/03b32667c323467aa8bfef4f9bd79a16.png",
      parsedPriceMin: 15.50,
      parsedPriceMax: 22.00,
      specSummaryJson: [
        { name: "颜色", values: ["幻夜黑", "冰霜白", "猛男粉"] },
        { name: "版本", values: ["标准版", "旗舰降噪版"] }
      ],
      previewDataJson: {
        name: "新款TWS真无线蓝牙耳机 迷你隐形 运动降噪入耳式",
        categoryId: null,
        price: 28.50,
        mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/d7b643a376f745f48d933d9afc1928f4.png",
        shortDescription: "TWS真无线设计，迷你轻巧，无感佩戴，运动狂甩不掉。内置智能降噪芯片，有效过滤环境杂音，带来清晰通话体验。持久续航，配合充电仓可使用一整天。"
      },
      isSelected: true,
      importedProductIndex: 4, // 对应耳机商品
      failureReason: null,
      timeAnchor: -2,
      updateAnchor: -1
    },
    {
      importTaskIndex: 0,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/702345678901.html",
      parsedName: "适用苹果15手机壳 磁吸透明防摔保护套",
      parsedMainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/8676e649c07e464abbaa559d273c0bc1.png",
      parsedPriceMin: 8.80,
      parsedPriceMax: 12.50,
      specSummaryJson: [
        { name: "适用型号", values: ["iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max"] },
        { name: "款式", values: ["超清透明", "磨砂黑"] }
      ],
      previewDataJson: {
        name: "适用苹果15手机壳 磁吸透明防摔保护套",
        categoryId: null,
        price: 16.50,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/8a6059b8340d4252b30de2c47e162980.png",
        shortDescription: "高透光率PC背板，还原裸机色彩；边框采用高弹力TPU材质，四角气囊防摔设计，全面保护手机。支持Magsafe磁吸充电，精准对孔，手感舒适。"
      },
      isSelected: false,
      importedProductIndex: null,
      failureReason: "解析失败：商品详情页数据结构变更，无法提取图文详情内容，需人工复核或更新解析规则",
      timeAnchor: -2,
      updateAnchor: -2
    },
    {
      importTaskIndex: 0,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/703456789012.html",
      parsedName: "PD20W快充头 Type-C迷你充电器 适用苹果安卓",
      parsedMainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/cd5bf47ee1d04c5bb1044e6f03c2f5e1.png",
      parsedPriceMin: 12.00,
      parsedPriceMax: 15.00,
      specSummaryJson: [
        { name: "插头规格", values: ["国标", "美规", "欧规"] },
        { name: "颜色", values: ["白色", "黑色"] }
      ],
      previewDataJson: {
        name: "PD20W快充头 Type-C迷你充电器 适用苹果安卓",
        categoryId: null,
        price: 19.50,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/0533c3dff1344577aba5497c5c98528c.png",
        shortDescription: "PD 20W大功率快充，30分钟可充至60%电量；体积小巧便携，折叠插脚设计，不占插座空间；内置多重安全防护芯片，过流、过压、短路保护，充电更安心。"
      },
      isSelected: true,
      importedProductIndex: null,
      failureReason: null,
      timeAnchor: -1,
      updateAnchor: -1
    },
    {
      importTaskIndex: 1,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/801234567890.html",
      parsedName: "秋冬新款男士夹克 摇粒绒立领外套 休闲保暖防风衣",
      parsedMainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/9885ad43b63f4394828af5dd0f915d91.png",
      parsedPriceMin: 55.00,
      parsedPriceMax: 65.00,
      specSummaryJson: [
        { name: "颜色", values: ["藏青色", "军绿色", "卡其色"] },
        { name: "尺码", values: ["M", "L", "XL", "2XL", "3XL"] }
      ],
      previewDataJson: {
        name: "秋冬新款男士夹克 摇粒绒立领外套 休闲保暖防风衣",
        categoryId: null,
        price: 99.00,
        mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/f9def8d4e6064af3b4b18f6639b6ace1.png",
        shortDescription: "采用高密度防风面料，内里复合细密摇粒绒，锁温保暖效果极佳；经典立领设计，修身版型，穿着挺括有型，适合秋冬季日常通勤与户外休闲穿着。"
      },
      isSelected: true,
      importedProductIndex: null,
      failureReason: null,
      timeAnchor: -10,
      updateAnchor: -5
    },
    {
      importTaskIndex: 1,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/802345678901.html",
      parsedName: "加厚羊羔绒牛仔外套男 冬季复古机车夹克 棉衣",
      parsedMainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/24deba598a124a2abd9e33a488209ef7.png",
      parsedPriceMin: 85.00,
      parsedPriceMax: 95.00,
      specSummaryJson: [
        { name: "颜色", values: ["复古蓝", "烟灰黑"] },
        { name: "尺码", values: ["L", "XL", "2XL", "3XL"] }
      ],
      previewDataJson: {
        name: "加厚羊羔绒牛仔外套男 冬季复古机车夹克 棉衣",
        categoryId: null,
        price: 139.00,
        mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/d79bfc3e460d4eb084bcb8e0aa06bc16.png",
        shortDescription: "优质水洗牛仔面料，耐磨抗风；内衬全面覆盖厚实羊羔绒，柔软亲肤，抵御严寒；重工金属纽扣，机车风格剪裁，彰显硬汉本色，冬季出街必备单品。"
      },
      isSelected: true,
      importedProductIndex: null,
      failureReason: null,
      timeAnchor: -9,
      updateAnchor: -5
    },
    {
      importTaskIndex: 1,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/803456789012.html",
      parsedName: "灯芯绒翻领夹克衫男士 秋季休闲薄款外套 青年潮流",
      parsedMainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/fd01309470234981af435c32d41424fc.png",
      parsedPriceMin: 45.00,
      parsedPriceMax: 50.00,
      specSummaryJson: [
        { name: "颜色", values: ["焦糖色", "深棕色", "米白色"] },
        { name: "尺码", values: ["M", "L", "XL", "2XL"] }
      ],
      previewDataJson: {
        name: "灯芯绒翻领夹克衫男士 秋季休闲薄款外套 青年潮流",
        categoryId: null,
        price: 75.00,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/20be04587bb34a379f3850ccb5ec9ce0.png",
        shortDescription: "精选细坑条灯芯绒面料，质地柔软，光泽复古；简约翻领设计，百搭不挑人；宽松落肩版型，包容各种身材，轻松打造日系文艺复古穿搭风格。"
      },
      isSelected: false,
      importedProductIndex: null,
      failureReason: "图片下载失败：部分主图及详情页图片由于网络原因或来源服务器防盗链限制未能成功下载",
      timeAnchor: -8,
      updateAnchor: -8
    },
    {
      importTaskIndex: 2,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/901234567890.html",
      parsedName: "头层牛皮男士短款钱包 真皮横款钱夹 多卡位驾驶证套",
      parsedMainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/78e928aacf374059a68f1094b6730a8f.png",
      parsedPriceMin: 28.00,
      parsedPriceMax: 35.00,
      specSummaryJson: [
        { name: "颜色", values: ["经典黑", "咖啡色", "复古棕"] },
        { name: "款式", values: ["横款", "竖款"] }
      ],
      previewDataJson: {
        name: "头层牛皮男士短款钱包 真皮横款钱夹 多卡位驾驶证套",
        categoryId: null,
        price: 58.00,
        mainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a7707e8d3a69436282b067406ceb2be7.png",
        shortDescription: "甄选优质头层牛皮，皮面细腻光泽，手感柔软舒适；科学合理的内部空间划分，包含大钞位、多个银行卡位及独立相片位，满足日常出行收纳需求。"
      },
      isSelected: false,
      importedProductIndex: null,
      failureReason: "库存状态异常：1688来源商品页面显示该商品处于缺货或已下架状态，无法执行正常导入流程",
      timeAnchor: -19,
      updateAnchor: -19
    },
    {
      importTaskIndex: 2,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/902345678901.html",
      parsedName: "男士商务真皮皮带 自动扣牛皮腰带 青年百搭裤带",
      parsedMainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/38b984a69f434ea992573de79bf71568.png",
      parsedPriceMin: 22.00,
      parsedPriceMax: 28.00,
      specSummaryJson: [
        { name: "扣头样式", values: ["枪色方扣", "金色圆扣", "银色拉丝"] },
        { name: "长度", values: ["110cm", "115cm", "120cm", "125cm"] }
      ],
      previewDataJson: {
        name: "男士商务真皮皮带 自动扣牛皮腰带 青年百搭裤带",
        categoryId: null,
        price: 49.00,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/8c53ea1749ef47b69d59d1009a018b3d.png",
        shortDescription: "合金自动扣头，坚固耐磨不褪色，齿槽咬合紧密；带身选用二层牛皮材质，柔韧耐折，纹理清晰自然；简约商务风格，适合搭配西装或休闲长裤。"
      },
      isSelected: false,
      importedProductIndex: null,
      failureReason: "数据解析异常：未能正确提取规格价格表，可能是由于商品使用了非标准的SKU组合形式",
      timeAnchor: -18,
      updateAnchor: -18
    },
    {
      importTaskIndex: 2,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/903456789012.html",
      parsedName: "极简防盗刷铝合金卡包 RFID屏蔽名片盒 创意信用卡夹",
      parsedMainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/7c80512eaee942df8ff2d71262d6fb2c.png",
      parsedPriceMin: 18.00,
      parsedPriceMax: 20.00,
      specSummaryJson: [
        { name: "颜色", values: ["拉丝黑", "太空银", "玫瑰金"] }
      ],
      previewDataJson: {
        name: "极简防盗刷铝合金卡包 RFID屏蔽名片盒 创意信用卡夹",
        categoryId: null,
        price: 36.00,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/c9995b733f634814adb24f9ee73da0fb.png",
        shortDescription: "采用航空级铝合金材质，坚固防压；内置RFID屏蔽层，有效防止NFC设备恶意读取信用卡信息；一键式弹出设计，取卡便捷，可容纳6张标准卡片。"
      },
      isSelected: true,
      importedProductIndex: null, // 未成功生成商品
      failureReason: "任务终止：由于任务配置错误或系统异常中断，该记录未能进入商品创建环节",
      timeAnchor: -18,
      updateAnchor: -18
    },
    {
      importTaskIndex: 3,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/100123456789.html",
      parsedName: "夏季凉感冰丝夏凉被 空调被 可机洗双人薄被子",
      parsedMainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/e980f421b1914690ad73c9a3d6955166.png",
      parsedPriceMin: 35.00,
      parsedPriceMax: 55.00,
      specSummaryJson: [
        { name: "花色", values: ["北欧极简", "清新绿叶", "可爱萌宠"] },
        { name: "尺寸", values: ["150x200cm", "180x220cm", "200x230cm"] }
      ],
      previewDataJson: {
        name: "夏季凉感冰丝夏凉被 空调被 可机洗双人薄被子",
        categoryId: null,
        price: 65.00,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/d934a6b66e0b49b3aa070348c2ca9da9.png",
        shortDescription: "接触瞬间凉感黑科技面料，能迅速导散体表热量，带来整夜清凉睡眠；整张羽丝棉填充，轻盈透气不压身；支持水洗机洗，不变形不结团，清洁打理更方便。"
      },
      isSelected: false,
      importedProductIndex: null,
      failureReason: null, // PENDING 状态
      timeAnchor: -4,
      updateAnchor: -4
    },
    {
      importTaskIndex: 3,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/100234567890.html",
      parsedName: "驱蚊液电热蚊香液 无味婴儿孕妇可用 防蚊液补充装",
      parsedMainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/ff5ce93d4dbd47e3b535cae6c298a928.png",
      parsedPriceMin: 5.50,
      parsedPriceMax: 15.00,
      specSummaryJson: [
        { name: "套餐类型", values: ["单瓶装", "三瓶装", "三瓶+加热器"] }
      ],
      previewDataJson: {
        name: "驱蚊液电热蚊香液 无味婴儿孕妇可用 防蚊液补充装",
        categoryId: null,
        price: 18.00,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/97222d9a1b554d3dab558a08ccd995a6.png",
        shortDescription: "温和驱蚊配方，无烟无灰无刺鼻气味，专为母婴人群研发；采用优质芯棒，挥发均匀稳定，单瓶可持续使用约40晚；有效驱赶各类蚊虫，守护全家安稳睡眠。"
      },
      isSelected: false,
      importedProductIndex: null,
      failureReason: null,
      timeAnchor: -4,
      updateAnchor: -4
    },
    {
      importTaskIndex: 3,
      operatorIndex: 0,
      sourceUrl: "https://detail.1688.com/offer/100345678901.html",
      parsedName: "便携式挂脖小风扇 USB充电迷你无叶风扇 户外运动降温神器",
      parsedMainImageUrl: "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/c5a36a156b0b4b568180d34ea330913e.png",
      parsedPriceMin: 18.50,
      parsedPriceMax: 25.00,
      specSummaryJson: [
        { name: "颜色", values: ["珍珠白", "樱花粉", "薄荷绿"] },
        { name: "电池容量", values: ["2000mAh", "4000mAh"] }
      ],
      previewDataJson: {
        name: "便携式挂脖小风扇 USB充电迷你无叶风扇 户外运动降温神器",
        categoryId: null,
        price: 35.00,
        mainImageUrl: "https://www.autocoder.cc/background/zaki_prod/generated/2e8ecdd6a7c54e629c960b7106434023.png",
        shortDescription: "全新无叶设计，防绞发更安全；双涡轮强劲聚风，三档风力调节，瞬间带来全方位清凉体验；人体工学U型颈托，佩戴舒适无负担；大容量电池，长效续航。"
      },
      isSelected: false,
      importedProductIndex: null,
      failureReason: null,
      timeAnchor: -3,
      updateAnchor: -3
    }
  ];

  modelIdMap["importtaskitem"] = new Map<number, string>();

  for (let i = 0; i < importTaskItemData.length; i++) {
    const data = importTaskItemData[i];
    
    const importTaskId = modelIdMap["importtask"].get(data.importTaskIndex);
    const operatorId = modelIdMap["sysuser"].get(data.operatorIndex);
    const importedProductId = data.importedProductIndex !== null ? modelIdMap["product"].get(data.importedProductIndex) : null;

    if (!importTaskId || !operatorId) {
      continue;
    }

    const createdAt = addDays(baseDate, data.timeAnchor);
    const updatedAt = addDays(baseDate, data.updateAnchor);

    const record = await prisma.importtaskitem.create({
      data: {
        importTaskId: importTaskId,
        operatorId: operatorId,
        sourceUrl: data.sourceUrl,
        parsedName: data.parsedName,
        parsedMainImageUrl: data.parsedMainImageUrl,
        parsedPriceMin: data.parsedPriceMin,
        parsedPriceMax: data.parsedPriceMax,
        specSummaryJson: data.specSummaryJson,
        previewDataJson: data.previewDataJson,
        isSelected: data.isSelected,
        importedProductId: importedProductId || null,
        failureReason: data.failureReason,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });

    modelIdMap["importtaskitem"].set(i, record.id);
  }
}
async function seedcartitem(prisma: any, modelIdMap: any): Promise<void> {
  const baseDate = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const cartItemData = [
    {
      cartIndex: 0,
      productIndex: 0,
      productSkuIndex: 0,
      quantity: 2,
      status: "VALID",
      timeAnchor: -5,
      updateAnchor: -1
    },
    {
      cartIndex: 0,
      productIndex: 1,
      productSkuIndex: 1,
      quantity: 1,
      status: "INVALID",
      timeAnchor: -10,
      updateAnchor: -5
    },
    {
      cartIndex: 1,
      productIndex: 3,
      productSkuIndex: 8,
      quantity: 3,
      status: "VALID",
      timeAnchor: -2,
      updateAnchor: 0
    },
    {
      cartIndex: 1,
      productIndex: 7,
      productSkuIndex: 12,
      quantity: 1,
      status: "INVALID",
      timeAnchor: -8,
      updateAnchor: -2
    },
    {
      cartIndex: 2,
      productIndex: 8,
      productSkuIndex: 15,
      quantity: 2,
      status: "VALID",
      timeAnchor: -4,
      updateAnchor: -1
    },
    {
      cartIndex: 2,
      productIndex: 9,
      productSkuIndex: 17,
      quantity: 1,
      status: "INVALID",
      timeAnchor: -15,
      updateAnchor: -10
    },
    {
      cartIndex: 3,
      productIndex: 10,
      productSkuIndex: 19,
      quantity: 2,
      status: "VALID",
      timeAnchor: -20,
      updateAnchor: -5
    },
    {
      cartIndex: 3,
      productIndex: 13,
      productSkuIndex: 22,
      quantity: 1,
      status: "INVALID",
      timeAnchor: -35,
      updateAnchor: -20
    }
  ];

  modelIdMap["cartitem"] = new Map<number, string>();

  for (let i = 0; i < cartItemData.length; i++) {
    const data = cartItemData[i];
    const cartId = modelIdMap["cart"].get(data.cartIndex);
    const productId = modelIdMap["product"].get(data.productIndex);
    const productSkuId = modelIdMap["productsku"].get(data.productSkuIndex);

    if (!cartId || !productId || !productSkuId) continue;

    const createdAt = addDays(baseDate, data.timeAnchor);
    const updatedAt = addDays(baseDate, data.updateAnchor);

    const record = await prisma.cartitem.create({
      data: {
        cartId: cartId,
        productId: productId,
        productSkuId: productSkuId,
        quantity: data.quantity,
        status: data.status as any,
        createdAt: createdAt,
        updatedAt: updatedAt
      }
    });

    modelIdMap["cartitem"].set(i, record.id);
  }
}
// === Seed Functions End ===

async function runSeedStep(stepName, fn) {
  try {
    await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[SEED_STEP_FAILED] ${stepName}`);
    throw err;
  }
}

async function main() {
  // Delete all data once in reverse topology order before inserts.
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  try {
    await prisma.cartitem.deleteMany();
    await prisma.productsku.deleteMany();
    await prisma.importtaskitem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.importtask.deleteMany();
    await prisma.sysuser.deleteMany();
    await prisma.category.deleteMany();
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  }

  await runSeedStep('seedsysuser', () => seedsysuser(prisma, modelIdMap));
  await runSeedStep('seedcategory', () => seedcategory(prisma, modelIdMap));
  await runSeedStep('seedproduct', () => seedproduct(prisma, modelIdMap));
  await runSeedStep('seedcart', () => seedcart(prisma, modelIdMap));
  await runSeedStep('seedimporttask', () => seedimporttask(prisma, modelIdMap));
  await runSeedStep('seedproductsku', () => seedproductsku(prisma, modelIdMap));
  await runSeedStep('seedimporttaskitem', () => seedimporttaskitem(prisma, modelIdMap));
  await runSeedStep('seedcartitem', () => seedcartitem(prisma, modelIdMap));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });