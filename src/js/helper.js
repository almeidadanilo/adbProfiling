const { exec } = require('child_process');
const { disconnect } = require('process');
const shell = require('electron').shell;
const fs = require('fs');
const crypto = require('crypto');
const https = require('https')

const txtHost = document.querySelector('#host');
const txtConsole = document.querySelector('#txtConsole');
const spnDevice = document.querySelector('#spnDevice');
const spnModel = document.querySelector('#spnModel');
const spnFeatures = document.querySelector('#spnFeatCount');
const spnSysApps = document.querySelector('#spnSysApps');
const spnUsrApps = document.querySelector('#spnUsrApps');
const spnExternal = document.querySelector('#spnExternal');
const spnPrint = document.querySelector('#spnPrint');

//const adbPath = "../../../Android/Sdk/platform-tools";
//const appCopyPath = "../../../Android/Sdk/platform-tools/apk";
//const apkAnlyzerPath = "../../../Android/Sdk/cmdline-tools/latest/bin";
//const jsonAnalyzeFile = "../../../Android/Sdk/platform-tools/apk/analyze.json";
//const screenCapCopyPath = "../../../Android/Sdk/platform-tools/apk/screens";
const refDeviceModel = "model:";
const refDeviceProduct = "device product:";
//const vtak = '6fce69de8cbff4e89ab4deda352d49ef40645b8b4114586108f6d289f5760cf9';

let deviceModel, deviceProduct = "";
let deviceFeatures, deviceSysApps, deviceUsrApps = [];
let myUsrAppsIndex = 0;
let myFileJson = null;
let myConfigJson = null;
let executionType = "";

function consoleText (text) {
    let time = new Date();
    let timePrint = "[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "." + time.getMilliseconds() + "]";

    text = text.replace(new RegExp("\n", "g"), " | ");

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
        spnExternal.innerHTML = "";
        
        document.getElementById("tbFeatures").innerHTML = "";
        document.getElementById("tbSysApps").innerHTML = "";
        document.getElementById("tbUsrApps").innerHTML = "";
        document.getElementById("tbExternal").innerHTML = "";
    }

}

function runProcess () {
    try {
        let execSync = require('child_process').execSync;
        let ipHost = txtHost.value;
        let cbo = document.querySelector('#cboType');

        executionType = cbo.options[cbo.selectedIndex].value;

        if (executionType === '') {return;}

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
            let i, tx;
            let tb = document.getElementById("tbFeatures");
            let rw, cl = null;
            for (i = 0; i < deviceFeatures.length; i++) {
                rw = tb.insertRow(i);
                cl = rw.insertCell(0);
                tx = deviceFeatures[i].replace("feature:", "").trim();
                cl.innerHTML = "<a onclick=featureMoreInfo('" + tx + "')>" + tx + "</a>";
            }
            spnFeatures.innerHTML = deviceFeatures.length;
        }
        else {return};

        if (getDeviceApps(execSync)) {
            let i;
            let tb = document.getElementById("tbSysApps");
            let rw, cl, tb1 = null;
            for (i=0; i < deviceSysApps.length; i++) {
                rw = tb.insertRow(i);
                cl = rw.insertCell(0);
                cl.innerHTML = "<a onclick=appsMoreInfo('" + deviceSysApps[i].name.trim() + "')>" + deviceSysApps[i].name + "</a>";
            }
            spnSysApps.innerHTML = (deviceSysApps.length);

            tb = document.getElementById("tbUsrApps");
            tb1 = document.getElementById("tbExternal"); 
            for (i=0; i < deviceUsrApps.length; i++) {
                rw = tb.insertRow(i);
                cl = rw.insertCell(0);
                cl.innerHTML = "<a onclick=appsMoreInfo('" + deviceUsrApps[i].name.trim() + "')>" + deviceUsrApps[i].name + "</a>";
                rw = tb1.insertRow(i);
                cl = rw.insertCell(0);
                cl.innerHTML = "<a onclick=appsExternalInfo(1," + i + ")>" + deviceUsrApps[i].name + "</a>";
            }
            spnUsrApps.innerHTML = (deviceUsrApps.length);
            spnExternal.innerHTML = (deviceUsrApps.length);
        }
        else {return};
        


    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }
}

