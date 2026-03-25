
// 从飞书文档Markdown解析任务表格并生成JS代码
const fs = require('fs');

// 从feishu_fetch_doc得到的markdown内容
const markdown = `
# 三国立志传 任务配置表
此表格用于配置游戏任务，新增/修改任务直接在这里编辑，然后同步到游戏即可。
## 字段说明

<lark-table rows="6" cols="3" header-row="true" column-widths="244,244,244">

  <lark-tr>
    <lark-td>
      字段
    </lark-td>
    <lark-td>
      说明
    </lark-td>
    <lark-td>
      示例
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      id
    </lark-td>
    <lark-td>
      任务唯一ID，不能重复
    </lark-td>
    <lark-td>
      \`t001\`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      name
    </lark-td>
    <lark-td>
      任务名称，显示在列表里
    </lark-td>
    <lark-td>
      \`第一步：扎根\`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      description
    </lark-td>
    <lark-td>
      任务描述，告诉你要做什么
    </lark-td>
    <lark-td>
      \`将领地升级到 2 级，在涿郡站稳脚跟\`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      condition
    </lark-td>
    <lark-td>
      完成条件，JS表达式，返回 true/false。\`this\` 就是 game 对象
    </lark-td>
    <lark-td>
      \`this.fortLv >= 2\`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      reward
    </lark-td>
    <lark-td>
      奖励，逗号分隔 \`key:value\`，支持所有资源/经验
    </lark-td>
    <lark-td>
      \`money:100,grain:200,exp_force:10\`
    </lark-td>
  </lark-tr>
</lark-table>

---

## 任务列表

<lark-table rows="12" cols="5" header-row="true" column-widths="146,146,146,146,146">

  <lark-tr>
    <lark-td>
      id
    </lark-td>
    <lark-td>
      name
    </lark-td>
    <lark-td>
      description
    </lark-td>
    <lark-td>
      condition
    </lark-td>
    <lark-td>
      reward
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t001
    </lark-td>
    <lark-td>
      第一步：扎根
    </lark-td>
    <lark-td>
      将你的领地升级到 2 级，在涿郡站稳脚跟
    </lark-td>
    <lark-td>
      this.fortLv >= 2
    </lark-td>
    <lark-td>
      money:100,grain:200,exp_force:10
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t002
    </lark-td>
    <lark-td>
      强健体魄
    </lark-td>
    <lark-td>
      将武力提升到 50 以上
    </lark-td>
    <lark-td>
      this.player.force.val >= 50
    </lark-td>
    <lark-td>
      money:50,grain:100,exp_force:15
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t003
    </lark-td>
    <lark-td>
      饱读诗书
    </lark-td>
    <lark-td>
      将智力提升到 50 以上
    </lark-td>
    <lark-td>
      this.player.intel.val >= 50
    </lark-td>
    <lark-td>
      money:50,grain:100,exp_intel:15
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t004
    </lark-td>
    <lark-td>
      广结人脉
    </lark-td>
    <lark-td>
      将魅力提升到 50 以上
    </lark-td>
    <lark-td>
      this.player.charisma.val >= 50
    </lark-td>
    <lark-td>
      money:50,grain:100,exp_charisma:15
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t005
    </lark-td>
    <lark-td>
      将帅之才
    </lark-td>
    <lark-td>
      将统率提升到 50 以上
    </lark-td>
    <lark-td>
      this.player.command.val >= 50
    </lark-td>
    <lark-td>
      money:50,grain:100,exp_command:15
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t006
    </lark-td>
    <lark-td>
      一方豪强
    </lark-td>
    <lark-td>
      将你的领地升级到 3 级，建起坚固坞堡
    </lark-td>
    <lark-td>
      this.fortLv >= 3
    </lark-td>
    <lark-td>
      money:200,grain:300,people:20
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t007
    </lark-td>
    <lark-td>
      乱世壁垒
    </lark-td>
    <lark-td>
      将你的领地升级到 4 级
    </lark-td>
    <lark-td>
      this.fortLv >= 4
    </lark-td>
    <lark-td>
      money:500,grain:800,people:50
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t008
    </lark-td>
    <lark-td>
      一郡之雄
    </lark-td>
    <lark-td>
      将你的领地升级到满级
    </lark-td>
    <lark-td>
      this.fortLv >= 5
    </lark-td>
    <lark-td>
      money:1000,grain:2000,people:100
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t009
    </lark-td>
    <lark-td>
      广聚流民
    </lark-td>
    <lark-td>
      领地人口达到 200 以上
    </lark-td>
    <lark-td>
      this.res.people >= 200
    </lark-td>
    <lark-td>
      money:150,grain:250
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t010
    </lark-td>
    <lark-td>
      招兵买马
    </lark-td>
    <lark-td>
      拥有 50 以上士兵
    </lark-td>
    <lark-td>
      this.res.soldier >= 50
    </lark-td>
    <lark-td>
      money:200,grain:100
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      t011
    </lark-td>
    <lark-td>
      富甲一方
    </lark-td>
    <lark-td>
      拥有 5000 以上金钱
    </lark-td>
    <lark-td>
      this.res.money >= 5000
    </lark-td>
    <lark-td>
      grain:1000,people:30
    </lark-td>
  </lark-tr>
</lark-table>

---

## 使用说明
1. 新增任务：直接在表格下方加一行，按照格式填写即可
1. 修改任务：直接编辑单元格内容
1. 删除任务：整行删掉即可
1. 修改完之后告诉AI重新导入就行
`;

