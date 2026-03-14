import type { OntologyVersion, OntologyModule } from "@/types/workbench";
import type {
  SystemObject,
  PrepItem,
  OperationStep,
  MeasurementItem,
  DataItem,
} from "@/types/ontologyModules";
import { makeTag } from "@/types/experimentFields";

// ---------------------------------------------------------------------------
// Structured mock data — one block per module
// ---------------------------------------------------------------------------

const SYSTEM_OBJECTS: SystemObject[] = [
  {
    id: "sys-1",
    name: "Si(100) 基底",
    role: "研究基底",
    attributes: [
      makeTag("尺寸", "4英寸"),
      makeTag("电阻率", "1–10 Ω·cm"),
      makeTag("晶向", "100"),
    ],
    description: "P 型单晶硅片，用作 ZnO 薄膜沉积衬底",
  },
  {
    id: "sys-2",
    name: "ZnO 陶瓷靶",
    role: "靶材",
    attributes: [
      makeTag("纯度", "99.99%"),
      makeTag("直径", "3英寸"),
    ],
    description: "RF 溅射靶材，提供 ZnO 沉积源",
  },
  {
    id: "sys-3",
    name: "RF 磁控溅射腔室",
    role: "设备",
    attributes: [
      makeTag("本底真空", "<5×10⁻⁶ Pa"),
      makeTag("气氛", "Ar/O₂"),
      makeTag("功率", "RF 150 W"),
    ],
    description: "沉积腔室，控制气体流量、功率和基底温度",
  },
];

const PREP_ITEMS: PrepItem[] = [
  {
    id: "prep-1",
    name: "丙酮超声清洗",
    category: "基底清洗",
    attributes: [makeTag("溶剂", "丙酮"), makeTag("时长", "10 min"), makeTag("超声功率", "40 kHz")],
    description: "去除基底表面有机污染物",
  },
  {
    id: "prep-2",
    name: "乙醇超声清洗",
    category: "基底清洗",
    attributes: [makeTag("溶剂", "无水乙醇"), makeTag("时长", "10 min")],
    description: "进一步清洁残余有机物",
  },
  {
    id: "prep-3",
    name: "去离子水冲洗",
    category: "基底清洗",
    attributes: [makeTag("次数", "3"), makeTag("单次时长", "5 min"), makeTag("水质", "18 MΩ·cm")],
  },
  {
    id: "prep-4",
    name: "氮气吹干",
    category: "基底清洗",
    attributes: [makeTag("气体", "N₂"), makeTag("纯度", "99.999%")],
    description: "防止水分残留导致的氧化",
  },
  {
    id: "prep-5",
    name: "UV-臭氧处理",
    category: "表面活化",
    attributes: [makeTag("时长", "15 min"), makeTag("波长", "185 / 254 nm")],
    description: "去除有机残留，提升表面亲水性",
  },
  {
    id: "prep-6",
    name: "靶材预溅射",
    category: "靶材处理",
    attributes: [makeTag("时长", "5 min"), makeTag("功率", "RF 150 W"), makeTag("遮挡", "挡板关闭")],
    description: "遮挡基底，去除靶表面污染层",
  },
];

const OPERATION_STEPS: OperationStep[] = [
  {
    id: "op-1",
    order: 1,
    name: "装载基底，腔室抽至本底真空",
    params: [makeTag("目标真空", "<5×10⁻⁶ Pa")],
  },
  {
    id: "op-2",
    order: 2,
    name: "通入工作气体",
    params: [makeTag("Ar 流量", "40 sccm"), makeTag("O₂ 流量", "10 sccm"), makeTag("稳定时间", "5 min")],
    notes: "稳定 5 min 后方可继续",
  },
  {
    id: "op-3",
    order: 3,
    name: "开启 RF 电源，预溅射",
    params: [makeTag("功率", "RF 150 W"), makeTag("时长", "5 min")],
  },
  {
    id: "op-4",
    order: 4,
    name: "移开挡板，开始沉积",
    params: [makeTag("单段时长", "30 min"), makeTag("总段数", "4")],
  },
  {
    id: "op-5",
    order: 5,
    name: "控制退火温度梯度",
    params: [makeTag("温度", "200/300/400/500°C"), makeTag("单段时长", "30 min")],
    notes: "各温度段各沉积 30 min，独立计时",
  },
  {
    id: "op-6",
    order: 6,
    name: "自然冷却至室温后取样",
    params: [],
    notes: "冷却至室温后方可开腔，避免热冲击",
  },
];

