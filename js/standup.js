(function($, yam, config) {
    var STANDUP_TOPIC = 1723830;
    var WEBPROD_GROUP = 567707;

    // zomg global variables
    var references = {};
    var user_id = null;

    var converter = Markdown.getSanitizingConverter();

    yam.config({appId: config.appId});

    // Login!
    yam.getLoginStatus(function(response) {
        if (response.authResponse) {
            // User is logged in, init app
            user_id = response.access_token.user_id;
            init();
        } else {
            // User is not logged in, let's log them in!
            yam.login(function(response) {
                if (response.authResponse) {
                    user_id = response.access_token.user_id;
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

                var now = new Date();
                var today = now.setHours(0, 0, 0, 0);
                processMessages(response.messages.filter(function(msg) {
                    // Use setHours(0, 0, 0, 0) to compare the day portion of
                    // each date so that only standups for the current day are
                    // shown.
                    var msg_day = new Date(msg.created_at).setHours(0, 0, 0, 0);
                    return msg.group_id === WEBPROD_GROUP && msg_day == today;
                }));
            }
        });
    }

    function processMessages(messages) {
        var $messages = $('#messages');
        var senders = {};
        var my_standup = null;

        for (var k = 0; k < messages.length; k++) {
            var msg = messages[k];
            var sender = references[msg.sender_id];

            // Check if we've already gotten a standup from this person.
            if (senders.hasOwnProperty(sender.id)) {
                continue;
            } else if (sender.id === user_id) {
                // Only use most recent standup.
                if (my_standup === null) {
                    my_standup = msg;
                    $('#my-standup').empty().append(ich.message({
                        name: 'My Standup',
                        mugshot_href: sender.mugshot_url,
                        body: converter.makeHtml(msg.body.plain)
                    }));
                }
                continue;
            } else {
                senders[sender.id] = true;
            }

            $messages.append(ich.message({
                name: sender.full_name,
                mugshot_href: sender.mugshot_url,
                body: converter.makeHtml(msg.body.plain)
            }));
        }

        // Remove progress bar.
        $('#progress').fadeOut(500, function() {
            $('#app-container').fadeIn(500);
            $messages.masonry({
                itemSelector : '.message',
                columnWidth : 470
            });
        });
    }

    $(function() {
        var $my_standup = $('#my-standup');

        $('#standup-body').on('change keydown keyup', function(e) {
            $('#preview').empty().append(ich.message({
                name: 'My Standup',
                body: converter.makeHtml($(this).val())
            }));
        }).change();

        $('#standup-form').on('submit', function(e) {
            var standup = $('#standup-body').val();

            $('#post-button').attr('disabled', 'disabled');

            yam.request({
                url: '/api/v1/messages.json',
                method: 'POST',
                data: {
                    body: standup,
                    topic1: 'Standup',
                    group_id: WEBPROD_GROUP
                },
                success: function(response) {
                    var msg = response.messages[0];
                    var sender = references[msg.sender_id];

                    $my_standup.fadeOut(500, function() {
                        $my_standup.empty().append(ich.message({
                            name: 'My Standup',
                            mugshot_href: sender.mugshot_url,
                            body: converter.makeHtml(msg.body.plain)
                        })).fadeIn(500);
                    });
                }
            });

            e.preventDefault();
        });
    });
})(jQuery, yam, config);
