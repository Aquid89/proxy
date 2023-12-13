var express = require('express'); 
//var request = require('request'); 
var app = express();

var router = require('./routes');
app.use(router)
// app.get('/api', (req, res)=>{ 
//    // console.log(req.query.url)
//       // Определите новые заголовки, которые вы хотите добавить
//       var customHeaders = {
//         'User-Agent': 'YourCustomUserAgent',
//         'Authorization': 'Bearer YourAccessToken',
//         // Другие заголовки...
//     };

//     // Формируем параметры запроса, включая новые заголовки
//     var requestOptions = {
//         url: req.query.url,
//         headers: customHeaders,
//     };
//     request(requestOptions, (error, response, body)=> { 
//       if (!error && response.statusCode === 200) { 
//     //  console.log(body); 
//         res.send(body);  
//       } 
//      }); 
//   });
  //app.use("/public", express.static(path.join(__dirname, 'public')));
  app.listen(3000); 
  console.log('Server running on port %d', 3000);