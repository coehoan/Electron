const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({directory: 'public'});
const fs = require('fs');
const fse = require('fs-extra');
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
        // mainWindow.webContents.openDevTools();
        mainWindow.loadURL('http://localhost:8080/');
    } else {
        mainWindow.webContents.openDevTools();
        loadURL(mainWindow);
    }

    mainWindow.on('closed', function () {
        if (isRestore) {
            // restore();
        } else {
            mainWindow = null;
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    });
}

app.on('ready', createWindow);






let isRestore = false; // 파일 이동 여부를 제어하는 플래그
// 앱의 종료 이벤트 처리
app.on('before-quit', () => {
    // 프로그래밍 방식으로 앱을 종료할 때 플래그를 true로 설정
    isRestore = true;
});
app.on('will-quit', () => {
    console.log('will-quit', new Date().getMilliseconds())})
app.on('quit', () => {
    console.log('quit', new Date().getMilliseconds())})
app.on('window-all-closed', () => {
    console.log('window-all-closed', new Date().getMilliseconds())})









function restore() {
    let tmpFolderPath = path.join(__dirname, '../tmp');
    let tmpFolderList = fs.readdirSync(tmpFolderPath);
    let oldPath = path.join(__dirname, '../');
    let arr = [];

    fs.readdirSync(path.join(__dirname, '../')).forEach((e) => {
        let name = tmpFolderList.indexOf(e);
        if (e !== 'tmp') {
            if (name === -1) {
                arr.push(e);
            }
        }
    })
    arr.forEach((e) => {
        console.log('remove array')
        let filePath = path.join(__dirname, `../${e}`);
        if (fs.statSync(filePath).isDirectory()) {
            fs.rmdirSync(filePath, { recursive: true });
        } else {
            fs.unlinkSync(filePath);
        }
    })
    /*fs.rename(tmpFolderPath, oldPath, () => {
        console.log('start rename folder')
        fs.rm(tmpFolderPath, {recursive: true, force: true}, () => {
            console.log('start remove tmp folder')
            app.relaunch();
            app.quit();
        });
    })*/

    fse.move(tmpFolderPath, oldPath)
        .then(() => {
            console.log('finish the tmpFolder move')})
        .catch((error) => {
            console.log(error)})







    /*// tmp 폴더를 제외한 모든 파일 및 폴더 삭제
    fs.readdirSync(path.join(__dirname, '../')).forEach((file) => {
        console.log('--start remove files except tmp folder')
        if (file !== 'tmp') {
            const filePath = path.join(__dirname, `../${file}`);
            if (fs.statSync(filePath).isDirectory()) {
                fs.rmdirSync(filePath, { recursive: true });
            } else {
                fs.unlinkSync(filePath);
            }
        }
    });

    // tmp 폴더 내부의 파일을 상위 폴더로 이동
    fs.readdirSync(tmpFolderPath).forEach((file) => {
        // TODO: main.js 못찾는 에러 수정
        console.log('--move tmp folder to upper folder');
        const srcPath = path.join(tmpFolderPath, file);
        const destPath = path.join(__dirname, `../${file}`);

        try {
            fs.unlink(srcPath, () => {
                fs.copyFile(srcPath, destPath, () => {
                    // 앱 다시 시작
                    app.relaunch();
                    app.quit();
                })
            })
            /!*fs.copyFileSync(srcPath, destPath); // 파일 복사
            fs.unlinkSync(srcPath); // 원본 파일 삭제*!/
        } catch (err) {
            console.error(`Error moving file ${file}: ${err}`);
        }
    });*/

    /*// 앱 다시 시작
    app.relaunch();
    app.quit();*/
}

/*app.on('will-quit', () => {
    const tmpFolderPath = path.join(__dirname, '../tmp');

    // tmp 폴더를 제외한 모든 파일 및 폴더 삭제
    fs.readdirSync(path.join(__dirname, '../')).forEach((file) => {
        console.log('--start remove files except tmp folder')
        if (file !== 'tmp') {
            const filePath = path.join(__dirname, `../${file}`);
            if (fs.statSync(filePath).isDirectory()) {
                fs.rmdirSync(filePath, { recursive: true });
            } else {
                fs.unlinkSync(filePath);
            }
        }
    });

    // tmp 폴더 내부의 파일을 상위 폴더로 이동
    fs.readdirSync(tmpFolderPath).forEach((file) => {
        console.log('--move tmp folder to upper folder');
        const srcPath = path.join(tmpFolderPath, file);
        const destPath = path.join(__dirname, `../${file}`);

        try {
            fs.copyFileSync(srcPath, destPath); // 파일 복사
            fs.unlinkSync(srcPath); // 원본 파일 삭제
        } catch (err) {
            console.error(`Error moving file ${file}: ${err}`);
        }
    });

    // 앱 다시 시작
    app.relaunch();
    app.quit();
});*/

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});