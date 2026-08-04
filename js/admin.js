import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
    getAuth,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    setDoc,
    addDoc,
    doc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBvE1SHjQEC_gzslhCd51EGvgI0zAwgsuc",
    authDomain: "study-plus-89936.firebaseapp.com",
    projectId: "study-plus-89936",
    storageBucket: "study-plus-89936.firebasestorage.app",
    messagingSenderId: "685590718796",
    appId: "1:685590718796:web:1499dc6a21c204ce7447e9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let cargoAdminLogado = "Admin";

const paginas = document.querySelectorAll(".pagina");
const menus = document.querySelectorAll(".sidebar li[data-page]");

menus.forEach(menu => {
    menu.addEventListener("click", () => {
        menus.forEach(m => m.classList.remove("active"));
        menu.classList.add("active");
        paginas.forEach(p => p.classList.remove("ativa"));
        document.getElementById(menu.dataset.page).classList.add("ativa");
    });
});

const toast = document.getElementById("toast");
const toastTexto = document.getElementById("toastTexto");

function mostrarToast(texto) {
    toastTexto.innerText = texto;
    toast.classList.add("ativo");
    setTimeout(() => {
        toast.classList.remove("ativo");
    }, 3000);
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    
    try {
        const adminDoc = await getDocs(query(collection(db, "admins"), where("email", "==", user.email)));
        if (!adminDoc.empty) {
            cargoAdminLogado = adminDoc.docs[0].data().cargo || "Admin";
        } else {
            window.location.href = "login.html";
            return;
        }
        
        document.getElementById("adminNome").innerText = user.displayName || "Administrador";
        document.getElementById("adminCargo").innerText = cargoAdminLogado;
    } catch(e) {
        document.getElementById("adminNome").innerText = user.displayName || "Administrador";
        document.getElementById("adminCargo").innerText = "Admin";
    }
    
    carregarDashboard();
});

document.getElementById("logout").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
});

function formatarData(firebaseData) {
    if (firebaseData && typeof firebaseData.toDate === 'function') {
        return firebaseData.toDate().toLocaleDateString('pt-BR');
    }
    return firebaseData || "-";
}

function animarContador(elemento, valorFinal) {
    let valorAtual = 0;
    const duracao = 1000;
    const passo = Math.ceil(valorFinal / (duracao / 16));
    
    if(valorFinal === 0) {
        elemento.innerText = 0;
        return;
    }

    const temporizador = setInterval(() => {
        valorAtual += passo;
        if (valorAtual >= valorFinal) {
            elemento.innerText = valorFinal;
            clearInterval(temporizador);
        } else {
            elemento.innerText = valorAtual;
        }
    }, 16);
}

async function carregarDashboard() {
    try {
        const [usuarios, admins, materias, questoes, simulados] = await Promise.all([
            getDocs(collection(db, "usuarios")),
            getDocs(collection(db, "admins")),
            getDocs(collection(db, "materias")),
            getDocs(collection(db, "questoes")),
            getDocs(collection(db, "simulados"))
        ]);

        animarContador(document.getElementById("totalUsuarios"), usuarios.size);
        animarContador(document.getElementById("totalAdmins"), admins.size);
        animarContador(document.getElementById("totalMaterias"), materias.size);
        animarContador(document.getElementById("totalQuestoes"), questoes.size);
        animarContador(document.getElementById("totalSimulados"), simulados.size);

        rUsuarios.innerText = usuarios.size;
        rAdmins.innerText = admins.size;
        rMaterias.innerText = materias.size;
        rQuestoes.innerText = questoes.size;
        rSimulados.innerText = simulados.size;

        carregarUltimosUsuarios();
    } catch (e) {
        console.error(e);
        mostrarToast("Erro ao carregar dados do dashboard");
    }
}

async function carregarUltimosUsuarios() {
    const tabela = document.getElementById("ultimosUsuarios");
    tabela.innerHTML = "";
    const q = query(collection(db, "usuarios"), orderBy("criadoEm", "desc"), limit(5));
    
    try {
        const dados = await getDocs(q);
        dados.forEach(usuario => {
            const u = usuario.data();
            tabela.innerHTML += `
            <tr>
                <td>${u.nome || "-"}</td>
                <td>${u.email || "-"}</td>
                <td>${formatarData(u.criadoEm)}</td>
                <td><span class="status ativo">Ativo</span></td>
            </tr>`;
        });
    } catch (e) {
        console.error(e);
    }
}

document.getElementById("atualizarUsuarios").addEventListener("click", () => {
    carregarUltimosUsuarios();
    mostrarToast("Usuários atualizados");
});

