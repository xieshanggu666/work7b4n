<template>
  <div class="tabs">
    <button v-for="t in tabs" :key="t.key" :class="{active:tab===t.key}" @click="tab=t.key">{{ t.label }}</button>
  </div>

  <!-- 市场 -->
  <div v-if="tab==='market'" class="page">
    <div class="pcol card">
      <h4>🌾 种子商店</h4>
      <div class="row" v-for="c in store.crops" :key="c.id">
        <span class="i">{{ c.sprite }}</span>
        <div class="m-info">
          <b>{{ c.name }}</b>
          <span class="tag season s{{c.season}}">宜{{['春','夏','秋','冬'][c.season]}}</span>
          <span class="tag">{{ c.days }}天成熟</span>
        </div>
        <span class="price seed">🪙{{ c.seedPrice }}</span>
        <button class="mini" @click="store.buySeed(c.id,1)">买</button>
        <button class="mini" @click="store.buySeed(c.id,5)">买×5</button>
      </div>
    </div>
    <div class="pcol card">
      <h4>💰 出售作物</h4>
      <div v-if="!sellable.length" class="none">暂无库存，请先收获作物</div>
      <div class="row" v-for="s in sellable" :key="s.item_id">
        <span class="i">{{ s.icon }}</span>
        <div class="m-info"><b>{{ s.name }}</b><span class="tag">×{{ s.qty }}</span></div>
        <span class="price">🪙{{ s.unit }} /个</span>
        <button class="mini green" @click="store.sellCrop(s.cropId,1)">卖1</button>
        <button class="mini green" @click="store.sellCrop(s.cropId,5)">卖5</button>
      </div>
    </div>
    <div class="pcol card">
      <h4>🧰 物资商店</h4>
      <div class="row">
        <span class="i">🧱</span>
        <div class="m-info">
          <b>防灾物资</b>
          <span class="tag">恶劣天气时投入防护</span>
          <span class="tag">持有 ×{{ matCount }}</span>
        </div>
        <span class="price seed">🪙12</span>
        <button class="mini" @click="store.buyMat(1)">买</button>
        <button class="mini" @click="store.buyMat(5)">买×5</button>
      </div>
    </div>
  </div>

  <!-- 加工坊 -->
  <div v-if="tab==='process'" class="page">
    <div class="pcol card">
      <h4>⚙️ 加工坊 <span class="lvl">Lv.{{ mill.level }}</span></h4>
      <div class="row" v-for="r in recipes" :key="r.id">
        <span class="i">{{ r.icon }}</span>
        <div class="m-info">
          <b>{{ r.name }}</b>
          <span class="tag">消耗 {{ r.fromName }} ×{{ r.consume }}</span>
          <span class="tag">→ {{ r.result.name }} ×{{ r.gain }}</span>
          <span class="tag">⏳ {{ r.days }}天/份</span>
          <span class="tag lock" v-if="locked(r)">🔒 Lv.{{ r.minLv }} 解锁</span>
          <span class="tag" v-else>库存 {{ stockOf(r.from) }}</span>
        </div>
        <button class="mini" :disabled="locked(r) || !canQueue(r,1)" @click="store.queueProcess(r.id,1)">排产</button>
        <button class="mini" :disabled="locked(r) || !canQueue(r,5)" @click="store.queueProcess(r.id,5)">×5</button>
      </div>
      <button class="wide" @click="store.upgradeBuilding(mill.id)">🔧 升级加工坊（🪙{{ mill.level*40 }}）→ 解锁配方 · 并行槽位 +1</button>
    </div>
    <div class="pcol card">
      <h4>📋 生产队列 <span class="lvl">并行 {{ Math.min(mill.level, store.processQueue.length) }}/{{ mill.level }}</span></h4>
      <div v-if="!store.processQueue.length" class="none">队列空空，从左侧选择配方排产</div>
      <div class="job" v-for="(j, i) in store.processQueue" :key="j.id">
        <div class="j-top">
          <b>{{ j.result_name }} ×{{ j.gain * j.qty }}</b>
          <span class="tag" :class="i < mill.level ? 'run' : 'wait'">{{ i < mill.level ? '⚙️ 生产中' : '⏸ 排队中' }}</span>
          <span class="tag">{{ j.done_days }}/{{ j.total_days }} 天</span>
          <button class="mini cancel" @click="store.cancelProcess(j.id)">取消</button>
        </div>
        <div class="jbar"><i :style="{width:(j.done_days/j.total_days*100)+'%'}"></i></div>
        <div class="j-sub">已投料 {{ j.from_name }} ×{{ j.consume * j.qty }} · 取消退还未开工部分原料</div>
      </div>
    </div>
  </div>

  <!-- 畜棚 -->
  <div v-if="tab==='barn'" class="page">
    <div class="pcol card">
      <h4>🐖 畜棚 <span class="lvl">Lv.{{ barn.level }}</span></h4>
      <div class="adopt">
        <button class="ad" @click="store.buyAnimal('chicken')">🐔 母鸡 <span>🪙30</span></button>
        <button class="ad" @click="store.buyAnimal('sheep')">🐑 绵羊 <span>🪙60</span></button>
        <button class="ad" @click="store.buyAnimal('cow')">🐄 奶牛 <span>🪙80</span></button>
      </div>
      <div class="animal-list">
        <div v-if="!store.animals.length" class="none">还没有动物，请领养</div>
        <div v-for="a in store.animals" :key="a.id" class="animal">
          <span class="a-icon">{{ {chicken:'🐔',sheep:'🐑',cow:'🐄'}[a.species] }}</span>
          <div class="m-info">
            <b>{{ a.name }}</b>
            <div class="hp">
              <div class="bar"><i :style="{width:a.feed+'%',background:a.feed<40?'#ef5350':'#4caf50'}"></i></div>
              <span class="tiny">食{{ Math.round(a.feed) }}</span>
            </div>
            <div class="hp"><div class="bar"><i :style="{width:a.health+'%',background:healthColor}"></i></div><span class="tiny">健{{ Math.round(a.health) }}</span></div>
          </div>
          <span class="ready" v-if="a.ready">可收集</span>
          <button class="mini" @click="store.feedAnimal(a.id)">🥣 喂食</button>
          <button class="mini green" :disabled="!a.ready" @click="store.collectAnimal(a.id)">🧺 收集</button>
        </div>
      </div>
      <button class="wide" @click="store.upgradeBuilding(barn.id)">🔧 升级畜棚（🪙{{ barn.level*40 }}）</button>
    </div>
  </div>

  <!-- 背包 -->
  <div v-if="tab==='bag'" class="page">
    <div class="pcol card">
      <h4>🎒 我的背包</h4>
      <div v-if="!store.inventory.length" class="none">背包空空如也</div>
      <div class="grid">
        <div v-for="it in store.inventory" :key="it.item_id" class="bag-item">
          <span class="b-icon">{{ iconOf(it) }}</span>
          <span class="b-name">{{ it.name }}</span>
          <span class="b-qty">×{{ it.qty }}</span>
          <span class="b-cat">{{ catName(it.cat) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 建筑 -->
  <div v-if="tab==='build'" class="page">
    <div class="pcol card">
      <h4>🏠 建筑一览</h4>
      <div class="row" v-for="b in store.buildings" :key="b.id">
        <span class="i">🏠</span>
        <div class="m-info"><b>{{ b.name }}</b><span class="tag">Lv.{{ b.level }}</span><span class="desc">{{ b.desc }}</span></div>
        <button class="mini" @click="store.upgradeBuilding(b.id)">升级</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/store/game'
const store = useGameStore()
const tab = ref('market')
const healthColor = '#4caf50'

const tabs = [
  { key: 'market', label: '🏪 市场' },
  { key: 'process', label: '⚙️ 加工坊' },
  { key: 'barn', label: '🐖 畜棚' },
  { key: 'bag', label: '🎒 背包' },
  { key: 'build', label: '🏠 建筑' }
]

const cropIcon = computed(() => {
  const m = {}
  store.crops.forEach((c) => { m[c.id] = c.sprite })
  return m
})
const sellable = computed(() =>
  store.inventory
    .filter((it) => it.cat === 'crop')
    .map((it) => {
      const id = it.item_id.split('-')[1]
      const crop = store.crops.find((c) => c.id === Number(id)) || { id: 0, price: 1 }
      return { ...it, icon: cropIcon.value[id] || '🧺', unit: crop.price, cropId: crop.id }
    })
)
function catName(c) { return { seed: '种子', crop: '作物', product: '制品', material: '材料' }[c] || c }
function iconOf(it) {
  if (it.cat === 'crop') return cropIcon.value[it.item_id.split('-')[1]] || '🧺'
  if (it.cat === 'seed') return '🌱'
  if (it.cat === 'product') { return { 'p-chicken': '🥚', 'p-cow': '🥛', 'p-sheep': '🧶' }[it.item_id] || '📦' }
  if (it.item_id === 'disaster-kit') return '🧱'
  return { flour: '🌾', juice: '🧃', cheese: '🧀', bread: '🍞', wool: '🧵' }[it.item_id] || '📦'
}
const matCount = computed(() =>
  store.inventory.filter((it) => it.cat === 'material').reduce((s, it) => s + it.qty, 0)
)
const mill = computed(() => store.buildings.find((b) => b.name === '加工坊'))
const barn = computed(() => store.buildings.find((b) => b.name === '畜棚'))

// 配方由服务端下发（含工期与解锁等级），此处只补充图标与状态
const RECIPE_ICONS = { flour: '🌾', juice: '🧃', cheese: '🧀', bread: '🍞', wool: '🧵' }
const recipes = computed(() => store.recipes.map((r) => ({ ...r, icon: RECIPE_ICONS[r.id] || '🛠️' })))
const locked = (r) => (mill.value?.level || 1) < r.minLv
const stockOf = (itemId) => store.inventory.find((it) => it.item_id === itemId)?.qty || 0
const canQueue = (r, n) => stockOf(r.from) >= r.consume * n
</script>

<style scoped>
.tabs { display:flex;gap:6px;margin-bottom:14px; }
.tabs button { background:#13233f;border:1px solid rgba(120,160,220,0.2);color:#aebadd;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px; }
.tabs button.active { background:linear-gradient(135deg,#1d3f8f,#2962ff);color:#fff;border-color:transparent; }
.page { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
@media(max-width:760px){ .page{grid-template-columns:1fr;} }
.pcol { display:flex;flex-direction:column;gap:2px; }
.card { background:#0f1b38;border:1px solid rgba(120,160,220,0.16);border-radius:12px;padding:16px; }
h4 { margin:0 0 8px;color:#fff;display:flex;gap:8px;align-items:center; }
.lvl { font-size:11px;color:#ffd54f; }
.row { display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px dashed rgba(120,160,220,0.1); }
.row:last-child{border-bottom:none;}
.i { font-size:22px;width:30px;text-align:center; }
.m-info { flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px;align-items:center; }
.m-info b { color:#e8eefb;font-size:13px;width:100%; }
.tag { font-size:10px;color:#6f84ab;background:#16263f;padding:2px 6px;border-radius:4px; }
.tag.s0,.s.spring{ color:#a5d6a7; } .s1{color:#90caf9;} .s2{color:#ffe082;} .s3{color:#b39ddb;}
.desc { font-size:10px;color:#8ba2c8;width:100%; }
.price { color:#ffc107;font-size:12px;font-weight:600;white-space:nowrap; }
.price.seed { color:#ffb300; }
.mini { background:#2962ff;border:none;color:#fff;border-radius:7px;padding:6px 10px;font-size:12px;cursor:pointer; }
.mini.green { background:#43a047; }
.mini:disabled{background:#2a3a5e;color:#6f84ab;cursor:not-allowed;}
.wide { width:100%;margin-top:12px;background:#16263f;border:1px solid rgba(255,213,79,0.3);color:#ffd54f;border-radius:9px;padding:10px;font-size:13px;cursor:pointer; }
.none { color:#5b6f94;text-align:center;padding:20px;font-size:12px; }
.adopt { display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap; }
.ad { flex:1;min-width:90px;background:#16263f;border:1px solid rgba(120,160,220,0.2);border-radius:9px;padding:10px;color:#dbe4f3;cursor:pointer;font-size:12px;display:flex;flex-direction:column;align-items:center;gap:4px; }
.ad span { color:#ffc107;font-size:11px; }
.animal { display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px dashed rgba(120,160,220,0.1); }
.a-icon{font-size:20px;}
.hp{display:flex;align-items:center;gap:4px;}
.hp .bar{flex:1;height:5px;background:#0c1730;border-radius:3px;overflow:hidden;width:90px;}
.hp .bar i{display:block;height:100%;}
.tiny{font-size:9px;color:#8ba2c8;width:26px;}
.ready{color:#ffd54f;font-size:11px;}
.tag.lock{color:#ef9a9a;}
.tag.run{color:#a5d6a7;}
.tag.wait{color:#8ba2c8;}
.mini.cancel{background:#c62828;}
.job{padding:8px 0;border-bottom:1px dashed rgba(120,160,220,0.1);}
.job:last-child{border-bottom:none;}
.j-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.j-top b{color:#e8eefb;font-size:13px;flex:1;min-width:80px;}
.jbar{height:6px;background:#0c1730;border-radius:3px;overflow:hidden;margin:6px 0 4px;}
.jbar i{display:block;height:100%;background:linear-gradient(90deg,#43a047,#9ccc65);transition:width .3s;}
.j-sub{font-size:10px;color:#6f84ab;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;}
.bag-item{background:#16263f;border:1px solid rgba(120,160,220,0.12);border-radius:9px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:12px;color:#dbe4f3;}
.b-icon{font-size:22px;}
.b-qty{color:#ffd54f;}
.b-cat{font-size:9px;color:#6f84ab;}
</style>