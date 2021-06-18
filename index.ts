import { find } from 'detective'
import {
  existsSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'fs'
import { join, resolve } from 'path'
import { get } from 'https'
import { exec } from 'child_process'
const url = 'https://nodejs.org/docs/latest/api/documentation.json'

/**
 * 文件遍历方法
 * @param {string} filePath 需要遍历的文件路径
 * @returns {Array<string>} fileList 文件列表
 */
function getFiles(filePath: string): Array<string> {
  const fileList = []
  function findFile(path: string) {
    const files = readdirSync(path)
    files.forEach((item) => {
      const fPath = join(path, item)
      const stat = statSync(fPath)
      if (stat.isDirectory() === true && item === 'node_modules') {
        findFile(fPath)
      }
      if (stat.isFile() === true) {
        fileList.push(fPath)
      }
    })
  }

  findFile(filePath)
  return fileList
}

function getDepends(path: string) {
  const depends = []
  const files = getFiles(path)
  files.forEach((item) => {
    depends.push(...find(readFileSync(item, 'utf-8')).strings)
  })
  console.log("Find dependencies: ",depends)
  return Array.from(new Set(depends))
}

/**
 * 找出需要安装的包
 * @param {string} path 需要检索的文件路径
 * @param {Object<string,string>} attach 附加的依赖
 * @param {string} npmClient 安装使用的包管理器名称
 */
const requireResolver = (
  path: string,
  attach: { [packageName: string]: string } = {},
  npmClient: string = 'npm'
) =>
  get(url, (res) => {
    const datas = []
    let size = 0
    res.on('data', (data) => {
      datas.push(data)
      size += data.length
    })
    res.on('end', () => {
      const buff = Buffer.concat(datas, size)
      const result = buff.toString()
      const content = JSON.parse(result)
      const table = content.miscs[0].miscs.filter(
        (item: { name: string }) => item.name === 'stability_overview'
      )[0].desc

      const internelModules = table
        .match(/<a href=(.*?)>/g)
        .map((item: string | any[]) => item.slice(9, -7))

      const toinstall = getDepends(path)
        .filter((item) => !(item.startsWith('./') || item.startsWith('../')))
        .filter((item) => !internelModules.includes(item))

      const pkgJsonPath = resolve(path, 'package.json')
      let pkgJson = new Object()
      if (existsSync(pkgJsonPath)) {
        pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
        if (pkgJson['dependencies']) {
          delete pkgJson['dependencies']
        }
        if (pkgJson['devDependencies']) {
          delete pkgJson['devDependencies']
        }
        if (pkgJson['scripts']) {
          delete pkgJson['scripts']
        }
      }
      const dependencyJson = new Object()
      toinstall.forEach((item) => {
        dependencyJson[item] = '*'
      })
      Object.keys(attach).forEach((dependency) => {
        dependencyJson[dependency] = attach[dependency]
      })

      pkgJson['dependencies'] = dependencyJson

      writeFileSync(pkgJsonPath, JSON.stringify(pkgJson))
      process.chdir(path)
      console.log('Installing dependencies...')
      exec(`${npmClient} install`, (err, stdout, stderr) => {
        if (err) {
          console.error(err)
        }
        console.log(stdout)
        console.log(stderr)
      })
    })
  }).on('error', (err) => {
    console.log(err)
  })

export default requireResolver
