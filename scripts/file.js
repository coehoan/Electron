const {ipcMain, dialog} = require('electron');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const {mainWindow} = require('../electron/main');
const {basename} = require('path')
const path = require('path')

let db;

module.exports = {
    fileRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    exportFile: ipcMain.on('exportFile', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        let path;
        let question = [];
        let admin = [];
        let company;
        let obj = {};
        db.all('select * from questions', (err, rows) => {
            if (err) {
                console.log('Export Error:: ', err.message);
            } else {
                question = rows;
                db.all(`SELECT * FROM admin`, (err, rows) => {
                    if (err) {
                        console.log('Export Error:: ', err.message);
                    } else {
                        admin = rows;
                        db.get(`SELECT * FROM company WHERE id = ${admin[0].company_seq}`, (err, row) => {
                            if (err) {
                                console.log('Export Error:: ', err.message);
                            } else {
                                company = row;
                                obj = {
                                    'question': question,
                                    'admin': admin,
                                    'company': company
                                }
                                // 폴더 선택 팝업 오픈
                                dialog.showOpenDialog(mainWindow, {
                                    defaultPath: "C:", // 디폴트 경로
                                    properties: ["openDirectory"] // 저장 경로를 폴더로 변경
                                }).then((result) => {
                                    path = result.filePaths[0]; // 지정 경로
                                    fs.writeFileSync(path + '/result.json', JSON.stringify(obj)); // 해당 경로로 result.json 파일 생성
                                    event.sender.send('fileResponse', true)
                                })
                            }
                        })
                    }
                })
            }
        })
    }),
    saveInspectFile: ipcMain.on('saveInspectFile', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            title: '파일 업로드'
        }).then(async (result) => {
            let filePath = result.filePaths[0]; // 선택된 파일 경로
            let fileName = basename(filePath); // 선택된 파일 이름
            let savePath = path.join(__dirname, '../static/files/inspect/'); // 저장 경로
            // 저장 경로에 폴더가 없으면 해당 폴더 생성
            let staticPath = path.join(__dirname, '../static');
            let filesPath = path.join(__dirname, '../static/files');
            let inspectPath = path.join(__dirname, '../static/files/inspect');
            if (!fs.existsSync(staticPath)) {
                fs.mkdirSync(staticPath)
            }
            if (!fs.existsSync(filesPath)) {
                fs.mkdirSync(filesPath)
            }
            if (!fs.existsSync(inspectPath)) {
                fs.mkdirSync(inspectPath)
            }
            if (!fs.existsSync(savePath + args)) {
                fs.mkdirSync(savePath + args);
            }

            fs.copyFile(filePath, `${savePath}${args}\\${fileName}`, (err) => {
                if (err) {
                    console.log('Inspect file upload error:: ', err.message);
                } else event.sender.send('inspectSaveFileResponse', fileName);
            });
        })
    }),
    getFileList: ipcMain.on('getFileList', (event, args) => {
        let filePath = path.join(__dirname, '../static/files/inspect/'); // 저장 경로
        fs.readdir(filePath + args, (err, files) => {
            event.sender.send('fileListResponse', files);
        })
    }),
    deleteFile: ipcMain.on('deleteFile', (event, args) => {
        let filePath = path.join(__dirname, '../static/files/inspect/'); // 저장 경로
        fs.unlink(`${filePath}\\${args.seq}\\${args.fileName}`, (err) => {
            if (err) {
                console.log('File delete error:: ', err.message);
                event.sender.send('deleteFileResponse', false);
            } else event.sender.send('deleteFileResponse', true)
        })
    }),
    getFinalFile: ipcMain.on('getFinalFile', (event, args) => {

    })
}

async function readFile(filepath) {
    // promise 객체 리턴
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf-8', (err, data) => {
            if (err) {
                console.log('File read Error:: ', err.message);
                reject(err);
            } else {
                console.log('File read Success');
                resolve(JSON.parse(data));
            }
        })
    })
}