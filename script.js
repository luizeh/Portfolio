document.documentElement.classList.remove("sem-js");

const semHover = window.matchMedia("(hover: none)");

// ===== CABEÇALHO =====
const linksNav = [...document.querySelectorAll(".nav-link")];
const secoes = linksNav.map((link) => document.querySelector(link.hash)).filter(Boolean);

// a seção ativa é a última cujo topo já passou de 40% da tela;
// no fim da página, o contato (rodapé) fica ativo
function atualizarLinkAtivo() {
  const linha = window.innerHeight * 0.4;
  const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let ativa = secoes[0];

  if (noFim) {
    ativa = secoes[secoes.length - 1];
  } else {
    secoes.forEach((secao) => {
      if (secao.getBoundingClientRect().top <= linha) ativa = secao;
    });
  }

  linksNav.forEach((link) => {
    const atual = link.hash === `#${ativa.id}`;
    link.classList.toggle("ativo", atual);
    if (atual) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

let quadroRolagem;
window.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(quadroRolagem);
    quadroRolagem = requestAnimationFrame(atualizarLinkAtivo);
  },
  { passive: true },
);
window.addEventListener("resize", atualizarLinkAtivo);
atualizarLinkAtivo();

// em telas de toque não há hover: mostra o nome da seção por um instante
linksNav.forEach((link) => {
  let temporizador;
  link.addEventListener("click", () => {
    if (!semHover.matches) return;
    linksNav.forEach((l) => l.classList.remove("mostrar-dica"));
    link.classList.add("mostrar-dica");
    clearTimeout(temporizador);
    temporizador = setTimeout(() => link.classList.remove("mostrar-dica"), 1400);
  });
});

// ===== FOTO DO HERO: INCLINAÇÃO 3D COM O MOUSE =====
const fotoHeroi = document.querySelector(".heroi-foto");
const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!semHover.matches && !movimentoReduzido.matches) {
  let quadroFoto;
  fotoHeroi.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(quadroFoto);
    quadroFoto = requestAnimationFrame(() => {
      const caixa = fotoHeroi.getBoundingClientRect();
      const x = (e.clientX - caixa.left) / caixa.width;
      const y = (e.clientY - caixa.top) / caixa.height;
      fotoHeroi.style.setProperty("--ry", `${(x - 0.5) * 22}deg`);
      fotoHeroi.style.setProperty("--rx", `${(0.5 - y) * 22}deg`);
      fotoHeroi.style.setProperty("--mx", `${x * 100}%`);
      fotoHeroi.style.setProperty("--my", `${y * 100}%`);
    });
  });

  fotoHeroi.addEventListener("pointerleave", () => {
    cancelAnimationFrame(quadroFoto);
    ["--rx", "--ry", "--mx", "--my"].forEach((prop) => fotoHeroi.style.removeProperty(prop));
  });
}

// ===== ANIMAÇÃO DE ENTRADA =====
const observadorRevelar = new IntersectionObserver(
  (entradas, observador) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add("visivel");
      observador.unobserve(entrada.target);
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".revelar").forEach((el) => observadorRevelar.observe(el));

// ===== CITAÇÃO: TRADUÇÃO POR TOQUE/CLIQUE =====
const fraseCitacao = document.querySelector(".citacao-frase");

fraseCitacao.addEventListener("click", () => {
  const aberta = fraseCitacao.getAttribute("aria-expanded") === "true";
  fraseCitacao.setAttribute("aria-expanded", String(!aberta));
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".citacao-texto")) fraseCitacao.setAttribute("aria-expanded", "false");
});

// ===== VITRINE DE PROJETOS =====
const vitrine = document.querySelector(".vitrine");
const projetos = [...vitrine.querySelectorAll(".projeto")];
const pontos = vitrine.querySelector(".vitrine-pontos");
const status = document.getElementById("vitrine-status");
let indiceAtual = 0;

projetos.forEach(() => pontos.appendChild(document.createElement("span")));

function irPara(indice, direcao) {
  const novo = (indice + projetos.length) % projetos.length;
  if (novo === indiceAtual) return;

  const saindo = projetos[indiceAtual];
  const entrando = projetos[novo];

  // o projeto que entra começa do lado da direção escolhida, sem transição
  entrando.style.transition = "none";
  entrando.style.setProperty("--desloc", `${direcao * 48}px`);
  entrando.offsetWidth;
  entrando.style.transition = "";

  saindo.style.setProperty("--desloc", `${-direcao * 48}px`);
  saindo.classList.remove("ativo");
  entrando.classList.add("ativo");

  indiceAtual = novo;
  atualizarVitrine();
  status.textContent = `${entrando.getAttribute("aria-label")}, projeto ${novo + 1} de ${projetos.length}`;
}

function atualizarVitrine() {
  projetos.forEach((projeto, i) => {
    const ativo = i === indiceAtual;
    projeto.inert = !ativo;
    projeto.setAttribute("aria-hidden", String(!ativo));
  });

  [...pontos.children].forEach((ponto, i) => ponto.classList.toggle("ativo", i === indiceAtual));
}

vitrine.querySelectorAll("[data-direcao]").forEach((botao) => {
  const direcao = Number(botao.dataset.direcao);
  botao.addEventListener("click", () => irPara(indiceAtual + direcao, direcao));
});

