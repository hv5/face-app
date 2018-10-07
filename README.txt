Prerequsites
-------------
1) Create an Azure account
2) Install nodejs v8.12.0 from https://nodejs.org/en/download/
3) Install Visual Studio Code from https://code.visualstudio.com/Download


Create simple web app
----------------------
a1) Navigate to C:\appl and create a new folder named NodeApps
a2) Navigate to C:\appl\NodeApps and create new folder named face-app
a3) Navigate to C:\appl\NodeApps\face-app
a4) Start Visual Studio Code and open folder C:\appl\NodeApps\face-app
a5) From Visual Studio Code, open new Terminal window
a6) From Terminal window, run these commands to setup your project:
	- npm init
	- npm install request
	- npm install express
	- npm install express-fileupload

a7) From Visual Studio Code, create a folder named images
a8) Open File Explorer and navigate to ...
a9) Drag file index.js into Visual Studio Code explorer window
a10) Drag file web.config into Visual Studio Code explorer window
a11) From Terminal window, run "node index.js" to start local web server
a12) Open a web browser and navigate to http://localhost:3000/


Put the project into a ZIP file
--------------------------------
b1) Open PowerShell and navigate to C:\appl\NodeApps\face-app
b2) Run "Compress-Archive -Path * -DestinationPath ../face-app.zip -Force"


Update your Web App service with a proper Node version
-------------------------------------------------------
c1) Login to https://portal.azure.com
c2) Navigate to your Web App service (username-app)
c3) For your Web App service, select Application settings
c4) Add new setting WEBSITE_NODE_DEFAULT_VERSION = 8.9.4 and save


Deploy the zipped project to the Azure web app service 
-------------------------------------------------------
d1) Navigate to your Web App service (username-app where username is your own user id)
d2) From the Overview page, copy the URL (https://username-app.azurewebsites.net)
d3) Open the URL above in the web browser (https://username-app.azurewebsites.net)
d4) Navigate to the SCM for your App service(https://username-app.scm.azurewebsites.net)
d5) Navigate to Tools > Zip Push Deployment
d6) Drag the file C:\appl\NodeApps\face-app.zip into the ZipDeploy tool in SCM

Navigate to your Web App URL (https://username-app.azurewebsites.net)






















