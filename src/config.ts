require('dotenv').config()

export interface IFactorioStackConfig {
  cpu: number
  memory: number
  imageTag: string
}

const config: IFactorioStackConfig = {
  cpu: Number(process.env.CPU) || 256,
  memory: Number(process.env.MEMORY) || 1024,
  imageTag: process.env.IMAGE_TAG || 'stable',
}

export default config
