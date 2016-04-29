/*
* Copyright (c) 2015 Samsung Electronics Co., Ltd.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are
* met:
*
* * Redistributions of source code must retain the above copyright
* notice, this list of conditions and the following disclaimer.
* * Redistributions in binary form must reproduce the above
* copyright notice, this list of conditions and the following disclaimer
* in the documentation and/or other materials provided with the
* distribution.
* * Neither the name of Samsung Electronics Co., Ltd. nor the names of its
* contributors may be used to endorse or promote products derived from
* this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
* "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
* LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
* A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
* OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
* SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
* LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
* DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
* THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


var SAAgent,
    SASocket,
    connectionListener,
    chart,
    responseTxt = document.getElementById("responseTxt");
var healthy = 5;
var unhealthy = 5;

/* Make Provider application running in background */
//tizen.application.getCurrentApplication().hide();
//Want it run in foreground
function loadChart() {
	//alert("ffstgag");
	
	chart = c3.generate({
        bindto: '#main_inner',
        data: {
            columns: [
                ['unhealthy', unhealthy],
                ['healthy', healthy]
            ],
            type: 'pie',
            labels: false,
            colors: {
                healthy: '#33ff33',
                unhealthy: '#ff0033'
            },
            onclick: function (d, element) {
            	console.log("onclick", d, element);
            	
            	//debugger;
            	if ( d['id'] === 'healthy' ) {
            		chart.load( {
            			unload: ['healthy', 'unhealthy'],
            			columns:[ 
        			         ['healthy', chart.data.values('healthy')[0] + 1 ],
        			         ['unhealthy', chart.data.values('unhealthy')[0] ]
    			         ],
			         });
            		healthy = healthy + 1;
            	} else { //unhealthy
            		chart.load( {
            			unload: ['healthy', 'unhealthy'],
            			columns:[ 
        			         ['healthy', chart.data.values('healthy')[0] ],
        			         ['unhealthy', chart.data.values('unhealthy')[0] + 1 ]
    			         ],
			         });
            		unhealthy = unhealthy + 1;
            	}
            	
            	 
            	//chart.data.values('healthy')[0].toString()
            	var toSend = "Healthy=" + healthy + ",Unhealthy=" + unhealthy;
            	send(toSend);
            	chart.focus();
            },
        },
        legend: {
            hide: true
        },
        tooltip: {
    		show: false
		}
    });
}

function createHTML(log_string)
{
    var content = document.getElementById("toast-content");
    content.innerHTML = log_string;
    tau.openPopup("#toast");
}

connectionListener = {
    /* Remote peer agent (Consumer) requests a service (Provider) connection */
    onrequest: function (peerAgent) {

        createHTML("peerAgent: peerAgent.appName<br />" +
                    "is requsting Service conncetion...");

        /* Check connecting peer by appName*/
        if (peerAgent.appName === "EightyTwenty") {
            SAAgent.acceptServiceConnectionRequest(peerAgent);
            createHTML("Service connection request accepted.");

        } else {
            SAAgent.rejectServiceConnectionRequest(peerAgent);
            createHTML("Service connection request rejected.");

        }
    },

    /* Connection between Provider and Consumer is established */
    onconnect: function (socket) {
        var onConnectionLost,
            dataOnReceive;

        createHTML("Service connection established");

        /* Obtaining socket */
        SASocket = socket;

        onConnectionLost = function onConnectionLost (reason) {
            createHTML("Service Connection disconnected due to following reason:<br />" + reason);
        };

        /* Inform when connection would get lost */
        SASocket.setSocketStatusListener(onConnectionLost);

        dataOnReceive =  function dataOnReceive (channelId, data) {
            //var newData;

            if (!SAAgent.channelIds[0]) {
                createHTML("Something goes wrong...NO CHANNEL ID!");
                return;
            }
            
            //Parse received data
            createHTML(data);
            var res = data.split(",");
            var health = res[0].split("=");
            var unhealth = res[1].split("=");
            healthy = health[1];
            unhealthy = unhealth[1];
            
            //Update chart with new data
            chart.load({unload: ['healthy', 'unhealthy'],columns:[ ['healthy', healthy ], ['unhealthy', unhealthy ]],});
            createHTML(health[1] + "-" + unhealth[1]);
            //Healthy=9,Unhealthy=1
            
            //HERE IS WHERE YOU SET THE DATA TO UPDATE MOBILE APP CHART
            //newData = data; // + " :: " + new Date();

            /* Send new data to Consumer */
            //SASocket.sendData(SAAgent.channelIds[0], newData);
            //createHTML("Send message:<br />" + newData);
        };

        /* Set listener for incoming data from Consumer */
        SASocket.setDataReceiveListener(dataOnReceive);
    },
    onerror: function (errorCode) {
        createHTML("Service connection error<br />errorCode: " + errorCode);
    }
};

function send(toSend) {
	try {
		//debugger;
		//var toSend = "Healthy=" + chart.data.values('healthy')[0].toString() + ",Unhealthy=" + chart.data.values('unhealthy')[0].toString();
		SASocket.sendData(SAAgent.channelIds[0], toSend);
	} catch(err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
		createHTML("Unable to send.<br />errorCode: " + err);
	}
}

function requestOnSuccess (agents) {
    var i = 0;

    for (i; i < agents.length; i += 1) {
        if (agents[i].role === "PROVIDER") {
            createHTML("Service Provider found!<br />" +
                        "Name: " +  agents[i].name);
            SAAgent = agents[i];
            break;
        }
    }

    /* Set listener for upcoming connection from Consumer */
    SAAgent.setServiceConnectionListener(connectionListener);
};

function requestOnError (e) {
    createHTML("requestSAAgent Error" +
                "Error name : " + e.name + "<br />" +
                "Error message : " + e.message);
};


function setDefaultEvents() {
    //document.addEventListener('tizenhwkey', keyEventCB);
	window.addEventListener( 'tizenhwkey', function( ev ) {
		if( ev.keyName === "back" ) {
			var page = document.getElementsByClassName( 'ui-page-active' )[0],
				pageid = page ? page.id : "";
			if( pageid === "main" ) {
				try {
					tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				window.history.back();
			}
		}
	} );
}

function setToastListener () {
	var toastPopup = document.getElementById('toast');

    toastPopup.addEventListener('popupshow', function(ev){
        setTimeout(function () {
            tau.closePopup();
        }, 3000);
    }, false);
}

window.onload = function() {
	/* Requests the SAAgent specified in the Accessory Service Profile */
	webapis.sa.requestSAAgent(requestOnSuccess, requestOnError);

	setDefaultEvents();
	loadChart();
	setToastListener();
};

