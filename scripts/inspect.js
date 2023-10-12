const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');
const path = require("path");

let db;

module.exports = {
    inspectRequest: (channel, handlers) => ipcMain.on(channel, handlers),
    /**
     * 평가 답변 저장
     * */
    saveInspectAnswer: ipcMain.on('saveInspectAnswer', (event, args) => {
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');
        db = new sqlite3.Database(dbFilePath);
        db.run(`
            UPDATE questions
            SET inspect_result = '${args.inspect_result}', inspect_score = '${args.inspect_score}', inspect_memo = '${args.inspect_memo}'
            WHERE id = ${args.id}
        `, (err) => {
            if (err) {
                console.log('Question save error:: ', err.message);
                event.sender.send('inspectSaveResponse', false)
            } else {
                event.sender.send('inspectSaveResponse', true)
            }
            db.close();
        })
    })
};