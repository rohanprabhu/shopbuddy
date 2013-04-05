var userId;

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

var adjustChatBox = function() {
  var height = document.getElementById('chatBox').offsetHeight - 200;
  document.getElementById('rest').style.height = height + 'px';
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
	var pollUrl = "",
	    latestId = null;

	var polling = function() {
    	latestId = json.lastId;

    	$.ajax({
    	    url: pollUrl,
    	    data: '{"namespace": ' + namespace + ', "lastId": ' + latestId + '}',
    	    dataType: 'application/json'
    	}).done(function(data) {
    	   	latestId = data.lastId;
    	   	callback(data.messages);
    	});
	};

    $.ajax({
    	url: pollUrl,
    	data: '{"namespace": ' + namespace + ', "lastId": -1}',
    	dataType: 'application/json'
    }).done(function(data) {
    	latestId = data.lastId;
    	setInterval(polling, 120);
    });
};

var postMessage = function(namespace, message) {
	var postUrl = "";

    $.ajax({
    	url: postUrl,
    	data: JSON.stringify({
    		"namespace": namespace,
    		"message": message
    	})
    });
};

$(document).ready(function() {
	var simpleMessagePoller = new Poller("simpleMessages", function(messages) {
		for(var i=0; i<messages.length; i++) {
			plainPushMessage(messages[i]);
		}
	});

	$("#chatLineInp").keypress(function(event) {
		if(event.which == 13) {
			event.preventDefault();
		}

		postMessage("simpleMessages",
		    JSON.stringify({
			    userId: userId,
			    message: $("#chatLineInp").value()
		    })
		);

		$("#chatLineInp").value("");
		$("#chatLineInp").focus();
	});
});
