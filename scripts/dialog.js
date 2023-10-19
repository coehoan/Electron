const {ipcMain, dialog} = require('electron');
const {mainWindow} = require("../electron/main");

let isOpenDialog = false;

module.exports = {
    dialogRequest: (channel, handlers) => ipcMain.on(channel, handlers),
    /**
     * 알림창 오픈
     * */
    dialog: ipcMain.on('dialog', (event, args) => {
        if (!isOpenDialog) {
            isOpenDialog = true;
            dialog.showMessageBox(mainWindow, args.option)
                .then(result => {
                    event.sender.send('dialogCallback', {callbackId: args.callbackId, buttonId: result.response});
                });
        }
        isOpenDialog = false;
    })
};