// 提取任务表格部分
function parseQuestsFromMarkdown(md) {
  // 找到任务列表表格
  const lines = md.split('\n');
  let inTable = false;
  let headerFound = false;
  const quests = [];

  for (const line of lines) {
    if (line.includes('## 任务列表')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;

    // 表格行是以 <lark-tr> 开头的
    if (line.includes('<lark-tr>')) {
      if (!headerFound) {
        headerFound = true;
        continue; // 跳过表头
      }
      // 提取所有td内容
      const tdMatches = line.match(/<lark-td>([\s\S]*?)<\/lark-td>/g);
      if (!tdMatches || tdMatches.length !== 5) continue;

      const cells = tdMatches.map(td => {
        return td.replace(/<\/?lark-td>/g, '').trim().replace(/&gt;/g, '>').replace(/&lt;/g, '<');
      });

      const [id, name, description, conditionStr, rewardStr] = cells;

      // 解析奖励 "money:100,grain:200" → {money: 100, grain: 200}
      const reward = {};
      if (rewardStr) {
        rewardStr.split(',').forEach(item => {
          const [k, v] = item.split(':').map(s => s.trim());
          reward[k] = Number(v);
        });
      }

      // 生成任务对象
      // condition 会转成函数：() => conditionStr
      const quest = {
        id,
        name,
        desc: description,
        condition: new Function(`return (${conditionStr})`),
        reward: reward,
      };

      quests.push(quest);
    }

    // 表格结束
    if (line.includes('</lark-table>')) {
      break;
    }
  }

  return quests;
}

const quests = parseQuestsFromMarkdown(markdown);
console.log(`解析到 ${quests.length} 个任务`);

// 生成JS代码注入到game.js
function generateJSCode(quests) {
  let code = `    // === 任务系统 ===
    // 任务从飞书文档同步生成，请修改文档后重新导入
    quests: [
`;

  quests.forEach(q => {
    code += `        {
            id: "${q.id}",
            name: "${q.name.replace(/"/g, '\\"')}",
            desc: "${q.desc.replace(/"/g, '\\"')}",
            condition: () => ${q.condition.toString()},
            reward: ${JSON.stringify(q.reward, null, 12)},
        },
`;
  });

  code += `    ],
    // 已完成的任务ID列表
    completedQuests: [],
`;

  return code;
}

const jsCode = generateJSCode(quests);
console.log(jsCode);
fs.writeFileSync('/root/.openclaw/workspace/quests-generated.js', jsCode);
console.log('Saved to quests-generated.js');
