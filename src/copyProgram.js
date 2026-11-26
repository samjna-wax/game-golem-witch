// The installed program, rather than the editable draft, is the source of truth.
export function programText(machine) {
  return machine.program.join('\n')
}

export async function copyText(text, clipboard = navigator.clipboard, doc = document) {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // File URLs and browsers without clipboard permission may need the fallback.
    }
  }
  const area = doc.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  doc.body.appendChild(area)
  try {
    area.focus()
    area.select()
    return !!doc.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}