vitrine.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    irPara(indiceAtual + 1, 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    irPara(indiceAtual - 1, -1);
  }
});

// gesto de deslizar no celular
const palco = vitrine.querySelector(".vitrine-palco");
let toqueInicio = null;

palco.addEventListener(
  "touchstart",
  (e) => {
    const toque = e.changedTouches[0];
    toqueInicio = { x: toque.clientX, y: toque.clientY };
  },
  { passive: true },
);

palco.addEventListener("touchend", (e) => {
  if (!toqueInicio) return;
  const toque = e.changedTouches[0];
  const dx = toque.clientX - toqueInicio.x;
  const dy = toque.clientY - toqueInicio.y;
  toqueInicio = null;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
  const direcao = dx < 0 ? 1 : -1;
  irPara(indiceAtual + direcao, direcao);
});

atualizarVitrine();

// ===== ESTANTE DE ÁLBUNS (paginada) =====
const estante = document.querySelector(".estante");
const gradeAlbuns = estante.querySelector(".albuns-grade");
const albuns = [...gradeAlbuns.children];
const pontosEstante = estante.querySelector(".estante-pontos");
const [botaoAlbunsAnterior, botaoAlbunsProximo] = estante.querySelectorAll("[data-pagina]");
const statusEstante = document.getElementById("estante-status");
const LINHAS_POR_PAGINA = 3;
let paginaAtual = 0;
let porPagina = 0;

function totalPaginas() {
  return Math.ceil(albuns.length / porPagina);
}

function mostrarPagina(pagina, anunciar = false) {
  paginaAtual = Math.max(0, Math.min(pagina, totalPaginas() - 1));
  const inicio = paginaAtual * porPagina;
  albuns.forEach((album, i) => (album.hidden = i < inicio || i >= inicio + porPagina));

  [...pontosEstante.children].forEach((ponto, i) => ponto.classList.toggle("ativo", i === paginaAtual));
  botaoAlbunsAnterior.disabled = paginaAtual === 0;
  botaoAlbunsProximo.disabled = paginaAtual === totalPaginas() - 1;

  if (anunciar) {
    statusEstante.textContent = `Página ${paginaAtual + 1} de ${totalPaginas()}`;
    gradeAlbuns.classList.remove("trocando");
    gradeAlbuns.offsetWidth;
    gradeAlbuns.classList.add("trocando");
  }
}

// a quantidade por página segue o número de colunas definido no CSS
function configurarEstante() {
  const colunas = Number(getComputedStyle(estante).getPropertyValue("--colunas")) || 4;
  const novoPorPagina = colunas * LINHAS_POR_PAGINA;
  if (novoPorPagina === porPagina) return;

  const primeiroVisivel = paginaAtual * porPagina;
  porPagina = novoPorPagina;
  pontosEstante.replaceChildren(...Array.from({ length: totalPaginas() }, () => document.createElement("span")));
  mostrarPagina(Math.floor(primeiroVisivel / porPagina));
}

// a página com menos álbuns mantém a altura das cheias
function fixarAlturaEstante() {
  gradeAlbuns.style.minHeight = "";
  const paginaSalva = paginaAtual;
  mostrarPagina(0);
  gradeAlbuns.style.minHeight = `${gradeAlbuns.offsetHeight}px`;
  estante.parentElement.style.setProperty("--altura-pagina", `${gradeAlbuns.offsetHeight}px`);
  mostrarPagina(paginaSalva);
}

botaoAlbunsAnterior.addEventListener("click", () => mostrarPagina(paginaAtual - 1, true));
botaoAlbunsProximo.addEventListener("click", () => mostrarPagina(paginaAtual + 1, true));

estante.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    mostrarPagina(paginaAtual + 1, true);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    mostrarPagina(paginaAtual - 1, true);
  }
});

let toqueEstante = null;
estante.addEventListener(
  "touchstart",
  (e) => {
    const toque = e.changedTouches[0];
    toqueEstante = { x: toque.clientX, y: toque.clientY };
  },
  { passive: true },
);

estante.addEventListener("touchend", (e) => {
  if (!toqueEstante) return;
  const toque = e.changedTouches[0];
  const dx = toque.clientX - toqueEstante.x;
  const dy = toque.clientY - toqueEstante.y;
  toqueEstante = null;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
  mostrarPagina(paginaAtual + (dx < 0 ? 1 : -1), true);
});

configurarEstante();
window.addEventListener("load", fixarAlturaEstante);
window.addEventListener("resize", () => {
  configurarEstante();
  fixarAlturaEstante();
});

// ===== FILTRO DE TECNOLOGIAS =====
const filtros = [...document.querySelectorAll(".tec-filtro")];
const grupos = [...document.querySelectorAll(".tec-grupo")];

filtros.forEach((filtro) => {
  filtro.addEventListener("click", () => {
    const alvo = filtro.dataset.filtro;
    filtros.forEach((f) => f.setAttribute("aria-pressed", String(f === filtro)));
    grupos.forEach((grupo) => {
      grupo.hidden = alvo !== "todas" && grupo.dataset.grupo !== alvo;
    });
  });
});

// ===== RODAPÉ: ANO =====
document.getElementById("ano").textContent = new Date().getFullYear();
