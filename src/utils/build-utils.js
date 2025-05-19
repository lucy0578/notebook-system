import path from 'path'

/**
 * 资源路径生成器（适配Vite）
 * @param {string} _path 资源相对路径
 * @returns {string} 完整资源路径
 */
export function assetsPath(_path) {
  const isProduction = import.meta.env.PROD
  const assetsSubDirectory = isProduction ? 'assets' : 'assets'
  return `/${assetsSubDirectory}/${_path.replace(/^\//, '')}`
}

/**
 * 获取项目根路径
 * @param {string} dir 子目录
 * @returns {string} 绝对路径
 */
export function resolvePath(dir) {
  return path.resolve(process.cwd(), dir)
}