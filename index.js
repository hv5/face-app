const express = require('express');
const fileUpload = require('express-fileupload');
const request = require('request');
const util = require('util');
const path = require('path');
const fs = require('fs');

const app = express();

const apiKey = 'TODO';
const apiUri = 'https://northeurope.api.cognitive.microsoft.com/face/v1.0/detect';
 

app.use(fileUpload());
app.use('/images', express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    selectImage(req, res);
});

app.post('/results', function(req, res) {
    uploadImage(req, res);
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Server running at http://localhost:%d", port);
});


function selectImage(req, res) {
    var data = {};

    // Get timestamp for index.js
    var ifile = __dirname + '/index.js';
    if (fs.existsSync(ifile)) {
        var stats = fs.statSync(ifile);
        data.appModifiedString = new Date(util.inspect(stats.mtime)).toString();
    }
    createHtmlStartPage(req, res, data);
}

function uploadImage(req, res) {
    if (!req.files || !req.files.filetoupload)
        return res.status(400).send('No files were uploaded.');

    var uploadFile = req.files.filetoupload;

    // Make sure image folder exist
    var imgFolder = __dirname + '/images/';
    if (!fs.existsSync(imgFolder))
        fs.mkdirSync(imgFolder);

    var ext = path.extname(uploadFile.name);
    var newFileName = 'img-' + Math.random().toString(36).substr(2,16) + ext;
    var newFilePath = imgFolder + newFileName;
    
    console.log('newFilePath = ' + newFilePath);

    var data = {};
    data.imageRelUrl = 'images/' + newFileName;

    var hostName = req.get('host');
    if (hostName.startsWith('localhost'))
        data.imageUrl = 'http://' + hostName + '/' + data.imageRelUrl;
    else    
        data.imageUrl = 'https://' + hostName + '/' + data.imageRelUrl;

    console.log('imageRelUrl: ' + data.imageRelUrl);
    console.log('imageUrl: ' + data.imageUrl);

    uploadFile.mv(newFilePath, function(err) {
        if (err)
            return res.status(500).send(err);
    
        runFaceInspection(req, res, data);
    });
}

function runFaceInspection(req, res, data) {
    
    const apiParams = {
        'returnFaceId': 'true',
        'returnFaceLandmarks': 'false',
        'returnFaceAttributes': 'age,gender,headPose,smile,facialHair,glasses,' +
                                'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
    };

    const options = {
        uri: apiUri,
        qs: apiParams,
        body: '{"url": ' + '"' + data.imageUrl + '"}',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key' : apiKey
        }
    };

    // Make API request
    request.post(options, function(error, response, body) {
        if (error) {
          console.log('Error: ', error);
          return;
        }

        var jsonRes = JSON.parse(body);
        var jsonResStr = JSON.stringify(jsonRes);
        console.log('JSON response:');
        console.log(jsonResStr);

        data.messageHeader = null;
        data.messageText = null;

        if (jsonRes.error) {
            data.messageHeader = 'An error occured';
            data.messageText = jsonRes.error.message + '. Image URL: ' + data.imageUrl;
            createHtmlMessagePage(req, res, data);
        }
        else if (jsonRes.length > 0) {
            // Pick first face for this test
            var faceAttributes = jsonRes[0].faceAttributes;
            var jsonResString = JSON.stringify(faceAttributes, null, '  ');
            
            data.faceJsonString = jsonResString;
            data.faceAttributes = faceAttributes;  

            createHtmlResultPage(req, res, data);
        } else {
            console.log('No faces detected\n');
            data.messageHeader = 'API response';
            data.messageText = 'No faces detected in this image';
            createHtmlMessagePage(req, res, data);
        }
    });
}

function createHtmlStartPage(req, res, data) {
    res.setHeader('Content-Type', 'text/html');

    res.write('<html>');
    res.write('<title>Demo App</title>');
    res.write('<meta name="viewport" content="width=device-width, initial-scale=1">');
    res.write('<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">');
    res.write('<body>');

    res.write('<div class="w3-container w3-indigo">');
    res.write('<h2>Face Inspector</h2>');
    res.write('</div>');

    res.write('<div class="w3-container w3-light-grey">');

    res.write('<h4 style="text-shadow:1px 1px 0 #444">Select an image</h4>');

    res.write('<form action="results" method="post" enctype="multipart/form-data">');
    res.write('<input class="w3-input w3-padding-8" style="color: black; padding-left:0px; padding-bottom:30px;" type="file" name="filetoupload">');
    res.write('<input class="w3-input w3-padding-16" style="color: white; background-color:#24478f;" type="submit" value="Run face inspection">');
    res.write('</form>');
    
    res.write('</div>');

    // Last modified info
    if (data.appModifiedString) {
        res.write('<div class="w3-container">');
        res.write('<p style="font-size:10px; text-align:left">' + data.appModifiedString + '</p>');
        res.write('</div>');
    }

    res.write("</body>");
    res.write("</html>");

    res.end();

}

