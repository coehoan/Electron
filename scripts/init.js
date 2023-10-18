const {dialog, ipcMain, app} = require("electron");
const fs = require('fs');
const sqlite3 = require('sqlite3');
const {mainWindow} = require('../electron/main');
const path = require('path');

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
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');

        fs.access(dbFilePath, fs.constants.F_OK, (err) => {
            event.sender.send('mainResponse', !err);
        })
    }),
    /**
     * 평가지표 파일 업로드
     * */
    fileUpload: ipcMain.on('fileUpload', (event, args) => {
        // fileDirCheck();
        try {
            // 파일 업로드 팝업 open
            dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                title: '파일 업로드',
                filters: [{
                    name: 'JSON', extensions: ['json']
                }]
            }).then(async (result) => {
                if (!result.canceled) {
                    let res = await readFile(result.filePaths[0]);
                    event.sender.send('step1Response', res)
                } else {
                    event.sender.send('step1Response', 'canceled')
                }
            })
        } catch (err) {
            event.sender.send('step1Response', null)
        }
    }),
    /**
    * 평가지표 데이터 저장
    * */
    saveInitData: ipcMain.on('saveInitData', (event, args) => {
        try {
            // TODO: NCTI에서 받은 json 파일 자동 파싱하기
            /*let object = Object.keys(res);
            object.forEach((e, i) => {
                let key = object[i];
                console.log(key);
                res[key].forEach((e) => {
                    console.log(Object.keys(e))})
            })*/
            let dbPath = path.join(__dirname, '../db'); // db 폴더 경로
            let dbFilePath = path.join(dbPath, '/evaluation.db'); // db 파일 경로
            if (!fs.existsSync(dbPath)) {
                fs.mkdirSync(dbPath);
            }
            if (!fs.existsSync(dbFilePath)) {
                fs.writeFileSync(dbFilePath, ''); // evaluation.db 빈 파일 생성
            }
            db = new sqlite3.Database(dbFilePath); // evaluation.db 접속

            // 환경설정 - 평가데이터 가져오기로 접근했을 때 기존 DB 초기화
            if (args.status === 'reimport') {
                db.run(`DELETE FROM admin`);
                db.run(`DELETE FROM basic_info`);
                db.run(`DELETE FROM company`);
                db.run(`DELETE FROM questions`);
            }
            db.serialize((err, event) => { // 쿼리 실행
                db.run(`
                CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY,
                num TEXT,
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
                self_result TEXT NULL,
                self_score REAL NULL,
                inspect_result TEXT NULL,
                inspect_score REAL NULL,
                stalenessYn TEXT,
                evidence TEXT NULL,
                comment TEXT NULL,
                self_memo TEXT NULL,
                inspect_memo TEXT NULL)
            `);
                db.run(`
                CREATE TABLE IF NOT EXISTS company (
                id INTEGER PRIMARY KEY,
                code TEXT,
                name TEXT,
                type TEXT,
                address TEXT,
                activity_value REAL,
                training_max INTEGER,
                training_value REAL,
                protect_max INTEGER,
                protect_value REAL,
                appeal_value REAL,
                completeYn TEXT,
                year TEXT)
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
                type TEXT)
            `);
                args.questions.forEach((e) => {
                    db.run(`
                    INSERT INTO questions (num, type, point, question, answer1, anspoint1, answer2, anspoint2, answer3, anspoint3, answer4, anspoint4, answer5, anspoint5, self_result, self_score, inspect_result, inspect_score, stalenessYn, evidence, comment, self_memo, inspect_memo)
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
                        '${e.evidence}',
                        '${e.comment}',
                        '${e.self_memo}',
                        '${e.inspect_memo}')
                `);
                })
                args.company.forEach((e) => {
                    db.run(`
                    INSERT INTO company (code, name, type, address, activity_value, training_max, training_value, protect_max, protect_value, appeal_value, completeYn, year)
                    VALUES(
                        '${e.code}',
                        '${e.name}',
                        '${e.type}',
                        '${e.address}',
                        '${e.activity_value}',
                        '${e.training_max}',
                        '${e.training_value}',
                        '${e.protect_max}',
                        '${e.protect_value}',
                        '${e.appeal_value}',
                        '${e.completeYn}',
                        '${e.year}')
                `);
                });
                db.run(`
                INSERT INTO basic_info (company_seq)
                VALUES(
                    '${args.basic_info.company_seq}')
            `);
                db.run(`
                INSERT INTO admin (basic_info_seq, company_seq, name, roles, email, tel, phone, type)
                VALUES(
                    '${args.admin.basic_info_seq}',
                    '${args.admin.company_seq}',
                    '${args.admin.name}',
                    '${args.admin.roles}',
                    '${args.admin.email}',
                    '${args.admin.tel}',
                    '${args.admin.phone}',
                    '${args.admin.type}')
            `);
            })
            setTimeout(() => {
                event.sender.send('step3Response', true);
                db.close();
            }, 500)
        } catch (e) {
            console.log(e)
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
                resolve(JSON.parse(data));
            }
        })
    })
}

/**
 * /static/files 폴더 체크
 * */
function fileDirCheck() {
    let filesPath = path.join(__dirname, '../static/files');
    if (fs.existsSync(filesPath)) {
        fs.rmdirSync(filesPath, {recursive: true});
    }
}