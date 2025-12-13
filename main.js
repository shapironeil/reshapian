const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // Crea la finestra dell'applicazione
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        title: 'Shappa Games',
        backgroundColor: '#667eea',
        icon: path.join(__dirname, 'assets', 'icon.png'), // Opzionale: aggiungi un'icona
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        autoHideMenuBar: true, // Nascondi la barra menu
        resizable: true,
        fullscreenable: true
    });

    // Carica il file index.html
    mainWindow.loadFile('index.html');

    // DevTools disabilitato per produzione
    // Per debug: decommentare la riga sotto
    // mainWindow.webContents.openDevTools();

    // Evento quando la finestra viene chiusa
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Messaggio di avvio
    console.log('🎮 Shappa Games avviato!');
}

// Quando Electron è pronto, crea la finestra
app.whenReady().then(() => {
    createWindow();

    // Su macOS, ricrea la finestra quando si clicca sull'icona del dock
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Esci dall'app quando tutte le finestre sono chiuse (tranne su macOS)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Gestione errori
process.on('uncaughtException', (error) => {
    console.error('Errore non gestito:', error);
});
