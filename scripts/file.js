const {ipcMain, dialog, app} = require('electron');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const {mainWindow} = require('../electron/main');
const {basename} = require('path');
const path = require('path');
const AdmZip = require('adm-zip');
const fsExtra = require('fs-extra');

let db;

module.exports = {
    fileRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 자체평가 최종제출
     * */
    exportSelfFile: ipcMain.on('exportSelfFile', (event, args) => {
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');
        db = new sqlite3.Database(dbFilePath);
        let savePath;
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
                                    if (!result.canceled) {
                                        savePath = result.filePaths[0]; // 지정 경로

                                        let zip = new AdmZip(); // 새로운 zip 파일 생성
                                        zip.addFile('self_result.json', Buffer.from(JSON.stringify(obj), 'utf-8')); // obj를 self_result.json 파일로 저장
                                        zip.writeZip(`${savePath}/${args}_${company.name}_self_result.zip`, () => { // zip 파일을 선택 된 경로에 년도_기관명_self_result.zip 으로 생성
                                            event.sender.send('fileResponse', true);
                                        });
                                    } else event.sender.send('fileResponse', 'canceled');
                                })
                            }
                        })
                    }
                })
            }
            db.close();
        })
    }),
    /**
     * 현장실사 최종제출
     * */
    exportInspectFile: ipcMain.on('exportInspectFile', (event, args) => {
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');
        db = new sqlite3.Database(dbFilePath);
        let savePath;
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
                        // completeYn 수정
                        db.run(`
                            UPDATE company
                            SET completeYn = 'Y'
                            WHERE id = ${admin[0].company_seq}
                        `, () => {
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
                                        if (!result.canceled) {
                                            savePath = result.filePaths[0]; // 지정 경로
                                            let inspectFilePath = path.join(__dirname, `../static/files/inspect/${args}`); // 현장실사 증빙자료 경로

                                            let zip = new AdmZip(); // 새로운 zip 파일 생성
                                            zip.addFile('inspect_result.json', Buffer.from(JSON.stringify(obj), 'utf-8')); // obj를 self_result.json 파일로 저장 후 zip 파일에 추가
                                            if (fs.existsSync(inspectFilePath)) {
                                                zip.addLocalFolder(inspectFilePath); // 증빙자료 zip 파일에 추가
                                            }
                                            zip.writeZip(`${savePath}/${args}_${company.name}_inspect_result.zip`, () => { // zip 파일을 선택 된 경로에 년도_기관명_inspect_result.zip 으로 생성
                                                event.sender.send('fileResponse', true);
                                            });
                                        } else event.sender.send('fileResponse', 'canceled');
                                    })
                                }
                            })
                        })
                    }
                })
            }
            db.close();
        })
    }),
    /**
     * 현장실사 점부파일 저장
     * */
    saveInspectFile: ipcMain.on('saveInspectFile', (event, args) => {
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            title: '파일 업로드'
        }).then(async (result) => {
            if (!result.canceled) {
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
                    } else {
                        event.sender.send('inspectSaveFileResponse', fileName);
                    }
                })
            } else {
                event.sender.send('inspectSaveFileResponse', 'canceled');
            }
        })
    }),
    /**
     * 현장실사 첨부파일 삭제
     * */
    deleteFile: ipcMain.on('deleteFile', (event, args) => {
        let filePath = path.join(__dirname, '../static/files/inspect/'); // 저장 경로
        let year = new Date().getFullYear(); // 현재년도
        fs.unlink(`${filePath}\\${year}\\${args.seq}\\${args.fileName}`, (err) => {
            if (err) {
                console.log('File delete error:: ', err.message);
                event.sender.send('deleteFileResponse', false);
            } else event.sender.send('deleteFileResponse', true)
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
        }
    }),
    /**
     * 최종결과 파일 불러온 뒤 DB 저장
     * 1. 최종결과 zip 파일 오픈
     * 2. 압축 해제 후 files/inspect/현재년도 폴더 덮어쓰기
     * 3. final_result.json 파일로 현재 db 파일 업데이트
     * 4. files/result 폴더에 해당 db 파일 저장 (년도별 관리)
     * */
    getFinalFile: ipcMain.on('getFinalFile', (event, args) => {
        try {
            dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                title: '파일 업로드'
            }).then((result) => {
                if (!result.canceled) {
                    let res;
                    let year = new Date().getFullYear(); // 현재년도
                    let inspectFilesPath = path.join(__dirname, `../static/files/inspect/${year}`); // 해당년도 증빙자료 파일 경로
                    let zip = new AdmZip(result.filePaths[0]); // zip 파일 생성
                    let zipEntries = zip.getEntries(); // zip 파일 컨텐츠
                    zipEntries.forEach((e) => {
                        // zip 파일 중 final_result.json 파일을 찾는다.
                        if (e.entryName === 'final_result.json') {
                            res = JSON.parse(e.getData().toString('utf8'));
                        }
                    })
                    // final_result.json의 company.year가 현재년도가 아닌 경우
                    if (year !== new Date(res.company.year).getFullYear()) {
                        year = res.company.year;
                        inspectFilesPath = path.join(__dirname, `../static/files/inspect/${res.company.year}`);
                    }

                    fsExtra.emptyDirSync(inspectFilesPath); // savePath 내 모든 파일 삭제
                    zip.extractAllTo(inspectFilesPath, true); // savePath에 zip 파일 압축해제 (덮어쓰기)
                    fs.unlinkSync(`${inspectFilesPath}\\final_result.json`); // 저장 후 final_result.json 파일 삭제

                    let dbPath = path.join(__dirname, '../db');
                    let dbFilePath = path.join(dbPath, '/evaluation.db');
                    db = new sqlite3.Database(dbFilePath);
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
                } else {
                    event.sender.send('getFinalFileResponse', 'canceled');
                }
                db.close();
            });
        } catch (e) {
            db.close();
            event.sender.send('getFinalFileResponse', false);
        }
    }),
    backUp: ipcMain.on('backUp', (event, args) => {
        // 폴더 선택 팝업 오픈
        dialog.showOpenDialog(mainWindow, {
            defaultPath: "C:", // 디폴트 경로
            properties: ["openDirectory"] // 저장 경로를 폴더로 변경
        }).then((result) => {
            if (!result.canceled) {
                let savePath = result.filePaths[0]; // 지정 경로
                let zip = new AdmZip(); // 새로운 zip 파일 생성
                let folderPath = path.join(__dirname, '../');
                zip.addLocalFolder(folderPath, '/'); // 해당년도 파일을 zip 파일에 저장
                zip.writeZip(`${savePath}\\back_up.zip`, () => { // zip 파일을 선택 된 경로에 back_up.zip 으로 생성
                    event.sender.send('backUpResponse', true);
                });
            } else event.sender.send('backUpResponse', 'canceled');
        })
    }),
    restore: ipcMain.on('restore', (event, args) => {
        // 파일 선택 팝업 오픈
        dialog.showOpenDialog(mainWindow, {
            defaultPath: "C:", // 디폴트 경로
            properties: ["openFile"] // 저장 경로를 폴더로 변경
        }).then((result) => {
            if (!result.canceled) {
                let tmpFolderPath = path.join(__dirname, '..', '../tmp');
                let zip = new AdmZip(result.filePaths[0]);

                // 백업 파일 압축 해제
                zip.extractAllToAsync(tmpFolderPath, true, true, () => {
                    // restore-event 이벤트 수동으로 발생
                    // app.emit('restore-event');
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        buttons: [],
                        defaultId: 0,
                        title: '알림',
                        message: '',
                        detail: '앱이 다시 실행됩니다.',
                    }).then (async (result) => {
                        if (result.response === 0) {
                            try {
                                let appFolderPath = path.join(__dirname, '..', '../app'); // 기존 resources 폴더 경로
                                let tmpFolderPath = path.join(__dirname, '..', '../tmp'); // tmp resources 폴더 경로
                                let tmpNodeModulePath = path.join(__dirname, '..', '../tmp/node_modules') // tmp 폴더 내 node_modules 경로
                                let dbPath = path.join(__dirname, '../db');
                                let dbFilePath = path.join(dbPath, '/evaluation.db');
                                let tmpDBPath = path.join(__dirname, '..', '../tmp/db');
                                let tmpDBFilePath = path.join(tmpDBPath, '/evaluation.db');
                                let db = new sqlite3.Database(dbFilePath);
                                let db2 = new sqlite3.Database(tmpDBFilePath);

                                // 1. evaluation.db 데이터 변경\

                                // 기존 DB 초기화
                                db.serialize(() => {
                                    db.run(`DELETE FROM admin`);
                                    db.run(`DELETE FROM basic_info`);
                                    db.run(`DELETE FROM company`);
                                    db.run(`DELETE FROM questions`);

                                    // db2 데이터를 db에 insert
                                    db.serialize(() => {
                                        db2.all(`SELECT * FROM admin`, (err, rows) => {
                                            rows.forEach((e) => {
                                                let query = `
                                                    INSERT INTO admin (id, basic_info_seq, company_seq, name, roles, email, tel, phone, type)
                                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                                                let values = Object.values(e);
                                                db.run(query, values)
                                            })
                                        });
                                        db2.all(`SELECT * FROM basic_info`, (err, rows) => {
                                            rows.forEach((e) => {
                                                let query = `
                                                    INSERT INTO basic_info (id, company_seq)
                                                    VALUES (?, ?)`
                                                let values = Object.values(e);
                                                db.run(query, values)
                                            })
                                        });
                                        db2.all(`SELECT * FROM company`, (err, rows) => {
                                            rows.forEach((e) => {
                                                let query = `
                                                    INSERT INTO company(id, code, name, type, address, activity_value, training_max, training_value, protect_max, protect_value, appeal_value, completeYn, year)
                                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                                                let values = Object.values(e);
                                                db.run(query, values)
                                            })
                                        });
                                        db2.all(`SELECT * FROM questions`, (err, rows) => {
                                            rows.forEach((e) => {
                                                let query = `
                                                    INSERT INTO questions (id, num, type, point, question, answer1, anspoint1, answer2, anspoint2, answer3, anspoint3, answer4, anspoint4, answer5, anspoint5, self_result, self_score, inspect_result, inspect_score, stalenessYn, evidence, comment, self_memo, inspect_memo)
                                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                                                let values = Object.values(e);
                                                db.run(query, values)
                                            })
                                        });
                                    })
                                })
                                // 2. electron, public, script 폴더 변경
                                // appFolderPath의 node_modules, db 폴더를 제외한 나머지 파일 삭제

                                fs.readdirSync(appFolderPath).forEach((e) => {
                                    if (e !== 'node_modules' || e !== 'db') {
                                        console.log('1. app folder list:: ', e);
                                        fs.rmSync(`${appFolderPath}/${e}`, {recursive: true});
                                    }
                                })
                                // tmp 폴더의 node_modules, db 폴더 삭제
                                fs.rmSync(tmpNodeModulePath, {recursive: true});
                                console.log('2. tmp node folder remove');
                                db2.close(async () => {
                                    await fs.rmSync(tmpDBPath, {recursive: true});
                                    console.log('3. tmp db folder remove');

                                    // tmp -> app 폴더 복사
                                    fsExtra.copySync(tmpFolderPath, appFolderPath, {recursive: true, overwrite: true})
                                    console.log('4. copy tmp folder to app folder');
                                    // tmp 폴더 삭제
                                    fs.rmSync(tmpFolderPath, {recursive: true});
                                    console.log('5. remove tmp folder');

                                    // 앱 재실행
                                    app.relaunch();
                                    app.quit();
                                });
                            } catch (e) {
                                console.log(e)
                            }
                        }
                    })
                });
            } else event.sender.send('restoreResponse', 'canceled');
        })
    }),
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