const express = require('express')
const router = express.Router()
var request = require('request'); 

router.get('/api', (req, res) => {
       // console.log(req.query.url)
      // Определите новые заголовки, которые вы хотите добавить
      var customHeaders = {
        
        //  'Origin': 'http://localhost:8082',
        //  'Referer': 'https://cointelegraph.com/'
        // 'Content-Type': 'text/javascript',
        // 'X-Content-Type-Options': 'nosniff;'

        
        // Другие заголовки...
    };

    // Формируем параметры запроса, включая новые заголовки
    var requestOptions = {
        url: req.query.url,
        headers: customHeaders,
    };
    request(requestOptions, (error, response, body)=> { 
      if (!error && response.statusCode === 200) { 
    //  console.log(body); 
     res.setHeader('Access-Control-Allow-Origin', '*');

    // res.setHeader("Content-Type, Access-Control-Allow-Headers, Authorization")
    //  res.setHeader('Content-Type', 'text/javascript');

    //  res.setHeader('X-Content-Type-Options', 'nosniff');
        res.send(body);  
      } else {
        console.log(error)
        res.send(error)
      }
     });  
  })

module.exports = router