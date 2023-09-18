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
            event.sender.send('mainResponse', !err);
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
                        num INTEGER,
                        type TEXT,
                        point REAL,
                        question TEXT, 
                        answer1 TEXT NULL,
                        anspoint1 REAL NULL, 
                        answer2 TEXT NULL, 
                        anspoint2 REAL NULL,
                        answer3 TEXT NULL, 
                        anspoint3 REAL NULL,
                        answer4 TEXT NULL, 
                        anspoint4 REAL NULL,
                        answer5 TEXT NULL, 
                        anspoint5 REAL NULL,
                        self_result INTEGER NULL,
                        self_score REAL NULL, 
                        inspect_result INTEGER NULL,
                        inspect_score REAL NULL,
                        stalenessYn TEXT,
                        evidence TEXT NULL)
                `);
                    db.run(`
                    CREATE TABLE IF NOT EXISTS company (
                        id INTEGER PRIMARY KEY, 
                        code INTEGER,
                        name TEXT, 
                        type TEXT,
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
                        INSERT INTO questions (num, type, point, question, answer1, anspoint1, answer2, anspoint2, answer3, anspoint3, answer4, anspoint4, answer5, anspoint5, self_result, self_score, inspect_result, inspect_score, stalenessYn, evidence)
                        VALUES(
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
                            '${e.evidence}')
                    `);
                    })
                    res.company.forEach((e) => {
                        db.run(`
                        INSERT INTO company (code, name, type, address) 
                        VALUES(
                            '${e.code}', 
                            '${e.name}', 
                            '${e.type}', 
                            '${e.address}')
                    `);
                    })
                })
                event.sender.send('step1Response', true)
            })
        } catch (err) {
            event.sender.send('step1Response', false)
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
                event.sender.send('step2CompanyList', data);
                // window.getFocusedWindow().webContents.send('step2Response', data);
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
            } else event.sender.send('step2Response', true);
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
                    VALUES ('${row.id}', '${row.company_seq}', '${args.name}', '${args.roles}', '${args.email}', '${args.tel}', '${args.phone}', '주담당자')
                `)
                }
            });
            event.sender.send('step3Response', true);
        } catch (e) {
            event.sender.send('step3Response', false);
        }
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