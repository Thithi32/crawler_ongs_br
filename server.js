var http = require('http');
var cheerio = require('cheerio');
var moment = require('moment');
var request = require('request');
var slug = require('slug');
fs = require('fs')
var go = true;

/******* CONFIGURATION VARIABLES ******/
/** Number of ONG currently registered in site: 21314 **/
	var max = 50; // Number of pages to parse
	var start = 1; // Page id to start parsing
	var blocksize = 50; // number of call before timeout
	var blocktime = 5000; // (in ms) time for each block including expected timeout
/******* END CONFIGURATION ************/

if (go) {
	go = false;

  var url_base = "http://www.ongsbrasil.com.br/default.asp?Pag=2&Destino=InstituicoesTemplate&CodigoInstituicao=";

	var requests = 0;
  var ongs = [];

  function parseUrl(url) {

		// Send HTTP request
		request({
			url: url,
			encoding: 'latin1',
		}, function (error, response, body) {
			requests = requests + 1;
  		console.log('Receiving request ' + requests);

			if (!error) {
				var $ = cheerio.load(body);

				var name = $('.textoh2').text();

				if (name && name.length !== 0) {

					var classificacao = $('.saibamais').first().text();
					var ong = {
						'name': name,
						'classificacao': (classificacao.startsWith("ONG ")) ? classificacao : '',
					};

					$('.table tr').each(function() {
						var tds = $(this).find('td');
						var key = slug($(tds[0]).text(), '_').toLowerCase();
						var value = $(tds[1]).text();
						ong[key] = value;
					});

					ongs.push(ong);
				} else {
					console.log('No name for item ' + url);
				}

			} else {
				console.log('Error for item ' + url);
			}

			if (requests === max) {

				var csv = '';
				var keys = {};
				ongs.forEach(function(ong) {
					Object.keys(ong).forEach(function(key) {
						keys[key] = true;
					});
				});

				keys = Object.keys(keys);
				keys.forEach(function(key) {
					csv = csv + key + ',';
				})
				csv = csv.slice(0,-1) + "\n";

				ongs.forEach(function(ong) {
					keys.forEach(function(key) {
						if (ong[key]) {
							csv = csv + ong[key].replace(/,/g, ';').replace(/[\n\r]/g, ' ').trim();
						}
						csv = csv + ','
					})
					csv = csv.slice(0,-1) + "\n";
				});


				fs.writeFile("ongs.csv", csv, function(err) {
				    if(err) {
				        return console.log(err);
				    }
				    console.log("The file ongs.csv was saved!");
				});

				console.log('Ending at ' + moment().format('LTS'));

			}
		});
  }

	console.log('Starting at ' + moment().format('LTS'));
  for (var i = start; i < start + max; i++) {
  	var timeout = Math.floor((i-start)/blocksize) * blocktime + 1;
  	var url = url_base + i;

  	setTimeout(parseUrl.bind(null,url), timeout);
	}

}
