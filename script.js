document.documentElement.classList.remove("sem-js");

const semHover = window.matchMedia("(hover: none)");
const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

// ===== ROLAGEM SUAVE (Lenis) =====
// a página desliza com inércia em vez de pular; no toque o celular já faz isso sozinho
let lenis = null;

if (window.Lenis && !movimentoReduzido.matches) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });

  function rolar(tempo) {
    lenis.raf(tempo);
    requestAnimationFrame(rolar);
  }
  requestAnimationFrame(rolar);

  // links internos (#secao) também deslizam, descontando a altura do cabeçalho
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const alvo = document.querySelector(link.hash);
      if (!alvo) return;
      e.preventDefault();
      const alturaCabecalho = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--altura-cabecalho")) || 0;
      lenis.scrollTo(alvo, { offset: -alturaCabecalho, duration: 1.2 });
      history.replaceState(null, "", link.hash);
    });
  });
}

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

// ===== ROLAGEM DO HERO =====
// --rolagem vai de 0 (topo) a 1 (hero quase fora da tela) e abre o header
const heroi = document.querySelector(".heroi");

function atualizarRolagemHeroi() {
  const progresso = Math.min(1, Math.max(0, window.scrollY / (heroi.offsetHeight * 0.75)));
  document.documentElement.style.setProperty("--rolagem", progresso.toFixed(4));
}

function aoRolar() {
  atualizarLinkAtivo();
  atualizarRolagemHeroi();
}

let quadroRolagem;
window.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(quadroRolagem);
    quadroRolagem = requestAnimationFrame(aoRolar);
  },
  { passive: true },
);
window.addEventListener("resize", aoRolar);
aoRolar();

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

// ===== NOME DO HERO: LETRAS QUE AFINAM PERTO DO MOUSE =====
const letras = [];

document.querySelectorAll(".heroi-palavra").forEach((palavra) => {
  const texto = palavra.textContent.trim();
  palavra.textContent = "";
  [...texto].forEach((caractere) => {
    const letra = document.createElement("span");
    letra.className = "letra";
    letra.textContent = caractere;
    letra.style.setProperty("--i", letras.length);
    palavra.appendChild(letra);
    letras.push(letra);
  });
});

