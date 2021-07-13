const { exec } = require('child_process');
const { disconnect } = require('process');
const shell = require('electron').shell;

const txtHost = document.querySelector('#host');
const txtConsole = document.querySelector('#txtConsole');
const spnDevice = document.querySelector('#spnDevice');
const spnModel = document.querySelector('#spnModel');
const spnFeatures = document.querySelector('#spnFeatCount');
const spnSysApps = document.querySelector('#spnSysApps');
const spnUsrApps = document.querySelector('#spnUsrApps');
const spnExternal = document.querySelector('#spnExternal');

const adbPath = "../../../Android/Sdk/platform-tools";
const appCopyPath = "../../../Android/Sdk/platform-tools/apk";
const refDeviceModel = "model:";
const refDeviceProduct = "device product:";
const vtak = '6fce69de8cbff4e89ab4deda352d49ef40645b8b4114586108f6d289f5760cf9';

let deviceModel, deviceProduct = "";
let deviceFeatures, deviceSysApps, deviceUsrApps = [];

function consoleText (text) {
    //let time = new Date().toLocaleTimeString('pt-BR');
    let time = new Date();
    let timePrint = "[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "." + time.getMilliseconds() + "]";

    text = text.replace("\n","|");

    txtConsole.value = timePrint + ' - ' + text + '\n' + txtConsole.value;
}

function disconnectADB () {

    let execSync = require('child_process').execSync;

    if (disconnectP(execSync)){
        deviceProduct = "";
        deviceModel = "";
        spnDevice.innerHTML = "";
        spnModel.innerHTML = "";
        spnFeatures.innerHTML = "";
        spnSysApps.innerHTML = "";
        spnUsrApps.innerHTML = "";
        
        document.getElementById("tbFeatures").innerHTML = "";
        document.getElementById("tbSysApps").innerHTML = "";
        document.getElementById("tbUsrApps").innerHTML = "";
    }

}

function runProcess () {
    try {
        let execSync = require('child_process').execSync;

        let ipHost = txtHost.value;

        if (ipHost === '') {
            console.log('no ip host');
            return;
        }

        if (!connect(execSync, ipHost)) return;

        if (getDeviceList(execSync)){
            spnDevice.innerHTML = deviceProduct;
            spnModel.innerHTML = deviceModel;
        } 
        else {return};
        
        if (getDeviceFeatures(execSync)) {
            let i;
            let tb = document.getElementById("tbFeatures");
            let rw, cl = null;
            for (i = 0; i < deviceFeatures.length; i++) {
                rw = tb.insertRow(i);
                cl = rw.insertCell(0);
                cl.innerHTML = deviceFeatures[i].replace("feature:","");
            }
            spnFeatures.innerHTML = deviceFeatures.length;
        }
        else {return};

        if (getDeviceApps(execSync)) {
            let i;
            let tb = document.getElementById("tbSysApps");
            let rw, cl = null;
            for (i=0; i < deviceSysApps.length; i++) {
                rw = tb.insertRow(i);
                cl = rw.insertCell(0);
                cl.innerHTML = "<a onclick=appsMoreInfo('" + deviceSysApps[i].name.trim() + "')>" + deviceSysApps[i].name + "</a>";
            }
            spnSysApps.innerHTML = (deviceSysApps.length - 1);

            tb = document.getElementById("tbUsrApps");
            for (i=0; i < deviceUsrApps.length; i++) {
                rw = tb.insertRow(i);
                cl = rw.insertCell(0);
                cl.innerHTML = "<a onclick=appsMoreInfo('" + deviceUsrApps[i].name.trim() + "')>" + deviceUsrApps[i].name + "</a>";
            }
            spnUsrApps.innerHTML = (deviceUsrApps.length -1);
        }
        else {return};
        


    } catch (e) {
        console.log('Catch : \n\n ' + e);
    }
}

function appsMoreInfo(app) {
    try {
        shell.openExternal('https://www.google.com/search?q=' + app);
    }
    catch (e){
        console.log('Catch : \n\n ' + e);
    }
}

function connect(shellExec, ip) {
    try {    
        consoleText('Conectando com host (' + ip + ')');
        let output = shellExec(adbPath + '/adb connect ' + ip, { encoding: 'utf-8' });  
        if (output) {

        }
        consoleText(output);
        console.log('ret: ' + output);
        return 1;
    }catch(e){
        console.log('Catch : \n\n ' + e);
        consoleText('Erro ao conectar !!!');
        return 0;
    }
}

