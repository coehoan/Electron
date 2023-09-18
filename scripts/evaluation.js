const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');

let db;

module.exports = {
    evalRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 평가문항 데이터 불러오기
     * */
    getMainInfo: ipcMain.on('getQuestionInfo', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        db.all(`
            SELECT * FROM questions
        `, (err, rows) => {
            if (err) {
                console.log('Question list loading error:: ', err.message);
            } else {
                event.sender.send('selfResponse', rows);
                db.close();
            }
        })
    }),

    /**
     * 평가 답변 저장
     * */
    saveAnswer: ipcMain.on('saveAnswer', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        db.run(`
            UPDATE questions
            SET self_result = '${args.self_result}', self_score = '${args.self_score}'
            WHERE id = ${args.id}
        `, (err) => {
            if (err) {
                console.log('Question save error:: ', err.message);
                event.sender.send('evalSaveResponse', false)
            } else event.sender.send('evalSaveResponse', true)
        })
        db.close();
    })
};