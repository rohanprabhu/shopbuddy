// ==UserScript==
// @name       My Fancy New Userscript
// @namespace  http://use.i.E.your.homepage/
// @version    0.1
// @description  enter something useful
// @match      *junglee.com/*
// @copyright  2012+, You 
// ==/UserScript==

var shown = false;
var made = false;
var ifrm;

try {
    document.getElementById("buyBoxContent").innerHTML =
        '<h3 style="text-align: center; padding: 5pt; margin: 3pt; font-size: 15pt; background: #E8E8E8; border: 1px solid #000000">Ask my buddies</h3>' + document.getElementById("buyBoxContent").innerHTML;
    
    document.getElementById("buyBoxContent").onclick = function() {
        if(made == true) {
            if(shown == true) { ifrm.style.display = "none"; shown = false; } else {
                shown = true;
                ifrm.style.display = "block";
            }
            return;
        }
        ifrm = document.createElement("IFRAME"); 
        ifrm.setAttribute("src", "http://localhost:8000/shopbuddy.html");
        ifrm.style.position = "fixed";
        ifrm.style.bottom = "10pt";
        ifrm.style.left = "10pt";
        ifrm.style.border = "1px solid #00000";
        ifrm.style.width = 840 + "px"; 
        ifrm.style.height = 480 + "px"; 
        document.body.appendChild(ifrm);
        shown = true;
        made = true;
    }
} catch(e) {

}