function getDeviceList(shellExec) {
    try {
        consoleText('Lendo informacoes do device ...'); 
        let output = shellExec(adbPath + '/adb devices -l ', { encoding: 'utf-8' });
        consoleText(output);
        console.log('ret: ' + output);

        let a = output.indexOf(refDeviceProduct);
        let b = output.indexOf(refDeviceModel);
        let c = output.substring(a + refDeviceProduct.length, b).trim();
        let d = output.substring(b + refDeviceModel.length, output.indexOf("device:")).trim();

        deviceProduct = c;
        deviceModel = d;

        return 1;
    }catch(e){
        console.log('Catch : \n\n ' + e);
        consoleText('Erro lendo informacoes !!!');

        return 0;
    }
}

function disconnectP (shellExec){
    try {
        consoleText('Desconectando ...');
        let output = shellExec(adbPath + '/adb disconnect', { encoding: 'utf-8' });
        consoleText(output);
        console.log('ret: ' + output);

        return 1;
    }catch(e){
        console.log('Catch : \n\n ' + e);
        consoleText('Erro ao desconectar !!!');
        return 0;
    } 
}

function getDeviceFeatures (shellExec){
    try {
        consoleText('Listando as features do device ...');
        let output = shellExec(adbPath + '/adb shell pm list features', { encoding: 'utf-8' });
        consoleText(output);
        //console.log('ret: ' + output);
        deviceFeatures = output.split("\n");
        return 1;
    }catch(e){
        console.log('Catch : \n\n ' + e);
        consoleText('Erro ao listar as features !!!');
        return 0;
    } 
}

function getDeviceApps (shellExec){
    try {
        consoleText('Listando as Apps de Sistema do device ...');
        let output = shellExec(adbPath + '/adb shell pm list packages -f -s', { encoding: 'utf-8' });
        consoleText(output);
        //console.log('ret: ' + output);
        let ret = output.split("\n");
        let xpath, xname = "";   
        let i;
        deviceSysApps = [];
        //console.log('ret.length: ' + ret.length);
        for (i = 0; i < ret.length; i++) {
            ret[i] = ret[i].replace("package:","");
            xname = ret[i].substring(ret[i].indexOf("=")+1,ret[i].length).trim();
            xpath = ret[i].substring(0,ret[i].indexOf("=")).trim();
            //console.log({name: xname, path: xpath});
            deviceSysApps.push( {name: xname, path: xpath} );
        }

        consoleText('Listando as Apps de Usuario do device ...');
        output = shellExec(adbPath + '/adb shell pm list packages -f -3', { encoding: 'utf-8' });
        consoleText(output);
        //console.log('ret: ' + output);
        ret = output.split("\n");
        //console.log('ret.length: ' + ret.length);
        deviceUsrApps = []
        for (i = 0; i < ret.length; i++) {
            ret[i] = ret[i].replace("package:","");
            xname = ret[i].substring(ret[i].indexOf("=")+1,ret[i].length).trim();
            xpath = ret[i].substring(0,ret[i].indexOf("=")).trim();
            //console.log({name: xname, path: xpath});
            deviceUsrApps.push( {name: xname, path: xpath} );
        }
        
        return 1;
    }catch(e){
        console.log('Catch : \n\n ' + e);
        consoleText('Erro ao listar as apps !!!');
        return 0;
    } 
}

function loadPage() {
    document.getElementById("defaultTabOpen").click();
}

function openPage (pageName, elmnt ,color) {
    try {
        let i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
          tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablink");
        for (i = 0; i < tablinks.length; i++) {
          tablinks[i].style.backgroundColor = "";
        }
        document.getElementById(pageName).style.display = "block";
        elmnt.style.backgroundColor = color;
    }catch (e) {
        console.log('Catch : \n\n ' + e);       
    }
  }

function pullUserApps() {
    try {
        let execSync = require('child_process').execSync;

        consoleText('Copiando as Apps de Usuario ...');
        let i, cmd, output;

        for (i=0; i < deviceUsrApps.length;i++) {
            if (deviceUsrApps[i].path === '') break;
            consoleText('Copiando ' + deviceUsrApps[i].name + ' ...');
            cmd = '/adb pull ' + deviceUsrApps[i].path + ' ' + appCopyPath + '/' + deviceUsrApps[i].name + '.apk';
            //console.log('cmd: ' + cmd);
            output = execSync(adbPath + cmd , { encoding: 'utf-8' });
            //consoleText(output);
            console.log('ret: ' + output);
        }
        
        consoleText('Apps de Usuario Copiados com Sucesso ...');

    } catch (e) {
        console.log('Catch : \n\n ' + e);
        consoleText('Erro ao Copiar as Apps de Usuario');
    }

}
