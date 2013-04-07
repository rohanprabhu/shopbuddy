var getURLParameter = function(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
};

var userId = getURLParameter("userId");
var rdLookup = [];

var lookupProductByTitle = function(title) {
    for(var i=0; i<products.length; i++) {
        if(products[i].productTitle == title) {
            return i;
        }
    }
};

var score = function(rating) {
    console.log(rating);
    return rating.buy - rating.dontbuy;
};

var ratings = [];

var showRatings = function() {
    var sortedRatings = ratings;
    // Sort 'em
    for(var i=0; i<ratings.length; i++) {
        for(var j=i; j<ratings.length; j++) {
            var scoreI = score(sortedRatings[i]);
            var scoreJ = score(sortedRatings[j]);
            
            if(scoreI < scoreJ) {
                var rt = sortedRatings[i];
                ratings[i] = sortedRatings[j];
                sortedRatings[j] = rt;
            }
        }
    }
    
    var dDiv = "";
    
    for(var i=0; i<sortedRatings.length; i++) {
        var product = products[sortedRatings[i].productIdx];

        dDiv += '<div style="padding: 4pt; margin-bottom: 1pt; border: 1px dashed #000000; background: #F3F3F3">' +
                ' <img style="width: 50px; height: 50px;" src="' + product.imgSrc + '" style="float: left;" />' +
                ' <div style="float: right; width: 250px;">' +
                '  <p style="padding: 0pt; padding-left: 4pt; margin: 0pt"><strong>' + product.productTitle + '</strong></p>' +
                '  <p style="padding: 0pt; padding-left: 4pt; margin: 0pt">Rs. ' + product.productCost + ' | <a href="' + product.productUrl + '" target="_blank">Buy now</a></p>' +
                ' </div>' +
                ' <div style="clear: both"></div>' +
                ' <div style="said_buy"><strong>' + sortedRatings[i].buy + '</strong> friends recommended</div>' +
                ' <div style="said_dontuby"><strong>' + sortedRatings[i].dontbuy + '</strong> friends advised against</div>' +
                '</div>';
    }
    
    $("#productList").html(dDiv);
};

var pushRatings = function(ratingsObject) {
    var productIdx = lookupProductByTitle(ratingsObject.productTitle);
    if(productIdx in ratings) {
        if(ratingsObject.rating == "buy") {
            ratings[productIdx].buy += 1;
        } else if(ratingsObject.rating == "dontbuy") {
            ratings[productIdx].dontbuy += 1;
        }
    } else {
        ratings[productIdx] = {
            "productIdx": productIdx,
            "buy": 0,
            "dontbuy": 0
        }
        
        if(ratingsObject.rating == "buy") {
            ratings[productIdx].buy += 1;
        } else {
            ratings[productIdx].dontbuy += 1;
        }
    }
    
    showRatings();
};

var ShopBuddyClient = function() {
    this.pushMessage = function(namespace, message) {
        var message = (typeof message != "string")?JSON.stringify(message):message;
        $.ajax({
            url: "http://ayushch.desktop.amazon.com:8000",
            headers: {
                "X-Amz-Target": "com.amazon.shopbuddy.ShopBuddyService.PushMessage",
                "Content-Encoding": "amz-1.0",
                "X-Requested-With": "XMLHttpRequest"
            },
            contentType: "application/json",
            type: "POST",
            data: JSON.stringify({
                "message": {
                    "body": message
                },
                "namespace": namespace
            })
        });
    };

    this.getMessages = function(namespace, id, callback) {
        var message = JSON.stringify(message);
        var dt = JSON.stringify({"namespace": namespace, "id": id});

        $.ajax({
            url: "http://ayushch.desktop.amazon.com:8000",
            headers: {
                "X-Amz-Target": "com.amazon.shopbuddy.ShopBuddyService.GetMessages",
                "Content-Encoding": "amz-1.0",
                "X-Requested-With": "XMLHttpRequest"
            },
            contentType: "application/json",
            type: "POST",
            data: JSON.stringify({
                "namespace": namespace,
                "id": id
            })
        }).done(callback);
    };
};

var shopBuddyClient = new ShopBuddyClient();

var plainPushMessage = function(message) {
    document.getElementById("chatBox").innerHTML += '<div class="message">' +
        '<div class="userId" style="color: ' + colorHash(message.userId) + '">' +
            message.userId +
          '</div>' +
          '<div class="userMessage">' +
            message.payload +
          '</div>' + 
          '<div class="clears"></div>' +
        '</div>';

    scrollToTop();
};

var products = [];

