"use strict";

const socket = io();

let salaActual = null;
let nombreJugador = null;
let soyCreador = false;

// ==========================================
// CREAR PARTIDA (MODAL CENTRADO)
// ==========================================
function crearSala() {
    const modal = document.getElementById("join-section");
    const contenido = document.getElementById("modal-content");

    modal.classList.remove("hidden");

    contenido.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">⚽</div>
            <h2 class="modal-title">Crear nueva partida</h2>
            <p class="modal-subtitle">Ingresá tu nombre para iniciar la sala.</p>

            <input id="nombre-creador" class="modal-input" placeholder="Tu nombre o apodo" maxlength="20" onkeydown="if(event.key === 'Enter') confirmarCrearSala()">

            <div id="error-container" style="display: none; margin-top: 15px; padding: 12px; background: rgba(255, 107, 107, 0.15); border: 1px solid #ff6b6b; color: #ff6b6b; border-radius: 8px; font-weight: bold; font-size: 14px; text-align: center;"></div>

            <button type="button" class="primary-btn" style="width: 100%; margin-top: 15px; padding: 14px; font-size: 16px; font-weight: bold;" onclick="confirmarCrearSala()">
                🚀 Crear Sala
            </button>
        </div>
    `;

    setTimeout(() => {
        const input = document.getElementById("nombre-creador");
        if (input) input.focus();
    }, 100);
}

function confirmarCrearSala() {
    const input = document.getElementById("nombre-creador");
    let nombre = input ? input.value.trim() : "";

    if (!nombre) {
        mostrarErrorGrafico("Por favor, ingresá un nombre o apodo.");
        return;
    }

    nombreJugador = nombre;
    socket.emit("crearPartida", nombreJugador);
}

// ==========================================
// EVENTO: PARTIDA CREADA
// ==========================================
socket.on("partidaCreada", function (datos) {
    salaActual = datos.codigo;
    soyCreador = true;
    mostrarLobby(datos.codigo, datos.jugadores);
});

// ==========================================
// UNIRSE A PARTIDA
// ==========================================
function mostrarUnirse() {
    const modal = document.getElementById("join-section");
    const contenido = document.getElementById("modal-content");

    modal.classList.remove("hidden");

    contenido.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">🔗</div>
            <h2 class="modal-title">Unirse a una partida</h2>
            <p class="modal-subtitle">Ingresá tus datos para entrar a la sala.</p>

            <input id="nombre-jugador" class="modal-input" placeholder="Tu nombre o apodo" maxlength="20">
            <input id="room-code" class="modal-input" placeholder="Código de partida (ej: ABC123)" maxlength="6" style="text-transform: uppercase;">

            <div id="error-container" style="display: none; margin-top: 15px; padding: 12px; background: rgba(255, 107, 107, 0.15); border: 1px solid #ff6b6b; color: #ff6b6b; border-radius: 8px; font-weight: bold; font-size: 14px; text-align: center;"></div>

            <button type="button" class="primary-btn" style="width:100%; margin-top: 15px; padding: 14px; font-size: 16px; font-weight: bold;" onclick="unirseSala()">
                Entrar a la sala
            </button>
        </div>
    `;

    setTimeout(() => {
        const input = document.getElementById("nombre-jugador");
        if (input) input.focus();
    }, 100);
}

function unirseSala() {
    const nombre = document.getElementById("nombre-jugador").value.trim();
    const codigo = document.getElementById("room-code").value.trim().toUpperCase();

    if (!nombre) {
        mostrarErrorGrafico("Escribí tu nombre para ingresar.");
        return;
    }

    if (codigo.length !== 6) {
        mostrarErrorGrafico("El código debe contener exactamente 6 caracteres.");
        return;
    }

    nombreJugador = nombre;
    socket.emit("unirsePartida", { codigo: codigo, nombre: nombre });
}

