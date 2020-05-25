const path = require('path');
const os = require('os');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const log = require('electron-log');

// Set environment
process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production' ? true : false;
const isMac = process.platform === 'darwin' ? true : false;

let mainWindow;
//let aboutWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'ImageShrink',
        width: 500,
        height: 600,
        icon: './assets/icons/Icon_256x256.png',
        resizable: isDev ? true : false,
        backgroundColor: 'white',
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadFile('./app/index.html');
}

/* function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: 'About ImageShrink',
        width: 300,
        height: 300,
        icon: './assets/icons/Icon_256x256.png',
        resizable: false,
        backgroundColor: 'white'
    });
    aboutWindow.loadFile('./app/about.html');
    aboutWindow.setMenu(Menu.buildFromTemplate([]));
} */

app.on('ready', () => {
    createMainWindow();
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // Garbage collection
    mainWindow.on('ready', () => mainWindow = null);
});

const menu = [
    //...(isMac ? [{ label: app.name, submenu: [{ label: 'About', click: createAboutWindow }] }] : []),
    { role: 'fileMenu' },
    //...(!isMac ? [{ label: 'Help', submenu: [{ label: 'About', click: createAboutWindow }] }] : []),
    ...(isDev ? [{ label: 'Developer', submenu: [{ role: 'reload' }, { role: 'forcereload' }, { type: 'separator' }, { role: 'toggledevtools' }] }] : [])
];

ipcMain.on('image:minimize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink');
    shrinkImage(options);
});

async function shrinkImage({ imgPath, quality, dest }){
    try {
        const pngQuality = quality / 100;
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({ quality: [pngQuality, pngQuality] })
            ]
        });
        //log.info(files);
        shell.openPath(dest);
        mainWindow.webContents.send('image:done');
    } catch (err) {
        //log.error(err);
    }
}

app.on('window-all-closed', () => {
    if(!isMac) app.quit();
});
  
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});