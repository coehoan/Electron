const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');
const path = require("path");

let db;

module.exports = {
    selfEvalRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 평가문항 데이터 불러오기
     * */
    getQuestionInfo: ipcMain.on('getQuestionInfo', (event, args) => {
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');
        db = new sqlite3.Database(dbFilePath);
        db.all(`
            SELECT * FROM questions
        `, (err, rows) => {
            if (err) {
                console.log('Question list loading error:: ', err.message);
            } else {
                event.sender.send('selfResponse', rows);
            }
            db.close();
        })
    }),

    /**
     * 평가 답변 저장
     * */
    saveSelfAnswer: ipcMain.on('saveSelfAnswer', (event, args) => {
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');
        db = new sqlite3.Database(dbFilePath);
        db.run(`
            UPDATE questions
            SET self_result = '${args.self_result}', self_score = '${args.self_score}', self_memo = '${args.self_memo}'
            WHERE id = ${args.id}
        `, (err) => {
            if (err) {
                console.log('Question save error:: ', err.message);
                event.sender.send('evalSaveResponse', false)
            } else {
                event.sender.send('evalSaveResponse', true)
            }
            db.close();
        })
    })
};