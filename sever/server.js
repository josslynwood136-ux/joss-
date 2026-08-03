// 网易云音乐助手（云端版）
// 部署到免费云服务器后，手机上的仿真小手机就能扫码登录你的网易云账号
// 不保存任何账号密码，只转发网易云请求
const { serveNcmApi } = require('NeteaseCloudMusicApi')

const port = Number(process.env.PORT || 3000)

console.log('正在启动网易云音乐助手…')

serveNcmApi({ port, host: '0.0.0.0', checkVersion: false })
  .then(() => {
    console.log('')
    console.log('  网易云音乐助手已启动 ✓')
    console.log('  监听端口：' + port)
    console.log('')
  })
  .catch((e) => {
    console.error('启动失败：' + (e && e.message))
    console.error('可能是端口被占用，请修改 PORT 环境变量后重试')
  })