async function carregarUsuarios() {
    const tabela = document.getElementById("listaUsuarios");
    tabela.innerHTML = "";
    try {
        const dados = await getDocs(collection(db, "usuarios"));
        dados.forEach(usuario => {
            const u = usuario.data();
            tabela.innerHTML += `
            <tr>
                <td>${u.nome || "-"}</td>
                <td>${u.email || "-"}</td>
                <td>${formatarData(u.criadoEm)}</td>
                <td><span class="status ativo">Ativo</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-ver">Ver</button>
                        <button class="btn btn-excluir" onclick="removerUsuario('${usuario.id}')">Excluir</button>
                    </div>
                </td>
            </tr>`;
        });
    } catch (e) {
        console.error(e);
    }
}

document.querySelector('[data-page="usuarios"]').addEventListener("click", carregarUsuarios);

window.removerUsuario = async (id) => {
    if (confirm("Tens a certeza que desejas remover este utilizador?")) {
        try {
            await deleteDoc(doc(db, "usuarios", id));
            mostrarToast("Usuário removido");
            carregarUsuarios();
            carregarDashboard();
        } catch (e) {
            mostrarToast("Erro ao remover usuário");
        }
    }
};

async function carregarAdmins() {
    const tabela = document.getElementById("listaAdmins");
    if (!tabela) return;
    tabela.innerHTML = "";
    try {
        const dados = await getDocs(collection(db, "admins"));
        dados.forEach(admin => {
            const a = admin.data();
            tabela.innerHTML += `
            <tr>
                <td>${a.nome || "-"}</td>
                <td>${a.email || "-"}</td>
                <td>${a.cargo || "Admin"}</td>
                <td><span class="status ativo">Ativo</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-excluir" onclick="removerAdmin('${admin.id}', '${a.cargo}')">Remover</button>
                    </div>
                </td>
            </tr>`;
        });
    } catch (e) {
        console.error(e);
        mostrarToast("Erro ao carregar administradores.");
    }
}

document.querySelector('[data-page="admins"]').addEventListener("click", carregarAdmins);

window.removerAdmin = async (id, cargoAdmin) => {
    if (cargoAdminLogado !== "Super Admin") {
        mostrarToast("Apenas o Super Admin pode revogar permissões.");
        return;
    }
    if (cargoAdmin === "Super Admin") {
        mostrarToast("Não é possível remover um Super Admin.");
        return;
    }
    if (confirm("Deseja revogar os privilégios deste administrador?")) {
        try {
            await deleteDoc(doc(db, "admins", id));
            mostrarToast("Privilégios removidos com sucesso");
            carregarAdmins();
            carregarDashboard();
        } catch (e) {
            mostrarToast("Erro ao remover administrador");
        }
    }
};

const modalAdmin = document.getElementById("modalAdmin");
let usuarioSelecionadoParaAdmin = null;

document.getElementById("abrirModalAdmin").addEventListener("click", async () => {
    if (cargoAdminLogado !== "Super Admin") {
        mostrarToast("Apenas o Super Admin pode gerenciar permissões administrativas.");
        return;
    }
    
    document.getElementById("pesquisaUsuarioModal").value = "";
    document.getElementById("containerListaModal").style.display = "none";
    document.getElementById("campoUsuarioSelecionado").style.display = "none";
    const tabelaBody = document.getElementById("listaUsuariosModal");
    tabelaBody.innerHTML = "";
    usuarioSelecionadoParaAdmin = null;
    
    modalAdmin.classList.add("ativo");

    try {
        const mapaUsuarios = new Map();

        const snapUsuarios = await getDocs(collection(db, "usuarios"));
        snapUsuarios.forEach(docSnap => {
            const u = docSnap.data();
            if (u.email) {
                mapaUsuarios.set(u.email.toLowerCase().trim(), { id: docSnap.id, nome: u.nome, email: u.email });
            }
        });
        if (mapaUsuarios.size === 0) {
            tabelaBody.innerHTML = `<tr><td style="padding: 12px; text-align: center; color: var(--sub);">Nenhum usuário cadastrado</td></tr>`;
        } else {
            mapaUsuarios.forEach((u) => {
                const tr = document.createElement("tr");
                tr.style.cursor = "pointer";
                tr.style.borderBottom = "1px solid var(--border)";
                
                tr.innerHTML = `
                    <td style="padding: 12px; text-align: left;">
                        <div style="font-weight: 600; color: #ffffff; font-size: 15px; margin-bottom: 2px;">${u.nome || "Sem Nome"}</div>
                        <div style="font-size: 12px; color: var(--sub);">${u.email || ""}</div>
                    </td>
                `;

                tr.addEventListener("click", () => {
                    usuarioSelecionadoParaAdmin = { id: u.id, nome: u.nome || "Sem Nome", email: u.email };
                    
                    document.getElementById("nomeUsuarioSelecionado").innerText = usuarioSelecionadoParaAdmin.nome;
                    document.getElementById("emailUsuarioSelecionado").innerText = usuarioSelecionadoParaAdmin.email || "";
                    
                    document.getElementById("containerListaModal").style.display = "none";
                    document.getElementById("campoUsuarioSelecionado").style.display = "block";
                    document.getElementById("pesquisaUsuarioModal").value = "";
                });

                tabelaBody.appendChild(tr);
            });
        }
        document.getElementById("containerListaModal").style.display = "block";
    } catch(e) {
        console.error(e);
        mostrarToast("Erro ao carregar lista de usuários.");
    }
});