const MEASUREMENT_ITEMS: MeasurementItem[] = [
  {
    id: "meas-1",
    name: "XRD 衍射表征",
    instrument: "Rigaku SmartLab",
    method: "Cu Kα辐射，θ-2θ 扫描",
    target: "分析薄膜晶体结构与 (002) 取向",
    conditions: [
      makeTag("扫描范围", "20–80°"),
      makeTag("步长", "0.02°"),
      makeTag("环境", "室温"),
    ],
  },
  {
    id: "meas-2",
    name: "SEM 表面形貌",
    instrument: "SEM",
    method: "二次电子成像",
    target: "观察薄膜表面晶粒形貌",
    conditions: [
      makeTag("工作电压", "5 kV"),
      makeTag("放大倍数", "10k / 50k"),
    ],
  },
  {
    id: "meas-3",
    name: "四探针法电阻测量",
    method: "直流四探针",
    target: "测量方块电阻值",
    conditions: [
      makeTag("探针间距", "1 mm"),
      makeTag("测试电流", "1 mA"),
      makeTag("环境", "室温"),
    ],
  },
];

const DATA_ITEMS: DataItem[] = [
  {
    id: "data-1",
    name: "XRD (002) 峰位",
    attributes: [makeTag("单位", "°"), makeTag("预期范围", "34.4–34.6°"), makeTag("来源", "XRD 测量")],
    description: "衍射角随退火温度变化",
  },
  {
    id: "data-2",
    name: "结晶度评估",
    attributes: [makeTag("来源", "XRD 半高宽"), makeTag("类型", "定性分级")],
    description: "综合 XRD 半高宽评级（中等 / 较好 / 良好 / 优秀）",
  },
  {
    id: "data-3",
    name: "方块电阻",
    attributes: [makeTag("单位", "Ω/□"), makeTag("预期范围", "30–500"), makeTag("来源", "四探针测量")],
    description: "四探针测量值，预期随退火温度升高而降低",
  },
];

// ---------------------------------------------------------------------------
// Seed ontology modules
// ---------------------------------------------------------------------------

const SEED_MODULES: OntologyModule[] = [
  {
    key: "system",
    title: "实验系统",
    structuredData: { systemObjects: SYSTEM_OBJECTS },
    status: "inherited",
    isHighlighted: false,
    updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    key: "preparation",
    title: "实验准备",
    structuredData: { prepItems: PREP_ITEMS },
    status: "inherited",
    isHighlighted: false,
    updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    key: "operation",
    title: "实验操作",
    structuredData: { operationSteps: OPERATION_STEPS },
    status: "inherited",
    isHighlighted: false,
    updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    key: "measurement",
    title: "测量过程",
    structuredData: { measurementItems: MEASUREMENT_ITEMS },
    status: "inherited",
    isHighlighted: false,
    updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    key: "data",
    title: "实验数据",
    structuredData: { dataItems: DATA_ITEMS },
    status: "inherited",
    isHighlighted: false,
    updatedAt: "2026-03-01T08:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Ontology versions
// ---------------------------------------------------------------------------

/**
 * Version 0 — system-generated from initialization wizard output.
 * Never shown to the user directly; serves as the parent of v1.
 */
export const ONTOLOGY_V0: OntologyVersion = {
  id: "ont_v0",
  versionNumber: 0,
  parentVersionId: null,
  source: "initial_generated",
  modules: SEED_MODULES,
  confirmedAt: "2026-03-01T08:30:00Z",
};

/**
 * Version 1 — user-confirmed during initialization.
 * This is what the first experiment record inherits.
 */
export const ONTOLOGY_V1: OntologyVersion = {
  id: "ont_v1",
  versionNumber: 1,
  parentVersionId: "ont_v0",
  source: "initial_confirmed",
  modules: SEED_MODULES,
  confirmedAt: "2026-03-01T09:00:00Z",
};

/** The default confirmed ontology version to inherit from when creating records. */
export const DEFAULT_ONTOLOGY_VERSION: OntologyVersion = ONTOLOGY_V1;

/** All seed versions, ordered oldest first. */
export const SEED_ONTOLOGY_VERSIONS: OntologyVersion[] = [ONTOLOGY_V0, ONTOLOGY_V1];