var opinionPushMessage = function(message) {
    message.payload = JSON.parse(message.payload);
    var prodIndex = products.length;
    products.push(message.payload);

    var productInfoTemplate = '<div class="productInfo">' +
            '<div class="title"><strong>' + message.userId + '</strong> wants your opinion on</div>' +
            '<div class="content">' +
            '  <img style="float: left; width: 125px; height: 125px; border: 1px dotted #E9E9E9" src="' + message.payload.imgSrc + '" />' +
            '  <div class="rightContent">' +
            '    <a target="_blank" href="' + message.productUrl + '"><h2>' + message.payload.productTitle + '</h2></a>' +
            '    <span class="manufacturer">by ' + message.payload.productManuf + '</span><br />' +
            '    <span class="price">₹ ' + message.payload.productCost + '</span>' +

            '<div style="clear: both"></div>' +

            '<h3>Your opinion</h3>' +

            '<div id="voting_' + prodIndex +'" class="voting">' +
            ' <input name="' + prodIndex + '" class="buyVote" id="buy_' + prodIndex +'" type="button" value="Buy" />' +
            ' <input name="' + prodIndex + '" class = "dontBuyVote" id="dnb_' + prodIndex +'" type="button" value="Don\'t Buy" />' +
            ' <input name="' + prodIndex + '" id="gof_' + prodIndex +'" type="button" value="Get one for me too" />' +
            '</div>' +
            '</div>' +
            '<div style="clear: both"></div>' +
            '</div>' +
            '</div>';
    
    document.getElementById("chatBox").innerHTML += productInfoTemplate;
    
    document.getElementById("dnb_" + prodIndex).onclick = (function(productTitle) {
        return function() {
            $("#voting_" + pi).animate({
                opacity: 0,
            }, 500, function() {
                $("#voting_" + pi).html("<em>Thanks for voting!</em>");
            });

            shopBuddyClient.pushMessage("ratingsChannel", {
                "pushType": "ratings",
                "rating": "dnb",
                "productTitle": productTitle
            });
        };
    })(products[prodIndex]);
    
    scrollToTop();
}

var colorHash = function(string) {
    var index = 0;
    var colors = [
        "#FF0000",
        "#00FF00",
        "#0032FF"
    ];

    for(var i=0; i<string.length; i++) {
        index += string.charCodeAt(i);
    }

    return colors[index % colors.length];
};

var scrollToTop = function() {
    document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight;
};

var pushMessage = function(message) {
    switch(message.pushType) {
        case "PlainText": {
            plainPushMessage(message);
        } break;
    };

    scrollToTop();
};

var Poller = function(namespace, callback) {
    var latestId = null;

    var semiCallback = function(data) {
        var data = JSON.parse(data);
        latestId = data.lastId || "-1";
        callback(data.messages);
    };

    var polling = function() {
        shopBuddyClient.getMessages(namespace, latestId, semiCallback);
        setTimeout(polling, 1200);
    };

    shopBuddyClient.getMessages(namespace, "-1", function(data) {
        var data = JSON.parse(data);
        latestId = data.lastId || "-1";
        polling();
    });
};

var postMessage = function(namespace, message) {
    shopBuddyClient.pushMessage(namespace, message);
};

$(document).ready(function() {
    var simpleMessagePoller = new Poller("simpleMessages", function(messages) {
        if(typeof messages == "undefined" || messages == null) {
            return;
        }

        for(var i=0; i<messages.length; i++) {
            var messageObject = JSON.parse(messages[i].body);
            plainPushMessage(messageObject);
        }
    });
    
    var productInfoPoller = new Poller("productInfo", function(messages) {
        if(typeof messages == "undefined" || messages == null) {
            return;
        }

        for(var i=0; i<messages.length; i++) {
            try {
                var messageObject = JSON.parse(messages[i].body);
                opinionPushMessage(messageObject);
            } catch(e) {
            }
        }
    });
    
    var ratingsPoller = new Poller("ratingsChannel", function(messages) {
        if(typeof messages == "undefined" || messages == null) {
            return;
        }
        
        for(var i=0; i<messages.length; i++) {
            var messageObject = JSON.parse(messages[i].body);
            pushRatings(messageObject);
        }
    });
    
    $("#chatBox").delegate(".buyVote", "click", function() {
        var pi = this.getAttribute("name");
        var productTitle = products[pi].productTitle;

        $("#voting_" + pi).animate({
            opacity: 0,
        }, 500, (function(_pi) {
            return function() {
                $("#voting_" + _pi).html("You <strong style=\"color: #00FF00\">recommended</strong> this product. <em>Thanks buddy!</em>");
                $("#voting_" + _pi).animate({
                    opacity: 1
                }, 400);
            };
        })(pi));

        shopBuddyClient.pushMessage("ratingsChannel", {
            "pushType": "ratings",
            "rating": "buy",
            "productTitle": productTitle
        });
    });
    
    $("#chatBox").delegate(".dontBuyVote", "click", function() {
        var pi = this.getAttribute("name");
        var productTitle = products[pi].productTitle;

        $("#voting_" + pi).animate({
            opacity: 0,
        }, 500, (function(_pi) {
            return function() {
                $("#voting_" + _pi).html("You <strong style=\"color: #FF0000\">advised against</strong> buying this product. <em>Thanks buddy!</em>");
                $("#voting_" + _pi).animate({
                    opacity: 1
                }, 400);
            };
        })(pi));

        shopBuddyClient.pushMessage("ratingsChannel", {
            "pushType": "ratings",
            "rating": "dontbuy",
            "productTitle": productTitle
        });
    });

    $("#chatLineInp").keypress(function(event) {
        if(event.which == 13) {
            event.preventDefault();

            postMessage("simpleMessages",
                {
                    userId: userId,
                    payload: $("#chatLineInp").val()
                }
            );

            $("#chatLineInp").val("");
            $("#chatLineInp").focus();
        }
    });
});