document.getElementById("pesquisaUsuarioModal").addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase().trim();
    const linhas = document.querySelectorAll("#listaUsuariosModal tr");
    
    linhas.forEach(linha => {
        const texto = linha.innerText.toLowerCase();
        if (texto.includes(termo)) {
            linha.style.display = "";
        } else {
            linha.style.display = "none";
        }
    });
});

document.getElementById("fecharModal").addEventListener("click", () => {
    modalAdmin.classList.remove("ativo");
});

document.getElementById("cancelarAdmin").addEventListener("click", () => {
    modalAdmin.classList.remove("ativo");
});

document.getElementById("salvarAdmin").addEventListener("click", async () => {
    if (cargoAdminLogado !== "Super Admin") {
        mostrarToast("Ação não autorizada.");
        return;
    }

    if (!usuarioSelecionadoParaAdmin) {
        mostrarToast("Por favor, selecione um usuário da lista primeiro.");
        return;
    }

    try {
        const qAdmin = query(collection(db, "admins"), where("email", "==", usuarioSelecionadoParaAdmin.email));
        const snapAdmin = await getDocs(qAdmin);
        
        if (!snapAdmin.empty) {
            mostrarToast("Esta conta já possui privilégios administrativos.");
            return;
        }

        await setDoc(doc(db, "admins", usuarioSelecionadoParaAdmin.id), {
            nome: usuarioSelecionadoParaAdmin.nome,
            email: usuarioSelecionadoParaAdmin.email,
            cargo: "Admin",
            criadoEm: new Date()
        });

        mostrarToast("Privilégio de Administrador concedido");
        modalAdmin.classList.remove("ativo");
        
        carregarAdmins();
        carregarDashboard();
    } catch (e) {
        console.error(e);
        mostrarToast("Erro ao promover usuário");
    }
}); 

async function carregarMaterias() {
    const tabela = document.getElementById("listaMaterias");
    tabela.innerHTML = "";
    try {
        const dados = await getDocs(collection(db, "materias"));
        dados.forEach(item => {
            const m = item.data();
            tabela.innerHTML += `
            <tr>
                <td>${m.nome || "-"}</td>
                <td>${m.questoes || 0}</td>
                <td>
                    <button class="btn btn-editar">Editar</button>
                    <button class="btn btn-excluir" onclick="removerMateria('${item.id}')">Excluir</button>
                </td>
            </tr>`;
        });
    } catch (e) {
        console.error(e);
    }
}

window.removerMateria = async (id) => {
    if (confirm("Remover esta matéria?")) {
        try {
            await deleteDoc(doc(db, "materias", id));
            mostrarToast("Matéria removida");
            carregarMaterias();
            carregarDashboard();
        } catch (e) {
            mostrarToast("Erro ao remover matéria");
        }
    }
};

document.querySelector('[data-page="materias"]').addEventListener("click", carregarMaterias);

async function carregarQuestoes() {
    const tabela = document.getElementById("listaQuestoes");
    tabela.innerHTML = "";
    try {
        const dados = await getDocs(collection(db, "questoes"));
        dados.forEach(item => {
            const q = item.data();
            tabela.innerHTML += `
            <tr>
                <td>${q.titulo || "-"}</td>
                <td>${q.materia || "-"}</td>
                <td>${q.dificuldade || "-"}</td>
                <td>
                    <button class="btn btn-editar">Editar</button>
                    <button class="btn btn-excluir" onclick="removerQuestao('${item.id}')">Excluir</button>
                </td>
            </tr>`;
        });
    } catch (e) {
        console.error(e);
    }
}

