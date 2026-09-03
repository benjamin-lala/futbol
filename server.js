const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(__dirname));

// Estructura de datos para almacenar las salas de juego
const salas = {};

// Lista de futbolistas para el minijuego "Impostor"
const futbolistas = [
    "Lionel Messi",
    "Cristiano Ronaldo",
    "Kylian Mbappé",
    "Neymar Jr",
    "Erling Haaland",
    "Vinícius Jr",
    "Jude Bellingham",
    "Ángel Di María",
    "Julian Álvarez",
    "Lautaro Martínez",
    "Luka Modrić",
    "Kevin De Bruyne",
    "Robert Lewandowski",
    "Antoine Griezmann",
    "Pedri",
    "Lamine Yamal"
];

// Generador de códigos aleatorios de 6 caracteres para las salas
function generarCodigoSala() {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

// ==========================================
// EVENTOS DE SOCKET.IO
// ==========================================
io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado:", socket.id);

    // 1. CREAR PARTIDA
    socket.on("crearPartida", (nombre) => {
        let codigo = generarCodigoSala();
        while (salas[codigo]) {
            codigo = generarCodigoSala();
        }

        salas[codigo] = {
            creador: socket.id,
            jugadores: [{ id: socket.id, nombre: nombre }]
        };

        socket.join(codigo);
        socket.emit("partidaCreada", {
            codigo: codigo,
            jugadores: salas[codigo].jugadores
        });
        console.log(`Sala creada: ${codigo} por ${nombre}`);
    });

    // 2. UNIRSE A PARTIDA
    socket.on("unirsePartida", (datos) => {
        const codigo = datos.codigo ? datos.codigo.toUpperCase() : "";
        const nombre = datos.nombre;

        if (!salas[codigo]) {
            socket.emit("errorPartida", "La sala no existe. Verificá el código.");
            return;
        }

        if (salas[codigo].jugadores.length >= 8) {
            socket.emit("errorPartida", "La sala está llena (máximo 8 jugadores).");
            return;
        }

        salas[codigo].jugadores.push({ id: socket.id, nombre: nombre });
        socket.join(codigo);

        socket.emit("partidaUnida", {
            codigo: codigo,
            jugadores: salas[codigo].jugadores
        });

        io.to(codigo).emit("actualizarJugadores", salas[codigo].jugadores);
        console.log(`${nombre} se unió a la sala ${codigo}`);
    });

    // 3. INICIAR MINIJUEGO IMPOSTOR
    socket.on("iniciarImpostor", (datos) => {
        const codigo = datos.codigo;
        const sala = salas[codigo];

        if (!sala) {
            socket.emit("errorPartida", "No se encontró la sala.");
            return;
        }

        if (sala.jugadores.length < 3) {
            socket.emit("errorPartida", "Se necesitan al menos 3 jugadores para jugar al Impostor.");
            return;
        }

        // Selección aleatoria del futbolista y del impostor
        const palabraSecreta = futbolistas[Math.floor(Math.random() * futbolistas.length)];
        const indiceImpostor = Math.floor(Math.random() * sala.jugadores.length);

        sala.jugadores.forEach((jugador, index) => {
            const esImpostor = index === indiceImpostor;
            io.to(jugador.id).emit("comenzarImpostor", {
                palabra: esImpostor ? "🕵️ SOS EL IMPOSTOR" : palabraSecreta,
                esImpostor: esImpostor
            });
        });

        console.log(`Iniciado juego Impostor en la sala ${codigo}`);
    });

    // 4. DESCONEXIÓN DE JUGADORES
    socket.on("disconnect", () => {
        console.log("Usuario desconectado:", socket.id);

        for (const codigo in salas) {
            const sala = salas[codigo];
            const indice = sala.jugadores.findIndex((j) => j.id === socket.id);

            if (indice !== -1) {
                sala.jugadores.splice(indice, 1);

                if (sala.jugadores.length === 0) {
                    delete salas[codigo];
                    console.log(`Sala ${codigo} eliminada (sin jugadores).`);
                } else {
                    if (sala.creador === socket.id) {
                        sala.creador = sala.jugadores[0].id;
                    }
                    io.to(codigo).emit("actualizarJugadores", sala.jugadores);
                }
                break;
            }
        }
    });
});

// ==========================================
// INICIO DEL SERVIDOR (COMPATIBLE CON RENDER)
// ==========================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`================================`);
    console.log(`⚽ FÚTBOL PARTY`);
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`================================`);
});