// ==========================================
// EVENTOS DE UNIÓN Y ACTUALIZACIÓN
// ==========================================
socket.on("partidaUnida", function (datos) {
    salaActual = datos.codigo;
    soyCreador = false;
    mostrarLobby(datos.codigo, datos.jugadores);
});

socket.on("actualizarJugadores", function (jugadores) {
    if (!salaActual) return;
    mostrarLobby(salaActual, jugadores);
});

// ==========================================
// MOSTRAR ERRORES CON DISEÑO GRÁFICO
// ==========================================
function mostrarErrorGrafico(mensaje) {
    const contenedorError = document.getElementById("error-container");
    if (contenedorError) {
        contenedorError.innerHTML = `⚠️ ${mensaje}`;
        contenedorError.style.display = "block";
    }
}

socket.on("errorPartida", function (mensaje) {
    mostrarErrorGrafico(mensaje);
});

// ==========================================
// MOSTRAR LOBBY DE LA SALA
// ==========================================
function mostrarLobby(codigo, jugadores) {
    const modal = document.getElementById("join-section");
    const contenido = document.getElementById("modal-content");

    modal.classList.remove("hidden");

    let lista = "";
    jugadores.forEach(function (jugador, index) {
        lista += `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;">
                <span>${index === 0 ? "👑" : "⚽"}</span>
                <span style="font-weight: bold; color: #fff;">${jugador.nombre}</span>
            </div>
        `;
    });

    let botonJuego = soyCreador ? `
        <button type="button" class="primary-btn" style="width:100%; margin-top:20px; padding: 14px;" onclick="mostrarJuegos()">
            🎮 Elegir juego
        </button>
    ` : `
        <div style="text-align:center; margin-top:20px; color: #a0a0a0; font-style: italic;">
            ⏳ Esperando a que el creador inicie la partida...
        </div>
    `;

    contenido.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:45px;">⚽</div>
            <h2 class="modal-title">Sala de espera</h2>
            <p class="modal-subtitle">Compartí este código con tus amigos:</p>
        </div>

        <div style="text-align:center; font-size:28px; font-weight:bold; letter-spacing:4px; margin:15px 0; background:rgba(255,255,255,0.08); padding:12px; border-radius:10px; color: #35ff8b; border: 1px dashed #35ff8b;">
            ${codigo}
        </div>

        <button type="button" class="secondary-btn" style="width:100%;" onclick="copiarCodigo('${codigo}')">
            📋 Copiar código
        </button>

        <div style="margin-top:25px; text-align: left;">
            <h3 style="margin-bottom:12px; font-size: 16px; color: #fff;">👥 Jugadores conectados (${jugadores.length}/3)</h3>
            ${lista}
        </div>

        ${botonJuego}
    `;
}

// ==========================================
// SELECCIÓN Y CONFIGURACIÓN DE JUEGOS
// ==========================================
function seleccionarJuego(juego) {
    if (!salaActual) {
        mostrarUnirse();
        return;
    }
    if (!soyCreador) {
        mostrarErrorGrafico("Solo el creador de la sala puede elegir el juego.");
        return;
    }
    elegirJuego(juego);
}

function mostrarJuegos() {
    if (!soyCreador) return;

    const modal = document.getElementById("join-section");
    const contenido = document.getElementById("modal-content");

    modal.classList.remove("hidden");

    contenido.innerHTML = `
        <h2 class="modal-title" style="text-align: center;">🎮 Elegí un juego</h2>
        <p class="modal-subtitle" style="text-align: center;">Seleccioná el desafío para el grupo.</p>

        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('impostor')">🕵️ Impostor</button>
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('adivina')">🧠 Adivina el jugador</button>
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('estadisticas')">📊 Duelo de estadísticas</button>
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('oculto')">🔍 Futbolista oculto</button>
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('mayor-menor')">📈 Mayor o menor</button>
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('draft')">💰 Draft de fútbol</button>
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('diez-segundos')">⏱️ 10 segundos</button>
            <button type="button" class="secondary-btn" style="text-align: left;" onclick="elegirJuego('carrera')">🔗 Carrera de futbolistas</button>
        </div>
    `;
}

function elegirJuego(juego) {
    const nombres = {
        impostor: "🕵️ Impostor",
        adivina: "🧠 Adivina el jugador",
        estadisticas: "📊 Duelo de estadísticas",
        oculto: "🔍 Futbolista oculto",
        "mayor-menor": "📈 Mayor o menor",
        draft: "💰 Draft",
        "diez-segundos": "⏱️ 10 segundos",
        carrera: "🔗 Carrera de futbolistas"
    };

    const nombre = nombres[juego] || juego;
    const contenido = document.getElementById("modal-content");

    contenido.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:55px; margin-bottom:15px;">⚽</div>
            <h2 class="modal-title">${nombre}</h2>
            <p class="modal-subtitle">¿Iniciar este minijuego ahora?</p>

            <div style="padding:15px; border-radius:10px; background:rgba(53,255,139,.08); color:#35ff8b; margin-top:15px; font-weight: bold;">
                ✓ Modo seleccionado
            </div>

            <!-- CONTENEDOR DE ERROR DISEÑADO -->
            <div id="error-container" style="display: none; margin-top: 15px; padding: 12px; background: rgba(255, 107, 107, 0.15); border: 1px solid #ff6b6b; color: #ff6b6b; border-radius: 8px; font-weight: bold; font-size: 14px; text-align: center;"></div>

            <button type="button" class="primary-btn" style="width:100%; margin-top:20px; padding: 14px;" onclick="iniciarJuego('${juego}')">
                🚀 Iniciar partida
            </button>
        </div>
    `;
}

