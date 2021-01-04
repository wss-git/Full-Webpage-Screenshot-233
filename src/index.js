const setup = require('./lib/setup');
const fs = require('fs');


module.exports.initializer = function(context, callback) {
  console.log('initializing');
  callback(null, ''); 
};

module.exports.handler = (req, resp, context) => {
  // Get the URL of the web page that needs screenshots from the request parameters
  let url = req.queries['url'];
  // If there is no url in the request parameters, set the default URL
  if (!url) {
    url = 'https://www.aliyun.com/product/fc';
  }
  // Whether it's HTTP or HTTPS, all prefixes are http
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    url = 'http://' + url;
  }
  
  screenshot(url, context)
    .then(outputFile => {
      // Get screenshot successful return
      resp.setStatusCode(200);
      resp.setHeader('content-type', 'image/png');
      resp.send(fs.readFileSync(outputFile))
    })
    .catch(err => {
      // Get screenshot failed return
      resp.setStatusCode(500);
      resp.setHeader('content-type', 'text/plain');

      resp.send(err.message);
    });
};

// Get screenshot method
async function screenshot(url, context) {
  // Open a new browser viewport
  let browser = await setup.getBrowser(context);

  const page = await browser.newPage();
  const outputFile = '/tmp/screenshot.png';

  let retry = 0;
  let success = false;
  
  // Try to read the screenshot less than 6 times
  do {
    try {
      console.log('goto', url);
      await page.goto(url);
      success = true;
    } catch(e) {
      console.log('error', e);
      retry++;

      if (retry >= 6) {
        throw e;
      }
    }
  } while(!success && retry < 6);

  // Set the path of the screenshot, whether it is full page or not, and type
  await page.screenshot({
    path: outputFile,
    fullPage: true,
    type: 'png'
  });

  return outputFile;
};