function appsMoreInfo(app) {
    try {
        shell.openExternal('https://www.google.com/search?q=' + app);
    }
    catch (e){
        console.error('Catch : \n\n ' + e);
    }
}

function featureMoreInfo (feat) {
    try {
        shell.openExternal('https://www.google.com/search?q=' + feat);
    }
    catch (e){
        console.error('Catch : \n\n ' + e);
    } 
}

function appsExternalInfo (step, index) {
    try {
                if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();

                consoleText('Calculando o hash do arquivo: ' + deviceUsrApps[index].name);
                myUsrAppsIndex = index;
                let manifest = myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[index].name + '/' + deviceUsrApps[index].name + '_android_manifest.xml';
                let appDir = myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[index].name;
                let versionName, versionCode = "";
                let a, b = 0;

                //console.log(appDir);
                if (!fs.existsSync(appDir)) {
                    fs.mkdir(appDir, (e) => {
                        if (e) {
                            return console.error(e);
                        }
                        //console.log('Directory created successfully!');
                    });
                }
                if (fs.existsSync(manifest)) {
                    fs.unlink(manifest, (e) => {
                        if (e) {
                            return console.log(e);
                        }
                    });
                }
                let shellExec = require('child_process').execSync;
                //console.log(myConfigJson.android[0].apkAnalyzorPath + '/apkanalyzer -h manifest print ' + myConfigJson.android[0].appCopyPath + '/' + deviceUsrApps[index].name + '.apk');
                console.log(myConfigJson);
                let output = shellExec(myConfigJson.android[0].apkAnalyzorPath + '/apkanalyzer -h manifest print ' + myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[index].name + '.apk', { encoding: 'utf-8' });
                fs.writeFileSync(manifest, output, { encoding: 'utf-8'});

                a = output.indexOf("android:versionCode=") + 20;
                b = output.indexOf("\n", a);
                versionCode = output.substring(a, b).replace(new RegExp('"', "g"),'');

                a = output.indexOf("android:versionName=") + 20;
                b = output.indexOf("\n", a);
                versionName = output.substring(a, b).replace(new RegExp('"', "g"),'');
                
                myFileJson = [];

                consoleText('Registrando o arquivo: ');

                //console.log(myConfigJson.android[0].jsonAnalyzeFile);
                if (fs.existsSync(myConfigJson.android[0].jsonAnalyzeFile)) {
                    let data = [];
                    data = fs.readFileSync(myConfigJson.android[0].jsonAnalyzeFile);
                    //console.log(data);
                    myFileJson = JSON.parse(data);
                    //console.log(myFileJson);
                }

                let idx = findAppJson(deviceUsrApps[index].name, versionName);
                //console.log('idx: ' + idx);
                if (idx < 0) {
                    myFileJson.push({
                        name: deviceUsrApps[index].name, 
                        version_code: versionCode,
                        version_name: versionName,
                        path: deviceUsrApps[index].path, 
                        hash: "hash", 
                        vt: {
                            fileid: "",
                            local: "",
                            url: "",
                            analysisid: ""
                        }
                    });

                    fs.writeFileSync(myConfigJson.android[0].jsonAnalyzeFile, JSON.stringify(myFileJson), 'utf8');

                    idx = findAppJson(deviceUsrApps[index].name, versionName);
                }
                
                //console.log(myFileJson);
                if (myFileJson[idx].vt.fileid === '') {
                    
                    consoleText('Enviando o arquivo para VirusTotal: ');

                    sendFile2VirusTotal2(index, idx, myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[index].name + '.apk');
                    
                    return;
                } else {
                    consoleText('Arquivo ja enviado previamente, prosseguindo com a analise: ');
                }

                if (myFileJson[idx].vt.url === '') {
                    runVirusTotalAnalysis2(idx, myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[index].name);
                    return;
                }
                else {
                    let url = "https://www.virustotal.com/gui/file/" + myFileJson[idx].vt.analysisid + "/detection";
                    openURL(url);
                    return;
                }

    }
    catch (e){
        console.error('Catch : \n\n ' + e);
    }
}

