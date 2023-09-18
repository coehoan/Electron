const { contextBridge, ipcRenderer } = require('electron');

let validChannels = ['create', 'insert', 'delete', 'update', 'select', 'file', 'exportFile',]; // IPC 채널 추가
let responseChannels = ['testResponse', 'mainResponse', 'step1Response', 'step2Response', 'step2CompanyList', 'step3Response', 'infoResponse', 'adminResponse', 'selfResponse'];
let requestChannels = ['existFile', 'fileUpload', 'getCompanyList', 'setBasicInfo', 'setAdminInfo', 'getMainInfo', 'getCompanyInfo', 'deleteAdmin', 'saveAdmin', 'getQuestionInfo', 'importFile', 'exportFile'];
contextBridge.exposeInMainWorld(
    "api", {
        response: (channel, func) => {
            if (responseChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        removeResponse: (channel, func) => {
            if (responseChannels.includes(channel)) {
                ipcRenderer.removeAllListeners(channel);
            }
        },
        responseOnce: (channel, func) => {
            if (responseChannels.includes(channel)) {
                ipcRenderer.once(channel, (event, ...args) => func(...args));
            }
        },
        request: (channel, data) => {
            if (requestChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },


        /*
        create: (channel, data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        insert: (channel, data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        delete: (channel, data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        update: (channel, data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        select: (channel, data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        file: (channel, data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        exportFile: (channel, data) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        }*/
    }
);