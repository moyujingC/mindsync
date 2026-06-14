import type { Track } from './types';

export const tracks: { name: Track; desc: string; count?: number }[] = [
  { name: 'AI 心理伴侣', desc: '低门槛、对话式的情绪陪伴产品。' },
  { name: 'AI 日记与自我探索', desc: '以书写与提问推动自我觉察的产品。' },
  { name: 'AI 教练与个人成长', desc: '把教练方法论翻译成 AI 对话的产品。' },
  { name: '职场心理健康', desc: '面向企业、为员工心理健康服务的产品。' },
  { name: '临床与机构工作流', desc: '为咨询师、机构提供 AI 副驾的产品。' },
  { name: '国内观察', desc: '中文市场的 AI 心理产品样本。' },
  { name: '待核验线索', desc: '尚在追踪、暂未独立核验的产品线索。' },
];