function findAppJson(app,name) {
    try {
        let i = 0;
        for (i=0; i < myFileJson.length; i++){
            if (myFileJson[i].name === app && myFileJson[i].version_name === name) {
                //console.log('found:' + app + ', ' + name + ' --> ' + i);
                return i;
            }
        }
        return -1;
    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }
}

function sendFile2VirusTotal2(i, idx, file) {
    try {
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let d = [];
        const nvt = require('node-virustotal'); 
        const defaultTimedInstance = nvt.makeAPI();
        //console.log('serializing file');
        //console.log(file);
        defaultTimedInstance.setKey(myConfigJson.vt[0].ak);
        const aMaliciousFile = require('fs').readFileSync(file);
        console.log('making post: send file');
        console.log(aMaliciousFile.length);
        const theSameObject = defaultTimedInstance.uploadFile(aMaliciousFile, deviceUsrApps[i].name, 'application/vnd.android.package-archive', function(err, res) {
            if (err) {
                consoleText("Erro enviando o arquivo para VirusTotal");
                console.log('Erro enviando o arquivo para VirusTotal');
                //console.log(err);
                //console.log(res);
                return;
            }

            //console.log(res);
            d = JSON.parse(res);
            myFileJson[idx].vt.fileid = d.data.id;
        
            consoleText('Arquivo enviado, prosseguindo com a analise: ');
            
            runVirusTotalAnalysis2(idx, myConfigJson.android[0].appCopyPath + '/' + deviceUsrApps[i].name);

            return;
        });


    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }
}

function runVirusTotalAnalysis2(idx, path) {
    try {
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let d = [];
        let url = "";
        const nvt = require('node-virustotal');
        const defaultTimedInstance = nvt.makeAPI();
        defaultTimedInstance.setKey(myConfigJson.vt[0].ak);
        console.log('making post: VirusTotal Analize');
        //console.log(myFileJson[idx]);
        //console.log(myFileJson[idx].vt.fileid);
        const theSameObject = defaultTimedInstance.getAnalysisInfo(myFileJson[idx].vt.fileid, function(err, res){
            if (err) {
                consoleText("Erro solicitando analise do VirusTotal");
                console.log('Well, crap.');
                console.log(err);
                return;
            }
            
            //console.log(res);
            d = JSON.parse(res);

            fs.writeFileSync(path + '/vtAnalysis.json', JSON.stringify(d));
            //console.log('Json gravado');
            
            //console.log(d);
            //console.log(d.meta);
            //console.log(d.data);
            //console.log(d.data.attributes);
            //console.log(d.data.links.self);

            myFileJson[idx].vt.local = path + '/vtAnalysis.json';
            myFileJson[idx].vt.url = d.data.links.self;
            myFileJson[idx].vt.analysisid = d.meta.file_info.sha256;

            //console.log(myFileJson);

            fs.writeFileSync(myConfigJson.android[0].jsonAnalyzeFile, JSON.stringify(myFileJson), 'utf8');

            consoleText('Analise finalizada, abrindo site');

            url = "https://www.virustotal.com/gui/file/" + d.meta.file_info.sha256 + "/detection";
            openURL(url);

            return;
        });
    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }
}

function openURL (url) {
    try {
        console.log("url: " + url);
        shell.openExternal(url);
    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }
}

function runADBasRoot(){
    try {
        consoleText('Mudando ADB para Root');
        let shellExec = require('child_process').execSync;
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let output = shellExec(myConfigJson.android[0].adbPath + '/adb root', { encoding: 'utf-8' });  
        if (output.indexOf('failed') > 0) {
            consoleText(output);
            return 0;
        }
        else {
            consoleText('Root com sucesso');
            return 1;
        }

    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }
}

