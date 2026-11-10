// ==UserScript==
// @name         Instagram Limpo (sem Reels)
// @namespace    lucas.ig-limpo
// @version      1.0
// @description  Tira o feed de Reels, o Explorar, os sugeridos e os anúncios do Instagram no Safari. Reel avulso (salvo ou mandado por alguém) continua abrindo.
// @match        https://www.instagram.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
// 10/11/2026 — o Lucas não quis pagar R$ 60/mês no SocialLite: "o cara fez isso com o Claude, você consegue fazer também".
// Como funciona: o Instagram no navegador é uma página; este script esconde os botões/abas de Reels e Explorar,
// manda de volta pro início quem tentar abrir /reels/ ou /explore/, e tira do feed o que é "Sugestão" ou "Patrocinado".
// Reels SALVOS e reel que alguém te mandou (/reel/<código>) continuam abrindo normal.
(function () {
  'use strict'
  const BLOQ = /^\/(reels|explore)(\/|$)/
  const volta = () => { if (BLOQ.test(location.pathname)) location.replace('/') }
  volta()
  for (const f of ['pushState', 'replaceState']) {
    const orig = history[f]
    history[f] = function () { const r = orig.apply(this, arguments); setTimeout(volta, 0); return r }
  }
  addEventListener('popstate', volta)

  const css = `
    a[href="/reels/"], a[href^="/reels/?"], a[href="/explore/"], a[href^="/explore/?"] { display: none !important; }
    a[href="/reels/"] *, a[href="/explore/"] * { display: none !important; }
  `
  const st = document.createElement('style'); st.textContent = css
  ;(document.head || document.documentElement).appendChild(st)

  const RUIDO = /^(Sugestões para você|Sugerido para você|Suggested for you|Suggested posts|Patrocinado|Sponsored|Reels)$/i
  function limpar() {
    // posts do feed com selo de patrocinado/sugestão
    for (const art of document.querySelectorAll('article')) {
      if (art.dataset.igl) continue
      const txt = [...art.querySelectorAll('span, a, div')].slice(0, 60).map((e) => (e.childElementCount ? '' : e.textContent.trim()))
      if (txt.some((t) => RUIDO.test(t))) { art.style.display = 'none'; art.dataset.igl = '1' }
    }
    // blocos "Sugestões para você" / carrossel de Reels no meio do feed
    for (const el of document.querySelectorAll('h2, h3, span')) {
      if (el.childElementCount || !RUIDO.test(el.textContent.trim())) continue
      const bloco = el.closest('section, article, div[role="presentation"]') || el.parentElement?.parentElement
      if (bloco && !bloco.querySelector('textarea, input')) bloco.style.display = 'none'
    }
  }
  new MutationObserver(() => { clearTimeout(limpar.t); limpar.t = setTimeout(limpar, 150) }).observe(document.documentElement, { childList: true, subtree: true })
})()
