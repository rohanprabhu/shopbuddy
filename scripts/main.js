var getURLParameter = function(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
};

var userId = getURLParameter("userId");

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
        setTimeout(polling, 120);
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
            console.log(messages[i]);
            var messageObject = JSON.parse(messages[i].body);
            plainPushMessage(messageObject);
        }
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
