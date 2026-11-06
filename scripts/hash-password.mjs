#!/usr/bin/env node
/**
 * 生成 BCrypt 密码哈希，用于手工创建/重置博主账号（sys_user 表）。
 *
 * 用法：
 *   node scripts/hash-password.mjs '你的密码'
 *   node scripts/hash-password.mjs            # 交互式输入，避免密码留在 shell 历史里
 *
 * 首次使用前：cd scripts && npm install
 */
import bcrypt from 'bcryptjs'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout, exit } from 'node:process'

let password = process.argv[2]
if (!password) {
  const rl = createInterface({ input: stdin, output: stdout })
  password = await rl.question('输入要哈希的密码（输入不回显请自行确认环境）：')
  rl.close()
}
if (!password || password.length < 8) {
  console.error('密码至少 8 位，已取消。')
  exit(1)
}

const hash = bcrypt.hashSync(password, 10)
console.log('\nBCrypt 哈希（可直接写入 sys_user.password）：\n')
console.log(hash)
console.log('\n示例 SQL：')
console.log(
  `INSERT INTO sys_user (username, password, nickname, status) VALUES ('你的用户名', '${hash}', '昵称', 1);`,
)
console.log('\n请尽快清空剪贴板/终端记录，不要把明文密码写进任何文件。')
