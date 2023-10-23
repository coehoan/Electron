const {ipcMain, dialog, app} = require('electron');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const {mainWindow} = require('../electron/main');
const {basename} = require('path');
const path = require('path');
const AdmZip = require('adm-zip');
const fsExtra = require('fs-extra');
const archiver = require('archiver');
const Minizip = require('minizip-asm.js');

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
                                savePath = args.path; // 지정 경로

                                let mz = new Minizip();
                                mz.append('/self_result.json', Buffer.from(JSON.stringify(obj)), {password: 'test123'})
                                fs.writeFile(`${savePath}/${args.year}_${company.name}_self_result.zip`, mz.zip(), (err) => {
                                    if (err) throw err;
                                    else event.sender.send('fileResponse', true);
                                });


                                /*// register format for archiver
                                // note: only do it once per Node.js process/application, as duplicate registration will throw an error
                                archiver.registerFormat('zip-encrypted', require("archiver-zip-encrypted"));
                                let output = fs.createWriteStream(`${savePath}/${args.year}_${company.name}_self_result.zip`);
                                let archive = archiver.create('zip-encrypted', {zlib: {level: 9}, encryptionMethod: 'zip20', password: 'test123'});

                                // 아카이브 데이터를 파일로 파이프
                                archive.pipe(output);
                                // 버퍼로 읽은 obj를 아카이브에 추가
                                archive.append(Buffer.from(JSON.stringify(obj)), { name: 'self_result.json' });
                                archive.finalize().then(() => {
                                    event.sender.send('fileResponse', true);
                                });
                                /!*
                                zip.writeZip(`${savePath}/${args.year}_${company.name}_self_result.zip`, () => { // zip 파일을 선택 된 경로에 년도_기관명_self_result.zip 으로 생성
                                    event.sender.send('fileResponse', true);
                                });*!/*/
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
                                    savePath = args.path; // 지정 경로
                                    let inspectFilePath = path.join(__dirname, `../static/files/inspect/${args.year}`); // 현장실사 증빙자료 경로

                                    archiver.registerFormat('zip-encrypted', require("archiver-zip-encrypted"));
                                    let output = fs.createWriteStream(`${savePath}/${args.year}_${company.name}_inspect_result.zip`);
                                    let archive = archiver.create('zip-encrypted', {zlib: {level: 9}, encryptionMethod: 'zip20', password: 'test123'});

                                    // 아카이브 데이터를 파일로 파이프
                                    archive.pipe(output);
                                    // 버퍼로 읽은 obj를 아카이브에 추가
                                    archive.append(Buffer.from(JSON.stringify(obj)), { name: 'inspect_result.json' });
                                    if (fs.existsSync(inspectFilePath)) {
                                        archive.directory(inspectFilePath, false); // 증빙자료 zip 파일에 추가
                                        // zip.addLocalFolder(inspectFilePath);
                                    }
                                    archive.finalize().then(() => {
                                        event.sender.send('fileResponse', true);
                                    });

                                    /*let zip = new AdmZip(); // 새로운 zip 파일 생성
                                    zip.addFile('inspect_result.json', Buffer.from(JSON.stringify(obj), 'utf-8')); // obj를 self_result.json 파일로 저장 후 zip 파일에 추가
                                    if (fs.existsSync(inspectFilePath)) {
                                        zip.addLocalFolder(inspectFilePath); // 증빙자료 zip 파일에 추가
                                    }
                                    zip.writeZip(`${savePath}/${args.year}_${company.name}_inspect_result.zip`, () => { // zip 파일을 선택 된 경로에 년도_기관명_inspect_result.zip 으로 생성
                                        event.sender.send('fileResponse', true);
                                    });*/
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
        let filePath = args.path; // 선택된 파일 경로
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
        if (!fs.existsSync(savePath + args.questionNum)) {
            fs.mkdirSync(savePath + args.questionNum);
        }

        fs.copyFile(filePath, `${savePath}${args.questionNum}\\${fileName}`, (err) => {
            if (err) {
                console.log('Inspect file upload error:: ', err.message);
            } else {
                event.sender.send('inspectSaveFileResponse', fileName);
            }
        })
    }),
    /**
     * 현장실사 첨부파일 삭제
     * */
    deleteFile: ipcMain.on('deleteFile', (event, args) => {
        let filePath = path.join(__dirname, '../static/files/inspect/'); // 저장 경로
        let year = new Date().getFullYear(); // 현재년도
        fs.unlink(`${filePath}\\${year}\\${args.questionNum}\\${args.fileName}`, (err) => {
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
        fs.readdir(filePath + args.questionNum, (err, files) => {
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
    getFinalFile: ipcMain.on('getFinalFile', async (event, args) => {
        let extractPath = path.join(__dirname, '../static/test');
        let password = 'test123';

        let fe = new FileReader();
        let mz = new Minizip();
        let file = new File(await mz.extract(args, {password: password}), 'test.zip');
        console.log(file)












        /*let res;
        let year = new Date().getFullYear(); // 현재년도
        let inspectFilesPath = path.join(__dirname, `../static/files/inspect/${year}`); // 해당년도 증빙자료 파일 경로
        let zip = new AdmZip(args); // zip 파일 생성
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
        })*/
    }),
    /**
     * 백업
     * args: 저장 폴더 경로
     * */
    backUp: ipcMain.on('backUp', (event, args) => {
        let zip = new AdmZip(); // 새로운 zip 파일 생성
        let folderPath = path.join(__dirname, '../');
        zip.addLocalFolder(folderPath, '/'); // 해당년도 파일을 zip 파일에 저장
        zip.writeZip(`${args}\\back_up.zip`, () => { // zip 파일을 선택 된 경로에 back_up.zip 으로 생성
            event.sender.send('backUpResponse', true);
        })
    }),
    /**
     * 복원
     * args: 저장 폴더 경로
     * */
    restore: ipcMain.on('restore', (event, args) => {
        let tmpFolderPath = path.join(__dirname, '..', '../tmp');
        let zip = new AdmZip(args);
        // 백업 파일 압축 해제
        zip.extractAllToAsync(tmpFolderPath, true, true, () => {
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

                        // 1. evaluation.db 데이터 변경

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
                        let folderList = fs.readdirSync(appFolderPath).filter((e) => !(e === 'db' || e === 'node_modules'));
                        folderList.forEach(async (e) => {
                            await fs.rmSync(`${appFolderPath}/${e}`, {recursive: true});
                        })
                        // tmp 폴더의 node_modules, db 폴더 삭제
                        fs.rmSync(tmpNodeModulePath, {recursive: true});
                        db2.close(async () => {
                            await fs.rmSync(tmpDBPath, {recursive: true});

                            // tmp -> app 폴더 복사
                            fsExtra.copySync(tmpFolderPath, appFolderPath, {recursive: true, overwrite: true})
                            // tmp 폴더 삭제
                            fs.rmSync(tmpFolderPath, {recursive: true});

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
    }),
    openFileDialog: ipcMain.on('openFileDialog', (event, args) => {
        dialog.showOpenDialog(mainWindow, {
            defaultPath: "C:",
            properties: ["openFile"]
        }).then(result => {
            if (!result.canceled) {
                event.sender.send('openFileDialogResponse', {status: true, value: result.filePaths[0]});
            }
        })
    }),
    openFolderDialog: ipcMain.on('openFolderDialog', (event, args) => {
        dialog.showOpenDialog(mainWindow, {
            defaultPath: "C:",
            properties: ["openDirectory"]
        }).then(result => {
            if (!result.canceled) {
                event.sender.send('openFolderDialogResponse', {status: true, value: result.filePaths[0]});
            }
        })
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

function unzipArchive(zipPath, extractPath, password) {
    // Opening zip archive, gives us access to its root directory in the .then()-callback
    let filepath;
    unzipper.Open.file(zipPath).then((centralDirectory) => {
        return new Promise((resolve, reject) => {
            // Iterate through every file inside there (this includes directories and files in subdirectories)
            for (let i = 0; i < centralDirectory.files.length.length; i++) {
                const file = centralDirectory.files.length[i];
                filepath = path.join(extractPath, file.path);
                // Now this is a very 'quick n dirty' way of checking if it is a subdirectory, but so far it hasn't failed me ;)
                if(file.path.endsWith("/")) {
                    fs.mkdirSync(filepath);
                }
                else {
                    // This can get problematic when your archive contains alot of files, since the file.stream() works async and you have a limit of open writers.
                    // If you fall into that category, my first thought would be using tail-recursion and start the next write in the .on('finished', ...)
                    file.stream(password).pipe(fs.createWriteStream(filepath))
                        .on('finished', resolve)
                        .on('error', reject);
                }
            }
        });
    });
}

async function checkPasswordValid(zipFilePath, password) {
    let directory = null;
    try {
        directory = await unzipper.Open.file(zipFilePath);
        return new Promise((resolve, reject) => {
            // console.log(directory.files[0].path)
            directory.files[0].stream(password)
                .on('error', (err) => {
                    console.log('I am heere too bro in error')
                    console.log(err.message);

                })
                .on("readable", () => {
                    console.log('I am heere too bro')
                })
                .on('error', reject)
                .on("finished", resolve);
        });
    }
    catch (err) {
        console.log('I am heere too bro in error in catch')
        console.log(err.message);
    }
}