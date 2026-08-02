// 网易云音乐本机助手
// 只在你的电脑上运行，用你自己的网易云账号（扫码登录）播放歌曲
// 不联网上传任何数据，只用于向网易云请求歌曲
const { serveNcmApi } = require('NeteaseCloudMusicApi')

const port = Number(process.env.PORT || 3000)

console.log('正在启动网易云音乐助手…')

serveNcmApi({ port, host: '127.0.0.1', checkVersion: false })
  .then(() => {
    console.log('')
    console.log('  网易云音乐助手已启动 ✓')
    console.log('  地址：http://127.0.0.1:' + port)
    console.log('  现在可以打开仿真小手机的 index.html 使用了')
    console.log('  （在音乐页搜索后点“登录网易云”，手机 App 扫码即可）')
    console.log('  关闭本窗口 = 停止助手')
    console.log('')
  })
  .catch((e) => {
    console.error('启动失败：' + (e && e.message))
    console.error('可能是端口被占用，请修改 server.js 里的 port 数字后重试')
  })
