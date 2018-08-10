var CustomElement = require('generate-js-custom-element'),
    bala          = require('balajs'),
    serialize     = require('../utils/serialize'),
    ajax          = require('../utils/ajax'),
    MailChimp     = require('../utils/mailchimp'),
    loadExternal = require('load-external'),
    GMAPS_INCLUDED;

function getName(name) {
    return name.replace(/\[|\]/g, '.').replace(/\.$/, '');
}

function includeGmaps(apiKey, done) {
    if (GMAPS_INCLUDED) return done();
    if (!apiKey)        return done();

    GMAPS_INCLUDED = true;

    loadExternal('https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&libraries=places', done);
}

function easeInOutQuad(t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t + b;
    t--;
    return -c/2 * (t*(t-2) - 1) + b;
}

var ChatBot = CustomElement.createElement({
    template: require('./index.html'),
    transforms: {
        next: function next(chatbot, message) {
            return function onNextMultiple(e) {
                e.preventDefault();

                var attr = chatbot.get('io.input.name'),
                    response = message.response || chatbot.get('io.response'),
                    value = typeof message.input === 'object' && message.input.type === 'multiple' ? message.input.buffer.join(', ') : message.text;

                if (attr) {
                    chatbot.updateUser(attr, value);
                }

                chatbot.setQuiet('io', undefined);
                chatbot.addMessage({ text: value, from: 'user' }, 0, 0);

                if (response) {
                    chatbot.addMessage(response);
                } else {
                    chatbot.complete();
                }
            };
        },

        toggleBuffer: function toggleBuffer(chatbot, newMsg) {
            return function onToggleBuffer(e) {
                e.preventDefault();

                var buffer = chatbot.get('io.input.buffer') || [],
                    index = buffer.indexOf(newMsg);

                if (index !== -1) {
                    buffer.splice(index, 1);
                } else {
                    buffer.push(newMsg);
                }

                chatbot.set('io.input.buffer', buffer);
            };
        },

        submit: function submit(chatbot, message) {
            return function onSubmit(e) {
                e.preventDefault();

                var data = serialize(e.target),
                    attr = getName(chatbot.get('io.input.name')),
                    response = message.response || chatbot.get('io.response'),
                    attrVal = chatbot.get(attr, data);

                if (!attrVal || !attrVal.length) {
                    return;
                }

                chatbot.updateUser(data);
                chatbot.get('tree').push({ text: attrVal, from: 'user' });
                chatbot.unset('io');

                if (response) {
                    chatbot.addMessage(response);
                } else {
                    chatbot.complete();
                }
            };
        },

        reset: function reset(chatbot, message) {
            return function onReset(e) {
                var tree = chatbot.get('tree'),
                    index = tree.indexOf(message);

                tree.splice(index, tree.length - index);

                chatbot.set('io', tree[index - 1]);
                chatbot.prepGeocodeFields();
                chatbot.focusIO();
            };
        },

        include: function include(haystack, needle) {
            return (haystack || '').indexOf(needle) !== -1;
        },
    },
    partials: {
        message: require('../message/index.html'),
        io: require('../io/index.html')
    },
    components: {}
}, function ChatBot(options) {
    var _ = this;

    options = options || {};
    options.data = options || {};
    options.chatbot = _;
    options.user = {};
    options.tree = [];
    options.delay = 700;
    options.defaults = options.defaults || {};

    CustomElement.call(_, options);

    _.element.className = 'chatbot';
    _.addMessage(options.schema, 0);

    if (_.get('ioConfig.gmaps.apiKey')) {
        includeGmaps(_.get('ioConfig.gmaps.apiKey'));
    }

    window.addEventListener('beforeunload', function(e) {
        if (typeof _.get('onLeave') === 'function') {
            _.get('onLeave').call(_);
        }
    });
});

ChatBot.definePrototype({
    addMessage: function addMessage(message, typingDelay, messageDelay) {
        var _ = this;

        typingDelay  = typeof  typingDelay === 'undefined' ? _.get('delay') : typingDelay;
        messageDelay = typeof messageDelay === 'undefined' ? _.get('delay') : messageDelay;

        setTimeout(function() {
            _.set('agentIsTyping', _.get('defaults.agentIsTyping') || true);

            setTimeout(function() {
                _.get('tree').push(message);

                if (message.input) {
                    _.set('io', message);
                    _.prepGeocodeFields();
                    _.focusIO();
                }

                if (message.delayed) {
                    _.setQuiet('agentIsTyping', undefined);
                    _.addMessage(message.delayed);
                } else {
                    _.unset('agentIsTyping');

                    if (message.from !== 'user') {
                        _.scrollToBottom();
                    }
                }

            }, messageDelay);
        }, typingDelay);
    },

    prepGeocodeFields: function prepGeocodeFields() {
        var _ = this;

        setTimeout(function() {
            var el = bala('io input[type=location]', _.element)[0];

            if (!el) return;
            if (el.gmaps) return;

            el.gmaps = new window.google.maps.places.Autocomplete(
                el,
                {
                    types: ['geocode']
                }
            );
        }, 0);
    },

    scrollToBottom: function scrollToBottom() {
        setTimeout(function() {
            var el = document.body,
                start = window.scrollY,
                change = el.scrollHeight - start,
                currentTime = 0,
                increment = 20,
                duration = 500;

            function animateScroll() {
                currentTime += increment;

                window.scrollTo(0, easeInOutQuad(currentTime, start, change, duration));

                if (currentTime < duration) {
                    setTimeout(animateScroll, increment);
                }
            }

            animateScroll();
        }, 0);
    },

    focusIO: function focusIO() {
        var _ = this;

        setTimeout(function() {
            var $input = bala('io input, io a', _.element);

            if ($input.length) {
                $input[0].focus();
            }
        }, 0);
    },

    updateUser: function updateUser(key, value) {
        var _ = this,
            user = _.get('user');

        if (typeof key === 'object') {
            for (var item in key) {
                user[item] = key[item];
            }
        } else {
            user[key] = value;
        }

        return user;
    },

    complete: function complete() {
        var _ = this,
            onComplete = _.get('onComplete');

        if (typeof onComplete === 'function') {
            onComplete.call(_);
        }
    },

    setQuiet: function setQuiet(key, value) {
        var _ = this;

        _._data[key] = value;
    },
});

ChatBot.ajax = ajax;
ChatBot.MailChimp = MailChimp;

module.exports = ChatBot;