if (!semHover.matches && !movimentoReduzido.matches) {
  const ALCANCE = 260;
  let quadroLetras;

  heroi.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(quadroLetras);
    quadroLetras = requestAnimationFrame(() => {
      letras.forEach((letra) => {
        const caixa = letra.getBoundingClientRect();
        const distancia = Math.hypot(e.clientX - (caixa.left + caixa.width / 2), e.clientY - (caixa.top + caixa.height / 2));
        const perto = Math.max(0, 1 - distancia / ALCANCE);
        letra.style.setProperty("--peso", Math.round(800 - 680 * perto * perto));
      });
    });
  });

  heroi.addEventListener("pointerleave", () => {
    cancelAnimationFrame(quadroLetras);
    letras.forEach((letra) => letra.style.removeProperty("--peso"));
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

// ===== ESTRELINHAS DO CURSOR =====
// de vez em quando sai uma estrelinha discreta do cursor.
// só com mouse (no toque não tem cursor) e sem a opção de reduzir movimento
if (!semHover.matches && !movimentoReduzido.matches) {
  const telaRastro = document.createElement("canvas");
  telaRastro.className = "rastro-cursor";
  telaRastro.setAttribute("aria-hidden", "true");
  document.body.appendChild(telaRastro);
  const pincelRastro = telaRastro.getContext("2d");

  // cores da paleta do site ("78 168 232" vira "78,168,232" para o rgba)
  const raiz = getComputedStyle(document.documentElement);
  const rgbBrilho = raiz.getPropertyValue("--brilho-rgb").trim().split(/\s+/).join(",");
  const rgbAcento = raiz.getPropertyValue("--acento-rgb").trim().split(/\s+/).join(",");
  const CORES_ESTRELINHA = [rgbBrilho, rgbAcento];

  const estrelinhas = [];
  let ultimoPonto = null;
  let distanciaAcumulada = 0;
  let animando = false;
  let tempoAnterior = 0;

  const sortear = (min, max) => min + Math.random() * (max - min);

  function medirRastro() {
    const densidade = window.devicePixelRatio || 1;
    telaRastro.width = Math.round(window.innerWidth * densidade);
    telaRastro.height = Math.round(window.innerHeight * densidade);
    pincelRastro.setTransform(densidade, 0, 0, densidade, 0, 0);
  }
  medirRastro();
  window.addEventListener("resize", medirRastro);

  function soltarEstrelinha(x, y) {
    estrelinhas.push({
      x: x + sortear(-6, 6),
      y: y + sortear(-6, 6),
      vx: sortear(-0.25, 0.25),
      vy: sortear(-0.35, 0.05),
      tamanho: sortear(2, 3.6),
      giro: sortear(0, Math.PI),
      velocidadeGiro: sortear(-0.04, 0.04),
      vida: 0,
      duracao: sortear(700, 1100),
      cor: CORES_ESTRELINHA[Math.floor(Math.random() * CORES_ESTRELINHA.length)],
    });
  }

  // estrela de quatro pontas com as laterais curvadas para dentro
  function desenharEstrelinha(estrela, opacidade) {
    const t = estrela.tamanho;
    pincelRastro.save();
    pincelRastro.translate(estrela.x, estrela.y);
    pincelRastro.rotate(estrela.giro);
    pincelRastro.beginPath();
    pincelRastro.moveTo(0, -t);
    pincelRastro.quadraticCurveTo(0, 0, t, 0);
    pincelRastro.quadraticCurveTo(0, 0, 0, t);
    pincelRastro.quadraticCurveTo(0, 0, -t, 0);
    pincelRastro.quadraticCurveTo(0, 0, 0, -t);
    pincelRastro.fillStyle = `rgba(${estrela.cor}, ${opacidade})`;
    pincelRastro.shadowColor = `rgba(${rgbBrilho}, ${opacidade * 0.6})`;
    pincelRastro.shadowBlur = 4;
    pincelRastro.fill();
    pincelRastro.restore();
  }

  function quadroRastro(agora) {
    const dt = Math.min(48, agora - tempoAnterior || 16);
    const passo = dt / 16;
    tempoAnterior = agora;
    pincelRastro.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // estrelinhas: flutuam, giram devagar e somem
    for (let i = estrelinhas.length - 1; i >= 0; i--) {
      const estrela = estrelinhas[i];
      estrela.vida += dt;
      if (estrela.vida >= estrela.duracao) {
        estrelinhas.splice(i, 1);
        continue;
      }
      estrela.vy += 0.004 * passo;
      estrela.x += estrela.vx * passo;
      estrela.y += estrela.vy * passo;
      estrela.giro += estrela.velocidadeGiro * passo;
      const progresso = estrela.vida / estrela.duracao;
      // aparece rápido, some devagar, e nunca fica totalmente opaca
      const opacidade = Math.min(1, progresso * 5) * (1 - progresso) * 0.55;
      desenharEstrelinha(estrela, opacidade);
    }

    if (estrelinhas.length) {
      requestAnimationFrame(quadroRastro);
    } else {
      animando = false;
    }
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;

    // uma estrelinha a cada ~90px andados, então quase não aparecem com o mouse devagar
    if (ultimoPonto) {
      distanciaAcumulada += Math.hypot(e.clientX - ultimoPonto.x, e.clientY - ultimoPonto.y);
      if (distanciaAcumulada > 90) {
        distanciaAcumulada = 0;
        soltarEstrelinha(e.clientX, e.clientY);
        if (!animando) {
          animando = true;
          tempoAnterior = performance.now();
          requestAnimationFrame(quadroRastro);
        }
      }
    }
    ultimoPonto = { x: e.clientX, y: e.clientY };
  });

  // mouse saiu da janela: o próximo movimento começa do zero
  document.documentElement.addEventListener("mouseleave", () => (ultimoPonto = null));
}

// ===== RODAPÉ: ANO =====
document.getElementById("ano").textContent = new Date().getFullYear();
