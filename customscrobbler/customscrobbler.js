var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;
var targetURL = "http://slsh.ath.cx/playlist/submit";

exports.init = init;

function init() {

	updatePageWith(trackDetails());

	player.observe(models.EVENT.CHANGE, function (e) {

		// Only update the page if the track changed
		if (e.data.curtrack == true) {
			updatePageWith(trackDetails());
			sendPlayingInfo();
		}
	});
}

var METHODS = {
    POST: "POST",
    GET: "GET"
};

function sendPlayingInfo() {
	var playerTrackInfo = player.track;

	if (playerTrackInfo !== null) {
		var track = playerTrackInfo.data;

		var params = {
            "track": track.name,
            "album": track.album.name,
            "artist": track.album.artist.name
        };

        var retVal = sendReq(targetURL, params, METHODS.POST);
        if (retVal === true) {
            updatePageWithSuccessfulSubmit(params);
        } else {
            updatePageWithFailedSubmit(params);
        }
	}
}
function escapeHTML(data) {
    var div = document.createElement('div');
    var text = document.createTextNode(data);
    div.appendChild(text);
    return div.innerHTML;
}
function updatePageWith(textValue) {
	var header = getWith("header");
	header.innerText = textValue;
}

function getWith(searchId) {
    var elem = document.getElementById(searchId);
    if (!elem) {
        console.error("Couldn't find " + searchId);
    }
    return elem;
}
function updatePageWithSuccessfulSubmit(params) {
    var results = getWith("scrobbling");
    results.innerHTML += "<tr>"
        + "<td>" + new Date() + "</td>"
        + "<td>" + escapeHTML(params.artist) + "</td>"
        + "<td>" + escapeHTML(params.track) + "</td>"
        + "<td>" + escapeHTML(params.album) + "</td>"
        + "<td>Submit ok</td>"
        + "</tr>";
}
function updatePageWithFailedSubmit(params) {
    var results = getWith("scrobbling");
    results.innerHTML += "<tr>"
        + "<td>" + new Date() + "</td>"
        + "<td>" + escapeHTML(params.artist) + "</td>"
        + "<td>" + escapeHTML(params.track) + "</td>"
        + "<td>" + escapeHTML(params.album) + "</td>"
        +" <td><b>Submit failed</b></td>"
        + "</tr>";
}

function trackDetails() {

	// This will be null if nothing is playing.
	var playerTrackInfo = player.track;

	if (playerTrackInfo == null) {
		return "Nothing playing!";
	} else {
		var track = playerTrackInfo.data;
		return "Now playing: " + track.album.artist.name + " - " + track.name + " [" + track.album.name + "]";
	}
}

function sendReq(url, queryParams, httpMethod) {

	console.debug("Submitting using " + httpMethod);

    try
    {
        var queryParamsEscaped = '';
        for (var key in queryParams) {
            queryParamsEscaped += key + '=' + encodeURIComponent(queryParams[key]);
        }

    	var req = new XMLHttpRequest();

    	if (httpMethod === METHODS.GET) {
    	    req.open("GET", targetURL + '?' + queryParamsEscaped, true);
    	} else if (httpMethod === METHODS.POST) {
            req.open("POST", targetURL, true);
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            req.setRequestHeader("Content-Length", queryParamsEscaped.length);
            req.setRequestHeader("Connection", "close");
        } else {
            console.error("ERROR with unknown method: " + httpMethod);
            return false;
        }
    	req.onreadystatechange = function() {
       		if (req.readyState == 4) {
                console.info("Submitted with HTTP status code " + req.status);
        		if (req.status == 200) {
                    console.debug("Success");
    		    }
            }
    	}
    	if (httpMethod === METHODS.POST) {
            req.send(queryParamsEscaped);
        } else if (httpMethod === METHODS.GET) {
            req.send();
        }
   		console.debug("Request sent: " + targetURL + '?' + queryParamsEscaped);
    } catch (exception) {
        console.error("Issue occurred: " + exception);
        return false;
    }
    return true;
}
