const canvas = document.getElementById('board');
let ctx = canvas ? canvas.getContext('2d') : null;
let desenhando = false;

function ajustarCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
}

function limparCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function startDrawing(e) {
    desenhando = true;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.stroke();
}

function draw(e) {
    if (!desenhando) return;
    e.preventDefault();
    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function stopDrawing() {
    desenhando = false;
    if (ctx) ctx.beginPath();
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: Math.min(Math.max(0, (clientX - rect.left) * scaleX), canvas.width),
        y: Math.min(Math.max(0, (clientY - rect.top) * scaleY), canvas.height)
    };
}

if (canvas) {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); startDrawing(e); }, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    window.addEventListener('resize', () => { ajustarCanvas(); limparCanvas(); });
    ajustarCanvas();
}

let textoAtivo = false;

if (canvas) {
    canvas.addEventListener('dblclick', (e) => {
        if (textoAtivo) return;
        const posX = e.offsetX;
        const posY = e.offsetY;
        textoAtivo = true;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Digite...';
        Object.assign(input.style, {
            position: 'fixed',
            left: e.clientX + 'px',
            top: e.clientY + 'px',
            fontSize: '18px',
            padding: '6px',
            border: '2px solid #ffbd59',
            borderRadius: '6px',
            zIndex: '10000',
            fontFamily: 'Oswald, sans-serif'
        });
        document.body.appendChild(input);
        input.focus();
        input.addEventListener('keydown', (ke) => {
            if (ke.key === 'Enter') {
                const texto = input.value.trim();
                if (texto) {
                    ctx.font = '20px Oswald, sans-serif';
                    ctx.fillStyle = '#000';
                    ctx.fillText(texto, posX, posY);
                }
                input.remove();
                textoAtivo = false;
            } else if (ke.key === 'Escape') {
                input.remove();
                textoAtivo = false;
            }
        });
    });
}

function criarItemTarefa(texto) {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;cursor:pointer;';

    const span = document.createElement('span');
    span.textContent = texto;
    span.style.cssText = 'flex:1;transition:all 0.2s;';

    const btnX = document.createElement('button');
    btnX.textContent = '✕';
    btnX.style.cssText = 'display:none;background:none;border:none;color:#e74c3c;font-size:16px;font-weight:bold;cursor:pointer;padding:0 4px;line-height:1;';

    span.addEventListener('click', () => {
        const riscado = span.style.textDecoration === 'line-through';
        if (riscado) {
            span.style.textDecoration = '';
            span.style.opacity = '1';
            btnX.style.display = 'none';
        } else {
            span.style.textDecoration = 'line-through';
            span.style.opacity = '0.5';
            btnX.style.display = 'inline';
        }
    });

    btnX.addEventListener('click', (e) => {
        e.stopPropagation();
        li.remove();
    });

    li.appendChild(span);
    li.appendChild(btnX);
    return li;
}

function addTarefa() {
    const input = document.getElementById('novaTarefa');
    const tarefa = input.value.trim();
    if (!tarefa) return;
    document.getElementById('listaTarefas').appendChild(criarItemTarefa(tarefa));
    input.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById('listaTarefas');
    if (!lista) return;
    Array.from(lista.querySelectorAll('li')).forEach(li => {
        const texto = li.textContent.replace(/^✔\s*/, '').trim();
        li.replaceWith(criarItemTarefa(texto));
    });
});

let dragSrc = null;
let ghost = null;
let placeholder = null;
let lastTarget = null;
let mouseX = 0;
let mouseY = 0;
let rafId = null;

function getCards() {
    return Array.from(document.querySelectorAll('.container .card'));
}

function createGhost(card) {
    const rect = card.getBoundingClientRect();
    const g = card.cloneNode(true);
    Object.assign(g.style, {
        position: 'fixed',
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        opacity: '0.75',
        pointerEvents: 'none',
        zIndex: '9999',
        boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
        borderRadius: '12px',
        margin: '0',
        transition: 'none'
    });
    document.body.appendChild(g);
    return g;
}

function createPlaceholder(card) {
    const p = document.createElement('div');
    p.style.cssText = `
        border-radius: 12px;
        border: 2px dashed #c8a05a;
        background: rgba(216,153,58,0.08);
        box-sizing: border-box;
        height: 340px;
        transition: none;
    `;
    return p;
}

function findTargetCard(x, y) {
    const cards = getCards();
    for (const card of cards) {
        const r = card.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
            return card;
        }
    }
    return null;
}

function dragLoop() {
    if (!ghost) return;

    ghost.style.left = (mouseX - ghost.offsetWidth / 2) + 'px';
    ghost.style.top = (mouseY - ghost.offsetHeight / 2) + 'px';

    const target = findTargetCard(mouseX, mouseY);

    if (target && target !== lastTarget) {
        lastTarget = target;
        const container = document.querySelector('.container');
        const allChildren = Array.from(container.children);
        const phIdx = allChildren.indexOf(placeholder);
        const tgIdx = allChildren.indexOf(target);

        if (phIdx < tgIdx) {
            container.insertBefore(placeholder, target.nextSibling);
        } else {
            container.insertBefore(placeholder, target);
        }
    }

    rafId = requestAnimationFrame(dragLoop);
}

document.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    const card = handle.closest('.card');
    if (!card) return;
    const pinBtn = card.querySelector('.pin-btn');
    if (pinBtn && pinBtn.getAttribute('data-pinned') === 'true') return;

    e.preventDefault();

    dragSrc = card;
    lastTarget = null;
    mouseX = e.clientX;
    mouseY = e.clientY;

    ghost = createGhost(card);

    placeholder = createPlaceholder(card);
    card.parentNode.insertBefore(placeholder, card);
    card.style.display = 'none';

    rafId = requestAnimationFrame(dragLoop);
});

document.addEventListener('mousemove', (e) => {
    if (!dragSrc) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('mouseup', () => {
    if (!dragSrc) return;
    cancelAnimationFrame(rafId);

    placeholder.parentNode.insertBefore(dragSrc, placeholder);
    dragSrc.style.display = '';
    placeholder.remove();
    ghost.remove();

    dragSrc = null;
    ghost = null;
    placeholder = null;
    lastTarget = null;

    saveOrder();
});

function saveOrder() {
    const order = getCards().map(c => c.querySelector('h2')?.textContent.trim() || '');
    localStorage.setItem('studyCardOrder', JSON.stringify(order));
}

function loadOrder() {
    const raw = localStorage.getItem('studyCardOrder');
    if (!raw) return;
    const order = JSON.parse(raw);
    const container = document.querySelector('.container');
    if (!container) return;
    order.forEach(title => {
        const card = getCards().find(c => c.querySelector('h2')?.textContent.trim() === title);
        if (card) container.appendChild(card);
    });
}

function initPins() {
    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.card');
            const pinned = btn.getAttribute('data-pinned') === 'true';
            btn.setAttribute('data-pinned', String(!pinned));
            btn.textContent = pinned ? '📌' : '📍';
            card.classList.toggle('pinned', !pinned);
        });
    });
}

window.addEventListener('load', () => {
    initPins();
    loadOrder();
});