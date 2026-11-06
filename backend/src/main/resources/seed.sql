-- 由 scripts/gen-seed.mjs 自动生成，请勿手改。
-- 内容来源：content/posts/*.md + content/collections.json + 生成器内置的站点种子
SET NAMES utf8mb4;

-- 综集
INSERT IGNORE INTO blog_collection (slug, title, subtitle, description, cover, runes, sort) VALUES ('explosion-theory', '爆裂魔法理论', 'Explosion Theory', '从咏唱结构、魔力回路到伦理学，把「一发」研究到底的四篇手记。', 'assets/megumin/megumin-cast.webp', 'EXPLOSION', 1);
INSERT IGNORE INTO blog_collection (slug, title, subtitle, description, cover, runes, sort) VALUES ('red-demon-days', '红魔族的日常', 'Red Demon Days', '一个全是怪人的村子里，早晨、猫和一顶帽子。', 'assets/megumin/megumin-chibi.webp', 'AKUSERU', 2);
INSERT IGNORE INTO blog_collection (slug, title, subtitle, description, cover, runes, sort) VALUES ('world-travel', '异世界旅途', 'World Travel', '用爆炸给大地做记号，在雨天停下来，在边境教三个孩子魔法。', 'assets/megumin/megumin-back.webp', 'JOURNEY', 3);

-- 分类
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('爆裂魔法', 'cat-904504445', 0);
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('红魔族日常', 'cat-149192183', 1);
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('旅途见闻', 'cat-812722057', 2);
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('魔法研究', 'cat-212368028', 3);
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('手记', 'cat-815813', 4);
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('随笔', 'cat-1226341', 5);

-- 文章
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('chanting-structure', '咏唱词的结构学', '从音节节奏到爆炸半径', '一段好的咏唱词，前半段是给世界听的宣告，后半段是给自己听的倒计时。', NULL, '## 咏唱不是念咒，是谱曲

外人以为咏唱只是把古老的音节念出来。其实真正的难点在于**节奏**：太快，魔力来不及汇聚；太慢，敌人已经绕到你身后。

我常用的咏唱大约在 14 秒左右，分为三段。

### 第一段：宣告

以「黑闇之炎」起手，音调下沉。这一段的作用不是杀伤，而是告诉周围的空气：请让开。

### 第二段：堆叠

连续的短音节，像雨点打在盾牌上。此时魔力回路开始发烫，指尖会有细微的电流感。

### 第三段：引爆

最后一句必然是 **Explosion**。重音落在第二个音节上，收尾要干脆，不能拖。

```text
黑闇之炎よ ——
我が名は惠惠、红魔族の大魔法使い
全てを灰烬に帰す、その力を見せてやろう
Explosion!!
```

## 三处常见错误

1. **在第二段换气**。换气会让魔力回流的瞬间出现断层，爆心会偏移，最坏的情况是炸到自己。
2. **结尾拖音**。拖音听起来很帅，实际上是在给爆炸追加一段不稳定的尾巴。
3. **站得太近**。这不是咏唱的问题，是常识的问题。

## 关于爆炸半径

半径和咏唱的完整度关系更大，而不是和音量。我做过记录：

- 完整咏唱：稳定在 40 米左右
- 省略第二段：约 18 米，且形状不规则
- 被打断后强行引爆：不可预测，建议不要

## 一点私心

每次念到最后一句时，我都会稍微放慢半拍。

不是为了威力，是为了让那半拍里的寂静，也被算进这场魔法里。', 'assets/megumin/flame.png', 'published', 0, 0, '2026-10-21');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('chomusuke-diary', '豆之助观察日记', '一只黑猫的统治力', '它不施法，不打工，不写日记。它只是坐在那里，然后所有人都向它妥协。', NULL, '## 第一天

豆之助来到我家那天，下着雨。

它浑身湿透，站在门口，用一种「你怎么还不开门」的眼神看着我。

我开了门。

## 第三天

它已经占据了窗台上阳光最好的位置。

我试图和它讲道理：这是我的家。

它打了个哈欠。

## 第七天

我发现自己在给它准备专门的碗。

不是普通的碗，是那个我从集市上带回来的、画着星星的碗。我自己都没舍得用。

## 第十四天

> 猫不需要魔法。猫本身就是一种让人失去判断力的魔法。

## 第二十一天

今天出门前，它坐在门口看我。

我说：「我要去放爆裂魔法了。」

它喵了一声。

我理解为「注意安全」。虽然更可能是「早点回来开饭」。

## 关于它的战斗力

- 对老鼠：压倒性胜利
- 对我的帽子：绝对统治
- 对爆裂魔法：毫无兴趣，甚至会在爆炸声中睡着

## 结语

有时候我会想，也许真正的强者不是能炸平山丘的人。

而是那个在山丘被炸平之后，依然能安稳睡在窗台上的家伙。', 'assets/megumin/cat-b.png', 'published', 0, 0, '2026-10-18');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('explosion-ethics', '爆裂魔法的伦理学', '当威力成为一种责任', '一个能炸平山丘的人，最先要学会的不是控制威力，而是判断「这一发该不该放」。', NULL, '## 一个不太好笑的早晨

那天我照例在城外找了一块荒地。咏唱、引爆、山丘消失。

然后我看到山丘后面有一片刚发芽的麦田。

没有人受伤，但农夫站在田埂上看了我很久。他没有骂我，只是把被土盖住的幼苗一棵一棵拨出来。

那天之后，我在咏唱词前面加了一句话。

## 力量的三种代价

- **直接的代价**：被炸掉的东西
- **间接的代价**：被吓到的人、被改变的地形、被推迟的播种
- **隐形的代价**：你开始觉得「反正我可以炸掉」的那颗心

前两种可以赔偿，第三种不能。

## 我给自己定的三条规矩

1. **先看，再咏唱。** 至少花十秒确认半径内没有活物、没有耕地、没有别人的家。
2. **能不打就不打。** 爆裂魔法是最后的手段，不是开场白。
3. **炸了就要负责。** 赔钱、道歉、帮忙重建。这是魔法使的基本礼貌。

## 关于「强」这件事

小时候我以为，强就是能炸掉更大的东西。

现在我觉得，强是**在能炸掉一切的时候，仍然选择只炸该炸的那一小块**。

## 结语

威力本身没有善恶，它只是放大了使用者的判断力。

所以真正需要修炼的，从来不是魔力，而是那颗在咏唱之前愿意停十秒的心。', 'assets/megumin/smoke.png', 'published', 0, 0, '2026-09-30');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('mana-circuit-care', '魔力回路保养手册', '写给每天脱力一次的人', '施放之后的恢复，和施放本身一样重要。这是一份用无数次被背回旅馆换来的保养清单。', NULL, '## 为什么恢复比施放更难

一次爆裂魔法会清空全部魔力。清空之后，身体会进入一种「空掉的」状态：手脚发软、视野边缘发白、说话会慢半拍。

这时候最危险的事情不是敌人，而是**逞强**。

## 恢复四阶段

### 阶段一：0—10 分钟

- 保持平躺，抬高双腿
- 不要立刻喝冷水
- 让队友确认周围没有二次塌方

### 阶段二：10 分钟—2 小时

- 小口补充温热的糖水
- 可以说话，但不要说太长
- 记录本次消耗，方便下次估算

### 阶段三：2—12 小时

- 睡眠。这是唯一有效的恢复手段
- 睡前把帽子摘下来，帽檐压着额头会影响魔力回流的观感（虽然只是观感）

### 阶段四：次日

- 早上做十分钟的回路伸展
- 如果指尖还在发麻，今天就休息

## 我自己的记录表

| 日期 | 消耗 | 恢复时长 | 备注 |
| --- | --- | --- | --- |
| 10-08 | 全部 | 14 小时 | 炸了山丘，被罚款 |
| 10-09 | 全部 | 11 小时 | 状态不错 |
| 10-10 | 全部 | 16 小时 | 前一晚没睡好 |

把表填满之后你会发现一件很浪漫的事：**你和自己的身体，其实一直在对话。**

## 最后

不要因为「反正明天还能放」就轻视今天这一发。

也不要因为「只有一发」就把恢复当成浪费时间。

魔力回路是你唯一的一副身体，请像我珍惜爆裂魔法一样珍惜它。', 'assets/megumin/fireball.png', 'published', 0, 0, '2026-10-12');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('rainy-axel', '阿克塞尔的雨天', '一个不施法的下午', '雨天不能放爆裂魔法。于是我第一次认真地看了一座城。', NULL, '## 雨

阿克塞尔的雨来得很突然。

早上还是晴天，中午云就从西边压过来，把整座城罩成一块灰色的布。

我原本计划下午去城外试一发。计划取消。

## 于是我去逛街

### 武器店

老板正在擦一把看起来比我还老的剑。他抬头看了我一眼，又低头继续擦。

「不买东西就别挡光。」

我买了一卷绷带。他很高兴，送我一块磨刀石。我不知道要磨什么，但还是收下了。

### 面包店

刚出炉的面包有一股很朴素的味道，不是香，是暖。

我买了两个，坐在店门口的台阶上吃。雨水顺着屋檐连成一条线，落在我脚边。

### 教堂

教堂的彩色玻璃在阴天里不发光，只是静静地待在那里。

我坐在最后一排，什么也没祈祷。只是听着雨声落在屋顶上。

## 关于「什么都不做」

我一直以为，一天不施法就是浪费了一天。

但那天下雨，我什么都没做，走回旅馆时却觉得心里很满。

> 也许所谓的旅途，不是走过多少地方，而是有多少个下午，你愿意为一场雨停下来。

## 第二天

第二天放晴了。我去城外补上了前一天的那一发。

声响很大，很漂亮。

但我记得更清楚的，是前一天屋檐下那条雨线。', 'assets/megumin/megumin-back.webp', 'published', 0, 0, '2026-09-22');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('red-demon-morning', '红魔族的早晨', '一个村子里全是怪人的日常', '在红魔之里，早上七点的街道上有人在试验新魔法，有人在卖奇怪的药水，还有人在爆炸。这很正常。', NULL, '## 七点

红魔之里的早晨不是被鸡叫醒的，是被远处的一声闷响叫醒的。

那通常是我隔壁的邻居在做实验。他家后院已经连续三个月寸草不生，他本人对此非常自豪。

## 八点

早餐是黑面包和一种味道很奇怪的汤。汤里放了很多据说能「提升魔力亲和」的草药，实际效果是让人一整天都想喝水。

我妈妈会在这个时候问我：「今天的爆裂魔法练了吗？」

我爸爸会在旁边补一句：「别忘了先写遗书。」

他们都很支持我。

## 九点

村子中央的广场上，各种摊位陆续摆开：

- 卖「一发必中」魔杖的老爷爷（据说从没打中过）
- 卖「魔力回复药」的姐姐（味道像糖水，可能真的是糖水）
- 一个总在兜售「能让爆裂魔法威力翻倍」的护符的商人

我买过一次。没有用。但我还是每年买一次，因为他的摊位旁边有卖烤串的。

## 关于「怪」

外人来到红魔之里，第一反应通常是：这里的人是不是都有点问题。

我们的回答是：**是的，而且我们为此感到骄傲。**

红魔族对一件事的执着程度，外人很难理解。有人一辈子只研究如何让火苗更蓝，有人穷尽一生想做出不会化的冰。

而我，只想把爆裂魔法推到极限。

## 晚上

傍晚是村子里最安静的时刻。大家各自回到自己的工坊、书房、后院，继续折腾自己的东西。

远处偶尔传来一声爆炸，然后是短促的欢呼，然后是更远处的狗叫。

这就是红魔族的日常。很奇怪，但很完整。', 'assets/megumin/megumin-chibi.webp', 'published', 0, 0, '2026-10-25');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('redefining-strongest', '关于「最强」的重新定义', '写在第三百次爆裂之后', '我曾经以为最强就是最大的爆炸。现在我觉得，最强是一种能够被信任的力量。', NULL, '## 第三百次

我在笔记本上记下了第三百次爆裂魔法的日期。

前一百次，我记的是坑的直径。

第二个一百次，我记的是恢复需要多久。

这一个一百次，我记的是**旁边有没有人**。

## 三种「强」

### 第一种：数字上的强

更大的半径、更深的坑、更远的回声。这是最容易量化的，也是我小时候最想要的。

### 第二种：控制上的强

能在想要的地方、想要的时间，放出想要的量。不放多，也不放少。

### 第三种：被信任的强

队友愿意站在你身后，不是因为你不会伤到他们，而是因为他们知道你会先看一圈。

## 一个不算小的转变

我曾经因为「只放一发」被人嘲笑。

现在有人会在出发前问我：「今天那一发，你打算放在哪儿？」

这句话里有一种很轻的东西，但它比任何赞美都让我高兴。

## 关于未来

我还会继续练。也许第四百次会更准，第五百次会更快。

但我不想再追求「最大」了。

我想追求的是——**在我抬起法杖的那十秒里，周围的人不会害怕。**

## 结语

如果有一天，你看到一个红眼睛的魔法使站在荒野上，先看了一圈，然后才开口咏唱。

那大概就是我。

而那十秒的沉默，是我这些年学会的、最难的一课。', 'assets/megumin/megumin-full.webp', 'published', 0, 0, '2026-10-30');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('teaching-magic', '在边境小镇教魔法', '三个学生和一发不许放的爆裂魔法', '我从来没想过自己会当老师。更没想过，第一堂课教的是「什么时候不要放」。', NULL, '## 事情的开始

边境小镇的镇长找到我，说镇上没有魔法使，希望我能留几天，教教孩子们。

报酬是三天的住宿和饭钱。

我答应了，因为我当时身上只剩两枚硬币。

## 三个学生

- **米娅**，十一岁，能点亮火苗，但一紧张就会灭
- **卢卡**，十三岁，魔力很多，控制很差
- **小个子**（他不肯说名字），七岁，什么都想学

## 第一堂课

我本来准备教咏唱。

结果米娅问了我一个问题：「老师，你放魔法的时候，会不会害怕？」

我愣了很久。

## 我教了他们什么

那天我没有教任何咒语。

我教他们三件事：

1. **先学会看。** 看清周围有什么，比看清敌人更重要。
2. **学会收手。** 魔力放出去容易，收回来难。
3. **学会道歉。** 万一炸坏了别人的东西。

## 最后一课

第三天傍晚，我带他们去了镇外的一片空地。

我说：「今天我要放一发爆裂魔法。你们站在这里，看，但不要学。」

那一发很小，只有平时的一成力量。我不想吓到他们，也不想让镇长赔钱。

爆炸之后，卢卡很长时间没有说话。

然后他说：「老师，我以后想学这个。」

我说：「先学会不放。」

## 离开

第四天早上我走了。米娅送了我一块石头，上面画着一个歪歪扭扭的星星。

那块石头现在还在我的口袋里。

## 结语

我一直以为，魔法的传承是把咒语交给下一个人。

后来我明白，真正的传承是**把那十秒的犹豫**也一起交出去。', 'assets/megumin/megumin-sticker.webp', 'published', 0, 0, '2026-09-08');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('the-hat', '帽子是魔法使的本体', '关于那顶尖顶帽的一百个理由', '帽子不是装饰品。它是身份、是护身符、是睡觉时唯一不能摘下来的东西。', NULL, '## 理由之一：它是身份的宣告

在红魔之里，看帽子就能认出一个人。

宽檐的是学者，窄檐的是商人，帽尖歪向左边的是……算了，这个不重要。

我的这顶是外婆留下的。帽檐上有一道很浅的划痕，是她年轻时被龙焰擦过留下的。我每次戴上它，都觉得自己不是一个人在面对荒野。

## 理由之二：它真的很实用

- 挡雨
- 挡太阳
- 挡爆炸时飞来的碎石
- 在酒馆里趴着睡觉时挡光

## 理由之三：它让我看起来很强

这一点我承认得很坦率。一个穿着普通斗篷的少女站在荒野上，没人会后退。

一个戴着尖顶帽、披着红披风、手里握着法杖的少女站在那里——就算她今天魔力已经用完了，对面也会犹豫三秒。

这三秒有时候就是全部。

## 关于清洗

不能水洗。不能暴晒。不能用力搓。

正确的做法是用软布蘸一点点温水，顺着绒毛的方向轻轻擦。

我一般一年洗两次。豆之助对此很不满，因为它喜欢睡在帽子里。

## 结语

有人问我，如果只能带走一件东西去异世界，我会带什么。

法杖？魔导书？

不。帽子。

法杖可以再买，书可以再抄。但一顶戴了很多年的帽子，会记得你所有的样子。', 'assets/megumin/megumin-portrait.webp', 'published', 0, 0, '2026-10-05');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('why-once-a-day', '为何我每天只放一发爆裂魔法', '把全部魔力押在一瞬的美学', '有人问我，为什么不多放几发？因为爆裂魔法的意义从来不是数量，而是那一刻把世界点燃的浓度。', NULL, '## 一个被问了八百次的问题

「只放一发，不觉得浪费吗？」

在阿克塞尔的小酒馆里，这个问题我至少回答过八百次。提问的人通常刚看完我炸平半片荒野，一边拍着身上的土，一边用看疯子的眼神看我。

我的答案一直没变：**爆裂魔法不是量产的武器，它是一次性的告白。**

## 魔力分配的最优解

从红魔族的教科书里可以抄到一段非常朴素的公式：

```
总伤害 = 魔力投入 × 爆发系数 × 命中面积
```

看起来很公平，但真实情况是——爆裂魔法的爆发系数随投入量呈指数增长，而魔力一旦分散，系数就会断崖式下跌。

| 魔力分配 | 单发威力 | 总破坏 |
| --- | --- | --- |
| 均分十发 | 12 | 120 |
| 集中一发 | 100 | 100 |

从表格里就能看出来，所谓「多放几发」，不过是把一场盛大的爆炸拆成十次尴尬的烟花。

## 关于每日一发的自律

> 「每天只能放一发」——这不是限制，而是仪式。

- 早晨起来先确认魔力回路是否通畅
- 中午之前禁止使用任何中阶魔法，把魔力量攒满
- 傍晚找一处无人的荒野，咏唱，然后——
- 回家，吃饭，睡觉，明天继续

正因为只有一发，选址才需要慎重，咏唱才值得拉长，那一声「Explosion」才会像誓言一样落下去。

## 副作用说明书

施放之后会全身脱力，需要队友背回旅馆。这一点我承认，但请注意：**这并不是缺点，而是让队友产生存在感的温柔设计。**

## 结语

如果你也曾把某件事做到极致，你大概会懂。世界并不缺十次小小的火光，缺的是那一次把夜空整个掀翻的红。

明日傍晚，荒野见。', 'assets/megumin/megumin-cast.webp', 'published', 1, 0, '2026-10-28');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('wilderness-marks', '荒野的测量法', '用爆炸给大地做记号', '在没有地图的地方，我习惯用爆裂魔法留下的坑来标记路程。一个坑大约是一天。', NULL, '## 没有地图的地方

离开红魔之里之后，我很快发现一件事：地图是给走路的人准备的，不是给放爆裂魔法的人准备的。

很多所谓的「道路」，在爆炸之后就不存在了。

所以我自己造了一套记号。

## 记号系统

每到一个新的区域，我会在视野开阔的地方放一发，留下一个规则的圆形坑。

- **一个坑**：可以安全过夜
- **两个坑并排**：附近有水源
- **三个坑呈三角**：有危险，绕行
- **一串小坑**：我迷路了，正在试方向

听起来很浪费魔力，但实际上比我原地转圈要省得多。

## 关于准确性

坑的直径会受地形影响。沙地上会大一些，岩石上会小一些，有一次在山谷里，回声把附近的鸟全惊飞了，坑却只有预期的一半。

后来我学会了先试探：用很小的魔力打一发，看形状，再决定正式的那一发。

## 旅途中的坐标

| 地点 | 坑数 | 备注 |
| --- | --- | --- |
| 红魔之里东侧荒地 | 1 | 起点 |
| 枯河床 | 2 | 有水，但很浑 |
| 风蚀谷 | 3 | 有魔兽，绕了三天 |

## 一个不合适的地点

有一次我在一片很漂亮的草原上放了记号。

第二年再经过时，那里多了一个湖。

……我至今不确定是不是我的原因。

## 结语

用爆炸来认识世界，听起来很粗暴。

但每一个坑的位置、形状、深度，都是我和这片土地真实打过交道的证据。比地图上的一条虚线要诚实得多。', 'assets/megumin/fireball.png', 'published', 0, 0, '2026-09-15');

-- 文章 ↔ 分类
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'chanting-structure' AND c.name = '爆裂魔法';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'chanting-structure' AND c.name = '魔法研究';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'chomusuke-diary' AND c.name = '红魔族日常';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'chomusuke-diary' AND c.name = '手记';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'explosion-ethics' AND c.name = '爆裂魔法';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'explosion-ethics' AND c.name = '随笔';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'mana-circuit-care' AND c.name = '爆裂魔法';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'mana-circuit-care' AND c.name = '手记';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'rainy-axel' AND c.name = '旅途见闻';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'rainy-axel' AND c.name = '随笔';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'red-demon-morning' AND c.name = '红魔族日常';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'red-demon-morning' AND c.name = '随笔';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'redefining-strongest' AND c.name = '随笔';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'redefining-strongest' AND c.name = '魔法研究';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'teaching-magic' AND c.name = '旅途见闻';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'teaching-magic' AND c.name = '手记';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'the-hat' AND c.name = '红魔族日常';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'the-hat' AND c.name = '随笔';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'why-once-a-day' AND c.name = '爆裂魔法';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'why-once-a-day' AND c.name = '魔法研究';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'wilderness-marks' AND c.name = '旅途见闻';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'wilderness-marks' AND c.name = '魔法研究';

-- 文章 ↔ 综集
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'chanting-structure' AND c.slug = 'explosion-theory';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'chomusuke-diary' AND c.slug = 'red-demon-days';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'explosion-ethics' AND c.slug = 'explosion-theory';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'mana-circuit-care' AND c.slug = 'explosion-theory';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'rainy-axel' AND c.slug = 'world-travel';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'red-demon-morning' AND c.slug = 'red-demon-days';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'teaching-magic' AND c.slug = 'world-travel';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'the-hat' AND c.slug = 'red-demon-days';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'why-once-a-day' AND c.slug = 'explosion-theory';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'wilderness-marks' AND c.slug = 'world-travel';

-- 站点配置与纪念日倒计时
INSERT IGNORE INTO blog_config (config_key, config_value) VALUES ('site.start-date', '2024-11-05');
INSERT IGNORE INTO blog_anniversary (id, label, memorial_date, note, sort) VALUES (1, '云汀凫的生日', '11-30', '红魔族最伟大的魔法使诞生之日', 0);
INSERT IGNORE INTO blog_anniversary (id, label, memorial_date, note, sort) VALUES (2, '学会爆裂魔法纪念日', '06-15', '第一次把山丘夷为平地', 1);
INSERT IGNORE INTO blog_anniversary (id, label, memorial_date, note, sort) VALUES (3, '博客开站周年', '11-05', '手记的第一页', 2);

-- 内置合成曲（kind=synth，url 对应前端 Web Audio 引擎的曲谱 id）
INSERT IGNORE INTO blog_music (id, title, artist, cover, url, kind, size, sort) VALUES (1, '爆裂魔法のテーマ', '惠惠的留声机', '', 'explosion-theme', 'synth', 0, 1);
INSERT IGNORE INTO blog_music (id, title, artist, cover, url, kind, size, sort) VALUES (2, '紅魔族の朝', '惠惠的留声机', '', 'red-demon-morning', 'synth', 0, 2);
INSERT IGNORE INTO blog_music (id, title, artist, cover, url, kind, size, sort) VALUES (3, '荒野の夜', '惠惠的留声机', '', 'night-wilderness', 'synth', 0, 3);
