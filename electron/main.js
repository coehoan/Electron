const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({directory: 'public'});
const fs = require('fs');
const fsExtra = require('fs-extra');
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

// 환경설정 - 복원 이벤트 핸들러
app.on('restore-event', restore)

function restore() {
    try {
        let appFolderPath = path.join(__dirname, '..', '../app'); // 기존 resources 폴더 경로
        let tmpFolderPath = path.join(__dirname, '..', '../tmp'); // tmp resources 폴더 경로
        let tmpNodeModulePath = path.join(__dirname, '..', '../tmp/node_modules') // tmp 폴더 내 node_modules 경로

        // appFolderPath의 node_modules 폴더를 제외한 나머지 파일 삭제
        fs.readdirSync(appFolderPath).forEach((e) => {
            if (e !== 'node_modules') {
                fs.rmSync(`${appFolderPath}/${e}`, {recursive: true});
            }
        })
        // tmp 폴더의 node_modules 폴더 삭제
        fs.rmSync(tmpNodeModulePath, {recursive: true});
        // tmp -> app 폴더 복사
        fsExtra.copySync(tmpFolderPath, appFolderPath, {recursive: true, overwrite: true})
        // tmp 폴더 삭제
        fs.rmSync(tmpFolderPath, {recursive: true});

        // 앱 재실행
        app.relaunch();
        app.quit();
    } catch (e) {
        console.log(e)
    }
}

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});