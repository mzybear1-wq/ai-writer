export async function generateContentStream(
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  onChunk: (chunk: string) => void
): Promise<void> {
  const API_KEY = import.meta.env.VITE_ZHIPU_API_KEY;
  if (!API_KEY) {
    throw new Error('未配置智谱 API Key，请在 .env 文件中设置 VITE_ZHIPU_API_KEY');
  }

  const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt || '你是一个专业的智能写作助手。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line || line === 'data: [DONE]') continue;

        if (line.startsWith('data: ')) {
          try {
            const dataStr = line.substring(6);
            const data = JSON.parse(dataStr);
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (e) {
            console.warn('JSON Parse Error for line:', line, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream generation error:', error);
    throw error;
  }
}