/**
 * 写作助手的提示词模板函数
 * 根据 prompts.md 中定义的模板，生成各模式下的完整提示词
 */

export type WritingMode = 
  | 'continue' 
  | 'rewrite' 
  | 'expand' 
  | 'summarize' 
  | 'email' 
  | 'copywriting'
  | 'paper'
  | 'report'
  | 'novel';

export const promptTemplates: Record<WritingMode, (input: string) => string> = {
  // 文章续写
  continue: (input: string) => {
    return `请继续写下面的文章，保持风格一致，内容连贯：\n\n${input}`;
  },

  // 内容改写
  rewrite: (input: string) => {
    return `请改写下面的内容，使其更加流畅、专业：\n\n${input}`;
  },

  // 内容扩展
  expand: (input: string) => {
    return `请扩展下面的内容，增加更多细节和例子：\n\n${input}`;
  },

  // 内容总结
  summarize: (input: string) => {
    return `请总结下面的内容，提取核心要点：\n\n${input}`;
  },

  // 邮件撰写
  email: (input: string) => {
    return `请写一封专业的邮件，核心意图和主题是：\n\n${input}\n\n请注意邮件格式的完整性（包含称呼、正文、结尾）。`;
  },

  // 文案生成
  copywriting: (input: string) => {
    return `请根据以下描述写一段引人注目的营销文案：\n\n${input}\n\n要求：突出亮点，富有感染力，适合在社交媒体上发布。`;
  },

  // 论文生成
  paper: (input: string) => {
    return `请根据以下主题或大纲撰写一段学术论文：\n\n${input}\n\n要求：语言严谨、客观，逻辑严密，采用学术界常用的表达方式和论述结构。`;
  },

  // 报告生成
  report: (input: string) => {
    return `请根据以下信息撰写一份正式的业务或工作报告：\n\n${input}\n\n要求：条理清晰，分点论述，语言精炼，重点突出数据或结论。`;
  },

  // 小说生成
  novel: (input: string) => {
    return `请根据以下设定或情节开头，创作一段小说故事：\n\n${input}\n\n要求：注重人物描写和场景烘托，情节引人入胜，富有想象力和画面感。`;
  }
};