function connect(shellExec, ip) {
    try {    
        consoleText('Conectando com host (' + ip + ')');
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let output = shellExec(myConfigJson.android[0].adbPath + '/adb connect ' + ip, { encoding: 'utf-8' });  
        if (output.indexOf('failed') > 0) {
            consoleText(output);
            return 0;
        }
        consoleText(output);
        //console.log('ret: ' + output);
        return 1;
    }catch(e){
        console.error('Catch : \n\n ' + e);
        consoleText('Erro ao conectar !!!');
        return 0;
    }
}

function getDeviceList(shellExec) {
    try {
        consoleText('Lendo informacoes do device ...');
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let output = shellExec(myConfigJson.android[0].adbPath + '/adb devices -l ', { encoding: 'utf-8' });
        consoleText(output);
        //console.log('ret: ' + output);

        let a = output.indexOf(refDeviceProduct);
        let b = output.indexOf(refDeviceModel);
        let c = output.substring(a + refDeviceProduct.length, b).trim();
        let d = output.substring(b + refDeviceModel.length, output.indexOf("device:")).trim();

        deviceProduct = c;
        deviceModel = d;

        return 1;
    }catch(e){
        console.error('Catch : \n\n ' + e);
        consoleText('Erro lendo informacoes !!!');

        return 0;
    }
}

function disconnectP (shellExec){
    try {
        consoleText('Desconectando ...');
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let output = shellExec(myConfigJson.android[0].adbPath + '/adb disconnect', { encoding: 'utf-8' });
        consoleText(output);
        //console.log('ret: ' + output);

        return 1;
    }catch(e){
        console.error('Catch : \n\n ' + e);
        consoleText('Erro ao desconectar !!!');
        return 0;
    } 
}

function getDeviceFeatures (shellExec){
    try {
        consoleText('Listando as features do device ...');
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let output = shellExec(myConfigJson.android[0].adbPath + '/adb shell pm list features', { encoding: 'utf-8' });
        consoleText(output);
        deviceFeatures = output.split("\n");
        return 1;
    }catch(e){
        console.error('Catch : \n\n ' + e);
        consoleText('Erro ao listar as features !!!');
        return 0;
    } 
}

function getDeviceApps (shellExec){
    try {
        consoleText('Listando as Apps de Sistema do device ...');
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        let output = shellExec(myConfigJson.android[0].adbPath + '/adb shell pm list packages -f -s', { encoding: 'utf-8' });
        consoleText(output);
        //console.log('ret: ' + output);
        let ret = output.split("\n");
        let xpath, xname = "";   
        let i;
        deviceSysApps = [];
        //console.log('ret.length: ' + ret.length);
        for (i = 0; i < ret.length; i++) {
            if (ret[i] === '') break;
            ret[i] = ret[i].replace("package:","");
            xname = ret[i].substring(ret[i].indexOf("=")+1,ret[i].length).trim();
            xpath = ret[i].substring(0,ret[i].indexOf("=")).trim();
            //console.log({name: xname, path: xpath});
            deviceSysApps.push( {name: xname, path: xpath} );
        }

        consoleText('Listando as Apps de Usuario do device ...');
        output = shellExec(myConfigJson.android[0].adbPath + '/adb shell pm list packages -f -3', { encoding: 'utf-8' });
        consoleText(output);
        //console.log('ret: ' + output);
        ret = output.split("\n");
        //console.log('ret.length: ' + ret.length);
        deviceUsrApps = []
        for (i = 0; i < ret.length; i++) {
            if (ret[i] === '') break;
            ret[i] = ret[i].replace("package:","");
            //console.log(ret[i]);
            switch (executionType) {
                case 'MXQ':
                    xname = ret[i].substring(ret[i].indexOf("=")+1,ret[i].length).trim();
                    xpath = ret[i].substring(0,ret[i].indexOf("=")).trim();
                    break;
                case 'TVA':
                    let ref = ret[i].split("/");
                    xname = ref[ref.length-1].trim();
                    xpath = ret[i].substring(0,(ret[i].indexOf(xname)-1)).trim();
                    xname = xname.replace("base.apk=","");
                    break;
            }
            //console.log({name: xname, path: xpath});
            deviceUsrApps.push( {name: xname, path: xpath} );
        }
        
        return 1;

    } catch(e){
        console.error('Catch : \n\n ' + e);
        consoleText('Erro ao listar as apps !!!');
        return 0;
    } 
}

