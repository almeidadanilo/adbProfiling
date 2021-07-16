
// include the Node.js 'path' module at the top of your file
const path = require('path')
const {app, BrowserWindow, Menu} = require('electron')
const DEFINE_DEV = 1;

function createWindow () {

    const win = new BrowserWindow({
      width: 900,
      height: 800,
      resizable: false,  
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        nativeWindowOpen: true
      }
    })

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://google.com/')) {
        console.log('allow');
        return { action: 'allow' }
      }
      console.log('deny');
      return { action: 'deny' }
    })

    if (DEFINE_DEV) win.webContents.openDevTools({mode: "detach"});

    win.loadFile('index.html')

    win.webContents.on('did-create-window', (childWindow) => {
      childWindow.webContents('will-navigate', (e) => {
        console.log(e);
        e.preventDefault()
      })
    })

  }

  app.whenReady().then(() => {

    createWindow();

  })

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  })

  app.on('show-context-menu', (event) => {
    const template = [
      {
        label: 'Analize w/ VirusTotal',
        click: analyzeWithVirusTotal()
      }
    ]
    console.log(event);
    const menu = Menu.buildFromTemplate(template)
    menu.popup(BrowserWindow.fromWebContents(event.sender))
  })

function analyzeWithVirusTotal(){
  try {
    console.log('Virus Total: ');  
  }     
  catch (e){
    console.log('Catch : \n\n ' + e);
  }
}

