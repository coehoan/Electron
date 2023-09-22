const {ipcMain, dialog} = require('electron');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const {mainWindow} = require('../electron/main');
const {basename} = require('path');
const path = require('path');

let db;

module.exports = {
    fileRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 자체평가, 현장실사 최종제출
     * */
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
                                    'questions': question,
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
    /**
     * 현장실사 점부파일 저장
     * */
    saveInspectFile: ipcMain.on('saveInspectFile', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            title: '파일 업로드'
        }).then(async (result) => {
            let filePath = result.filePaths[0]; // 선택된 파일 경로
            let fileName = basename(filePath); // 선택된 파일 이름
            let savePath = path.join(__dirname, `../static/files/inspect/${args.year}/`); // 저장 경로
            // 저장 경로에 폴더가 없으면 해당 폴더 생성
            let staticPath = path.join(__dirname, '../static');
            let filesPath = path.join(__dirname, '../static/files');
            let inspectPath = path.join(__dirname, '../static/files/inspect');
            let yearPath = path.join(__dirname, `../static/files/inspect/${args.year}`);
            if (!fs.existsSync(staticPath)) {
                fs.mkdirSync(staticPath)
            }
            if (!fs.existsSync(filesPath)) {
                fs.mkdirSync(filesPath)
            }
            if (!fs.existsSync(inspectPath)) {
                fs.mkdirSync(inspectPath)
            }
            if (!fs.existsSync(yearPath)) {
                fs.mkdirSync(yearPath)
            }
            if (!fs.existsSync(savePath + args.selectedSeq)) {
                fs.mkdirSync(savePath + args.selectedSeq);
            }

            fs.copyFile(filePath, `${savePath}${args.selectedSeq}\\${fileName}`, (err) => {
                if (err) {
                    console.log('Inspect file upload error:: ', err.message);
                } else event.sender.send('inspectSaveFileResponse', fileName);
            });
        })
    }),
    /**
     * 현장실사 첨부파일 리스트 가져오기
     * */
    getFileList: ipcMain.on('getFileList', (event, args) => {
        let filePath = path.join(__dirname, args.path); // 저장 경로
        fs.readdir(filePath + args.seq, (err, files) => {
            event.sender.send('fileListResponse', files);
        })
    }),
    /**
     * 평가결과 이전년도 리스트 가져오기
     * */
    getOlderFileList: ipcMain.on('getOlderFileList', (event, args) => {
        let filePath = path.join(__dirname, args); // 저장 경로
        fs.readdir(filePath, (err, files) => {
            event.sender.send('getOlderFileListResponse', files);
        })
    }),
    /**
     * 평가결과 이전년도 데이터로 DB 교체
     * */
    getOlderFileData: ipcMain.on('getOlderFileData', (event, args) => {
        let filePath = path.join(__dirname, args.path); // 해당년도 데이터 위치
        let dbPath = path.join(__dirname, '../db/');
        if (fs.existsSync(filePath + args.seq)) {
            // 해당년도 DB 파일 복사
            fs.copyFile(`${filePath}${args.seq}\\evaluation.db`, dbPath + 'evaluation.db', (err) => {
                if (err) {
                    console.log('getOlderFileData copy error:: ', err.message);
                    event.sender.send('olderFileDataResponse', false);
                } else {
                    event.sender.send('olderFileDataResponse', true);
                }
            });
            /*fs.readdir(filePath + args.seq, async (err, files) => {
                let fileName = files[0];
                let res = await readFile(`${filePath}${args.seq}\\${fileName}`);
                if (err) {
                    console.log('Older file read error:: ', err.message);
                } else {
                    event.sender.send('olderFileDataResponse', res);
                }
            });*/
        }
    }),
    /**
     * 현장실사 첨부파일 삭제
     * */
    deleteFile: ipcMain.on('deleteFile', (event, args) => {
        let filePath = path.join(__dirname, '../static/files/inspect/'); // 저장 경로
        fs.unlink(`${filePath}\\${args.seq}\\${args.fileName}`, (err) => {
            if (err) {
                console.log('File delete error:: ', err.message);
                event.sender.send('deleteFileResponse', false);
            } else event.sender.send('deleteFileResponse', true)
        })
    }),
    /**
     * 최종결과 파일 불러온 뒤 DB 저장
     * */
    getFinalFile: ipcMain.on('getFinalFile', (event, args) => {
        try {
            dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                title: '파일 업로드'
            }).then(async (result) => {
                let res = await readFile(result.filePaths[0]);
                db = new sqlite3.Database('./db/evaluation.db');
                db.serialize(() => {
                    db.run(`DELETE FROM company`);
                    db.run(`DELETE FROM admin`);
                    db.run(`DELETE FROM questions`);
                    db.run(`
                        INSERT INTO company(id, code, name, type, address, activity_value, training_max, training_value, protect_max, protect_value, appeal_value, completeYn, year)
                        VALUES(
                        1,
                        ${res.company.code},
                        '${res.company.name}', 
                        '${res.company.type}', 
                        '${res.company.address}', 
                        '${res.company.activity_value}', 
                        '${res.company.training_max}', 
                        '${res.company.training_value}', 
                        '${res.company.protect_max}', 
                        '${res.company.protect_value}', 
                        '${res.company.appeal_value}', 
                        '${res.company.completeYn}', 
                        '${res.company.year}')
                    `);
                    res.admin.forEach((e) => {
                        db.run(`
                            INSERT INTO admin
                            VALUES(${e.id}, 1, 1, '${e.name}', '${e.roles}', '${e.email}', '${e.tel}', '${e.phone}', '${e.type}')
                        `)
                    });
                    res.questions.forEach((e) => {
                        db.run(`
                            INSERT INTO questions
                            VALUES(
                            '${e.id}',
                            '${e.num}',
                            '${e.type}',
                            '${e.point}',
                            '${e.question}', 
                            '${e.answer1}', 
                            '${e.anspoint1}', 
                            '${e.answer2}', 
                            '${e.anspoint2}', 
                            '${e.answer3}',
                            '${e.anspoint3}',
                            '${e.answer4}', 
                            '${e.anspoint4}', 
                            '${e.answer5}', 
                            '${e.anspoint5}', 
                            '${e.self_result}', 
                            '${e.self_score}', 
                            '${e.inspect_result}',
                            '${e.inspect_score}',
                            '${e.stalenessYn}',
                            '${e.evidence}',
                            '${e.comment}',
                            '${e.self_memo}',
                            '${e.inspect_memo}')
                        `);
                    });
                    db.run(`
                        UPDATE basic_info
                        SET company_seq = 1
                    `, () => {
                        // 저장 경로에 폴더가 없으면 해당 폴더 생성
                        let filePath = path.join(__dirname, '../db/evaluation.db');
                        let staticPath = path.join(__dirname, '../static');
                        let filesPath = path.join(__dirname, '../static/files');
                        let resultPath = path.join(__dirname, '../static/files/result');
                        let savePath = path.join(__dirname, '../static/files/result/'); // 저장 경로
                        let year = new Date().getFullYear();

                        if (!fs.existsSync(staticPath)) {
                            fs.mkdirSync(staticPath)
                        }
                        if (!fs.existsSync(filesPath)) {
                            fs.mkdirSync(filesPath)
                        }
                        if (!fs.existsSync(resultPath)) {
                            fs.mkdirSync(resultPath)
                        }
                        if (!fs.existsSync(savePath + year)) {
                            fs.mkdirSync(savePath + year);
                        }

                        // /static/files/result/해당년도에 최종 결과 파일 복사
                        fs.copyFile(filePath, `${savePath}${year}\\evaluation.db`, (err) => {
                            if (err) {
                                console.log('Inspect file upload error:: ', err.message);
                            }
                        });

                        event.sender.send('getFinalFileResponse', true);
                    })
                })
            });
        } catch (e) {
            event.sender.send('getFinalFileResponse', false);
        }
    })
};

async function readFile(filepath) {
    // promise 객체 리턴
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf-8', (err, data) => {
            if (err) {
                console.log('File read Error:: ', err.message);
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        })
    })
}