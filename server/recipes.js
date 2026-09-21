// 加工坊配方表（服务端权威）：排产校验、工期推进与完工入库都以此为准
// days   —— 每份工期（游戏天）
// minLv  —— 解锁所需加工坊等级
export const RECIPES = [
  { id: 'flour',  name: '磨面粉',   from: 'crop-5',  fromName: '小麦', fromCat: 'crop',     consume: 2, gain: 1, days: 1, minLv: 1, result: { id: 'flour',  name: '面粉',   cat: 'material' } },
  { id: 'juice',  name: '榨番茄汁', from: 'crop-2',  fromName: '番茄', fromCat: 'crop',     consume: 2, gain: 1, days: 1, minLv: 1, result: { id: 'juice',  name: '番茄汁', cat: 'product' } },
  { id: 'cheese', name: '制奶酪',   from: 'p-cow',   fromName: '牛奶', fromCat: 'product',  consume: 2, gain: 1, days: 2, minLv: 1, result: { id: 'cheese', name: '奶酪',   cat: 'product' } },
  { id: 'bread',  name: '烤面包',   from: 'flour',   fromName: '面粉', fromCat: 'material', consume: 2, gain: 1, days: 2, minLv: 2, result: { id: 'bread',  name: '面包',   cat: 'product' } },
  { id: 'wool',   name: '纺毛线',   from: 'p-sheep', fromName: '羊毛', fromCat: 'product',  consume: 1, gain: 1, days: 3, minLv: 3, result: { id: 'wool',   name: '毛线',   cat: 'product' } }
]