function loadPage() {
    try {
        document.getElementById("defaultTabOpen").click();
        
        document.addEventListener("DOMContentLoaded", loadSettingsFromJSON());        

    } catch(e){
        console.error('Catch : \n\n ' + e);
    } 
}

function loadSettingsPage() {
    try {
        document.getElementById("defaultTabOpen").click();
        
        document.addEventListener("DOMContentLoaded", loadSettingsFromJSON());        

    } catch(e){
        console.error('Catch : \n\n ' + e);
    } 
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
    } catch (e) {
        console.error('Catch : \n\n ' + e);       
    }
  }

function openFileDlg(targetElement) {
    try {
        let spn = document.querySelector('#' + targetElement);
        let txt = "";
        let remote = require("electron").remote;
        let dialog = remote.dialog;
        let result;

        txt = "openFileDlg(): " + targetElement;
        
        //console.log(txt);

        result = dialog.showOpenDialogSync(remote.getCurrentWindow(), {
            title: "Select the folder where ADB binary is located",
            properties: [ targetElement === "spnAnalysisJSON" ? "openFile" : "openDirectory"]
        })
        if (typeof result === "object") {
            //console.log("Selected folder: ");
            //console.log(result);

            spn.innerHTML = result[0].trim();

        }
        else {
            process.stdout.write("ops");
        }

    } catch (e) {
        process.stdout.write(e);
        console.error('Catch : \n\n ' + e);       
    }
}

function pullUserApps() {
    try {
        let execSync = require('child_process').execSync;
        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        consoleText('Copiando as Apps de Usuario ...');
        let i, cmd, output;
        let fileName = '';

        for (i=0; i < deviceUsrApps.length;i++) {

            if (deviceUsrApps[i].path === '') break;

            deviceUsrApps[i].name = deviceUsrApps[i].name.replace(new RegExp("/", "g"), "");

            //console.log(myConfigJson.android[0].apkFolder);
            //console.log(myConfigJson);

            if (executionType == 'MXQ') {
                fileName = myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[i].name + '.apk';
                cmd = '/adb pull ' + deviceUsrApps[i].path + ' ' + myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[i].name + '.apk';
            }
            else if (executionType == 'TVA') {
                fileName = myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[i].name + '.apk';
                //console.log(deviceUsrApps[i].path);
                //console.log(deviceUsrApps[i].name);
                cmd = '/adb pull ' + deviceUsrApps[i].path + '/base.apk ' + myConfigJson.android[0].apkFolder + '/' + deviceUsrApps[i].name + '.apk';
            }

            if (fs.existsSync(fileName)) {
                consoleText('Arquivo ja existe na pasta: ' + deviceUsrApps[i].name);
            }
            else {
                consoleText('Copiando ' + deviceUsrApps[i].name + ' ...');
                //console.log('cmd: ' + cmd);
                output = execSync(myConfigJson.android[0].adbPath + cmd , { encoding: 'utf-8' });
                //consoleText(output);
                //console.log('ret: ' + output);
            }
        }
        
        consoleText('Apps de Usuario Copiados com Sucesso ...');

    } catch (e) {
        console.error('Catch : \n\n ' + e);
        consoleText('Erro ao Copiar as Apps de Usuario');
    }
}

function getHash (content) {
    try {
        let hash = crypto.createHash('md5');
        let gen_hash, data;
        data = hash.update(content, 'utf-8');
        gen_hash = data.digest('hex');
        return gen_hash;
    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }				
}

