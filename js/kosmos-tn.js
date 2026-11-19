/* Kosmos.rb en Tienda Nube (Ipanema): lo que la tienda nativa no trae y estaba en la propuesta aprobada.
   - Cobran solo por WhatsApp (el usuario, 19/11): sin "Iniciar compra" (carrito lateral y /comprar/) y sin
     camino al checkout con Enter.
   - Precios sin ",00": Tienda Nube siempre formatea con 2 decimales y no tiene opción para sacarlos.
   - "Enviar pedido por WhatsApp" en el carrito (el lateral y la página del carrito), con la lista que muestra
     Tienda Nube: producto, variante, cantidad, precio y total. El mensaje se arma en el momento del toque.
   - "Consultar por WhatsApp" en la ficha, con el producto y la variedad elegida.
   - Barra fija de compra en el celu, etiqueta "N variedades" en las tarjetas, accesos activos,
     precio del kit (si está en la grilla) y el WhatsApp flotante recién al bajar.
   Se carga desde templates/layout/cart_drawer.json, que está en todas las páginas. Generado a mano; lo copia
   armar_tienda_tn.py al repo público. */
(() => {
  "use strict";
  if (window.KZ_LISTO) return;
  window.KZ_LISTO = true;
  const C = window.KZ_CONFIG || {};
  const NUMERO = C.whatsapp || "542215425700";
  const wa = texto => `https://wa.me/${NUMERO}?text=${encodeURIComponent(texto)}`;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const limpio = s => (s || "").replace(/\s+/g, " ").trim();
  const HOLA = "¡Hola Kosmos! Quiero hacer un pedido.";
  const ICONO_WA = '<svg class="kz-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z"/></svg>';
  document.documentElement.classList.add("kz-js");
  if (C.checkout === false) document.documentElement.classList.add("kz-sin-checkout");

  /* ---------- Precios sin ",00" (en tarjetas, ficha, carrito, avisos y el mensaje de WhatsApp) ---------- */
  // Solo el texto que se ve: las cuentas de Tienda Nube usan sus datos (data-priceraw), no este texto.
  const CENTAVOS = /(\$\s?\d{1,3}(?:\.\d{3})*),00(?!\d)/g;
  const sinCentavos = s => (s || "").replace(CENTAVOS, "$1");
  function limpiarPrecios(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) {
      if (raiz.nodeValue.indexOf(",00") >= 0) {
        const nuevo = sinCentavos(raiz.nodeValue);
        if (nuevo !== raiz.nodeValue) raiz.nodeValue = nuevo;
      }
      return;
    }
    if (raiz.nodeType !== 1 && raiz.nodeType !== 9) return;
    const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (recorrido.nextNode()) {
      const n = recorrido.currentNode;
      if (n.nodeValue.indexOf(",00") >= 0 && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode && n.parentNode.nodeName)) nodos.push(n);
    }
    nodos.forEach(limpiarPrecios);
  }
  window.KZ_SIN_CENTAVOS = sinCentavos;

  /* ---------- Sin checkout: el pedido va por WhatsApp ---------- */
  const SIN_CHECKOUT = C.checkout === false;
  // Enter en la cantidad envía el formulario con el botón oculto "Iniciar compra": se frena.
  document.addEventListener("submit", e => {
    if (SIN_CHECKOUT && e.submitter && e.submitter.name === "go_to_checkout") e.preventDefault();
  }, true);

  /* ---------- Carrito -> pedido por WhatsApp ---------- */
  function textoPedido(raiz) {
    const lineas = $$(".js-cart-item", raiz).map(it => {
      const nombre = limpio($(".cart-item-name", it)?.textContent);
      const variante = limpio($(".cart-item-variant", it)?.textContent).replace(/^\((.*)\)$/, "$1");
      const cantidad = $(".js-cart-quantity-input", it)?.value || "1";
      const precio = sinCentavos(limpio($(".js-cart-item-subtotal", it)?.textContent));
      return `• ${cantidad} x ${nombre}${variante ? ` (${variante})` : ""}${precio ? `: ${precio}` : ""}`;
    }).filter(l => l.length > 6);
    if (!lineas.length) return HOLA;
    const total = sinCentavos(limpio($(".js-cart-total", raiz)?.textContent));
    return "¡Hola Kosmos! Quiero hacer este pedido:\n" + lineas.join("\n") + (total ? `\nTotal: ${total}` : "");
  }
  window.KZ_PEDIDO = textoPedido;  // para probarlo

  function ponerBotonCarrito() {
    const lugares = [];
    const modal = $("#modal-cart");
    if (modal) lugares.push([modal, $(".js-ajax-cart-submit", modal)]);
    const pagina = $("#go-to-checkout");
    if (pagina) lugares.push([pagina.closest("form") || document, pagina]);
    for (const [raiz, ancla] of lugares) {
      if (!ancla || $(".kz-wa-pedido", raiz)) continue;
      const a = document.createElement("a");
      a.className = "kz-wa-pedido";
      a.target = "_blank";
      a.rel = "noopener";
      a.href = wa(HOLA);
      a.innerHTML = ICONO_WA + "<span>Enviar pedido por WhatsApp</span>";
      ancla.parentNode.insertBefore(a, ancla);
      a.href = wa(textoPedido(raiz));
    }
  }
  // El mensaje se arma al tocar, con lo que muestra el carrito en ese momento.
  document.addEventListener("click", e => {
    const b = e.target.closest(".kz-wa-pedido");
    if (b) b.href = wa(textoPedido(b.closest("#modal-cart") || b.closest("form") || document));
  }, true);

  /* ---------- Ficha: consultar por WhatsApp y barra fija ---------- */
  function textoConsulta() {
    const nombre = limpio($(".js-product-name")?.textContent);
    const variante = $$(".js-product-variants .js-insta-variation-label").map(x => limpio(x.textContent)).filter(Boolean).join(" / ");
    return nombre ? `¡Hola Kosmos! Quiero consultar por ${nombre}${variante ? ` (${variante})` : ""}.` : "¡Hola Kosmos! Quiero hacer una consulta.";
  }
  const CONSULTAR = "#ns-block-kz_consultar, [data-kz-consultar]";
  function botonConsultar() {
    const b = $(CONSULTAR);
    if (!b || b.dataset.kzListo) return;
    b.dataset.kzListo = "1";
    b.target = "_blank";
    b.rel = "noopener";
    b.classList.add("kz-consultar");
    b.insertAdjacentHTML("afterbegin", ICONO_WA);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest(CONSULTAR);
    if (b) b.href = wa(textoConsulta());
  }, true);

  function barraFija() {
    const form = $("#product_form");
    const boton = form && $("input.js-addtocart", form);
    if (!boton || $(".kz-barra")) return;
    const barra = document.createElement("div");
    barra.className = "kz-barra";
    barra.setAttribute("aria-hidden", "true");
    barra.innerHTML = '<div class="kz-barra__texto"><strong></strong><span></span></div><button type="button" class="kz-barra__btn">Agregar</button>';
    document.body.appendChild(barra);
    $(".kz-barra__btn", barra).addEventListener("click", () => boton.click());
    // aparece cuando el botón "Agregar al carrito" quedó arriba, fuera de la pantalla (con scroll: también si se salta)
    let espera = false;
    const revisar = () => {
      espera = false;
      const ver = boton.getBoundingClientRect().bottom < 0 && !boton.disabled && boton.offsetParent !== null;
      if (ver) {
        $("strong", barra).textContent = limpio($(".js-product-name")?.textContent);
        $("span", barra).textContent = limpio($("#price_display")?.textContent);
      }
      barra.classList.toggle("visible", ver);
      barra.setAttribute("aria-hidden", String(!ver));
      document.body.classList.toggle("kz-con-barra", ver);
    };
    window.addEventListener("scroll", () => { if (!espera) { espera = true; requestAnimationFrame(revisar); } }, { passive: true });
    revisar();
  }

  /* ---------- Tarjetas: "N variedades" ---------- */
  function etiquetas() {
    $$(".js-item-product[data-variants]").forEach(item => {
      if (item.dataset.kzEtiqueta) return;
      item.dataset.kzEtiqueta = "1";
      let variantes = [];
      try { variantes = JSON.parse(item.getAttribute("data-variants")); } catch (e) { return; }
      const caja = $(".product-item-image-container", item);
      if (caja && variantes.length > 1) caja.insertAdjacentHTML("beforeend", `<span class="kz-etiqueta">${variantes.length} variedades</span>`);
    });
  }

  /* ---------- Accesos (chips) y kit ---------- */
  function accesos() {
    const ruta = location.pathname.replace(/\/?$/, "/");
    $$(".kz .chips").forEach(fila => {
      let activo = null;
      $$("[data-chip]", fila).forEach(ch => {
        const destino = ch.getAttribute("data-chip");
        const es = ruta === destino || (destino !== "/productos/" && ruta.startsWith(destino));
        ch.setAttribute("aria-current", es ? "page" : "false");
        if (es) activo = ch;
      });
      if (activo) fila.scrollLeft = activo.offsetLeft - (fila.clientWidth - activo.offsetWidth) / 2;
    });
    const precio = $("[data-kz-precio]");
    const tarjeta = precio && $(`.js-item-product[data-product-id="${precio.dataset.kzPrecio}"] .js-price-display`);
    if (tarjeta) precio.textContent = limpio(tarjeta.textContent);
  }

  /* ---------- Aviso de "agregado": botón "Ver carrito" (como en la propuesta) ---------- */
  function verCarritoEnAviso() {
    const caja = $(".js-notification-cart .notification-info-container");
    if (!caja || $(".kz-ver-carrito", caja)) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "kz-ver-carrito";
    b.textContent = "Ver carrito";
    b.addEventListener("click", () => {
      $(".js-cart-notification-close-private")?.click();
      $('.js-cart-container [data-target="#modal-cart"]')?.click();
    });
    caja.appendChild(b);
  }

  /* ---------- Menú del celu: "Ayuda" con cómo comprar, WhatsApp e Instagram ---------- */
  function menuAyuda() {
    const cuerpo = $("#nav-hamburger > .modal-body");
    if (!cuerpo || $(".kz-menu-extra", cuerpo)) return;
    cuerpo.insertAdjacentHTML("beforeend", '<div class="kz-menu-extra"><p>Ayuda</p>' +
      '<a href="/#como-comprar">Cómo comprar</a>' +
      `<a href="${wa(HOLA)}" target="_blank" rel="noopener">WhatsApp ${ICONO_WA}</a>` +
      '<a href="https://instagram.com/kosmos_rb" target="_blank" rel="noopener">Instagram</a></div>');
  }

  /* ---------- Aviso de cookies (pastilla): no tapa la primera pantalla ni los botones de compra (como en Axily) ---------- */
  function cookies() {
    const raiz = document.documentElement;
    let espera = null;
    const revisar = () => {
      espera = null;
      const zona = window.innerHeight - 70;  // la pastilla vive en los últimos ~70 px de la pantalla
      const tapa = $$(".kz .hero .botones, #product_form .product-actions, #ns-block-kz_consultar").some(el => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.bottom > zona && r.top < window.innerHeight;
      });
      raiz.classList.toggle("kz-cookies-espera", window.scrollY < window.innerHeight * 0.5 || tapa);
    };
    window.addEventListener("scroll", () => { if (!espera) espera = requestAnimationFrame(revisar); }, { passive: true });
    window.addEventListener("resize", revisar);
    revisar();
  }

  /* ---------- WhatsApp flotante (el nativo): aparece al bajar ---------- */
  function flotante() {
    const b = $(".btn-whatsapp");
    if (!b) return;
    document.documentElement.classList.add("kz-flotante");
    const ver = () => b.classList.toggle("kz-visible", window.scrollY > 600);
    window.addEventListener("scroll", ver, { passive: true });
    ver();
  }

  function todo() {
    ponerBotonCarrito();
    etiquetas();
    botonConsultar();
    verCarritoEnAviso();
    menuAyuda();
  }
  let pendiente = false;
  new MutationObserver(registros => {
    for (const r of registros) {
      if (r.type === "characterData") limpiarPrecios(r.target);
      else r.addedNodes.forEach(limpiarPrecios);
    }
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; todo(); });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  limpiarPrecios(document.body);
  todo();
  barraFija();
  accesos();
  flotante();
  cookies();
  window.KZ_OK = true;
})();
