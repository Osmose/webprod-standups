(function($, yam, config) {
    var STANDUP_TOPIC = 1723830;
    var WEBPROD_GROUP = 567707;

    // zomg global variables
    var references = {};

    yam.config({appId: config.appId});

    // Login!
    yam.getLoginStatus(function(response) {
        if (response.authResponse) {
            // User is logged in, init app
            init();
        } else {
            // User is not logged in, let's log them in!
            yam.login(function(response) {
                if (response.authResponse) {
                    init();
                } else {
                    alert('Sorry, you need to log into Yammer to use this!');
                }
            });
        }
    });

    function init() {
        yam.request({
            url: '/api/v1/messages/about_topic/' + STANDUP_TOPIC,
            method: 'GET',
            data: {
                threaded: true
            },
            success: function(response) {
                // Load up references.
                response.references.forEach(function(reference) {
                    references[reference.id] = reference;
                });

                processMessages(response.messages.filter(function(msg) {
                    return msg.group_id === WEBPROD_GROUP;
                }));
            }
        });
    }

    function processMessages(messages) {
        var $messages = $('#messages');
        var senders = {};

        for (var k = 0; k < messages.length; k++) {
            var msg = messages[k];
            var sender = references[msg.sender_id];

            // Check if we've already gotten a standup from this person.
            if (senders.hasOwnProperty(sender.id)) {
                continue;
            } else {
                senders[sender.id] = true;
            }

            $messages.append(ich.message({
                name: sender.full_name,
                mugshot_href: sender.mugshot_url,
                body: msg.body.rich
            }));
        }
    }
})(jQuery, yam, config);
