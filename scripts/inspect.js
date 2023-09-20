const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');

let db;

module.exports = {
    inspectRequest: (channel, handlers) => ipcMain.on(channel, handlers),
    /**
     * 평가 답변 저장
     * */
    saveInspectAnswer: ipcMain.on('saveInspectAnswer', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        db.run(`
            UPDATE questions
            SET inspect_result = '${args.inspect_result}', inspect_score = '${args.inspect_score}', inspect_memo = '${args.inspect_memo}'
            WHERE id = ${args.id}
        `, (err) => {
            if (err) {
                console.log('Question save error:: ', err.message);
                event.sender.send('inspectSaveResponse', false)
            } else event.sender.send('inspectSaveResponse', true)
        })
    })
};