After downloading the source files from github the following steps will be necessary to make the app run:

1) Install Android SDK >> https://developer.android.com/studio 
2) Install Android Command Line Tools >> https://developer.android.com/studio#command-tools
3) Install Node.JS >> https://nodejs.org/en/
4) Install Electron.JS on the application path
    npm install electron --save-dev
5) Install node-virustotal package
    npm install node-virustotal
6) Replace node-virustotal v3.js file ({app_path}/node_modules/node-virustotal/v3.js) with the file with the necessary bug fixes from ({app_path/src/js/libbugfix/v3.js})
7) Create Virus-Total API Key (free for non-comercial use) >> https://www.virustotal.com/gui/join-us


To run the app (from the app's path):

    npm start

First Run:

When running the app for the first time, you need to access adbProfiling > settings, then set the values for all entries - otherwise the app will fail to do all its tasks.

How to use the app:

1) Preparing the TVBox
1.1) TVBox need to be set in 'Developer Mode'
1.2) USB Debbuging needs to be turned on. If the settings have WiFi Debbuging it needs to be turned on as well
1.3) Connect the TVBox into the same network than the computer running this app
1.4) Get TV Box IP address

2) Run the app (npm start) after loaded on screen type the target TV Box IP Address on the IP text box
3) Adjust the string references for 'MXQ' or 'TVA', actually MXQ is the Android standard and will work with nearly all TVBoxes, TVA has fancy strings that breaks the code, so, an special adaptation was required.
4) Click on 'Executar', the app will execute the following tasks -- on this order:
4.1) Estabilish a connection with TV Box thru adb
4.2) List OEM and model name
4.3) List Android features enable on the system's build
4.4) List all apps from TV Box, the apps will be split into System and User apps
4.5) Sometimes will be necessary to run adb in 'root' mode, for this, simply click on button 'Rodar ADB como Root'
5) If the connection and data grabbing ran correctly, now you should have data into the log text area
5.1) If connection failed .... ^^ contact Danilo
5.2) On tab 'Info' only OEM and model will be listed
5.3) On tab 'Features' all features enabled in the TVBox build will be listed. All of them are linked to a google search with the feature string as parameter, so, it will be somewhat easy to understand what an specific feature does.
5.4) On tab 'Apps' all apps wil be listed in two columns System and User. All list items have links to a google search as well for extra information about an specific app. On this tab is also possible to bring all the user apps from TVBox to the computer. Currently only User apps can be copied and all of them, not possible to select which one to copy.
5.5) On tab 'External' it lists again all user apps from the TVBox. This tab should be used only after the apks were copied from TVBox to the computer. By clicking on an specific app, the system "processes" the app, as following:
5.5.1) Run apkanalyzer in order to extract its manifest in human readable form
5.5.2) Upload the apk file to VirusTotal
5.5.3) Retrieve from VirusTotal the analysis ID
5.5.4) Wait for the analysis to finish and opens virustotal web gui with the corresponding analysis
5.5.5) All this is logged to an specific json control file to avoid keep sending the apk files to VirusTotal unnecessarily
5.6) On tab 'Print Screen' is possible to retrieve the current print screen from the TVBox, all captured screens will be saved on computer and deleted from the TVBox
6) To access the list of all apks already processed by the app go to adbProfiling > List Processed Apps
6.1) This screen will list all apks that were already processed by the app
6.2) Clicking on an specific apk it is possible to access some details on the right panel
6.2.1) Possible to open the apk's manifest in readable mode
6.2.2) Possible to open the computer's folder for that specific apk analysis
6.2.3) Possible to access VirusTotal previous analysis from that apk


By default the app has the Debbuging turned off, to turn it on and access Appium/Chromium developers tool, change the following in the file './main.js' 
    from:   const DEFINE_DEV = 0;
    to:     const DEFINE_DEV = 1;


Enjoy!