(function () {
    'use strict';
    var request = require("request");
    var cheerio = require("cheerio");
    var fs = require('fs');
    var deliveryareas = require("./deliveryareas.json");
    for (var i = 0;i < deliveryareas.length;i++) {
        request({
            uri: "https://pizza.de/" + deliveryareas[i],
        }, function(error, response, body) {
            var $ = cheerio.load(body);
            var timestamp = new Date().getTime();
            var service, row, link, text;
            var da = response.request.path.replace(/\//g, '');
            console.log($("span.discount-value").length + " deals found.");
            $("span.discount-value").each(function() {
                service = $(this);
                row = service.parents(".srow");
                link = $(row).children(".pdv").children("a");
                text = timestamp + "," + service.text().replace(/[^0-9]/g, '') + "," + link.attr("href") + "\n";
                fs.appendFile("data/" + da + ".csv", text, function(err) {
                    if (err) {
                        console.error(err);
                    }
                });

            });
        });
    }
}());
