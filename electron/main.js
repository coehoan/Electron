const {app, BrowserWindow} = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({directory: 'public'});
require('./module');

let mainWindow;

exports.mainWindow = mainWindow;

function isDev() {
    return !app.isPackaged;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, '../public/favicon.png'),
        show: false
    });
    mainWindow.setMenuBarVisibility(false); // 메뉴바 삭제

    if (isDev()) {
        mainWindow.webContents.openDevTools();
        mainWindow.loadURL('http://localhost:8080/');
    } else {
        loadURL(mainWindow);
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});