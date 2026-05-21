let x=null,d=null,c=0,v,w,o={};function b(){return x?Promise.resolve(x):d||(d=import(w).then(async e=>(typeof e.init=="function"&&await e.init(),x=e,e)).catch(e=>{throw d=null,e}),d)}function r(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function A(e){return r(e??"").replaceAll("&lt;mark&gt;","<mark>").replaceAll("&lt;/mark&gt;","</mark>")}function E(e){try{const t=new URL(e,window.location.origin).pathname.replace(/\/+$/g,"").split("/").filter(Boolean);return t.length?t.join(" › "):"/"}catch{return e}}function y(){const e=document.getElementById("search-wrapper"),s=document.querySelector("[data-search-page-input]"),t=document.querySelector("[data-search-page-clear]"),i=document.querySelector("[data-search-page-results]");if(!e||!s||!t||!i)return;w=e.dataset.pagefindScript,o=JSON.parse(e.dataset.i18n||"{}");function f(){i.innerHTML=`<div class="px-5 py-12 text-center">
        <div class="bg-base-200 text-base-content/45 mx-auto flex h-10 w-10 items-center justify-center rounded-full" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <p class="text-base-content/70 mt-3 text-sm">${r(o.typeToStart)}</p>
      </div>`}function k(){i.innerHTML=`<div class="px-5 py-12 text-center">
        <p class="text-base-content/70 inline-flex items-center gap-2 text-sm">
          <span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
          ${r(o.searching)}
        </p>
      </div>`}function L(n){i.innerHTML=`<div class="px-5 py-12 text-center">
        <div class="bg-base-200 text-base-content/45 mx-auto flex h-10 w-10 items-center justify-center rounded-full" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>
        </div>
        <p class="text-base-content/70 mt-3 text-sm">
          ${r(o.noResultsFor)}
          <span class="text-base-content font-semibold">"${r(n)}"</span>
        </p>
      </div>`}function T(n){const l=n.length,u=l===1?o.resultsCountOne:o.resultsCount,p=n.map(a=>{const m=r(a.meta?.title||a.url),h=r(E(a.url)),S=A(a.excerpt||"");return`<li>
            <a href="${r(a.url)}" class="search-result group block px-4 py-3 sm:px-5">
              <div class="text-base-content/45 group-hover:text-primary/70 flex items-center gap-1.5 text-[0.7rem] tracking-wide uppercase">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                <span class="truncate">${h}</span>
              </div>
              <h3 class="text-base-content group-hover:text-primary mt-0.5 text-[0.95rem] leading-snug font-semibold">${m}</h3>
              <p class="text-base-content/65 mt-1 line-clamp-2 text-[0.825rem] leading-snug">${S}</p>
            </a>
          </li>`}).join("");i.innerHTML=`<div>
        <div class="text-base-content/70 border-base-300 border-b px-4 py-2 text-[0.7rem] tracking-wide uppercase sm:px-5">${l} ${r(u)}</div>
        <ul class="divide-base-300 divide-y">${p}</ul>
      </div>`}async function $(n){const l=++c;try{const u=await b();if(l!==c)return;k();const p=await u.search(n);if(l!==c)return;if(!p?.results?.length){L(n);return}const a=p.results.slice(0,25),m=await Promise.all(a.map(h=>h.data()));if(l!==c)return;T(m)}catch(u){console.error(u),i.innerHTML='<p class="text-error px-5 py-6 text-sm">Search index not available.</p>'}}s.addEventListener("input",()=>{const n=s.value.trim();if(n?(t.classList.remove("hidden"),t.classList.add("inline-flex")):(t.classList.add("hidden"),t.classList.remove("inline-flex")),clearTimeout(v),!n){c++,f();return}v=setTimeout(()=>$(n),140)}),t.addEventListener("click",()=>{s.value="",t.classList.add("hidden"),t.classList.remove("inline-flex"),c++,f(),s.focus()}),b().catch(()=>{});const g=new URL(window.location.href).searchParams.get("q");g&&(s.value=g,s.dispatchEvent(new Event("input",{bubbles:!0})))}y();document.addEventListener("astro:page-load",y);
