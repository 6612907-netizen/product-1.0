/**
 * AI教练 - 产品1.0
 * 主应用
 */

const { chat } = require('./api');
const { COACH_SYSTEM_PROMPT, WELCOME_MESSAGE } = require('./prompts');

// 评估问题
const ASSESSMENT_QUESTIONS = [
  {
    id: 'q1',
    question: '你之前用过AI工具吗？（如ChatGPT、Claude、Midjourney等）',
    options: [
      { text: '从来没用过', value: 'beginner' },
      { text: '用过一两次', value: 'starter' },
      { text: '偶尔在用', value: 'intermediate' },
      { text: '经常在用', value: 'advanced' }
    ]
  },
  {
    id: 'q2',
    question: '你想用AI来做什么？',
    options: [
      { text: '写文章、写报告', value: 'writing' },
      { text: '做表格、数据分析', value: 'data' },
      { text: '出点子、头脑风暴', value: 'creative' },
      { text: '写代码、自动化', value: 'coding' }
    ]
  },
  {
    id: 'q3',
    question: '你每天能投入多少时间学习AI？',
    options: [
      { text: '10分钟以下', value: 'short' },
      { text: '10-30分钟', value: 'medium' },
      { text: '30分钟-1小时', value: 'long' },
      { text: '1小时以上', value: 'intensive' }
    ]
  },
  {
    id: 'q4',
    question: '你学习AI的主要目的是？',
    options: [
      { text: '提升工作效率', value: 'work' },
      { text: '个人成长', value: 'growth' },
      { text: '做副业/创业', value: 'business' },
      { text: '纯粹好奇', value: 'curiosity' }
    ]
  },
  {
    id: 'q5',
    question: '你觉得学习AI最大的困难是？',
    options: [
      { text: '不知道从哪里开始', value: 'start' },
      { text: '看不懂术语', value: 'terms' },
      { text: '没人教', value: 'guide' },
      { text: '怕学不会', value: 'fear' }
    ]
  }
];

// 推荐路线逻辑
function recommendRoute(answers) {
  // 简单的推荐算法
  const { q1, q2, q3, q4 } = answers;

  // 完全没有经验 + 时间少 → 路线A
  if (q1 === 'beginner' && (q3 === 'short' || q3 === 'medium')) {
    return { route: 'A', name: '从零开始', reason: '你刚从零开始，我们从最基础的概念讲起，每天10分钟，轻松上手。', days: 21, time: '10-20分钟' };
  }

  // 用过一点 + 想快速上手 → 路线B
  if ((q1 === 'starter' || q1 === 'intermediate') && (q3 === 'medium' || q3 === 'long')) {
    return { route: 'B', name: '快速上手', reason: '你有一定基础，我们直接教你最实用的技能，两周就能用到工作中。', days: 14, time: '20-40分钟' };
  }

  // 经常用 + 想深度应用 → 路线C
  if (q1 === 'advanced' || q4 === 'business') {
    return { route: 'C', name: '深度应用', reason: '你已经是进阶用户，我们来探索高级技巧和工具组合。', days: 21, time: '30-60分钟' };
  }

  // 默认路线A
  return { route: 'A', name: '从零开始', reason: '我们从最基础的概念讲起，循序渐进。', days: 21, time: '15分钟' };
}

// 用户会话
class CoachSession {
  constructor(userId) {
    this.userId = userId;
    this.state = 'welcome'; // welcome, assessment, learning, practice, review
    this.answers = {};
    this.route = null;
    this.history = [];
    this.step = 0;
  }

  // 获取欢迎语
  getWelcome() {
    return WELCOME_MESSAGE;
  }

  // 处理评估回答
  async processAssessment(answer) {
    this.answers[`q${this.step + 1}`] = answer;
    this.step++;

    if (this.step < ASSESSMENT_QUESTIONS.length) {
      // 下一题
      const nextQ = ASSESSMENT_QUESTIONS[this.step];
      return {
        question: nextQ.question,
        options: nextQ.options,
        progress: `${this.step + 1}/${ASSESSMENT_QUESTIONS.length}`
      };
    } else {
      // 评估完成，推荐路线
      this.route = recommendRoute(this.answers);
      this.state = 'route_recommended';
      return {
        complete: true,
        ...this.route
      };
    }
  }

  // 和AI教练对话
  async chat(message) {
    const response = await chat(message, this.history, COACH_SYSTEM_PROMPT);
    this.history.push({ role: 'user', content: message });
    this.history.push({ role: 'assistant', content: response });
    return response;
  }

  // 获取当前状态
  getStatus() {
    return {
      state: this.state,
      step: this.step,
      route: this.route,
      answers: this.answers
    };
  }
}

// 测试
async function test() {
  console.log('=== AI教练测试 ===\n');

  const session = new CoachSession('test_user');

  console.log('欢迎语:', session.getWelcome());
  console.log('\n--- 评估问答 ---');

  // 模拟评估
  const answers = ['beginner', 'writing', 'medium', 'work', 'start'];
  for (let i = 0; i < answers.length; i++) {
    const result = await session.processAssessment(answers[i]);
    console.log(`\n问题 ${result.progress}:`, result.question);
    console.log('回答:', answers[i]);
    if (result.complete) {
      console.log('\n=== 评估完成 ===');
      console.log('推荐路线:', result.name);
      console.log('原因:', result.reason);
    }
  }

  console.log('\n--- AI教练对话 ---');
  const response = await session.chat('我不知道从哪里开始学AI');
  console.log('用户: 我不知道从哪里开始学AI');
  console.log('小智:', response);
}

// CLI 模式
if (require.main === module) {
  test().catch(console.error);
}

module.exports = { CoachSession, recommendRoute, ASSESSMENT_QUESTIONS };
