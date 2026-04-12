const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from web-panel directory
app.use(express.static(path.join(__dirname, '../web-panel')));

// Route for the main panel
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web-panel', 'index.html'));
});

// API endpoint to get software list (for future extensibility)
app.get('/api/softwares', (req, res) => {
    const softwares = [
        {
            nome: "Discord.js",
            descricao: "Biblioteca poderosa para criar bots do Discord",
            imagem: "https://discord.js.org/#/docs/main/stable/general/welcome",
            link: "https://discord.js.org/",
            categoria: "Bots"
        },
        {
            nome: "Node.js",
            descricao: "Ambiente de execução JavaScript do lado do servidor",
            imagem: "https://nodejs.org/static/images/logo.svg",
            link: "https://nodejs.org/",
            categoria: "Desenvolvimento"
        },
        {
            nome: "Visual Studio Code",
            descricao: "Editor de código fonte desenvolvido pela Microsoft",
            imagem: "https://code.visualstudio.com/assets/images/home/logo-wide.svg",
            link: "https://code.visualstudio.com/",
            categoria: "Ferramentas"
        }
    ];
    res.json(softwares);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});