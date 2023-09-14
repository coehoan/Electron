const {dialog, ipcMain} = require("electron");
const fs = require('fs');
const sqlite3 = require('sqlite3');
const {mainWindow} = require('../electron/main');

let db;

module.exports = {
    /**
     * Common request handler for IPC channels
     */
    initRequest: (channel, handler) => ipcMain.on(channel, handler),

    /**
     * 파일 존재유무 체크
     * */
    existFile: ipcMain.on('existFile', (event, args) => {
        fs.access(args, fs.constants.F_OK, (err) => {
            event.sender.send('main-response', !err);
        })
    }),
    /**
     * 평가지표 파일 업로드
     * */
    fileUpload: ipcMain.on('fileUpload', (event, args) => {
        try {
            // 파일 업로드 팝업 open
            dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                title: '파일 업로드'
            }).then(async (result) => {
                let res = await readFile(result.filePaths[0]);

                // TODO: NCTI에서 받은 json 파일 자동 파싱하기
                /*let object = Object.keys(res);
                object.forEach((e, i) => {
                    let key = object[i];
                    console.log(key);
                    res[key].forEach((e) => {
                        console.log(Object.keys(e))})
                })*/

                fs.writeFileSync('./db/evaluation.db', ''); // evaluation.db 파일 생성
                db = new sqlite3.Database('./db/evaluation.db'); // evaluation.db 접속
                db.serialize((err, event) => { // 쿼리 실행
                    db.run(`
                    CREATE TABLE IF NOT EXISTS questions (
                        id INTEGER PRIMARY KEY, 
                        question TEXT, 
                        answer1 TEXT, 
                        answer2 TEXT, 
                        answer3 TEXT, 
                        answer4 TEXT, 
                        answer5 TEXT, 
                        self_result TEXT, 
                        inspect_result TEXT)
                `);
                    db.run(`
                    CREATE TABLE IF NOT EXISTS company (
                        id INTEGER PRIMARY KEY, 
                        name TEXT, 
                        address TEXT)
                `);
                    db.run(`
                    CREATE TABLE IF NOT EXISTS basic_info (
                        id INTEGER PRIMARY KEY, 
                        company_seq INTEGER)
                `);
                    db.run(`
                    CREATE TABLE IF NOT EXISTS admin (
                        id INTEGER PRIMARY KEY,
                        basic_info_seq INTEGER, 
                        company_seq INTEGER,
                        name TEXT,
                        roles TEXT,
                        email TEXT,
                        tel TEXT,
                        phone TEXT,
                        type TEXT
                        )
                `);
                    res.questions.forEach((e) => {
                        db.run(`
                        INSERT INTO questions (id, question, answer1, answer2, answer3, answer4, answer5, self_result, inspect_result)
                        VALUES(
                            '${e.id}', 
                            '${e.question}', 
                            '${e.answer1}', 
                            '${e.answer2}', 
                            '${e.answer3}',
                            '${e.answer4}', 
                            '${e.answer5}', 
                            '${e.self_result}', 
                            '${e.inspect_result}')
                    `);})
                    res.company.forEach((e) => {
                        db.run(`
                        INSERT INTO company (id, name, address) 
                        VALUES(
                            '${e.id}', 
                            '${e.name}', 
                            '${e.address}')
                    `);})
                })
                event.sender.send('step1-response', true)
            })
        } catch (err) {
            event.sender.send('step1-response', false)
        }
    }),
    /**
     * 기관 리스트 불러오기
     * */
    getCompanyList: ipcMain.on('getCompanyList', (event, args) => {
        db.all(`SELECT id, name FROM company`, (err, data) => {
            if (err) {
                console.log('Select Error:: ', err.message);
            } else {
                console.log('Select Success');
                event.sender.send('step2-companyList', data);
                // window.getFocusedWindow().webContents.send('step2-response', data);
            }
        })
    }),
    /**
     * 기관 정보 등록
     * */
    setBasicInfo: ipcMain.on('setBasicInfo', (event, args) => {
        db.run(`
            INSERT INTO basic_info (company_seq)
            VALUES (${args})`, (err) => {
            if (err) {
                console.log('Data Insert Error:: ', err.message);
            } else event.sender.send('step2-response', true);
        })
    }),
    /**
     * 담당자 정보 등록
     * */
    setAdminInfo: ipcMain.on('setAdminInfo', (event, args) => {
        try {
            // db = new sqlite3.Database('./db/evaluation.db');
            db.get(`SELECT id, company_seq FROM basic_info`, (err, row) => {
                if (err) {
                    console.log('Select Error:: ', err.message);
                } else {
                    console.log('Select Success');
                    db.run(`
                    INSERT INTO admin (basic_info_seq, company_seq, name, roles, email, tel, phone, type)
                    VALUES ('${row.id}', '${row.company_seq}', '${args.name}', '${args.roles}', '${args.email}', '${args.tel}', '${args.phone}', '주')
                `)
                }
            });
            event.sender.send('step3-response', true);
        } catch (e) {
            event.sender.send('step3-response', false);
        }
    })

    /*file: ipcMain.on('file', (event, args) => {

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
        let path;
        db.all('select * from student', (err, data) => {
            if (err) {
                console.log('Export Error:: ', err.message);
            } else {
                // 폴더 선택 팝업 오픈
                dialog.showOpenDialog(mainWindow, {
                    defaultPath: "C:", // 디폴트 경로
                    properties: ["openDirectory"] // 저장 경로를 폴더로 변경
                }).then((result) => {
                    path = result.filePaths[0]; // 지정 경로
                    fs.writeFileSync(path + '/result.json', JSON.stringify(data)); // 해당 경로로 result.json 파일 생성
                })
            }
        })
    }),*/
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

