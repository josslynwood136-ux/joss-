// 网易云 + QQ 音乐助手（云端版）
// 网易云 API 跑在内部端口，主服务提供 /qq 路由，其余请求代理给网易云
// 部署到免费云服务器后，手机上的仿真小手机就能扫码登录你的网易云 / QQ 音乐账号
const express = require('express')
const http = require('http')
const https = require('https')
const path = require('path')
const { serveNcmApi } = require('NeteaseCloudMusicApi')

const PORT = Number(process.env.PORT || 3000)

const NCM_PORT = Number(process.env.NCM_PORT || 3100)

// 启动网易云 API（内部端口，不对外）
serveNcmApi({ port: NCM_PORT, host: '127.0.0.1', checkVersion: false })
  .then(function () {
    console.log('网易云 API 已在 127.0.0.1:' + NCM_PORT + ' 启动')
  })
  .catch(function (e) {
    console.error('网易云 API 启动失败：' + (e && e.message))
  })

const app = express()

// 全局 CORS
app.use(function (req, res, next) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type,Origin,Cookie')
  if (req.method === 'OPTIONS') return res.status(204).end()
  next()
})

// QQ 音乐路由
app.use('/qq', express.json())
app.use('/qq', require('./qq'))

// 探测标记：浏览器用它判断「本站是否带 AI 转发」——有就走 /relay，没有就直连
app.all('/relay-probe', function (req, res) { res.status(204).end() })

// AI 对话通用转发：访客填哪个网址就转发到哪，密钥留在访客浏览器里
// 浏览器发送 x-relay-target（完整目标 URL）+ x-relay-method，服务端原样转发
app.use('/relay', function (req, res) {
  const target = req.headers['x-relay-target']
  if (!target) return res.status(400).json({ code: 400, msg: '缺少 x-relay-target' })
  let u
  try { u = new URL(target) } catch (e) { return res.status(400).json({ code: 400, msg: '目标网址不合法' }) }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return res.status(400).json({ code: 400, msg: '仅支持 http/https' })
  const method = String(req.headers['x-relay-method'] || req.method).toUpperCase()
  const headers = Object.assign({}, req.headers)
  delete headers['x-relay-target']
  delete headers['x-relay-method']
  delete headers.origin
  delete headers.referer
  delete headers.host
  headers.host = u.host
  const client = u.protocol === 'https:' ? https : http
  const proxy = client.request({
    protocol: u.protocol,
    hostname: u.hostname,
    port: u.port || (u.protocol === 'https:' ? 443 : 80),
    path: u.pathname + u.search,
    method: method,
    headers: headers
  }, function (pr) {
    res.writeHead(pr.statusCode, pr.headers)
    pr.pipe(res)
  })
  proxy.on('error', function () {
    if (!res.headersSent) res.status(502).json({ code: 502, msg: '目标服务暂时不可用' })
    else res.end()
  })
  req.pipe(proxy)
})

// 静态托管整个项目（应用网页在本文件上一级目录）
const APP_ROOT = process.env.APP_ROOT || path.join(__dirname, '..')
app.use(function (req, res, next) {
  const p = (req.path || '').split('?')[0]
  if (p === '/sever' || p.startsWith('/sever/') ||
      p === '/node_modules' || p.startsWith('/node_modules/') ||
      p === '/.git' || p.startsWith('/.git/')) {
    return res.status(403).send('Forbidden')
  }
  next()
})
app.use(express.static(APP_ROOT, { index: 'index.html', dotfiles: 'ignore' }))

// 其余请求代理给网易云 API
app.use(function (req, res) {
  const target = {
    hostname: '127.0.0.1',
    port: NCM_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: '127.0.0.1:' + NCM_PORT }),
  }
  const proxy = http.request(target, function (pr) {
    res.writeHead(pr.statusCode, pr.headers)
    pr.pipe(res)
  })
  proxy.on('error', function () {
    if (!res.headersSent) res.status(502).json({ code: 502, msg: '服务暂时不可用' })
    else res.end()
  })
  req.pipe(proxy)
})

app.listen(PORT, '0.0.0.0', function () {
  console.log('服务器已启动，监听端口：' + PORT)
})