// ==========================================
// INICIAR MINIJUEGO
// ==========================================
function iniciarJuego(juego) {
    if (juego === "impostor") {
        socket.emit("iniciarImpostor", { codigo: salaActual });
        return;
    }

    mostrarErrorGrafico(`Este minijuego estará disponible próximamente.`);
}

// ==========================================
// PANTALLA DEL JUEGO IMPOSTOR
// ==========================================
socket.on("comenzarImpostor", function (datos) {
    const contenido = document.getElementById("modal-content");

    let rolTexto = datos.esImpostor
        ? "<span style='color: #ff6b6b; font-weight:bold;'>🕵️ SOS EL IMPOSTOR</span>"
        : "<span style='color: #35ff8b; font-weight:bold;'>⚽ JUGADOR REAL</span>";

    contenido.innerHTML = `
        <div style="text-align: center;">
            <h2 class="modal-title">Impostor</h2>
            <p class="modal-subtitle">${rolTexto}</p>

            <div style="margin: 20px 0; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">Tu futbolista asignado es:</p>
                <h1 style="font-size: 28px; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.2);">${datos.palabra}</h1>
            </div>

            <p style="font-size: 14px; margin-bottom: 15px; color: #a0a0a0;">
                Tomen turnos para dar una pista sin revelar directamente a su futbolista ni dejar que el impostor descubra el verdadero.
            </p>

            <button type="button" class="secondary-btn" style="width: 100%; margin-top: 10px;" onclick="cerrarUnirse()">
                ¡Entendido!
            </button>
        </div>
    `;
});

// ==========================================
// UTILIDADES
// ==========================================
function copiarCodigo(codigo) {
    navigator.clipboard.writeText(codigo).then(function () {
        const contenedorError = document.getElementById("error-container");
        if (contenedorError) {
            contenedorError.style.background = "rgba(53, 255, 139, 0.15)";
            contenedorError.style.borderColor = "#35ff8b";
            contenedorError.style.color = "#35ff8b";
            contenedorError.innerHTML = "📋 ¡Código copiado al portapapeles!";
            contenedorError.style.display = "block";
        }
    });
}

function cerrarUnirse() {
    document.getElementById("join-section").classList.add("hidden");
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        cerrarUnirse();
    }
});