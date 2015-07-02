/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'),
  request = require('request'),
  app = express(),
  errorhandler = require('errorhandler'),
  bluemix = require('./config/bluemix'),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend;

// For local development, put username and password in config
// or store in your environment
var config = {
  version: 'v1',
  url: 'https://stream.watsonplatform.net/text-to-speech/api',
  username: '<username>',
  password: '<password>'
};

// if bluemix credentials exists, then override local
var credentials = extend(config, bluemix.getServiceCreds('text_to_speech'));

// Create the service wrapper
var textToSpeech = new watson.text_to_speech(credentials);

// Setup static public directory
app.use(express.static('./public'));


app.get('/synthesize', function(req, res) {
  var transcript = textToSpeech.synthesize(req.query);
  transcript.on('response', function(response) {
    if (req.query.download) {
      response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
    }
  });
  transcript.pipe(res);

});


// Get token from Watson using your credentials
app.get('/token', function(req, res) {
  console.log('obj');
  request.get({
    url: 'https://stream.watsonplatform.net/authorization/api/v1/token?url=' +
      'https://stream.watsonplatform.net/text-to-speech/api',
    auth: {
      user: credentials.username,
      pass: credentials.password,
      sendImmediately: true
    }
  }, function(err, response, body) {
    res.send(body);
  });
});

// Add error handling in dev
if (!process.env.VCAP_SERVICES) {
  app.use(errorhandler());
}

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);

console.log('listening at:', port);