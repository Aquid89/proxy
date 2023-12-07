const express = require('express')
const router = express.Router()
var request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require('cors')

const PdfPrinter = require('pdfmake');
const fs = require('fs');

const path = require('path');

router.get('/api', cors(), (req, res) => {
  // console.log(req.query.url)
  // Определите новые заголовки, которые вы хотите добавить
  var customHeaders = {

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
  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const dom = new JSDOM(body);
      const document = dom.window.document;

      const baseTag = document.createElement('base');
      baseTag.target = '_blank';
      baseTag.href = requestOptions.url;
      document.head.insertAdjacentHTML('beforebegin', baseTag.outerHTML);

      //For https://www.coindesk.com/
      const elementToRemove = document.querySelector('.high-impact-ad');
      if (elementToRemove) {
        elementToRemove.remove();
      }

      res.send(dom.serialize());
    } else {
      console.log('err', error)
      res.send(error)
    }
  });
})
router.get('/pdf', (req, res) => {
  // Создание нового PDF документа
  const fonts = {
    Roboto: {
      normal: 'fonts/Roboto-Regular.ttf',
      bold: 'fonts/Roboto-Medium.ttf',
      italics: 'fonts/Roboto-Italic.ttf',
      bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
  };
  const printer = new PdfPrinter(fonts);
  const docDefinition = {
    content: [
      {
        margin: [0, 0, 0, 20],
        //layout: 'lightHorizontalLines', // optional
        table: {

          // headers are automatically repeated if the table spans over multiple pages
          // you can declare how many rows should be treated as headers
          //  headerRows: 1,
          widths: ['*', '*'],

          body: [
            // [ 'First', 'Second' ],
            ['06.12.2023 14:15:59', ' Confirmed '],
          ]
        }
      },
      { text: 'Ether', fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 20] },
      {
        //layout: 'lightHorizontalLines', // optional
        table: {
          // headers are automatically repeated if the table spans over multiple pages
          // you can declare how many rows should be treated as headers
          //  headerRows: 1,
          widths: ['*', 'auto'],

          body: [
            // [ 'First', 'Second' ],
            ['Direction', 'Send'],
            ['Value', '0.00001 ETH'],
            ['Recipient', '0x885035208dce7356faba7a6fa12fa4aee9fddd3e'],
          ]
        }
      },
      { text: 'Transaction Data', fontSize: 15, alignment: 'center', bold: true, margin: [0, 50, 20, 20] },
      {
        //layout: 'lightHorizontalLines', // optional
        table: {
          // headers are automatically repeated if the table spans over multiple pages
          // you can declare how many rows should be treated as headers
          //  headerRows: 1,
          widths: ['*', 'auto'],

          body: [
            // [ 'First', 'Second' ],
            ['From', '0x195a9298f08a187147bead2465bfc264b4c9e821'],
            ['To', '0x885035208dce7356faba7a6fa12fa4aee9fddd3e'],
            ['Block', '?'],
            ['Hash', '0x42c4b617277d295dc9ec1c33c0639420630b713d054bbde086bdd714814651c1'],
            ['Nonce', '685?'],
            ['Value', '0.00001'],
            ['Gas Used', '21000'],
            ['Gas Price', '48472568384'],
            ['Fee', '0.000018'],
            ['Input', '0.00001'],
          ]
        }
      }
    ]
  };


  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  //pdfDoc.pipe(fs.createWriteStream('document.pdf'));
  pdfDoc.pipe(res);

  pdfDoc.end();


})

router.get('/api-pdf', cors(), (req, res) => {
  var customHeaders = {
  };
  var requestOptions = {
    url: 'https://api-dev-full.sinum.io/widgets/explorer/transaction/0x42c4b617277d295dc9ec1c33c0639420630b713d054bbde086bdd714814651c1?blockchain=ethereum',
    headers: customHeaders,
  };
  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const objTransaction = JSON.parse(body);
      console.log(objTransaction)
      const fonts = {
        Roboto: {
          normal: 'fonts/Roboto-Regular.ttf',
          bold: 'fonts/Roboto-Medium.ttf',
          italics: 'fonts/Roboto-Italic.ttf',
          bolditalics: 'fonts/Roboto-MediumItalic.ttf'
        }
      };
      const printer = new PdfPrinter(fonts);
      const docDefinition = {
        content: [
          {
            margin: [0, 0, 0, 20],
            table: {
              widths: ['*', '*'],

              body: [
                [objTransaction.data.timeStamp, objTransaction.data.status],
              ]
            }
          },
          { text: 'Ether', fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 20] },
          {
            table: {
              widths: ['*', 'auto'],

              body: [
                // [ 'First', 'Second' ],
                ['Direction', 'Send ?'],
                ['Value', objTransaction.data.value],
                ['Recipient', objTransaction.data.to],
              ]
            }
          },
          { text: 'Transaction Data', fontSize: 15, alignment: 'center', bold: true, margin: [0, 50, 20, 20] },
          {
            table: {
              widths: ['*', 'auto'],

              body: [
                // [ 'First', 'Second' ],
                ['From', objTransaction.data.from],
                ['To', objTransaction.data.to],
                ['Block', objTransaction.data.blockNumber],
                ['Hash', objTransaction.data.hash],
                ['Nonce', objTransaction.data.nonce],
                ['Value', objTransaction.data.value],
                ['Gas Used', objTransaction.data.gasUsed],
                ['Gas Price', objTransaction.data.gasPrice],
                ['Fee', '0.000018 ?'],
                ['Input', objTransaction.data.input + '?'],
              ]
            }
          }
        ]
      };


      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const fileStream = pdfDoc.pipe(fs.createWriteStream('document.pdf'));

      //pdfDoc.pipe(fileStream);

      fileStream.on('finish', () => {
        res.download('document.pdf', () => {
          const filePath = path.resolve('document.pdf');
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(err);
            }
          });
        });


        // fs.unlink(filePath, (err) => {
        //   if (err) {
        //     console.error(err);
        //   }
        // });
      });
      // pdfDoc.pipe(fs.createWriteStream('document.pdf'));
      //    pdfDoc.pipe(res);

      pdfDoc.end();

      // res.send();
    } else {
      console.log('err', error)
      res.send(error)
    }
  });
})
module.exports = router