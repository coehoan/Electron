const {ipcMain, dialog} = require('electron');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const {mainWindow} = require('../electron/main');
const {basename} = require('path')
const path = require('path')

let db;

module.exports = {
    fileRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    importFile: ipcMain.on('importFile', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            title: '파일 업로드'
        }).then(async (result) => {
            let res = await readFile(result.filePaths[0]);
            res.forEach((e) => {
                db.run(`insert into student(name, email) values('${e.name}', '${e.email}')`, (err) => {
                    if (err) {
                        console.log('File upload fail:: ', err.message);
                    } else console.log('File upload success');
                });
            });
        })
    }),
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
            // 저장 경로에 selectedSeq 폴더가 없으면 해당 폴더 생성
            if (!fs.existsSync(savePath + args)) {
                fs.mkdirSync(savePath + args)
            }

            fs.copyFile(filePath, `${savePath}${args}\\${fileName}`, (err) => {
                if (err) {
                    console.log('Inspect file upload error:: ', err.message);
                } else event.sender.send('inspectSaveFileResponse', fileName);
            });
        })
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