function createHtmlMessagePage(req, res, data) {
    res.setHeader('Content-Type', 'text/html');

    res.write('<html>');
    res.write('<meta name="viewport" content="width=device-width, initial-scale=1">');
    res.write('<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">');
    res.write('<body>');

    res.write('<div class="w3-container w3-indigo">');
    res.write('<h2>Face Inspector Results</h2>');
    res.write('</div>');

    res.write('<div class="w3-container w3-light-grey">');
    res.write('<h4 style="text-shadow:1px 1px 0 #444">' + data.messageHeader + '</h4>');
    res.write('<p>');
    res.write(data.messageText);
    res.write('</p>');
    res.write('</div>');

    res.write("</body>");
    res.write("</html>");

    res.end();
}


function createHtmlResultPage(req, res, data) {
    var fa = data.faceAttributes;

    res.setHeader('Content-Type', 'text/html');

    res.write('<html>');
    res.write('<meta name="viewport" content="width=device-width, initial-scale=1">');
    res.write('<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">');
    res.write('<body>');

    res.write('<div class="w3-container w3-indigo">');
    res.write('<h2>Face Inspector Results</h2>');
    res.write('</div>');

    res.write('<div class="w3-container w3-light-grey">');

    res.write('<p>');
    res.write('<img src="' + data.imageRelUrl + '" style="width:300px;"></img>' + '<br>');
    res.write('<a href="' + data.imageUrl + '">View full image</a>' + '<br>');
    res.write('</p>');
    
    res.write('<h4 style="text-shadow:1px 1px 0 #444">Face attributes</h4>');

    res.write('<table class="w3-table-all w3-text-indigo" style="width:300px">');
    res.write('<tr><td>' + '<b>Gender</b>'        + '</td><td>' + fa.gender + '</td></tr>');
    res.write('<tr><td>' + '<b>Age</b>'           + '</td><td>' + fa.age    + '</td></tr>');
    res.write('<tr><td>' + '<b>Anger (%)</b>'     + '</td><td>' + Math.round(fa.emotion.anger * 100) + '</td></tr>');
    res.write('<tr><td>' + '<b>Disgust (%)</b>'   + '</td><td>' + Math.round(fa.emotion.disgust * 100) + '</td></tr>');
    res.write('<tr><td>' + '<b>Fear (%)</b>'      + '</td><td>' + Math.round(fa.emotion.fear * 100) + '</td></tr>');
    res.write('<tr><td>' + '<b>Happiness (%)</b>' + '</td><td>' + Math.round(fa.emotion.happiness * 100) + '</td></tr>');
    res.write('<tr><td>' + '<b>Sadness (%)</b>'   + '</td><td>' + Math.round(fa.emotion.sadness * 100) + '</td></tr>');
    res.write('<tr><td>' + '<b>Surprise (%)</b>'  + '</td><td>' + Math.round(fa.emotion.surprise * 100) + '</td></tr>');
    res.write('<tr><td>' + '<b>Neutral (%)</b>'   + '</td><td>' + Math.round(fa.emotion.neutral * 100) + '</td></tr>');
    res.write('<tr><td>' + '<b>Eye makeup</b>'    + '</td><td>' + fa.makeup.eyeMakeup  + '</td></tr>');
    res.write('<tr><td>' + '<b>Lip makeup</b>'    + '</td><td>' + fa.makeup.lipMakeup  + '</td></tr>');
    res.write('</table>');

    res.write('<br>'); 
    res.write('<h4 style="text-shadow:1px 1px 0 #444">Face API response</h4>');

    res.write('<textarea rows="100" cols="30" style="background-color:#F1F1F1; border:none;" readonly>');
    res.write(data.faceJsonString);
    res.write('</textarea>');

    res.write('</div>');

    res.write("</body>");
    res.write("</html>");

    res.end();
}
