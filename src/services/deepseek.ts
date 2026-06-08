const DOUBAO_API_KEY = 'ark-ecf9c33a-d1b3-4592-ab71-1b5b76e934cc-90d0d';
// 开发环境走 Vite proxy，生产环境直连豆包 API
const DOUBAO_API_URL = import.meta.env.DEV
  ? '/api/deepseek/responses'
  : 'https://ark.cn-beijing.volces.com/api/v3/responses';
const DOUBAO_MODEL = 'doubao-seed-2-0-mini-260428';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const agentSystemPrompts: Record<string, string> = {
  math: '你是"高数酱"，一位专业的微积分与线性代数辅导老师。你擅长用清晰、易懂的方式解释高等数学概念，包括微积分、线性代数、概率统计等。回答时请给出详细的推导过程和步骤。',
  python: '你是"Py酱"，一位Python数据分析专家。你擅长pandas、numpy、matplotlib等库的使用，能帮助解决数据处理、可视化、脚本编写等问题。回答时请给出可运行的代码示例。',
  torch: '你是"Torch君"，一位深度学习专家。你精通PyTorch框架，擅长Transformer、CNN、RNN等模型架构，能帮助解决模型训练、调参、部署等问题。回答时请给出清晰的解释和代码。',
  matrix: '你是"矩阵妹"，一位线性代数与向量空间专家。你擅长矩阵运算、特征值分解、SVD、向量空间等概念的解释与计算。回答时请给出详细的推导过程。',
};

/**
 * 从豆包 responses API 响应中提取文本
 * output 数组中可能包含 reasoning（思考过程）和 message（实际回复），
 * 需要找到 type === 'message' 的条目来提取内容。
 */
function extractResponseText(data: any): string {
  if (data.output) {
    // 优先找 type === 'message' 的条目
    for (const item of data.output) {
      if (item.type === 'message' && item.content?.[0]?.text) {
        return item.content[0].text;
      }
    }
    // 兜底：取第一个有 content/output_text 的条目
    for (const item of data.output) {
      if (item.content?.[0]?.text) {
        return item.content[0].text;
      }
    }
  }
  // fallback: OpenAI 兼容格式
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  return '';
}

export async function chatWithDeepSeek(
  messages: ChatMessage[],
  agent: string
): Promise<string> {
  const systemPrompt = agentSystemPrompts[agent] || agentSystemPrompts.math;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  headers['Authorization'] = `Bearer ${DOUBAO_API_KEY}`;

  const body: any = {
    model: DOUBAO_MODEL,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
      ...messages.map(m => ({
        role: m.role,
        content: [{ type: 'input_text', text: m.content }],
      })),
    ],
  };

  const response = await fetch(DOUBAO_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`豆包 API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return extractResponseText(data);
}

/**
 * 图片识别 + AI 分析（豆包多模态模型原生支持图片输入）
 */
export async function analyzeImageWithDeepSeek(
  imageBase64: string,
  prompt: string,
  agent: string
): Promise<string> {
  const systemPrompt = agentSystemPrompts[agent] || agentSystemPrompts.math;

  const textPrompt = prompt.trim()
    ? `请先仔细观察并描述这张图片的内容，然后结合以下指令进行详细分析和解答：\n\n${prompt}`
    : '请仔细观察并描述这张图片的内容，然后进行详细的分析和解答。';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  headers['Authorization'] = `Bearer ${DOUBAO_API_KEY}`;

  const body: any = {
    model: DOUBAO_MODEL,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: textPrompt },
          { type: 'input_image', image_url: imageBase64 },
        ],
      },
    ],
  };

  const response = await fetch(DOUBAO_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`豆包图片 API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return extractResponseText(data);
}
