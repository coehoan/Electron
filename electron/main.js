const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({directory: 'public'});
const fs = require('fs');
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
        mainWindow = null
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    });

    fileDirCheck();
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});

/**
 * /static/files 폴더 체크
 * */
function fileDirCheck() {
    let filesPath = path.join(__dirname, '../static/files');
    if (fs.existsSync(filesPath)) {
        fs.rmdirSync(filesPath, {recursive: true});
    }
}