function closeSettings () {
    try {
        let spnADB = document.querySelector('#spnADB');
        let spnApkAnalyzor = document.querySelector('#spnApkAnalizor');
        let spnApkFolder = document.querySelector('#spnApkFolder');
        let spnApkAnalysisFolder = document.querySelector('#spnApkAnalysisFolder');
        let spnAnalysisJSON = document.querySelector('#spnAnalysisJSON');
        let spnVTak = document.querySelector('#spnVTak');
        let spnVTMainURL = document.querySelector('#spnVTMainURL');
        let spnVTDirAccURL = document.querySelector('#spnVTDirAccURL');
        let spnTVBoxPrintScreens = document.querySelector('#spnTVBoxPrintScreens');
        let content;

        content = {
            "android": [{
                "adbPath": spnADB.innerHTML,
                "apkAnalyzorPath": spnApkAnalyzor.innerHTML,
                "apkFolder": spnApkFolder.innerHTML,
                "apkAnalysisPath": spnApkAnalysisFolder.innerHTML,
                "tvboxprintscreens": spnTVBoxPrintScreens.innerHTML,
                "jsonAnalyzeFile": spnAnalysisJSON.innerHTML
            }],
            "vt":[{
                "ak": spnVTak.value,
                "mainURL": spnVTMainURL.value,
                "directAccessAnalysisURL": spnVTDirAccURL.value
            }]
        }

        //console.log(content);
        fs.writeFileSync("./config.json",JSON.stringify(content));
        //console.log('gravou o json');

        let remote = require('electron').remote;
        let win = remote.getCurrentWindow();

        if (close) win.close();

    } catch (e) {
        console.error('Catch : \n\n ' + e);
    }
}

function loadSettingsFromJSON() {
    try {
        let spnADB = document.querySelector('#spnADB');
        let spnApkAnalyzor = document.querySelector('#spnApkAnalizor');
        let spnApkFolder = document.querySelector('#spnApkFolder');
        let spnApkAnalysisFolder = document.querySelector('#spnApkAnalysisFolder');
        let spnAnalysisJSON = document.querySelector('#spnAnalysisJSON');
        let spnVTak = document.querySelector('#spnVTak');
        let spnVTMainURL = document.querySelector('#spnVTMainURL');
        let spnVTDirAccURL = document.querySelector('#spnVTDirAccURL');
        let spnTVBoxPrintScreens = document.querySelector('#spnTVBoxPrintScreens');
        
        let ret = fs.readFileSync("./config.json", {encoding: 'utf-8'});
        ret = JSON.parse(ret);
        
        if (ret !== undefined) {

            //console.log(ret);

            if (spnADB != null) spnADB.innerHTML = ret.android[0].adbPath;
            if (spnApkAnalyzor != null) spnApkAnalyzor.innerHTML = ret.android[0].apkAnalyzorPath;
            if (spnApkFolder != null) spnApkFolder.innerHTML = ret.android[0].apkFolder;
            if (spnApkAnalysisFolder != null) spnApkAnalysisFolder.innerHTML = ret.android[0].apkAnalysisPath;
            if (spnAnalysisJSON != null) spnAnalysisJSON.innerHTML = ret.android[0].jsonAnalyzeFile;
            if (spnTVBoxPrintScreens != null) spnTVBoxPrintScreens.innerHTML = ret.android[0].tvboxprintscreens;
            if (spnVTak != null) spnVTak.value = ret.vt[0].ak;
            if (spnVTMainURL != null) spnVTMainURL.value = ret.vt[0].mainURL;
            if (spnVTDirAccURL != null) spnVTDirAccURL.value = ret.vt[0].directAccessAnalysisURL;
            
            myConfigJson = ret;

            //console.log(myConfigJson);
        }
        else {
            console.log("ops");
        }

    } catch(e){
        console.error('Catch : \n\n ' + e);
    } 
}

function loadProcessedApps () {
    try {
        console.log("in: 0");
        document.addEventListener("DOMContentLoaded", loadProcessedAppsFromJSON());     
    } catch(e){
        console.error('Catch : \n\n ' + e);
    } 
}

