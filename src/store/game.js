import { defineStore } from 'pinia'

async function api(path, method = 'GET', body) {
  const opt = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opt.body = JSON.stringify(body)
  const r = await fetch('/api' + path, opt)
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || '请求失败')
  return data
}

export const useGameStore = defineStore('game', {
  state: () => ({
    loaded: false,
    player: null,
    crops: [],
    inventory: [],
    buildings: [],
    animals: [],
    plots: [],
    weather: null,
    weatherLog: [],
    selectedPlot: null,
    seedMode: false,
    selectedCropId: null,
    toast: null,
    timeline: []
  }),
  getters: {
    seasonLabel: (s) => {
      const map = ['🌸 春', '☀️ 夏', '🍂 秋', '❄️ 冬']
      return s.player ? map[s.player.season % 4] : '🌸 春'
    },
    currentSeason: (s) => s.player?.season ?? 0
  },
  actions: {
    async load() {
      const d = await api('/state')
      this.player = d.player
      this.crops = d.crops
      this.inventory = d.inventory
      this.buildings = d.buildings
      this.animals = d.animals
      this.plots = d.plots
      this.weather = d.weather
      this.weatherLog = d.weatherLog || []
      this.loaded = true
    },
    pushLog(msg, type = 'info') {
      this.timeline.unshift({ msg, type, time: new Date().toLocaleTimeString('zh-CN') })
      if (this.timeline.length > 30) this.timeline.pop()
    },
    showToast(msg, type = 'info') {
      this.toast = { msg, type, id: Date.now() }
      this.pushLog(msg, type)
    },
    clearToast() { this.toast = null },

    async refresh() { await this.load() },

    async plant() {
      if (!this.selectedPlot || !this.selectedCropId) return
      try {
        await api('/plant', 'POST', { plotId: this.selectedPlot.id, cropId: this.selectedCropId })
        await this.load()
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async water() {
      if (!this.selectedPlot) return
      await api('/water', 'POST', { plotId: this.selectedPlot.id })
      await this.load()
    },
    async fertilize() {
      if (!this.selectedPlot) return
      await api('/fertilize', 'POST', { plotId: this.selectedPlot.id })
      await this.load()
    },
    async clean() {
      if (!this.selectedPlot) return
      await api('/clean', 'POST', { plotId: this.selectedPlot.id })
      await this.load()
    },
    async harvest() {
      if (!this.selectedPlot) return
      const r = await api('/harvest', 'POST', { plotId: this.selectedPlot.id })
      if (r.ok) this.showToast(`收获 ${r.yield} +${r.gold}金`, 'success')
      else this.showToast('作物还未成熟', 'warn')
      await this.load()
    },
    async nextDay(n = 1) {
      const r = await api('/skip', 'POST', { n })
      await this.load()
      // 天气逐日结算记录进入事件时间线
      ;(r.logs || []).forEach((m) => this.pushLog(m, 'warn'))
      this.showToast(`时间 +${n} 天`, 'info')
    },
    async protect(gold, matQty) {
      try {
        await api('/weather/protect', 'POST', { gold, matQty })
        await this.load()
        this.showToast('已投入防护资源', 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async buyMat(qty = 1) {
      try {
        await api('/buymat', 'POST', { qty })
        await this.load()
        this.showToast('已购入防灾物资', 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async buySeed(cropId, qty = 1) {
      try {
        await api('/buyseed', 'POST', { cropId, qty })
        await this.load()
        this.showToast('已购买种子', 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async sellCrop(cropId, qty = 1) {
      try {
        const r = await api('/sellcrop', 'POST', { cropId, qty })
        await this.load()
        this.showToast(`售出${r.sold}，+${r.gain}金`, 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async buyAnimal(species) {
      try {
        await api('/animal', 'POST', { species })
        await this.load()
        this.showToast('已领养', 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async feedAnimal(id) {
      await api('/feed', 'POST', { id })
      await this.load()
    },
    async collectAnimal(id) {
      try {
        const r = await api('/collect', 'POST', { id })
        await this.load()
        this.showToast(`收集 ${r.item} +${r.gold}金`, 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async processBuild(from, result, consume, gain) {
      try {
        await api('/process', 'POST', { from, result, consume, gain })
        await this.load()
        this.showToast(`加工完成：${result.name}`, 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },
    async upgradeBuilding(id) {
      try {
        await api('/upgrade', 'POST', { id })
        await this.load()
        this.showToast('建筑升级成功', 'success')
      } catch (e) { this.showToast(e.message, 'warn') }
    },

    selectPlot(id) {
      this.selectedPlot = this.plots.find((p) => p.id === id) || null
    },
    setSeedMode(s) { this.seedMode = s }
  }
})