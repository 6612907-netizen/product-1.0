/**
 * FastGPT API 客户端
 * 产品1.0 AI教练
 * 支持知识库 RAG
 */

const API_URL = 'https://cloud.fastgpt.cn/api/v1/chat/completions';
const API_KEY = 'fastgpt-aP27CGFGRH0UFIg0Oao2o9bPn2QaSOTXWkFgjBqqb9wbMKckKGKPeRHuzpV4Zy';

/**
 * 发送消息给AI教练
 * @param {string} message - 用户消息
 * @param {array} history - 对话历史
 * @param {string} systemPrompt - 系统提示词
 * @returns {Promise<string>} AI回复
 */
async function chat(message, history = [], systemPrompt = null) {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }

  messages.push({ role: 'user', content: message });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stream: false,
      detail: false,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 带知识库检索的对话
 * @param {string} message - 用户消息
 * @param {string} knowledgeBaseId - 知识库ID
 * @param {array} history - 对话历史
 * @param {string} systemPrompt - 系统提示词
 * @returns {Promise<object>} {content, usage, raw}
 */
async function chatWithKnowledge(message, knowledgeBaseId, history = [], systemPrompt = null) {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }

  messages.push({ role: 'user', content: message });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stream: false,
      detail: {
        chatConfig: {
          datasetConfigs: {
            datasets: [knowledgeBaseId]
          }
        }
      },
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
    raw: data
  };
}

// 测试知识库检索
async function testKnowledge() {
  const KNOWLEDGE_BASE_ID = '69cdc779db94e2284bb4aaab';

  console.log('=== 测试知识库检索 ===\n');

  const result = await chatWithKnowledge(
    '一念智能是做什么的？',
    KNOWLEDGE_BASE_ID,
    [],
    '你是小智，一念智能的AI教练。'
  );

  console.log('回复:', result.content);
  console.log('\n用量:', result.usage);

  // 检查知识库引用
  if (result.raw.responseData) {
    const datasetRefs = result.raw.responseData.filter(x =>
      x.moduleType === 'datasetSearch' ||
      x.moduleType === 'datasetQuote'
    );
    if (datasetRefs.length > 0) {
      console.log('\n📚 知识库引用:', datasetRefs.length, '条');
    }
  }
}

// CLI 模式
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--rag') {
    testKnowledge().catch(console.error);
  } else {
    const message = args.join(' ');
    if (!message) {
      console.log('Usage:');
      console.log('  node api.js <message>     - 普通对话');
      console.log('  node api.js --rag        - 测试知识库检索');
      process.exit(1);
    }
    chat(message).then(reply => {
      console.log('AI:', reply);
    }).catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  }
}

module.exports = { chat, chatWithKnowledge };
