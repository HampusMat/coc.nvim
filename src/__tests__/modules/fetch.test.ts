import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { parse } from 'url'
import download from '../../model/download'
import fetch, { getAgent } from '../../model/fetch'
import helper from '../helper'

let connected = false
beforeAll(async () => {
  await helper.setup()
  connected = await helper.hasConnection()
})

afterAll(async () => {
  await helper.shutdown()
})

describe('fetch', () => {

  it('should fetch json', async () => {
    if (!connected) return
    let res = await fetch('https://nodejs.org/dist/index.json')
    expect(Array.isArray(res)).toBe(true)
  }, 10000)

  it('should fetch buffer', async () => {
    if (!connected) return
    let res = await fetch('https://www.npmjs.com/', { buffer: true })
    expect(Buffer.isBuffer(res)).toBe(true)
  })

  it('should throw on request error', async () => {
    if (!connected) return
    let err
    try {
      await fetch('http://not_exists_org')
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
  })

  it('should report valid proxy', async () => {
    if (!connected) return
    let agent = getAgent(parse('http://google.com'), { proxy: 'domain.com:1234' })
    expect(agent).toBe(null)

    agent = getAgent(parse('http://google.com'), { proxy: 'https://domain.com:1234' })
    let proxy = (agent as any).proxy
    expect(proxy.host).toBe('domain.com')
    expect(proxy.port).toBe(1234)

    agent = getAgent(parse('http://google.com'), { proxy: 'http://user:pass@domain.com:1234' })
    proxy = (agent as any).proxy
    expect(proxy.host).toBe('domain.com')
    expect(proxy.port).toBe(1234)
    expect(proxy.auth).toBe('user:pass')
  })
})

describe('download', () => {
  it('should download binary file', async () => {
    if (!connected) return
    let url = 'https://registry.npmjs.org/coc-pairs/-/coc-pairs-1.2.13.tgz'
    let tmpFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'coc-test'))
    let res = await download(url, { dest: tmpFolder })
    expect(fs.existsSync(res)).toBe(true)
    await fs.remove(tmpFolder)
  }, 10000)

  it('should download tgz', async () => {
    if (!connected) return
    let url = 'https://registry.npmjs.org/coc-pairs/-/coc-pairs-1.2.13.tgz'
    let tmpFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'coc-test'))
    await download(url, { dest: tmpFolder, extract: 'untar' })
    let file = path.join(tmpFolder, 'package.json')
    expect(fs.existsSync(file)).toBe(true)
    await fs.remove(tmpFolder)
  }, 10000)

  it('should extract zip file', async () => {
    if (!connected) return
    let url = 'https://codeload.github.com/chemzqm/vimrc/zip/master'
    let tmpFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'coc-test'))
    await download(url, { dest: tmpFolder, extract: 'unzip' })
    let folder = path.join(tmpFolder, 'vimrc-master')
    expect(fs.existsSync(folder)).toBe(true)
    await fs.remove(tmpFolder)
  }, 30000)
})