function loadProcessedAppsFromJSON() {
    try {
        //console.log("in: 1");
        //console.log(myFileJson);

        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();

        if (myFileJson === undefined || myFileJson == null) {
            if (fs.existsSync(myConfigJson.android[0].jsonAnalyzeFile)) {
                let data = [];
                data = fs.readFileSync(myConfigJson.android[0].jsonAnalyzeFile);
                myFileJson = JSON.parse(data);
            }            
        };

        let i;
        let tb = document.getElementById("tbUsrAppsProc");
        let spnUsrAppsProc = document.querySelector('#spnUsrAppsProc');
        let rw, cl, tb1 = null;

        for (i=0; i < myFileJson.length; i++) {
            rw = tb.insertRow(i);
            cl = rw.insertCell(0);
            cl.innerHTML = "<a onclick=appsProcMoreInfo(" + i + ")>" + myFileJson[i].name + "</a>";
        }
        spnUsrAppsProc.innerHTML = (myFileJson.length);      

    } catch(e){
        console.error('Catch : \n\n ' + e);
    }     
}

function appsProcMoreInfo(index) {
    try {
        document.querySelector('#spnAppId').innerHTML = index;
        document.querySelector('#spnAppName').innerHTML = myFileJson[index].name;
        document.querySelector('#spnAppVer').innerHTML = myFileJson[index].version_code + " | " + myFileJson[index].version_name;
        document.querySelector('#spnAppRemotePath').innerHTML = myFileJson[index].path;
    } catch(e){
        console.error('Catch : \n\n ' + e);
    }  
}

function openManifest () {
    try {
        let index = document.querySelector('#spnAppId').innerHTML;
        let file = "";
        let cfg = fetchConfigFile();
        
        file = cfg.android[0].apkFolder + '/' + myFileJson[index].name + '/' + myFileJson[index].name + '_android_manifest.xml';
        console.log({xfile: file});
        shell.openPath(file);
    } catch(e){
        console.error('Catch : \n\n ' + e);
    }  
}

function openLocal () {
    try {
        let index = document.querySelector('#spnAppId').innerHTML;
        let folder = "";
        let cfg = fetchConfigFile();
        folder = cfg.android[0].apkFolder + '/' + myFileJson[index].name + '/' + myFileJson[index].name + '_android_manifest.xml';
        console.log({xfolder: folder});
        shell.showItemInFolder(folder);
    } catch(e){
        console.error('Catch : \n\n ' + e);
    }  
}

function openVTA () {
    try {
        let index = document.querySelector('#spnAppId').innerHTML;
        let url = "";
        url = "https://www.virustotal.com/gui/file/" + myFileJson[index].vt.analysisid + "/detection";
        console.log({xurl: url});
        openURL(url);
    } catch(e){
        console.error('Catch : \n\n ' + e);
    }  
}

function fetchConfigFile() {
    try {
        let ret = fs.readFileSync("./config.json", {encoding: 'utf-8'});
        ret = JSON.parse(ret);
        return ret;
    } catch(e){
        console.error('Catch : \n\n ' + e);
        return null;
    }  
}

function grabDevicePrintScreen () {
    try {
        let cmd, filename = "";
        let execSync = require('child_process').execSync;
        let ret;

        if (myConfigJson === undefined || myConfigJson === null) myConfigJson = fetchConfigFile();
        
        if (!fs.existsSync(myConfigJson.android[0].tvboxprintscreens)) {
            fs.mkdirSync(myConfigJson.android[0].tvboxprintscreens);
        }

        filename = spnDevice.innerHTML + "_" + spnModel.innerHTML + "_" + Date.now() + ".png";

        spnPrint.innerHTML = "Capturando: " + filename;
        cmd = myConfigJson.android[0].adbPath + "/adb shell screencap -p /data/app/" + filename;
        ret = execSync(cmd, { encoding: 'utf-8'});

        spnPrint.innerHTML = "Capturando: " + filename;
        cmd = myConfigJson.android[0].adbPath + "/adb pull /data/app/" + filename + " " + myConfigJson.android[0].tvboxprintscreens + "/" + filename;
        ret = execSync(cmd, { encoding: 'utf-8'});

        spnPrint.innerHTML = "Limpando: " + filename;
        cmd = myConfigJson.android[0].adbPath + "/adb shell rm /data/app/" + filename;
        ret = execSync(cmd, { encoding: 'utf-8'});        
        
    } catch(e){
        console.error('Catch : \n\n ' + e);
        spnPrint.innerHTML = "Erro";
    }  
}