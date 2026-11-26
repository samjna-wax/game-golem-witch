import test from 'node:test'
import assert from 'node:assert/strict'
import { copyText, programText } from '../src/copyProgram.js'

test('copies each selected machine’s installed lines, not its draft', () => {
  const fleet = [
    { program: ['水土', '土水', '无无'], draft: '火火' },
    { program: ['火水', '气无'], draft: '' },
    { program: [], draft: '水水' },
  ]
  assert.equal(programText(fleet[0]), '水土\n土水\n无无')
  assert.equal(programText(fleet[1]), '火水\n气无')
  assert.equal(programText(fleet[2]), '')
})

function documentStub(result) {
  const state = { removed: false }
  const area = { style: {}, setAttribute() {}, focus() {}, select() {}, remove() { state.removed = true } }
  return { state, area, doc: { createElement: () => area, body: { appendChild() {} }, execCommand: () => result } }
}

test('uses clipboard API when available', async () => {
  let copied
  assert.equal(await copyText('水土\n土水', { writeText: async text => { copied = text } }, {}), true)
  assert.equal(copied, '水土\n土水')
})

test('falls back on file pages or denied clipboard and reports failure', async () => {
  const fallback = documentStub(true)
  assert.equal(await copyText('水土\n土水', { writeText: async () => { throw Error('denied') } }, fallback.doc), true)
  assert.equal(fallback.area.value, '水土\n土水')
  assert.equal(fallback.state.removed, true)
  const failed = documentStub(false)
  assert.equal(await copyText('火水', null, failed.doc), false)
  assert.equal(failed.state.removed, true)
})
