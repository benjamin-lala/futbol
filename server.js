const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos de la carpeta principal
app.use(express.static(path.join(__dirname)));

// RUTA PRINCIPAL: Enviar siempre index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Estructura de datos para almacenar las salas de juego
const salas = {};

// Lista ampliada de futbolistas (Actuales e Históricos / Leyendas)
const futbolistas = [
    // --- ACTUALES ---
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
    "Lamine Yamal",
    "Mohamed Salah",
    "Harry Kane",
    "Rodri",
    "Federico Valverde",
    "Toni Kroos",
    "Thibaut Courtois",
    "Alexis Mac Allister",
    "Enzo Fernández",

    // --- HISTÓRICOS / LEYENDAS ---
    "Diego Maradona",
    "Pelé",
    "Ronaldinho",
    "Zinedine Zidane",
    "Ronaldo Nazário",
    "Johan Cruyff",
    "Franz Beckenbauer",
    "Michel Platini",
    "Marco van Basten",
    "Thierry Henry",
    "Andrés Iniesta",
    "Xavi Hernández",
    "Andrea Pirlo",
    "Kaká",
    "Gianluigi Buffon",
    "Iker Casillas",
    "Paolo Maldini",
    "Roberto Carlos",
    "Carles Puyol",
    "Gabriel Batistuta",
    "Juan Román Riquelme",
    "Dennis Bergkamp",
    "Zlatan Ibrahimović",
    "Steven Gerrard"
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

    // 3. INICIAR MINIJUEGO IMPOSTOR (INICIO LIBRE Y SELECCIÓN ALEATORIA)
    socket.on("iniciarImpostor", (datos) => {
        const codigo = datos.codigo;
        const sala = salas[codigo];

        if (!sala) {
            socket.emit("errorPartida", "No se encontró la sala.");
            return;
        }

        if (sala.jugadores.length < 1) {
            socket.emit("errorPartida", "No hay jugadores en la sala.");
            return;
        }

        // Selección aleatoria del futbolista y del impostor entre los conectados
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
// INICIO DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