window.removerQuestao = async (id) => {
    if (confirm("Remover esta questão?")) {
        try {
            await deleteDoc(doc(db, "questoes", id));
            mostrarToast("Questão removida");
            carregarQuestoes();
            carregarDashboard();
        } catch (e) {
            mostrarToast("Erro ao remover questão");
        }
    }
};

document.querySelector('[data-page="questoes"]').addEventListener("click", carregarQuestoes);

async function carregarSimulados() {
    const tabela = document.getElementById("listaSimulados");
    tabela.innerHTML = "";
    try {
        const dados = await getDocs(collection(db, "simulados"));
        dados.forEach(item => {
            const s = item.data();
            tabela.innerHTML += `
            <tr>
                <td>${s.nome || "-"}</td>
                <td>${s.questoes || 0}</td>
                <td>${s.tempo || "-"}</td>
                <td>
                    <button class="btn btn-editar">Editar</button>
                    <button class="btn btn-excluir" onclick="removerSimulado('${item.id}')">Excluir</button>
                </td>
            </tr>`;
        });
    } catch (e) {
        console.error(e);
    }
}

window.removerSimulado = async (id) => {
    if (confirm("Remover este simulado?")) {
        try {
            await deleteDoc(doc(db, "simulados", id));
            mostrarToast("Simulado removido");
            carregarSimulados();
            carregarDashboard();
        } catch (e) {
            mostrarToast("Erro ao remover simulado");
        }
    }
};

document.querySelector('[data-page="simulados"]').addEventListener("click", carregarSimulados);

document.getElementById("enviarAviso").addEventListener("click", async () => {
    const titulo = document.getElementById("tituloAviso").value;
    const mensagem = document.getElementById("mensagemAviso").value;

    if (!titulo || !mensagem) {
        mostrarToast("Preencha todos os campos");
        return;
    }

    try {
        await addDoc(collection(db, "avisos"), {
            titulo,
            mensagem,
            data: new Date()
        });
        document.getElementById("tituloAviso").value = "";
        document.getElementById("mensagemAviso").value = "";
        mostrarToast("Aviso enviado");
    } catch (e) {
        mostrarToast("Erro ao enviar aviso");
    }
});

document.getElementById("salvarConfig").addEventListener("click", async () => {
    const nome = document.getElementById("nomeSistema").value;
    const mensagem = document.getElementById("mensagemInicial").value;
    const manutencao = document.getElementById("modoManutencao").value;

    try {
        await setDoc(doc(db, "config", "geral"), {
            nome,
            mensagem,
            manutencao: manutencao === "true"
        });
        mostrarToast("Configurações salvas");
    } catch (e) {
        mostrarToast("Erro ao salvar configurações");
    }
});

function filtrarTabela(idInput, idTabela) {
    document.getElementById(idInput).addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        document.querySelectorAll(`#${idTabela} tr`).forEach(linha => {
            linha.style.display = linha.innerText.toLowerCase().includes(termo) ? "" : "none";
        });
    });
}

filtrarTabela("pesquisarUsuario", "listaUsuarios");
filtrarTabela("pesquisarAdmin", "listaAdmins");

document.getElementById("novaMateria").addEventListener("click", async () => {
    const nome = prompt("Nome da matéria:");
    if (!nome) return;

    try {
        await addDoc(collection(db, "materias"), { nome, questoes: 0 });
        mostrarToast("Matéria adicionada");
        carregarMaterias();
        carregarDashboard();
    } catch (e) {
        mostrarToast("Erro ao adicionar matéria");
    }
});

document.getElementById("novaQuestao").addEventListener("click", async () => {
    const titulo = prompt("Título da questão:");
    if (!titulo) return;

    try {
        await addDoc(collection(db, "questoes"), { titulo, materia: "Geral", dificuldade: "Média" });
        mostrarToast("Questão adicionada");
        carregarQuestoes();
        carregarDashboard();
    } catch (e) {
        mostrarToast("Erro ao adicionar questão");
    }
});

document.getElementById("novoSimulado").addEventListener("click", async () => {
    const nome = prompt("Nome do simulado:");
    if (!nome) return;

    try {
        await addDoc(collection(db, "simulados"), { nome, questoes: 0, tempo: "60 minutos" });
        mostrarToast("Simulado criado");
        carregarSimulados();
        carregarDashboard();
    } catch (e) {
        mostrarToast("Erro ao criar simulado");
    }
});

document.getElementById("novoAviso").addEventListener("click", () => {
    document.getElementById("tituloAviso").focus();
});

window.addEventListener("load", carregarDashboard);