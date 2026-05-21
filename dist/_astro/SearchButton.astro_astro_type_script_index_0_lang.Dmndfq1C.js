let b=null,p=null,f=0,c=-1,l=[],k,E,u={};function w(){return b?Promise.resolve(b):p||(p=import(E).then(async e=>(typeof e.init=="function"&&await e.init(),b=e,e)).catch(e=>{throw console.error("Failed to load Pagefind",e),p=null,e}),p)}function i(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function I(e){return i(e??"").replaceAll("&lt;mark&gt;","<mark>").replaceAll("&lt;/mark&gt;","</mark>")}function h(e,n){e.innerHTML=n,l=Array.from(e.querySelectorAll("[data-search-result-link]")),c=l.length>0?0:-1,S()}function A(e){h(e,`<div class="px-5 py-12 text-center">
        <div class="bg-base-200 text-base-content/45 mx-auto flex h-10 w-10 items-center justify-center rounded-full" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <p class="text-base-content/70 mt-3 text-sm">${i(u.typeToStart)}</p>
      </div>`)}function P(e){h(e,`<div class="px-5 py-12 text-center">
        <p class="text-base-content/70 inline-flex items-center gap-2 text-sm">
          <span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
          ${i(u.searching)}
        </p>
      </div>`)}function j(e,n){h(e,`<div class="px-5 py-12 text-center">
        <div class="bg-base-200 text-base-content/45 mx-auto flex h-10 w-10 items-center justify-center rounded-full" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>
        </div>
        <p class="text-base-content/70 mt-3 text-sm">
          ${i(u.noResultsFor)}
          <span class="text-base-content font-semibold">"${i(n)}"</span>
        </p>
      </div>`)}function M(e){try{const r=new URL(e,window.location.origin).pathname.replace(/\/+$/g,"").split("/").filter(Boolean);return r.length===0?"/":r.join(" › ")}catch{return e}}function R(e,n){const r=n.length,a=r===1?u.resultsCountOne:u.resultsCount,m=n.map((o,v)=>{const g=i(o.meta?.title||o.url),y=i(M(o.url)),t=I(o.excerpt||"");return`<li>
          <a
            data-search-result-link
            data-idx="${v}"
            href="${i(o.url)}"
            class="search-result group block px-4 py-3 sm:px-5"
          >
            <div class="text-base-content/45 group-hover:text-primary/70 flex items-center gap-1.5 text-[0.7rem] tracking-wide uppercase">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              <span class="truncate">${y}</span>
            </div>
            <h3 class="text-base-content group-hover:text-primary mt-0.5 text-[0.95rem] leading-snug font-semibold">${g}</h3>
            <p class="text-base-content/65 mt-1 line-clamp-2 text-[0.825rem] leading-snug">${t}</p>
          </a>
        </li>`}).join("");h(e,`<div>
        <div class="text-base-content/70 border-base-300 border-b px-4 py-2 text-[0.7rem] tracking-wide uppercase sm:px-5">
          ${r} ${i(a)}
        </div>
        <ul class="divide-base-300 divide-y" role="listbox">${m}</ul>
      </div>`)}function S(){l.forEach((e,n)=>{n===c?(e.setAttribute("data-active","true"),e.setAttribute("aria-selected","true"),e.scrollIntoView({block:"nearest"})):(e.removeAttribute("data-active"),e.setAttribute("aria-selected","false"))})}function L(e){l.length!==0&&(c=(c+e+l.length)%l.length,S())}function D(){return c<0||!l[c]?!1:(l[c].click(),!0)}function T(){const e=document.querySelector("[data-search-modal]"),n=document.querySelector("[data-search-input]"),r=document.querySelector("[data-search-clear]"),a=document.querySelector("[data-search-results]");if(!e||!n||!a||!r)return;E=e.dataset.pagefindScript,u=JSON.parse(e.dataset.i18n||"{}");function m(){n.value="",r.classList.add("hidden"),r.classList.remove("inline-flex"),A(a),f++}async function o(t){const s=++f;try{const d=await w();if(s!==f)return;P(a);const x=await d.search(t);if(s!==f)return;if(!x||!x.results||x.results.length===0){j(a,t);return}const $=x.results.slice(0,12),C=await Promise.all($.map(q=>q.data()));if(s!==f)return;R(a,C)}catch(d){console.error(d),h(a,'<p class="text-error px-5 py-6 text-sm">Search index not available. Run <code class="bg-base-200 rounded px-1">bun run build</code>.</p>')}}function v(){const t=n.value.trim();if(t?(r.classList.remove("hidden"),r.classList.add("inline-flex")):(r.classList.add("hidden"),r.classList.remove("inline-flex")),clearTimeout(k),!t){A(a);return}k=setTimeout(()=>o(t),140)}n.addEventListener("input",v),r.addEventListener("click",()=>{m(),n.focus()}),e.addEventListener("close",m),n.addEventListener("keydown",t=>{t.key==="ArrowDown"?(t.preventDefault(),L(1)):t.key==="ArrowUp"?(t.preventDefault(),L(-1)):t.key==="Enter"&&D()&&t.preventDefault()});async function g(){typeof e.showModal=="function"?e.showModal():e.setAttribute("open",""),w().catch(()=>{}),requestAnimationFrame(()=>n.focus())}document.querySelectorAll("[data-search-open]").forEach(t=>{t.addEventListener("click",g)});function y(t){if(!(t instanceof HTMLElement))return!1;if(t.isContentEditable)return!0;const s=t.tagName;return s==="INPUT"||s==="TEXTAREA"||s==="SELECT"}document.addEventListener("keydown",t=>{const s=(t.metaKey||t.ctrlKey)&&t.key.toLowerCase()==="k",d=t.key==="/"&&!t.metaKey&&!t.ctrlKey&&!t.altKey&&!y(t.target);(s||d)&&(t.preventDefault(),g())})}T();document.addEventListener("astro:page-load",T);
