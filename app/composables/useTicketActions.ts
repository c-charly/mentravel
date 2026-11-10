// Actions sur un billet: export image ou PDF, partage WhatsApp, copie du lien, agenda.
import { downloadBlob, buildIcs } from '~/utils/ics'
import type { MaskedTicket } from '#shared/types'

export function useTicketActions(getEl: () => HTMLElement | null) {
  const { t } = useI18n()
  const busy = ref(false)
  const message = ref('')

  async function render(): Promise<Blob | null> {
    const el = getEl()
    if (!el) return null
    const { toBlob } = await import('html-to-image')
    el.classList.add('exporting')
    try {
      return await toBlob(el, { pixelRatio: 2, backgroundColor: '#fbf8f2', cacheBust: true })
    } finally {
      el.classList.remove('exporting')
    }
  }

  async function savePng(pnr: string) {
    busy.value = true
    try {
      const blob = await render()
      if (blob) downloadBlob(blob, `billet-${pnr}.png`)
    } finally {
      busy.value = false
    }
  }

  async function savePdf(pnr: string) {
    busy.value = true
    try {
      const blob = await render()
      if (!blob) return
      const dataUrl: string = await new Promise((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.readAsDataURL(blob)
      })
      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.src = dataUrl
      })
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const w = Math.min(pageW - 24, 150)
      const h = (img.height / img.width) * w
      pdf.addImage(dataUrl, 'PNG', (pageW - w) / 2, 14, w, h)
      pdf.save(`billet-${pnr}.pdf`)
    } finally {
      busy.value = false
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url)
    message.value = t('ticket.linkCopied')
    setTimeout(() => (message.value = ''), 2500)
  }

  async function shareWhatsapp(pnr: string, url: string) {
    const text = t('ticket.shareText', { pnr, url })
    busy.value = true
    try {
      const blob = await render()
      if (blob && navigator.canShare) {
        const file = new File([blob], `billet-${pnr}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text, title: 'MEN TRAVEL' })
          return
        }
      }
    } catch {
      // Partage annule ou non supporte: repli sur le lien WhatsApp
    } finally {
      busy.value = false
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  function addToCalendar(ticket: MaskedTicket, title: string, location: string) {
    const ics = buildIcs(ticket, title, location)
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), `voyage-${ticket.pnr}.ics`)
  }

  return { busy, message, savePng, savePdf, copyLink, shareWhatsapp, addToCalendar }
}
