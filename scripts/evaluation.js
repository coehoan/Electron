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
    })
}