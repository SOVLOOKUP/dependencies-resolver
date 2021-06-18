import { find } from 'detective'
import {
  existsSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'fs'
import { join, resolve } from 'path'
import { execSync } from 'child_process'
import fetch from 'cross-fetch'
const url = 'https://nodejs.org/docs/latest/api/documentation.json'

function pprint(content: any[]) {
  console.log(' [ dependencies-resolver ] ', ...content)
}

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
  pprint(['Find dependencies: ', depends])
  return Array.from(new Set(depends))
}


/**
 * 找出需要安装的包
 * @param {string} path 需要检索的文件路径
 * @param {Object<string,string>} attach 附加的依赖
 * @param {string} npmClient 安装使用的包管理器名称
 */
const requireResolver = async (
  path: string,
  attach: { [packageName: string]: string } = {},
  npmClient: string = 'npm'
) => {
  const content = await (await fetch(url)).json()
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
    if (pkgJson['type']) {
      delete pkgJson['type']
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
  const currentPath = resolve()
  process.chdir(path)
  pprint(['Installing dependencies...'])
  pprint([execSync(`${npmClient} install`).toString('utf-8')])
  process.chdir(currentPath)
}

export default requireResolver
